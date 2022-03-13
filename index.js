'use strict';

const url = require('url');
const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const constants = require('./library/ecovacsConstants.js');
const uniqid = require('uniqid');
const tools = require('./library/tools');
const {countries} = require('./countries.json');
const packageInfo = require('./package.json');

String.prototype.format = function () {
  if (arguments.length === 0) {
    return this;
  }
  let args = arguments['0'];
  return this.replace(/{(\w+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

class EcovacsAPI {
  /**
   * @param {string} deviceId - The device ID of the bot
   * @param {string} country - The country code
   * @param {string} [continent] - The continent (deprecated)
   */
  constructor(deviceId, country, continent = '') {
    tools.envLog("[EcovacsAPI] Setting up EcovacsAPI instance");

    this.meta = {
      'country': country,
      'lang': 'EN',
      'deviceId': deviceId,
      'appCode': 'global_e',
      'appVersion': '1.6.3',
      'channel': 'google_play',
      'deviceType': '1'
    };
    this.resource = deviceId.substring(0, 8);
    this.country = country.toUpperCase();
    this.continent = continent !== '' ? continent : this.getContinent();
    this.device_id = deviceId;
  }

  /**
   * @param {string} accountId - The account ID (Email or Ecovacs ID)
   * @param {string} password_hash - The password hash
   * @returns {string}
   */
  async connect(accountId, password_hash) {
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
      'password': password_hash
    });
    this.uid = result.uid;
    this.login_access_token = result.accessToken;

    result = await this.callUserAuthApi(constants.GETAUTHCODE_PATH, {
      'uid': this.uid,
      'accessToken': this.login_access_token
    });
    this.auth_code = result['authCode'];

    result = await this.callUserApiLoginByItToken();
    this.user_access_token = result['token'];
    this.uid = result['userId'];
    tools.envLog('[EcovacsAPI] EcovacsAPI connection complete');
    return 'ready';
  }

  /**
   * Get the parameters for the user login
   * @param {Object} params - An object with the data to retrieve the parameters
   * @returns {String} the parameters
   */
  getUserLoginParams(params) {
    params['authTimeZone'] = 'GMT-8';

    let sign_on = JSON.parse(JSON.stringify(this.meta));
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        sign_on[key] = params[key];
      }
    }

    let sign_on_text = constants.CLIENT_KEY;
    let keys = Object.keys(sign_on);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      sign_on_text += k + "=" + sign_on[k];
    }
    sign_on_text += constants.SECRET;

    params['authAppkey'] = constants.CLIENT_KEY;
    params['authSign'] = EcovacsAPI.md5(sign_on_text);

    return EcovacsAPI.paramsToQueryList(params);
  }

  /**
   * Get the parameters for authentication
   * @param {Object} params - An object with the data to retrieve the parameters
   * @returns {String} the parameters
   */
  getAuthParams(params) {
    let paramsSignIn = params;
    paramsSignIn['openId'] = 'global';

    let sign_on_text = constants.AUTH_CLIENT_KEY;
    let keys = Object.keys(paramsSignIn);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      sign_on_text += k + "=" + paramsSignIn[k];
    }
    sign_on_text += constants.AUTH_CLIENT_SECRET;

    params['authAppkey'] = constants.AUTH_CLIENT_KEY;
    params['authSign'] = EcovacsAPI.md5(sign_on_text);

    return EcovacsAPI.paramsToQueryList(params);
  }

  /**
   * @param {string} loginPath - The login path
   * @param {Object} params - An object with the data to retrieve the parameters
   * @returns {Promise<Object>} an object including access token and user ID
   */
  async callUserAuthApi(loginPath, params) {
    tools.envLog(`[EcovacsAPI] Calling main api ${loginPath} with ${JSON.stringify(params)}`);
    let portalPath = this.getPortalPath(loginPath);
    let portalUrl;
    let searchParams;
    params['authTimespan'] = Date.now();
    if (loginPath === constants.GETAUTHCODE_PATH) {
      params['bizType'] = 'ECOVACS_IOT';
      params['deviceId'] = this.device_id;
      portalUrl = new url.URL((portalPath).format(this.meta));
      searchParams = new url.URLSearchParams(this.getAuthParams(params));
    } else {
      params['requestId'] = EcovacsAPI.md5(uniqid());
      portalUrl = new url.URL((portalPath + "/" + loginPath).format(this.meta));
      searchParams = new url.URLSearchParams(this.getUserLoginParams(params));
    }
    tools.envLog(`[EcoVacsAPI] callUserAuthApi calling ${portalUrl.href}`);

    const axiosConfig = {
      params: searchParams
    }
    tools.envLog(`[EcoVacsAPI] callUserAuthApi config ${searchParams.toString()}`);

    try {
      const res = await axios.get(portalUrl.href, axiosConfig);
      const result = res.data;
      tools.envLog(`[EcoVacsAPI] callUserAuthApi data: ${JSON.stringify(result)}`);
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
      tools.envLog(`[EcoVacsAPI] callUserAuthApi error: ${err}`);
      throw err;
    }
  }

  /**
   * Returns the portal path for the given login path
   * @param {string} loginPath - The path for the login
   * @returns {string} the portal path
   */
  getPortalPath(loginPath) {
    let portalPath = constants.MAIN_URL_FORMAT;
    if (loginPath === constants.GETAUTHCODE_PATH) {
      portalPath = constants.PORTAL_GLOBAL_AUTHCODE;
    }
    if (this.country === 'CN') {
      portalPath = portalPath.replace('.com','.cn');
    }
    return portalPath;
  }

  /**
   * @param {string} api - the API path
   * @param {string} func - the API function to be called
   * @param {Object} args - An object with the params for the POST request
   * @returns {Promise<Object>}
   */
  async callPortalApi(api, func, args) {
    tools.envLog("[EcovacsAPI] calling user api %s with %s", func, JSON.stringify(args));
    let params = {
      'todo': func
    };
    for (let key in args) {
      if (args.hasOwnProperty(key)) {
        params[key] = args[key];
      }
    }

    tools.envLog(`[EcoVacsAPI] continent ${this.continent}`);

    let portalUrlFormat = constants.PORTAL_URL_FORMAT;
    if (this.country === 'CN') {
      portalUrlFormat = constants.PORTAL_URL_FORMAT_CN;
    }
    let portalUrl = (portalUrlFormat + "/" + api).format({
      continent: this.continent
    });
    let headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(params))
    };
    tools.envLog(`[EcoVacsAPI] Calling ${portalUrl}`);
    const res = await axios.post(portalUrl, params, {
      headers: headers
    });

    const response = res.data;
    tools.envLog("[EcovacsAPI] got %s", JSON.stringify(response));
    if ((response['result'] !== 'ok') && (response['ret'] !== 'ok') && (response['msg'] !== 'success')) {
        tools.envLog(`[EcovacsAPI] callPortalApi failure code ${response['errno']} (${response['error']}) for call ${func} and args ${JSON.stringify(args)}`);
        throw new Error(`Failure code ${response['errno']} (${response['error']}) for call ${func}`);
    }
    return response;
  }

  /**
   * It calls the API to login by access token
   * @returns {Promise<Object>} an object including user token and user ID
   */
  callUserApiLoginByItToken() {
    let org = 'ECOWW';
    let country = this.country;
    if (this.country === 'CN') {
      org = 'ECOCN';
      country = 'Chinese';
    }
    return this.callPortalApi(constants.USERSAPI, 'loginByItToken', {
      'edition': 'ECOGLOBLE',
      'userId': this.uid,
      'token': this.auth_code,
      'realm': constants.REALM,
      'resource': this.resource,
      'org': org,
      'last': '',
      'country': country
    });
  }

  /**
   * Get the login path for the current country
   * @returns {string} The login path is being returned.
   */
  getLoginPath() {
    let loginPath = constants.LOGIN_PATH;
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
      this.callPortalApi(constants.PRODUCTAPI + '/getConfigProducts', 'GetConfigProducts', {
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
  async getDevices(api = constants.USERSAPI, func = 'GetDeviceList') {
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
    const deviceList = await this.getDevices(constants.USERSAPI, 'GetDeviceList');
    const globalDeviceList = await this.getDevices(constants.APPAPI, 'GetGlobalDeviceList');
    return this.mergeDeviceLists(deviceList, globalDeviceList);
  }

  /**
   * Merge the data from the global device list (GetGlobalDeviceList)
   * with the data from the device list (GetDeviceList) of the users Ecovacs account
   * @param deviceList - The list of devices of the Ecovacs account
   * @param globalDeviceList - The global device list returned by the API
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
    return this.getVacBot(this.uid, EcovacsAPI.REALM, this.resource, this.user_access_token, vacuum)
  }

  /**
   * Get a corresponding instance of the `vacBot` class
   * @param {String} user - The user ID (retrieved from Ecovacs API)
   * @param {String} hostname - The host name (for the Ecovacs API)
   * @param {String} resource - the resource of the vacuum
   * @param {String} userToken - The user token
   * @param {Object} vacuum - The object for the specific device retrieved by the devices dictionary
   * @returns {Object} a corresponding instance of the `vacBot` class
   */
  getVacBot(user, hostname, resource, userToken, vacuum) {
    let vacBotClass;
    const defaultValue = EcovacsAPI.isMQTTProtocolUsed(vacuum['company']);
    const is950Type = EcovacsAPI.isDeviceClass950type(vacuum['class'], defaultValue);
    if (is950Type) {
      tools.envLog('vacBot_950type identified');
      vacBotClass = require('./library/950type/vacBot');
    } else {
      tools.envLog('vacBot_non950type identified');
      vacBotClass = require('./library/non950type/vacBot');
    }
    return new vacBotClass(user, hostname, resource, userToken, vacuum, this.getContinent(), this.country);
  }

  /**
   * Get the version of the package
   * @returns {string} The version of the package
   */
  getVersion() {
    return packageInfo.version;
  }

  /**
   * Get the version of the package
   * @returns {string} The version of the package
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
   * @param {String} company
   * @returns {boolean}
   */
  static isMQTTProtocolUsed(company) {
    return (company === 'eco-ng');
  }

  /**
   * Returns true if the device class is 950 type
   * @param {String} deviceClass - The device class to check
   * @param [isMQTTProtocolUsed=true] - This value is used as default value if the deviceClass is not registered
   * @returns The value of the '950type' property
   */
  static isDeviceClass950type(deviceClass, isMQTTProtocolUsed = true) {
    return tools.getDeviceProperty(deviceClass, '950type', isMQTTProtocolUsed);
  }

  /**
   * Returns true if the device class is not 950 type
   * @param {String} deviceClass - The device class of the device
   * @returns A boolean value.
   */
  static isDeviceClassNot950type(deviceClass) {
    return (!EcovacsAPI.isDeviceClass950type(deviceClass));
  }

  /**
   * Given a machine id and a device number, return the device ID
   * @param {String} machineId - The id of the device
   * @param {Number} [deviceNumber=0] - The device number is a number that is assigned to each device
   * @returns {String} the device ID
   */
  static getDeviceId(machineId, deviceNumber = 0) {
    return EcovacsAPI.md5(machineId + deviceNumber.toString());
  }

  /**
   * Create a hash of the given text using the MD5 algorithm
   * @param {String} text - The text to be hashed
   * @returns {String} The MD5 hash of the text
   */
  static md5(text) {
    return crypto.createHash('md5').update(text).digest("hex");
  }

  /**
   * It takes a string and encrypts it using the public key
   * @param {String} text - The text to encrypt
   * @returns {String} The encrypted string
   */
  static encrypt(text) {
    return crypto.publicEncrypt({
      key: EcovacsAPI.PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(text)).toString('base64');
  }

  /**
   * Given a dictionary of parameters, return a string of the form "key1=value1&key2=value2&key3=value3"
   * @param {Object} params - The parameters to be encoded
   * @returns {String} A string of the form "key1=value1&key2=value2&key3=value3"
   */
  static paramsToQueryList(params) {
    let query = [];
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        query.push(key + "=" + encodeURIComponent(params[key]));
      }
    }
    return query.join('&');
  }
}

EcovacsAPI.PUBLIC_KEY = fs.readFileSync(__dirname + "/key.pem", "utf8");
EcovacsAPI.REALM = constants.REALM;

module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.countries = countries;