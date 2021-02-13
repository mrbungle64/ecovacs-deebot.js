const https = require('https');
const URL = require('url').URL;
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
  constructor(device_id, country, continent) {
    tools.envLog("[EcovacsAPI] Setting up EcovacsAPI");

    if (!device_id) {
      throw "No Device ID provided";
    }
    if (!country) {
      throw "No Country code provided";
    }
    if (!continent) {
      throw "No Continent provided";
    }

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
    this.country = country;
    this.continent = continent;
    this.device_id = device_id;
  }

  connect(account_id, password_hash) {
    return new Promise((resolve, reject) => {
      let login_info = null;
      let login_path = 'user/login';
      if (this.country.toLowerCase() === 'cn') {
        login_path = 'user/loginCheckMobile';
      }
      this.call_main_api(login_path, {
        'account': account_id,
        'password': password_hash
      }).then((info) => {
        login_info = info;
        this.uid = login_info.uid;
        this.login_access_token = login_info.accessToken;
        this.call_main_api('user/getAuthCode', {
          'uid': this.uid,
          'accessToken': this.login_access_token
        }).then((token) => {
          this.auth_code = token['authCode'];
          this.call_login_by_it_token().then((login) => {
            this.user_access_token = login['token'];
            this.uid = login['userId'];
            tools.envLog("[EcovacsAPI] EcovacsAPI connection complete");
            resolve("ready");
          }).catch((e) => {
            tools.envLog("[EcovacsAPI] %s calling __call_login_by_it_token()", e.message);
            reject(e);
          });
        }).catch((e) => {
          tools.envLog("[EcovacsAPI] %s calling __call_main_api('user/getAuthCode', {...})", e.message);
          reject(e);
        });
      }).catch((e) => {
        tools.envLog("[EcovacsAPI] %s calling __call_main_api('user/login', {...})", e.message);
        reject(e);
      });
    });
  }

  sign(params) {
    let result = JSON.parse(JSON.stringify(params));
    result['authTimespan'] = Date.now();
    result['authTimeZone'] = 'GMT-8';

    let sign_on = JSON.parse(JSON.stringify(this.meta));
    for (let key in result) {
      if (result.hasOwnProperty(key)) {
        sign_on[key] = result[key];
      }
    }

    let sign_on_text = EcovacsAPI.CLIENT_KEY;
    let keys = Object.keys(sign_on);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      sign_on_text += k + "=" + sign_on[k];
    }
    sign_on_text += EcovacsAPI.SECRET;

    result['authAppkey'] = EcovacsAPI.CLIENT_KEY;
    result['authSign'] = EcovacsAPI.md5(sign_on_text);

    return EcovacsAPI.paramsToQueryList(result);
  }

  signAuth(params) {
    let result = JSON.parse(JSON.stringify(params));
    result['authTimespan'] = Date.now();

    let paramsSignIn = JSON.parse(JSON.stringify(result));
    paramsSignIn['openId'] = 'global';

    let sign_on_text = EcovacsAPI.AUTH_CLIENT_KEY;
    let keys = Object.keys(paramsSignIn);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      sign_on_text += k + "=" + paramsSignIn[k];
    }
    sign_on_text += EcovacsAPI.AUTH_CLIENT_SECRET;

    result['authAppkey'] = EcovacsAPI.AUTH_CLIENT_KEY;
    result['authSign'] = EcovacsAPI.md5(sign_on_text);

    return EcovacsAPI.paramsToQueryList(result);
  }

  call_main_api(loginPath, args) {
    return new Promise((resolve, reject) => {
      tools.envLog("[EcovacsAPI] calling main api %s with %s", loginPath, JSON.stringify(args));
      let params = {};
      for (let key in args) {
        if (args.hasOwnProperty(key)) {
          params[key] = args[key];
        }
      }
      let mainUrlFormat = EcovacsAPI.MAIN_URL_FORMAT;
      if (loginPath === 'user/getAuthCode') {
        mainUrlFormat = EcovacsAPI.PORTAL_GLOBAL_AUTHCODE;
        params['bizType'] = 'ECOVACS_IOT';
        params['deviceId'] = this.device_id;
      } else {
        params['requestId'] = EcovacsAPI.md5(uniqid());
      }
      if (this.country.toLowerCase() === 'cn') {
        mainUrlFormat = mainUrlFormat.replace('.com','.cn');
      }
      let url;
      if (loginPath === 'user/getAuthCode') {
        url = new URL((mainUrlFormat).format(this.meta));
        url.search = this.signAuth(params).join('&');
      } else {
        url = new URL((mainUrlFormat + "/" + loginPath).format(this.meta));
        url.search = this.sign(params).join('&');
      }
      tools.envLog(`[EcoVacsAPI] call_main_api calling ${url.href}`);

      https.get(url.href, (res) => {
        const {
          statusCode
        } = res;

        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' +
            `Status Code: ${statusCode}`);
        }
        if (error) {
          tools.envLog("[EcovacsAPI] " + error.message);
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(rawData);
            tools.envLog("[EcovacsAPI] got %s", JSON.stringify(json));
            if (json.code === '0000') {
              resolve(json.data);
            } else if (json.code === '1005') {
              tools.envLog("[EcovacsAPI] incorrect email or password");
              throw new Error("incorrect email or password");
            } else if (json.code === '0002') {
              throw new Error("Failure code 0002");
            } else {
              tools.envLog("[EcovacsAPI] call to %s failed with %s", loginPath, JSON.stringify(json));
              throw new Error("Failure code {msg} ({code}) for call {func} and parameters {param}".format({
                msg: json['msg'],
                code: json['code'],
                loginPath: loginPath,
                param: JSON.stringify(args)
              }));
            }
          } catch (e) {
            tools.envLog("[EcovacsAPI] " + e.message);
            reject(e);
          }
        });
      }).on('error', (e) => {
        tools.envLog(`[EcoVacsAPI] Got error: ${e.message}`);
        reject(e);
      });
    });
  }

  call_portal_api(api, func, args) {
    return new Promise((resolve, reject) => {
      tools.envLog("[EcovacsAPI] calling user api %s with %s", func, JSON.stringify(args));
      let params = {
        'todo': func
      };
      for (let key in args) {
        if (args.hasOwnProperty(key)) {
          params[key] = args[key];
        }
      }

      let continent = this.continent;
      tools.envLog(`[EcoVacsAPI] continent ${this.continent}`);
      if (arguments.hasOwnProperty('continent')) {
        continent = arguments.continent;
      }
      tools.envLog(`[EcoVacsAPI] continent ${continent}`);

      let retryAttempts = 0;
      if (arguments.hasOwnProperty('retryAttempts')) {
        retryAttempts = arguments.retryAttempts + 1;
      }

      let portalUrlFormat = EcovacsAPI.PORTAL_URL_FORMAT;
      if (this.country.toLowerCase() === 'cn') {
        portalUrlFormat = EcovacsAPI.PORTAL_URL_FORMAT_CN;
      }
      let url = (portalUrlFormat + "/" + api).format({
        continent: continent
      });
      url = new URL(url);
      tools.envLog(`[EcoVacsAPI] Calling ${url.href}`);

      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(params))
        }
      };
      tools.envLog("[EcovacsAPI] Sending POST to", JSON.stringify(reqOptions));

      const req = https.request(reqOptions, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(rawData);
            tools.envLog("[EcovacsAPI] got %s", JSON.stringify(json));
            tools.envLog("[EcovacsAPI] result: %s", json['result']);
            if (json['result'] === 'ok') {
              resolve(json);
            } else if (json['result'] === 'fail') {
              // If it is a set token error try again
              if (json['error'] === 'set token error.') {
                if (retryAttempts <= 3) {
                  tools.envLog("[EcovacsAPI] loginByItToken set token error, trying again (%s/3)", retryAttempts);
                  return this.call_portal_api(api, func, args, retryAttempts);
                } else {
                  tools.envLog("[EcovacsAPI] loginByItToken set token error, failed after %s attempts", retryAttempts);
                }
              } else {
                tools.envLog("[EcovacsAPI] call to %s failed with %s", func, JSON.stringify(json));
                throw "failure code {errno} ({error}) for call {func} and parameters {params}".format({
                  errno: json['errno'],
                  error: json['error'],
                  func: func,
                  params: JSON.stringify(args)
                });
              }
            }
          } catch (e) {
            tools.envLog("[EcovacsAPI] " + e.message);
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        tools.envLog(`[EcoVacsAPI] problem with request: ${e.message}`);
        reject(e);
      });

      // write data to request body
      tools.envLog("[EcovacsAPI] Sending", JSON.stringify(params));
      req.write(JSON.stringify(params));
      req.end();
    });
  }

  call_login_by_it_token() {
    let org = 'ECOWW';
    let country = this.country.toUpperCase();
    if (this.country.toLowerCase() === 'cn') {
      org = 'ECOCN';
      country = 'Chinese';
    }
    return this.call_portal_api(EcovacsAPI.USERSAPI, 'loginByItToken', {
      'edition': 'ECOGLOBLE',
      'userId': this.uid,
      'token': this.auth_code,
      'realm': EcovacsAPI.REALM,
      'resource': this.resource,
      'org': org,
      'last': '',
      'country': country
    });
  }

  getDevices() {
    return new Promise((resolve, reject) => {
      this.call_portal_api(EcovacsAPI.USERSAPI, 'GetDeviceList', {
        'userid': this.uid,
        'auth': {
          'with': 'users',
          'userid': this.uid,
          'realm': EcovacsAPI.REALM,
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

  devices() {
    return this.getDevices();
  }

  getVacBot(user, hostname, resource, secret, vacuum, continent, server_address = null) {
    let vacbot;
    if (tools.is950type(vacuum['class'])) {
      tools.envLog('vacBot_950type identified');
      const VacBot_950type = require('./library/vacBot_950type');
      vacbot = new VacBot_950type(user, hostname, resource, secret, vacuum, continent, this.country);
    } else {
      tools.envLog('vacBot_non950type identified');
      const VacBot_non950type = require('./library/vacBot_non950type');
      vacbot = new VacBot_non950type(user, hostname, resource, secret, vacuum, continent, this.country);
    }
    return vacbot;
  }

  getVersion() {
    return packageInfo.version;
  }

  static version() {
    return packageInfo.version;
  }

  static isCanvasModuleAvailable() {
    return tools.isCanvasModuleAvailable();
  }

  static isDeviceClass950type(deviceClass) {
    return tools.is950type(deviceClass);
  }

  static isDeviceClassNot950type(deviceClass) {
    return (!tools.is950type(deviceClass));
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
    return query;
  }
}

EcovacsAPI.CLIENT_KEY = constants.CLIENT_KEY;
EcovacsAPI.SECRET = constants.SECRET;
EcovacsAPI.AUTH_CLIENT_KEY = constants.AUTH_CLIENT_KEY;
EcovacsAPI.AUTH_CLIENT_SECRET = constants.AUTH_CLIENT_SECRET;
EcovacsAPI.PUBLIC_KEY = fs.readFileSync(__dirname + "/key.pem", "utf8");

EcovacsAPI.MAIN_URL_FORMAT = constants.MAIN_URL_FORMAT;
EcovacsAPI.USER_URL_FORMAT = constants.USER_URL_FORMAT;
EcovacsAPI.PORTAL_URL_FORMAT = constants.PORTAL_URL_FORMAT;
EcovacsAPI.PORTAL_URL_FORMAT_CN = constants.PORTAL_URL_FORMAT_CN;
EcovacsAPI.PORTAL_GLOBAL_AUTHCODE = constants.PORTAL_GLOBAL_AUTHCODE;
EcovacsAPI.USERSAPI = constants.USERSAPI;

// IOT Device Manager - This provides control of "IOT" products via RestAPI, some bots use this instead of XMPP
EcovacsAPI.IOTDEVMANAGERAPI = constants.IOTDEVMANAGERAPI;
EcovacsAPI.LGLOGAPI = constants.LGLOGAPI;
// Leaving this open, the only endpoint known currently is "Product IOT Map" -  pim/product/getProductIotMap - This provides a list of "IOT" products.  Not sure what this provides the app.
EcovacsAPI.PRODUCTAPI = constants.PRODUCTAPI;

EcovacsAPI.REALM = constants.REALM;

module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.countries = countries;
