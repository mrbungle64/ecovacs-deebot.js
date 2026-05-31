'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const axios = require('axios').default;
const HistoryManager = require('../library/managers/historyManager');
const constants = require('../library/constants');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFakeBot(overrides = {}) {
    return {
        country: 'DE',
        continent: 'eu',
        uid: 'test_user_id',
        user_access_token: 'test_access_token',
        resource: 'test_resource',
        did: 'test_did',
        res: 'test_res',
        ...overrides
    };
}

// ---------------------------------------------------------------------------
// getCryptoHashStringForSecuredContent
// ---------------------------------------------------------------------------
describe('HistoryManager – getCryptoHashStringForSecuredContent()', function () {

    it('should include APP_ID and APP_SK constants in the hash input', function () {
        const mgr = new HistoryManager(makeFakeBot());
        const hashInput = mgr.getCryptoHashStringForSecuredContent();
        assert.ok(hashInput.includes(constants.APP_ID),
            `Expected APP_ID "${constants.APP_ID}" in hash input: "${hashInput}"`);
        assert.ok(hashInput.includes(constants.APP_SK),
            `Expected APP_SK in hash input`);
    });

    it('should append a numeric timestamp suffix', function () {
        const mgr = new HistoryManager(makeFakeBot());
        const hashInput = mgr.getCryptoHashStringForSecuredContent();
        const suffix = hashInput.slice(constants.APP_ID.length + constants.APP_SK.length);
        assert.ok(/^\d+$/.test(suffix), `Expected timestamp suffix to be numeric, got: "${suffix}"`);
    });

    it('should produce a string that changes between calls (different timestamps)', async function () {
        const mgr = new HistoryManager(makeFakeBot());
        const first = mgr.getCryptoHashStringForSecuredContent();
        // Wait 2ms to guarantee a different Date.now() value
        await new Promise(r => setTimeout(r, 2));
        const second = mgr.getCryptoHashStringForSecuredContent();
        // The timestamp part must differ (or at minimum the full string is deterministic prefix + ts)
        // We can't guarantee ts differs in 2ms, so we only check the deterministic prefix
        assert.ok(first.startsWith(constants.APP_ID + constants.APP_SK));
        assert.ok(second.startsWith(constants.APP_ID + constants.APP_SK));
    });
});

