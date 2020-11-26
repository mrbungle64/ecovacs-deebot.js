const EcovacsMQTT = require('./ecovacsMQTT');
const tools = require('./tools.js');
const URL = require('url').URL;
const constants = require('./ecovacsConstants');
const https = require('https');

class EcovacsMQTT_JSON extends EcovacsMQTT {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port = 8883) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port);
    }

    send_command(action, recipient) {
        let c = this._wrap_command(action, recipient);
        tools.envLog("[EcovacsMQTT_JSON] c: %s", JSON.stringify(c, getCircularReplacer()));
        this._call_ecovacs_device_api(c, action.api).then((json) => {
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
        if (action.api == constants.IOTDEVMANAGERAPI) {
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
        if (action.api == constants.LGLOGAPI) {
            if(action.name == 'Pull') { //temporary quickndirty to test new function
                return {
                    "did": recipient,
                    "country": this.country,
                    "td": action.name,
                    "k": "db.CleanF", "asc": true, "limit": 20,
                    "auth": {
                        "token": this.secret,
                        "resource": this.resource,
                        "userid": this.user,
                        "with": "users",
                        "realm": constants.REALM
                    },
                    "resource": "BTKk"
                }
            } else 
            return {
                "did": recipient,
                "country": this.country,
                "td": action.name,
                "auth": {
                    "token": this.secret,
                    "resource": this.resource,
                    "userid": this.user,
                    "with": "users",
                    "realm": constants.REALM
                },
                "resource": "BTKk"
            }
        }
    }

    _call_ecovacs_device_api(params, api) {
        return new Promise((resolve, reject) => {
            let url = (constants.PORTAL_URL_FORMAT + '/' + api).format({
                continent: this.continent
            });
            url = url + "?cv=1.67.3&t=a&av=1.3.1";
            if (api == constants.IOTDEVMANAGERAPI) {
                url = url + "&mid=" + params['toType'] + "&did=" + params['toId'] + "&td=" + params['td'] + "&u=" + params['auth']['userid'];
            }

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
                        //tools.envLog("[EcovacsMQTT_JSON] call raw response %s", rawData);
                        const json = JSON.parse(rawData);
                        tools.envLog("[EcovacsMQTT_JSON] call response %s", JSON.stringify(json, getCircularReplacer()));
                        if ((json['result'] === 'ok') || (json['ret'] === 'ok')) {
                            resolve(json);
                        } else {
                            tools.envLog("[EcovacsMQTT_JSON] call failed with %s", JSON.stringify(json, getCircularReplacer()));
                            this.bot._handle_error({resultData: {code: json['errno']}});
                            this.emit("Error", this.bot.errorDescription);
                            this.emit('ErrorCode', this.bot.errorCode);
                            if(json['errno'] == 3) { //request oauth error
                                this.emit("disconnect", true);
                                this.disconnect();
                            }
                            throw "failure code: {errno}".format({
                                errno: json['errno']
                            });
                        }
                    } catch (e) {
                        tools.envLog("[EcovacsMQTT_JSON] error: " + e.toString());
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => {
                tools.envLog(`[EcoVacsAPI] problem with request: ${e.message}`);
                reject(e);
            });

            // write data to request body
            tools.envLog("[EcovacsMQTT_JSON] Sending", JSON.stringify(params, getCircularReplacer()));
            req.write(JSON.stringify(params));
            req.end();
        });
    }

    _handle_command_response(action, message) {
        let command = action.name;
        //action.args: arguments of the initial command that was sent
        tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() action: %s", action);
        tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() command: %s", command);

        if (message) {
            tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() message: %s", JSON.stringify(message, getCircularReplacer()));

            if (action.api == constants.IOTDEVMANAGERAPI && message.hasOwnProperty('resp')) {
                tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() resp(0): %s", command, JSON.stringify(message['resp'], getCircularReplacer()));
                this._handle_message(command, message['resp'], "response");
            } else if (action.api == constants.LGLOGAPI) {
                tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() resp(0): %s", command, JSON.stringify(message['resp'], getCircularReplacer()));
                this._handle_message(command, message, "logResponse");
            }
            else {
                tools.envLog("[EcovacsMQTT_JSON] _handle_command_response() invalid response");
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
        let resultData = message;

        if(type=="incoming"){
            // topic: iot/atr/onBattery/e0bc19bb-8cb1-43e3-8503-e9f810e35d36/yna5xi/BTKk/j
            eventName = topic.split('/')[2]; //parse 3rd element from string iot/atr/onPos/e0bc19bb-8cb1-43e3-8503-e9f810e35d36/yna5xi/BTKk/
            // message: {"header":{"pri":1,"tzm":480,"ts":"1581849631152","ver":"0.0.1","fwVer":"1.7.6","hwVer":"0.1.1"},"body":{"data":{"value":99,"isLow":0}}}
            message = JSON.parse(message);
            resultData = message['body']['data']; //nicht immer vorhanden "body":{"code":0,"msg":"ok"}}
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message incoming: %s", message);
        }
        if(type=="response") {
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message response: %s", JSON.stringify(message, getCircularReplacer()));
            // message: {"header":{"pri":1,"tzm":480,"ts":"1581849460440","ver":"0.0.1","fwVer":"1.7.6","hwVer":"0.1.1"},
            // "body":{"code":0,"msg":"ok","data":{"enable":0,"amount":4}}}
            resultCode = message['body']['code'];
            resultCodeMessage = message['body']['msg'];
            resultData = message['body']['data']; //nicht immer vorhanden "body":{"code":0,"msg":"ok"}}
        }
        if(type=="logResponse") {
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] _handle_message logResponse: %s", JSON.stringify(message, getCircularReplacer()));
            //{"ret":"ok","log":{"ts":1586430548,"last":1826,"area":32,"id":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee@1111111111@1a1a1","imageUrl":"https://portal-eu.ecouser.net/api/lg/image/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee@1111111111@1a1a","type":"auto","stopReason":2}}
            //{"ret":"ok","map":{"ts":1586294523,"imageUrl":"https://portal-eu.ecouser.net/api/lg/offmap/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee@1111111111@1a1a1a1"}}
            resultCodeMessage = message['ret'];
        }

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
        if(command.startsWith("on")) { //incoming events (on)
            command = command.substring(2);
        }
        if(command.startsWith("off")) { //incoming events for (3rd) unknown/unsaved map
            command = command.substring(3);
        }
        if(command.startsWith("report")) { //incoming events (report)
            command = command.substring(6);
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
                this.emit("CleanReport", this.bot.clean_status);
                this.emit("ChargeState", this.bot.charge_status);
                if (this.bot.lastUsedAreaValues) {
                    tools.envLog('[EcovacsMQTT_JSON] LastUsedAreaValues: %s', this.bot.lastUsedAreaValues);
                    this.emit("LastUsedAreaValues", this.bot.lastUsedAreaValues);
                }
                break;
            case "cleanspeed":
            case "speed":
                this.bot._handle_fan_speed(event);
                this.emit("CleanSpeed", this.bot.fan_speed);
                break;
            case "relocationstate":
                this.bot._handle_relocation_state(event);
                this.emit("RelocationState", this.bot.relocation_state);
                break;
            case "cachedmapinfo":
                this.bot._handle_cachedmapinfo(event);
                this.emit("CurrentMapName", this.bot.currentMapName);
                this.emit("CurrentMapMID", this.bot.currentMapMID);
                this.emit("CurrentMapIndex", this.bot.currentMapIndex);
                this.emit("Maps", this.bot.maps);
                break;
            case "mapset": //handle spotAreas, virtualWalls, noMopZones
                let mapset = this.bot._handle_mapset(event);
                if(mapset["mapsetEvent"] != 'error' || mapset["mapsetEvent"] != 'skip'){ //skip if not both boundary types are already processed
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            case "mapsubset": //handle spotAreas, virtualWalls, noMopZones
                let mapsubset = this.bot._handle_mapsubset(event);
                if(mapsubset["mapsubsetEvent"] != 'error') { 
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
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
                if(this.bot.deebotPosition["changeFlag"]) {
                    if(this.bot.deebotPosition["isInvalid"]==true && (this.bot.relocation_state == 'ok' || this.bot.relocation_state == null)) {
                        this.bot.relocation_state = 'required';
                        this.emit("RelocationState", this.bot.relocation_state);
                    } else {
                        this.emit("DeebotPosition", this.bot.deebotPosition["x"]+","+this.bot.deebotPosition["y"]+","+this.bot.deebotPosition["a"]);
                        this.emit("DeebotPositionIsInvalid", this.bot.deebotPosition["isInvalid"]);
                        this.emit("DeebotPositionCurrentSpotAreaID", this.bot.deebotPosition["currentSpotAreaID"]);
                    }
                    this.bot.deebotPosition["changeFlag"]=false;
                }
                if(this.bot.chargePosition["changeFlag"]) {
                    this.emit("ChargePosition", this.bot.chargePosition["x"]+","+this.bot.chargePosition["y"]+","+this.bot.chargePosition["a"]);
                    this.bot.chargePosition["changeFlag"]=false;
                }
                break;
            case "waterinfo":
                this.bot._handle_water_info(event);
                this.emit("WaterBoxInfo", this.bot.waterbox_info);
                this.emit("WaterLevel", this.bot.water_level);
                break;
            case "netinfo":
                this.bot._handle_net_info(event);
                this.emit("NetInfoIP", this.bot.netInfoIP);
                this.emit("NetInfoWifiSSID", this.bot.netInfoWifiSSID);
                this.emit("NetInfoWifiSignal", this.bot.netInfoWifiSignal);
                this.emit("NetInfoMAC", this.bot.netInfoMAC);

                break;
            case "setwaterinfo":
                this.bot.run('GetWaterLevel');
                break;
            case "setspeed":
                this.bot.run('GetCleanSpeed');
                break;
            case 'sleep':
                this.bot._handle_sleep_status(event);
                this.emit("SleepStatus", this.bot.sleep_status);
                break;
            case "error":
                this.bot._handle_error(event);
                this.emit("Error", this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
                break;
            case 'totalstats':
                this.bot._handle_cleanSum(event);
                this.emit("CleanSum_totalSquareMeters", this.bot.cleanSum_totalSquareMeters);
                this.emit("CleanSum_totalSeconds", this.bot.cleanSum_totalSeconds);
                this.emit("CleanSum_totalNumber", this.bot.cleanSum_totalNumber);
                break;
            case 'cleanlogs':
                tools.envLog("[EcovacsMQTT_JSON] Logs: %s", JSON.stringify(event, getCircularReplacer()));
                this.bot._handle_cleanLogs(event);
                let cleanLog = [];
                for (let i in this.bot.cleanLog) {
                    if (this.bot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.bot.cleanLog[i]);
                        tools.envLog("[EcovacsMQTT_JSON] Logs: %s", JSON.stringify(this.bot.cleanLog[i], getCircularReplacer()));
                    }
                }
                if (cleanLog.length) {
                    this.emit("CleanLog", cleanLog);
                } else {
                    this.emit("Debug", "CleanLog is empty: " + JSON.stringify(event, getCircularReplacer())); //for debugging
                }
                if(!this.bot.lastCleanLogUseAlternativeAPICall) {
                    this.emit("CleanLog_lastImageUrl", this.bot.cleanLog_lastImageUrl);
                    this.emit("CleanLog_lastImageTimestamp", this.bot.cleanLog_lastImageTimestamp);
                }
                break;
            case 'lastcleanlog':
                tools.envLog("[EcovacsMQTT_JSON] lastcleanlog: %s", JSON.stringify(event, getCircularReplacer()));
                if (this.bot.lastCleanLogUseAlternativeAPICall) {
                    this.bot._handle_lastCleanLog(event);

                    if (this.bot.cleanLog_lastImageUrl) {
                        this.emit("CleanLog_lastImageUrl", this.bot.cleanLog_lastImageUrl);
                        this.emit("CleanLog_lastImageTimestamp", this.bot.cleanLog_lastImageTimestamp);
                    }
                }
                break;
            case 'pull':
                tools.envLog("[EcovacsMQTT_JSON] Logs: %s", JSON.stringify(event, getCircularReplacer()));
                break;
            default:
                tools.envLog("[EcovacsMQTT_JSON] Unknown command received: %s", command);
                break;
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
