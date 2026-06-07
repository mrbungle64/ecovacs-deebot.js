'use strict';

/**
 * Tests for the Ecovacs transport additions:
 *  - updateToken() / reconnect behaviour (owned vs shared client)
 *  - _emitAvailability() edge-triggering
 *  - sendCommand() emitting Availability on errno 4200 and on recovery
 */

const { describe, it } = require('node:test');
const assert = require('assert');
const axios = require('axios').default;
const Ecovacs = require('../library/ecovacs');
const constants = require('../library/constants');

/** Build a bare Ecovacs instance (no real MQTT) with EventEmitter wired. */
function makeEcovacs(props = {}) {
    const ecovacs = Object.create(Ecovacs.prototype);
    require('events').EventEmitter.call(ecovacs);
    Object.assign(ecovacs, require('events').EventEmitter.prototype);
    Object.assign(ecovacs, props);
    return ecovacs;
}

describe('Ecovacs.updateToken()', function () {
    it('updates the secret and reconnects an owned, connected client', function () {
        let ended = 0;
        let reconnected = 0;
        const ecovacs = makeEcovacs({
            secret: 'old',
            _sharedClient: false,
            client: { connected: true, end: (force, cb) => { ended++; cb(); } },
            connect: () => { reconnected++; }
        });
        ecovacs.updateToken('new');
        assert.strictEqual(ecovacs.secret, 'new');
        assert.strictEqual(ended, 1);
        assert.strictEqual(reconnected, 1);
    });

    it('reconnects an owned client even when it is currently offline', function () {
        let ended = 0;
        let reconnected = 0;
        const ecovacs = makeEcovacs({
            secret: 'old',
            _sharedClient: false,
            // connected === false simulates an in-progress reconnect / offline state
            client: { connected: false, end: (force, cb) => { ended++; cb(); } },
            connect: () => { reconnected++; }
        });
        ecovacs.updateToken('new');
        assert.strictEqual(ecovacs.secret, 'new');
        assert.strictEqual(ended, 1);
        assert.strictEqual(reconnected, 1);
    });

    it('updates the secret but does NOT reconnect a shared client', function () {
        let ended = 0;
        const ecovacs = makeEcovacs({
            secret: 'old',
            _sharedClient: true,
            client: { connected: true, end: () => { ended++; } }
        });
        ecovacs.updateToken('new');
        assert.strictEqual(ecovacs.secret, 'new');
        assert.strictEqual(ended, 0);
    });

    it('does nothing when the token is unchanged', function () {
        let ended = 0;
        const ecovacs = makeEcovacs({
            secret: 'same',
            _sharedClient: false,
            client: { connected: true, end: () => { ended++; } }
        });
        ecovacs.updateToken('same');
        assert.strictEqual(ended, 0);
    });

    it('updates the secret without reconnecting when no client exists yet', function () {
        let reconnected = 0;
        const ecovacs = makeEcovacs({
            secret: 'old', _sharedClient: false, client: null,
            connect: () => { reconnected++; }
        });
        ecovacs.updateToken('new');
        assert.strictEqual(ecovacs.secret, 'new');
        assert.strictEqual(reconnected, 0);
    });
});

describe('Ecovacs._emitAvailability()', function () {
    it('emits only on state changes (edge-triggered)', function () {
        const events = [];
        const ecovacs = makeEcovacs();
        ecovacs.emitMessage = (name, payload) => events.push({ name, payload });

        ecovacs._emitAvailability(true);   // undefined -> true: emit
        ecovacs._emitAvailability(true);   // no change: skip
        ecovacs._emitAvailability(false);  // true -> false: emit
        ecovacs._emitAvailability(false);  // no change: skip
        ecovacs._emitAvailability(true);   // false -> true: emit

        assert.deepStrictEqual(events.map((e) => e.payload.available), [true, false, true]);
        assert.ok(events.every((e) => e.name === 'Availability'));
    });
});

describe('Ecovacs.sendCommand() availability signalling', function () {
    function makeSendable(postImpl) {
        const original = axios.post;
        axios.post = postImpl;
        const events = [];
        const ecovacs = makeEcovacs({
            country: 'DE',
            continent: 'eu',
            resource: 'res12345',
            secret: 'token',
            user: 'uid',
            payloadType: 'j',
            vacuum: { did: 'did1', resource: 'devres', class: 'yna5xi' },
            pendingCommands: { size: 0 },
            bot: {
                is950type: () => true,
                handleResponseError: () => { },
                errorCode: '0',
                errorDescription: ''
            }
        });
        ecovacs.emitMessage = (name, payload) => events.push({ name, payload });
        ecovacs.emit = () => true; // swallow Error/LastError emits
        return { ecovacs, events, restore: () => { axios.post = original; } };
    }

    const command = { name: 'GetBattery', args: { id: '1' }, api: constants.IOT_DEVMANAGER_PATH };

    it('emits Availability {available:false} on errno 4200', async function () {
        const { ecovacs, events, restore } = makeSendable(
            async () => ({ data: { errno: 4200, error: 'bot offline' } })
        );
        try {
            await ecovacs.sendCommand(command);
        } finally {
            restore();
        }
        const availability = events.filter((e) => e.name === 'Availability');
        assert.strictEqual(availability.length, 1);
        assert.strictEqual(availability[0].payload.available, false);
    });

    it('emits Availability {available:true} once a command succeeds again', async function () {
        let call = 0;
        const { ecovacs, events, restore } = makeSendable(async () => {
            call++;
            return call === 1
                ? { data: { errno: 4200, error: 'bot offline' } }
                : { data: { result: 'ok' } };
        });
        try {
            await ecovacs.sendCommand(command); // -> false
            await ecovacs.sendCommand(command); // -> true
        } finally {
            restore();
        }
        const availability = events.filter((e) => e.name === 'Availability').map((e) => e.payload.available);
        assert.deepStrictEqual(availability, [false, true]);
    });
});
