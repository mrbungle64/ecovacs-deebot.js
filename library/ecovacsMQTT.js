const EventEmitter = require('events');
const tools = require('./tools');
const URL = require('url').URL;
const fs = require('fs');
const constants = require('./ecovacsConstants');
const request = require('request');
var DOMParser = require('xmldom').DOMParser;

String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    var args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class EcovacsMQTT extends EventEmitter {
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

        //var caFile = fs.readFileSync(__dirname + "/key.pem", "utf8");

        let options = {
            clientId: this.clientId,
            username: this.username,
            password: this.secret,
            rejectUnauthorized: false
        };

        let url = 'mqtts://' + this.server_address + ':' + this.server_port;
        this.client = this.mqtt.connect(url, options);
        tools.envLog("[EcovacsMQTT] Connecting as %s to %s", this.username, url);

        let vacuum_did = this.vacuum['did'];
        let vacuum_class = this.vacuum['class'];
        let vacuum_resource = this.vacuum['resource'];
        let client = this.client;

        client.on('connect', function () {
            client.subscribe('iot/atr/+/' + vacuum_did + '/' + vacuum_class + '/' + vacuum_resource + '/+', (err, granted) => {
                if (!err) {
                    tools.envLog('[EcovacsMQTT] subscribe successful');
                    this.emit('ready', 'ready!');
                } else {
                    tools.envLog('[EcovacsMQTT] subscribe err: %s', err.toString());
                }
            });
            tools.envLog('[EcovacsMQTT] connected');
        });

        client.on('message', (topic, message) => {
            tools.envLog("[EcovacsMQTT] -----------------------------------------------");
            tools.envLog('[EcovacsMQTT] message: %s', message.toString());
            this._handle_ctl_mqtt(topic, message);
            client.end();
        });

        client.on('error', (error) => {
            tools.envLog("[EcovacsMQTT] -----------------------------------------------");
            //tools.envLog('[EcovacsMQTT] error: %s', error.toString());
        });

        client.on('packetsend', (packet) => {
            tools.envLog("[EcovacsMQTT] -----------------------------------------------");
            tools.envLog("[EcovacsMQTT] Packet Send aufgerufen");
            //tools.envLog(packet);
        });

        client.on('packetreceive', (packet) => {
            tools.envLog("[EcovacsMQTT] -----------------------------------------------");
            tools.envLog("[EcovacsMQTT] Packet Receive aufgerufen");
            //tools.envLog(packet);
        });
    }

    session_start(event) {
        tools.envLog("[EcovacsMQTT] ----------------- starting session ----------------");
        tools.envLog("[EcovacsMQTT] event = {event}".format({
            event: JSON.stringify(event)
        }));
        this.emit("ready", event);
    }

    connect_and_wait_until_ready() {
        this.on("ready", (event) => {
            this.send_ping(this.bot._vacuum_address());
        });
    }

    send_command(action, recipient) {
        if (action.name === 'Clean') {
            if (!action.args.hasOwnProperty('act')) {
                action.args['act'] = constants.CLEAN_ACTION_TO_ECOVACS['start'];
            }
        }
        let json = this._wrap_command(action, recipient);
        this._handle_ctl_api(action, this.__call_ecovacs_device_api(json));
    }

    _wrap_command(action, recipient) {
        let xml = action.to_xml();
        // Remove the td from ctl xml for RestAPI
        let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
        payloadXml.documentElement.removeAttribute('td');

        return {
            'auth': {
                'realm': 'ecouser.net',
                'resource': this.resource,
                'token': this.secret,
                'userid': this.user,
                'with': 'users',
            },
            "cmdName": action.name,
            "payload": payloadXml.toString(),

            "payloadType": "x",
            "td": "q",
            "toId": recipient,
            "toRes": this.vacuum['resource'],
            "toType": this.vacuum['class']
        }
    }

    __call_ecovacs_device_api(json) {
        let url = 'https://portal-{continent}.ecouser.net/api/iot/devmanager.do'.format({
            continent: this.continent
        });

        try {
            //May think about having timeout as an arg that could be provided in the future
            let response = request.post(url, {
                json: json
            }, (error, response, body) => {
                if (error) {
                    console.error(error);
                    return {};
                }
                if (body['ret'] === 'ok') {
                    return responseJson.toJSON();
                }
                tools.envLog('[EcovacsMQTT] statusCode:', response && response.statusCode);
                tools.envLog('[EcovacsMQTT] body:', body);
            })
        } catch (e) {
            throw new Error('[EcovacsMQTT] ' + e.message);
        }

        return {};
    }

    _handle_ctl_api(command, message) {
        let resp = null;
        if (message !== undefined) {
            if ('resp' in message) {
                resp = this._ctl_to_dict_api(command, message['resp']);
            }
            else {
                resp = {
                    'event': command.name.replace("Get", "", 1).replace(/^_+|_+$/g, '').toLowerCase(),
                    'data': message
                };
            }
        }
        switch (command) {
            case "ChargeState":
                this.bot._handle_charge_state(resp);
                this.emit(command, this.bot.charge_status);
                break;
            case "BatteryInfo":
                this.bot._handle_battery_info(resp);
                this.emit(command, this.bot.battery_status);
                break;
            case "CleanReport":
                this.bot._handle_clean_report(resp);
                this.emit(command, this.bot.clean_status);
                this.emit('FanSpeed', this.bot.fan_speed);
                break;
            case "LifeSpan":
                this.bot._handle_life_span(resp);
                this.emit(command, this.bot.components);
                break;
            default:
                tools.envLog("[EcovacsMQTT] Unknown response type received");
                break;
        }
    }

    _ctl_to_dict_api(action, xmlstring) {
        let payloadXml = new DOMParser().parseFromString(xmlstring, 'text/xml');
        if (payloadXml.hasChildNodes()) {
            let xmlChilds = payloadXml.childNodes;
            let result = {};
            Object.assign(xmlChilds[0].attrib, result);
            //Fix for difference in XMPP vs API response
            //Depending on the report will use the tag and add "report" to fit the mold of ozmo library
            if (xmlChilds[0].tag === "clean") {
                result['event'] = "CleanReport";
            } else if (xmlChilds[0].tag === "charge") {
                result['event'] = "ChargeState";
            } else if (xmlChilds[0].tag === "battery") {
                result['event'] = "BatteryInfo";
            } else { //Default back to replacing Get from the api cmdName
                result['event'] = action.name.replace("Get", "");
            }
        } else {
            let result = {};
            Object.assign(xml.attrib, result);
            result['event'] = action.name.replace("Get", "");
            if ('ret' in result) { //Handle errors as needed
                if (result['ret'] === 'fail') {
                    if (action.name === "Charge") { //So far only seen this with Charge, when already docked
                        result['event'] = "ChargeState";
                    }
                }
            }
            return result;
        }
    }

    _handle_ctl_mqtt(userdata, message) {
        let as_dict = this._ctl_to_dict_mqtt(message.topic, message.payload);
        if (as_dict !== null) {
            let command = as_dict['key'];
            switch (command) {
                case "ChargeState":
                    this.bot._handle_charge_state(as_dict);
                    this.emit(command, this.bot.charge_status);
                    break;
                case "BatteryInfo":
                    this.bot._handle_battery_info(as_dict);
                    this.emit(command, this.bot.battery_status);
                    break;
                case "CleanReport":
                    this.bot._handle_clean_report(as_dict);
                    this.emit(command, this.bot.clean_status);
                    this.emit('FanSpeed', this.bot.fan_speed);
                    break;
                case "LifeSpan":
                    this.bot._handle_life_span(as_dict);
                    this.emit(command, this.bot.components);
                    break;
                default:
                    tools.envLog("[EcovacsMQTT] Unknown response type received");
                    break;
            }
        }
    }

    _ctl_to_dict_mqtt(topic, xmlstring) {
        //Convert from string to xml (like IOT rest calls), other than this it is similar to XMPP
        let xml = new DOMParser().parseFromString(xmlstring, 'text/xml');

        //Including changes from jasonarends @ 28da7c2 below
        let result = Object.assign(xml.attributes, result);
        if (!result.hasOwnProperty('td')) {
            // This happens for commands with no response data, such as PlaySound
            // Handle response data with no 'td'

            // single element with type and val
            if ('type' in result) {
                if (result.hasOwnProperty('type')) {
                    // seems to always be LifeSpan type
                    result['event'] = "LifeSpan";
                }
            } else {
                // case where there is child element
                if (xml.length > 0) {
                    if ('clean' in xml[0].tag) {
                        result['event'] = "CleanReport";
                    } else if ('charge' in xml[0].tag) {
                        result['event'] = "ChargeState";
                    } else if ('battery' in xml[0].tag) {
                        result['event'] = "BatteryInfo";
                    } else {
                        return;
                    }
                    Object.assign(xml[0].attrib, result);
                } else {
                    // for non-'type' result with no child element, e.g., result of PlaySound
                    return;
                }
            }
        } else {
            // response includes 'td'
            result['event'] = result.pop('td');
            if (xml) {
                Object.assign(xml[0].attrib, result);
            }
        }
        return result
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {}
}

module.exports = EcovacsMQTT;