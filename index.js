const https = require('https'),
  URL = require('url').URL,
  crypto = require('crypto'),
  fs = require('fs'),
  vacBotCommand = require('./library/vacBotCommand.js'),
  constants = require('./library/ecovacsConstants.js'),
  vacBotCommand950 = require('./library/vacBotCommand950.js'),
  
  tools = require('./library/tools.js'),
  countries = require('./countries.js');

String.prototype.format = function () {
  if (arguments.length === 0) {
    return this;
  }
  var args = arguments['0'];
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
      'lang': 'en',
      'deviceId': device_id,
      'appCode': 'i_eco_e',
      'appVersion': '1.3.5',
      'channel': 'c_googleplay',
      'deviceType': '1'
    };
    this.resource = device_id.substr(0, 8);
    this.country = country;
    this.continent = continent;
  }

  connect(account_id, password_hash) {
    return new Promise((resolve, reject) => {
      let login_info = null;
      this.__call_main_api('user/login', {
        'account': EcovacsAPI.encrypt(account_id),
        'password': EcovacsAPI.encrypt(password_hash)
      }).then((info) => {
        login_info = info;
        this.uid = login_info.uid;
        this.login_access_token = login_info.accessToken;
        this.__call_main_api('user/getAuthCode', {
          'uid': this.uid,
          'accessToken': this.login_access_token
        }).then((token) => {
          this.auth_code = token['authCode'];
          this.__call_login_by_it_token().then((login) => {
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

  __sign(params) {
    let result = JSON.parse(JSON.stringify(params));
    result['authTimespan'] = Date.now();
    result['authTimeZone'] = 'GMT-8';

    let sign_on = JSON.parse(JSON.stringify(this.meta));
    for (var key in result) {
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

  __call_main_api(func, args) {
    return new Promise((resolve, reject) => {
      tools.envLog("[EcovacsAPI] calling main api %s with %s", func, JSON.stringify(args));
      let params = {};
      for (var key in args) {
        if (args.hasOwnProperty(key)) {
          params[key] = args[key];
        }
      }
      params['requestId'] = EcovacsAPI.md5(Number.parseFloat(Date.now() / 1000).toFixed(0));
      let url = (EcovacsAPI.MAIN_URL_FORMAT + "/" + func).format(this.meta);
      url = new URL(url);
      url.search = this.__sign(params).join('&');
      tools.envLog(`[EcoVacsAPI] Calling ${url.href}`);

      https.get(url.href, (res) => {
        const {
          statusCode
        } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' +
            `Status Code: ${statusCode}`);
        }
        if (error) {
          console.error("[EcovacsAPI] " + error.message);
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
              tools.envLog("[EcovacsAPI] call to %s failed with %s", func, JSON.stringify(json));
              throw new Error("Failure code {msg} ({code}) for call {func} and parameters {param}".format({
                msg: json['msg'],
                code: json['code'],
                func: func,
                param: JSON.stringify(args)
              }));
            }
          } catch (e) {
            console.error("[EcovacsAPI] " + e.message);
            reject(e);
          }
        });
      }).on('error', (e) => {
        console.error(`[EcoVacsAPI] Got error: ${e.message}`);
        reject(e);
      });
    });
  }

  __call_portal_api(api, func, args) {
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

      let url = (EcovacsAPI.PORTAL_URL_FORMAT + "/" + api).format({
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
                  return this.__call_portal_api(api, func, args, retryAttempts);
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
            console.error("[EcovacsAPI] " + e.message);
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[EcoVacsAPI] problem with request: ${e.message}`);
        reject(e);
      });

      // write data to request body
      tools.envLog("[EcovacsAPI] Sending", JSON.stringify(params));
      req.write(JSON.stringify(params));
      req.end();
    });
  }

  __call_login_by_it_token() {
    return this.__call_portal_api(EcovacsAPI.USERSAPI, 'loginByItToken', {
      'country': this.meta['country'].toUpperCase(),
      'resource': this.resource,
      'realm': EcovacsAPI.REALM,
      'userId': this.uid,
      'token': this.auth_code
    });
  }

  getDevices() {
    return new Promise((resolve, reject) => {
      this.__call_portal_api(EcovacsAPI.USERSAPI, 'GetDeviceList', {
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

  static md5(text) {
    return crypto.createHash('md5').update(text).digest("hex");
  }

  static encrypt(text) {
    return crypto.publicEncrypt({
      key: EcovacsAPI.PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, new Buffer(text)).toString('base64');
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

EcovacsAPI.CLIENT_KEY = "eJUWrzRv34qFSaYk";
EcovacsAPI.SECRET = "Cyu5jcR4zyK6QEPn1hdIGXB5QIDAQABMA0GC";
EcovacsAPI.PUBLIC_KEY = fs.readFileSync(__dirname + "/key.pem", "utf8");

EcovacsAPI.MAIN_URL_FORMAT = constants.MAIN_URL_FORMAT;
EcovacsAPI.USER_URL_FORMAT = constants.USER_URL_FORMAT;
EcovacsAPI.PORTAL_URL_FORMAT = constants.PORTAL_URL_FORMAT;
EcovacsAPI.USERSAPI = constants.USERSAPI;

// IOT Device Manager - This provides control of "IOT" products via RestAPI, some bots use this instead of XMPP
EcovacsAPI.IOTDEVMANAGERAPI = constants.IOTDEVMANAGERAPI;
EcovacsAPI.LGLOGAPI = constants.LGLOGAPI;
// Leaving this open, the only endpoint known currently is "Product IOT Map" -  pim/product/getProductIotMap - This provides a list of "IOT" products.  Not sure what this provides the app.
EcovacsAPI.PRODUCTAPI = constants.PRODUCTAPI;

EcovacsAPI.REALM = constants.REALM;

class VacBot {
  constructor(user, hostname, resource, secret, vacuum, continent, server_address = null) {
    this.vacuum = vacuum;
    this.vacuum_status = null;
    this.clean_status = null;
    this.deebot_position = {
      x: null,
      y: null,
      a: null,
      invalid: 0
    };
    this.charge_position = {
      x: null,
      y: null,
      a: null
    };
    this.fan_speed = null;
    this.charge_status = null;
    this.battery_status = null;
    this.water_level = null;
    this.waterbox_info = null;
    this.components = {};
    this.ping_interval = null;
    this.error_event = null;
    this.ecovacs = null;
    this.useMqtt = (vacuum['company'] === 'eco-ng') ? true : false;
    this.deviceClass = vacuum['class'];

    if (!this.useMqtt) {
      tools.envLog("[VacBot] Using EcovacsXMPP");
      const EcovacsXMPP = require('./library/ecovacsXMPP.js');
      this.ecovacs = new EcovacsXMPP(this, user, hostname, resource, secret, continent, vacuum, server_address);
    } else {
      tools.envLog("[VacBot] Using EcovacsIOTMQ");
      const EcovacsMQTT = require('./library/ecovacsMQTT.js');
      this.ecovacs = new EcovacsMQTT(this, user, hostname, resource, secret, continent, vacuum, server_address);
    }

    this.ecovacs.on("ready", () => {
      tools.envLog("[VacBot] Ready event!");
      this.run('GetBatteryState');
      this.run('GetCleanState');
      this.run('GetChargeState');
      if (this.hasMainBrush()) {
        this.run('GetLifeSpan', 'main_brush');
      }
      this.run('GetLifeSpan', 'side_brush');
      this.run('GetLifeSpan', 'filter');
      if (this.hasMoppingSystem()) {
        this.run('GetWaterLevel');
      }
    });
  }

  isOzmo950() {
    tools.envLog("[VacBot] deviceClass: %s", this.deviceClass);
    if (this.deviceClass === 'yna5xi') {
      tools.envLog("[VacBot] Ozmo 950 detected");
      return true;
    }
    return false;
  }

  isSupportedDevice() {
    const devices = JSON.parse(JSON.stringify(getSupportedDevices()));
    return devices.hasOwnProperty(this.deviceClass);
  }

  isKnownDevice() {
    const devices = JSON.parse(JSON.stringify(getKnownDevices()));
    return devices.hasOwnProperty(this.deviceClass) || this.isSupportedDevice();
  }

  getDeviceProperty(property) {
    const devices = JSON.parse(JSON.stringify(getAllKnownDevices()));
    if (devices.hasOwnProperty(this.deviceClass)) {
      const device = devices[this.deviceClass];
      if (device.hasOwnProperty(property)) {
        return device[property];
      }
    }
    return false;
  }

  hasMainBrush() {
    return this.getDeviceProperty('main_brush');
  }

  hasSpotAreas() {
    return this.getDeviceProperty('spot_area');
  }

  hasCustomAreas() {
    return this.getDeviceProperty('custom_area');
  }

  hasMoppingSystem() {
    return this.getDeviceProperty('mopping_system');
  }

  hasVoiceReports() {
    return this.getDeviceProperty('voice_report');
  }

  connect_and_wait_until_ready() {
    this.ecovacs.connect_and_wait_until_ready();
    this.ping_interval = setInterval(() => {
      this.ecovacs.send_ping(this._vacuum_address());
    }, 30000);
  }

  on(name, func) {
    this.ecovacs.on(name, func);
  }

  _handle_life_span(event) {
    let type = null;
    // Deebot Ozmo 950
    if (event.hasOwnProperty('body')) {
      let response = event['body']['data'][0];
      type = response['type'];
    } else if (event.hasOwnProperty('type')) {
      type = event['type'];
    }

    try {
      type = constants.COMPONENT_FROM_ECOVACS[type];
    } catch (e) {
      console.error("[VacBot] Unknown component type: ", event);
    }

    if (!type) {
      return;
    }

    let lifespan = null;
    if ((event.hasOwnProperty('val')) && (event.hasOwnProperty('total'))) {
      lifespan = parseInt(event['val']) / parseInt(event['total']) * 100;
    } else if (event.hasOwnProperty('val')) {
      lifespan = parseInt(event['val']) / 100;
    } else if (event.hasOwnProperty('left') && (event.hasOwnProperty('total'))) {
      lifespan = parseInt(event['left']) / parseInt(event['total']) * 100; // This works e.g. for a Ozmo 930
    } else if (event.hasOwnProperty('left')) {
      lifespan = parseInt(event['left']) / 60; // This works e.g. for a D901
    }
    if (lifespan) {
      tools.envLog("[VacBot] lifespan %s: %s", type, lifespan);
      this.components[type] = lifespan;
    }
    tools.envLog("[VacBot] lifespan components: ", this.components.toString());
  }

  _handle_deebot_position(event) {
        // Deebot Ozmo 950
        if (event.hasOwnProperty('body')) {
          let response = event['body']['data'];

          //as deebotPos and chargePos can also appear in other messages (CleanReport)
          //the handling should be extracted to a seperate function

          this.deebot_position = {
            x:response['deebotPos']['x'], 
            y:response['deebotPos']['y'], 
            a:response['deebotPos']['a'], 
            invalid:response['deebotPos']['invalid']
          };
          tools.envLog("[VacBot] *** Deebot Position = "
            + 'x=' + this.deebot_position.x
            + ' y=' + this.deebot_position.y
            + ' a=' + this.deebot_position.a
            + ' invalid=' + this.deebot_position.invalid
          );
          
          if(response['chargePos']) { //is only available in some DeebotPosition messages (e.g. on start cleaning)
            //there can be more than one charging station only handles first charging station
            this.charge_position = { 
              x:response['chargePos'][0]['x'], 
              y:response['chargePos'][0]['y'], 
              a:response['chargePos'][0]['a']
            };
            tools.envLog("[VacBot] *** Charge Position = "
              + 'x=' + this.charge_position.x
              + ' y=' + this.charge_position.y
              + ' a=' + this.charge_position.a
            );
          }
          return;
        }
        if (event) {
          tools.envLog("[VacBot] _handle_deebot_position currently not supported for this model");
        } else {
          console.error("[VacBot] _handle_deebot_position event undefined");
        }
  }

  _handle_clean_report(event) {
    // Deebot Ozmo 950
    if (event.hasOwnProperty('body')) {
      let response = event['body']['data'];
      if (response['state'] === 'clean') {
        if (response['trigger'] === 'app') {
          if (response['cleanState']['motionState'] === 'working') {
            this.vacuum_status = 'cleaning';
          } else if (response['cleanState']['motionState'] === 'pause') {
            this.vacuum_status = 'paused';
          } else {
            this.vacuum_status = 'returning';
          }
        } else if (response['trigger'] === 'alert') {
          this.vacuum_status = 'error';
        }
      }
      this.clean_status = this.vacuum_status;
      return;
    }
    if (event) {
      let type = event.attrs['type'];
      try {
        type = constants.CLEAN_MODE_FROM_ECOVACS[type];
        let statustype = constants.CLEAN_ACTION_FROM_ECOVACS[event.attrs['st']];
        if (statustype === 'stop' || statustype === 'pause') {
          type = statustype
        }
      } catch (e) {
        console.error("[VacBot] Unknown cleaning status: ", event);
      }
      this.clean_status = type;
      tools.envLog("[VacBot] *** clean_status = " + this.clean_status);
      this.vacuum_status = type;

      let fan = null;
      if (event.attrs.hasOwnProperty('speed')) {
        fan = event.attrs['speed'];
      }
      tools.envLog("[VacBot] fan: ", fan);
      if (fan !== null) {
        try {
          fan = constants.FAN_SPEED_FROM_ECOVACS[fan];
          this.fan_speed = fan;
          tools.envLog("[VacBot] fan speed: ", fan);
        } catch (e) {
          console.error("[VacBot] Unknown fan speed: ", fan);
        }
      }
    } else {
      console.error("[VacBot] _handle_clean_report event undefined");
    }
  }

  _handle_battery_info(event) {
    let value = null;
    // Deebot Ozmo 950
    if (event.hasOwnProperty('body')) {
      value = event['body']['data']['value'];
    } else if (event.hasOwnProperty('ctl')) {
      value = event['ctl']['battery']['power'];
    } else {
      value = parseFloat(event.attrs['power']);
    }
    try {
      this.battery_status = value;
      tools.envLog("[VacBot] *** battery_status = %d\%", this.battery_status);
    } catch (e) {
      console.error("[VacBot] couldn't parse battery status ", event);
    }
  }

  _handle_water_level(event) {

    // Deebot Ozmo 950
    if (event.hasOwnProperty('body')) {
      this.water_level = event['body']['data']['amount'];
    } else {
      this.water_level = event.attrs['v'];
    }
    tools.envLog("[VacBot] *** water_level = " + constants.WATER_LEVEL_FROM_ECOVACS[this.water_level] + " (" + this.water_level + ")");
  }

  _handle_waterbox_info(val) {
      this.waterbox_info = val;
      tools.envLog("[VacBot] *** waterbox_info = " + this.waterbox_info);
  }

  _handle_charge_state(event) {
    // Deebot Ozmo 950
    if (event.hasOwnProperty('body')) {
      let response = event['body'];
      let status = null;
      if (response['code'] == '0') {
        if (response['data']['isCharging'] == '1') {
          status = 'docked';
        }
      } else {
        if ((response['msg'] === 'fail') && (response['code'] == '30007')) {
          // Already charging
          status = 'docked';
        } else if ((response['msg'] === 'fail') && (response['code'] == '5')) {
          // Busy with another command
          status = 'error';
        } else if ((response['msg'] === 'fail') && (response['code'] == '3')) {
          // Bot in stuck state, example dust bin out
          status = 'error';
        }
      }
      if (status) {
        this.charge_status = status;
      }
      return;
    }

    try {
      if (event.name !== "charge") {
        throw "Not a charge state";
      }
      let report = event.attrs['type'];
      switch (report.toLowerCase()) {
        case "going":
          this.charge_status = 'returning';
          break;
        case "slotcharging":
          this.charge_status = 'charging';
          break;
        case "idle":
          this.charge_status = 'idle';
          break;
        default:
          console.error("[VacBot] Unknown charging status '%s'", report);
          break;
      }
      tools.envLog("[VacBot] *** charge_status = " + this.charge_status)
    } catch (e) {
      console.error("[VacBot] couldn't parse charge status ", event);
    }
  }

  _handle_error(event) {
    if (event.hasOwnProperty('error')) {
      this.error_event = event['error'];
    } else if (event.hasOwnProperty('errs')) {
      this.error_event = event['errs'];
    }
  }

  _vacuum_address() {
    if (!this.useMqtt) {
      return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
    } else {
      return this.vacuum['did'];
    }
  }

  send_command(action) {
    tools.envLog("[VacBot] Sending command `%s`", action.name);
    if (!this.useMqtt) {
      this.ecovacs.send_command(action.to_xml(), this._vacuum_address());
    } else {
      // IOTMQ issues commands via RestAPI, and listens on MQTT for status updates
      // IOTMQ devices need the full action for additional parsing
      this.ecovacs.send_command(action, this._vacuum_address());
    }
  }

  send_ping() {
    try {
      if (!this.useMqtt) {
        this.ecovacs.send_ping(this._vacuum_address());
      } else if (this.useMqtt) {
        if (!this.ecovacs.send_ping()) {
          throw new Error("Ping did not reach VacBot");
        }
      }
    } catch (e) {
      throw new Error("Ping did not reach VacBot");
    }
  }

  run(action) {
    tools.envLog("[VacBot] action: %s", action);

    if(this.isOzmo950() ) {
      switch (action.toLowerCase()) {
        case "clean":
          if (arguments.length <= 1) {
            this.send_command(new vacBotCommand950.Clean());
          } else if (arguments.length === 2) {
            this.send_command(new vacBotCommand950.Clean(arguments[1]));
          } else {
            this.send_command(new vacBotCommand950.Clean(arguments[1], arguments[2]));
          }
          break;
        case "edge":
          this.send_command(new vacBotCommand950.Edge());
          break;
        case "spot":
          this.send_command(new vacBotCommand950.Spot());
          break;
        case "spotarea":
          if (arguments.length < 3) {
            return;
          }
          this.send_command(new vacBotCommand950.SpotArea(arguments[1], arguments[2]));
          break;
        case "customarea":
          if (arguments.length < 4) {
            return;
          }
          this.send_command(new vacBotCommand950.CustomArea(arguments[1], arguments[2], arguments[3]));
          break;
        case "stop":
          this.send_command(new vacBotCommand950.Stop());
          break;
        case "pause":
          this.send_command(new vacBotCommand950.Pause());
          break;
        case "charge":
          this.send_command(new vacBotCommand950.Charge());
          break;
        case "playsound":
          this.send_command(new vacBotCommand950.PlaySound());
          break;
        case "getdeviceinfo":
        case "deviceinfo":
          this.send_command(new vacBotCommand950.GetDeviceInfo());
          break;
        case "getcleanstate":
        case "cleanstate":
          this.send_command(new vacBotCommand950.GetCleanState());
          break;
        case "getcleanspeed":
        case "cleanspeed":
          this.send_command(new vacBotCommand950.GetCleanSpeed());
          break;
        case "getchargestate":
        case "chargestate":
          this.send_command(new vacBotCommand950.GetChargeState());
          break;
        case "getbatterystate":
        case "batterystate":
          this.send_command(new vacBotCommand950.GetBatteryState());
          break;
        case "getlifespan":
        case "lifespan":
          if (arguments.length < 2) {
            return;
          }
          let component = arguments[1];
          if (this.isOzmo950()) {
            component = constants.COMPONENT_TO_OZMO950[component];
          }
          this.send_command(new vacBotCommand.GetLifeSpan(component));
          break;
        case "getwaterlevel":
          this.send_command(new vacBotCommand.GetWaterLevel());
          break;
        case "setwaterlevel":
          if (arguments.length < 2) {
            return;
          }
          this.send_command(new vacBotCommand.SetWaterLevel(arguments[1]));
          break;
        case "getwaterboxinfo":
          this.send_command(new vacBotCommand.GetWaterBoxInfo());
          break;
      }
    }
    else {
      switch (action.toLowerCase()) {
        case "clean":
          if (arguments.length <= 1) {
            this.send_command(new vacBotCommand.Clean());
          } else if (arguments.length === 2) {
            this.send_command(new vacBotCommand.Clean(arguments[1]));
          } else {
            this.send_command(new vacBotCommand.Clean(arguments[1], arguments[2]));
          }
          break;
        case "edge":
          this.send_command(new vacBotCommand.Edge());
          break;
        case "spot":
          this.send_command(new vacBotCommand.Spot());
          break;
        case "spotarea":
          if (arguments.length < 3) {
            return;
          }
          this.send_command(new vacBotCommand.SpotArea(arguments[1], arguments[2]));
          break;
        case "customarea":
          if (arguments.length < 4) {
            return;
          }
          this.send_command(new vacBotCommand.CustomArea(arguments[1], arguments[2], arguments[3]));
          break;
        case "stop":
          this.send_command(new vacBotCommand.Stop());
          break;
        case "pause":
          this.send_command(new vacBotCommand.Pause());
          break;
        case "charge":
          this.send_command(new vacBotCommand.Charge());
          break;
        case "playsound":
          this.send_command(new vacBotCommand.PlaySound());
          break;
        case "getdeviceinfo":
        case "deviceinfo":
          this.send_command(new vacBotCommand.GetDeviceInfo());
          break;
        case "getcleanstate":
        case "cleanstate":
          this.send_command(new vacBotCommand.GetCleanState());
          break;
        case "getcleanspeed":
        case "cleanspeed":
          this.send_command(new vacBotCommand.GetCleanSpeed());
          break;
        case "getchargestate":
        case "chargestate":
          this.send_command(new vacBotCommand.GetChargeState());
          break;
        case "getbatterystate":
        case "batterystate":
          this.send_command(new vacBotCommand.GetBatteryState());
          break;
        case "getlifespan":
        case "lifespan":
          if (arguments.length < 2) {
            return;
          }
          let component = arguments[1];
          if (this.isOzmo950()) {
            component = constants.COMPONENT_TO_OZMO950[component];
          }
          this.send_command(new vacBotCommand.GetLifeSpan(component));
          break;
        case "getwaterlevel":
          this.send_command(new vacBotCommand.GetWaterLevel());
          break;
        case "setwaterlevel":
          if (arguments.length < 2) {
            return;
          }
          this.send_command(new vacBotCommand.SetWaterLevel(arguments[1]));
          break;
        case "getwaterboxinfo":
          this.send_command(new vacBotCommand.GetWaterBoxInfo());
          break;
      }
    }
  }

  disconnect() {
    this.ecovacs.disconnect();
  }
}

function getAllKnownDevices() {
  let devices = {};
  devices = Object.assign(devices, getSupportedDevices());
  devices = Object.assign(devices, getKnownDevices());
  return devices;
}

function getSupportedDevices() {
  return constants.SupportedDevices;
}

function getKnownDevices() {
  return constants.KnownDevices;
}

function getProductIotMap() {
  return constants.EcoVacsHomeProducts;
}

module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.VacBot = VacBot;
module.exports.countries = countries;