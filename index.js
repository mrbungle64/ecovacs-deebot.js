const https = require('https')
  , URL = require('url').URL
  , crypto = require('crypto')
  , EventEmitter = require('events')
  , fs = require('fs')
  , Element = require('ltx').Element
  , countries = require('./countries.js');

String.prototype.format = function () {
  if (arguments.length == 0) {
    return this;
  }
  var args = arguments['0'];
  return this.replace(/{(\w+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

class EcoVacsAPI {
  constructor(device_id, country, continent) {
    envLog("[EcoVacsAPI] Setting up EcoVacsAPI");

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

      this.__call_main_api('user/login', {'account': EcoVacsAPI.encrypt(account_id), 'password': EcoVacsAPI.encrypt(password_hash)}).then((info) => {
        login_info = info;
        this.uid = login_info.uid;
        this.login_access_token = login_info.accessToken;
        this.__call_main_api('user/getAuthCode', {'uid': this.uid, 'accessToken': this.login_access_token}).then((token) => {
          this.auth_code = token['authCode'];
          this.__call_login_by_it_token().then((login) => {
            this.user_access_token = login['token'];
            this.uid = login['userId'];
            envLog("[EcoVacsAPI] EcoVacsAPI connection complete");
            resolve("ready");
          }).catch((e) => {
            envLog("[EcoVacsAPI]", e);
            reject(e);
          });
        }).catch((e) => {
          envLog("[EcoVacsAPI]", e);
          reject(e);
        });
      }).catch((e) => {
        envLog("[EcoVacsAPI]", e);
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

    let sign_on_text = EcoVacsAPI.CLIENT_KEY;
    let keys = Object.keys(sign_on);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      sign_on_text += k + "=" + sign_on[k];
    }
    sign_on_text += EcoVacsAPI.SECRET;

    result['authAppkey'] = EcoVacsAPI.CLIENT_KEY;
    result['authSign'] = EcoVacsAPI.md5(sign_on_text);

    return EcoVacsAPI.paramsToQueryList(result);
  }

  __call_main_api(func, args) {
    return new Promise((resolve, reject) => {
      envLog("[EcoVacsAPI] calling main api %s with %s", func, JSON.stringify(args));
      let params = {};
      for (var key in args) {
        if (args.hasOwnProperty(key)) {
          params[key] = args[key];
        }
      }
      params['requestId'] = EcoVacsAPI.md5(Number.parseFloat(Date.now() / 1000).toFixed(0));
      let url = (EcoVacsAPI.MAIN_URL_FORMAT + "/" + func).format(this.meta);
      url = new URL(url);
      url.search = this.__sign(params).join('&');
      envLog(`[EcoVacsAPI] Calling ${url.href}`);

      https.get(url.href, (res) => {
        const {statusCode} = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' +
            `Status Code: ${statusCode}`);
        }
        if (error) {
          console.error("[EcoVacsAPI] " + error.message);
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
            envLog("[EcoVacsAPI] got %s", JSON.stringify(json));
            if (json.code == '0000') {
              resolve(json.data);
            } else if (json.code == '1005') {
              envLog("[EcoVacsAPI] incorrect email or password");
              throw new Error("incorrect email or password");
            } else {
              envLog("[EcoVacsAPI] call to %s failed with %s", func, JSON.stringify(json));
              throw new Error("failure code {msg} ({code}) for call {func} and parameters {param}".format({
                msg: json['msg'],
                code: json['code'],
                func: func,
                param: JSON.stringify(args)
              }));
            }
          } catch (e) {
            console.error("[EcoVacsAPI] " + e.message);
            reject(e);
          }
        });
      }).on('error', (e) => {
        console.error(`[EcoVacsAPI] Got error: ${e.message}`);
        reject(e);
      });
    });
  }

  __call_user_api(func, args) {
    return new Promise((resolve, reject) => {
      envLog("[EcoVacsAPI] calling user api %s with %s", func, JSON.stringify(args));
      let params = {'todo': func};
      for (let key in args) {
        if (args.hasOwnProperty(key)) {
          params[key] = args[key];
        }
      }

      let url = EcoVacsAPI.USER_URL_FORMAT.format({continent: this.continent});
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
      envLog("[EcoVacsAPI] Sending POST to", JSON.stringify(reqOptions));

      const req = https.request(reqOptions, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(rawData);
            envLog("[EcoVacsAPI] got %s", JSON.stringify(json));
            if (json['result'] == 'ok') {
              resolve(json);
            } else {
              envLog("[EcoVacsAPI] call to %s failed with %s", func, JSON.stringify(json));
              throw "failure code {errno} ({error}) for call {func} and parameters {params}".format({
                errno: json['errno'],
                error: json['error'],
                func: func,
                params: JSON.stringify(args)
              });
            }
          } catch (e) {
            console.error("[EcoVacsAPI] " + e.message);
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[EcoVacsAPI] problem with request: ${e.message}`);
        reject(e);
      });

      // write data to request body
      envLog("[EcoVacsAPI] Sending", JSON.stringify(params));
      req.write(JSON.stringify(params));
      req.end();
    });
  }

  __call_login_by_it_token() {
    return this.__call_user_api('loginByItToken',
      {
        'country': this.meta['country'].toUpperCase(),
        'resource': this.resource,
        'realm': EcoVacsAPI.REALM,
        'userId': this.uid,
        'token': this.auth_code
      }
    );
  }

  devices() {
    return new Promise((resolve, reject) => {
      this.__call_user_api('GetDeviceList', {
        'userid': this.uid,
        'auth': {
          'with': 'users',
          'userid': this.uid,
          'realm': EcoVacsAPI.REALM,
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

  static md5(text) {
    return crypto.createHash('md5').update(text).digest("hex");
  }

  static encrypt(text) {
    return crypto.publicEncrypt({key: EcoVacsAPI.PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING}, new Buffer(text)).toString('base64');
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

EcoVacsAPI.CLIENT_KEY = "eJUWrzRv34qFSaYk";
EcoVacsAPI.SECRET = "Cyu5jcR4zyK6QEPn1hdIGXB5QIDAQABMA0GC";
EcoVacsAPI.PUBLIC_KEY = fs.readFileSync(__dirname + "/key.pem", "utf8");
EcoVacsAPI.MAIN_URL_FORMAT = 'https://eco-{country}-api.ecovacs.com/v1/private/{country}/{lang}/{deviceId}/{appCode}/{appVersion}/{channel}/{deviceType}';
EcoVacsAPI.USER_URL_FORMAT = 'https://users-{continent}.ecouser.net:8000/user.do';
EcoVacsAPI.REALM = 'ecouser.net';

class VacBot {
  constructor(user, hostname, resource, secret, vacuum, continent, server_address = null) {
    this.vacuum = vacuum;
    this.clean_status = null;
    this.charge_status = null;
    this.battery_status = null;
    this.ping_interval = null;

    this.xmpp = new EcoVacsXMPP(this, user, hostname, resource, secret, continent, server_address);

    this.xmpp.on("ready", () => {
      envLog("[VacBot] Ready event!");
    });
  }

  connect_and_wait_until_ready() {
    this.xmpp.connect_and_wait_until_ready();

    this.ping_interval = setInterval(() => {
      this.xmpp.send_ping(this._vacuum_address());
    }, 30000);
  }

  on(name, func) {
    this.xmpp.on(name, func);
  }

  _handle_clean_report(iq) {
    this.clean_status = iq.attrs['type'];
    envLog("[VacBot] *** clean_status = " + this.clean_status);
  }

  _handle_battery_info(iq) {
    try {
      if (iq.name !== "battery") {
        throw "Not a battery state";
      }
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

  _vacuum_address() {
    return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom'
  }

  send_command(command) {
    envLog("[VacBot] Sending command `%s`", command.name);
    this.xmpp.send_command(command, this._vacuum_address());
  }

  run(action) {
    switch (action) {
      case "Clean":
      case "clean":
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length == 0) {
          this.send_command(new Clean());
        } else if (args.length == 1) {
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
      case "Move":
      case "move":
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length < 1) {
          return;
        }
        this.send_command(new Move(args[0]));
        break;
      case "Left":
      case "left":
        this.run("Move", "left");
        break;
      case "Right":
      case "right":
        this.run("Move", "right");
        break;
      case "Forward":
      case "forward":
        this.run("Move", "forward");
        break;
      case "turn_around":
      case "TurnAround":
      case "turnaround":
        this.run("Move", "turn_around");
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
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length < 1) {
          return;
        }
        this.send_command(new GetLifeSpan(args[0]));
        break;
      case "SetTime":
      case "settime":
      case "time":
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length < 2) {
          return;
        }
        this.send_command(new SetTime(args[0], args[1]));
        break;
    }
  }

  disconnect() {
    this.xmpp.disconnect();
  }
}

class EcoVacsXMPP extends EventEmitter {
  constructor(bot, user, hostname, resource, secret, continent, server_address, server_port) {
    super();
    this.simpleXmpp = require('simple-xmpp');

    this.bot = bot;
    this.user = user;
    this.hostname = hostname;
    this.resource = resource;
    this.secret = secret;
    this.continent = continent;
    this.iter = 1;

    if (!server_address) {
      this.server_address = 'msg-{continent}.ecouser.net'.format({continent: continent});
    } else {
      this.server_address = server_address;
    }

    if (!server_port) {
      this.server_port = 5223
    } else {
      this.server_port = server_port;
    }

    this.simpleXmpp.on('online', (event) => {
      this.session_start(event);
    });

    this.simpleXmpp.on('close', () => {
      envLog('[EcoVacsXMPP] I\'m disconnected :(');
      this.emit("closed");
    });

    this.simpleXmpp.on('chat', (from, message) => {
      envLog('[EcoVacsXMPP] Chat from %s: %s', from, message);
    });

    this.simpleXmpp.on('stanza', (stanza) => {
      //envLog('[EcoVacsXMPP] Received stanza:', JSON.stringify(stanza));
      envLog('[EcoVacsXMPP] Received stanza XML:', stanza.toString());
      if (stanza.name == "iq" && stanza.attrs.type == "set" && !!stanza.children[0] && stanza.children[0].name == "query" && !!stanza.children[0].children[0] /*&& !!stanza.children[0].children[0].children[0]*/) {
        envLog('[EcoVacsXMPP] Response for %s:, %s', stanza.children[0].children[0].attrs.td, JSON.stringify(stanza.children[0].children[0]));
        switch (stanza.children[0].children[0].attrs.td) {
          case "PushRobotNotify":
            let type = stanza.children[0].children[0].attrs['type'];
            let act = stanza.children[0].children[0].attrs['act'];
            this.emit(stanza.children[0].children[0].attrs.td, {type: type, act: act});
            this.emit("stanza", {type: stanza.children[0].children[0].attrs.td, value: {type: type, act: act}});
            break;
          case "DeviceInfo":
            envLog("[EcoVacsXMPP] Received an DeviceInfo Stanza");
            break;
          case "ChargeState":
            this.bot._handle_charge_state(stanza.children[0].children[0].children[0]);
            this.emit(stanza.children[0].children[0].attrs.td, this.bot.charge_status);
            this.emit("stanza", {type: stanza.children[0].children[0].attrs.td, value: this.bot.charge_status});
            break;
          case "BatteryInfo":
            this.bot._handle_battery_info(stanza.children[0].children[0].children[0]);
            this.emit(stanza.children[0].children[0].attrs.td, this.bot.battery_status);
            this.emit("stanza", {type: stanza.children[0].children[0].attrs.td, value: this.bot.battery_status});
            break;
          case "CleanReport":
            this.bot._handle_clean_report(stanza.children[0].children[0].children[0]);
            this.emit(stanza.children[0].children[0].attrs.td, this.bot.clean_status);
            this.emit("stanza", {type: stanza.children[0].children[0].attrs.td, value: this.bot.clean_status});
            break;
          case "WKVer":
            envLog("[EcoVacsXMPP] Received an WKVer Stanza");
            break;
          case "Error":
          case "error":
            envLog("[EcoVacsXMPP] Received an error for action '%s': %s", stanza.children[0].children[0].attrs.action, stanza.children[0].children[0].attrs.error);
            break;
          case "OnOff":
            envLog("[EcoVacsXMPP] Received an OnOff Stanza");
            break;
          case "Sched":
            envLog("[EcoVacsXMPP] Received an Sched Stanza");
            break;
          case "LifeSpan":
            envLog("[EcoVacsXMPP] Received an LifeSpan Stanza");
            break;
          default:
            envLog("[EcoVacsXMPP] Unknown response type received");
            break;
        }
      } else if (stanza.name == "iq" && stanza.attrs.type == "error" && !!stanza.children[0] && stanza.children[0].name == "error" && !!stanza.children[0].children[0]) {
        envLog('[EcoVacsXMPP] Response Error for request %s', stanza.attrs.id);

        switch (stanza.children[0].attrs.code) {
          case "404":
            console.error("[EcoVacsXMPP] Couldn't reach the vac :[%s] %s", stanza.children[0].attrs.code, stanza.children[0].children[0].name);
            break;
          default:
            console.error("[EcoVacsXMPP] Unknown error received: %s", JSON.stringify(stanza.children[0]));
            break;
        }
      }
    });

    this.simpleXmpp.on('error', (e) => {
      envLog('[EcoVacsXMPP] Error:', e);
    });
  }

  session_start(event) {
    envLog("[EcoVacsXMPP] ----------------- starting session ----------------")
    envLog("[EcoVacsXMPP] event = {event}".format({event: JSON.stringify(event)}));
    this.emit("ready", event);
  }

  subscribe_to_ctls(func) {
    envLog("[EcoVacsXMPP] Adding listener to ready event");
    this.on("ready", func);
  }

  send_command(xml, recipient) {
    let c = this._wrap_command(xml, recipient);
    envLog('[EcoVacsXMPP] Sending xml:', c.toString());
    this.simpleXmpp.conn.send(c);
  }

  _wrap_command(ctl, recipient) {
    let id = this.iter++;
    let q = new Element('iq', {id: id, to: recipient, from: this._my_address(), type: 'set'});
    q.c('query', {xmlns: 'com:ctl'}).cnode(ctl.to_xml());
    return q;
  }

  _my_address() {
    return this.user + '@' + this.hostname + '/' + this.resource;
  }

  send_ping(to) {
    let id = this.iter++;
    envLog("[EcoVacsXMPP] *** sending ping ***");
    var e = new Element('iq', {id: id, to: to, from: this._my_address(), type: 'get'});
    e.c('query', {xmlns: 'urn:xmpp:ping'});
    envLog("[EcoVacsXMPP] Sending ping XML:", e.toString());
    this.simpleXmpp.conn.send(e);
  }

  connect_and_wait_until_ready() {
    envLog("[EcoVacsXMPP] Connecting as %s to %s", this.user + '@' + this.hostname, this.server_address + ":" + this.server_port);
    this.simpleXmpp.connect({
      jid: this.user + '@' + this.hostname
      , password: '0/' + this.resource + '/' + this.secret
      , host: this.server_address
      , port: this.server_port
    });

    this.on("ready", (event) => {
      this.send_ping(this.bot._vacuum_address());
    });
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
    let ctl = new Element('ctl', {td: this.name});
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
VacBotCommand.ACTION = {
  'forward': 'forward',
  'left': 'SpinLeft',
  'right': 'SpinRight',
  'turn_around': 'TurnAround',
  'stop': 'stop'
};

class Clean extends VacBotCommand {
  constructor(mode = "auto", speed = "normal") {
    super("Clean", {'clean': {'type': VacBotCommand.CLEAN_MODE[mode], 'speed': VacBotCommand.FAN_SPEED[speed]}});
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
    super("Charge", {'charge': {'type': VacBotCommand.CHARGE_MODE['return']}});
  }
}

class Move extends VacBotCommand {
  constructor(action) {
    super("Move", {'move': {'action': VacBotCommand.ACTION[action]}});
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
    super("GetLifeSpan", {'type': VacBotCommand.COMPONENT[component]});
  }
}

class SetTime extends VacBotCommand {
  constructor(timestamp, timezone) {
    super("SetTime", {'time': {'t': timestamp, 'tz': timezone}});
  }
}

function isObject(val) {
  if (val === null) {
    return false;
  }
  return ((typeof val === 'function') || (typeof val === 'object'));
}

envLog = function () {
  if (process.env.NODE_ENV == "development" || process.env.NODE_ENV == "dev") {
    console.log.apply(this, arguments);
  }
}

module.exports.EcoVacsAPI = EcoVacsAPI;
module.exports.VacBot = VacBot;
module.exports.EcoVacsXMPP = EcoVacsXMPP;
module.exports.Clean = Clean;
module.exports.Edge = Edge;
module.exports.Spot = Spot;
module.exports.Stop = Stop;
module.exports.Charge = Charge;
module.exports.Move = Move;
module.exports.GetDeviceInfo = GetDeviceInfo;
module.exports.GetCleanState = GetCleanState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.SetTime = SetTime;
module.exports.isObject = isObject;
module.exports.countries = countries;
