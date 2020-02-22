const EventEmitter = require('events');
const tools = require('./tools.js');
const URL = require('url').URL;
const constants = require('./ecovacsConstants');
const dictionary = require('./ecovacsConstants_950type');
const https = require('https');

String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    var args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class EcovacsMQTT_JSON extends EventEmitter {
    constructor(bot, user, hostname, resource, secret, continent, vacuum, server_address, server_port) {
        super();
        this.mqtt = require('mqtt');
        this.client = null;

        this.bot = bot;
        this.user = user;
        this.hostname = hostname;
        this.domain = this.hostname.split(".")[0]; // MQTT is using domain without tld extension
        this.resource = resource;
        this.username = this.user + '@' + this.domain;
        this.clientId = this.username + '/' + this.resource;
        this.secret = secret;
        this.continent = continent;
        this.vacuum = vacuum;

        if (!server_address) {
            this.server_address = 'mq-{continent}.ecouser.net'.format({
                continent: continent
            });
        } else {
            this.server_address = server_address;
        }

        if (!server_port) {
            this.server_port = 8883
        } else {
            this.server_port = server_port;
        }

        let options = {
            clientId: this.clientId,
            username: this.username,
            password: this.secret,
            rejectUnauthorized: false
        };

        let url = 'mqtts://' + this.server_address + ':' + this.server_port;
        this.client = this.mqtt.connect(url, options);
        tools.envLog("[EcovacsMQTT_JSON] Connecting as %s to %s", this.username, url);

        let vacuum_did = this.vacuum['did'];
        let vacuum_class = this.vacuum['class'];
        let vacuum_resource = this.vacuum['resource'];
        let ecovacsMQTT = this;

        this.client.on('connect', function () {
            tools.envLog('[EcovacsMQTT_JSON] client connected');
            this.subscribe('iot/atr/+/' + vacuum_did + '/' + vacuum_class + '/' + vacuum_resource + '/+', (error, granted) => {
                if (!error) {
                    ecovacsMQTT.emit('ready', 'Client connected. Subscribe successful');
                } else {
                    tools.envLog('[EcovacsMQTT_JSON] subscribe err: %s', error.toString());
                }
            });
        });

        this.client.on('message', (topic, message) => {
            this._handle_message(topic, message.toString(), "incoming");
        });

        this.client.on('error', (error) => {
            ecovacsMQTT.emit('error', error.toString());
        });
    }

    session_start(event) {
        this.emit("ready", event);
    }

    connect_and_wait_until_ready() {
        this.on("ready", (event) => {
            this.send_ping(this.bot._vacuum_address());
        });
    }

    send_command(action, recipient) {
        let c = this._wrap_command(action, recipient);
        tools.envLog("[EcovacsMQTT_JSON] c: %s", JSON.stringify(c, getCircularReplacer()));
        this._call_ecovacs_device_api(c).then((json) => {
            this._handle_command_response(action, json);
        }).catch((e) => {
            tools.envLog("[EcovacsMQTT_JSON] error send_command: %s", e.toString());
        });
    }

    _wrap_command_getPayload(action) {
        let payload = null;

        tools.envLog("[EcovacsMQTT_JSON] _wrap_command() args: ", JSON.stringify(action.args, getCircularReplacer()));
    
        // All requests need to have this header -- not sure about timezone and ver
        let payloadRequest = {};
        payloadRequest['header'] = {};
        payloadRequest['header']['pri'] = '2';
        payloadRequest['header']['ts'] = Math.floor(Date.now());
        payloadRequest['header']['tmz'] = 480;
        payloadRequest['header']['ver'] = '0.0.22';

        if(Object.keys(action.args).length > 0) {
            payloadRequest['body'] = {};
            payloadRequest['body']['data'] = action.args;
        }

        payload = payloadRequest;
        tools.envLog("[EcovacsMQTT_JSON] _wrap_command() payload: %s", JSON.stringify(payload, getCircularReplacer()));
        
        return payload;
    }

    _wrap_command(action, recipient) {
        if (!action) {
            tools.envLog("[EcovacsMQTT_JSON] _wrap_command action missing: %s", JSON.stringify(action, getCircularReplacer()));
            return {};
        }

        return {
            'auth': {
                'realm': constants.REALM,
                'resource': this.resource,
                'token': this.secret,
                'userid': this.user,
                'with': 'users',
            },
            "cmdName": action.name,
            "payload": this._wrap_command_getPayload(action),

            "payloadType": "j",
            "td": "q",
            "toId": recipient,
            "toRes": this.vacuum['resource'],
            "toType": this.vacuum['class']
        }
    }

    _call_ecovacs_device_api(params) {
        return new Promise((resolve, reject) => {
            let url = (constants.PORTAL_URL_FORMAT + '/' + constants.IOTDEVMANAGERAPI).format({
                continent: this.continent
            });
            url = url + "?mid=" + params['toType'] + "&did=" + params['toId'] + "&td=" + params['td'] + "&u=" + params['auth']['userid'] + "&cv=1.67.3&t=a&av=1.3.1";
            let headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(params))
            };
            headers = Object.assign(headers, { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)' });
            
            url = new URL(url);
            tools.envLog(`[EcovacsMQTT_JSON] Calling ${url.href}`);
            const reqOptions = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: headers
            };
            tools.envLog("[EcovacsMQTT_JSON] Sending POST to", JSON.stringify(reqOptions, getCircularReplacer()));

            const req = https.request(reqOptions, (res) => {
                res.setEncoding('utf8');
                res.setTimeout(6000);
                // tools.envLog("[EcovacsMQTT_JSON] (request statusCode:", res.statusCode);
                // tools.envLog("[EcovacsMQTT_JSON] (request statusMessage:", res.statusMessage);
                // tools.envLog("[EcovacsMQTT_JSON] (request url:", res.url);
                // tools.envLog("[EcovacsMQTT_JSON] (request urlPathArgs:", res.urlPathArgs);
                // tools.envLog("[EcovacsMQTT_JSON] (request headers:", res.headers);
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(rawData);
                        tools.envLog("[EcovacsMQTT_JSON] call response %s", JSON.stringify(json, getCircularReplacer()));
                        if ((json['result'] === 'ok') || (json['ret'] === 'ok')) {
                            resolve(json);
                        } else {
                            tools.envLog("[EcovacsMQTT_JSON] call failed with %s", JSON.stringify(json, getCircularReplacer()));
                            throw "failure code: {errno}".format({
                                errno: json['errno']
                            });
                        }
                    } catch (e) {
                        console.error("[EcovacsMQTT_JSON] " + e.toString());
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`[EcoVacsAPI] problem with request: ${e.message}`);
                reject(e);
            });

            // write data to request body
            tools.envLog("[EcovacsMQTT_JSON] Sending", JSON.stringify(params, getCircularReplacer()));
            req.write(JSON.stringify(params));
            req.end();
        });
    }

    _handle_command_response(action, message) {
        let resp = null;
        let command = action.name;
        //action.args: arguments of the initial command that was sent
        tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() action: %s", action);
        tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() command: %s", command);

        if (message) {
            tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() message: %s", JSON.stringify(message, getCircularReplacer()));
            
            if (message.hasOwnProperty('resp')) {
                tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() resp(0): %s", command, JSON.stringify(message['resp'], getCircularReplacer()));
                this._handle_message(command, message['resp'], "response");
            }
            else {
                tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() no resp-element");
            }
        }
    }


    _handle_message(topic, message, type="incoming") {

        if (!message) {
            tools.envLog("[EcovacsMQTT_JSON] _handle_message message missing ... topic: %s", topic);
        }

        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message type: %s", type);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message topic: %s", topic);

        let eventName = topic;
        let resultCode = "0";
        let resultCodeMessage = "ok";

        if(type=="incoming"){
            // topic: iot/atr/onBattery/e0bc19bb-8cb1-43e3-8503-e9f810e35d36/yna5xi/BTKk/j
            eventName = topic.split('/')[2]; //parse 3rd element from string iot/atr/onPos/e0bc19bb-8cb1-43e3-8503-e9f810e35d36/yna5xi/BTKk/
            // message: {"header":{"pri":1,"tzm":480,"ts":"1581849631152","ver":"0.0.1","fwVer":"1.7.6","hwVer":"0.1.1"},"body":{"data":{"value":99,"isLow":0}}}
            message = JSON.parse(message);
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message message: %s", message);
        }
        if(type=="response") {
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message message: %s", JSON.stringify(message, getCircularReplacer()));
            // message: {"header":{"pri":1,"tzm":480,"ts":"1581849460440","ver":"0.0.1","fwVer":"1.7.6","hwVer":"0.1.1"},
            // "body":{"code":0,"msg":"ok","data":{"enable":0,"amount":4}}}
            resultCode = message['body']['code']; //nur bei responses
            resultCodeMessage = message['body']['msg']; //nur bei responses
        }
        let resultData = message['body']['data']; //nicht immer vorhanden "body":{"code":0,"msg":"ok"}}

        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _message_to_dict eventName: %s", eventName);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _message_to_dict resultCode: %s", resultCode);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _message_to_dict resultCodeMessage: %s", resultCodeMessage);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _message_to_dict resultData: %s", JSON.stringify(resultData, getCircularReplacer()));

        let result = {"resultCode":resultCode, "resultCodeMessage":resultCodeMessage, "resultData":resultData};

        this._handle_command(eventName, result);

    }

    _handle_command(command, event) {
        tools.envLog("[EcovacsMQTT_JSON] _handle_command() command %s received event: %s", command, JSON.stringify(event, getCircularReplacer()));
        command = command.toLowerCase().replace(/^_+|_+$/g, '');
        if(command.startsWith("on")) { //incoming events
            command = command.substring(2);
        }
        if(command.startsWith("get") ) { //remove from "get" commands
            command = command.substring(3);
        }
        switch (command) {
            case "chargestate":
                this.bot._handle_charge_state(event);
                this.emit("ChargeState", this.bot.charge_status);
                break;
            case "battery":
            case "batteryinfo":
                this.bot._handle_battery_info(event);
                this.emit("BatteryInfo", this.bot.battery_status);
                break;
            case "cleaninfo":
                this.bot._handle_clean_info(event);
                this.emit("CleanState", this.bot.clean_status);
                break;
            case "cleanspeed":
            case "speed":
                this.bot._handle_clean_speed(event);
                this.emit("FanSpeed", this.bot.fan_speed);
                break;
            case "relocationstate":
                this.bot._handle_relocationState(event);
                this.emit("RelocationState", this.bot.relocation_state);
                break;
            case "lifespan":
                this.bot._handle_life_span(event);
                if(this.bot.components["filter"]) {
                    this.emit("LifeSpan_filter", this.bot.components["filter"]);
                }
                if(this.bot.components["side_brush"]) {
                    this.emit("LifeSpan_side_brush", this.bot.components["side_brush"]);
                }
                if(this.bot.components["main_brush"]) {
                    this.emit("LifeSpan_main_brush", this.bot.components["main_brush"]);
                }
                break;
            case "pos":
                this.bot._handle_position(event);
                this.emit("DeebotPosition", this.bot.deebot_position["x"]+","+this.bot.deebot_position["y"]+","+this.bot.deebot_position["a"]);
                this.emit("ChargePosition", this.bot.charge_position["x"]+","+this.bot.charge_position["y"]+","+this.bot.charge_position["a"]);
                break;
            case "waterinfo":
                this.bot._handle_water_info(event);
                this.emit("WaterBoxInfo", this.bot.waterbox_info);
                this.emit("WaterLevel", this.bot.water_level);
                break;
            default:
                tools.envLog("[EcovacsMQTT_JSON] Unknown command received: %s", command);
                break;
        }
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {}

    //end session
    disconnect() {
        tools.envLog("[EcovacsMQTT_JSON] Closing MQTT Client...");
        try{
            this.client.end();
            tools.envLog("[EcovacsMQTT_JSON] Closed MQTT Client");
        } catch(e) {
            tools.envLog("[EcovacsMQTT_JSON] Error closing MQTT Client:  %s", e.toString());
        }
    }
}

function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
}



module.exports = EcovacsMQTT_JSON;