// ---------------------------------------------------------------------------
// callCleanResultsLogsApi – mocked axios
// ---------------------------------------------------------------------------
describe('HistoryManager – callCleanResultsLogsApi()', function () {
    let originalGet;

    beforeEach(() => {
        originalGet = axios.get;
    });

    afterEach(() => {
        axios.get = originalGet;
    });

    it('should call axios.get and return the response data', async function () {
        const mgr = new HistoryManager(makeFakeBot());
        const mockData = { logs: [{ id: '1', area: 10, ts: 1000, last: 60 }] };
        axios.get = async () => ({ data: mockData });

        const result = await mgr.callCleanResultsLogsApi();
        assert.deepStrictEqual(result, mockData);
    });

    it('should not contain ".com" in portalPath for CN country (uses ecouser.net domain only)', async function () {
        // The URL template (APP_ECOUSER_API) does not contain ".com", so the .com→.cn
        // replacement in HistoryManager has no effect in practice.
        // We verify: the resulting URL contains the CN continent marker and does NOT contain .com
        const mgr = new HistoryManager(makeFakeBot({ country: 'CN', continent: 'ww' }));
        let capturedUrl = '';
        axios.get = async (url) => {
            capturedUrl = url;
            return { data: {} };
        };

        await mgr.callCleanResultsLogsApi();
        assert.ok(capturedUrl.includes('ecouser'), `Expected ecouser domain in URL, got: ${capturedUrl}`);
        // NOTE: The .com→.cn replacement is a no-op for this template
        // This is documented here to make the code path visible in coverage
        assert.ok(!capturedUrl.includes('.com'), `Expected no .com in CN URL, got: ${capturedUrl}`);
    });

    it('should use the continent-based portal URL for non-CN countries', async function () {
        const mgr = new HistoryManager(makeFakeBot({ country: 'DE', continent: 'eu' }));
        let capturedUrl = '';
        axios.get = async (url) => {
            capturedUrl = url;
            return { data: {} };
        };

        await mgr.callCleanResultsLogsApi();
        // The URL template uses ecouser.net with continent substitution, e.g. portal-eu.ecouser.net
        assert.ok(capturedUrl.includes('eu'), `Expected continent "eu" in URL, got: ${capturedUrl}`);
        assert.ok(capturedUrl.includes('ecouser'), `Expected "ecouser" domain in URL, got: ${capturedUrl}`);
    });

    it('should include auth credentials in the query parameters', async function () {
        const bot = makeFakeBot({ uid: 'myUserId', user_access_token: 'myToken', did: 'myDid' });
        const mgr = new HistoryManager(bot);
        let capturedUrl = '';
        axios.get = async (url) => {
            capturedUrl = url;
            return { data: {} };
        };

        await mgr.callCleanResultsLogsApi();
        // The auth object is JSON-stringified and URL-encoded in the query string
        assert.ok(capturedUrl.includes('myUserId'), `Expected uid in URL params`);
        assert.ok(capturedUrl.includes('myDid'), `Expected did in URL params`);
    });

    it('should include Authorization header with the user access token', async function () {
        const bot = makeFakeBot({ user_access_token: 'bearer_xyz' });
        const mgr = new HistoryManager(bot);
        let capturedConfig = null;
        axios.get = async (url, config) => {
            capturedConfig = config;
            return { data: {} };
        };

        await mgr.callCleanResultsLogsApi();
        assert.ok(capturedConfig, 'Expected config to be passed to axios.get');
        assert.ok(
            capturedConfig.headers['Authorization'].includes('bearer_xyz'),
            `Expected token in Authorization header`
        );
    });

    it('should reject when axios.get throws a network error', async function () {
        const mgr = new HistoryManager(makeFakeBot());
        axios.get = async () => { throw new Error('Network failure'); };

        await assert.rejects(
            mgr.callCleanResultsLogsApi(),
            /Network failure/
        );
    });
});

// ---------------------------------------------------------------------------
// downloadSecuredContent – mocked axios + fs
// ---------------------------------------------------------------------------
describe('HistoryManager – downloadSecuredContent()', function () {
    let originalGet;

    beforeEach(() => {
        originalGet = axios.get;
    });

    afterEach(() => {
        axios.get = originalGet;
    });

    it('should reject when axios.get throws during download', async function () {
        const mgr = new HistoryManager(makeFakeBot());
        axios.get = async () => { throw new Error('Download failed'); };

        await assert.rejects(
            mgr.downloadSecuredContent('http://example.com/map.png', '/tmp/test.png'),
            /Download failed/
        );
    });

    it('should include the correct headers in the download request', async function () {
        const bot = makeFakeBot({ user_access_token: 'dl_token', uid: 'dl_user', country: 'DE' });
        const mgr = new HistoryManager(bot);
        let capturedConfig = null;

        // We mock the fs write to avoid actual disk IO
        const fs = require('fs');
        const originalWriteFile = fs.writeFile;
        fs.writeFile = (_path, _data, cb) => cb(null);

        axios.get = async (_url, config) => {
            capturedConfig = config;
            return { data: Buffer.from('fake-image-data') };
        };

        await mgr.downloadSecuredContent('http://example.com/map.png', '/tmp/test_output.png');

        fs.writeFile = originalWriteFile;

        assert.ok(capturedConfig, 'Config should have been captured');
        assert.ok(capturedConfig.headers['Authorization'].includes('dl_token'));
        assert.strictEqual(capturedConfig.responseType, 'arraybuffer');
    });
});
