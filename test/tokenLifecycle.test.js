'use strict';

/**
 * Tests for the token-lifecycle additions on EcovacsAPI:
 *  - expiry tracking + getCredentials()
 *  - 'credentialsUpdated' event on (re-)login
 *  - 'set token error' retry in callPortalApi
 *  - auto-refresh scheduling (enable/disable + clamp)
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const axios = require('axios').default;
const { EcovacsAPI } = require('../index.js');

/** Stub the three connect() HTTP calls (2x GET, 1x POST). */
function stubConnect({ last } = {}) {
    let getCallCount = 0;
    axios.get = async () => {
        getCallCount++;
        if (getCallCount === 1) {
            return { data: { code: '0000', data: { uid: 'mock_uid', accessToken: 'mock_access_token' } } };
        }
        return { data: { code: '0000', data: { authCode: 'mock_auth_code' } } };
    };
    axios.post = async () => {
        const data = { result: 'ok', token: 'mock_user_access_token', userId: 'mock_user_id' };
        if (last !== undefined) {
            data.last = last;
        }
        return { data };
    };
}

describe('EcovacsAPI token lifecycle', function () {
    let originalGet;
    let originalPost;

    beforeEach(() => {
        originalGet = axios.get;
        originalPost = axios.post;
    });

    afterEach(() => {
        axios.get = originalGet;
        axios.post = originalPost;
    });

    it('tracks token expiry from the `last` field (at 99% of validity)', async function () {
        stubConnect({ last: 1000000 });
        const api = new EcovacsAPI('deviceId123', 'de');
        const before = Date.now();
        await api.connect('user@example.com', 'hash');
        const expiry = api.getTokenExpiry();
        // ~99% of 1_000_000 ms in the future
        assert.ok(expiry >= before + 980000, `expiry too small: ${expiry - before}`);
        assert.ok(expiry <= Date.now() + 990000, `expiry too large: ${expiry - Date.now()}`);
    });

    it('falls back to the 7-day default validity when `last` is missing', async function () {
        stubConnect();
        const api = new EcovacsAPI('deviceId123', 'de');
        const before = Date.now();
        await api.connect('user@example.com', 'hash');
        const sevenDays = 604800000;
        assert.ok(api.getTokenExpiry() >= before + Math.floor(sevenDays * 0.99) - 1000);
    });

    it('getCredentials() returns userId, token and expiresAt', async function () {
        stubConnect({ last: 500000 });
        const api = new EcovacsAPI('deviceId123', 'de');
        await api.connect('user@example.com', 'hash');
        const creds = api.getCredentials();
        assert.strictEqual(creds.userId, 'mock_user_id');
        assert.strictEqual(creds.token, 'mock_user_access_token');
        assert.strictEqual(typeof creds.expiresAt, 'number');
    });

    it("emits 'credentialsUpdated' after a successful login", async function () {
        stubConnect({ last: 500000 });
        const api = new EcovacsAPI('deviceId123', 'de');
        let received = null;
        api.on('credentialsUpdated', (c) => { received = c; });
        await api.connect('user@example.com', 'hash');
        assert.ok(received, "expected 'credentialsUpdated' to fire");
        assert.strictEqual(received.token, 'mock_user_access_token');
    });

    it("retries callPortalApi once on a transient 'set token error'", async function () {
        const api = new EcovacsAPI('deviceId123', 'de');
        api.uid = 'user_id';
        api.user_access_token = 'token';
        let postCalls = 0;
        axios.post = async () => {
            postCalls++;
            if (postCalls === 1) {
                return { data: { result: 'fail', error: 'set token error.' } };
            }
            return { data: { result: 'ok', data: 'success' } };
        };
        const resp = await api.callPortalApi('path', 'func', {});
        assert.strictEqual(postCalls, 2);
        assert.strictEqual(resp.result, 'ok');
    });
});

describe('EcovacsAPI auto token refresh scheduling', function () {
    it('enable schedules a timer and disable clears it', function () {
        const api = new EcovacsAPI('deviceId123', 'de');
        api.tokenExpiresAt = Date.now() + 3600000;
        api.enableAutoTokenRefresh('user', 'hash');
        assert.ok(api._autoRefresh, 'expected _autoRefresh to be set');
        assert.ok(api._refreshTimer, 'expected a scheduled refresh timer');
        api.disableAutoTokenRefresh();
        assert.strictEqual(api._autoRefresh, null);
        assert.strictEqual(api._refreshTimer, null);
    });

    it('clamps the refresh delay to a minimum of 60s for an already-expired token', function () {
        const api = new EcovacsAPI('deviceId123', 'de');
        api.tokenExpiresAt = Date.now() - 1000; // already past
        const originalSetTimeout = global.setTimeout;
        let capturedDelay = null;
        global.setTimeout = (fn, delay) => {
            capturedDelay = delay;
            return { unref() { } };
        };
        try {
            api.enableAutoTokenRefresh('user', 'hash');
        } finally {
            global.setTimeout = originalSetTimeout;
        }
        assert.strictEqual(capturedDelay, 60000);
    });
});
