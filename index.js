'use strict';

const url = require('url');
const EventEmitter = require('events');
const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const constants = require('./library/constants');
const uniqid = require('uniqid');
const tools = require('./library/tools');
const { DeviceVerificationRequired, InvalidVerificationCode } = require('./library/errors');

/**
 * @typedef {Object} ApiDevice
 * @property {string} [did]
 * @property {string} [name]
 * @property {string} [deviceName]
 * @property {string} [nick]
 * @property {string} [class]
 * @property {string} [company]
 * @property {string} [icon]
 * @property {string} [resource]
 * @property {number} [deviceNumber]
 */

/** @type {Object} */
const countries = require('./countries.json').countries;
/** @type {Object} */
const packageInfo = require('./package.json');

/**
 * @class EcovacsAPI
 * An instance of this class provides access to the Ecovacs account and to the API
 * @property @private {string} resource - the resource of the device
 * @property @private {string} country - the country code of the country where the Ecovacs account is registered
 * @property @private {string} continent - the continent where the Ecovacs account is registered
 * @property @private {string} deviceId - the device ID of the bot
 * @property @private {string} authDomain - the domain for the authentication API
 * @fires EcovacsAPI#credentialsUpdated
 */
class EcovacsAPI extends EventEmitter {
  /**
   * @param {string} deviceId - the device ID of the bot
   * @param {string} country - the country code of the country where the Ecovacs account is registered
   * @param {string} [continent=''] - the continent code
   * @param {string} [authDomain='ecovacs.com'] - the domain for the authentication API
   */
  constructor(deviceId, country, continent = '', authDomain = '') {
    super();
    tools.envLogInfo('Setting up EcovacsAPI instance');

    this.deviceId = deviceId;
    this.country = country.toUpperCase();
    this.continent = continent || this.getContinent();
    this.authDomain = authDomain || constants.AUTH_DOMAIN;
    this.resource = deviceId.substring(0, 8);
  }

  /**
   * @param {string} accountId - The account ID (Email or Ecovacs ID)
   * @param {string} passwordHash - The password hash
   * @returns {Promise<string>}
   */
  async connect(accountId, passwordHash) {
    tools.envLogHeader(`connect(accountId,passwordHash)`);

    if (!accountId) {
      throw new Error('No account ID provided');
    }
    if (!this.country) {
      throw new Error('No country code provided');
    }
    if (!countries[this.country]) {
      throw new Error('Wrong or unknown country code provided');
    }

    // Remember the account so a subsequent device-verification flow
    // (requestDeviceVerificationCode/verifyDevice) can encrypt the same e-mail.
    this.account = accountId;

    const result = await this.callUserAuthApi(this.getLoginPath(), {
      'account': accountId,
      'password': passwordHash
    });
    this.uid = result.uid;

    return this.completeLogin(result.accessToken);
  }

  /**
   * Finish the login once a login access token has been obtained – either from
   * the password login (`connect`) or from device verification (`verifyDevice`).
   * Exchanges the token for an auth code, performs `loginByItToken`, tracks the
   * expiry and fires the `credentialsUpdated` event.
   * @param {string} loginAccessToken - the login access token
   * @returns {Promise<string>} `'ready'` on success
   * @fires EcovacsAPI#credentialsUpdated
   * @private
   */
  async completeLogin(loginAccessToken) {
    let result = await this.callUserAuthApi(constants.USER_GETAUTHCODE_PATH, {
      'uid': this.uid,
      'accessToken': loginAccessToken
    });
    this.authCode = result['authCode'];

    result = await this.callUserApiLoginByItToken();
    this.user_access_token = result['token'];
    this.uid = result['userId'];

    // `last` is the token validity in milliseconds (usually 7 days). Track the
    // expiry at 99% of the validity so it can be refreshed proactively.
    const validityMs = Number(result['last']) > 0 ? Number(result['last']) : constants.TOKEN_DEFAULT_VALIDITY_MS;
    this.tokenExpiresAt = Date.now() + Math.floor(validityMs * 0.99);

    tools.envLogSuccess('user authentication complete');
    /**
     * Fired after a successful (re-)login with fresh credentials.
     * @event EcovacsAPI#credentialsUpdated
     * @type {import('./library/typedefs').Credentials}
     */
    this.emit('credentialsUpdated', this.getCredentials());
    return 'ready';
  }

