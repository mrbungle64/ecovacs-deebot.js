const EcovacsMQTT = require('./ecovacsMQTT');
const tools = require('./tools.js');
const constants = require('./ecovacsConstants');
const errorCodes = require("./errorCodes");

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
        payloadRequest['header']['pri'] = '1';
        payloadRequest['header']['ts'] = Math.floor(Date.now());
        payloadRequest['header']['tzm'] = 480;
        payloadRequest['header']['ver'] = '0.0.50';
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

    handleCommandResponse(action, message) {
        let command = action.name;
        //action.args: arguments of the initial command that was sent
        tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() action: %s", action);
        tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() command: %s", command);

        if (message) {
            tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() message: %s", JSON.stringify(message, getCircularReplacer()));
            if (message.hasOwnProperty('resp')) {
                tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() message['resp']: %s", command, JSON.stringify(message['resp'], getCircularReplacer()));
                this.handleMessage(command, message['resp'], "response");
            } else if (action.api === constants.LGLOGAPI) {
                tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() message: %s", command, JSON.stringify(message, getCircularReplacer()));
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

        let eventName = topic;
        let resultCode = "0";
        let resultCodeMessage = "ok";
        let resultData = message;

        if (type === "incoming") {
            //parse 3rd element from string iot/atr/onPos/e0bc19bb-8cb1-43e3-8503-e9f810e35d36/yna5xi/BTKk/
            eventName = topic.split('/')[2];
            message = JSON.parse(message);
            resultData = message['body']['data'];
        } else if (type === "response") {
            resultCode = message['body']['code'];
            resultCodeMessage = message['body']['msg'];
            resultData = message['body']['data'];
            if (message['header']) {
                const header = message['header'];
                if (this.bot.firmwareVersion !== header['fwVer']) {
                    this.bot.firmwareVersion = header['fwVer'];
                    this.emit('HeaderInfo', {
                        'fwVer': header['fwVer'],
                        'hwVer': header['hwVer']
                    });
                }
            }
        } else if (type === "logResponse") {
            resultCodeMessage = message['ret'];
        }

        const result = {
            "resultCode": resultCode,
            "resultCodeMessage": resultCodeMessage,
            "resultData": resultData
        };

        (async () => {
            try {
                await this.handleMessagePayload(eventName, result);
            } catch (e) {
                this.bot.errorCode = '-2';
                this.bot.errorDescription = e.toString();
                this.emitLastError();
            }
        })();
    }

    async handleMessagePayload(command, event) {
        this.emit('messageReceived', new Date());
        tools.envLog("[EcovacsMQTT_JSON] handleMessagePayload() command %s received event: %s", command, JSON.stringify(event, getCircularReplacer()));
        let abbreviatedCmd = command.toLowerCase().replace(/^_+|_+$/g, '');
        let commandPrefix = '';
        // Incoming events (on)
        if (abbreviatedCmd.startsWith("on")) {
            abbreviatedCmd = abbreviatedCmd.substring(2);
            commandPrefix = 'on';
        }
        // Incoming events for (3rd) unknown/unsaved map
        if (abbreviatedCmd.startsWith("off")) {
            abbreviatedCmd = abbreviatedCmd.substring(3);
            commandPrefix = 'off';
        }
        // Incoming events (report)
        if (abbreviatedCmd.startsWith("report")) {
            abbreviatedCmd = abbreviatedCmd.substring(6);
            commandPrefix = 'report';
        }
        // Remove from "get" commands
        if (abbreviatedCmd.startsWith("get")) {
            abbreviatedCmd = abbreviatedCmd.substring(3);
            commandPrefix = 'get';
        }
        // e.g. N9, T8, T9 series
        // Not sure if the lowercase variant is necessary
        if (abbreviatedCmd.endsWith("_V2") || abbreviatedCmd.endsWith("_v2")) {
            abbreviatedCmd = abbreviatedCmd.slice(0, -3);
        }
        switch (abbreviatedCmd) {
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
                this.emit("BatteryIsLow", this.bot.batteryIsLow);
                break;
            case "cleaninfo":
                this.bot.handle_cleanReport(event);
                this.emit("CleanReport", this.bot.cleanReport);
                this.emitMoppingSystemReport();
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
            case "mapinfo":
                if (commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
                    tools.envLog("[EcovacsMQTT_JSON] getMapInfo responded: %s",  JSON.stringify(event, getCircularReplacer()));
                } else if (tools.isCanvasModuleAvailable()) {
                    let mapImage = await this.bot.handle_mapInfo(event);
                    if (mapImage !== null) {
                        this.emit("MapImageData", mapImage);
                        if (this.bot.createMapImageOnly) {
                            this.emit("MapImage", mapImage);
                        }
                    }
                }
                break;
            // case 'majormap':
            //     this.bot.handle_majormap(event);
            //     break;
            // case 'minormap':
            //     let mapImage = this.bot.handle_minormap(event);
            //     if(mapImage !== null) {
            //         this.emit("MapLiveImage", mapImage);
            //     }
            //     break;
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
                if (!this.bot.emitFullLifeSpanEvent) {
                    for (let component in this.dictionary.COMPONENT_TO_ECOVACS) {
                        if (this.dictionary.COMPONENT_TO_ECOVACS.hasOwnProperty(component)) {
                            if (this.bot.components[component]) {
                                if (this.bot.components[component] !== this.bot.lastComponentValues[component]) {
                                    this.emit("LifeSpan_" + component, this.bot.components[component]);
                                    this.bot.lastComponentValues[component] = this.bot.components[component];
                                }
                            }
                        }
                    }
                } else {
                    this.handleLifeSpanCombined();
                }
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
                        'x': this.bot.chargePosition['x'],
                        'y': this.bot.chargePosition['y'],
                        'a': this.bot.chargePosition['a']
                    });
                    this.bot.chargePosition["changeFlag"] = false;
                }
                break;
            case "waterinfo":
                this.bot.handle_waterInfo(event);
                this.emit("WaterBoxInfo", this.bot.waterboxInfo);
                this.emit("WaterLevel", this.bot.waterLevel);
                this.emitMoppingSystemReport();
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
            case 'advancedmode':
                this.bot.handle_advancedMode(event);
                this.emit("AdvancedMode", this.bot.advancedMode);
                break;
            case 'truedetect':
                this.bot.handle_trueDetect(event);
                this.emit("TrueDetect", this.bot.trueDetect);
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
            case 'sched':
                this.bot.handle_getSched(event);
                if (this.bot.schedules) {
                    this.emit('Schedules', this.bot.schedules);
                }
                break;
            default:
                tools.envLog("[EcovacsMQTT_JSON] Unknown command received: %s", abbreviatedCmd);
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
