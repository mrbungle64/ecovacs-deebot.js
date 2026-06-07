'use strict';

/**
 * Tests for PendingCommandRegistry resolution strategies, focused on the
 * id-preferring behaviour of resolveByEvent():
 *  - with a preferredId, the exact command is resolved (not the oldest);
 *  - without one (or when it is not pending), it falls back to the oldest match;
 *  - resolveById() still works and parseResponse() normalisation is applied.
 */

const { describe, it } = require('node:test');
const assert = require('assert');
const PendingCommandRegistry = require('../library/managers/pendingCommandRegistry');

/** Register a pending command and return its settled-Promise + resolved value capture. */
function register(reg, id, event, parseResponse) {
    let resolved;
    let rejected;
    const commandInstance = parseResponse ? { parseResponse } : {};
    const promise = new Promise((resolve, reject) => {
        reg.register(id, `cmd-${id}`, event, commandInstance,
            (v) => { resolved = v; resolve(v); },
            (e) => { rejected = e; reject(e); },
            10000);
    });
    // Swallow rejections from any cleanup so leftover entries don't surface as
    // unhandled rejections; assertions read the captured `resolved`/`rejected`.
    promise.catch(() => { });
    return { promise, get resolved() { return resolved; }, get rejected() { return rejected; } };
}

/** Reject and clear any entries left pending by a test (also clears their timers). */
function cleanup(reg) {
    reg.rejectAll(new Error('test cleanup'));
}

describe('PendingCommandRegistry.resolveByEvent()', function () {
    it('resolves the exact command by preferredId, not the oldest', async function () {
        const reg = new PendingCommandRegistry();
        const a = register(reg, 'idA', 'BatteryInfo');
        const b = register(reg, 'idB', 'BatteryInfo');

        // Response for the *second* command arrives first; preferredId must win.
        assert.strictEqual(reg.resolveByEvent('BatteryInfo', { v: 'B' }, 'idB'), true);
        await b.promise;
        assert.deepStrictEqual(b.resolved, { v: 'B' });
        assert.strictEqual(a.resolved, undefined, 'idA not resolved by idB response');
        assert.strictEqual(reg.size, 1, 'idA still pending');

        assert.strictEqual(reg.resolveByEvent('BatteryInfo', { v: 'A' }, 'idA'), true);
        await a.promise;
        assert.deepStrictEqual(a.resolved, { v: 'A' });
        assert.strictEqual(reg.size, 0);
    });

    it('falls back to the oldest match when no preferredId is given', async function () {
        const reg = new PendingCommandRegistry();
        const a = register(reg, 'idA', 'BatteryInfo');
        const b = register(reg, 'idB', 'BatteryInfo');

        reg.resolveByEvent('BatteryInfo', { v: 'first' });
        await a.promise;
        assert.deepStrictEqual(a.resolved, { v: 'first' }, 'oldest (idA) resolved');
        assert.strictEqual(b.resolved, undefined, 'idB untouched');
        assert.strictEqual(reg.size, 1);
        cleanup(reg);
    });

    it('falls back to oldest when preferredId is not pending', async function () {
        const reg = new PendingCommandRegistry();
        const a = register(reg, 'idA', 'BatteryInfo');

        reg.resolveByEvent('BatteryInfo', { v: 'x' }, 'idUnknown');
        await a.promise;
        assert.deepStrictEqual(a.resolved, { v: 'x' });
        assert.strictEqual(reg.size, 0);
    });

    it('does not resolve when preferredId is pending but for a different event', async function () {
        const reg = new PendingCommandRegistry();
        register(reg, 'idA', 'BatteryInfo');
        // preferredId points at idA (BatteryInfo) but the event is ChargeState:
        // no fallback match exists, so nothing resolves.
        assert.strictEqual(reg.resolveByEvent('ChargeState', {}, 'idA'), false);
        assert.strictEqual(reg.size, 1);
        cleanup(reg);
    });

    it('applies parseResponse() normalisation', async function () {
        const reg = new PendingCommandRegistry();
        const a = register(reg, 'idA', 'BatteryInfo', (raw) => ({ level: raw.value * 2 }));
        reg.resolveByEvent('BatteryInfo', { value: 21 }, 'idA');
        await a.promise;
        assert.deepStrictEqual(a.resolved, { level: 42 });
    });
});

describe('PendingCommandRegistry.resolveById()', function () {
    it('resolves the matching id and returns true; false for unknown id', async function () {
        const reg = new PendingCommandRegistry();
        const a = register(reg, 'idA', 'BatteryInfo');
        assert.strictEqual(reg.resolveById('nope', {}), false);
        assert.strictEqual(reg.resolveById('idA', { ok: true }), true);
        await a.promise;
        assert.deepStrictEqual(a.resolved, { ok: true });
        assert.strictEqual(reg.size, 0);
    });
});
