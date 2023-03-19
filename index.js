'use strict';

const url = require('url');
const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const constants = require('./library/constants');
const uniqid = require('uniqid');
const tools = require('./library/tools');

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
 */
class EcovacsAPI {
  /**
   * @param {string} deviceId - the device ID of the bot
   * @param {string} country - the country code of the country where the Ecovacs account is registered
   * @param {string} [continent=''] - the continent code
   * @param {string} [authDomain='ecovacs.com'] - the domain for the authentication API
   */
  constructor(deviceId, country, continent = '', authDomain = '') {
    tools.envLogInfo('Setting up EcovacsAPI instance');

    this.deviceId = deviceId;
    this.country = country.toUpperCase();
    this.continent = continent ? continent : this.getContinent();
    this.authDomain = authDomain ? authDomain : constants.AUTH_DOMAIN;
    this.resource = deviceId.substring(0, 8);
  }

  /**
   * @param {string} accountId - The account ID (Email or Ecovacs ID)
   * @param {string} passwordHash - The password hash
   * @returns {Promise<string>}
   */
  async connect(accountId, passwordHash) {
    tools.envLogHeader(`connect(accountId,passwordHash)`);

    let error;
    if (!accountId) {
      error = new Error('No account ID provided');
    }
    if (!this.country) {
      error = new Error('No country code provided');
    }
    if (!countries[this.country]) {
      error = new Error('Wrong or unknown country code provided');
    }
    if (error) {
      throw error;
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
    tools.envLogSuccess('user authentication complete');
    return 'ready';
  }

  /**
   * Get the parameters for the user login
   * @param {Object} params - an object with the data to retrieve the parameters
   * @returns {string} the parameters
   */
  getUserLoginParams(params) {
    params['authTimeZone'] = 'GMT-8';

    let authSignParams = JSON.parse(JSON.stringify(this.getMetaObject()));
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        authSignParams[key] = params[key];
      }
    }

    let authAppkey = constants.AUTH_USERLOGIN_AUTH_APPKEY;
    if (this.authDomain === constants.AUTH_DOMAIN_YD) {
      authAppkey = constants.AUTH_USERLOGIN_AUTH_APPKEY_YD;
    }
    let authSecret = constants.AUTH_USERLOGIN_SECRET;
    if (this.authDomain === constants.AUTH_DOMAIN_YD) {
      authSecret = constants.AUTH_USERLOGIN_SECRET_YD;
    }

