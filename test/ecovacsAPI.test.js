'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const axios = require('axios').default;
const ecovacsDeebot = require('../index.js');
const { EcovacsAPI } = ecovacsDeebot;

describe('EcovacsAPI Extended tests', function () {
  let originalGet;
  let originalPost;
  let mockGetResponse;
  let mockPostResponse;
  let mockGetError;
  let mockPostError;

  beforeEach(() => {
    originalGet = axios.get;
    originalPost = axios.post;
    mockGetResponse = null;
    mockPostResponse = null;
    mockGetError = null;
    mockPostError = null;

    axios.get = async () => {
      if (mockGetError) {
        throw mockGetError;
      }
      return { data: mockGetResponse };
    };

    axios.post = async () => {
      if (mockPostError) {
        throw mockPostError;
      }
      return { data: mockPostResponse };
    };
  });

  afterEach(() => {
    axios.get = originalGet;
    axios.post = originalPost;
  });

  describe('getCountryName', function () {
    it('should return the correct country name for a known country code', function () {
      assert.strictEqual(new EcovacsAPI('deviceId123', 'cn').getCountryName(), 'China');
      assert.strictEqual(new EcovacsAPI('deviceId123', 'de').getCountryName(), 'Germany');
    });

    it('should return "unknown" for an invalid country code', function () {
      assert.strictEqual(new EcovacsAPI('deviceId123', 'xx').getCountryName(), 'unknown');
    });
  });

  describe('getContinent', function () {
    it('should return the correct continent for a known country code', function () {
      assert.strictEqual(new EcovacsAPI('deviceId123', 'cn').getContinent(), 'ww');
      assert.strictEqual(new EcovacsAPI('deviceId123', 'de').getContinent(), 'eu');
    });

    it('should fall back to "ww" for an invalid country code', function () {
      assert.strictEqual(new EcovacsAPI('deviceId123', 'xx').getContinent(), 'ww');
    });
  });

  describe('getLoginPath', function () {
    it('should return the CN-specific login path for Chinese accounts', function () {
      const api = new EcovacsAPI('deviceId123', 'cn');
      assert.strictEqual(api.getLoginPath(), 'user/loginCheckMobile');
    });

    it('should return the standard login path for non-CN accounts', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      assert.strictEqual(api.getLoginPath(), 'user/login');
    });
  });

  describe('getPortalPath', function () {
    it('should include ".cn" in the portal path for CN accounts', function () {
      const api = new EcovacsAPI('deviceId123', 'cn');
      assert.ok(api.getPortalPath('user/login').includes('.cn'),
        'CN portal path should contain .cn');
    });

    it('should include ".com" in the portal path for EU accounts', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      assert.ok(api.getPortalPath('user/login').includes('.com'),
        'EU portal path should contain .com');
    });

    it('should use the openapi subdomain for getAuthCode path', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      assert.ok(api.getPortalPath('user/getAuthCode').includes('openapi'),
        'getAuthCode portal path should use openapi subdomain');
    });
  });

  describe('mergeDeviceLists', function () {
    it('should correctly merge devices by did, assigning deviceNumber by position', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      const deviceList = [
        { did: '1', name: 'Deebot 1' },
        { did: '2', name: 'Deebot 2' }
      ];
      const globalDeviceList = [
        { did: '2', name: 'Deebot 2 Global', class: 'yna5xi' },
        { did: '1', name: 'Deebot 1 Global', class: 'yna5xi' }
      ];
      const result = api.mergeDeviceLists(deviceList, globalDeviceList);
      assert.strictEqual(result[0].name, 'Deebot 1 Global');
      assert.strictEqual(result[0].deviceNumber, 0);
      assert.strictEqual(result[1].name, 'Deebot 2 Global');
      assert.strictEqual(result[1].deviceNumber, 1);
    });

    it('should return an empty list when both inputs are empty', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      const result = api.mergeDeviceLists([], []);
      assert.deepStrictEqual(result, []);
    });

    it('should only include devices present in the primary deviceList', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      const deviceList = [{ did: '1', name: 'Deebot 1' }];
      const globalDeviceList = [
        { did: '1', name: 'Deebot 1 Global', class: 'yna5xi' },
        { did: '99', name: 'Unknown Device', class: 'yna5xi' } // not in primary list
      ];
      const result = api.mergeDeviceLists(deviceList, globalDeviceList);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].did, '1');
    });
  });

  describe('getVacBot', function () {
    it('should throw for XML legacy models', function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      assert.throws(() => api.getVacBot('user', 'host', 'res', 'token', { class: '123' }), /XML/);
    });

    it('should create a VacBot instance for 950-type models', function () {
      const VacBot = require('../library/vacBot');
      const api = new EcovacsAPI('deviceId123', 'de');
      const bot = api.getVacBot('user', 'host', 'res', 'token', { class: 'yna5xi' });
      assert.ok(bot instanceof VacBot, 'Expected a VacBot instance');
    });
  });

  describe('getVacBotObj', function () {
    it('should create a VacBot via the wrapper using stored uid and token', function () {
      const VacBot = require('../library/vacBot');
      const api = new EcovacsAPI('deviceId123', 'de');
      api.uid = 'user';
      api.user_access_token = 'token';
      const bot = api.getVacBotObj({ class: 'yna5xi' });
      assert.ok(bot instanceof VacBot, 'Expected a VacBot instance from getVacBotObj');
    });
  });

  describe('connect parameters validation', function () {
    it('should throw if no account ID provided', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      await assert.rejects(api.connect(null, 'pwd'), /No account ID/);
    });

    it('should throw if wrong country code', async function () {
      const api = new EcovacsAPI('deviceId123', 'xx');
      await assert.rejects(api.connect('user', 'pwd'), /Wrong or unknown country/);
    });
  });

  describe('callUserAuthApi', function () {
    it('should return result data when code is 0000', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockGetResponse = {
        code: '0000',
        data: { test: 'value' }
      };
      const data = await api.callUserAuthApi('user/login', { test: 1 });
      assert.deepStrictEqual(data, { test: 'value' });
    });

    it('should throw clear error on incorrect credentials code 1005', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockGetResponse = {
        code: '1005',
        msg: 'Incorrect'
      };
      await assert.rejects(api.callUserAuthApi('user/login', {}), /Incorrect account id or password/);
    });

    it('should throw generic failure code error', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockGetResponse = {
        code: '9999',
        msg: 'Unknown error'
      };
      await assert.rejects(api.callUserAuthApi('user/login', {}), /Failure code 9999/);
    });

    it('should handle API path getAuthCode correctly', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockGetResponse = {
        code: '0000',
        data: { authCode: 'xyz' }
      };
      const data = await api.callUserAuthApi('user/getAuthCode', {});
      assert.deepStrictEqual(data, { authCode: 'xyz' });
    });
  });

  describe('callPortalApi', function () {
    it('should return API response on success', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockPostResponse = {
        result: 'ok',
        data: 'success'
      };
      const response = await api.callPortalApi('path', 'func', {});
      assert.deepStrictEqual(response, { result: 'ok', data: 'success' });
    });

    it('should throw error when result is not success/ok', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockPostResponse = {
        result: 'fail',
        errno: 500,
        error: 'System error'
      };
      await assert.rejects(api.callPortalApi('path', 'func', {}), /Failure code 500/);
    });

    it('should reject on network error', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      mockPostError = new Error('Network timeout');
      await assert.rejects(
        api.callPortalApi('path', 'func', {}),
        /Network timeout/
      );
    });
  });

  describe('connect flow with successful API calls', function () {
    it('should complete the entire connect sequence', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      
      // We will mock the sequential calls made during connect():
      // 1. callUserAuthApi('user/login') (axios.get) -> returns uid and accessToken
      // 2. callUserAuthApi('user/getAuthCode') (axios.get) -> returns authCode
      // 3. callPortalApi loginByItToken (axios.post) -> returns token (user_access_token) and userId
      
      let getCallCount = 0;
      axios.get = async () => {
        getCallCount++;
        if (getCallCount === 1) {
          return {
            data: {
              code: '0000',
              data: { uid: 'mock_uid', accessToken: 'mock_access_token' }
            }
          };
        } else if (getCallCount === 2) {
          return {
            data: {
              code: '0000',
              data: { authCode: 'mock_auth_code' }
            }
          };
        }
      };

      axios.post = async () => {
        return {
          data: {
            result: 'ok',
            token: 'mock_user_access_token',
            userId: 'mock_user_id'
          }
        };
      };

      const status = await api.connect('user@example.com', 'hashed_pwd');
      assert.strictEqual(status, 'ready');
      assert.strictEqual(api.uid, 'mock_user_id');
      assert.strictEqual(api.authCode, 'mock_auth_code');
      assert.strictEqual(api.user_access_token, 'mock_user_access_token');
    });
  });

  describe('getConfigProducts and getDevices', function () {
    it('should fetch config products', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      api.uid = 'user_id';
      api.user_access_token = 'token';
      mockPostResponse = {
        result: 'ok',
        data: { prod1: {} }
      };
      const prods = await api.getConfigProducts();
      assert.deepStrictEqual(prods, { prod1: {} });
    });

    it('should fetch devices list', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      api.uid = 'user_id';
      api.user_access_token = 'token';
      mockPostResponse = {
        result: 'ok',
        devices: [{ did: '1' }]
      };
      const devices = await api.getDevices();
      assert.deepStrictEqual(devices, [{ did: '1' }]);
    });

    it('should fetch merged devices list via devices()', async function () {
      const api = new EcovacsAPI('deviceId123', 'de');
      api.uid = 'user_id';
      api.user_access_token = 'token';
      
      let postCallCount = 0;
      axios.post = async () => {
        postCallCount++;
        if (postCallCount === 1) {
          // getDevices('GetDeviceList')
          return {
            data: {
              result: 'ok',
              devices: [{ did: '1', name: 'Dev 1' }]
            }
          };
        } else {
          // getDevices('GetGlobalDeviceList')
          return {
            data: {
              result: 'ok',
              devices: [{ did: '1', name: 'Dev 1 Global', class: 'yna5xi' }]
            }
          };
        }
      };

      const result = await api.devices();
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'Dev 1 Global');
    });
  });
});
