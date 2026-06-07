'use strict';

/**
 * Tests for the defensive retry helpers in tools.js (withRetry, isBadGatewayError).
 */

const { describe, it } = require('node:test');
const assert = require('assert');
const tools = require('../library/tools');

describe('tools.isBadGatewayError()', function () {
    it('returns true only for HTTP 502 responses', function () {
        assert.strictEqual(tools.isBadGatewayError({ response: { status: 502 } }), true);
        assert.strictEqual(tools.isBadGatewayError({ response: { status: 500 } }), false);
        assert.strictEqual(tools.isBadGatewayError({ response: { status: 503 } }), false);
        assert.strictEqual(tools.isBadGatewayError(new Error('boom')), false);
        assert.strictEqual(tools.isBadGatewayError(null), false);
    });
});

describe('tools.withRetry()', function () {
    // Use zero backoff so the tests don't actually wait.
    const noBackoff = { backoffMs: [0, 0, 0] };

    it('returns the result on first success without retrying', async function () {
        let calls = 0;
        const result = await tools.withRetry(async () => {
            calls++;
            return 'ok';
        }, { ...noBackoff, retryOn: ({ error }) => Boolean(error) });
        assert.strictEqual(result, 'ok');
        assert.strictEqual(calls, 1);
    });

    it('retries on an error matched by retryOn and eventually succeeds', async function () {
        let calls = 0;
        const result = await tools.withRetry(async () => {
            calls++;
            if (calls < 2) {
                const err = new Error('bad gateway');
                err.response = { status: 502 };
                throw err;
            }
            return 'recovered';
        }, { ...noBackoff, retryOn: ({ error }) => tools.isBadGatewayError(error) });
        assert.strictEqual(result, 'recovered');
        assert.strictEqual(calls, 2);
    });

    it('does not retry an error that retryOn rejects', async function () {
        let calls = 0;
        await assert.rejects(
            tools.withRetry(async () => {
                calls++;
                throw new Error('fatal');
            }, { ...noBackoff, retryOn: () => false }),
            /fatal/
        );
        assert.strictEqual(calls, 1);
    });

    it('throws the last error after exhausting retries', async function () {
        let calls = 0;
        await assert.rejects(
            tools.withRetry(async () => {
                calls++;
                const err = new Error('still 502');
                err.response = { status: 502 };
                throw err;
            }, { ...noBackoff, retries: 3, retryOn: ({ error }) => tools.isBadGatewayError(error) }),
            /still 502/
        );
        assert.strictEqual(calls, 3);
    });

    it('supports result-based retry conditions and returns the last result when exhausted', async function () {
        let calls = 0;
        const result = await tools.withRetry(async () => {
            calls++;
            return { data: { result: 'fail', error: 'set token error.' } };
        }, {
            ...noBackoff,
            retries: 3,
            retryOn: ({ result }) => result && result.data && result.data.error === 'set token error.'
        });
        assert.strictEqual(calls, 3);
        assert.strictEqual(result.data.error, 'set token error.');
    });

    it('stops result-based retries as soon as the condition clears', async function () {
        let calls = 0;
        const result = await tools.withRetry(async () => {
            calls++;
            if (calls < 2) {
                return { data: { result: 'fail', error: 'set token error.' } };
            }
            return { data: { result: 'ok' } };
        }, {
            ...noBackoff,
            retryOn: ({ result }) => result && result.data && result.data.error === 'set token error.'
        });
        assert.strictEqual(calls, 2);
        assert.strictEqual(result.data.result, 'ok');
    });
});
