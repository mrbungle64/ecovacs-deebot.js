const https = require('https'),
  URL = require('url').URL,
  crypto = require('crypto'),
  fs = require('fs'),
  Element = require('ltx').Element,
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
    envLog("[EcovacsAPI] Setting up EcovacsAPI");

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
            envLog("[EcovacsAPI] EcovacsAPI connection complete");
            resolve("ready");
          }).catch((e) => {
            envLog("[EcovacsAPI]", e);
            reject(e);
          });
        }).catch((e) => {
          envLog("[EcovacsAPI]", e);
          reject(e);
        });
      }).catch((e) => {
        envLog("[EcovacsAPI]", e);
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
      envLog("[EcovacsAPI] calling main api %s with %s", func, JSON.stringify(args));
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
      envLog(`[EcoVacsAPI] Calling ${url.href}`);

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
            envLog("[EcovacsAPI] got %s", JSON.stringify(json));
            if (json.code === '0000') {
              resolve(json.data);
            } else if (json.code === '1005') {
              envLog("[EcovacsAPI] incorrect email or password");
              throw new Error("incorrect email or password");
            } else {
              envLog("[EcovacsAPI] call to %s failed with %s", func, JSON.stringify(json));
              throw new Error("failure code {msg} ({code}) for call {func} and parameters {param}".format({
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
      envLog("[EcovacsAPI] calling user api %s with %s", func, JSON.stringify(args));
      let params;
      if (api === EcovacsAPI.USERSAPI) {
        params = Object.assign({
          'todo': func
        }, args);
      } else {
        params = Object.assign({}, args);
      }

      let continent = this.continent;
      if ('continent' in arguments) {
        continent = arguments['continent'];
      }
      let url = (EcovacsAPI.PORTAL_URL_FORMAT + "/" + api).format({
        continent: continent
      });
      url = new URL(url);
      envLog(`[EcoVacsAPI] Calling ${url.href}`);

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
      envLog("[EcovacsAPI] Sending POST to", JSON.stringify(reqOptions));

      const req = https.request(reqOptions, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(rawData);
            envLog("[EcovacsAPI] got %s", JSON.stringify(json));
            if (json['result'] === 'ok') {
              resolve(json);
            } else {
              envLog("[EcovacsAPI] call to %s failed with %s", func, JSON.stringify(json));
              throw "failure code {errno} ({error}) for call {func} and parameters {params}".format({
                errno: json['errno'],
                error: json['error'],
                func: func,
                params: JSON.stringify(args)
              });
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
      envLog("[EcovacsAPI] Sending", JSON.stringify(params));
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

  setIOTMQDevices(devices) {
    // Added for devices that utilize MQTT instead of XMPP for communication
    for (let device in devices) {
      if (devices.hasOwnProperty(device)) {
        device['iotmq'] = false;
        if (device['company'] === 'eco-ng') {
          // Check if the device is part of the list
          device['iotmq'] = true;
        }
      }
    }
    return devices;
  }

  devices() {
    return this.setIOTMQDevices(this.getDevices());
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
EcovacsAPI.MAIN_URL_FORMAT = 'https://eco-{country}-api.ecovacs.com/v1/private/{country}/{lang}/{deviceId}/{appCode}/{appVersion}/{channel}/{deviceType}';
EcovacsAPI.USER_URL_FORMAT = 'https://users-{continent}.ecouser.net:8000/user.do';
EcovacsAPI.PORTAL_URL_FORMAT = 'https://portal-{continent}.ecouser.net/api';
EcovacsAPI.USERSAPI = 'users/user.do';

// IOT Device Manager - This provides control of "IOT" products via RestAPI, some bots use this instead of XMPP
EcovacsAPI.IOTDEVMANAGERAPI = 'iot/devmanager.do';
EcovacsAPI.LGLOGAPI = 'lg/log.do';
// Leaving this open, the only endpoint known currently is "Product IOT Map" -  pim/product/getProductIotMap - This provides a list of "IOT" products.  Not sure what this provides the app.
EcovacsAPI.PRODUCTAPI = 'pim/product';

EcovacsAPI.REALM = 'ecouser.net';

class VacBot {
  constructor(user, hostname, resource, secret, vacuum, continent, server_address = null) {
    this.vacuum = vacuum;
    this.clean_status = null;
    this.charge_status = null;
    this.battery_status = null;
    this.ping_interval = null;
    this.error_event = null;
    // Set none for clients to start
    this.ecovacs = null;
    this.ecovacsClient = null;

    if (!vacuum['iotmq']) {
      const EcovacsXMPP = require('./library/ecovacsXMPP.js');
      this.ecovacs = new EcovacsXMPP(this, user, hostname, resource, secret, continent, vacuum, server_address);
      this.ecovacsClient = this.ecovacs.simpleXmpp;
    } else {
      const EcovacsIOTMQ = require('./library/ecovacsIOTMQ.js');
      this.ecovacs = new EcovacsIOTMQ(this, user, hostname, resource, secret, continent, vacuum, server_address);
      this.ecovacsClient = this.ecovacs.mqtt;
    }

    this.ecovacsClient.on("ready", () => {
      envLog("[VacBot] Ready event!");
    });
  }

  connect_and_wait_until_ready() {
    this.ecovacsClient.connect_and_wait_until_ready();
    this.ping_interval = setInterval(() => {
      this.ecovacsClient.send_ping(this._vacuum_address());
    }, 30000);
  }

  on(name, func) {
    this.ecovacsClient.on(name, func);
  }

  _handle_clean_report(event) {
    let type = event.attrs['type'];
    try {
      type = VacBotCommand.CLEAN_MODE[type];
      if (this.vacuum['iotmq']) {
        // Was able to parse additional status from the IOTMQ, may apply to XMPP too
        let statustype = event['st'];
        statustype = VacBotCommand.CLEAN_ACTION[statustype];
        if (statustype === 'stop' || statustype === 'pause') {
          type = statustype
        }
      }
    } catch (e) {

    }
    this.clean_status = type;
    this.vacuum_status = type;

    let fan = null;
    if ("speed" in event) {
      fan = event['speed'];
    }
    if (fan !== null) {
      try {
        fan = VacBotCommand.FAN_SPEED[fan];
      } catch (e) {
        console.error("[VacBot] Unknown fan speed: ", fan);
      }
      this.fan_speed = fan;
      this.statusEvents.notify(self.vacuum_status);
      envLog("[VacBot] *** clean_status = " + this.clean_status);
    }
  }

  _handle_battery_info(iq) {
    try {
      this.battery_status = parseFloat(iq.attrs['power']) / 100;
      envLog("[VacBot] *** battery_status = %d\%", this.battery_status * 100);
    } catch (e) {
      console.error("[VacBot] couldn't parse battery status ", iq);
    }
  }

  _handle_charge_state(iq) {
    try {
      if (iq.name !== "charge") {
        throw "Not a charge state";
      }

      let report = iq.attrs['type'];

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

      envLog("[VacBot] *** charge_status = " + this.charge_status)
    } catch (e) {
      console.error("[VacBot] couldn't parse charge status ", iq);
    }
  }

  _handle_error(event) {
    if ('error' in event) {
      this.error_event = event['error'];
    } else if ('errs' in event) {
      this.error_event = event['errs'];
    }
  }

  _vacuum_address() {
    if (!this.vacuum['iotmq']) {
      return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
    } else {
      return this.vacuum['did'];
    }
  }

  send_command(action) {
    envLog("[VacBot] Sending command `%s`", action.name);
    if (!this.vacuum['iotmq']) {
      this.ecovacsClient.send_command(action.to_xml(), this._vacuum_address());
    } else {
      // IOTMQ issues commands via RestAPI, and listens on MQTT for status updates
      // IOTMQ devices need the full action for additional parsing
      this.ecovacsClient.send_command(action, this._vacuum_address());
    }
  }

  send_ping() {
    try {
      if (!this.vacuum['iotmq']) {
        this.ecovacsClient.send_ping(this._vacuum_address());
      } else if (this.vacuum['iotmq']) {
        if (!this.ecovacsClient.send_ping()) {
          throw new Error("Ping did not reach VacBot");
        }
      }
    } catch (e) {
      throw new Error("Ping did not reach VacBot");
    }
  }

  run(action) {
    var args;
    switch (action) {
      case "Clean":
      case "clean":
        args = Array.prototype.slice.call(arguments, 1);
        if (args.length === 0) {
          this.send_command(new Clean());
        } else if (args.length === 1) {
          this.send_command(new Clean(args[0]));
        } else {
          this.send_command(new Clean(args[0], args[1]));
        }
        break;
      case "Edge":
      case "edge":
        this.send_command(new Edge());
        break;
      case "Spot":
      case "spot":
        this.send_command(new Spot());
        break;
      case "Stop":
      case "stop":
        this.send_command(new Stop());
        break;
      case "Charge":
      case "charge":
        this.send_command(new Charge());
        break;
      case "GetDeviceInfo":
      case "getdeviceinfo":
      case "deviceinfo":
        this.send_command(new GetDeviceInfo());
        break;
      case "GetCleanState":
      case "getcleanstate":
      case "cleanstate":
        this.send_command(new GetCleanState());
        break;
      case "GetChargeState":
      case "getchargestate":
      case "chargestate":
        this.send_command(new GetChargeState());
        break;
      case "GetBatteryState":
      case "getbatterystate":
      case "batterystate":
        this.send_command(new GetBatteryState());
        break;
      case "GetLifeSpan":
      case "getlifespan":
      case "lifespan":
        args = Array.prototype.slice.call(arguments, 1);
        if (args.length < 1) {
          return;
        }
        this.send_command(new GetLifeSpan(args[0]));
        break;
      case "SetTime":
      case "settime":
      case "time":
        args = Array.prototype.slice.call(arguments, 1);
        if (args.length < 2) {
          return;
        }
        this.send_command(new SetTime(args[0], args[1]));
        break;
    }
  }
}

class VacBotCommand {
  constructor(name, args = null) {
    if (args == null) {
      args = {}
    }
    this.name = name;
    this.args = args;
  }

  to_xml() {
    let ctl = new Element('ctl', {
      td: this.name
    });
    for (let key in this.args) {
      if (this.args.hasOwnProperty(key)) {
        let value = this.args[key];
        if (isObject(value)) {
          ctl.c(key, value);
        } else {
          ctl.attr(key, value);
        }
      }
    }
    return ctl;
  }

  toString() {
    return this.command_name() + " command";
  }

  command_name() {
    return this.name.toLowerCase();
  }
}

VacBotCommand.CLEAN_MODE = {
  'auto': 'auto',
  'edge': 'border',
  'spot': 'spot',
  'spot_area': 'spot_area',
  'single_room': 'singleroom',
  'stop': 'stop'
};
VacBotCommand.FAN_SPEED = {
  'normal': 'standard',
  'high': 'strong'
};
VacBotCommand.CHARGE_MODE = {
  'return': 'go',
  'returning': 'Going',
  'charging': 'SlotCharging',
  'idle': 'Idle'
};
VacBotCommand.COMPONENT = {
  'main_brush': 'Brush',
  'side_brush': 'SideBrush',
  'filter': 'DustCaseHeap'
};
VacBotCommand.CLEAN_ACTION = {
  'start': 's',
  'pause': 'p',
  'resume': 'r',
  'stop': 'h'
};

class Clean extends VacBotCommand {
  constructor(mode = "auto", speed = "normal", iotmq = false, action = 'start') {
    if (arguments.length < 5) {
      // Looks like action is needed for some bots, shouldn't affect older models
      super('Clean', {
        'clean': {
          'type': VacBotCommand.CLEAN_MODE[mode],
          'speed': ecovacs_fan_speed(speed),
          'act': VacBotCommand.CLEAN_ACTION[action]
        }
      })
    } else {
      let initCmd = {
        'type': VacBotCommand.CLEAN_MODE[mode],
        'speed': ecovacs_fan_speed(speed)
      };
      for (let key in arguments) {
        if (arguments.hasOwnProperty(key)) {
          initCmd[key] = arguments[key];
        }
      }
      super('Clean', {
        'clean': initCmd
      })
    }
  }
}

class Edge extends Clean {
  constructor() {
    super('edge', 'high')
  }
}

class Spot extends Clean {
  constructor() {
    super('spot', 'high')
  }
}

class Stop extends Clean {
  constructor() {
    super('stop', 'normal')
  }
}

class Charge extends VacBotCommand {
  constructor() {
    super("Charge", {
      'charge': {
        'type': VacBotCommand.CHARGE_MODE['return']
      }
    });
  }
}

class GetDeviceInfo extends VacBotCommand {
  constructor() {
    super("GetDeviceInfo");
  }
}

class GetCleanState extends VacBotCommand {
  constructor() {
    super("GetCleanState");
  }
}

class GetChargeState extends VacBotCommand {
  constructor() {
    super("GetChargeState");
  }
}

class GetBatteryState extends VacBotCommand {
  constructor() {
    super("GetBatteryInfo");
  }
}

class GetLifeSpan extends VacBotCommand {
  constructor(component) {
    super("GetLifeSpan", {
      'type': VacBotCommand.COMPONENT[component]
    });
  }
}

class SetTime extends VacBotCommand {
  constructor(timestamp, timezone) {
    super("SetTime", {
      'time': {
        't': timestamp,
        'tz': timezone
      }
    });
  }
}

function isObject(val) {
  if (val === null) {
    return false;
  }
  return ((typeof val === 'function') || (typeof val === 'object'));
}

envLog = function () {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
    console.log.apply(this, arguments);
  }
};

function ecovacs_fan_speed(speed) {
  if (speed === 'normal' || speed === VacBotCommand.FAN_SPEED['normal']) {
    return VacBotCommand.FAN_SPEED['normal'];
  } else if (speed === 'high' || speed === VacBotCommand.FAN_SPEED['high']) {
    return VacBotCommand.FAN_SPEED['high'];
  } else {
    throw Error("Fan speed not found - {}".format(speed));
  }
}

module.exports.EcoVacsAPI = EcovacsAPI;
module.exports.VacBot = VacBot;
module.exports.Clean = Clean;
module.exports.Edge = Edge;
module.exports.Spot = Spot;
module.exports.Stop = Stop;
module.exports.Charge = Charge;
module.exports.GetDeviceInfo = GetDeviceInfo;
module.exports.GetCleanState = GetCleanState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.SetTime = SetTime;
module.exports.isObject = isObject;
module.exports.countries = countries;