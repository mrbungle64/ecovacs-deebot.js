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
            } else if (message['body']) {
                payload = message['body'];
            } else {
                tools.envLogWarn('Unhandled MQTT message payload ...');
                return;
            }
        } else if (type === "response") {
            resultCode = message['body']['code'];
            resultCodeMessage = message['body']['msg'];
            payload = message['body']['data'];
            if (message['header']) {
                const header = message['header'];
                if (this.vacBot.firmwareVersion !== header['fwVer']) {
                    this.vacBot.firmwareVersion = header['fwVer'];
                    this.emitMessage('HeaderInfo', {
                        'fwVer': header['fwVer'],
                        'hwVer': header['hwVer']
                    });
                }
            }
        } else if (type === "logResponse") {
            tools.envLogInfo(`got message with type 'logResponse'`);
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
        tools.logEvent(command, payload);
        let abbreviatedCommand = command.replace(/^_+|_+$/g, '');
        const commandPrefix = this.getCommandPrefix(abbreviatedCommand);
        abbreviatedCommand = abbreviatedCommand.substring(commandPrefix.length);
        if (this.vacBot.genericCommand) {
            const genericCommandPrefix = this.getCommandPrefix(this.vacBot.genericCommand);
            const abbreviatedGenericCommand = this.vacBot.genericCommand.substring(genericCommandPrefix.length);
            if (abbreviatedGenericCommand.toLowerCase() === abbreviatedCommand.toLowerCase()) {
                this.emit('genericCommandPayload', payload);
                this.vacBot.genericCommand = null;
            }
        }
        // e.g. T8, T9, T10, T20, N8, X1, X2 series and Airbot Z1
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
            case 'AdvancedMode': {
                // "Advanced Mode" (e.g. OZMO 920/950, T8 AIVI)
                this.vacBot.handleAdvancedMode(payload);
                this.emitMessage("AdvancedMode", this.vacBot.advancedMode);
                break;
            }
            case 'AICleanItemState': {
                // "Strategic Particle Removal" and "Strategic Pet Poop Avoidance" mode (e.g. X1)
                this.vacBot.handleAICleanItemState(payload);
                if (this.vacBot.aiCleanItemState.items.length) {
                    this.emitMessage('AICleanItemState', this.vacBot.aiCleanItemState);
                }
                break;
            }
            case 'AutoEmpty': {
                // "Auto empty" status (Auto-Empty Station)
                this.vacBot.handleAutoEmpty(payload);
                this.emitMessage("AutoEmpty", this.vacBot.autoEmpty);
                const autoEmptyStatus = {
                    'autoEmptyEnabled': (this.vacBot.autoEmpty === 1),
                    'stationStatus': this.vacBot.autoEmptyStatus,
                    'stationActive': (this.vacBot.autoEmptyStatus === 1),
                    'dustBagFull': (this.vacBot.autoEmptyStatus === 5)
                };
                this.emitMessage("AutoEmptyStatus", autoEmptyStatus);
                break;
            }
            case "Battery": {
                // Battery status
                this.vacBot.handleBattery(payload);
                if (this.vacBot.batteryLevel) {
                    this.emitMessage("BatteryInfo", this.vacBot.batteryLevel);
                    this.emitMessage("BatteryIsLow", this.vacBot.batteryIsLow);
                }
                break;
            }
            case 'Block': {
                // "Do Not Disturb" mode
                this.vacBot.handleBlock(payload);
                this.emitMessage("DoNotDisturbEnabled", this.vacBot.block);
                const doNotDisturbEnabled = Boolean(this.vacBot.block);
                if (doNotDisturbEnabled) {
                    this.emitMessage("DoNotDisturbBlockTime", this.vacBot.blockTime);
                }
                break;
            }
            case 'BorderSpin': {
                // "Edge Deep Cleaning" (e.g. X1)
                this.vacBot.handleBorderSpin(payload);
                this.emitMessage('BorderSpin', this.vacBot.borderSpin);
                break;
            }
            case 'BreakPoint': {
                // "Continuous Cleaning Mode" / "Resumed Clean"
                this.vacBot.handleBreakPoint(payload);
                this.emitMessage("ContinuousCleaningEnabled", this.vacBot.breakPoint);
                break;
            }
            case 'CleanLogs': {
                // "Cleaning Log"
                this.vacBot.handleCleanLogs(payload);
                let cleanLog = [];
                for (let i in this.vacBot.cleanLog) {
                    if (this.vacBot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.vacBot.cleanLog[i]);
                    }
                }
                this.emitMessage("CleanLog", cleanLog);
                this.emitMessage('LastCleanLogs', {
                    'timestamp': this.vacBot.cleanLog_lastTimestamp,
                    'squareMeters': this.vacBot.cleanLog_lastSquareMeters,
                    'totalTime': this.vacBot.cleanLog_lastTotalTime,
                    'totalTimeFormatted': this.vacBot.cleanLog_lastTotalTimeString,
                    'imageUrl': this.vacBot.cleanLog_lastImageUrl
                });
                break;
            }
            case 'CarpertPressure': { // The typo in 'Carpert' is intended
                // "Auto-Boost Suction"
                this.vacBot.handleCarpetPressure(payload);
                this.emitMessage("CarpetPressure", this.vacBot.carpetPressure);
                break;
            }
            case 'CarpetInfo': {
                // "Carpet cleaning strategy"
                this.vacBot.handleCarpetInfo(payload);
                this.emitMessage("CarpetInfo", this.vacBot.carpetInfo);
                break;
            }
            case 'CleanPreference': {
                // "Cleaning Preference"
                this.vacBot.handleCleanPreference(payload);
                this.emitMessage("CleanPreference", this.vacBot.cleanPreference);
                break;
            }
            case 'CleanCount': {
                // "Cleaning Times" (number of cleaning repetitions)
                this.vacBot.handleCleanCount(payload);
                this.emitMessage("CleanCount", this.vacBot.cleanCount);
                break;
            }
            case "CleanInfo": {
                // Various information about the cleaning status
                this.vacBot.handleCleanInfo(payload);
                this.emitMessage("CleanReport", this.vacBot.cleanReport);
                this.emitMoppingSystemReport();
                if (this.vacBot.chargeStatus) {
                    this.emitMessage("ChargeState", this.vacBot.chargeStatus);
                }
                if (this.vacBot.currentCustomAreaValues) {
                    this.emitMessage("LastUsedAreaValues", this.vacBot.currentCustomAreaValues);
                }
                this.emitMessage("CurrentCustomAreaValues", this.vacBot.currentCustomAreaValues);
                this.emitMessage("CurrentSpotAreas", this.vacBot.currentSpotAreas);
                break;
            }
            case "ChargeState": {
                // Various information about the charging status
                this.vacBot.handleChargeState(payload);
                if (this.vacBot.chargeStatus) {
                    this.emitMessage("ChargeState", this.vacBot.chargeStatus);
                }
                if (this.vacBot.chargeMode) {
                    this.emitMessage("ChargeMode", this.vacBot.chargeMode);
                }
                break;
            }
            case 'CustomAreaMode': {
                // "Mopping Mode" / "Cleaning efficiency"
                this.vacBot.handleCustomAreaMode(payload);
                this.emitMessage('SweepMode', this.vacBot.sweepMode);
                break;
            }
            case 'DryingDuration': {
                this.vacBot.handleDryingDuration(payload);
                this.emitMessage('DryingDuration', this.vacBot.dryingDuration);
                break;
            }
            case 'DModule': { // Air Freshener module (T9 AIVI)
                this.vacBot.handleDModule(payload);
                if (this.vacBot.dmodule.enabled) {
                    this.emitMessage("DModuleEnabled", this.vacBot.dmodule.enabled);
                    this.emitMessage("DModuleStatus", this.vacBot.dmodule.status);
                }
                break;
            }
            case 'DusterRemind': {
                // "Cleaning Cloth Reminder"
                this.vacBot.handleDusterRemind(payload);
                this.emitMessage("DusterRemind", this.vacBot.dusterRemind);
                break;
            }
            case 'Evt': {
                // Rare event, little is known about it yet
                this.vacBot.handleEvt(payload);
                if (this.vacBot.evt.event) {
                    this.emitMessage("Evt", this.vacBot.evt);
                }
                break;
            }
            case "Error": {
                // Error codes
                this.vacBot.handleResponseError(payload);
                this.emitMessage("Error", this.vacBot.errorDescription);
                this.emitMessage('ErrorCode', this.vacBot.errorCode);
                this.emitMessage('LastError', {
                    'error': this.vacBot.errorDescription,
                    'code': this.vacBot.errorCode
                });
                break;
            }
            case "LifeSpan": {
                // Consumable components
                this.vacBot.handleLifespan(payload);
                if (this.vacBot.isModelTypeAirbot()) {
                    this.emitMessage("LifeSpan", this.vacBot.components);
                } else {
                    if (!this.vacBot.emitFullLifeSpanEvent) {
                        for (let component in this.dictionary.COMPONENT_TO_ECOVACS) {
                            if (this.dictionary.COMPONENT_TO_ECOVACS.hasOwnProperty(component)) {
                                if (this.vacBot.components[component]) {
                                    if (this.vacBot.components[component] !== this.vacBot.lastComponentValues[component]) {
                                        this.emitMessage("LifeSpan_" + component, this.vacBot.components[component]);
                                        this.vacBot.lastComponentValues[component] = this.vacBot.components[component];
                                    }
                                }
                            }
                        }
                    } else {
                        this.handleLifeSpanCombined();
                    }
                }
                break;
            }
            case 'LiveLaunchPwdState': {
                // Video Manager status info
                this.vacBot.handleLiveLaunchPwdState(payload);
                this.emitMessage("LiveLaunchPwdState", this.vacBot.liveLaunchPwdState);
                break;
            }
            case "NetInfo": {
                // Various network/wifi information
                this.vacBot.handleNetInfo(payload);
                this.emitMessage("NetworkInfo", {
                    'ip': this.vacBot.netInfoIP,
                    'mac': this.vacBot.netInfoMAC,
                    'wifiSSID': this.vacBot.netInfoWifiSSID,
                    'wifiSignal': this.vacBot.netInfoWifiSignal,
                });
                break;
            }
            case 'Ota': {
                this.vacBot.handleOverTheAirUpdate(payload);
                this.emitMessage('Ota', payload);
                break;
            }
            case "Pos": {
                // Various information about the position of the bot and the charging station
                this.vacBot.handlePos(payload);
                if (this.vacBot.deebotPosition["changeFlag"]) {
                    if ((this.vacBot.deebotPosition["isInvalid"] === true) && ((this.vacBot.relocationState === 'ok') || (this.vacBot.relocationState === null))) {
                        this.vacBot.relocationState = 'required';
                        this.emitMessage("RelocationState", this.vacBot.relocationState);
                    } else if (this.vacBot.deebotPosition["x"] && this.vacBot.deebotPosition["y"]) {
                        this.emitMessage("DeebotPositionCurrentSpotAreaID", this.vacBot.deebotPosition["currentSpotAreaID"]);
                        this.emitMessage("DeebotPositionCurrentSpotAreaName", this.vacBot.deebotPosition["currentSpotAreaName"]);
                        this.emitMessage('Position', {
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
                    this.emitMessage("ChargePosition", this.vacBot.chargePosition["x"] + "," + this.vacBot.chargePosition["y"] + "," + this.vacBot.chargePosition["a"]);
                    this.emitMessage('ChargingPosition', {
                        'coords': this.vacBot.chargePosition['x'] + "," + this.vacBot.chargePosition['y'] + "," + this.vacBot.chargePosition['a'],
                        'x': this.vacBot.chargePosition['x'],
                        'y': this.vacBot.chargePosition['y'],
                        'a': this.vacBot.chargePosition['a']
                    });
                    this.vacBot.chargePosition["changeFlag"] = false;
                }
                break;
            }
            case 'QuickCommand': {
                // "Customized Scenario Cleaning" scenarios
                this.vacBot.handleQuickCommand(payload);
                this.emitMessage("CustomizedScenarioCleaning", this.vacBot.customizedScenarioCleaning);
                break;
            }
            case 'Recognization': {
                // True Detect / "AIVI 3D"
                // e.g. "AIVI Smart Recognition"
                this.vacBot.handleRecognization(payload);
                this.emitMessage('TrueDetect', this.vacBot.trueDetect);
                break;
            }
            case "RelocationState": {
                // Relocation status
                this.vacBot.handleRelocationState(payload);
                this.emitMessage("RelocationStatus", this.vacBot.relocationStatus);
                this.emitMessage("RelocationState", this.vacBot.relocationState);
                break;
            }
            case 'Sched': {
                // "Scheduling"
                this.vacBot.handleSched(payload);
                if (this.vacBot.schedule) {
                    this.emitMessage('Schedule', this.vacBot.schedule);
                }
                break;
            }
            case 'Sleep': {
                // Sleep mode/status
                this.vacBot.handleSleepStatus(payload);
                this.emitMessage("SleepStatus", this.vacBot.sleepStatus);
                break;
            }
            case "Speed": {
                // "Vacuum Power" / "Suction Power"
                this.vacBot.handleSpeed(payload);
                this.emitMessage("CleanSpeed", this.vacBot.cleanSpeed);
                break;
            }
            case "StationInfo": {
                // Various information about the cleaning station (e.g. X1 series)
                this.vacBot.handleStationInfo(payload);
                this.emitMessage('StationInfo', this.vacBot.stationInfo);
                break;
            }
            case "StationState": {
                // Various states of the cleaning station (e.g. X1 series)
                this.vacBot.handleStationState(payload);
                if (this.vacBot.stationState.type !== null) {
                    this.emitMessage("StationState", this.vacBot.stationState);
                    const airDryingState = this.vacBot.stationState.isAirDrying ? 'airdrying' : 'idle';
                    this.emitMessage('AirDryingState', airDryingState);
                }
                break;
            }
            case "Stats": {
                this.vacBot.handleStats(payload);
                if (this.vacBot.currentStats) {
                    this.emitMessage("CurrentStats", this.vacBot.currentStats);
                    this.vacBot.currentStats = null;
                }
                break;
            }
            case 'SweepMode': {
                // "Mop-Only" mode
                this.vacBot.handleSweepMode(payload);
                this.emitMessage('MopOnlyMode', this.vacBot.mopOnlyMode);
                break;
            }
            case 'TimeZone': {
                // The configured time zone
                this.vacBot.handleTimeZone(payload);
                this.emitMessage('TimeZone', payload);
                break;
            }
            case 'TotalStats': {
                this.vacBot.handleTotalStats(payload);
                this.emitMessage('CleanSum', {
                    'totalSquareMeters': this.vacBot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.vacBot.cleanSum_totalSeconds,
                    'totalNumber': this.vacBot.cleanSum_totalNumber
                });
                break;
            }
            case 'TrueDetect': {
                this.vacBot.handleTrueDetect(payload);
                this.emitMessage("TrueDetect", this.vacBot.trueDetect);
                break;
            }
            case 'Volume': {
                // The set volume level
                this.vacBot.handleVolume(payload);
                this.emitMessage("Volume", this.vacBot.volume);
                break;
            }
            case 'WashInfo': {
                this.vacBot.handleWashInfo(payload);
                this.emitMessage("WashInfo", this.vacBot.washInfo);
                break;
            }
            case "WashInterval": {
                this.vacBot.handleWashInterval(payload);
                if (this.vacBot.washInterval !== null) {
                    this.emitMessage("WashInterval", this.vacBot.washInterval);
                }
                break;
            }
            case "WaterInfo": {
                // "Water Flow Level"
                this.vacBot.handleWaterInfo(payload);
                this.emitMessage("WaterLevel", this.vacBot.waterLevel);
                this.emitMessage("WaterBoxInfo", this.vacBot.waterboxInfo);
                if (this.vacBot.moppingType !== null) {
                    this.emitMessage("WaterBoxMoppingType", this.vacBot.moppingType);
                }
                if (this.vacBot.scrubbingType !== null) {
                    this.emitMessage("WaterBoxScrubbingType", this.vacBot.scrubbingType);
                }
                this.emitMoppingSystemReport();
                break;
            }
            case 'WifiList': {
                // Configured WiFi networks
                this.vacBot.handleWiFiList(payload);
                this.emitMessage('WifiList', payload);
                break;
            }
            case "WorkMode": {
                // "Work Mode", "Cleaning Mode"
                this.vacBot.handleWorkMode(payload);
                this.emitMessage("WorkMode", this.vacBot.workMode);
                break;
            }
            // ========
            // Map info
            // ========
            case "CachedMapInfo": {
                try {
                    this.vacBot.handleCachedMapInfo(payload);
                    this.emitMessage("CurrentMapMID", this.vacBot.currentMapMID);
                    this.emitMessage("CurrentMapName", this.vacBot.currentMapName);
                    this.emitMessage("CurrentMapIndex", this.vacBot.currentMapIndex);
                    this.emitMessage("Maps", this.vacBot.maps);
                } catch (e) {
                    tools.envLogError(`error on handling CachedMapInfo: ${e.message}`);
                }
                break;
            }
            case "MapInfo": {
                if (commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
                    tools.envLogWarn(`getMapInfo responded: ${JSON.stringify(payload)}`);
                } else if (tools.isCanvasModuleAvailable()) {
                    let mapImage = await this.vacBot.handleMapImage(payload);
                    if (mapImage !== null) {
                        this.emitMessage("MapImageData", mapImage);
                        if (this.vacBot.createMapImageOnly) {
                            this.emitMessage("MapImage", mapImage);
                        }
                    }
                }
                break;
            }
            case "MapInfo_V2": {
                try {
                    this.vacBot.handleMapInfoV2(payload);
                } catch (e) {
                    tools.envLogError(`error on handling MapInfo_V2: ${e.message}`);
                }
                break;
            }
            case "MapSet": {
                // Handle spotAreas, virtualWalls, noMopZones
                let mapset = this.vacBot.handleMapSet(payload);
                if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
                    this.emitMessage(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            }
            case 'MapState': {
                this.vacBot.handleMapState(payload);
                this.emitMessage("MapState", this.vacBot.mapState);
                break;
            }
            case 'MultiMapState': {
                // Status of the Multi Map functionality
                this.vacBot.handleMultiMapState(payload);
                this.emitMessage("MultiMapState", this.vacBot.multiMapState);
                break;
            }
            case "MapSet_V2": {
                await this.vacBot.handleMapSet_V2(payload);
                this.emitMessage("MapSet_V2", this.vacBot.mapSet_V2);
                break;
            }
            case "MapSubSet": {
                // Handle spotAreas, virtualWalls, noMopZones
                let mapsubset = await this.vacBot.handleMapSubset(payload);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    // MapSpotAreaInfo, MapVirtualBoundaryInfo
                    this.emitMessage(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            }
            // =================
            // yeedi models only
            // =================
            case 'AirDring': { // The typo in 'AirDring' is intended
                // Air drying status
                this.vacBot.handleAirDryingState(payload);
                if (this.vacBot.airDryingStatus) {
                    this.emitMessage('AirDryingState', this.vacBot.airDryingStatus);
                }
                break;
            }
            case "MapInfo_V2_Yeedi": {
                // "_Yeedi" was appended as suffix
                // MapInfo_V2 for yeedi models differs from the Ecovacs variant
                try {
                    this.vacBot.handleMapInfoV2_Yeedi(payload);
                    this.emitMessage("CurrentMapMID", this.vacBot.currentMapMID);
                    this.emitMessage("CurrentMapName", this.vacBot.currentMapName);
                    this.emitMessage("CurrentMapIndex", this.vacBot.currentMapIndex);
                    this.emitMessage("Maps", this.vacBot.maps);
                } catch (e) {
                    tools.envLogError(`error on handling MapInfo_V2 (yeedi): ${e.message}`);
                }
                break;
            }
            // ==================================
            // AIRBOT Z1 / Z1 Air Quality Monitor
            // ==================================
            case 'AirQuality':
            case 'JCYAirQuality': { // Z1 Air Quality Monitor
                this.vacBot.handleAirQuality(payload);
                if (this.vacBot.airQuality) {
                    this.emitMessage('AirQuality', this.vacBot.airQuality);
                }
                break;
            }
            case 'AiBlockPlate': {
                this.vacBot.handleAiBlockPlate(payload);
                this.emitMessage('AiBlockPlate', this.vacBot.aiBlockPlate);
                break;
            }
            case 'AirbotAutoModel': {
                this.vacBot.handleAirbotAutoModel(payload);
                if (this.vacBot.airbotAutoModel) {
                    this.emitMessage('AirbotAutoModel', this.vacBot.airbotAutoModel);
                }
                break;
            }
            case 'AngleFollow': {
                this.vacBot.handleAngleFollow(payload);
                this.emitMessage('AngleFollow', this.vacBot.angleFollow);
                break;
            }
            case 'AngleWakeup': {
                this.vacBot.handleAngleWakeup(payload);
                this.emitMessage('AngleWakeup', this.vacBot.angleWakeup);
                break;
            }
            case 'AtmoLight': {
                this.vacBot.handleAtmoLight(payload);
                if (this.vacBot.atmoLightIntensity) {
                    this.emitMessage('AtmoLight', this.vacBot.atmoLightIntensity);
                }
                break;
            }
            case 'AtmoVolume': {
                this.vacBot.handleAtmoVolume(payload);
                if (this.vacBot.atmoVolume) {
                    this.emitMessage('AtmoVolume', this.vacBot.atmoVolume);
                }
                break;
            }
            case 'AreaPoint': {
                this.vacBot.handleAreaPoint(payload);
                this.emitMessage('AreaPoint', this.vacBot.areaPoint);
                break;
            }
            case 'AutonomousClean': {
                this.vacBot.handleAutonomousClean(payload);
                this.emitMessage('AutonomousClean', this.vacBot.autonomousClean);
                break;
            }
            case 'BlueSpeaker': {
                this.vacBot.handleBlueSpeaker(payload);
                this.emitMessage('BlueSpeaker', this.vacBot.bluetoothSpeaker);
                break;
            }
            case 'ChildLock': {
                this.vacBot.handleChildLock(payload);
                this.emitMessage('ChildLock', this.vacBot.childLock);
                break;
            }
            case 'DrivingWheel': {
                this.vacBot.handleDrivingWheel(payload);
                this.emitMessage('DrivingWheel', this.vacBot.drivingWheel);
                break;
            }
            case 'Efficiency': {
                this.vacBot.handleEfficiency(payload);
                if (this.vacBot.efficiency) {
                    this.emitMessage('Efficiency', this.vacBot.efficiency);
                }
                break;
            }
            case 'HumanoidFollow': {
                this.vacBot.handleHumanoidFollow(payload);
                if ((this.vacBot.humanoidFollow_Yiko) || (this.vacBot.humanoidFollow_Video)) {
                    if (this.vacBot.humanoidFollow_Yiko) {
                        this.emitMessage('HumanoidFollowYiko', this.vacBot.humanoidFollow_Yiko);
                    }
                    if (this.vacBot.humanoidFollow_Video) {
                        this.emitMessage('HumanoidFollowVideo', this.vacBot.humanoidFollow_Video);
                    }
                }
                break;
            }
            case 'Mic': {
                this.vacBot.handleMic(payload);
                this.emitMessage('Mic', this.vacBot.mic);
                break;
            }
            case 'MonitorAirState': {
                this.vacBot.handleMonitorAirState(payload);
                this.emitMessage('MonitorAirState', this.vacBot.monitorAirState);
                break;
            }
            case 'ThreeModule': {
                this.vacBot.handleThreeModule(payload);
                if (this.vacBot.threeModule) {
                    this.emitMessage('ThreeModule', this.vacBot.threeModule);
                }
                break;
            }
            case 'ThreeModuleStatus': {
                this.vacBot.handleThreeModuleStatus(payload);
                if (this.vacBot.threeModuleStatus) {
                    this.emitMessage('ThreeModuleStatus', this.vacBot.threeModuleStatus);
                }
                break;
            }
            case 'VoiceSimple': {
                this.vacBot.handleVoiceSimple(payload);
                this.emitMessage('VoiceSimple', this.vacBot.voiceSimple);
                break;
            }
            case 'VoiceAssistantState': {
                this.vacBot.handleVoiceAssistantState(payload);
                this.emitMessage('VoiceAssistantState', this.vacBot.voiceAssistantState);
                break;
            }
            case 'AirSpeed':
            case 'Humidity':
            case 'Temperature': {
                if (payload) {
                    tools.envLogInfo(`[AirPurifier] Payload for ${abbreviatedCommand} message: ${JSON.stringify(payload)}`);
                }
                break;
            }
            case 'setVoice': {
                tools.envLogInfo(`[EcovacsMQTT_JSON] SETVOICE:`);
                tools.envLogInfo(payload);
                this.emitMessage('SetVoice', payload);
                break;
            }
            case 'Voice': {
                if (payload && payload.downloads) {
                    payload.downloads.forEach((dlObject) => {
                        if (dlObject.status === "dl") {
                            tools.envLogInfo(`[EcovacsMQTT_JSON] Download(` + dlObject.type + `): ` + dlObject.progress + `%`);
                            this.emitMessage('VoiceDownloadProgress', dlObject);
                        } else if (dlObject.status === "dld") {
                            tools.envLogInfo(`[EcovacsMQTT_JSON] Download(` + dlObject.type + `): Complete`);
                            this.emitMessage('VoiceDownloadComplete', dlObject);
                        } else {
                            tools.envLogInfo(`[EcovacsMQTT_JSON] unknown download state`);
                            tools.envLogInfo(dlObject);
                        }
                    });
                }
                break;
            }
            // =========
            // Unhandled
            // =========
            case 'AIMap': {
                // TODO: handle `AIMap` message
                break;
            }
            case 'AIMapAndMapSet': {
                // TODO: handle `AIMapAndMapSet` message
                // {"onAIMap":{"mid":"1839835603","totalCount":4},"onMapSet":{"mid":"1839835603","type":"svm","hasUnRead":0}}
                break;
            }
            case 'MajorMap': {
                this.vacBot.handleMajorMap(payload);
                // TODO: finish implementing MajorMap
                break;
            }
            case 'MapTrace': {
                this.vacBot.handleMapTrace(payload);
                // TODO: finish implementing MapTrace
                break;
            }
            case 'MinorMap': {
                // TODO: finish implementing MinorMap and emit MapLiveImage
                // let mapImage = this.vacBot.handleMinorMap(payload);
                break;
            }
            // ====================
            // FwBuryPoint messages
            // ====================
            case 'FwBuryPoint-bd_sysinfo':
                this.vacBot.handleSysinfo(payload);
                if (this.vacBot.sysinfo) {
                    this.emitMessage('Sysinfo', this.vacBot.sysinfo);
                }
                break;
            case 'FwBuryPoint-bd_air-quality':
                this.vacBot.run('GetAirQuality');
                break;
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
                    this.emitMessage('TaskStarted', this.currentTask);
                }
                break;
            }
            case 'FwBuryPoint-bd_dtofstart': // DToF-Laser-Sensor
            case 'FwBuryPoint-bd_errorcode':
            case 'FwBuryPoint-bd_relocation':
            case 'FwBuryPoint-bd_setting':
            case 'FwBuryPoint-bd_setting-evt': // Event -> Config stored...
            case 'FwBuryPoint-bd_gyrostart':
            case 'FwBuryPoint-bd_returnchargeinfo':
            case 'FwBuryPoint-bd_basicinfo-evt':
                break;
            case 'FwBuryPoint-bd_cri04':
                // {"gid":"G1716202154868","index":"0000002865","ts":"1702804165007","cr":26,"rr":692}
                // Vermutung: es handelt sich um Signal(stärke)werte vom/zum externen Sensor
                // Assumption: these are signal values (strength) from/to the external sensor
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
        }
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
                this.emitMessage('DustCaseInfo', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('code')) {
                if (fwBuryPoint.code === 110) { /* NoDustBox: Dust Bin Not installed */
                    const val = Number(!fwBuryPoint.state);
                    this.emitMessage('DustCaseInfo', val);
                    return true;
                }
            }
            if (fwBuryPoint.hasOwnProperty('multiMap')) {
                // Info whether multi-map mode is enabled
                const val = fwBuryPoint.multiMap;
                this.emitMessage('SettingInfoMultiMap', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('AI')) {
                // Info whether AIVI is enabled
                const val = fwBuryPoint.AI;
                this.emitMessage('SettingInfoAIVI', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('aromamode')) {
                // aromamode: 0 = disabled, 1 = enabled
                const val = fwBuryPoint.aromamode;
                this.emitMessage('AromaMode', val);
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
            //tools.envLogPayload(payload);
        }
        return false;
    }
}

module.exports = EcovacsMQTT_JSON;