  /**
   * Request an e-mailed device-verification code for the account used with
   * {@link connect}. This is step one of the two-step device-verification flow
   * that Ecovacs requires when {@link connect} throws a
   * {@link DeviceVerificationRequired} (response code `1013`): the cloud sends a
   * code to the account's e-mail address. Confirm it with {@link verifyDevice}.
   *
   * ```js
   * try {
   *   await api.connect(account, passwordHash);
   * } catch (e) {
   *   if (e instanceof EcovacsAPI.DeviceVerificationRequired) {
   *     await api.requestDeviceVerificationCode();
   *     // ... obtain the code from the user's mailbox ...
   *     await api.verifyDevice(code);
   *   }
   * }
   * ```
   * @returns {Promise<void>}
   */
  async requestDeviceVerificationCode() {
    if (!this.account) {
      throw new Error('No account set – call connect() first');
    }
    const encryptEmail = await this.encryptAccount(this.account);
    await this.callVerificationApi(constants.VERIFY_SENDEMAIL_PATH, {
      'encryptEmail': encryptEmail,
      'verifyType': 'EMAIL_VERIFY_DEVICE',
      'supportChar': 'N',
      'isForce': 'N'
    });
  }

  /**
   * Confirm a device-verification code (step two) and finish the login. On
   * success the credentials are stored and the same `credentialsUpdated` event /
   * refresh mechanism as a normal login is triggered, so `authenticate()` /
   * {@link getCredentials} return the fresh credentials afterwards.
   * @param {string} code - the verification code from the e-mail (surrounding whitespace is trimmed)
   * @returns {Promise<string>} `'ready'` on success
   * @throws {InvalidVerificationCode} if the code is invalid or expired (response code `1012`)
   * @fires EcovacsAPI#credentialsUpdated
   */
  async verifyDevice(code) {
    if (!this.account) {
      throw new Error('No account set – call connect() first');
    }
    const encryptAccount = await this.encryptAccount(this.account);
    const result = await this.callVerificationApi(constants.VERIFY_DEVICE_PATH, {
      'encryptAccount': encryptAccount,
      'backUpEmail': '',
      'verifyCode': String(code).trim(),
      'model': 'Pixel 7',
      'system': 'Android 14'
    });
    if (!result || !result.uid || !result.accessToken) {
      throw new Error('Unexpected verifyDevice response (missing uid or accessToken)');
    }
    this.uid = result['uid'];
    return this.completeLogin(result['accessToken']);
  }

  /**
   * Get the current credentials (user id + access token + expiry timestamp).
   * @returns {import('./library/typedefs').Credentials}
   */
  getCredentials() {
    return {
      userId: this.uid,
      token: this.user_access_token,
      expiresAt: this.tokenExpiresAt || null
    };
  }

  /**
   * Get the absolute timestamp (ms since epoch) at which the access token should
   * be refreshed, or `null` if not yet authenticated.
   * @returns {number|null}
   */
  getTokenExpiry() {
    return this.tokenExpiresAt || null;
  }

  /**
   * Enable automatic, proactive re-authentication shortly before the access
   * token expires. Opt-in: when enabled, the API re-runs the login flow and
   * emits a {@link EcovacsAPI#event:credentialsUpdated} event with the new
   * credentials. Wire it to your bot(s) so the refreshed token is applied:
   *
   * ```js
   * api.on('credentialsUpdated', (c) => vacbot.updateUserAccessToken(c.token));
   * api.enableAutoTokenRefresh(accountId, passwordHash);
   * ```
   *
   * @param {string} accountId - the account ID (same as used for `connect()`)
   * @param {string} passwordHash - the password hash (same as used for `connect()`)
   * @returns {EcovacsAPI} this (for chaining)
   */
  enableAutoTokenRefresh(accountId, passwordHash) {
    this._autoRefresh = { accountId, passwordHash };
    this._scheduleTokenRefresh();
    return this;
  }

  /**
   * Disable automatic token refresh and cancel any pending refresh timer.
   */
  disableAutoTokenRefresh() {
    this._autoRefresh = null;
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  /**
   * (Re)schedule the next token refresh based on the tracked expiry.
   * @private
   */
  _scheduleTokenRefresh() {
    if (!this._autoRefresh) {
      return;
    }
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
    }
    const msUntilRefresh = Math.max((this.tokenExpiresAt || Date.now()) - Date.now(), 60000);
    this._refreshTimer = setTimeout(() => this._runTokenRefresh(), msUntilRefresh);
    // Don't keep the event loop alive solely for the refresh timer
    if (this._refreshTimer.unref) {
      this._refreshTimer.unref();
    }
  }