    return this.buildQueryList(params, authSignParams, authAppkey, authSecret);
  }

  /**
   * Get the parameters for authentication
   * @param {Object} params - an object with the data to retrieve the parameters
   * @returns {string} the parameters
   */
  getAuthParams(params) {
    let authSignParams = params;
    authSignParams['openId'] = 'global';

    let authAppkey = constants.AUTH_GETAUTH_AUTH_APPKEY;
    if (this.authDomain === constants.AUTH_DOMAIN_YD) {
      authAppkey = constants.AUTH_GETAUTH_AUTH_APPKEY_YD;
    }
    let authSecret = constants.AUTH_GETAUTH_SECRET;
    if (this.authDomain === constants.AUTH_DOMAIN_YD) {
      authSecret = constants.AUTH_GETAUTH_SECRET_YD;
    }

    return this.buildQueryList(params, authSignParams, authAppkey, authSecret);
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
    let appCode = 'global_e';
    let appVersion = '2.2.3';
    if (this.authDomain === constants.AUTH_DOMAIN_YD) {
      appCode = 'yd_global_e';
      appVersion = '1.3.0';
    }
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
      const res = await axios.get(portalUrl.href, axiosConfig);
      const result = res.data;
      tools.envLogPayload(result);
      if (result.code === '0000') {
        return result.data;
      } else {
        let error;
        if (result.code === '1005') {
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
    portalPath = tools.formatString(portalPath, {domain: this.authDomain});
    if (this.country === 'CN') {
      portalPath = portalPath.replace('.com','.cn');
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
    let params = {
      'todo': func
    };
    for (let key in args) {
      if (args.hasOwnProperty(key)) {
        params[key] = args[key];
      }
    }
    tools.envLogInfo(`params: ${JSON.stringify(params)}`);

    let portalUrlFormat = constants.PORTAL_ECOUSER_API;
    if (this.country === 'CN') {
      portalUrlFormat = constants.PORTAL_ECOUSER_API_CN;
    } else if ((this.country === 'WW') || (this.continent.toUpperCase() === 'WW')) {
      portalUrlFormat = constants.PORTAL_ECOUSER_API_LEGACY;
    }
    let portalUrl = tools.formatString(portalUrlFormat + "/" + loginPath, {continent: this.continent});
    let headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(params))
    };
    tools.envLogInfo(`portalUrl: '${portalUrl}'`);
    const res = await axios.post(portalUrl, params, {
      headers: headers
    });

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
    let org = 'ECOWW';
    if (this.authDomain === constants.AUTH_DOMAIN_YD) {
      org = 'ECOYDWW';
    }
    let country = this.country;
    if (this.country === 'CN') {
      org = 'ECOCN';
      if (this.authDomain === constants.AUTH_DOMAIN_YD) {
        org = 'ECOYDCN';
      }
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
  getConfigProducts() {
    return new Promise((resolve, reject) => {
      this.callPortalApi('pim/product/getConfigProducts', 'GetConfigProducts', {
        'userid': this.uid,
        'auth': {
          'with': 'users',
          'userid': this.uid,
          'realm': constants.REALM,
          'token': this.user_access_token,
          'resource': this.resource
        }
      }).then((data) => {
        resolve(data['data']);
      }).catch((e) => {
        reject(e);
      });
    });
  }

  /**
   * @param {string} api - the API path
   * @param {string} func - the API function to be called
   * @returns {Promise<Object>} a dictionary of all devices of the users Ecovacs account
   */
  async getDevices(api = constants.USER_API_PATH, func = 'GetDeviceList') {
    return new Promise((resolve, reject) => {
      this.callPortalApi(api, func, {
        'userid': this.uid,
        'auth': {
          'with': 'users',
          'userid': this.uid,
          'realm': constants.REALM,
          'token': this.user_access_token,
          'resource': this.resource
        }
      }).then((data) => {
        resolve(data['devices']);
      }).catch((e) => {
        reject(e);
      });
    });
  }

  /**
   * @returns {Promise<Object>} a dictionary of all devices of the users Ecovacs account
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
    // This is a workaround to keep compatibility
    // The device lists are not returned in the same order
    for (let deviceNumber=0; deviceNumber<deviceList.length; deviceNumber++) {
      for (let index=0; index<globalDeviceList.length; index++) {
        if (globalDeviceList[index].did === deviceList[deviceNumber].did) {
          deviceList[deviceNumber] = Object.assign(globalDeviceList[index]);
          deviceList[deviceNumber].deviceNumber = deviceNumber;
        }
      }
    }
    return deviceList;
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
   * @param {Object} vacuum - The object for the vacuum, retrieved by the `devices` dictionary
   * @returns {Object} a corresponding instance of the 'vacBot' class
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
   * @param {Object} vacuum - the object for the specific device retrieved by the devices dictionary
   * @param {string} [continent] - the continent
   * @returns {Object} a corresponding instance of the `VacBot` class
   */
  getVacBot(user, hostname, resource, userToken, vacuum, continent = '') {
    tools.envLogHeader(`getVacBot('${user}','${hostname}','${resource}','${userToken}','${vacuum}','${continent}')`);
    if (continent !== '') {
      tools.envLogWarn(`got value '${continent}' for continent (deprecated)`);
    }
    let vacBotClass;
    const defaultValue = EcovacsAPI.isMQTTProtocolUsed(vacuum['company']);
    const is950Type = EcovacsAPI.isDeviceClass950type(vacuum['class'], defaultValue);
    if (is950Type) {
      tools.envLogSuccess(`'950type' model identified`);
      vacBotClass = require('./library/950type/vacBot');
    } else {
      tools.envLogWarn(`'non950type' model identified (deprecated)`);
      vacBotClass = require('./library/non950type/vacBot');
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
   * Is the canvas module available?
   * @returns {boolean} a boolean value
   */
  getCanvasModuleIsAvailable() {
    return EcovacsAPI.isCanvasModuleAvailable();
  }

  /**
   * Is the canvas module available?
   * @returns {boolean} a boolean value
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
   * Returns true if the device class is 950 type
   * @param {string} deviceClass - The device class to check
   * @param [isMQTTProtocolUsed=true] - This value is used as default value if the deviceClass is not registered
   * @returns {boolean} the value of the '950type' property
   */
  static isDeviceClass950type(deviceClass, isMQTTProtocolUsed = true) {
    return tools.getDeviceProperty(deviceClass, '950type', isMQTTProtocolUsed);
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
    return crypto.createHash('md5').update(text).digest("hex");
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

module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.countries = countries;