const EventEmitter = require('events');
const tools = require('./tools.js');
const URL = require('url').URL;
const fs = require('fs');
const constants = require('./ecovacsConstants');
const request = require('request');
const https = require('https');
const DOMParser = require('xmldom').DOMParser;

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
            tools.envLog('[EcovacsMQTT] message topic: %s', topic.toString());
            tools.envLog('[EcovacsMQTT] message message: %s', message.toString());
            this._handle_message(topic.toString(), message.toString());
            this.client.end();
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
        if (action.name.toLowerCase() === 'clean') {
            if (!action.args.hasOwnProperty('act')) {
                action.args['act'] = constants.CLEAN_ACTION_TO_ECOVACS['start'];
            }
        }
        let c = this._wrap_command(action, recipient);
        tools.envLog("[EcovacsMQTT] c: %s", JSON.stringify(c));
        this.__call_ecovacs_device_api(c).then((json) => {
            this._handle_command_api(action, json);
        }).catch((e) => {
            tools.envLog("[EcovacsMQTT] send_command: %s", e.toString());
        });
    }

    _wrap_command(action, recipient) {
        let payload = null;
        let payloadType = null;

        if (this.bot.isOzmo950()) {
            // All requests need to have this header -- not sure about timezone and ver
            let payloadRequest = [];
            payloadRequest['header'] = [];
            payloadRequest['header']['pri'] = '2';
            payloadRequest['header']['ts'] = Math.floor(Date.now());
            payloadRequest['header']['tmz'] = 480;
            payloadRequest['header']['ver'] = '0.0.22';

            if (action.args.length > 0) {
                payloadRequest['body'] = [];
                payloadRequest['body']['data'] = action.args;
            }

            payload = payloadRequest;
            payloadType = "j";
        } else {
            let xml = action.to_xml();
            if (!xml) {
                tools.envLog("[EcovacsMQTT] _wrap_command: %s", action.to_xml());
                return {};
            }
            // Remove the td from ctl xml for RestAPI
            let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
            payloadXml.documentElement.removeAttribute('td');

            payload = payloadXml.toString();
            payloadType = "x";
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
            "payload": payload,

            "payloadType": payloadType,
            "td": "q",
            "toId": recipient,
            "toRes": this.vacuum['resource'],
            "toType": this.vacuum['class']
        }
    }

    __call_ecovacs_device_api(args) {
        let params = {};
        for (let key in args) {
            if (args.hasOwnProperty(key)) {
                params[key] = args[key];
            }
        }

        return new Promise((resolve, reject) => {
            let url = (constants.PORTAL_URL_FORMAT + '/' + constants.IOTDEVMANAGERAPI).format({
                continent: this.continent
            });
            let headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(params))
            };
            if (this.bot.isOzmo950()) {
                url = url + "?mid=" + params['toType'] + "&did=" + params['toId'] + "&td=" + params['td'] + "&u=" + params['auth']['userid'] + "&cv=1.67.3&t=a&av=1.3.1";
                headers = Object.assign(headers, { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)' });
            }
            url = new URL(url);
            tools.envLog(`[EcovacsMQTT] Calling ${url.href}`);

            const reqOptions = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: headers
            };
            tools.envLog("[EcovacsMQTT] Sending POST to", JSON.stringify(reqOptions));

            const req = https.request(reqOptions, (res) => {
                res.setEncoding('utf8');
                res.setTimeout(60000);
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
                            tools.envLog("[EcovacsMQTT] call failed with %s", JSON.stringify(json));
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
            tools.envLog("[EcovacsMQTT] Sending", JSON.stringify(params));
            req.write(JSON.stringify(params));
            req.end();
        });
    }

    _handle_command_api(action, message) {
        let resp = null;
        let command = action;
        if (message) {
            if (message.hasOwnProperty('resp')) {
                resp = this._command_to_dict_api(action, message['resp']);
            }
            else if (action.hasOwnProperty('name')) {
                command = action.name.replace(/^_+|_+$/g, '');
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

    _command_to_dict_api(action, xmlOrJson) {
        // TODO: fix duplicate code
        let result = {};
        if (!xmlOrJson) {
            tools.envLog("[EcovacsMQTT] _command_to_dict_api action: %s", action);
            return result;
        }
        let isJson = false;
        try {
            xmlOrJson = JSON.parse(xmlOrJson);
            tools.envLog("[EcovacsMQTT] _command_to_dict_api JSON: %s", xmlOrJson);
            isJson = true;
        } catch (e) {
            tools.envLog("[EcovacsMQTT] _command_to_dict_api xmlString: %s", xmlOrJson);
        }
        let name = null;
        if ((isJson) && (xmlOrJson.hasOwnProperty('body'))) {
            let result = xmlOrJson;
            if (result['body']['msg'] === 'ok') {
                name = action.name.toLowerCase();
                if (name === 'cleaninfo') {
                    result['event'] = "CleanReport";
                } else if (name === 'chargestate') {
                    result['event'] = "ChargeState";
                } else if (name === 'battery') {
                    result['event'] = "BatteryInfo";
                } else { //Default back to replacing Get from the api cmdName
                    result['event'] = name.replace("Get", "");
                }
            }
            return result;
        }
        else {
            let xmlString = xmlOrJson;
            let payloadXml = new DOMParser().parseFromString(xmlString, 'text/xml');
            if (payloadXml.documentElement.hasChildNodes()) {
                let firstChild = payloadXml.documentElement.firstChild;
                name = firstChild.name;
            }
            if (name) {
                result = Object.assign(result, firstChild.attributes);
                //Fix for difference in XMPP vs API response
                //Depending on the report will use the tag and add "report" to fit the mold of ozmo library
                if (name === "clean") {
                    result['event'] = "CleanReport";
                } else if (name === "charge") {
                    result['event'] = "ChargeState";
                } else if (name === "battery") {
                    result['event'] = "BatteryInfo";
                } else { //Default back to replacing Get from the api cmdName
                    result['event'] = action.name.replace("Get", "");
                }
            } else {
                result = Object.assign(result, payloadXml.documentElement.attributes);
                result['event'] = action.name.replace("Get", "");
                if (result.hasOwnProperty('ret')) { //Handle errors as needed
                    if (result['ret'] === 'fail') {
                        if (action.name === "Charge") { //So far only seen this with Charge, when already docked
                            result['event'] = "ChargeState";
                        }
                    }
                }
                return result;
            }
        }
    }

    _handle_message(topic, payload) {
        let as_dict = this._message_to_dict(topic, payload);
        if (as_dict) {
            let command = as_dict['key'];
            this._handle_command(command, as_dict);
        }
        else {
            tools.envLog("[EcovacsMQTT] as_dict undefined");
        }
    }

    _message_to_dict(topic, xmlOrJson) {
        // TODO: fix duplicate code
        if (!xmlOrJson) {
            tools.envLog("[EcovacsMQTT] _message_to_dict topic: %s", topic);
            return {};
        }
        let isJson = false;
        try {
            xmlOrJson = JSON.parse(xmlOrJson);
            tools.envLog("[EcovacsMQTT] _message_to_dict JSON: %s", xmlOrJson);
            isJson = true;
        } catch (e) {
            tools.envLog("[EcovacsMQTT] _message_to_dict xmlString: %s", xmlOrJson);
        }
        let name = null;
        if ((isJson) && (xmlOrJson.hasOwnProperty('body'))) {
            let result = xmlOrJson;
            if (result['body']['msg'] === 'ok') {
                name = action.name.toLowerCase();
                if (name === 'cleaninfo') {
                    result['event'] = "clean_report";
                } else if (name === 'chargestate') {
                    result['event'] = "charge_state";
                } else if (name === 'battery') {
                    result['event'] = "battery_info";
                } else if (name === 'lifespan') {
                    result['event'] = "life_span";
                } else { //Default back to replacing Get from the api cmdName
                    result['event'] = name.replace("Get", "");
                }
            } else {
                if (result['body']['msg'] === 'fail') {
                    if (name === "charge") {
                        result['event'] = "charge_state";
                    }
                }
            }
            return result;
        }
        else {
            //Convert from string to xml (like IOT rest calls), other than this it is similar to XMPP
            let xmlString = xmlOrJson;
            let xml = new DOMParser().parseFromString(xmlString, 'text/xml');
            let result = tools.xmlDocumentElement2Json(xml.documentElement);

            // Handle response data with no 'td'
            if (!xml.documentElement.attributes.getNamedItem('td')) {

                // single element with type and val
                if (xml.documentElement.attributes.getNamedItem('type')) {
                    // seems to always be LifeSpan type
                    result['event'] = "LifeSpan";
                } else {
                    // case where there is child element
                    if (xml.documentElement.hasChildNodes()) {
                        let name = xml.documentElement.firstChild.name;
                        if (name === 'clean') {
                            result['event'] = "CleanReport";
                        } else if (name === 'charge') {
                            result['event'] = "ChargeState";
                        } else if (name === 'battery') {
                            result['event'] = "BatteryInfo";
                        } else {
                            return;
                        }
                    } else {
                        // for non-'type' result with no child element, e.g., result of PlaySound
                        return;
                    }
                }
            } else {
                // response includes 'td'
                result['event'] = xml.documentElement.attributes.getNamedItem('td').name.replace("Server", "");
                if (xml.documentElement.hasChildNodes()) {
                    let firstChild = payloadXml.documentElement.firstChild;
                    result = Object.assign(result, firstChild.attributes);
                }
                delete result['td'];
            }
            return result
        }
    }

    _handle_command(command, event) {
        command = command.replace("Get", "").toLowerCase();
        switch (command) {
            case "chargestate":
                this.bot._handle_charge_state(event);
                this.emit("ChargeState", this.bot.charge_status);
                break;
            case "batteryinfo":
                this.bot._handle_battery_info(event);
                this.emit("BatteryInfo", this.bot.battery_status);
                break;
            case "cleanreport":
                this.bot._handle_clean_report(event);
                this.emit("CleanReport", this.bot.clean_status);
                break;
            default:
                tools.envLog("[EcovacsMQTT] Unknown response type for command %s received: %s", command, event);
                break;
        }
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {}
}

module.exports = EcovacsMQTT;
