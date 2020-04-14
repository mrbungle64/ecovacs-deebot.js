const EventEmitter = require('events');
const tools = require('./tools');
const URL = require('url').URL;
const constants = require('./ecovacsConstants');
const https = require('https');
const DOMParser = require('xmldom').DOMParser;
const dictionary = require('./ecovacsConstants_non950type');

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
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port) {
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
        this.country = country;
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
            // topic not necessary to handle message
            this._handle_message_payload(message.toString());
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
        this._call_ecovacs_device_api(c).then((json) => {
            this._handle_command_response(action, json);
        }).catch((e) => {
            tools.envLog("[EcovacsMQTT] error send_command: %s", e.toString());
        });
    }

    _wrap_command(action, recipient) {
        if (action.name === 'GetLogApiCleanLogs') {
            return {
                'auth': {
                    'realm': constants.REALM,
                    'resource': this.resource,
                    'token': this.secret,
                    'userid': this.user,
                    'with': 'users',
                },
                "did": recipient,
                "country": this.country,
                "td": "GetCleanLogs",
                "resource": this.vacuum['resource']
            }
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

    _wrap_command_getPayload(action) {
        let xml = action.to_xml();
        // Remove the td from ctl xml for RestAPI
        let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
        payloadXml.documentElement.removeAttribute('td');
        let payload = payloadXml.toString();
        return payload;
    }

    _call_ecovacs_device_api(params) {
        return new Promise((resolve, reject) => {
            let api = constants.IOTDEVMANAGERAPI;
            if (!params['cmdName']) {
                api = constants.LGLOGAPI;
            }
            let url = (constants.PORTAL_URL_FORMAT + '/' + api).format({
                continent: this.continent
            });
            let headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(params))
            };

            url = new URL(url);
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
            req.write(JSON.stringify(params));
            req.end();
        });
    }

    _handle_command_response(action, json) {
        let result = {};
        if (json.hasOwnProperty('resp')) {
            result = this._command_to_dict(json['resp'], action);
            this._handle_command(action.name, result);
        } else if (json.hasOwnProperty('logs')) {
            const children = [];
            for (let i=0; i < 20; i++) {
                children.push(json.logs[i]);
            }
            result = {
                'event': 'CleanLogs',
                'attrs': {
                    'count': 20
                },
                'children': children
            };
            this._handle_command(action.name, result);
        } else {
            tools.envLog('[EcovacsMQTT] Unknown response type received: %s', JSON.stringify(json, getCircularReplacer()));
        }
    }

    _handle_message_payload(payload) {
        let result = this._command_to_dict(payload);
        this._handle_command(result['event'], result);
    }

    _command_to_dict(xmlString) {
        const oParser = new DOMParser();
        const xml = oParser.parseFromString(xmlString, "text/xml");
        const firstChild = xml.childNodes[0];
        let attrs = {};
        let event = null;
        if (arguments.length > 1) {
            event = firstChild.tagName;
            const action = arguments[1];
            attrs = action.args
        } else {
            event = firstChild.attributes.getNamedItem('td').value;
        }
        let result = {
            'event': event,
            'attrs': attrs,
            'children': []
        };

        for (let i = 0; i < firstChild.attributes.length; i++) {
            result.attrs[firstChild.attributes[i].name] = firstChild.attributes[i].value;
            if (firstChild.childNodes) {
                for (let c = 0; c < firstChild.childNodes.length; c++) {
                    let childObject = {
                        'event': firstChild.childNodes[c].tagName,
                        'attrs': {}
                    };
                    for (let ca = 0; ca < firstChild.childNodes[c].attributes.length; ca++) {
                        childObject['attrs'][firstChild.childNodes[c].attributes[ca].name] = firstChild.childNodes[c].attributes[ca].value;
                    }
                    result.children.push(childObject);
                }
            }
        }
        return result;
    }

    _handle_command(command, event) {
        //tools.envLog("[EcovacsMQTT] _handle_command() command %s received event: %s", command, JSON.stringify(event, getCircularReplacer()));
        switch (tools.getEventNameForCommandString(command)) {
            case "MapP":
                let mapinfo = this.bot._handle_mapP(event);
                if (mapinfo) {
                    this.emit("CurrentMapName", this.bot.currentMapName);
                    this.emit("CurrentMapMID", this.bot.currentMapMID);
                    this.emit("CurrentMapIndex", this.bot.currentMapIndex);
                    this.emit("Maps", this.bot.maps);
                }
                break;
            case "MapSet":
                let mapset = this.bot._handle_mapSet(event);
                if (mapset["mapsetEvent"] !== 'error') {
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            case "PullM":
                let mapsubset = this.bot._handle_pullM(event);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            case 'ChargeState':
                this.bot._handle_chargeState(event.children[0]);
                this.emit('ChargeState', this.bot.chargeStatus);
                break;
            case 'BatteryInfo':
                this.bot._handle_batteryInfo(event.children[0]);
                this.emit('BatteryInfo', this.bot.batteryInfo);
                break;
            case 'CleanReport':
                if (event.children.length > 0) {
                    this.bot._handle_cleanReport(event.children[0]);
                } else {
                    this.bot._handle_cleanReport(event);
                }
                this.emit('CleanReport', this.bot.cleanReport);
                if (this.bot.lastUsedAreaValues) {
                    tools.envLog('[EcovacsXMPP] LastUsedAreaValues: %s', this.bot.lastUsedAreaValues);
                    this.emit("LastUsedAreaValues", this.bot.lastUsedAreaValues);
                }
                break;
            case "CleanSpeed":
                tools.envLog("[EcovacsMQTT] CleanSpeed: %s", JSON.stringify(event, getCircularReplacer()));
                this.bot._handle_cleanSpeed(event);
                this.emit("CleanSpeed", this.bot.cleanSpeed);
                break;
            case 'Error':
                this.bot._handle_error(event.attrs);
                this.emit('Error', this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
                break;
            case 'LifeSpan':
                this.bot._handle_lifeSpan(event.attrs);
                const component = dictionary.COMPONENT_FROM_ECOVACS[event.attrs.type];
                if (component) {
                    if (this.bot.components[component]) {
                        this.emit('LifeSpan_' + component, this.bot.components[component]);
                    }
                }
                break;
            case 'WaterLevel':
                this.bot._handle_waterLevel(event);
                this.emit('WaterLevel', this.bot.waterLevel);
                break;
            case 'WaterBoxInfo':
                this.bot._handle_waterboxInfo(event);
                this.emit('WaterBoxInfo', this.bot.waterboxInfo);
                break;
            case 'DustCaseST':
                this.bot._handle_dustcaseInfo(event);
                this.emit('DustCaseInfo', this.bot.dustcaseInfo);
                break;
            case 'DeebotPosition':
                this.bot._handle_deebotPosition(event);
                this.emit('DeebotPosition', this.bot.deebotPosition["x"]+","+this.bot.deebotPosition["y"]+","+this.bot.deebotPosition["a"]);
                this.emit("DeebotPositionCurrentSpotAreaID", this.bot.deebotPosition["currentSpotAreaID"]);
                break;
            case 'ChargePosition':
                this.bot._handle_chargePosition(event);
                this.emit('ChargePosition', this.bot.chargePosition["x"]+","+this.bot.chargePosition["y"]+","+this.bot.chargePosition["a"]);
                break;
            case 'NetInfo':
                this.bot._handle_netInfo(event.attrs);
                this.emit("NetInfoIP", this.bot.netInfoIP);
                this.emit("NetInfoWifiSSID", this.bot.netInfoWifiSSID);
                break;
            case 'SleepStatus':
                this.bot._handle_sleepStatus(event);
                this.emit("SleepStatus", this.bot.sleepStatus);
                break;
            case 'CleanSum':
                this.bot._handle_cleanSum(event);
                this.emit("CleanSum_totalSquareMeters", this.bot.cleanSum_totalSquareMeters);
                this.emit("CleanSum_totalSeconds", this.bot.cleanSum_totalSeconds);
                this.emit("CleanSum_totalNumber", this.bot.cleanSum_totalNumber);
                break;
            case 'CleanLogs':
                tools.envLog("[EcovacsMQTT] Logs: %s", JSON.stringify(event, getCircularReplacer()));
                this.bot._handle_cleanLogs(event);
                tools.envLog("[EcovacsMQTT] Logs: %s", this.bot.cleanLog);
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
        try {
            clearInterval(this.bot.ping_interval);
            this.client.end();
            tools.envLog("[EcovacsMQTT] Closed MQTT Client");
        } catch (e) {
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