  /**
   * Perform a token refresh by re-running the login flow, then reschedule.
   * On failure, retries after a short delay.
   * @private
   * @fires EcovacsAPI#credentialsRefreshError
   */
  async _runTokenRefresh() {
    if (!this._autoRefresh) {
      return;
    }
    try {
      // connect() updates the token/expiry and emits 'credentialsUpdated'
      await this.connect(this._autoRefresh.accountId, this._autoRefresh.passwordHash);
      this._scheduleTokenRefresh();
    } catch (e) {
      tools.envLogError(`token refresh failed: ${e.message}`);
      /**
       * Fired when an automatic token refresh attempt fails.
       * @event EcovacsAPI#credentialsRefreshError
       * @type {Error}
       */
      this.emit('credentialsRefreshError', e);
      if (e instanceof DeviceVerificationRequired) {
        this.disableAutoTokenRefresh();
        return;
      }
      if (this._refreshTimer) {
        clearTimeout(this._refreshTimer);
      }
      this._refreshTimer = setTimeout(() => this._runTokenRefresh(), 5 * 60 * 1000);
      if (this._refreshTimer.unref) {
        this._refreshTimer.unref();
      }
    }
  }

  /**
   * Select between an Ecovacs and a yeedi value based on the configured auth domain.
   * @template T
   * @param {T} ecovacsValue - value to use for the Ecovacs auth domain
   * @param {T} yeediValue - value to use for the yeedi auth domain
   * @returns {T}
   * @private
   */
  _authDomainValue(ecovacsValue, yeediValue) {
    return this.authDomain === constants.AUTH_DOMAIN_YD ? yeediValue : ecovacsValue;
  }

  /**
   * Get the parameters for the user login
   * @param {Object} params - an object with the data to retrieve the parameters
   * @returns {string} the parameters
   */
  getUserLoginParams(params) {
    params['authTimeZone'] = 'GMT-8';

    // Sign over the meta object merged with the request params (params win on conflict).
    const authSignParams = { ...this.getMetaObject(), ...params };

    const authAppkey = this._authDomainValue(constants.AUTH_USERLOGIN_AUTH_APPKEY, constants.AUTH_USERLOGIN_AUTH_APPKEY_YD);
    const authSecret = this._authDomainValue(constants.AUTH_USERLOGIN_SECRET, constants.AUTH_USERLOGIN_SECRET_YD);

    return this.buildQueryList(params, authSignParams, authAppkey, authSecret);
  }

  /**
   * Get the parameters for authentication
   * @param {Object} params - an object with the data to retrieve the parameters
   * @returns {string} the parameters
   */
  getAuthParams(params) {
    params['openId'] = 'global';

    const authAppkey = this._authDomainValue(constants.AUTH_GETAUTH_AUTH_APPKEY, constants.AUTH_GETAUTH_AUTH_APPKEY_YD);
    const authSecret = this._authDomainValue(constants.AUTH_GETAUTH_SECRET, constants.AUTH_GETAUTH_SECRET_YD);

    return this.buildQueryList(params, params, authAppkey, authSecret);
  }

  /**
   * Used to generate the URL search parameters for the request
   * @param params - the basic set of parameters for the request
   * @param authSignParams - additional set of parameters for the request
   * @param authAppkey - The appkey for the request
   * @param authSecret - The secret key for the request
   * @returns An array of query strings
   */
  buildQueryList(params, authSignParams, authAppkey, authSecret) {
    const authSignText = this.buildAuthSignText(authAppkey, authSignParams, authSecret);

    params['authAppkey'] = authAppkey;
    params['authSign'] = EcovacsAPI.md5(authSignText);

    return tools.paramsToQueryList(params);
  }

