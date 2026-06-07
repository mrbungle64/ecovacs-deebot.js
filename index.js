'use strict';

const url = require('url');
const EventEmitter = require('events');
const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const constants = require('./library/constants');
const uniqid = require('uniqid');
const tools = require('./library/tools');

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

    let result = await this.callUserAuthApi(this.getLoginPath(), {
      'account': accountId,
      'password': passwordHash
    });
    this.uid = result.uid;
    const loginAccessToken = result.accessToken;

    result = await this.callUserAuthApi(constants.USER_GETAUTHCODE_PATH, {
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
     * @type {{userId: string, token: string, expiresAt: number|null}}
     */
    this.emit('credentialsUpdated', this.getCredentials());
    return 'ready';
  }

  /**
   * Get the current credentials (user id + access token + expiry timestamp).
   * @returns {{userId: string, token: string, expiresAt: number|null}}
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
    let authSignText = this.buildAuthSignText(authAppkey, authSignParams, authSecret);

    params['authAppkey'] = authAppkey;
    params['authSign'] = EcovacsAPI.md5(authSignText);

    return tools.paramsToQueryList(params);
  }

  buildAuthSignText(authAppkey, authSignParams, authSecret) {
    let authSignText = authAppkey;
    let keys = Object.keys(authSignParams);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      authSignText += k + "=" + authSignParams[k];
    }
    authSignText += authSecret;
    return authSignText;
  }

  /**
   * Get the meta-object that will be used to make a request to the server
   * @returns {Object}
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
    let portalPath = this.getPortalPath(loginPath);
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
    try {
      // The Ecovacs cloud sporadically returns HTTP 502; retry defensively.
      const res = await tools.withRetry(
        () => axios.get(portalUrl.href, axiosConfig),
        { retryOn: ({ error }) => tools.isBadGatewayError(error) }
      );
      const result = res.data;
      tools.envLogPayload(result);
      if (result.code === '0000') {
        return result.data;
      } else {
        let error;
        // '1005' and '1010' both indicate an invalid account id / password
        // (the latter matches deebot-client's invalid-authentication handling).
        if ((result.code === '1005') || (result.code === '1010')) {
          error = new Error('Incorrect account id or password');
        } else {
          error = new Error(`Failure code ${result.code}: ${result.msg}`);
        }
        throw error;
      }
    } catch (err) {
      tools.envLogError(`error: '${err}'`);
      throw err;
    }
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

    let portalUrlFormat = tools.getPortalUrlFormat(this.country, this.continent);
    let portalUrl = tools.formatString(portalUrlFormat + "/" + loginPath, { continent: this.continent });
    let headers = {
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
   * @returns {Promise<Object>} an object including user token and user ID
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
   * Wrapper method for the `getVacBot` method (but with only 1 parameter)
   * @param {ApiDevice} vacuum - The object for the vacuum, retrieved by the `devices` dictionary
   * @returns {import('./library/vacBot')} a corresponding instance of the 'VacBot' class
   */
  getVacBotObj(vacuum) {
    return this.getVacBot(this.uid, EcovacsAPI.REALM, this.resource, this.user_access_token, vacuum);
  }

  /**
   * Get a corresponding instance of the `vacBot` class
   * @param {string} user - the user ID (retrieved from Ecovacs API)
   * @param {string} hostname - the host name (for the Ecovacs API)
   * @param {string} resource - the resource of the vacuum
   * @param {string} userToken - the user token
   * @param {ApiDevice} vacuum - the object for the specific device retrieved by the devices dictionary
   * @param {string} [continent] - the continent
   * @returns {import('./library/vacBot')} a corresponding instance of the `VacBot` class
   */
  getVacBot(user, hostname, resource, userToken, vacuum, continent = '') {
    tools.envLogHeader(`getVacBot('${user}','${hostname}','${resource}','${userToken}','${vacuum}','${continent}')`);
    if (continent !== '') {
      tools.envLogWarn(`got value '${continent}' for continent (deprecated)`);
    }
    let vacBotClass;
    const is950Type = EcovacsAPI.isDeviceClass950type(vacuum['class']);
    const is950Type_v2 = EcovacsAPI.isDeviceClass950v2type(vacuum['class']);
    if (is950Type) {
      if (is950Type_v2) {
        tools.envLogSuccess(`'MQTT/JSON V2' model identified`);
      }
      else {
        tools.envLogSuccess(`'MQTT/JSON' model identified`);
      }
      vacBotClass = require('./library/vacBot');
    } else {
      const msg = `'XML' based model identified (unsupported)`;
      tools.envLogError(msg);
      throw new Error(msg);
    }
    return new vacBotClass(user, hostname, resource, userToken, vacuum, this.getContinent(), this.country, '', this.authDomain);
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
   * @param {string} deviceClass - The device class to check
   * @returns {boolean} the value of the '950type_v2' property
   */
  static isDeviceClass950v2type(deviceClass) {
    return tools.getDeviceProperty(deviceClass, '950type_v2', false);
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
   * Create a hash of the given text using the MD5 algorithm
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

module.exports.EcovacsAPI = EcovacsAPI;
/** @deprecated Use EcovacsAPI instead */
module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.countries = countries;
module.exports.VacBot = require('./library/vacBot');
