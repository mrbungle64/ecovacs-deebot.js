const EcovacsMQTT = require('./ecovacsMQTT');
const tools = require('./tools.js');
const constants = require('./ecovacsConstants');

class EcovacsMQTT_JSON extends EcovacsMQTT {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port = 8883) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port);
    }

    sendCommand(action, recipient) {
        let c = this.wrapCommand(action, recipient);
        tools.envLog("[EcovacsMQTT_JSON] c: %s", JSON.stringify(c, getCircularReplacer()));
        this.callEcovacsDeviceAPI(c, action.api).then((json) => {
            this.handleCommandResponse(action, json);
        }).catch((e) => {
            tools.envLog("[EcovacsMQTT_JSON] callEcovacsDeviceAPI failed for cmd %s: %s", action.name, e.toString());
        });
    }

    wrapCommand_getPayload(action) {
        tools.envLog("[EcovacsMQTT_JSON] wrapCommand() args: ", JSON.stringify(action.args, getCircularReplacer()));
        // All requests need to have this header -- not sure about timezone and ver
        let payloadRequest = {};
        payloadRequest['header'] = {};
        payloadRequest['header']['pri'] = '2';
        payloadRequest['header']['ts'] = Math.floor(Date.now());
        payloadRequest['header']['tmz'] = 480;
        payloadRequest['header']['ver'] = '0.0.22';
        if (Object.keys(action.args).length > 0) {
            payloadRequest['body'] = {};
            payloadRequest['body']['data'] = action.args;
        }
        tools.envLog("[EcovacsMQTT_JSON] wrapCommand() payload: %s", JSON.stringify(payloadRequest, getCircularReplacer()));
        return payloadRequest;
    }

    wrapCommand(action, recipient) {
        if (!action) {
            tools.envLog("[EcovacsMQTT_JSON] wrapCommand action missing: %s", JSON.stringify(action, getCircularReplacer()));
            return {};
        }
        if (action.api === constants.IOTDEVMANAGERAPI) {
            return {
                'auth': {
                    'realm': constants.REALM,
                    'resource': this.resource,
                    'token': this.secret,
                    'userid': this.user,
                    'with': 'users',
                },
                "cmdName": action.name,
                "payload": this.wrapCommand_getPayload(action),

                "payloadType": "j",
                "td": "q",
                "toId": recipient,
                "toRes": this.vacuum['resource'],
                "toType": this.vacuum['class']
            }
        }
        if (action.api === constants.LGLOGAPI) {
            if (action.name === 'Pull') { //temporary quickndirty to test new function
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
                    "resource": this.vacuum['resource']
                }
            } else {
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
                    "resource": this.vacuum['resource']
                }
            }
        }
    }

    handleCommandResponse(action, message) {
        let command = action.name;
        //action.args: arguments of the initial command that was sent
        tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() action: %s", action);
        tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() command: %s", command);

        if (message) {
            tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() message: %s", JSON.stringify(message, getCircularReplacer()));

            if ((action.api === constants.IOTDEVMANAGERAPI) && message.hasOwnProperty('resp')) {
                tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() resp(0): %s", command, JSON.stringify(message['resp'], getCircularReplacer()));
                this.handleMessage(command, message['resp'], "response");
            } else if (action.api === constants.LGLOGAPI) {
                tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() resp(0): %s", command, JSON.stringify(message['resp'], getCircularReplacer()));
                this.handleMessage(command, message, "logResponse");
            } else {
                tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() invalid response");
            }
        }
    }

    handleMessage(topic, message, type = "incoming") {
        if (!message) {
            tools.envLog("[EcovacsMQTT_JSON] handleMessage message missing ... topic: %s", topic);
        }

        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage type: %s", type);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage topic: %s", topic);

        let eventName = topic;
        let resultCode = "0";
        let resultCodeMessage = "ok";
        let resultData = message;

        if (type === "incoming") {
            eventName = topic.split('/')[2]; //parse 3rd element from string iot/atr/onPos/e0bc19bb-8cb1-43e3-8503-e9f810e35d36/yna5xi/BTKk/
            message = JSON.parse(message);
            resultData = message['body']['data']; //nicht immer vorhanden "body":{"code":0,"msg":"ok"}}
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage incoming: %s", message);
        }
        if (type === "response") {
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage response: %s", JSON.stringify(message, getCircularReplacer()));
            resultCode = message['body']['code'];
            resultCodeMessage = message['body']['msg'];
            resultData = message['body']['data']; //nicht immer vorhanden "body":{"code":0,"msg":"ok"}}
        }
        if (type === "logResponse") {
            tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage logResponse: %s", JSON.stringify(message, getCircularReplacer()));
            resultCodeMessage = message['ret'];
        }

        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage eventName: %s", eventName);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage resultCode: %s", resultCode);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage resultCodeMessage: %s", resultCodeMessage);
        tools.envLog("[DEBUG_INCOMING]", "[EcovacsMQTT_JSON] handleMessage resultData: %s", JSON.stringify(resultData, getCircularReplacer()));

        let result = {"resultCode": resultCode, "resultCodeMessage": resultCodeMessage, "resultData": resultData};

        this.handleCommand(eventName, result);
    }

    handleCommand(command, event) {
        tools.envLog("[EcovacsMQTT_JSON] handleCommand() command %s received event: %s", command, JSON.stringify(event, getCircularReplacer()));
        command = command.toLowerCase().replace(/^_+|_+$/g, '');
        //incoming events (on)
        if (command.startsWith("on")) {
            command = command.substring(2);
        }
        //incoming events for (3rd) unknown/unsaved map
        if (command.startsWith("off")) {
            command = command.substring(3);
        }
        //incoming events (report)
        if (command.startsWith("report")) {
            command = command.substring(6);
        }
        //remove from "get" commands
        if (command.startsWith("get")) {
            command = command.substring(3);
        }
        // OZMO T8 series
        // Not sure if the lowercase variant is necessary
        if (command.endsWith("_V2") || command.endsWith("_v2")) {
            command = command.slice(0, -3);
        }
        if (event.hasOwnProperty('resultCode')) {
            const resultCode = event['resultCode'];
            if (resultCode != 0) {
                this.bot.handle_error(event);
                this.emit("Error", command + ': ' + resultCode);
                this.emit('ErrorCode', 'resultCode');
                this.emit('LastError', {
                    'error': this.bot.errorDescription,
                    'code': this.bot.errorCode
                });
                return;
            }
        }
        switch (command) {
            case "stats":
                this.bot.handle_stats(event);
                if (this.bot.currentStats) {
                    this.emit("CurrentStats", this.bot.currentStats);
                    this.bot.currentStats = null;
                }
                break;
            case "chargestate":
                this.bot.handle_chargeState(event);
                if (this.bot.chargeStatus) {
                    this.emit("ChargeState", this.bot.chargeStatus);
                }
                break;
            case "battery":
            case "batteryinfo":
                this.bot.handle_batteryInfo(event);
                this.emit("BatteryInfo", this.bot.batteryInfo);
                break;
            case "cleaninfo":
                this.bot.handle_cleanReport(event);
                this.emit("CleanReport", this.bot.cleanReport);

                // report+waterinfo
                if (this.bot.cleanReport != undefined && this.bot.waterboxInfo != undefined)
                    this.emit("CleanReportDetails", {
                        'status': this.bot.cleanReport,
                        'waterInfo': {
                            'enabled': this.bot.waterboxInfo,
                            'level': this.bot.waterLevel
                        }
                    });

                if (this.bot.chargeStatus) {
                    this.emit("ChargeState", this.bot.chargeStatus);
                }
                if (this.bot.lastUsedAreaValues) {
                    tools.envLog('[EcovacsMQTT_JSON] LastUsedAreaValues: %s', this.bot.lastUsedAreaValues);
                    this.emit("LastUsedAreaValues", this.bot.lastUsedAreaValues);
                }
                break;
            case "cleanspeed":
            case "speed":
                this.bot.handle_cleanSpeed(event);
                this.emit("CleanSpeed", this.bot.cleanSpeed);
                break;
            case "relocationstate":
                this.bot.handle_relocationState(event);
                this.emit("RelocationState", this.bot.relocationState);
                break;
            case "cachedmapinfo":
                this.bot.handle_cachedMapInfo(event);
                this.emit("CurrentMapName", this.bot.currentMapName);
                this.emit("CurrentMapMID", this.bot.currentMapMID);
                this.emit("CurrentMapIndex", this.bot.currentMapIndex);
                this.emit("Maps", this.bot.maps);
                break;
            case "mapset": //handle spotAreas, virtualWalls, noMopZones
                let mapset = this.bot.handle_mapSet(event);
                if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            case "mapsubset": //handle spotAreas, virtualWalls, noMopZones
                let mapsubset = this.bot.handle_mapSubset(event);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            case "lifespan":
                this.bot.handle_lifespan(event);
                const r = {};
                if (this.bot.components["filter"]) {
                    this.emit("LifeSpan_filter", this.bot.components["filter"]);
                    r["filter"] = this.bot.components["filter"];
                }
                if (this.bot.components["side_brush"]) {
                    this.emit("LifeSpan_side_brush", this.bot.components["side_brush"]);
                    r["sideBrush"] = this.bot.components["side_brush"];
                }
                if (this.bot.components["main_brush"]) {
                    this.emit("LifeSpan_main_brush", this.bot.components["main_brush"]);
                    r["mainBrush"] = this.bot.components["main_brush"];
                }

                if (this.bot.components["filter"] && this.bot.components["side_brush"] && this.bot.components["main_brush"]) {
                    this.emit("LifeSpan", r);
                }
                if (this.bot.components["filter"] || this.bot.components["side_brush"] || this.bot.components["main_brush"])
                    this.emit("LifeSpanStats", r);
                break;
            case "pos":
                this.bot.handle_deebotPosition(event);
                if (this.bot.deebotPosition["changeFlag"]) {
                    if ((this.bot.deebotPosition["isInvalid"] === true) && ((this.bot.relocationState === 'ok') || (this.bot.relocationState === null))) {
                        this.bot.relocationState = 'required';
                        this.emit("RelocationState", this.bot.relocationState);
                    } else if (this.bot.deebotPosition["x"] && this.bot.deebotPosition["y"]) {
                        this.emit("DeebotPosition", this.bot.deebotPosition["x"] + "," + this.bot.deebotPosition["y"] + "," + this.bot.deebotPosition["a"]);
                        this.emit("DeebotPositionIsInvalid", this.bot.deebotPosition["isInvalid"]);
                        this.emit("DeebotPositionCurrentSpotAreaID", this.bot.deebotPosition["currentSpotAreaID"]);
                        this.emit('Position', {
                            'coords': this.bot.deebotPosition['x'] + "," + this.bot.deebotPosition['y'] + "," + this.bot.deebotPosition['a'],
                            'x': this.bot.deebotPosition['x'],
                            'y': this.bot.deebotPosition['y'],
                            'a': this.bot.deebotPosition['a'],
                            'invalid': this.bot.deebotPosition["isInvalid"],
                            'spotAreaID': this.bot.deebotPosition["currentSpotAreaID"]
                        });
                    }
                    this.bot.deebotPosition["changeFlag"] = false;
                }
                if (this.bot.chargePosition["changeFlag"]) {
                    this.emit("ChargePosition", this.bot.chargePosition["x"] + "," + this.bot.chargePosition["y"] + "," + this.bot.chargePosition["a"]);
                    this.emit('ChargingPosition', {
                        'coords': this.bot.chargePosition['x'] + "," + this.bot.chargePosition['y'] + "," + this.bot.chargePosition['a'],
                        'x': this.bot.deebotPosition['x'],
                        'y': this.bot.deebotPosition['y'],
                        'a': this.bot.deebotPosition['a']
                    });
                    this.bot.chargePosition["changeFlag"] = false;
                }
                break;
            case "waterinfo":
                this.bot.handle_waterInfo(event);
                this.emit("WaterBoxInfo", this.bot.waterboxInfo);
                this.emit("WaterLevel", this.bot.waterLevel);
                this.emit("WaterInfo", {
                    'enabled': this.bot.waterboxInfo,
                    'level': this.bot.waterLevel
                });

                // report+waterinfo
                if (this.bot.cleanReport != undefined && this.bot.waterboxInfo != undefined)
                    this.emit("CleanReportDetails", {
                        'status': this.bot.cleanReport,
                        'waterInfo': {
                            'enabled': this.bot.waterboxInfo,
                            'level': this.bot.waterLevel
                        }
                    });
                break;
            case "netinfo":
                this.bot.handle_netInfo(event);
                this.emit("NetInfoIP", this.bot.netInfoIP); // Deprecated
                this.emit("NetInfoWifiSSID", this.bot.netInfoWifiSSID); // Deprecated
                this.emit("NetInfoWifiSignal", this.bot.netInfoWifiSignal); // Deprecated
                this.emit("NetInfoMAC", this.bot.netInfoMAC); // Deprecated
                this.emit("NetworkInfo", {
                    'ip': this.bot.netInfoIP,
                    'mac': this.bot.netInfoMAC,
                    'wifiSSID': this.bot.netInfoWifiSSID,
                    'wifiSignal': this.bot.netInfoWifiSignal,
                });
                break;
            case 'sleep':
                this.bot.handle_sleepStatus(event);
                this.emit("SleepStatus", this.bot.sleepStatus);
                break;
            case 'autoempty':
                this.bot.handle_autoEmpty(event);
                this.emit("AutoEmpty", this.bot.autoEmpty);
                break;
            case 'volume':
                this.bot.handle_volume(event);
                this.emit("Volume", this.bot.volume);
                break;
            case "error":
                this.bot.handle_error(event);
                this.emit("Error", this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
                this.emit('LastError', {
                    'error': this.bot.errorDescription,
                    'code': this.bot.errorCode
                });
                break;
            case 'totalstats':
                this.bot.handle_cleanSum(event);
                this.emit("CleanSum_totalSquareMeters", this.bot.cleanSum_totalSquareMeters); // Deprecated
                this.emit("CleanSum_totalSeconds", this.bot.cleanSum_totalSeconds); // Deprecated
                this.emit("CleanSum_totalNumber", this.bot.cleanSum_totalNumber); // Deprecated
                this.emit('CleanSum', {
                    'totalSquareMeters': this.bot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.bot.cleanSum_totalSeconds,
                    'totalNumber': this.bot.cleanSum_totalNumber
                });
                break;
            case 'cleanlogs':
                tools.envLog("[EcovacsMQTT_JSON] Logs: %s", JSON.stringify(event, getCircularReplacer()));
                this.bot.handle_cleanLogs(event);
                let cleanLog = [];
                for (let i in this.bot.cleanLog) {
                    if (this.bot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.bot.cleanLog[i]);
                        tools.envLog("[EcovacsMQTT_JSON] Logs: %s", JSON.stringify(this.bot.cleanLog[i], getCircularReplacer()));
                    }
                }
                this.emit("CleanLog", cleanLog);
                this.emit("CleanLog_lastImageUrl", this.bot.cleanLog_lastImageUrl);
                this.emit("CleanLog_lastImageTimestamp", this.bot.cleanLog_lastTimestamp); // Deprecated
                this.emit("CleanLog_lastTimestamp", this.bot.cleanLog_lastTimestamp);
                this.emit("CleanLog_lastSquareMeters", this.bot.cleanLog_lastSquareMeters);
                this.emit("CleanLog_lastTotalTimeString", this.bot.cleanLog_lastTotalTimeString);
                this.emit('LastCleanLogs', {
                    'timestamp': this.bot.cleanLog_lastTimestamp,
                    'squareMeters': this.bot.cleanLog_lastSquareMeters,
                    'totalTime': this.bot.cleanLog_lastTotalTime,
                    'totalTimeFormatted': this.bot.cleanLog_lastTotalTimeString,
                    'imageUrl': this.bot.cleanLog_lastImageUrl
                });
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
