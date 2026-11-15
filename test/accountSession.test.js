'use strict';

/**
 * Tests for the account session (password-less login and token refresh):
 *  - getAccountSession() / 'accountSessionUpdated' after connect() and verifyDevice()
 *  - restoreAccountSession() validation and rejection handling
 *  - auto refresh via the session, with password fallback
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const axios = require('axios').default;
const { EcovacsAPI, AccountSessionRejected, DeviceVerificationRequired } = require('../index.js');

/**
 * Stub the auth HTTP calls. `user/login` and `user/getAuthCode` are GETs, the
 * portal `loginByItToken` is a POST that answers with a userId different from
 * the account uid. `authCodeResponse` overrides the getAuthCode envelope; every
 * GET URL is recorded in `calls`, the uid sent to getAuthCode in `calls.authCodeUids`.
 */
function stubAuth({ authCodeResponse } = {}) {
    const calls = [];
    calls.authCodeUids = [];
    axios.get = async (reqUrl, config) => {
        calls.push(reqUrl);
        if (reqUrl.includes('getAuthCode')) {
            calls.authCodeUids.push(config.params.get('uid'));
            return { data: authCodeResponse || { code: '0000', data: { authCode: 'auth_code' } } };
        }
        return { data: { code: '0000', data: { uid: 'account_uid', accessToken: 'account_token' } } };
    };
    axios.post = async () => ({ data: { result: 'ok', token: 'user_token', userId: 'portal_user_id', last: 604800000 } });
    return calls;
}

const passwordLogins = (calls) => calls.filter((u) => u.includes('user/login')).length;

describe('EcovacsAPI account session', function () {
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

    it('returns null before the first login', function () {
        assert.strictEqual(new EcovacsAPI('deviceId123', 'de').getAccountSession(), null);
    });

    it("emits 'accountSessionUpdated' with the session bound to the client after connect()", async function () {
        stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        let emitted = null;
        api.on('accountSessionUpdated', (s) => { emitted = s; });
        await api.connect('user@example.com', 'hash');
        assert.deepStrictEqual(emitted, {
            version: 1,
            uid: 'account_uid',
            accessToken: 'account_token',
            deviceId: 'deviceId123',
            country: 'DE',
            authDomain: 'ecovacs.com'
        });
        assert.deepStrictEqual(api.getAccountSession(), emitted);
    });

    it("emits 'accountSessionUpdated' after verifyDevice()", async function () {
        stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        api.account = 'user@example.com';
        api.encryptAccount = async () => 'encrypted';
        api.callVerificationApi = async () => ({ uid: 'verified_uid', accessToken: 'verified_token' });
        let emitted = null;
        api.on('accountSessionUpdated', (s) => { emitted = s; });
        await api.verifyDevice('123456');
        assert.strictEqual(emitted.uid, 'verified_uid');
        assert.strictEqual(emitted.accessToken, 'verified_token');
    });

    it('announces the session even if the remaining login steps fail', async function () {
        stubAuth();
        axios.post = async () => { throw new Error('ECONNRESET'); };
        const api = new EcovacsAPI('deviceId123', 'de');
        let emitted = null;
        api.on('accountSessionUpdated', (s) => { emitted = s; });
        await assert.rejects(api.connect('user@example.com', 'hash'), /ECONNRESET/);
        assert.strictEqual(emitted.accessToken, 'account_token');
    });

    it('restoreAccountSession() logs in without a password login', async function () {
        const calls = stubAuth();
        const source = new EcovacsAPI('deviceId123', 'de');
        await source.connect('user@example.com', 'hash');

        const api = new EcovacsAPI('deviceId123', 'de');
        let credentials = null;
        let sessionEvents = 0;
        api.on('credentialsUpdated', (c) => { credentials = c; });
        api.on('accountSessionUpdated', () => { sessionEvents++; });
        calls.length = 0;
        assert.strictEqual(await api.restoreAccountSession(source.getAccountSession()), 'ready');
        assert.strictEqual(passwordLogins(calls), 0);
        assert.strictEqual(credentials.token, 'user_token');
        assert.strictEqual(sessionEvents, 0, 'an unchanged session must not be re-announced');
    });

    it('restoreAccountSession() rejects a session of another client device id without calling the cloud', async function () {
        const calls = stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        const session = { version: 1, uid: 'u', accessToken: 't', deviceId: 'otherDevice', country: 'DE', authDomain: 'ecovacs.com' };
        await assert.rejects(api.restoreAccountSession(session), AccountSessionRejected);
        await assert.rejects(api.restoreAccountSession(null), AccountSessionRejected);
        assert.strictEqual(calls.length, 0);
    });

    it('restoreAccountSession() reports a cloud rejection as AccountSessionRejected and drops the session', async function () {
        stubAuth({ authCodeResponse: { code: '1004', msg: 'token expired' } });
        const api = new EcovacsAPI('deviceId123', 'de');
        const session = { version: 1, uid: 'u', accessToken: 't', deviceId: 'deviceId123', country: 'DE', authDomain: 'ecovacs.com' };
        await assert.rejects(api.restoreAccountSession(session), (err) => {
            assert.ok(err instanceof AccountSessionRejected);
            assert.strictEqual(err.code, '1004');
            return true;
        });
        assert.strictEqual(api.getAccountSession(), null);
    });

    it('restoreAccountSession() passes network errors through unchanged', async function () {
        stubAuth();
        axios.get = async () => { throw new Error('ECONNRESET'); };
        const api = new EcovacsAPI('deviceId123', 'de');
        const session = { version: 1, uid: 'u', accessToken: 't', deviceId: 'deviceId123', country: 'DE', authDomain: 'ecovacs.com' };
        await assert.rejects(api.restoreAccountSession(session), (err) => !(err instanceof AccountSessionRejected));
        assert.notStrictEqual(api.getAccountSession(), null, 'a transient failure must keep the session');
    });
});

