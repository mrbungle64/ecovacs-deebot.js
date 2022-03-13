'use strict';

const EcovacsMQTT = require('../ecovacsMQTT');
const tools = require('../tools');
const constants = require('../ecovacsConstants');

class EcovacsMQTT_JSON extends EcovacsMQTT {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort = 8883) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort);

        this.payloadType = 'j'; // JSON
    }

    /**
     * The function returns the request object
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getCommandRequestObject(command) {
        if (command.api === constants.IOTDEVMANAGERAPI) {
            const payload = this.getCommandPayload(command);
            return this.getCommandStandardRequestObject(command, payload);
        }
        if (command.api === constants.LGLOGAPI) {
            return this.getCommandCleanLogsObject(command);
        }
    }

    /**
     * The function returns the request object for cleaning logs
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getCommandCleanLogsObject(command) {
        return {
            'did': this.vacuum['did'],
            'country': this.country,
            'td': command.name,
            'auth': this.getAuthObject(),
            'resource': this.vacuum['resource']
        }
    }

    /**
     * It creates an object for the request payload with header and body
     * @param {Object} command - the command object
     * @returns {Object} the request payload object
     */
    getCommandPayload(command) {
        return {
            'header': {
                'pri': '1',
                'ts': Math.floor(Date.now()),
                'tzm': 480,
                'ver': '0.0.50'
            },
            'body': {
                'data': command.args
            }
        };
    }

    handleCommandResponse(action, message) {
        if (message) {
            if (message.hasOwnProperty('resp')) {
                this.handleMessage(action.name, message['resp'], "response");
            } else if (action.api === constants.LGLOGAPI) {
                this.handleMessage(action.name, message, "logResponse");
            } else {
                tools.envLog("[EcovacsMQTT_JSON] handleCommandResponse() invalid response");
            }
        }
    }

    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} topic - the topic of the message
     * @param {Object|string} message - the message
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     */
    handleMessage(topic, message, type = "incoming") {
        let eventName = topic;
        let resultCode = "0";
        let resultCodeMessage = "ok";
        let payload = message;

        if (type === "incoming") {
            eventName = topic.split('/')[2];
            message = JSON.parse(message);
            payload = message['body']['data'];
        } else if (type === "response") {
            resultCode = message['body']['code'];
            resultCodeMessage = message['body']['msg'];
            payload = message['body']['data'];
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
            "payload": payload
        };

        (async () => {
            try {
                await this.handleMessagePayload(eventName, result);
            } catch (e) {
                this.emitError('-2', e.message);
            }
        })();
    }

    /**
     * This function handles the message payload
     * and delegates the event object to the corresponding function
     * @param {string} command - the command
     * @param {Object} event - the event object received from the Ecovacs API
     * @returns {Promise<void>}
     */
    async handleMessagePayload(command, event) {
        let abbreviatedCommand = command.replace(/^_+|_+$/g, '');
        const commandPrefix = this.getCommandPrefix(abbreviatedCommand);
        abbreviatedCommand = abbreviatedCommand.substring(commandPrefix.length);
        // e.g. N9, T8, T9 series
        // Not sure if the lowercase variant is necessary
        if (abbreviatedCommand.endsWith("_V2") || abbreviatedCommand.endsWith("_v2")) {
            abbreviatedCommand = abbreviatedCommand.slice(0, -3);
        }
        this.emit('messageReceived', command  + ' => ' + abbreviatedCommand);
        const payload = this.getPayload(event);
        switch (abbreviatedCommand) {
            case "Stats":
                this.bot.handle_stats(payload);
                if (this.bot.currentStats) {
                    this.emit("CurrentStats", this.bot.currentStats);
                    this.bot.currentStats = null;
                }
                break;
            case "ChargeState":
                this.bot.handle_chargeState(payload);
                if (this.bot.chargeStatus) {
                    this.emit("ChargeState", this.bot.chargeStatus);
                }
                break;
            case "Battery":
                this.bot.handle_batteryInfo(payload);
                this.emit("BatteryInfo", this.bot.batteryInfo);
                this.emit("BatteryIsLow", this.bot.batteryIsLow);
                break;
            case "CleanInfo":
                this.bot.handle_cleanReport(payload);
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
            case "Speed":
                this.bot.handle_cleanSpeed(payload);
                this.emit("CleanSpeed", this.bot.cleanSpeed);
                break;
            case "RelocationState":
                this.bot.handle_relocationState(payload);
                this.emit("RelocationState", this.bot.relocationState);
                break;
            case "CachedMapInfo":
                try {
                    this.bot.handle_cachedMapInfo(payload);
                    this.emit("CurrentMapName", this.bot.currentMapName);
                    this.emit("CurrentMapMID", this.bot.currentMapMID);
                    this.emit("CurrentMapIndex", this.bot.currentMapIndex);
                    this.emit("Maps", this.bot.maps);
                } catch (e) {
                    tools.envLog("[EcovacsMQTT_JSON] Error on CachedMapInfo: %s", e.message);
                }
                break;
            case "MapInfo":
                if (commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
                    tools.envLog("[EcovacsMQTT_JSON] getMapInfo responded: %s", JSON.stringify(payload));
                } else if (tools.isCanvasModuleAvailable()) {
                    let mapImage = await this.bot.handle_mapInfo(payload);
                    if (mapImage !== null) {
                        this.emit("MapImageData", mapImage);
                        if (this.bot.createMapImageOnly) {
                            this.emit("MapImage", mapImage);
                        }
                    }
                }
                break;
            case 'MajorMap':
                // TODO: finish implementing MajorMap
                //this.bot.handle_majorMap(payload);
                break;
            case 'MinorMap':
                // TODO: finish implementing MinorMap
                /*let mapImage = this.bot.handle_minorMap(payload);
                if (mapImage !== null) {
                    this.emit("MapLiveImage", mapImage);
                }*/
                break;
            case 'MapTrace':
                // TODO: implement MapTrace
                break;
            case "MapSet": //handle spotAreas, virtualWalls, noMopZones
                let mapset = this.bot.handle_mapSet(payload);
                if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            case "MapSubSet": //handle spotAreas, virtualWalls, noMopZones
                let mapsubset = await this.bot.handle_mapSubset(payload);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            case "LifeSpan":
                this.bot.handle_lifespan(payload);
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
            case "Pos":
                this.bot.handle_deebotPosition(payload);
                if (this.bot.deebotPosition["changeFlag"]) {
                    if ((this.bot.deebotPosition["isInvalid"] === true) && ((this.bot.relocationState === 'ok') || (this.bot.relocationState === null))) {
                        this.bot.relocationState = 'required';
                        this.emit("RelocationState", this.bot.relocationState);
                    } else if (this.bot.deebotPosition["x"] && this.bot.deebotPosition["y"]) {
                        this.emit("DeebotPosition", this.bot.deebotPosition["x"] + "," + this.bot.deebotPosition["y"] + "," + this.bot.deebotPosition["a"]);
                        this.emit("DeebotPositionIsInvalid", this.bot.deebotPosition["isInvalid"]);
                        this.emit("DeebotPositionCurrentSpotAreaID", this.bot.deebotPosition["currentSpotAreaID"]);
                        this.emit("DeebotPositionCurrentSpotAreaName", this.bot.deebotPosition["currentSpotAreaName"]);
                        this.emit('Position', {
                            'coords': this.bot.deebotPosition['x'] + "," + this.bot.deebotPosition['y'] + "," + this.bot.deebotPosition['a'],
                            'x': this.bot.deebotPosition['x'],
                            'y': this.bot.deebotPosition['y'],
                            'a': this.bot.deebotPosition['a'],
                            'invalid': this.bot.deebotPosition["isInvalid"],
                            'spotAreaID': this.bot.deebotPosition["currentSpotAreaID"],
                            'spotAreaName': this.bot.deebotPosition["currentSpotAreaName"],
                            'distanceToChargingStation': this.bot.deebotPosition["distanceToChargingStation"]
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
            case "WaterInfo":
                this.bot.handle_waterInfo(payload);
                this.emit("WaterBoxInfo", this.bot.waterboxInfo);
                this.emit("WaterLevel", this.bot.waterLevel);
                this.emitMoppingSystemReport();
                break;
            case "NetInfo":
                this.bot.handle_netInfo(payload);
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
            case 'Sleep':
                this.bot.handle_sleepStatus(payload);
                this.emit("SleepStatus", this.bot.sleepStatus);
                break;
            case 'BreakPoint':
                this.bot.handle_breakPoint(payload);
                this.emit("ContinuousCleaningEnabled", this.bot.breakPoint);
                break;
            case 'Block':
                this.bot.handle_block(payload);
                this.emit("DoNotDisturbEnabled", this.bot.block);
                break;
            case 'AutoEmpty':
                this.bot.handle_autoEmpty(payload);
                this.emit("AutoEmpty", this.bot.autoEmpty);
                break;
            case 'Volume':
                this.bot.handle_volume(payload);
                this.emit("Volume", this.bot.volume);
                break;
            case 'AdvancedMode':
                this.bot.handle_advancedMode(payload);
                this.emit("AdvancedMode", this.bot.advancedMode);
                break;
            case 'TrueDetect':
                this.bot.handle_trueDetect(payload);
                this.emit("TrueDetect", this.bot.trueDetect);
                break;
            case 'DusterRemind':
                this.bot.handle_dusterRemind(payload);
                this.emit("DusterRemind", this.bot.dusterRemind);
                break;
            case 'CarpertPressure':
                this.bot.handle_carpetPressure(payload);
                this.emit("CarpetPressure", this.bot.carpetPressure);
                break;
            case "Error":
                this.bot.handle_ResponseError(payload);
                this.emit("Error", this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
                this.emit('LastError', {
                    'error': this.bot.errorDescription,
                    'code': this.bot.errorCode
                });
                break;
            case 'TotalStats':
                this.bot.handle_cleanSum(payload);
                this.emit("CleanSum_totalSquareMeters", this.bot.cleanSum_totalSquareMeters); // Deprecated
                this.emit("CleanSum_totalSeconds", this.bot.cleanSum_totalSeconds); // Deprecated
                this.emit("CleanSum_totalNumber", this.bot.cleanSum_totalNumber); // Deprecated
                this.emit('CleanSum', {
                    'totalSquareMeters': this.bot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.bot.cleanSum_totalSeconds,
                    'totalNumber': this.bot.cleanSum_totalNumber
                });
                break;
            case 'CleanLogs':
                this.bot.handle_cleanLogs(payload);
                let cleanLog = [];
                for (let i in this.bot.cleanLog) {
                    if (this.bot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.bot.cleanLog[i]);
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
            case 'Sched':
                this.bot.handle_Schedule(payload);
                if (this.bot.schedule) {
                    this.emit('Schedule', this.bot.schedule);
                }
                break;
            default:
                tools.envLog("[EcovacsMQTT_JSON] Unknown command received: %s", command);
                break;
        }
    }

    /**
     * Given an event, return the payload
     * @param {Object} event - The event object that was passed to the handler
     * @returns The payload of the event
     */
    getPayload(event) {
        if (event.hasOwnProperty('payload')) {
            return event['payload'];
        }
        return event;
    }

    /**
     * Given a command, return the prefix of the command
     * @param {string} command - the command that was sent
     * @returns {string} the prefix of the command
     */
    getCommandPrefix(command) {
        let commandPrefix = '';
        // Incoming events (on)
        if (command.startsWith("on")) {
            commandPrefix = 'on';
        }
        // Incoming events for (3rd) unknown/unsaved map
        if (command.startsWith("off")) {
            commandPrefix = 'off';
        }
        // Incoming events (report)
        if (command.startsWith("report")) {
            commandPrefix = 'report';
        }
        // Remove from "get" commands
        if (command.startsWith("get") || command.startsWith("Get")) {
            commandPrefix = 'get';
        }
        return commandPrefix;
    }
}

module.exports = EcovacsMQTT_JSON;
