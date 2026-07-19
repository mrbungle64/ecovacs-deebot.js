'use strict';

/**
 * Tests for the optional MQTT endpoint overrides threaded through
 * EcovacsDeviceSession (constructor options + connect() URL scheme).
 *
 * These options exist so a local/integration test can point a session at an
 * in-process broker (e.g. aedes) over plain `mqtt://` instead of the
 * production `mqtts://` endpoint. Defaults must preserve current behavior.
 */

const { describe, it } = require('node:test');
const assert = require('assert');
const Ecovacs = require('../library/ecovacsDeviceSession');

const mockBot = { is950type: () => true, authDomain: 'ecovacs' };
const mockVacuum = { did: 'did1', class: 'yna5xi', resource: 'devres' };

/** Construct a session and capture the URL connect() hands to mqtt.connect(). */
function urlFromConnect(ecovacs) {
    let captured;
    ecovacs.mqtt = {
        connect: (url) => {
            captured = url;
            // Return a no-op client so connect()'s listener bookkeeping is happy.
            return { on: () => { }, end: () => { } };
        }
    };
    ecovacs.connect();
    return captured;
}

/** Capture the options object connect() hands to mqtt.connect(). */
function optionsFromConnect(ecovacs) {
    let captured;
    ecovacs.mqtt = {
        connect: (url, options) => {
            captured = options;
            return { on: () => { }, end: () => { } };
        }
    };
    ecovacs.connect();
    return captured;
}

describe('EcovacsDeviceSession endpoint overrides', function () {
    it('defaults to the derived endpoint, port 8883 and mqtts (current behavior)', function () {
        const ecovacs = new Ecovacs(mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum);
        assert.strictEqual(ecovacs.serverPort, 8883);
        assert.strictEqual(ecovacs.protocol, 'mqtts');
        // No explicit address → derived from continent/realm.
        assert.strictEqual(ecovacs.serverAddress, ecovacs.getEcovacsEndpoint());
        assert.ok(urlFromConnect(ecovacs).startsWith('mqtts://'));
    });

    it('honors a positional serverAddress with default port/scheme', function () {
        const ecovacs = new Ecovacs(mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum, 'mq-prod.example');
        assert.strictEqual(ecovacs.serverAddress, 'mq-prod.example');
        assert.strictEqual(urlFromConnect(ecovacs), 'mqtts://mq-prod.example:8883');
    });

    it('applies options.serverAddress / serverPort / protocol for a local broker', function () {
        const ecovacs = new Ecovacs(
            mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum,
            undefined, undefined,
            { serverAddress: '127.0.0.1', serverPort: 1883, protocol: 'mqtt' }
        );
        assert.strictEqual(ecovacs.serverAddress, '127.0.0.1');
        assert.strictEqual(ecovacs.serverPort, 1883);
        assert.strictEqual(ecovacs.protocol, 'mqtt');
        assert.strictEqual(urlFromConnect(ecovacs), 'mqtt://127.0.0.1:1883');
    });

    it('options.serverAddress overrides the positional serverAddress', function () {
        const ecovacs = new Ecovacs(
            mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum,
            'positional.example', undefined,
            { serverAddress: 'override.example' }
        );
        assert.strictEqual(ecovacs.serverAddress, 'override.example');
    });

    it('ignores an unknown protocol value and keeps mqtts', function () {
        const ecovacs = new Ecovacs(
            mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum,
            undefined, undefined,
            { protocol: 'ws' }
        );
        assert.strictEqual(ecovacs.protocol, 'mqtts');
    });

    it('accepts serverPort 0 from options (not treated as unset)', function () {
        const ecovacs = new Ecovacs(
            mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum,
            undefined, undefined,
            { serverPort: 0 }
        );
        assert.strictEqual(ecovacs.serverPort, 0);
    });

    it('does NOT verify the broker TLS certificate by default (rejectUnauthorized: false)', function () {
        // The Ecovacs cloud broker uses a private CA that is not publicly
        // verifiable, so verification is off unless explicitly opted in.
        const ecovacs = new Ecovacs(mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum);
        assert.strictEqual(ecovacs.rejectUnauthorized, false);
        assert.strictEqual(optionsFromConnect(ecovacs).rejectUnauthorized, false);
    });

    it('allows opting in to TLS verification via options.rejectUnauthorized=true', function () {
        const ecovacs = new Ecovacs(
            mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum,
            undefined, undefined,
            { rejectUnauthorized: true }
        );
        assert.strictEqual(ecovacs.rejectUnauthorized, true);
        assert.strictEqual(optionsFromConnect(ecovacs).rejectUnauthorized, true);
    });

    it('only a strict true enables verification (falsy/omitted/truthy-non-boolean stay unverified)', function () {
        const omitted = new Ecovacs(mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum, undefined, undefined, {});
        assert.strictEqual(omitted.rejectUnauthorized, false);
        // A non-boolean truthy value must not be mistaken for an opt-in.
        const truthy = new Ecovacs(mockBot, 'user', 'host.name', 'resource', 'secret', 'eu', 'DE', mockVacuum, undefined, undefined, { rejectUnauthorized: 1 });
        assert.strictEqual(truthy.rejectUnauthorized, false);
    });
});
