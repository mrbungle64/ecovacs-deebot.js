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
            if (message['body'] && message['body']['data']) {
                payload = message['body']['data'];
            }
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
            abbreviatedCommand = this.handleV2commands(abbreviatedCommand);
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
            case 'AirDring':
                this.bot.handleAirDryingState(payload);
                this.emit('AirDryingState', this.bot.airDryingStatus);
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
                if (this.vacBot.currentCustomAreaValues) {
                    this.emit("LastUsedAreaValues", this.vacBot.currentCustomAreaValues);
                }
                this.emit("CurrentCustomAreaValues", this.vacBot.currentCustomAreaValues);
                this.emit("CurrentSpotAreas", this.vacBot.currentSpotAreas);
                break;
            case "Speed":
                this.vacBot.handleSpeed(payload);
                this.emit("CleanSpeed", this.vacBot.cleanSpeed);
                break;
            case "RelocationState":
                this.vacBot.handleRelocationState(payload);
                this.emit("RelocationState", this.vacBot.relocationState);
                break;
            case "MapInfo_V2":
                try {
                    this.vacBot.handleMapInfoV2(payload);
                    this.emit("CurrentMapMID", this.vacBot.currentMapMID);
                    this.emit("CurrentMapName", this.vacBot.currentMapName);
                    this.emit("CurrentMapIndex", this.vacBot.currentMapIndex);
                    this.emit("Maps", this.vacBot.maps);
                } catch (e) {
                    tools.envLog("[EcovacsMQTT_JSON] Error on handling MapInfo_V2: %s", e.message);
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
                    tools.envLog("[EcovacsMQTT_JSON] Error on handling CachedMapInfo: %s", e.message);
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
            case 'AIMap':
            case 'Clean'.toLowerCase():
            case 'MapState':
            case 'Recognization':
                if (payload) {
                    tools.envLog(`[EcovacsMQTT_JSON] Payload for ${abbreviatedCommand} message: ${JSON.stringify(payload)}`);
                }
                break;
            case 'AirQuality':
                this.vacBot.handleAirQuality(payload);
                if (this.vacBot.airQuality) {
                    this.emit('AirQuality', this.vacBot.airQuality);
                }
                break;

            // T9 AIVI
            case 'DModule':
                // {"status":1,"enable":1}
                break;
            case 'AIMapAndMapSet':
                // {"onAIMap":{"mid":"1839835603","totalCount":4},"onMapSet":{"mid":"1839835603","type":"svm","hasUnRead":0}}
                break;

            // AirBot Z1
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
                if (this.vacBot.humanoidFollow_Yiko) {
                    this.emit('HumanoidFollowYiko', this.vacBot.humanoidFollow_Yiko);
                }
                if (this.vacBot.humanoidFollow_Video) {
                    this.emit('HumanoidFollowVideo', this.vacBot.humanoidFollow_Video);
                }
                break;
            case 'FwBuryPoint-bd_sysinfo':
                this.vacBot.handleSysinfo(payload);
                if (this.vacBot.sysinfo) {
                    this.emit('Sysinfo', this.vacBot.sysinfo);
                }
                break;
            case 'FwBuryPoint-bd_setting-ev':
                // Event -> Config stored...
                break;
            case 'FwBuryPoint-bd_setting':
                /*
                {
                    "gid": "G1669968164685",
                    "index": "0000000553",
                    "ts": "1670148325554",
                    "id": "8181670148325554",
                    "continue": 0,
                    "DND": 1,
                    "cameraBlock": 1,
                    "fanLevel": 2,
                    "voiceLevel": 0,
                    "simpleMode": 0,
                    "follow": 0,
                    "wheelTruck": 1,
                    "childLock": 1,
                    "blueSpeaker": 0,
                    "angleWakeup": 0,
                    "efficiency": 0
                }
                */
                break;
            case 'FwBuryPoint-bd_air-quality':
                /*
                {
                    "gid": "G1669968164685",
                    "index": "0000000505",
                    "ts": "1670137366923",
                    "pm1": 4,
                    "pm10": 6,
                    "pm25": 5,
                    "voc": 6
                }
                */
                break;
            case 'FwBuryPoint-bd_gyrostart':
                /*
                {
                    "gid":"G1669968164685",
                    "ts":"1670148323348",
                    "index":"0000000552",
                    "gst":400
                }
                */
                break;
            case 'FwBuryPoint-bd_basicinfo':
                /*
                {
                    "gid": "G1669968164685",
                    "index": "0000000551",
                    "ts": "1670148317338",
                    "orig": {
                        "battery": 100,
                        "chargeState": 0,
                        "robotState": 0,
                        "robotPos": "-11,248",
                        "chargerPos": "27,427",
                        "onCharger": 1
                    },
                    "new": {
                        "battery": 100,
                        "chargeState": 0,
                        "robotState": 0,
                        "robotPos": "-21,161",
                        "chargerPos": "27,427",
                        "onCharger": 0
                    }
                }
                */
                break;
            case 'FwBuryPoint-bd_task-return-normal-start':
                /*
                {
                    "gid": "G1669968164685",
                    "index": "0000000561",
                    "ts": "1670148367610",
                    "mid": "1720240719",
                    "bid": "3901670148367610",
                    "sid": "8911670148367606",
                    "triggerType": "workcomplete",
                    "returnId": "4571670148367610",
                    "cleanId": "6921670148325555"
                }
                */
               break;
            case 'FwBuryPoint-bd_task-clean-move-start':
                /*
                {
                    "gid": "G1669968164685",
                    "ts": "1670148617826",
                    "index": "0000000584",
                    "mid": "1720240719",
                    "bid": "2631670148617826",
                    "sid": "1541670148617825",
                    "triggerType": "app",
                    "cleanId": "4831670148577809",
                    "pauseId": "",
                    "resumeId": "",
                    "time": 0,
                    "volume": 0,
                    "stopReason": 0,
                    "buildstate": "built",
                    "uvlight": 1,
                    "smell": 1,
                    "smell_level": 1,
                    "humidify": 0,
                    "humidify_level": 45,
                    "go_fail": 1
                }
                */
                break;
            case 'FwBuryPoint-bd_task-clean-move-stop':
                /*
                {
                    "gid": "G1669968164685",
                    "ts": "1670148365606",
                    "index": "0000000558",
                    "mid": "1720240719",
                    "bid": "1341670148365606",
                    "sid": "5971670148365606",
                    "triggerType": "app",
                    "cleanId": "6921670148325555",
                    "pauseId": "",
                    "resumeId": "",
                    "time": 15,
                    "volume": 60,
                    "stopReason": 1,
                    "buildstate": "built",
                    "uvlight": 1,
                    "smell": 1,
                    "smell_level": 1,
                    "humidify": 0,
                    "humidify_level": 45,
                    "go_fail": 1
                }
                */
               break;
            case 'FwBuryPoint-bd_task-return-normal-stop':
                /*
                {
                    "gid": "G1669968164685",
                    "ts": "1670148389297",
                    "index": "0000000568",
                    "mid": "1720240719",
                    "bid": "9151670148389297",
                    "sid": "8861670148389296",
                    "triggerType": "workcomplete",
                    "returnId": "4571670148367610",
                    "pauseId": "",
                    "resumeId": "",
                    "cleanId": "6921670148325555"
                }

                */
                break;
            case 'FwBuryPoint-bd_task-clean-current-spot-start':
                /*
                {
                    "gid": "G1669968164685",
                    "index": "0000000571",
                    "ts": "1670148512820",
                    "mid": "1720240719",
                    "bid": "8021670148512820",
                    "sid": "9651670148512819",
                    "triggerType": "app",
                    "cleanId": "6851670148512820",
                    "buildstate": "built"
                }
                */
                break;
            case 'FwBuryPoint-bd_task-clean-current-spot-stop':
                /*
                {
                    "gid": "G1669968164685",
                    "ts": "1670148550894",
                    "index": "0000000574",
                    "mid": "1720240719",
                    "bid": "1331670148550893",
                    "sid": "4071670148550892",
                    "triggerType": "app",
                    "cleanId": "6851670148512820",
                    "pauseId": "",
                    "resumeId": "",
                    "time": 0,
                    "volume": 0,
                    "stopReason": 0,
                    "buildstate": "built",
                    "uvlight": 1,
                    "smell": 1,
                    "smell_level": 1,
                    "humidify": 0,
                    "humidify_level": 45,
                    "areaType": 0
                }
                */
                break;
            case 'FwBuryPoint-bd_dtofstart':
                /*
                {
                    "gid": "G1669968164685",
                    "ts": "1670148313548",
                    "index": "0000000548",
                    "dsc": 0
                }
                */
               break;
            case 'FwBuryPoint-bd_returnchargeinfo':
                /*
                {
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
                }
                */
                break;
            case 'FwBuryPoint-bd_basicinfo-evt':
                /*
                {
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
                }
                */
                break;
            case 'FwBuryPoint-bd_cri04':
                // ich VERMUTE, es handelt sich um Signal(stärke)werte vom/zum externen Sensor
                /*
                {
                    "gid": "G1669968164685",
                    "index": "0000000595",
                    "ts": "1670148786607",
                    "cr": 26,
                    "rr": 657
                }
                */
                break;
            case 'AirbotAutoModel':
                this.vacBot.handleAirbotAutoModel(payload);
                if (this.vacBot.airbotAutoModel) {
                    this.emit('AirbotAutoModel', this.vacBot.airbotAutoModel);
                }
                break;
            case 'ThreeModule':
                this.vacBot.handleThreeModule(payload);
                if (this.vacBot.threeModules) {
                    this.emit('AirbotAutoModel', this.vacBot.airbotAutoModel);
                }
                break;
            case 'AreaPoint':
                break;
            case 'AirSpeed':
            case 'Humidity':
            case 'Temperature':
                if (payload) {
                    tools.envLog(`[AirPurifier] Payload for ${abbreviatedCommand} message: ${JSON.stringify(payload)}`);
                }
                break;
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

    handleV2commands(abbreviatedCommand) {
        if (this.vacBot.authDomain === constants.AUTH_DOMAIN_YD) {
            switch (abbreviatedCommand) {
                case 'MapInfo_V2':
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
        console.info(payload);
        // T9 AIVI:
        // bd_setting"                  d_val":{"gid":"G1669769599208","index":"0000000090","simpleMode":0,"AI":1,"isPressurized":1,"fanspeed":2,"continue":0,"waterAmount":0,"DND":0,"mopremind":0,"mopmode":0,"aromamode":1,"personalClean":0,"autocollect":1,"occurrenceTime":"1670157430023"}}}}}
        // bd_basicinfo"                d_val":{"gid":"G1669769599208","index":"0000000103","battery":100,"waterbox":4,"sleep":1,"charge":2,"robotstate":0,"robotPos":"-491,53","chargePos":"345,91","chargetype":3,"dirtboxState":1,"occurrenceTime":"1670157527468"}}}}}
        // bd_trigger"                  d_val":{"gid":"G1669769599208","index":"0000000113","triggerType":"key","occurrenceTime":"1670167987297"}}}}
        // bd_fbi08"                    d_val":[{"gid":"G1670167991098","index":4,"occurrenceTime":"1670167991099","dsc":0}]}}}}
        // bd_cc10"                     d_val":{"gid":"G1670167998033","index":3,"occurrenceTime":"1670167998033","chargecase":3}}}}}
        // bd_PowerOnOff"               d_val":{"gid":"G1669769599208","index":"0000000109","occurrenceTime":"1670167987284","act":"PowerOn","trigger":1}}}}}
        // bd_errorcode"                d_val":{"gid":"G1669769599208","information":32,"index":"0000000110","code":209,"state":0,"ldsinfo":0,"content":"","occurrenceTime":"1670167987290"}}}}}

        // Yeedi Mop Station:
        // bd_returndock"               d_val":"{\\"index\\":\\"0000000098\\",\\"occurrenceTime\\":\\"1670186048946\\",\\"gid\\":\\"G0000000009389\\",\\"task\\":\\"stop\\",\\"result\\":1}"}}}}
        // bd_extramap"                 d_val":"{\\"index\\":\\"0000000099\\",\\"occurrenceTime\\":\\"1670186056711\\",\\"gid\\":\\"G0000000009389\\",\\"extratype\\":4294967294}"}}}}
        // bd_returnchargeinfo"         d_val":"{\\"index\\":\\"0000000097\\",\\"occurrenceTime\\":\\"1670186048924\\",\\"gid\\":\\"G0000000009389\\",\\"occurrenceTime\\":\\"1670184584380\\",\\"startType\\":3,\\"finishType\\":1,\\"planResult\\":0,\\"planElapsedTime\\":23,\\"totalElapsedTime\\":57,\\"jointElapsedTime\\":34,\\"detectMiddleCodeWhenPlanFinish\\":0,\\"detectOmniWallWhenPlanFinish\\":0,\\"detectCodeWhenPlanFinish\\":0}"}}}}
        // bd_light"                    d_val":"{\\"index\\":\\"0000000086\\",\\"occurrenceTime\\":\\"1670185985053\\",\\"gid\\":\\"G0000000009389\\",\\"efficiency\\":43,\\"state\\":0}"}}}}
        // bd_vslaminfo"                d_val":"{\\"index\\":\\"0000000085\\",\\"occurrenceTime\\":\\"1670185985052\\",\\"gid\\":\\"G0000000009389\\",\\"efficiency\\":64,\\"multiplex\\":34,\\"gyrodelta\\":\\"0,0,0,0,0,0\\"}"}}}}
        // bd_planinfo"                 d_val":"{\\"occurrenceTime\\":\\"1670185985027\\",\\"index\\":\\"0000000084\\",\\"occurrenceTime\\":\\"1670185985027\\",\\"gid\\":\\"G0000000009389\\",\\"naviSuccessRate\\":0.692308,\\"naviSuccessCount\\":27,\\"naviCount\\":39,\\"escCount\\":1,\\"escSuccessRate\\":1,\\"carpetArea\\":0,\\"escPose\\":[{\\"x\\":1.426899,\\"y\\":-0.557692,\\"theta\\":3.058327}],\\"escType\\":[{\\"type\\":6}]}"}}}}
        // bd_errorcode"                d_val":"{\\"index\\":\\"0000000083\\",\\"occurrenceTime\\":\\"1670185921309\\",\\"gid\\":\\"G0000000009389\\",\\"information\\":18,\\"code\\":111,\\"state\\":0}"}}}}

        try {
            let content = JSON.parse(payload['content']);
            const fwBuryMessage = content["rn"];
            tools.envLog(fwBuryMessage);
            let dVal = content['d']['body']['data']['d_val'];
            let dValObject = null;

            // try to fix invalid JSON
            try {
                dValObject = (typeof dVal == 'string') ? JSON.parse(dVal) : dVal;
            } catch(e) {
                if(dVal.indexOf("}") < dVal.indexOf("{")) {
                    if(dVal.indexOf("]") > -1 && dVal.indexOf("[") == -1) {
                        dVal = "[" + dVal.substring(dVal.indexOf("{"));
                    } else {
                        dVal = "[" + dVal.substring(dVal.indexOf("{"));
                    }
                } else if(dVal.indexOf("]") < dVal.indexOf("[")) {
                    dVal = "[" + dVal.substring(dVal.indexOf("{"));
                }
                dValObject = JSON.parse(dVal);
            }

            const fwBuryPoint = dValObject;
            let val;

            if (fwBuryMessage == 'bd_sysinfo') {
                this.vacBot.handleSysinfo(JSON.stringify({'body': fwBuryPoint}));
                return;
            } else if (fwBuryMessage == 'bd_sysinfo') {
                this.vacBot.handleSysinfo(JSON.stringify({'body': fwBuryPoint}));
                return;
            }

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
            tools.envLog(e);
        }
    }
}

module.exports = EcovacsMQTT_JSON;