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

    _wrap_command_getPayloadType(action) {
        let payloadType = null;
        if (this.bot.isOzmo950()) {
            payloadType = "j";
        }
        else {
            payloadType = "x";
        }
        return payloadType;
    }

    _wrap_command_getPayload(action) {
        let payload = null;
        tools.envLog("[EcovacsMQTT] _wrap_command() args: ", action.args);
        if (this.bot.isOzmo950()) {
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
            tools.envLog("[EcovacsMQTT] _wrap_command() payload: %s", payload);
        } else {
            let xml = action.to_xml();
            // Remove the td from ctl xml for RestAPI
            tools.envLog("[EcovacsMQTT] _wrap_command() DOMParser().parseFromString: %s", xml.toString());
            let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
            payloadXml.documentElement.removeAttribute('td');

            payload = payloadXml.toString();
            tools.envLog("[EcovacsMQTT] _wrap_command() payload: %s", payloadXml.toString());
        }
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

            "payloadType": this._wrap_command_getPayloadType(action),
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
            tools.envLog("[EcovacsMQTT] Sending POST to", JSON.stringify(reqOptions, getCircularReplacer()));

            const req = https.request(reqOptions, (res) => {
                res.setEncoding('utf8');
                res.setTimeout(6000);
                tools.envLog("[EcovacsMQTT] (request statusCode:", res.statusCode);
                tools.envLog("[EcovacsMQTT] (request statusMessage:", res.statusMessage);
                tools.envLog("[EcovacsMQTT] (request url:", res.url);
                tools.envLog("[EcovacsMQTT] (request urlPathArgs:", res.urlPathArgs);
                tools.envLog("[EcovacsMQTT] (request headers:", res.headers);
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

    _command_to_dict_api(action, xmlOrJson) {
        // TODO: fix duplicate code
        let result = {};
        let name = null;
        if (!xmlOrJson) {
            tools.envLog("[EcovacsMQTT] _command_to_dict_api() xmlOrJson missing ... action: %s", action);
            return result;
        }
        if (tools.isValidJsonString(xmlOrJson) || this.bot.isOzmo950()) {
            tools.envLog("[EcovacsMQTT] _command_to_dict_api() isValidJsonString: %s", tools.isValidJsonString(xmlOrJson));
            tools.envLog("[EcovacsMQTT] _command_to_dict_api() isOzmo950: %s", this.bot.isOzmo950());
            let result = JSON.parse(xmlOrJson);
            if (result.hasOwnProperty('body')) {
                if (result['body']['msg'] === 'ok') {
                    result['event'] = tools.getEventNameForCommandString(action.name);
                }
            }
            return result;
        }
        else {
            tools.envLog("[EcovacsMQTT] _command_to_dict_api() isValidJsonString false: %s");
            let xmlString = xmlOrJson;
            let payloadXml = new DOMParser().parseFromString(xmlString, 'text/xml');
            if (payloadXml.documentElement.hasChildNodes()) {
                let firstChild = payloadXml.documentElement.firstChild;
                name = firstChild.name.replace("Get", "");
            }
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
        if (json.hasOwnProperty('body')) {

            return this._body_data_to_command(json['body']['data']);

        } else if (json.hasOwnProperty('ctl')) {

            return json['ctl']['td'];
        }
        else {
            return json['event'];
        }
    }

    _body_data_to_command(data) {
        // Ozmo 950 device only so far
        if (data.hasOwnProperty('isLow')) {
            return 'BatteryInfo';
        }
        else if (data.hasOwnProperty('state')) {
            if (data['state'] === 'clean') {
                return 'CleanReport';
            }
        }
        else if (data.hasOwnProperty('deebotPos')) {
            return 'DeebotPosition';
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

    _message_to_dict(topic, xmlOrJson) {
        // TODO: fix duplicate code
        let name = null;
        if (!xmlOrJson) {
            tools.envLog("[EcovacsMQTT] _message_to_dict topic: %s", topic);
            return {};
        }
        if (tools.isValidJsonString(xmlOrJson)) {
            let result = JSON.parse(xmlOrJson);
            if (xmlOrJson.hasOwnProperty('body')) {
                tools.envLog("[EcovacsMQTT] _message_to_dict body: %s", JSON.stringify(result['body'], getCircularReplacer()));
                if (result['body']['msg'] === 'ok') {
                    result['event'] = tools.getEventNameForCommandString(topic.name);
                    if (!result['event']) {
                        //Default back to replacing Get from the api cmdName
                        tools.envLog("[EcovacsMQTT] _message_to_dict default: %s", topic.name);
                        result['event'] = topic.name;
                    }
                } else if (result['body']['data']) {
                    let data = result['body']['data'];
                    if ((data.hasOwnProperty('cleanState'))) {
                        if (data['cleanstate']['type']) {
                            result['event'] = tools.getEventNameForCommandString(data['cleanstate']['type']);
                        }
                    }
                } else {
                    if (result['body']['msg'] === 'fail') {
                        if (name === "charge") {
                            result['event'] = "ChargeState";
                        }
                    }
                    if (!result['event']) {
                        tools.envLog("[EcovacsMQTT] _message_to_dict no command detected");
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
            let name = null;

            // Handle response data with no 'td'
            if (!xml.documentElement.attributes.getNamedItem('td')) {

                // single element with type and val
                if (xml.documentElement.attributes.getNamedItem('type')) {
                    // seems to always be LifeSpan type
                    result['event'] = "LifeSpan";
                } else {
                    // case where there is child element
                    if (xml.documentElement.hasChildNodes()) {
                        name = xml.documentElement.firstChild.name;
                        result['event'] = tools.getEventNameForCommandString(name);
                    } else {
                        // for non-'type' result with no child element, e.g., result of PlaySound
                        return;
                    }
                }
            } else {
                // response includes 'td'
                name = xml.documentElement.attributes.getNamedItem('td').name;
                result['event'] = tools.getEventNameForCommandString(name);
                if (xml.documentElement.hasChildNodes()) {
                    let firstChild = xml.documentElement.firstChild;
                    result = Object.assign(result, firstChild.attributes);
                }
                delete result['td'];
            }
            return result
        }
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
                this.bot._handle_life_span(event);
                break;
            case "DeebotPosition":
                this.bot._handle_deebot_position(event);
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