describe('EcovacsAPI session-based token refresh', function () {
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

    it('refreshes from the account session without a password login', async function () {
        const calls = stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        await api.connect('user@example.com', 'hash');
        api.enableAutoTokenRefresh('user@example.com', 'hash');
        calls.length = 0;
        calls.authCodeUids.length = 0;
        await api._runTokenRefresh();
        api.disableAutoTokenRefresh();
        assert.strictEqual(passwordLogins(calls), 0);
        assert.deepStrictEqual(calls.authCodeUids, ['account_uid'], 'the account uid, not the portal userId, must be exchanged');
        assert.strictEqual(api.getCredentials().userId, 'portal_user_id');
    });

    it('falls back to the password login when the session is rejected', async function () {
        const calls = stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        await api.connect('user@example.com', 'hash');
        api.enableAutoTokenRefresh('user@example.com', 'hash');
        let authCodeCalls = 0;
        const get = axios.get;
        axios.get = async (reqUrl, config) => {
            if (reqUrl.includes('getAuthCode') && authCodeCalls++ === 0) {
                calls.push(reqUrl);
                return { data: { code: '1004', msg: 'token expired' } };
            }
            return get(reqUrl, config);
        };
        calls.length = 0;
        let sessionEvents = 0;
        api.on('accountSessionUpdated', () => { sessionEvents++; });
        await api._runTokenRefresh();
        api.disableAutoTokenRefresh();
        assert.strictEqual(passwordLogins(calls), 1);
        assert.strictEqual(sessionEvents, 1, 'the new session from the password login must be announced');
    });

    it('disables the refresh when the session is rejected and no password is available', async function () {
        stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        await api.restoreAccountSession({ version: 1, uid: 'u', accessToken: 't', deviceId: 'deviceId123', country: 'DE', authDomain: 'ecovacs.com' });
        api.enableAutoTokenRefresh();
        stubAuth({ authCodeResponse: { code: '1004', msg: 'token expired' } });
        let emittedError = null;
        api.on('credentialsRefreshError', (e) => { emittedError = e; });
        await api._runTokenRefresh();
        assert.ok(emittedError instanceof AccountSessionRejected);
        assert.strictEqual(api._autoRefresh, null);
        assert.strictEqual(api._refreshTimer, null);
        assert.strictEqual(api.getCredentials().userId, 'portal_user_id', 'a failed refresh must keep the current uid');
    });

    it('disables the refresh when the password fallback requires device verification', async function () {
        stubAuth();
        const api = new EcovacsAPI('deviceId123', 'de');
        await api.connect('user@example.com', 'hash');
        api.enableAutoTokenRefresh('user@example.com', 'hash');
        axios.get = async (reqUrl) => ({
            data: reqUrl.includes('getAuthCode') ? { code: '1004', msg: 'token expired' } : { code: '1013', msg: 'verify device' }
        });
        let emittedError = null;
        api.on('credentialsRefreshError', (e) => { emittedError = e; });
        await api._runTokenRefresh();
        assert.ok(emittedError instanceof DeviceVerificationRequired);
        assert.strictEqual(api._autoRefresh, null);
    });

    it('enableAutoTokenRefresh() throws without session and password', function () {
        const api = new EcovacsAPI('deviceId123', 'de');
        assert.throws(() => api.enableAutoTokenRefresh(), /No account session or password/);
    });
});
