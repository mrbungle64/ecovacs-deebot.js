const EventEmitter = require('events');
const tools = require('./tools');
const URL = require('url').URL;
const constants = require('./ecovacsConstants');
const https = require('https');
const DOMParser = require('xmldom').DOMParser;

String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    let args = arguments['0'];
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
            tools.envLog('[EcovacsMQTT] client connected');
            this.subscribe('iot/atr/+/' + vacuum_did + '/' + vacuum_class + '/' + vacuum_resource + '/+', (error, granted) => {
                if (!error) {
                    ecovacsMQTT.emit('ready', 'Client connected. Subscribe successful');
                } else {
                    tools.envLog('[EcovacsMQTT] subscribe err: %s', error.toString());
                }
            });
        });

        this.client.on('message', (topic, message) => {
            this._handle_message(topic, message.toString());
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
        tools.envLog("[EcovacsMQTT] c: %s", JSON.stringify(c, getCircularReplacer()));
        this._call_ecovacs_device_api(c).then((json) => {
            this._handle_command_response(action, json);
        }).catch((e) => {
            tools.envLog("[EcovacsMQTT] error send_command: %s", e.toString());
        });
    }

    _wrap_command_getPayload(action) {
        tools.envLog("[EcovacsMQTT] _wrap_command() args: ", action.args);

        let xml = action.to_xml();
        // Remove the td from ctl xml for RestAPI
        tools.envLog("[EcovacsMQTT] _wrap_command() DOMParser().parseFromString: %s", xml.toString());
        let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
        payloadXml.documentElement.removeAttribute('td');

        let payload = payloadXml.toString();
        tools.envLog("[EcovacsMQTT] _wrap_command() payload: %s", payload);

        return payload;
    }

    _wrap_command(action, recipient) {
        if (!action) {
            tools.envLog("[EcovacsMQTT] _wrap_command action missing: %s", JSON.stringify(action, getCircularReplacer()));
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

            "payloadType": "x",
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
            let headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(params))
            };

            url = new URL(url);
            tools.envLog(`[EcovacsMQTT] Calling ${url.href}`);
            const reqOptions = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: headers
            };
            tools.envLog("[EcovacsMQTT] Sending POST to", JSON.stringify(reqOptions, getCircularReplacer()));

            const req = https.request(reqOptions, (res) => {
                res.setEncoding('utf8');
                res.setTimeout(6000);
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(rawData);
                        if ((json['result'] === 'ok') || (json['ret'] === 'ok')) {
                            resolve(json);
                        } else {
                            tools.envLog("[EcovacsMQTT] call failed with %s", JSON.stringify(json, getCircularReplacer()));
                            throw "failure code: {errno}".format({
                                errno: json['errno']
                            });
                        }
                    } catch (e) {
                        console.error("[EcovacsMQTT] " + e.toString());
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`[EcoVacsAPI] problem with request: ${e.message}`);
                reject(e);
            });

            // write data to request body
            tools.envLog("[EcovacsMQTT] Sending", JSON.stringify(params, getCircularReplacer()));
            req.write(JSON.stringify(params));
            req.end();
        });
    }

    _handle_command_response(action, message) {
        let resp = null;
        let command = action;
        tools.envLog("[EcovacsMQTT] _handle_command_response() action: %s", action);

        if (action.hasOwnProperty('name')) {
            command = action.name;
            tools.envLog("[EcovacsMQTT] _handle_command_response() command: %s", command);
        }

        if (message) {
            tools.envLog("[EcovacsMQTT] _handle_command_response() message: %s", JSON.stringify(message, getCircularReplacer()));
            if (message.hasOwnProperty('resp')) {
                tools.envLog("[EcovacsMQTT] _handle_command_response() resp(0): %s", command, JSON.stringify(resp, getCircularReplacer()));
                resp = this._command_to_dict_api(action, message['resp']);
                tools.envLog("[EcovacsMQTT] _handle_command_response() resp(1): %s", command, JSON.stringify(resp, getCircularReplacer()));
            }
            else {
                resp = {
                    'event': command,
                    'data': message
                };
                tools.envLog("[EcovacsMQTT] _handle_command_response() resp(2): %s", command, JSON.stringify(resp, getCircularReplacer()));
            }
            this._handle_command(command, resp);
        }
    }

    _command_to_dict_api(action, xmlString) {
        let result = {};
        let name = null;
        let payloadXml = new DOMParser().parseFromString(xmlString, 'text/xml');
        if (payloadXml.documentElement.hasChildNodes()) {
            let firstChild = payloadXml.documentElement.firstChild;
            name = firstChild.name.replace("Get", "");
            if (name) {
                result = Object.assign(result, firstChild.attributes);
                //Fix for difference in XMPP vs API response
                //Depending on the report will use the tag and add "report" to fit the mold of ozmo library
                result['event'] = tools.getEventNameForCommandString(name);
            } else {
                result = Object.assign(result, payloadXml.documentElement.attributes);
                result['event'] = action.name.replace("Get", "");
                if (result.hasOwnProperty('ret')) { //Handle errors as needed
                    if (result['ret'] === 'fail') {
                        if (result['event'].toLowerCase() === "charge") { //So far only seen this with Charge, when already docked
                            result['event'] = "ChargeState";
                        }
                    }
                }
                return result;
            }
        }
    }

    _dict_to_command(json) {
        if (json.hasOwnProperty('ctl')) {
            return json['ctl'];
        }
        else {
            return json['event'];
        }
    }

    _handle_message(topic, payload) {
        let as_dict = this._message_to_dict(topic, payload);
        if (as_dict) {

            tools.envLog("[EcovacsMQTT] as_dict: %s", JSON.stringify(as_dict, getCircularReplacer()));

            let command = this._dict_to_command(as_dict);
            if (command) {
                tools.envLog("[EcovacsMQTT] command: %s", command);
                this._handle_command(command, as_dict);
            }
        } else {
            tools.envLog("[EcovacsMQTT] as_dict undefined");
        }
    }

    _message_to_dict(topic, xmlString) {
        let name = null;
        tools.envLog("[EcovacsMQTT] _message_to_dict topic: %s", topic.name, " ", topic);

        if (!xmlString) {
            tools.envLog("[EcovacsMQTT] _message_to_dict xmlString missing ... topic: %s", topic);
            return {};
        }
        //Convert from string to xml (like IOT rest calls), other than this it is similar to XMPP
        tools.envLog("[EcovacsMQTT] _message_to_dict() xmlString: %s", xmlString);
        let xml = new DOMParser().parseFromString(xmlString, 'text/xml').documentElement;
        let result = {};

        if (!xml.attributes.getNamedItem('td')) {
            // Handle response data with no 'td'
            if (xml.attributes.getNamedItem('type')) {
                // single element with type and val seems to always be LifeSpan type
                name = "LifeSpan";
            } else if (xml.hasChildNodes()) {
                // case where there is child element
                name = xml.firstChild.name;
            }
        } else if (xml.attributes) {
            // response includes 'td'
            name = xml.attributes.getNamedItem('td').value;
        }

        if (name) {
            let attrs = {};
            if (xml.hasChildNodes()) {
                for (let i = 0; i < xml.firstChild.attributes.length; i++) {
                    attrs[xml.firstChild.attributes[i].name] = xml.firstChild.attributes[i].value;
                }
            } else if (xml.attributes) {
                for (let i = 0; i < xml.attributes.length; i++) {
                    attrs[xml.attributes[i].name] = xml.attributes[i].value;
                }
            }
            result = {
                'event': tools.getEventNameForCommandString(name),
                'attrs': attrs
            };
        }
        return result
    }

    _handle_command(command, event) {
        tools.envLog("[EcovacsMQTT] _handle_command() command %s received event: %s", command, JSON.stringify(event, getCircularReplacer()));
        switch (tools.getEventNameForCommandString(command)) {
            case "ChargeState":
                this.bot._handle_charge_state(event);
                this.emit("ChargeState", this.bot.charge_status);
                break;
            case "BatteryInfo":
                this.bot._handle_battery_info(event);
                this.emit("BatteryInfo", this.bot.battery_status);
                break;
            case "CleanReport":
                this.bot._handle_clean_report(event);
                this.emit("CleanReport", this.bot.clean_status);
                break;
            case "LifeSpan":
                this.bot._handle_life_span(event.attrs);
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
            case "DeebotPosition":
                this.bot._handle_deebot_position(event);
                let deebotPosition = this.bot.deebot_position["x"] + "," + this.bot.deebot_position["y"];
                if (this.bot.deebot_position["a"]) {
                    deebotPosition = deebotPosition + "," + this.bot.deebot_position["a"];
                }
                this.emit('DeebotPosition', deebotPosition);
                break;
            case "WaterLevel":
                this.bot._handle_water_level(event);
                break;
            case 'DustCaseST':
                this.bot._handle_dustbox_info(event);
                this.emit('DustCaseInfo', this.bot.dustbox_info);
                break;
            default:
                tools.envLog("[EcovacsMQTT] Unknown command received: %s", command);
                break;
        }
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {}

    //end session
    disconnect() {
        tools.envLog("[EcovacsMQTT] Closing MQTT Client...");
        try{
            this.client.end();
            tools.envLog("[EcovacsMQTT] Closed MQTT Client");
        } catch(e) {
            tools.envLog("[EcovacsMQTT] Error closing MQTT Client:  %s", e.toString());
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

module.exports = EcovacsMQTT;
