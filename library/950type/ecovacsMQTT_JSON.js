'use strict';

const EcovacsMQTT = require('../ecovacsMQTT');
const tools = require('../tools');
const constants = require('../constants');

class EcovacsMQTT_JSON extends EcovacsMQTT {
    /**
     * @param {Object} vacBot - the VacBot object
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} country - the country where the Ecovacs account is registered
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} serverAddress - the address of the MQTT server
     * @param {number} [serverPort=8883] - the port that the MQTT server is listening on
     */
    constructor(vacBot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort = 8883) {
        super(vacBot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort);
        this.vacBot = vacBot;

        this.payloadType = 'j'; // JSON
    }

    /**
     * The function returns the request object for cleaning logs
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getCleanLogsCommandObject(command) {
        return {
            'did': this.vacuum['did'],
            'country': this.country,
            'td': command.name,
            'auth': this.getAuthObject(),
            'resource': this.vacuum['resource']
        };
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

    /**
     * It handles the response from the Ecovacs API
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {Object} messagePayload - The message payload that was received
     */
    handleCommandResponse(command, messagePayload) {
        if (messagePayload) {
            if (messagePayload.hasOwnProperty('resp')) {
                this.handleMessage(command.name, messagePayload['resp'], "response");
            } else if (command.api === constants.CLEANLOGS_PATH) {
                this.handleMessage(command.name, messagePayload, "logResponse");
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
                if (this.vacBot.firmwareVersion !== header['fwVer']) {
                    this.vacBot.firmwareVersion = header['fwVer'];
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
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
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
            case 'FwBuryPoint': {
                await this.handleFwBuryPoint(payload);
                break;
            }
            case 'Evt': {
                // TODO: Find out the value of the 'Evt' message
                this.vacBot.handleEvt(payload);
                break;
            }
            case "Stats":
                this.vacBot.handleStats(payload);
                if (this.vacBot.currentStats) {
                    this.emit("CurrentStats", this.vacBot.currentStats);
                    this.vacBot.currentStats = null;
                }
                break;
            case "ChargeState":
                this.vacBot.handleChargeState(payload);
                if (this.vacBot.chargeStatus) {
                    this.emit("ChargeState", this.vacBot.chargeStatus);
                }
                break;
            case "Battery":
                this.vacBot.handleBattery(payload);
                this.emit("BatteryInfo", this.vacBot.batteryLevel);
                this.emit("BatteryIsLow", this.vacBot.batteryIsLow);
                break;
            case "CleanInfo":
                this.vacBot.handleCleanInfo(payload);
                this.emit("CleanReport", this.vacBot.cleanReport);
                this.emitMoppingSystemReport();
                if (this.vacBot.chargeStatus) {
                    this.emit("ChargeState", this.vacBot.chargeStatus);
                }
                this.emit("CurrentCustomAreaValues", this.vacBot.currentCustomAreaValues);
                this.emit("CurrentSpotAreas", this.vacBot.currentSpotAreas);
                if (this.vacBot.currentCustomAreaValues) {
                    this.emit("LastUsedAreaValues", this.vacBot.currentCustomAreaValues);
                }
                break;
            case "Speed":
                this.vacBot.handleSpeed(payload);
                this.emit("CleanSpeed", this.vacBot.cleanSpeed);
                break;
            case "RelocationState":
                this.vacBot.handleRelocationState(payload);
                this.emit("RelocationState", this.vacBot.relocationState);
                break;
            case "CachedMapInfo":
                try {
                    this.vacBot.handleCachedMapInfo(payload);
                    this.emit("CurrentMapName", this.vacBot.currentMapName);
                    this.emit("CurrentMapMID", this.vacBot.currentMapMID);
                    this.emit("CurrentMapIndex", this.vacBot.currentMapIndex);
                    this.emit("Maps", this.vacBot.maps);
                } catch (e) {
                    tools.envLog("[EcovacsMQTT_JSON] Error on CachedMapInfo: %s", e.message);
                }
                break;
            case "MapInfo":
                if (commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
                    tools.envLog("[EcovacsMQTT_JSON] getMapInfo responded: %s", JSON.stringify(payload));
                } else if (tools.isCanvasModuleAvailable()) {
                    let mapImage = await this.vacBot.handleMapInfo(payload);
                    if (mapImage !== null) {
                        this.emit("MapImageData", mapImage);
                        if (this.vacBot.createMapImageOnly) {
                            this.emit("MapImage", mapImage);
                        }
                    }
                }
                break;
            case 'MajorMap':
                // TODO: finish implementing MajorMap
                //this.vacBot.handleMajorMap(payload);
                break;
            case 'MinorMap':
                // TODO: finish implementing MinorMap
                /*let mapImage = this.vacBot.handleMinorMap(payload);
                if (mapImage !== null) {
                    this.emit("MapLiveImage", mapImage);
                }*/
                break;
            case 'MapTrace':
                // TODO: implement MapTrace
                break;
            case "MapSet": {
                //handle spotAreas, virtualWalls, noMopZones
                let mapset = this.vacBot.handleMapSet(payload);
                if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            }
            case "MapSubSet": {
                //handle spotAreas, virtualWalls, noMopZones
                let mapsubset = await this.vacBot.handleMapSubset(payload);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            }
            case "LifeSpan":
                this.vacBot.handleLifespan(payload);
                if (!this.vacBot.emitFullLifeSpanEvent) {
                    for (let component in this.dictionary.COMPONENT_TO_ECOVACS) {
                        if (this.dictionary.COMPONENT_TO_ECOVACS.hasOwnProperty(component)) {
                            if (this.vacBot.components[component]) {
                                if (this.vacBot.components[component] !== this.vacBot.lastComponentValues[component]) {
                                    this.emit("LifeSpan_" + component, this.vacBot.components[component]);
                                    this.vacBot.lastComponentValues[component] = this.vacBot.components[component];
                                }
                            }
                        }
                    }
                } else {
                    this.handleLifeSpanCombined();
                }
                break;
            case "Pos":
                this.vacBot.handlePos(payload);
                if (this.vacBot.deebotPosition["changeFlag"]) {
                    if ((this.vacBot.deebotPosition["isInvalid"] === true) && ((this.vacBot.relocationState === 'ok') || (this.vacBot.relocationState === null))) {
                        this.vacBot.relocationState = 'required';
                        this.emit("RelocationState", this.vacBot.relocationState);
                    } else if (this.vacBot.deebotPosition["x"] && this.vacBot.deebotPosition["y"]) {
                        this.emit("DeebotPosition", this.vacBot.deebotPosition["x"] + "," + this.vacBot.deebotPosition["y"] + "," + this.vacBot.deebotPosition["a"]);
                        this.emit("DeebotPositionIsInvalid", this.vacBot.deebotPosition["isInvalid"]);
                        this.emit("DeebotPositionCurrentSpotAreaID", this.vacBot.deebotPosition["currentSpotAreaID"]);
                        this.emit("DeebotPositionCurrentSpotAreaName", this.vacBot.deebotPosition["currentSpotAreaName"]);
                        this.emit('Position', {
                            'coords': this.vacBot.deebotPosition['x'] + "," + this.vacBot.deebotPosition['y'] + "," + this.vacBot.deebotPosition['a'],
                            'x': this.vacBot.deebotPosition['x'],
                            'y': this.vacBot.deebotPosition['y'],
                            'a': this.vacBot.deebotPosition['a'],
                            'invalid': this.vacBot.deebotPosition["isInvalid"],
                            'spotAreaID': this.vacBot.deebotPosition["currentSpotAreaID"],
                            'spotAreaName': this.vacBot.deebotPosition["currentSpotAreaName"],
                            'distanceToChargingStation': this.vacBot.deebotPosition["distanceToChargingStation"]
                        });
                    }
                    this.vacBot.deebotPosition["changeFlag"] = false;
                }
                if (this.vacBot.chargePosition["changeFlag"]) {
                    this.emit("ChargePosition", this.vacBot.chargePosition["x"] + "," + this.vacBot.chargePosition["y"] + "," + this.vacBot.chargePosition["a"]);
                    this.emit('ChargingPosition', {
                        'coords': this.vacBot.chargePosition['x'] + "," + this.vacBot.chargePosition['y'] + "," + this.vacBot.chargePosition['a'],
                        'x': this.vacBot.chargePosition['x'],
                        'y': this.vacBot.chargePosition['y'],
                        'a': this.vacBot.chargePosition['a']
                    });
                    this.vacBot.chargePosition["changeFlag"] = false;
                }
                break;
            case "WaterInfo":
                this.vacBot.handleWaterInfo(payload);
                this.emit("WaterLevel", this.vacBot.waterLevel);
                if (this.vacBot.sleepStatus === 0) {
                    this.emit("WaterBoxInfo", this.vacBot.waterboxInfo);
                    if (this.vacBot.moppingType !== null) {
                        this.emit("WaterBoxMoppingType", this.vacBot.moppingType);
                    }
                    if (this.vacBot.scrubbingType !== null) {
                        this.emit("WaterBoxScrubbingType", this.vacBot.scrubbingType);
                    }
                }
                this.emitMoppingSystemReport();
                break;
            case "NetInfo":
                this.vacBot.handleNetInfo(payload);
                this.emit("NetInfoIP", this.vacBot.netInfoIP); // Deprecated
                this.emit("NetInfoWifiSSID", this.vacBot.netInfoWifiSSID); // Deprecated
                this.emit("NetInfoWifiSignal", this.vacBot.netInfoWifiSignal); // Deprecated
                this.emit("NetInfoMAC", this.vacBot.netInfoMAC); // Deprecated
                this.emit("NetworkInfo", {
                    'ip': this.vacBot.netInfoIP,
                    'mac': this.vacBot.netInfoMAC,
                    'wifiSSID': this.vacBot.netInfoWifiSSID,
                    'wifiSignal': this.vacBot.netInfoWifiSignal,
                });
                break;
            case 'Sleep':
                this.vacBot.handleSleepStatus(payload);
                this.emit("SleepStatus", this.vacBot.sleepStatus);
                break;
            case 'BreakPoint':
                this.vacBot.handleBreakPoint(payload);
                this.emit("ContinuousCleaningEnabled", this.vacBot.breakPoint);
                break;
            case 'Block':
                this.vacBot.handleBlock(payload);
                this.emit("DoNotDisturbEnabled", this.vacBot.block);
                break;
            case 'AutoEmpty':
                this.vacBot.handleAutoEmpty(payload);
                this.emit("AutoEmpty", this.vacBot.autoEmpty);
                break;
            case 'Volume':
                this.vacBot.handleVolume(payload);
                this.emit("Volume", this.vacBot.volume);
                break;
            case 'AdvancedMode':
                this.vacBot.handleAdvancedMode(payload);
                this.emit("AdvancedMode", this.vacBot.advancedMode);
                break;
            case 'TrueDetect':
                this.vacBot.handleTrueDetect(payload);
                this.emit("TrueDetect", this.vacBot.trueDetect);
                break;
            case 'CleanCount':
                this.vacBot.handleCleanCount(payload);
                this.emit("CleanCount", this.vacBot.cleanCount);
                break;
            case 'DusterRemind':
                this.vacBot.handleDusterRemind(payload);
                this.emit("DusterRemind", this.vacBot.dusterRemind);
                break;
            case 'CarpertPressure':
                this.vacBot.handleCarpetPressure(payload);
                this.emit("CarpetPressure", this.vacBot.carpetPressure);
                break;
            case 'CleanPreference':
                this.vacBot.handleCleanPreference(payload);
                this.emit("CleanPreference", this.vacBot.cleanPreference);
                break;
            case 'LiveLaunchPwdState':
                this.vacBot.handleLiveLaunchPwdState(payload);
                this.emit("LiveLaunchPwdState", this.vacBot.liveLaunchPwdState);
                break;
            case "Error":
                this.vacBot.handleResponseError(payload);
                this.emit("Error", this.vacBot.errorDescription);
                this.emit('ErrorCode', this.vacBot.errorCode);
                this.emit('LastError', {
                    'error': this.vacBot.errorDescription,
                    'code': this.vacBot.errorCode
                });
                break;
            case 'TotalStats':
                this.vacBot.handleTotalStats(payload);
                this.emit("CleanSum_totalSquareMeters", this.vacBot.cleanSum_totalSquareMeters); // Deprecated
                this.emit("CleanSum_totalSeconds", this.vacBot.cleanSum_totalSeconds); // Deprecated
                this.emit("CleanSum_totalNumber", this.vacBot.cleanSum_totalNumber); // Deprecated
                this.emit('CleanSum', {
                    'totalSquareMeters': this.vacBot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.vacBot.cleanSum_totalSeconds,
                    'totalNumber': this.vacBot.cleanSum_totalNumber
                });
                break;
            case 'CleanLogs': {
                this.vacBot.handleCleanLogs(payload);
                let cleanLog = [];
                for (let i in this.vacBot.cleanLog) {
                    if (this.vacBot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.vacBot.cleanLog[i]);
                    }
                }
                this.emit("CleanLog", cleanLog);
                this.emit("CleanLog_lastImageUrl", this.vacBot.cleanLog_lastImageUrl);
                this.emit("CleanLog_lastImageTimestamp", this.vacBot.cleanLog_lastTimestamp); // Deprecated
                this.emit("CleanLog_lastTimestamp", this.vacBot.cleanLog_lastTimestamp);
                this.emit("CleanLog_lastSquareMeters", this.vacBot.cleanLog_lastSquareMeters);
                this.emit("CleanLog_lastTotalTimeString", this.vacBot.cleanLog_lastTotalTimeString);
                this.emit('LastCleanLogs', {
                    'timestamp': this.vacBot.cleanLog_lastTimestamp,
                    'squareMeters': this.vacBot.cleanLog_lastSquareMeters,
                    'totalTime': this.vacBot.cleanLog_lastTotalTime,
                    'totalTimeFormatted': this.vacBot.cleanLog_lastTotalTimeString,
                    'imageUrl': this.vacBot.cleanLog_lastImageUrl
                });
                break;
            }
            case 'Sched':
                this.vacBot.handleSched(payload);
                if (this.vacBot.schedule) {
                    this.emit('Schedule', this.vacBot.schedule);
                }
                break;
            case 'Clean'.toLowerCase(): {
                if (payload) {
                    tools.envLog(`[EcovacsMQTT_JSON] Payload for Clean message: ${JSON.stringify(payload)}`);
                }
                break;
            }
            default:
                tools.envLog(`[EcovacsMQTT_JSON] Payload for unknown command ${command}: ${JSON.stringify(payload)}`);
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

    /**
     * Handle onFwBuryPoint message (e.g. T8/T9 series)
     * This is presumably some kind of debug or internal message
     * The main advantage of this message is that it's fired immediately
     * @param {Object} payload
     */
    async handleFwBuryPoint(payload) {
        try {
            const fwBuryPoint = JSON.parse(JSON.parse(payload['content'])['d']['body']['data']['d_val']);
            tools.envLog(fwBuryPoint);
            let val;

            if (fwBuryPoint.hasOwnProperty('code')) {
                if (fwBuryPoint.code === 110) {
                    // code 110 = NoDustBox: Dust Bin Not installed
                    val = Number(!fwBuryPoint.state);
                    this.emit('DustCaseInfo', val);
                }
            }
            if (fwBuryPoint.hasOwnProperty('multiMap')) {
                // Info whether multi-map mode is enabled
                val = fwBuryPoint.multiMap;
                this.emit('SettingInfoMultiMap', val);
            }
            if (fwBuryPoint.hasOwnProperty('AI')) {
                // Info whether AIVI is enabled
                val = fwBuryPoint.AI;
                this.emit('SettingInfoAIVI', val);
            }
            // ----------------------------------
            // We use these properties as trigger
            // ----------------------------------
            if (fwBuryPoint.hasOwnProperty('waterAmount') || fwBuryPoint.hasOwnProperty('waterbox')) {
                // Mopping functionality related data
                this.vacBot.run("GetWaterInfo");
            }
            if (fwBuryPoint.hasOwnProperty('mopremind')) {
                // Info whether 'Cleaning Cloth Reminder' is enabled
                this.vacBot.run('GetDusterRemind');
            }
            if (fwBuryPoint.hasOwnProperty('isPressurized')) {
                // Info whether 'Auto-Boost Suction' is enabled
                this.vacBot.run('GetCarpetPressure');
            }
            if (fwBuryPoint.hasOwnProperty('DND')) {
                // Info whether 'Do Not Disturb' is enabled
                this.vacBot.run('GetDoNotDisturb');
            }
            if (fwBuryPoint.hasOwnProperty('continue')) {
                // Info whether 'Continuous Cleaning' is enabled
                this.vacBot.run('GetContinuousCleaning');
            }
        }
        catch (e) {
            tools.envLog(`Error handling onFwBuryPoint payload: ${payload}`);
        }
    }
}

module.exports = EcovacsMQTT_JSON;