  buildAuthSignText(authAppkey, authSignParams, authSecret) {
    let authSignText = authAppkey;
    const keys = Object.keys(authSignParams);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      authSignText += k + "=" + authSignParams[k];
    }
    authSignText += authSecret;
    return authSignText;
  }

  /**
   * Get the meta-object that will be used to make a request to the server
   * @returns {import('./library/typedefs').MetaObject}
   */
  getMetaObject() {
    const appCode = this._authDomainValue('global_e', 'yd_global_e');
    const appVersion = this._authDomainValue('2.2.3', '1.3.0');
    // deviceType 1 = Android
    return {
      'country': this.country,
      'lang': 'EN',
      'deviceId': this.deviceId,
      'appCode': appCode,
      'appVersion': appVersion,
      'channel': 'google_play',
      'deviceType': '1'
    };
  }

  /**
   * Get the meta-object for the device-verification endpoints. Derives from
   * {@link getMetaObject} (inheriting the correct appCode via
   * {@link _authDomainValue}) and overrides only the country casing and the
   * distinct app version the verification endpoints require.
   * @returns {import('./library/typedefs').MetaObject}
   */
  getVerificationMetaObject() {
    return {
      ...this.getMetaObject(),
      'country': this.country.toLowerCase(),
      'appVersion': constants.VERIFY_APP_VERSION
    };
  }

  /**
   * Build the per-request metadata (request id, timestamp, time zone) shared by
   * the signed device-verification requests.
   * @returns {{requestId: string, authTimespan: number, authTimeZone: string}}
   */
  getRequestMetadata() {
    const now = Date.now() / 1000;              // seconds as a float
    return {
      'requestId': EcovacsAPI.md5(String(now)), // md5 of the seconds-float, not ms
      'authTimespan': Math.floor(now * 1000),   // milliseconds as an integer
      'authTimeZone': 'GMT-8'
    };
  }

  /**
   * Call one of the signed device-verification GET endpoints. Uses the same
   * private-API host and signing scheme as `user/login` but with the
   * verification meta object (see {@link getVerificationMetaObject}).
   * @param {string} endpoint - the endpoint, e.g. `common/getConfig`
   * @param {Object} params - the endpoint-specific parameters (before signing)
   * @returns {Promise<Object|Array>} the response `data`
   * @private
   */
  async callVerificationApi(endpoint, params) {
    tools.envLogHeader(`callVerificationApi('${endpoint}')`);
    const meta = this.getVerificationMetaObject();
    const requestParams = { ...params, ...this.getRequestMetadata() };

    // Sign over the meta object merged with the request params (params win).
    const authSignParams = { ...meta, ...requestParams };
    const authAppkey = this._authDomainValue(constants.AUTH_USERLOGIN_AUTH_APPKEY, constants.AUTH_USERLOGIN_AUTH_APPKEY_YD);
    const authSecret = this._authDomainValue(constants.AUTH_USERLOGIN_SECRET, constants.AUTH_USERLOGIN_SECRET_YD);
    const query = this.buildQueryList(
      requestParams,
      authSignParams,
      authAppkey,
      authSecret
    );

    const portalPath = this.getPortalPath(endpoint);
    const portalUrl = new url.URL(tools.formatString(portalPath + '/' + endpoint, meta));
    const searchParams = new url.URLSearchParams(query);

    tools.envLogInfo(`portalUrl.href: '${portalUrl.href}'`);
    // The Ecovacs cloud sporadically returns HTTP 502; retry defensively.
    const res = await tools.withRetry(
      () => axios.get(portalUrl.href, { params: searchParams }),
      { retryOn: ({ error }) => tools.isBadGatewayError(error) }
    );
    return this.handleAuthResponse(res.data);
  }

  /**
   * Fetch (and cache) the RSA public key used to encrypt the account for the
   * device-verification requests. Retrieves it via `common/getConfig`, whose
   * response is a list; the `PUBLIC.KEY.CONFIG` entry's `value` is a JSON string
   * `{"publicKey":"<base64 SPKI DER>"}`.
   * @returns {Promise<string>} the base64-encoded SPKI DER public key
   * @private
   */
  async getVerificationPublicKey() {
    if (this.verificationPublicKey) {
      return this.verificationPublicKey;
    }
    const config = await this.callVerificationApi(constants.VERIFY_GETCONFIG_PATH, {
      'keys': constants.VERIFY_PUBLIC_KEY_CONFIG_KEY
    });
    if (!Array.isArray(config)) {
      throw new Error('Unexpected getConfig response (expected a list)');
    }
    const entry = config.find((e) => e && e.key === constants.VERIFY_PUBLIC_KEY_CONFIG_KEY);
    if (!entry) {
      throw new Error(`getConfig response is missing the ${constants.VERIFY_PUBLIC_KEY_CONFIG_KEY} entry`);
    }
    let publicKey;
    try {
      const parsed = JSON.parse(entry.value);
      publicKey = parsed && parsed.publicKey;
    } catch (e) {
      throw new Error(`Failed to parse ${constants.VERIFY_PUBLIC_KEY_CONFIG_KEY} JSON value`, { cause: e });
    }
    if (!publicKey) {
      throw new Error(`getConfig entry ${constants.VERIFY_PUBLIC_KEY_CONFIG_KEY} is missing the publicKey property`);
    }
    this.verificationPublicKey = publicKey;
    return publicKey;
  }

  /**
   * Encrypt the account (e-mail) with the device-verification public key using
   * RSA / PKCS#1 v1.5 padding, base64-encoded.
   * @param {string} account - the account (e-mail) to encrypt
   * @returns {Promise<string>} the base64-encoded ciphertext
   * @private
   */
  async encryptAccount(account) {
    const publicKey = await this.getVerificationPublicKey();
    return EcovacsAPI.encryptWithPublicKey(account, publicKey);
  }

  /**
   * @param {string} loginPath - the login path
   * @param {Object} params - an object with the data to retrieve the parameters
   * @returns {Promise<Object>} an object including access token and user ID
   */
  async callUserAuthApi(loginPath, params) {
    if (loginPath === 'user/login') {
      tools.envLogHeader(`callUserAuthApi('${loginPath}',{account:accountId,password:passwordHash})`);
    } else {
      tools.envLogHeader(`callUserAuthApi('${loginPath}',${JSON.stringify(params)})`);
    }
    const portalPath = this.getPortalPath(loginPath);
    let portalUrl;
    let searchParams;
    params['authTimespan'] = Date.now();
    if (loginPath === constants.USER_GETAUTHCODE_PATH) {
      params['bizType'] = '';
      params['deviceId'] = this.deviceId;
      portalUrl = new url.URL(tools.formatString(portalPath, this.getMetaObject()));
      searchParams = new url.URLSearchParams(this.getAuthParams(params));
    } else {
      params['requestId'] = EcovacsAPI.md5(uniqid());
      portalUrl = new url.URL(tools.formatString(portalPath + "/" + loginPath, this.getMetaObject()));
      searchParams = new url.URLSearchParams(this.getUserLoginParams(params));
    }

    const axiosConfig = {
      params: searchParams
    };

    tools.envLogInfo(`portalUrl.href: '${portalUrl.href}'`);
    tools.envLogInfo(`searchParams: '${searchParams.toString()}'`);
    // The Ecovacs cloud sporadically returns HTTP 502; retry defensively.
    const res = await tools.withRetry(
      () => axios.get(portalUrl.href, axiosConfig),
      { retryOn: ({ error }) => tools.isBadGatewayError(error) }
    );
    const result = res.data;
    return this.handleAuthResponse(result);
  }

  /**
   * Shared handler for the private auth API response envelope (`user/login`,
   * `user/getAuthCode` and the device-verification endpoints). Returns the
   * `data` payload on success (a list for `common/getConfig`, an object
   * otherwise) or throws a typed error for a known failure code.
   *
   * Security: a successful response may carry tokens / credentials, so only the
   * response code is logged here – never the full payload.
   * @param {Object} result - the parsed response envelope (`{ code, data, msg }`)
   * @returns {Object|Array} the response `data`
   * @throws {DeviceVerificationRequired} on code `1013`
   * @throws {InvalidVerificationCode} on code `1012`
   * @private
   */
  handleAuthResponse(result) {
    tools.envLogInfo(`auth response code: ${result.code}`);
    if (result.code === '0000') {
      return result.data;
    }
    if (result.msg) {
      tools.envLogInfo(`auth response message: ${result.msg}`);
    }
    // '1005' and '1010' both indicate an invalid account id / password
    // (the latter matches deebot-client's invalid-authentication handling).
    if ((result.code === '1005') || (result.code === '1010')) {
      throw new Error('Incorrect account id or password');
    }
    // '1012' -> supplied verification code invalid/expired.
    if (result.code === '1012') {
      throw new InvalidVerificationCode(result.msg);
    }
    // '1013' -> the client device id must be verified before login can proceed.
    if (result.code === '1013') {
      throw new DeviceVerificationRequired(result.msg);
    }
    throw new Error(`Failure code ${result.code}: ${result.msg}`);
  }

  /**
   * Returns the portal path for the given login path
   * @param {string} loginPath - the path for the login
   * @returns {string} the portal path
   */
  getPortalPath(loginPath) {
    let portalPath = constants.AUTH_GL_API;
    if (loginPath === constants.USER_GETAUTHCODE_PATH) {
      portalPath = constants.AUTH_GL_OPENAPI;
    }
    portalPath = tools.formatString(portalPath, { domain: this.authDomain });
    if (this.country === 'CN') {
      portalPath = portalPath.replace('.com', '.cn');
    }
    return portalPath;
  }

  /**
   * @param {string} loginPath - the API path
   * @param {string} func - the API function to be called
   * @param {Object} args - an object with the params for the POST request
   * @returns {Promise<Object>}
   */
  async callPortalApi(loginPath, func, args) {
    tools.envLogHeader(`callPortalApi('${loginPath}','${func}','${JSON.stringify(args)}')`);
    const params = { 'todo': func, ...args };
    tools.envLogInfo(`params: ${JSON.stringify(params)}`);

    const portalUrlFormat = tools.getPortalUrlFormat(this.country, this.continent);
    const portalUrl = tools.formatString(portalUrlFormat + "/" + loginPath, { continent: this.continent });
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(params))
    };
    tools.envLogInfo(`portalUrl: '${portalUrl}'`);
    // Retry on HTTP 502 (Bad Gateway) and on the transient 'set token error'
    // that `loginByItToken` occasionally returns. Other responses pass through
    // unchanged to the success/error handling below.
    const res = await tools.withRetry(
      () => axios.post(portalUrl, params, { headers: headers }),
      {
        retryOn: ({ error, result }) => {
          if (error) {
            return tools.isBadGatewayError(error);
          }
          const data = result && result.data;
          return Boolean(data && data['result'] === 'fail' && data['error'] === 'set token error.');
        }
      }
    );

    const response = res.data;
    if ((response['result'] !== 'ok') && (response['ret'] !== 'ok') && (response['msg'] !== 'success')) {
      tools.envLogError(`failure code '${response['errno']}' (${response['error']}) for call '${func}'`);
      throw new Error(`Failure code ${response['errno']} (${response['error']}) for call ${func}`);
    } else {
      tools.envLogPayload(response);
    }
    return response;
  }

  /**
   * It calls the API to login by access token
   * @returns {Promise<import('./library/typedefs').ItTokenResult>} an object including user token and user ID
   */
  callUserApiLoginByItToken() {
    let org = this._authDomainValue('ECOWW', 'ECOYDWW');
    let country = this.country;
    if (this.country === 'CN') {
      org = this._authDomainValue('ECOCN', 'ECOYDCN');
      country = 'Chinese';
    }
    return this.callPortalApi(constants.USER_API_PATH, 'loginByItToken', {
      'edition': 'ECOGLOBLE',
      'userId': this.uid,
      'token': this.authCode,
      'realm': constants.REALM,
      'resource': this.resource,
      'org': org,
      'last': '',
      'country': country
    });
  }

  /**
   * Get the login path for the current country
   * @returns {string} the login path is being returned.
   */
  getLoginPath() {
    let loginPath = constants.USER_LOGIN_PATH;
    if (this.country === 'CN') {
      loginPath = `${loginPath}CheckMobile`;
    }
    return loginPath;
  }

  /**
   * @returns {Promise<Object>} a dictionary of Ecovacs products
   */
  async getConfigProducts() {
    const data = await this.callPortalApi('pim/product/getConfigProducts', 'GetConfigProducts', {
      'userid': this.uid,
      'auth': {
        'with': 'users',
        'userid': this.uid,
        'realm': constants.REALM,
        'token': this.user_access_token,
        'resource': this.resource
      }
    });
    return data['data'];
  }

  /**
   * @param {string} api - the API path
   * @param {string} func - the API function to be called
   * @returns {Promise<Object>} a dictionary of all devices of the users Ecovacs account
   */
  async getDevices(api = constants.USER_API_PATH, func = 'GetDeviceList') {
    const data = await this.callPortalApi(api, func, {
      'userid': this.uid,
      'auth': {
        'with': 'users',
        'userid': this.uid,
        'realm': constants.REALM,
        'token': this.user_access_token,
        'resource': this.resource
      }
    });
    return data['devices'];
  }

  /**
   * @returns {Promise<Array<ApiDevice>>} a list of all devices of the users Ecovacs account
   */
  async devices() {
    const deviceList = await this.getDevices(constants.USER_API_PATH, 'GetDeviceList');
    const globalDeviceList = await this.getDevices('appsvr/app.do', 'GetGlobalDeviceList');
    return this.mergeDeviceLists(deviceList, globalDeviceList);
  }

  /**
   * Merge the data from the global device list (GetGlobalDeviceList)
   * with the data from the device list (GetDeviceList) of the users Ecovacs account
   * @param {Object} deviceList - the list of devices of the Ecovacs account
   * @param {Object} globalDeviceList - the global device list returned by the API
   * @returns {Object} a dictionary of all known devices
   */
  mergeDeviceLists(deviceList, globalDeviceList) {
    // The two lists are not returned in the same order, so index the global
    // list by `did` and merge each device with its global counterpart. Returns
    // fresh objects (no mutation of either input list).
    const globalDevicesByDid = new Map(globalDeviceList.map((device) => [device.did, device]));
    return deviceList.map((device, deviceNumber) => {
      const globalDevice = globalDevicesByDid.get(device.did);
      return globalDevice ? { ...device, ...globalDevice, deviceNumber } : device;
    });
  }

  /**
   * Get all known devices
   * @returns {Object} a dictionary of all known devices
   */
  getAllKnownDevices() {
    return tools.getAllKnownDevices();
  }

  /**
   * Get the name of the country from the countries object
   * @returns {string} the name of the country
   */
  getCountryName() {
    if (countries[this.country]) {
      return countries[this.country].name;
    }
    return 'unknown';
  }

  /**
   * Get the continent code from the countries object
   * @returns {string} the continent (lower case)
   */
  getContinent() {
    if (countries[this.country]) {
      return countries[this.country].continent.toLowerCase();
    }
    return 'ww';
  }

  /**
   * Get an `EcovacsDevice` instance for a device, using the credentials of the
   * current API session (convenience wrapper for `getDevice`, with only 1 parameter).
   * @param {ApiDevice} vacuum - The object for the device, retrieved by the `devices` dictionary
   * @param {Object} [options] - optional transport overrides forwarded to the device session (see {@link getDevice}); mainly for local testing
   * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
   */
  getDeviceObj(vacuum, options = {}) {
    return this.getDevice(this.uid, EcovacsAPI.REALM, this.resource, this.user_access_token, vacuum, '', options);
  }

  /**
   * @deprecated Use `getDeviceObj()` instead. Retained as a backward-compatible alias.
   * @param {ApiDevice} vacuum - The object for the device, retrieved by the `devices` dictionary
   * @param {Object} [options] - optional transport overrides forwarded to the device session
   * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
   */
  getVacBotObj(vacuum, options = {}) {
    return this.getDeviceObj(vacuum, options);
  }

  /**
   * Get a corresponding instance of the `EcovacsDevice` class
   * @param {string} user - the user ID (retrieved from Ecovacs API)
   * @param {string} hostname - the host name (for the Ecovacs API)
   * @param {string} resource - the resource of the device
   * @param {string} userToken - the user token
   * @param {ApiDevice} vacuum - the object for the specific device retrieved by the devices dictionary
   * @param {string} [continent] - the continent
   * @param {Object} [options] - optional transport overrides forwarded to the device session (see {@link EcovacsDeviceSession}); `{serverAddress, serverPort, protocol, rejectUnauthorized}`. The first three are mainly for local testing; `rejectUnauthorized` defaults to `false` because the Ecovacs cloud broker uses a private CA that is not publicly verifiable — set it to `true` only for a local broker whose CA Node can verify
   * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
   */
  getDevice(user, hostname, resource, userToken, vacuum, continent = '', options = {}) {
    tools.envLogHeader(`getDevice('${user}','${hostname}','${resource}','${userToken}','${vacuum}','${continent}')`);
    if (continent !== '') {
      tools.envLogWarn(`got value '${continent}' for continent (deprecated)`);
    }
    let DeviceClass;
    const is950Type = EcovacsAPI.isDeviceClass950type(vacuum['class']);
    const is950Type_v2 = EcovacsAPI.isDeviceClass950v2type(vacuum['class']);
    if (is950Type) {
      if (is950Type_v2) {
        tools.envLogSuccess(`'MQTT/JSON V2' model identified`);
      }
      else {
        tools.envLogSuccess(`'MQTT/JSON' model identified`);
      }
      DeviceClass = require('./library/ecovacsDevice');
    } else {
      const msg = `'XML' based model identified (unsupported)`;
      tools.envLogError(msg);
      throw new Error(msg);
    }
    return new DeviceClass(user, hostname, resource, userToken, vacuum, this.getContinent(), this.country, '', this.authDomain, options);
  }

  /**
   * @deprecated Use `getDevice()` instead. Retained as a backward-compatible alias.
   * @param {string} user - the user ID (retrieved from Ecovacs API)
   * @param {string} hostname - the host name (for the Ecovacs API)
   * @param {string} resource - the resource of the device
   * @param {string} userToken - the user token
   * @param {ApiDevice} vacuum - the object for the specific device retrieved by the devices dictionary
   * @param {string} [continent] - the continent
   * @param {Object} [options] - optional transport overrides forwarded to the device session
   * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
   */
  getVacBot(user, hostname, resource, userToken, vacuum, continent = '', options = {}) {
    return this.getDevice(user, hostname, resource, userToken, vacuum, continent, options);
  }

  /**
   * Get the version of the package
   * @returns {string} the version of the package
   */
  getVersion() {
    return packageInfo.version;
  }

  /**
   * Get the version of the package
   * @returns {string} the version of the package
   */
  static version() {
    return packageInfo.version;
  }

  /**
   * Is map rendering available? Always true – rendering is pure JS now.
   * Kept for backward compatibility (formerly reported native `canvas` availability).
   * @returns {boolean} always true
   */
  getCanvasModuleIsAvailable() {
    return EcovacsAPI.isCanvasModuleAvailable();
  }

  /**
   * Is map rendering available? Always true – rendering is pure JS now.
   * Kept for backward compatibility (formerly reported native `canvas` availability).
   * @returns {boolean} always true
   */
  static isCanvasModuleAvailable() {
    return tools.isCanvasModuleAvailable();
  }

  /**
   * @param {string} company
   * @returns {boolean}
   */
  static isMQTTProtocolUsed(company) {
    return (company === 'eco-ng');
  }

  /**
   * Returns true if the device class is not a legacy model (i.e. is 950 type or newer)
   * @param {string} deviceClass - The device class to check
   * @returns {boolean} true if not legacy
   */
  static isDeviceClass950type(deviceClass) {
    return tools.getDeviceProperty(deviceClass, 'type', 'legacy') !== 'legacy';
  }

  /**
   * Returns true if the device class is 950_v2 type
   * (i.e. implements the newer `_V2` JSON/MQTT commands).
   * Reads the canonical `V2` property, so it agrees with
   * `EcovacsDevice.is950type_V2()`.
   * @param {string} deviceClass - The device class to check
   * @returns {boolean} the value of the canonical `V2` property
   */
  static isDeviceClass950v2type(deviceClass) {
    return tools.getDeviceProperty(deviceClass, 'V2', false);
  }

  /**
   * Returns true if the device class is not 950 type
   * @param {string} deviceClass - The device class of the device
   * @returns {boolean} a boolean value.
   */
  static isDeviceClassNot950type(deviceClass) {
    return (!EcovacsAPI.isDeviceClass950type(deviceClass));
  }

  /**
   * Given a machine id and a device number, return the device ID
   * @param {string} machineId - the id of the device
   * @param {number} [deviceNumber=0] - the device number is a number that is assigned to each device
   * @returns {string} the device ID
   */
  static getDeviceId(machineId, deviceNumber = 0) {
    return EcovacsAPI.md5(machineId + deviceNumber.toString());
  }

  /**
   * Create a hash of the given text using the MD5 algorithm.
   * NOTE: MD5 is mandated by the Ecovacs API request-signature scheme (authSign)
   * and request-id generation — it is NOT used as a security primitive here.
   * @param {string} text - the text to be hashed
   * @returns {string} the MD5 hash of the text
   */
  static md5(text) {
    return crypto.createHash('md5').update(text || '').digest("hex");
  }

  /**
   * It takes a string and encrypts it using the public key
   * @param {string} text - the text to encrypt
   * @returns {string} the encrypted string
   */
  static encrypt(text) {
    return crypto.publicEncrypt({
      key: EcovacsAPI.PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(text)).toString('base64');
  }

  /**
   * Encrypt text with a base64-encoded SPKI DER RSA public key using
   * PKCS#1 v1.5 padding. Used for the device-verification account encryption
   * where the key is fetched at runtime (see {@link getVerificationPublicKey}).
   * @param {string} text - the text to encrypt
   * @param {string} base64Der - the base64-encoded SPKI DER public key
   * @returns {string} the base64-encoded ciphertext
   */
  static encryptWithPublicKey(text, base64Der) {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(base64Der, 'base64'),
      format: 'der',
      type: 'spki'
    });
    return crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(text, 'utf8')).toString('base64');
  }

  logInfo(message) {
    tools.logInfo(message);
  }

  logWarn(message) {
    tools.logWarn(message);
  }

  logError(message) {
    tools.logError(message);
  }

  logEvent(event, value) {
    tools.logEvent(event, value);
  }
}

EcovacsAPI.PUBLIC_KEY = fs.readFileSync(__dirname + "/key.pem", "utf8");
EcovacsAPI.REALM = constants.REALM;

const errors = require('./library/errors');
// Expose the auth error types as static properties so callers can do
// `err instanceof EcovacsAPI.DeviceVerificationRequired`.
EcovacsAPI.AuthError = errors.AuthError;
EcovacsAPI.DeviceVerificationRequired = errors.DeviceVerificationRequired;
EcovacsAPI.InvalidVerificationCode = errors.InvalidVerificationCode;

module.exports.EcovacsAPI = EcovacsAPI;
/** @deprecated Use EcovacsAPI instead */
module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.countries = countries;
module.exports.AuthError = errors.AuthError;
module.exports.DeviceVerificationRequired = errors.DeviceVerificationRequired;
module.exports.InvalidVerificationCode = errors.InvalidVerificationCode;
module.exports.EcovacsDevice = require('./library/ecovacsDevice');
/** @deprecated Use EcovacsDevice instead */
module.exports.VacBot = module.exports.EcovacsDevice;
