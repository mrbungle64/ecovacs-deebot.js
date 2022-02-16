'use strict';

const url = require('url');
const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const constants = require('./library/ecovacsConstants.js');
const uniqid = require('uniqid');
const tools = require('./library/tools.js');
const countries = require('./countries.js');
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
  constructor(device_id, country, continent = '') {
    tools.envLog("[EcovacsAPI] Setting up EcovacsAPI");

    this.meta = {
      'country': country,
      'lang': 'EN',
      'deviceId': device_id,
      'appCode': 'global_e',
      'appVersion': '1.6.3',
      'channel': 'google_play',
      'deviceType': '1'
    };
    this.resource = device_id.substr(0, 8);
    this.country = country.toUpperCase();
    this.continent = continent !== '' ? continent : this.getContinent();
    this.device_id = device_id;
  }

  async connect(account_id, password_hash) {
    let error;
    if (!account_id) {
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

    let login_path = constants.LOGIN_PATH;
    if (this.country === 'CN') {
      login_path = `${login_path}CheckMobile`;
    }

    let result = await this.callUserAuthApi(login_path, {
      'account': account_id,
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
    tools.envLog("[EcovacsAPI] EcovacsAPI connection complete");
    return "ready";
  }

  getUserLoginParams(params) {
    let result = JSON.parse(JSON.stringify(params));
    result['authTimespan'] = Date.now();
    result['authTimeZone'] = 'GMT-8';

    let sign_on = JSON.parse(JSON.stringify(this.meta));
    for (let key in result) {
      if (result.hasOwnProperty(key)) {
        sign_on[key] = result[key];
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

    result['authAppkey'] = constants.CLIENT_KEY;
    result['authSign'] = EcovacsAPI.md5(sign_on_text);

    return EcovacsAPI.paramsToQueryList(result);
  }

  getAuthParams(params) {
    let result = JSON.parse(JSON.stringify(params));
    result['authTimespan'] = Date.now();

    let paramsSignIn = JSON.parse(JSON.stringify(result));
    paramsSignIn['openId'] = 'global';

    let sign_on_text = constants.AUTH_CLIENT_KEY;
    let keys = Object.keys(paramsSignIn);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      sign_on_text += k + "=" + paramsSignIn[k];
    }
    sign_on_text += constants.AUTH_CLIENT_SECRET;

    result['authAppkey'] = constants.AUTH_CLIENT_KEY;
    result['authSign'] = EcovacsAPI.md5(sign_on_text);

    return EcovacsAPI.paramsToQueryList(result);
  }

  async callUserAuthApi(loginPath, params) {
    tools.envLog(`[EcovacsAPI] Calling main api ${loginPath} with ${JSON.stringify(params)}`);
    let portalPath = this.getPortalPath(loginPath);
    let portalUrl;
    let searchParams;
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

  async getDevices(api = constants.USERSAPI, todo = 'GetDeviceList') {
    return new Promise((resolve, reject) => {
      this.callPortalApi(api, todo, {
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

  async devices() {
    const deviceList = await this.getDevices(constants.USERSAPI, 'GetDeviceList');
    const globalDeviceList = await this.getDevices(constants.APPAPI, 'GetGlobalDeviceList');
    return this.mergeDeviceLists(deviceList, globalDeviceList);
  }

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

  getAllKnownDevices() {
    return tools.getAllKnownDevices();
  }

  getCountryName() {
    if (countries[this.country]) {
      return countries[this.country].name;
    }
    return 'unknown';
  }

  getContinent() {
    if (countries[this.country]) {
      return countries[this.country].continent.toLowerCase();
    }
    return 'ww';
  }

  getVacBotObj(vacuum) {
    return this.getVacBot(this.uid, EcovacsAPI.REALM, this.resource, this.user_access_token, vacuum, this.getContinent())
  }

  getVacBot(user, hostname, resource, secret, vacuum, continent) {
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
    return new vacBotClass(user, hostname, resource, secret, vacuum, continent, this.country);
  }

  getVersion() {
    return packageInfo.version;
  }

  static version() {
    return packageInfo.version;
  }

  getCanvasModuleIsAvailable() {
    return EcovacsAPI.isCanvasModuleAvailable();
  }

  static isCanvasModuleAvailable() {
    return tools.isCanvasModuleAvailable();
  }

  static isMQTTProtocolUsed(company) {
    return (company === 'eco-ng');
  }

  static isDeviceClass950type(deviceClass, isMQTTProtocolUsed = true) {
    return tools.getDeviceProperty(deviceClass, '950type', isMQTTProtocolUsed);
  }

  static isDeviceClassNot950type(deviceClass) {
    return (!EcovacsAPI.isDeviceClass950type(deviceClass));
  }

  static getDeviceId(machineId, deviceNumber = 0) {
    return EcovacsAPI.md5(machineId + deviceNumber.toString());
  }

  static md5(text) {
    return crypto.createHash('md5').update(text).digest("hex");
  }

  static encrypt(text) {
    return crypto.publicEncrypt({
      key: EcovacsAPI.PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(text)).toString('base64');
  }

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
