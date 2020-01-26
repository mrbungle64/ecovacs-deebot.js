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
        let ecovacsMQTT = this;

        this.client.on('connect', function () {
            this.subscribe('iot/atr/+/' + vacuum_did + '/' + vacuum_class + '/' + vacuum_resource + '/+', (error, granted) => {
                if (!error) {
                    tools.envLog('[EcovacsMQTT] subscribe successful');
                    ecovacsMQTT.emit('ready', 'ready!');
                } else {
                    tools.envLog('[EcovacsMQTT] subscribe err: %s', error.toString());
                }
            });
            tools.envLog('[EcovacsMQTT] client connected');
        });

        this.client.on('message', (topic, message) => {
            tools.envLog('[EcovacsMQTT] message: %s', message.toString());
            this._handle_ctl_mqtt(message);
            this.end();
        });

        this.client.on('error', (error) => {
            ecovacsMQTT.emit('error', packet.toString());
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
            })
        } catch (e) {
            throw new Error('[EcovacsMQTT] ' + e.message);
        }
        return {};
    }

    _handle_ctl_api(action, message) {
        let resp = null;
        let command = action;
        if (message !== undefined) {
            if ('resp' in message) {
                resp = this._ctl_to_dict_api(action, message['resp']);
            }
            else {
                command = action.name.replace("Get", "", 1).replace(/^_+|_+$/g, '');
                resp = {
                    'event': command.toLowerCase(),
                    'data': message
                };
            }
        }
        if (resp) {
            this._handle_command(command, resp.data);
        }
    }

    _ctl_to_dict_api(action, xmlstring) {
        let payloadXml = new DOMParser().parseFromString(xmlstring, 'text/xml');
        if (payloadXml.documentElement.hasChildNodes()) {
            let firstChild = payloadXml.documentElement.firstChild;
            let result = {};
            Object.assign(firstChild.attributes, result);
            //Fix for difference in XMPP vs API response
            //Depending on the report will use the tag and add "report" to fit the mold of ozmo library
            if (firstChild.name === "clean") {
                result['event'] = "CleanReport";
            } else if (firstChild.name === "charge") {
                result['event'] = "ChargeState";
            } else if (firstChild.name === "battery") {
                result['event'] = "BatteryInfo";
            } else { //Default back to replacing Get from the api cmdName
                result['event'] = action.name.replace("Get", "");
            }
        } else {
            let result = {};
            Object.assign(payloadXml.documentElement.attributes, result);
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

    _handle_ctl_mqtt(message) {
        let as_dict = this._ctl_to_dict_mqtt(message.topic, message.payload);
        if (as_dict !== null) {
            let command = as_dict['key'];
            this._handle_command(command, as_dict);
        }
    }

    _handle_command(command, event) {
        switch (command) {
            case "ChargeState":
                this.bot._handle_charge_state(event);
                this.emit(command, this.bot.charge_status);
                break;
            case "BatteryInfo":
                this.bot._handle_battery_info(event);
                this.emit(command, this.bot.battery_status);
                break;
            case "CleanReport":
                this.bot._handle_clean_report(event);
                this.emit(command, this.bot.clean_status);
                this.emit('FanSpeed', this.bot.fan_speed);
                break;
            case "LifeSpan":
                this.bot._handle_life_span(event);
                this.emit(command, this.bot.components);
                break;
            default:
                tools.envLog("[EcovacsMQTT._handle_ctl_mqtt] Unknown response type for command %s received: %s", command, event);
                break;
        }
    }

    _ctl_to_dict_mqtt(topic, xmlstring) {
        //Convert from string to xml (like IOT rest calls), other than this it is similar to XMPP
        let xml = new DOMParser().parseFromString(xmlstring, 'text/xml');
        if (!xml) return;

        //Including changes from jasonarends @ 28da7c2 below
        let result = {};
        result = Object.assign(xml.documentElement.attributes, result);
        if (!xml.documentElement.attributes.getNamedItem('td')) {
            // This happens for commands with no response data, such as PlaySound
            // Handle response data with no 'td'

            // single element with type and val
            if (xml.documentElement.attributes.getNamedItem('type')) {
                    // seems to always be LifeSpan type
                    result['event'] = "LifeSpan";
            } else {
                // case where there is child element
                if (xml.documentElement.hasChildNodes()) {
                    let firstChild = xml.documentElement.firstChild;
                    if (firstChild.name === 'clean') {
                        result['event'] = "CleanReport";
                    } else if (firstChild.name === 'charge') {
                        result['event'] = "ChargeState";
                    } else if (firstChild.name === 'battery') {
                        result['event'] = "BatteryInfo";
                    } else {
                        return;
                    }
                    Object.assign(firstChild.attributes, result);
                } else {
                    // for non-'type' result with no child element, e.g., result of PlaySound
                    return;
                }
            }
        } else {
            // response includes 'td'
            result['event'] = xml.documentElement.attributes.getNamedItem('td').name;
            xml.documentElement.removeAttribute('td');
            if (xml.documentElement.hasChildNodes()) {
                let firstChild = payloadXml.documentElement.firstChild;
                Object.assign(firstChild.attributes, result);
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
