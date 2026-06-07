'use strict';

/**
 * Tests for the MQTT client listener lifecycle on Ecovacs:
 *  - _attachClientListeners() registers exactly one handler per event and does
 *    not accumulate handlers when called again (reconnect / token refresh).
 *  - _detachClientListeners() / disconnect() remove this instance's handlers.
 *  - On a shared client several bots each keep their own listeners, messages are
 *    routed by `did`, and disconnecting one bot leaves the others intact.
 */

const { describe, it } = require('node:test');
const assert = require('assert');
const { EventEmitter } = require('events');
const Ecovacs = require('../library/ecovacsDeviceSession');

const MQTT_EVENTS = ['message', 'connect', 'offline', 'disconnect', 'error'];

/** Build a bare Ecovacs instance (no real MQTT) with EventEmitter wired. */
function makeEcovacs(props = {}) {
    const ecovacs = Object.create(Ecovacs.prototype);
    EventEmitter.call(ecovacs);
    Object.assign(ecovacs, EventEmitter.prototype);
    Object.assign(ecovacs, {
        vacuum: { did: 'did1', class: 'yna5xi', resource: 'devres' },
        subscribe: () => { },
    }, props);
    return ecovacs;
}

describe('Ecovacs MQTT listener lifecycle', function () {
    it('attaches one handler per event and does not accumulate on re-attach', function () {
        const client = new EventEmitter();
        const ecovacs = makeEcovacs({ client });

        ecovacs._attachClientListeners();
        for (const ev of MQTT_EVENTS) {
            assert.strictEqual(client.listenerCount(ev), 1, `after attach: ${ev}`);
        }

        // Simulate a reconnect / token refresh re-attaching on the same client.
        ecovacs._attachClientListeners();
        for (const ev of MQTT_EVENTS) {
            assert.strictEqual(client.listenerCount(ev), 1, `after re-attach: ${ev}`);
        }
    });

    it('detaches its own handlers', function () {
        const client = new EventEmitter();
        const ecovacs = makeEcovacs({ client });
        ecovacs._attachClientListeners();
        ecovacs._detachClientListeners();
        for (const ev of MQTT_EVENTS) {
            assert.strictEqual(client.listenerCount(ev), 0, ev);
        }
    });

    it('routes only matching-did messages', function () {
        const handled = [];
        const client = new EventEmitter();
        const ecovacs = makeEcovacs({ client });
        ecovacs._parseMqttMessage = () => ({ ok: true });
        ecovacs.handleMessage = (eventName) => handled.push(eventName);
        ecovacs._attachClientListeners();

        client.emit('message', 'iot/atr/onBattery/did1/yna5xi/devres/j', Buffer.from('{}'));
        client.emit('message', 'iot/atr/onBattery/otherDid/yna5xi/devres/j', Buffer.from('{}'));

        assert.deepStrictEqual(handled, ['onBattery']);
    });

    it('does not ratchet the shared-client max-listener cap across re-attach / detach', function () {
        const client = new EventEmitter();
        const baseline = client.getMaxListeners();
        const ecovacs = makeEcovacs({ client, _sharedClient: true });
        const bump = 5; // message, connect, offline, disconnect, error

        ecovacs._attachClientListeners();
        assert.strictEqual(client.getMaxListeners(), baseline + bump, 'cap raised once on attach');

        // Re-attach (reconnect / token refresh) must not stack the bump.
        ecovacs._attachClientListeners();
        assert.strictEqual(client.getMaxListeners(), baseline + bump, 'cap not ratcheted on re-attach');

        ecovacs._detachClientListeners();
        assert.strictEqual(client.getMaxListeners(), baseline, 'cap restored on detach');
    });

    it('shared cap reflects only currently-attached bots', async function () {
        const client = new EventEmitter();
        client.connected = true;
        client.unsubscribe = (channel, cb) => cb();
        const baseline = client.getMaxListeners();

        const botA = makeEcovacs({
            vacuum: { did: 'didA', class: 'c', resource: 'r' },
            client, _sharedClient: true, channel: 'chA',
            pendingCommands: { rejectAll: () => { } }
        });
        const botB = makeEcovacs({
            vacuum: { did: 'didB', class: 'c', resource: 'r' },
            client, _sharedClient: true, channel: 'chB',
            pendingCommands: { rejectAll: () => { } }
        });

        botA._attachClientListeners();
        botB._attachClientListeners();
        assert.strictEqual(client.getMaxListeners(), baseline + 10, 'two bots -> +10');

        await botA.disconnect();
        assert.strictEqual(client.getMaxListeners(), baseline + 5, 'one bot left -> +5');
    });

    it('shared client: each bot keeps its own listeners; disconnect removes only its own', async function () {
        const client = new EventEmitter();
        client.connected = true;
        client.unsubscribe = (channel, cb) => cb();

        const botA = makeEcovacs({
            vacuum: { did: 'didA', class: 'c', resource: 'r' },
            client, _sharedClient: true, channel: 'chA',
            pendingCommands: { rejectAll: () => { } }
        });
        const botB = makeEcovacs({
            vacuum: { did: 'didB', class: 'c', resource: 'r' },
            client, _sharedClient: true, channel: 'chB',
            pendingCommands: { rejectAll: () => { } }
        });

        botA._attachClientListeners();
        botB._attachClientListeners();
        assert.strictEqual(client.listenerCount('message'), 2);

        await botA.disconnect();
        assert.strictEqual(client.listenerCount('message'), 1, 'botA listener removed');

        // botB still routes its own messages after botA disconnected.
        const handled = [];
        botB._parseMqttMessage = () => ({ ok: true });
        botB.handleMessage = (eventName) => handled.push(eventName);
        client.emit('message', 'iot/atr/onClean/didB/c/r/j', Buffer.from('{}'));
        assert.deepStrictEqual(handled, ['onClean']);
    });
});
