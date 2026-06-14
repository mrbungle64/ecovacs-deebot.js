'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');

const EcovacsDevice = require('../library/ecovacsDevice');

// Build a minimal device whose prototype is EcovacsDevice (so disconnect()/
// disconnectAsync() resolve), without constructing a real network session.
function makeFakeDevice(sessionDisconnect) {
    const device = Object.create(EcovacsDevice.prototype);
    device.is_ready = true;
    device.ecovacs = { disconnect: sessionDisconnect };
    return device;
}

// Regression for #23: disconnect() used to be a fire-and-forget sync wrapper.
// It is now an awaitable Promise that is fire-and-forget SAFE (never rejects —
// errors are caught/logged), while disconnectAsync() propagates errors for
// callers that want to handle them. Both always clear is_ready.
describe('EcovacsDevice.disconnect() / disconnectAsync()', function () {
    it('disconnect() returns a Promise, awaits the session, and clears is_ready', async function () {
        let called = false;
        const device = makeFakeDevice(async () => { called = true; });

        const ret = device.disconnect();
        assert.ok(ret instanceof Promise, 'disconnect() should return a Promise');
        await ret;

        assert.strictEqual(called, true, 'should await the underlying session disconnect');
        assert.strictEqual(device.is_ready, false, 'should clear is_ready');
    });

    it('disconnect() never rejects (errors caught/logged) but still clears is_ready', async function () {
        const device = makeFakeDevice(async () => { throw new Error('boom'); });

        await assert.doesNotReject(
            () => device.disconnect(),
            'disconnect() is fire-and-forget safe and must not reject'
        );
        assert.strictEqual(device.is_ready, false, 'is_ready should be cleared even on failure');
    });

    it('disconnectAsync() propagates errors to the caller but still clears is_ready', async function () {
        const device = makeFakeDevice(async () => { throw new Error('boom'); });

        await assert.rejects(
            () => device.disconnectAsync(),
            /boom/,
            'disconnectAsync() should reject so callers can handle the failure'
        );
        assert.strictEqual(device.is_ready, false, 'is_ready should be cleared even on failure');
    });

    it('disconnectAsync() resolves and clears is_ready on success', async function () {
        let called = false;
        const device = makeFakeDevice(async () => { called = true; });

        await device.disconnectAsync();

        assert.strictEqual(called, true);
        assert.strictEqual(device.is_ready, false);
    });
});
