'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const crypto = require('crypto');
const axios = require('axios').default;
const ecovacsDeebot = require('../index.js');
const { EcovacsAPI, DeviceVerificationRequired, InvalidVerificationCode } = ecovacsDeebot;

// A throwaway RSA keypair so the tests can decrypt the `encryptEmail` /
// `encryptAccount` value the library produces and assert it round-trips.
const { publicKey: testPublicKey, privateKey: testPrivateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});
const testPublicKeyBase64Der = testPublicKey.export({ type: 'spki', format: 'der' }).toString('base64');

/** The `common/getConfig` response carrying the (test) RSA public key. */
const getConfigResponse = {
  code: '0000',
  data: [
    { key: 'SOME.OTHER.KEY', value: 'ignored' },
    { key: 'PUBLIC.KEY.CONFIG', value: JSON.stringify({ publicKey: testPublicKeyBase64Der }) }
  ]
};

function decryptWithTestKey(base64Cipher) {
  return crypto.privateDecrypt(
    { key: testPrivateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(base64Cipher, 'base64')
  ).toString('utf8');
}

describe('Device verification', function () {
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

  it('connect() throws DeviceVerificationRequired on response code 1013', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    axios.get = async () => ({ data: { code: '1013', msg: 'verify device' } });
    await assert.rejects(
      api.connect('user@example.com', 'hashed_pwd'),
      (err) => {
        assert.ok(err instanceof DeviceVerificationRequired, 'expected DeviceVerificationRequired');
        assert.strictEqual(err.code, '1013');
        return true;
      }
    );
  });

  it('requestDeviceVerificationCode() calls getConfig + sendEmailVerifyCode and RSA-encrypts the email', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    api.account = 'user@example.com';

    let getConfigCalled = false;
    let sendEmailCalled = false;
    let capturedEncryptEmail = null;
    let capturedSendParams = null;

    axios.get = async (reqUrl, config) => {
      if (reqUrl.includes('common/getConfig')) {
        getConfigCalled = true;
        return { data: getConfigResponse };
      }
      if (reqUrl.includes('user/sendEmailVerifyCode')) {
        sendEmailCalled = true;
        capturedSendParams = config.params;
        capturedEncryptEmail = config.params.get('encryptEmail');
        return { data: { code: '0000', data: {} } };
      }
      throw new Error(`unexpected GET ${reqUrl}`);
    };

    await api.requestDeviceVerificationCode();

    assert.ok(getConfigCalled, 'getConfig should be called');
    assert.ok(sendEmailCalled, 'sendEmailVerifyCode should be called');
    assert.strictEqual(capturedSendParams.get('verifyType'), 'EMAIL_VERIFY_DEVICE');
    assert.strictEqual(capturedSendParams.get('supportChar'), 'N');
    assert.strictEqual(capturedSendParams.get('isForce'), 'N');
    // Request is signed
    assert.ok(capturedSendParams.get('authSign'), 'request should be signed');
    assert.ok(capturedSendParams.get('authAppkey'), 'request should carry the app key');
    // The encrypted email decrypts back to the account with the test private key
    assert.ok(capturedEncryptEmail, 'encryptEmail should be present');
    assert.strictEqual(decryptWithTestKey(capturedEncryptEmail), 'user@example.com');
  });

  it('getConfig public key is cached (only fetched once across calls)', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    api.account = 'user@example.com';

    let getConfigCount = 0;
    axios.get = async (reqUrl) => {
      if (reqUrl.includes('common/getConfig')) {
        getConfigCount++;
        return { data: getConfigResponse };
      }
      return { data: { code: '0000', data: {} } };
    };

    await api.requestDeviceVerificationCode();
    await api.requestDeviceVerificationCode();
    assert.strictEqual(getConfigCount, 1, 'getConfig should only run once (cached)');
  });

  it('verifyDevice() trims the code, completes the login and caches the credentials', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    api.account = 'user@example.com';

    let capturedVerifyCode = null;
    let capturedEncryptAccount = null;

    axios.get = async (reqUrl, config) => {
      if (reqUrl.includes('common/getConfig')) {
        return { data: getConfigResponse };
      }
      if (reqUrl.includes('user/verifyDevice')) {
        capturedVerifyCode = config.params.get('verifyCode');
        capturedEncryptAccount = config.params.get('encryptAccount');
        assert.strictEqual(config.params.get('model'), 'Pixel 7');
        assert.strictEqual(config.params.get('system'), 'Android 14');
        return { data: { code: '0000', data: { uid: 'verified_uid', accessToken: 'verified_access_token' } } };
      }
      if (reqUrl.includes('getAuthCode')) {
        return { data: { code: '0000', data: { authCode: 'mock_auth_code' } } };
      }
      throw new Error(`unexpected GET ${reqUrl}`);
    };

    axios.post = async () => ({
      data: { result: 'ok', token: 'final_user_token', userId: 'final_user_id', last: '604800000' }
    });

    const status = await api.verifyDevice(' 123456 ');

    assert.strictEqual(status, 'ready');
    assert.strictEqual(capturedVerifyCode, '123456', 'code should be trimmed');
    assert.strictEqual(decryptWithTestKey(capturedEncryptAccount), 'user@example.com');
    // Credentials cached & completeLogin ran loginByItToken
    const creds = api.getCredentials();
    assert.strictEqual(creds.token, 'final_user_token');
    assert.strictEqual(creds.userId, 'final_user_id');
    assert.ok(creds.expiresAt > Date.now(), 'expiry should be tracked');
  });

  it('verifyDevice() emits credentialsUpdated with the fresh credentials', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    api.account = 'user@example.com';

    axios.get = async (reqUrl) => {
      if (reqUrl.includes('common/getConfig')) return { data: getConfigResponse };
      if (reqUrl.includes('user/verifyDevice')) {
        return { data: { code: '0000', data: { uid: 'u', accessToken: 'a' } } };
      }
      if (reqUrl.includes('getAuthCode')) {
        return { data: { code: '0000', data: { authCode: 'ac' } } };
      }
      throw new Error(`unexpected GET ${reqUrl}`);
    };
    axios.post = async () => ({ data: { result: 'ok', token: 'tok', userId: 'uid' } });

    let emitted = null;
    api.on('credentialsUpdated', (c) => { emitted = c; });
    await api.verifyDevice('123456');
    assert.ok(emitted, 'credentialsUpdated should fire');
    assert.strictEqual(emitted.token, 'tok');
  });

  it('verifyDevice() throws InvalidVerificationCode on 1012 and does NOT call loginByItToken', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    api.account = 'user@example.com';

    let postCalled = false;
    axios.get = async (reqUrl) => {
      if (reqUrl.includes('common/getConfig')) return { data: getConfigResponse };
      if (reqUrl.includes('user/verifyDevice')) {
        return { data: { code: '1012', msg: 'invalid code' } };
      }
      throw new Error(`unexpected GET ${reqUrl}`);
    };
    axios.post = async () => { postCalled = true; return { data: { result: 'ok' } }; };

    await assert.rejects(
      api.verifyDevice(' 000000 '),
      (err) => {
        assert.ok(err instanceof InvalidVerificationCode, 'expected InvalidVerificationCode');
        assert.strictEqual(err.code, '1012');
        return true;
      }
    );
    assert.strictEqual(postCalled, false, 'loginByItToken must not be called on invalid code');
  });

  it('verifyDevice()/requestDeviceVerificationCode() throw if no account is set', async function () {
    const api = new EcovacsAPI('deviceId123', 'de');
    await assert.rejects(api.requestDeviceVerificationCode(), /No account set/);
    await assert.rejects(api.verifyDevice('123456'), /No account set/);
  });

  describe('ExampleClient non-interactive stdin prevention', function () {
    const ExampleClient = require('../example/lib/client');
    let originalIsTTY;
    let client;

    beforeEach(() => {
      originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = false;
      client = new ExampleClient({
        ACCOUNT_ID: 'user@example.com',
        PASSWORD: 'password',
        COUNTRY_CODE: 'de'
      });
      // Mock client.api
      client.api = {
        connect: async () => {
          throw new DeviceVerificationRequired('verify device', '1013');
        },
        requestDeviceVerificationCode: async () => {
          throw new Error('Should not call requestDeviceVerificationCode');
        }
      };
    });

    afterEach(() => {
      if (originalIsTTY === undefined) {
        delete process.stdin.isTTY;
      } else {
        process.stdin.isTTY = originalIsTTY;
      }
    });

    it('connectWithDeviceVerification throws immediately and does not call requestDeviceVerificationCode if stdin is not TTY', async function () {
      await assert.rejects(
        client.connectWithDeviceVerification('user@example.com', 'password_hash'),
        /Verification required, but stdin is not interactive \(not a TTY\)/
      );
    });

    it('promptForCode throws if stdin is not TTY', async function () {
      assert.throws(
        () => client.promptForCode('some question'),
        /stdin is not interactive \(not a TTY\)/
      );
    });
  });
});
