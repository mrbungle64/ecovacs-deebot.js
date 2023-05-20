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
                tools.envLogWarn(`handleCommandResponse invalid response`);
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
        let resultCode = 0;
        let resultCodeMessage = "ok";
        let payload = message;
        if (type === "incoming") {
            eventName = topic.split('/')[2];
            message = JSON.parse(message);
            tools.envLogMqtt(topic);
            tools.envLogMqtt(eventName);
            if (message['body'] && message['body']['data']) {
                payload = message['body']['data'];
                tools.envLogPayload(payload);
            } else if (message['body']) {
                payload = message['body'];
                tools.envLogPayload(payload);
            } else {
                tools.envLogWarn('Unhandled MQTT message payload ...')
                tools.envLogPayload(payload);
                return;
            }
        } else if (type === "response") {
            resultCode = message['body']['code'];
            resultCodeMessage = message['body']['msg'];
            payload = message['body']['data'];
            tools.envLogPayload(payload);
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
            tools.envLogInfo(`got message with type 'logResponse'`);
            tools.envLogPayload(message);
            resultCodeMessage = message['ret'];
        }

        if ((payload !== undefined) && (resultCode === 0)) {
            (async () => {
                try {
                    await this.handleMessagePayload(eventName, payload);
                } catch (e) {
                    this.emitError('-2', e.message);
                }
            })();
        } else if (resultCode != 0) {
            tools.envLogError(`got unexpected resultCode for command '${eventName}': ${resultCode}`);
            tools.envLogError(`resultCodeMessage for command '${eventName}': '${resultCodeMessage}`);
            return;
        } else if (payload === undefined) {
            tools.envLogWarn(`got empty payload for command '${eventName}'`);
            return;
        } else {
            tools.envLogError(`something unexpected happend for command '${eventName}'`);
        }
    }

    /**
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
     * @returns {Promise<void>}
     */
    async handleMessagePayload(command, payload) {
        let abbreviatedCommand = command.replace(/^_+|_+$/g, '');
        const commandPrefix = this.getCommandPrefix(abbreviatedCommand);
        abbreviatedCommand = abbreviatedCommand.substring(commandPrefix.length);
        // e.g. T8, T9, T10, N8, X1 series
        if (abbreviatedCommand.endsWith("_V2")) {
            abbreviatedCommand = this.handleV2commands(abbreviatedCommand);
        }
        this.emit('messageReceived', command + ' => ' + abbreviatedCommand);
        if (abbreviatedCommand.startsWith('FwBuryPoint')) {
            // Main function to handle FwBuryPoint messages
            const status = await this.handleFwBuryPoint(payload);
            if (status) {
                return;
            }
        }
        switch (abbreviatedCommand) {
            case 'Evt': {
                this.vacBot.handleEvt(payload);
                if (this.vacBot.evt.event) {
                    this.emit("Evt", this.vacBot.evt);
                }
                break;
            }
            case "Stats":
                this.vacBot.handleStats(payload);
                if (this.vacBot.currentStats) {
                    this.emit("CurrentStats", this.vacBot.currentStats);
                    this.vacBot.currentStats = null;
                }
                break;
            case 'AirDring': // The typo in 'AirDring' is intended
                this.bot.handleAirDryingState(payload);
                if (this.bot.airDryingStatus) {
                    this.emit('AirDryingState', this.bot.airDryingStatus);
                }
                break;
            case 'BorderSpin':
                this.bot.handleBorderSpin(payload);
                this.emit('BorderSpin', this.bot.borderSpin);
                break;
            case 'CustomAreaMode':
                this.bot.handleCustomAreaMode(payload);
                // SweepMode is taken from the CustomAreaMode message
                // (not from the SweepMode message)
                this.emit('SweepMode', this.bot.sweepMode);
                break;
            case 'SweepMode':
                this.bot.handleSweepMode(payload);
                // MopOnlyMode is taken from the SweepMode message
                this.emit('MopOnlyMode', this.bot.mopOnlyMode);
                break;
            case 'AICleanItemState':
                this.bot.handleAICleanItemState(payload);
                if (this.bot.aiCleanItemState.items.length) {
                    this.emit('AICleanItemState', this.bot.aiCleanItemState);
                }
                break;
            case "ChargeState":
                this.vacBot.handleChargeState(payload);
                if (this.vacBot.chargeStatus) {
                    this.emit("ChargeState", this.vacBot.chargeStatus);
                }
                if (this.vacBot.chargeMode) {
                    this.emit("ChargeMode", this.vacBot.chargeMode);
                }
                break;
            case "Battery":
                this.vacBot.handleBattery(payload);
                if (this.vacBot.batteryLevel) {
                    this.emit("BatteryInfo", this.vacBot.batteryLevel);
                    this.emit("BatteryIsLow", this.vacBot.batteryIsLow);
                }
                break;
            case "CleanInfo":
                this.vacBot.handleCleanInfo(payload);
                this.emit("CleanReport", this.vacBot.cleanReport);
                this.emitMoppingSystemReport();
                if (this.vacBot.chargeStatus) {
                    this.emit("ChargeState", this.vacBot.chargeStatus);
                }
                if (this.vacBot.currentCustomAreaValues) {
                    this.emit("LastUsedAreaValues", this.vacBot.currentCustomAreaValues);
                }
                this.emit("CurrentCustomAreaValues", this.vacBot.currentCustomAreaValues);
                this.emit("CurrentSpotAreas", this.vacBot.currentSpotAreas);
                break;
            case "StationState":
                this.vacBot.handleStationState(payload);
                if (this.vacBot.stationState.type !== null) {
                    this.emit("StationState", this.vacBot.stationState);
                    const airDryingState = this.bot.stationState.isAirDrying ? 'airdrying': 'idle';
                    this.emit('AirDryingState', airDryingState);
                }
                break;
            case "StationInfo":
                this.vacBot.handleStationInfo(payload);
                this.emit('StationInfo', this.vacBot.stationInfo);
                break;
            case "WashInterval":
                this.vacBot.handleWashInterval(payload);
                if (this.vacBot.washInterval !== null) {
                    this.emit("WashInterval", this.vacBot.washInterval);
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
            case "MapInfo_V2_Yeedi":
                try {
                    this.vacBot.handleMapInfoV2(payload);
                    this.emit("CurrentMapMID", this.vacBot.currentMapMID);
                    this.emit("CurrentMapName", this.vacBot.currentMapName);
                    this.emit("CurrentMapIndex", this.vacBot.currentMapIndex);
                    this.emit("Maps", this.vacBot.maps);
                } catch (e) {
                    tools.envLogError(`error on handling MapInfo_V2 (yeedi): ${e.message}`);
                }
                break;
            case "CachedMapInfo":
                try {
                    this.vacBot.handleCachedMapInfo(payload);
                    this.emit("CurrentMapMID", this.vacBot.currentMapMID);
                    this.emit("CurrentMapName", this.vacBot.currentMapName);
                    this.emit("CurrentMapIndex", this.vacBot.currentMapIndex);
                    this.emit("Maps", this.vacBot.maps);
                } catch (e) {
                    tools.envLogError(`error on handling CachedMapInfo: ${e.message}`);
                }
                break;
            case "MapInfo":
                if (commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
                    tools.envLogWarn(`getMapInfo responded: ${JSON.stringify(payload)}`);
                } else if (tools.isCanvasModuleAvailable()) {
                    let mapImage = await this.vacBot.handleMapImage(payload);
                    if (mapImage !== null) {
                        this.emit("MapImageData", mapImage);
                        if (this.vacBot.createMapImageOnly) {
                            this.emit("MapImage", mapImage);
                        }
                    }
                }
                break;
            case "MapInfo_V2":
                tools.envLogWarn(`Unhandled MapInfo_V2`);
                break;
            case "MapSet": {
                // Handle spotAreas, virtualWalls, noMopZones
                let mapset = this.vacBot.handleMapSet(payload);
                if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            }
            case "MapSet_V2":
                // TODO: handle subsets
                tools.envLogWarn(`Unhandled MapSet_V2`);
                break;
            case "MapSubSet": {
                // Handle spotAreas, virtualWalls, noMopZones
                let mapsubset = await this.vacBot.handleMapSubset(payload);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    // MapSpotAreaInfo, MapVirtualBoundaryInfo
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            }
            case 'MajorMap':
                this.vacBot.handleMajorMap(payload);
                // TODO: finish implementing MajorMap
                break;
            case 'MapTrace':
                this.vacBot.handleMapTrace(payload);
                // TODO: finish implementing MapTrace
                break;
            case 'MinorMap':
                let mapImage = this.vacBot.handleMinorMap(payload);
                // TODO: finish implementing MinorMap and emit MapLiveImage
                break;
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
                this.emit("WaterBoxInfo", this.vacBot.waterboxInfo);
                if (this.vacBot.moppingType !== null) {
                    this.emit("WaterBoxMoppingType", this.vacBot.moppingType);
                }
                if (this.vacBot.scrubbingType !== null) {
                    this.emit("WaterBoxScrubbingType", this.vacBot.scrubbingType);
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
                if (!!this.vacBot.block) {
                    this.emit("DoNotDisturbBlockTime", this.vacBot.blockTime);
                }
                break;
            case 'AutoEmpty':
                this.vacBot.handleAutoEmpty(payload);
                this.emit("AutoEmpty", this.vacBot.autoEmpty);
                const autoEmptyStatus = {
                    'autoEmptyEnabled': (this.vacBot.autoEmpty === 1),
                    'stationStatus': this.vacBot.autoEmptyStatus,
                    'stationActive': (this.vacBot.autoEmptyStatus === 1),
                    'dustBagFull': (this.vacBot.autoEmptyStatus === 5)
                };
                this.emit("AutoEmptyStatus", autoEmptyStatus);
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
            case 'Recognization':
                this.vacBot.handleRecognization(payload);
                this.emit('TrueDetect', this.vacBot.trueDetect);
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
            case 'MultiMapState':
                this.vacBot.handleMultiMapState(payload);
                this.emit("MultiMapState", this.vacBot.multiMapState);
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
            case 'AIMap':
            case 'Clean'.toLowerCase():
            case 'MapState':
                if (payload) {
                    tools.envLogInfo(`payload for ${abbreviatedCommand} message: ${JSON.stringify(payload)}`);
                }
                break;
            // T9 AIVI
            case 'DModule': // Air Freshener module
                this.vacBot.handleDModule(payload);
                if(this.vacBot.dmodule.enabled) {
                    this.emit("DModuleEnabled", this.vacBot.dmodule.enabled);
                    this.emit("DModuleStatus", this.vacBot.dmodule.status);
                }
                break;
            case 'AIMapAndMapSet':
                // {"onAIMap":{"mid":"1839835603","totalCount":4},"onMapSet":{"mid":"1839835603","type":"svm","hasUnRead":0}}
                break;

            // AirBot Z1
            case 'AirQuality':
                this.vacBot.handleAirQuality(payload);
                if (this.vacBot.airQuality) {
                    this.emit('AirQuality', this.vacBot.airQuality);
                }
                break;
            case 'Mic':
                this.vacBot.handleGetMic(payload);
                if (this.vacBot.mic) {
                    this.emit('Mic', this.vacBot.mic);
                }
                break;
            case 'MonitorAirState':
                this.vacBot.handleGetMonitorAirState(payload);
                if (this.vacBot.monitorAirState) {
                    this.emit('MonitorAirState', this.vacBot.monitorAirState);
                }
                break;
            case 'DrivingWheel':
                this.vacBot.handleGetDrivingWheel(payload);
                if (this.vacBot.drivingWheel) {
                    this.emit('DrivingWheel', this.vacBot.drivingWheel);
                }
                break;
            case 'VoiceSimple':
                this.vacBot.handleGetVoiceSimple(payload);
                if (this.vacBot.voiceSimple) {
                    this.emit('VoiceSimple', this.vacBot.voiceSimple);
                }
                break;
            case 'AiBlockPlate':
                this.vacBot.handleGetAiBlockPlate(payload);
                if (this.vacBot.aiBlockPlate) {
                    this.emit('AiBlockPlate', this.vacBot.aiBlockPlate);
                }
                break;
            case 'BlueSpeaker':
                this.vacBot.handleGetBlueSpeaker(payload);
                if (this.vacBot.bluetoothSpeaker) {
                    this.emit('BlueSpeaker', this.vacBot.bluetoothSpeaker);
                }
                break;
            case 'ChildLock':
                this.vacBot.handleGetChildLock(payload);
                if (this.vacBot.childLock) {
                    this.emit('ChildLock', this.vacBot.childLock);
                }
                break;

            case 'AngleFollow':
                this.vacBot.handleGetAngleFollow(payload);
                if (this.vacBot.angleFollow) {
                    this.emit('AngleFollow', this.vacBot.angleFollow);
                }
                break;
            case 'AngleWakeup':
                this.vacBot.handleAngleWakeup(payload);
                if (this.vacBot.angleWakeup) {
                    this.emit('AngleWakeup', this.vacBot.angleWakeup);
                }
                break;
            case 'AutonomousClean':
                this.vacBot.handleGetAutonomousClean(payload);
                if (this.vacBot.autonomousClean) {
                    this.emit('AutonomousClean', this.vacBot.autonomousClean);
                }
                break;
            case 'VoiceAssistantState':
                this.vacBot.handleVoiceAssistantState(payload);
                if (this.vacBot.voiceAssistantState) {
                    this.emit('VoiceAssistantState', this.vacBot.voiceAssistantState);
                }
                break;
            case 'Efficiency':
                this.vacBot.handleEfficiency(payload);
                if (this.vacBot.efficiency) {
                    this.emit('Efficiency', this.vacBot.efficiency);
                }
                break;
            case 'AtmoLight':
                this.vacBot.handleGetAtmoLight(payload);
                if (this.vacBot.atmoLightIntensity) {
                    this.emit('AtmoLight', this.vacBot.atmoLightIntensity);
                }
                break;
            case 'HumanoidFollow':
                this.vacBot.handleHumanoidFollow(payload);
                if ((this.vacBot.humanoidFollow_Yiko) || (this.vacBot.humanoidFollow_Video)) {
                    if (this.vacBot.humanoidFollow_Yiko) {
                        this.emit('HumanoidFollowYiko', this.vacBot.humanoidFollow_Yiko);
                    }
                    if (this.vacBot.humanoidFollow_Video) {
                        this.emit('HumanoidFollowVideo', this.vacBot.humanoidFollow_Video);
                    }
                    break;
                }
            // ====================
            // FwBuryPoint messages
            // ====================
            case 'FwBuryPoint-bd_sysinfo':
                this.vacBot.handleSysinfo(payload);
                if (this.vacBot.sysinfo) {
                    this.emit('Sysinfo', this.vacBot.sysinfo);
                    break;
                }
            case 'FwBuryPoint-bd_air-quality':
                if (this.vacBot.airQuality) {
                    this.vacBot.handleAirQuality({
                        'pm25': payload['pm25'],
                        'pm_10': payload['pm1'],
                        'particulateMatter10': payload['pm10'],
                        'airQualityIndex': this.vacBot.airQuality.airQualityIndex,
                        'volatileOrganicCompounds': payload['voc'],
                        'temperature': this.vacBot.airQuality.temperature,
                        'humidity': this.vacBot.airQuality.humidity
                    });
                    this.emit('AirQuality', this.vacBot.airQuality);
                    break;
                }
            case 'FwBuryPoint-bd_task-return-normal-start':
            case 'FwBuryPoint-bd_task-return-normal-stop':
            case 'FwBuryPoint-bd_task-clean-move-start':
            case 'FwBuryPoint-bd_task-clean-move-stop':
            case 'FwBuryPoint-bd_task-clean-current-spot-start':
            case 'FwBuryPoint-bd_task-clean-current-spot-stop':
            case 'FwBuryPoint-bd_task-clean-specified-spot-start':
            case 'FwBuryPoint-bd_task-clean-specified-spot-stop': {
                const fwBuryPointEvent = abbreviatedCommand.substring(20);
                this.vacBot.handleTask(fwBuryPointEvent, payload);
                if (this.currentTask) {
                    this.emit('TaskStarted', this.currentTask);
                    break;
                }
            }
            case 'FwBuryPoint-bd_dtofstart': // DToF-Laser-Sensor
            case 'FwBuryPoint-bd_errorcode':
            case 'FwBuryPoint-bd_relocation':
            case 'FwBuryPoint-bd_setting':
            case 'FwBuryPoint-bd_setting-evt': // Event -> Config stored...
                break;
            case 'FwBuryPoint-bd_gyrostart':
                /* {
                    "gid":"G1669968164685",
                    "ts":"1670148323348",
                    "index":"0000000552",
                    "gst":400
                } */
                break;
            case 'FwBuryPoint-bd_returnchargeinfo':
                /* {
                    "gid": "G1669968164685",
                    "index": "0000000564",
                    "ts": "1670148387296",
                    "startType": 0,
                    "finishType": 0,
                    "planResult": 1,
                    "planElapsedTime": 0,
                    "totalElapsedTime": 0,
                    "jointElapsedTime": 0,
                    "detectMiddleCodeWhenPlanFinish": 0,
                    "detectOmniWallWhenPlanFinish": 0,
                    "detectCodeWhenPlanFinish": 0,
                    "chargingStatus": 0
                } */
                break;
            case 'FwBuryPoint-bd_basicinfo-evt':
                /* {
                    "gid": "G1669968164685",
                    "index": "0000000563",
                    "ts": "1670148384758",
                    "orig": {
                        "battery": 98,
                        "chargeState": 0,
                        "robotState": 0,
                        "robotPos": "9,403",
                        "chargerPos": "27,427",
                        "onCharger": 1
                    },
                    "new": {
                        "battery": 98,
                        "chargeState": 1,
                        "robotState": 0,
                        "robotPos": "9,402",
                        "chargerPos": "27,427",
                        "onCharger": 1
                    }
                } */
                break;
            case 'FwBuryPoint-bd_cri04':
                // Vermutung: es handelt sich um Signal(stärke)werte vom/zum externen Sensor
                // Assumption: these are signal values (strength) from/to the external sensor
                /* {
                    "ts": "1670148786607",
                    "cr": 26,
                    "rr": 657
                } */
                break;
            case 'ThreeModuleStatus':
                this.vacBot.handleThreeModule(payload);
                if (this.vacBot.airFreshening.enabled) {
                    this.emit('AirFreshening', this.vacBot.airbotAutoModel);
                }
                if (this.vacBot.humidification.enabled) {
                    this.emit('Humidification', this.vacBot.humidification);
                }
                if (this.vacBot.uvAirCleaning.enabled) {
                    this.emit('UVAirCleaning', this.vacBot.uvAirCleaning);
                }
                break;
            case 'AirbotAutoModel':
                this.vacBot.handleAirbotAutoModel(payload);
                if (this.vacBot.airbotAutoModel) {
                    this.emit('AirbotAutoModel', this.vacBot.airbotAutoModel);
                }
                break;
            case 'ThreeModule':
                this.vacBot.handleThreeModule(payload);
                if (this.vacBot.threeModule) {
                    this.emit('ThreeModule', this.vacBot.threeModule);
                }
                break;
            case 'AreaPoint':
                // Hindernisse, die beim Reinigen erkannt werden (AIVI)
                // Obstacles detected during cleaning (AIVI)
                break;
            case 'AirSpeed':
            case 'Humidity':
            case 'Temperature':
                if (payload) {
                    tools.envLogInfo(`[AirPurifier] Payload for ${abbreviatedCommand} message: ${JSON.stringify(payload)}`);
                }
                break;
            case 'setVoice':
                tools.envLogInfo(`[EcovacsMQTT_JSON] SETVOICE:`);
                tools.envLogInfo(payload);
                this.emit('SetVoice', payload);
                break;
            case 'Voice':
                if (payload && payload.downloads) {
                    payload.downloads.forEach((dlObject) => {
                        if (dlObject.status === "dl") {
                            tools.envLogInfo(`[EcovacsMQTT_JSON] Download(` + dlObject.type + `): ` + dlObject.progress + `%`);
                            this.emit('VoiceDownloadProgress', dlObject);
                        } else if (dlObject.status === "dld") {
                            tools.envLogInfo(`[EcovacsMQTT_JSON] Download(` + dlObject.type + `): Complete`);
                            this.emit('VoiceDownloadComplete', dlObject);
                        } else {
                            tools.envLogInfo(`[EcovacsMQTT_JSON] unknown download state`);
                            tools.envLogInfo(dlObject);
                        }
                    });
                }
                break;
            case 'WifiList':
                this.vacBot.handleWiFiList(payload);
                this.emit('WifiList', payload);
                break;
            case 'ListenMusic':
                tools.envLogInfo(event);
                break;
            case 'Ota':
                this.vacBot.handleOverTheAirUpdate(payload);
                this.emit('Ota', payload);
                break;
            case 'TimeZone':
                this.vacBot.handleTimeZone(payload);
                this.emit('TimeZone', payload);
                break;
            case 'AudioCallState':
                this.vacBot.handleAudioCallState(event);
                break;
            default: {
                if (command === 'onFwBuryPoint') {
                    tools.envLogWarn('onFwBuryPoint message was unhandled');
                } else {
                    tools.envLogWarn(`got payload for unknown command '${command}': ${JSON.stringify(payload)}`);
                }
                break;
            }
        }
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
        // Remove "get" from the command
        if (command.startsWith("get") || command.startsWith("Get")) {
            commandPrefix = 'get';
        }
        // Remove "set" from the command
        if (command.startsWith("set") || command.startsWith("Set")) {
            commandPrefix = 'set';
        }
        return commandPrefix;
    }

    handleV2commands(abbreviatedCommand) {
        if (abbreviatedCommand === 'MapSet_V2') {
            // TODO: handle subsets
            return abbreviatedCommand;
        };
        if (abbreviatedCommand === 'MapInfo_V2') {
            if (this.vacBot.authDomain === constants.AUTH_DOMAIN_YD) {
                return 'MapInfo_V2_Yeedi';
            } else {
                return abbreviatedCommand;
            }
        }
        return abbreviatedCommand.slice(0, -3);
    }

    /**
     * Handle onFwBuryPoint message (e.g. T8/T9 series)
     * This is presumably some kind of debug or internal message
     * The main advantage of this message is that it's fired immediately
     * @param {Object} payload
     */
    async handleFwBuryPoint(payload) {
        try {
            let fwBuryPointEvent = '';
            let fwBuryPoint = {};
            if (payload.hasOwnProperty('new')) {
                tools.envLogFwBuryPoint(payload);
                fwBuryPoint = payload.new;
            } else if (payload.hasOwnProperty('content')) {
                const content = JSON.parse(payload['content']);
                fwBuryPointEvent = content["rn"];
                tools.envLogFwBuryPoint(`event: ${fwBuryPointEvent}`);
                tools.envLogFwBuryPoint(payload);
                let dVal = content['d']['body']['data']['d_val'];
                let dValObject = null;
                // try to fix invalid JSON
                try {
                    dValObject = (typeof dVal === 'string') ? JSON.parse(dVal) : dVal;
                } catch (e) {
                    if (dVal.indexOf("}") < dVal.indexOf("{")) {
                        if (dVal.indexOf("]") > -1 && dVal.indexOf("[") === -1) {
                            dVal = "[" + dVal.substring(dVal.indexOf("{"));
                        } else {
                            dVal = "[" + dVal.substring(dVal.indexOf("{"));
                        }
                    } else if (dVal.indexOf("]") < dVal.indexOf("[")) {
                        dVal = "[" + dVal.substring(dVal.indexOf("{"));
                    }
                    dValObject = JSON.parse(dVal);
                }
                fwBuryPoint = dValObject;
            }

            if (fwBuryPointEvent === 'bd_wifi_24g') {
                //
            } else if (fwBuryPointEvent === 'bd_onoffline') {
                // after reconnection
            } else if (fwBuryPointEvent === 'bd_PowerOnOff') {
                // after powered on
            } else if (fwBuryPointEvent === 'bd_fbi08') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_returnchargeinfo') {
                // charging informations
            } else if (fwBuryPointEvent === 'bd_returndock') {
                // returning to dock
            } else if (fwBuryPointEvent === 'bd_trigger') {
                // when pyhsical- or app button is pressed
            } else if (fwBuryPointEvent === 'bd_task') {
                // when a tasks starts
            } else if (fwBuryPointEvent === 'bd_sensortriggerinfo') {
                // when a sensor gets triggered
            } else if (fwBuryPointEvent === 'bd_cri01') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_cc10') {
                // Charging Case
            } else if (fwBuryPointEvent === 'bd_vslaminfo') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_planinfo') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_extramap') {
                // seems to get raised, when the robot found extra space that is not on the map
            } else if (fwBuryPointEvent === 'bd_light') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_cache') {
                // unknown
            }

            // Info whether the dust case is installed
            if (fwBuryPoint.hasOwnProperty('dirtboxState')) {
                const val = fwBuryPoint.dirtboxState;
                this.emit('DustCaseInfo', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('code')) {
                if (fwBuryPoint.code === 110) { /* NoDustBox: Dust Bin Not installed */
                    const val = Number(!fwBuryPoint.state);
                    this.emit('DustCaseInfo', val);
                    return true;
                }
            }
            if (fwBuryPoint.hasOwnProperty('multiMap')) {
                // Info whether multi-map mode is enabled
                const val = fwBuryPoint.multiMap;
                this.emit('SettingInfoMultiMap', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('AI')) {
                // Info whether AIVI is enabled
                const val = fwBuryPoint.AI;
                this.emit('SettingInfoAIVI', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('aromamode')) {
                // aromamode: 0 = disabled, 1 = enabled
                const val = fwBuryPoint.aromamode;
                this.emit('AromaMode', val);
                return true;
            }
            // ----------------------------------
            // Use these properties as trigger
            // ----------------------------------
            if (fwBuryPoint.hasOwnProperty('waterAmount') || fwBuryPoint.hasOwnProperty('waterbox')) {
                // Mopping functionality related data
                this.vacBot.run("GetWaterInfo");
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('mopremind')) {
                // Info whether 'Cleaning Cloth Reminder' is enabled
                this.vacBot.run('GetDusterRemind');
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('isPressurized')) {
                // Info whether 'Auto-Boost Suction' is enabled
                this.vacBot.run('GetCarpetPressure');
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('DND')) {
                // Info whether 'Do Not Disturb' is enabled
                this.vacBot.run('GetDoNotDisturb');
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('continue')) {
                // Info whether 'Continuous Cleaning' is enabled
                this.vacBot.run('GetContinuousCleaning');
                return true;
            }
        } catch (e) {
            tools.envLogWarn(`error handling onFwBuryPoint payload: '${e.message}'`);
            tools.envLogPayload(payload);
        }
        return false;
    }
}

module.exports = EcovacsMQTT_JSON;
