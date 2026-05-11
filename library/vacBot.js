'use strict';

const tools = require('./tools');
const VacBotCommand = require('./command');
const CommandDispatcher = require('./managers/commandDispatcher');
const MapManager = require('./managers/mapManager');
const BotState = require('./managers/botState');
const CapabilityManager = require('./managers/capabilityManager');
const HistoryManager = require('./managers/historyManager');
const MaintenanceManager = require('./managers/maintenanceManager');
const i18n = require('./i18n');
const map = require('./mapInfo');
const { errorCodes } = require('./errorCodes.json');
const constants = require("./constants");
const dictionary = require('./dictionary');
const mapTools = require('./mapTools');
const mapTemplate = require('./mapTemplate');
const { eventCodes } = require('./eventCodes.json');
const COMMAND_REGISTRY = require('./commandRegistry');

const HANDLE_LIVE_MAP = false;

const PROXY_MAPPINGS = {
    maintenanceManager: [
        'components', 'lastComponentValues', 'emitFullLifeSpanEvent'
    ],
    stateManager: [
        'errorCode', 'errorDescription', 'batteryLevel', 'batteryIsLow', 'cleanReport',
        'chargeStatus', 'chargeMode', 'cleanSpeed', 'waterLevel', 'waterboxInfo',
        'moppingType', 'scrubbingType', 'sleepStatus', 'deebotPosition', 'chargePosition',
        'cleanSum_totalSquareMeters', 'cleanSum_totalSeconds', 'cleanSum_totalNumber',
        'cleanLog', 'cleanLog_lastImageUrl', 'cleanLog_lastTimestamp', 'cleanLog_lastTotalTime',
        'cleanLog_lastTotalTimeString', 'cleanLog_lastSquareMeters', 'currentStats',
        'netInfoIP', 'netInfoWifiSSID', 'netInfoWifiSignal', 'netInfoMAC', 'firmwareVersion',
        'timezone', 'OTA', 'sysinfo', 'stationState', 'stationInfo', 'washInterval',
        'washInfo', 'advancedMode', 'autoEmpty', 'autoEmptyStatus', 'cleanCount',
        'cleanPreference', 'workMode', 'workState', 'sweepMode', 'mopOnlyMode',
        'borderSpin', 'borderSwitch', 'dusterRemind', 'carpetPressure', 'carpetInfo',
        'block', 'blockTime', 'breakPoint', 'volume', 'voiceSimple', 'voiceAssistantState',
        'trueDetect', 'avoidedObstacles', 'obstacleTypes', 'aiCleanItemState',
        'crossMapBorderWarning', 'cutDirection', 'moveupWarning', 'safeProtect', 'evt',
        'currentTask', 'liveLaunchPwdState', 'airQuality', 'aiBlockPlate', 'airbotAutoModel',
        'angleFollow', 'angleWakeup', 'atmoLightIntensity', 'atmoVolume', 'areaPoint',
        'autonomousClean', 'bluetoothSpeaker', 'childLock', 'humanoidFollow', 'mic',
        'monitorAirState', 'threeModule', 'threeModuleStatus', 'dmodule', 'efficiency',
        'schedule'
    ],
    mapManager: [
        'maps', 'mapImages', 'mapVirtualBoundaries', 'mapVirtualBoundariesResponses',
        'mapSpotAreaInfos', 'mapVirtualBoundaryInfos', 'currentMapName', 'currentMapMID',
        'currentMapIndex', 'currentCustomAreaValues', 'currentSpotAreas', 'createMapDataObject',
        'createMapImage', 'createMapImageOnly', 'mapDataObject', 'mapDataObjectQueue',
        'mapImageDataQueue', 'mapState', 'multiMapState', 'mapSet_V2', 'liveMapImage'
    ]
};

/**
 * @class VacBot
 * This class represents the vacuum bot
 */
class VacBot {
    /**
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} [country] - the country where the Ecovacs account is registered
     * @param {string} [serverAddress=''] - the server address of the MQTT and XMPP server
     * @param {string} [authDomain=''] - the domain for authorization
     */
    constructor(user, hostname, resource, secret, vacuum, continent, country, serverAddress = '', authDomain = '') {

        this.country = country;
        this.continent = continent;
        this.did = vacuum.did;
        this.res = vacuum.resource;
        this.resource = resource;
        this.uid = user;
        this.user_access_token = secret;

        this.vacuum = vacuum;
        this.authDomain = authDomain;
        this.is_ready = false;

        this.deviceClass = vacuum['class'];
        this.deviceModel = this.getProductName();
        this.deviceImageURL = this.getProductImageURL();

        this.commandsSent = [];
        this.mapPiecePacketsSent = [];

        this.genericCommand = null;

        this.capabilityManager = new CapabilityManager(this);

        if (!this.is950type()) {
            const msg = `'XML' based model identified (unsupported)`;
            tools.envLogError(msg);
            throw new Error(msg);
        }

        this.vacBotCommand = require('./command');
        this.protocolModule = require('./ecovacs');

        this.ecovacs = new this.protocolModule(this, user, hostname, resource, secret, continent, country, vacuum, serverAddress);

        this.dispatcher = new CommandDispatcher(this);
        this.mapManager = new MapManager(this);
        this.stateManager = new BotState(this);
        this.historyManager = new HistoryManager(this);
        this.maintenanceManager = new MaintenanceManager(this);

        this.ecovacs.on('ready', () => {
            tools.envLogInfo(`[VacBot] Ready event!`);
            this.is_ready = true;
        });
    }

    /**
     * It takes a single argument, `mode`, which defaults to `"Clean"` (auto clean)
     * The function then calls the `run` function with the value of `mode` as the first argument
     * @since 0.6.2
     * @param {string} [mode=Clean] - The mode to run the script in.
     */
    clean(mode = 'Clean') {
        this.run(mode);
    }

    /**
     * This is a wrapper function for auto clean mode
     * @since 0.6.2
     * @param {string} areas - A string with a list of spot area IDs
     */
    spotArea(areas) {
        this.run('SpotArea', 'start', areas);
    }

    /**
     * This is a wrapper function that will start cleaning the area specified by the boundary coordinates
     * @since 0.6.2
     * @param {string} boundaryCoordinates - A list of coordinates that form the polygon boundary of the area to be cleaned
     * @param {number} [numberOfCleanings=1] - The number of times the robot will repeat the cleaning process
     */
    customArea(boundaryCoordinates, numberOfCleanings = 1) {
        this.run('CustomArea', 'start', boundaryCoordinates, numberOfCleanings);
    }

    /**
     * This is a wrapper function for edge cleaning mode
     * @since 0.6.2
     */
    edge() {
        this.clean('Edge');
    }

    /**
     * This is a wrapper function for spot cleaning mode
     * @since 0.6.2
     */
    spot() {
        this.clean('Spot');
    }

    /**
     * This is a wrapper function to send the vacuum back to the charging station
     * @since 0.6.2
     */
    charge() {
        this.run('Charge');
    }

    /**
     * This is a wrapper function to stop the bot
     * @since 0.6.2
     */
    stop() {
        this.run('Stop');
    }

    /**
     * This is a wrapper function to pause the bot
     * @since 0.6.2
     */
    pause(mode = 'auto') {
        this.run('Pause', mode);
    }

    /**
     * This is a wrapper function to resume the cleaning process
     * @since 0.6.2
     */
    resume() {
        this.run('Resume');
    }

    /**
     * This is a wrapper function to play a sound
     * @param {number} soundID
     * @since 0.6.2
     */
    playSound(soundID = 0) {
        this.run("PlaySound", soundID);
    }

    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command, ...args) {
        let cmdToRun = command;
        if (this.is950type_V2() && !command.endsWith('_V2')) {
            const command_v2 = command + '_V2';
            if (COMMAND_REGISTRY[command_v2]) {
                cmdToRun = command_v2;
            }
        }

        const key = cmdToRun;
        // Registry-based lookup for trivial commands
        const entry = COMMAND_REGISTRY[key];
        if (entry && !entry.specialLogic) {
            const cmdArgs = entry.fixedArgs || args;
            if (entry.minArgs && args.length < entry.minArgs) {
                return false;
            }
            this.ecovacs.sendCommand(new VacBotCommand[entry.className](...cmdArgs));
            return true;
        }

        // Delegate special logic
        return this.dispatcher.dispatch(key.toLowerCase(), ...args);
    }

    /**
     * Get the name of the spot area that the bot is currently in
     * @param {string} currentSpotAreaID - the ID of the spot area that the player is currently in
     * @returns {string} the name of the current spot area
     */
    getSpotAreaName(currentSpotAreaID) {
        return this.mapManager.getSpotAreaName(currentSpotAreaID);
    }

    /**
     * Get the translated name of a spot area
     * @param {string} name - The name of the area
     * @param {string} [languageCode=en] - The language code of the language you want the area name in
     * @returns {string} The area name in the language specified
     */
    getAreaName_i18n(name, languageCode = 'en') {
        return i18n.getSpotAreaName(name, languageCode);
    }

    /**
     * @deprecated
     */
    connect_and_wait_until_ready() {
        this.connect();
    }

    /**
     * Connect to the robot
     */
    connect() {
        this.ecovacs.connect();
    }

    on(name, func) {
        this.ecovacs.on(name, func);
    }

    once(name, func) {
        this.ecovacs.once(name, func);
    }

    /**
     * If the value of `company` is `eco-ng`
     * the model uses MQTT as protocol
     * @returns {boolean}
     */
    useMqttProtocol() {
        return (this.vacuum['company'] === 'eco-ng');
    }

    /**
     * Returns the protocol that is used
     * @returns {string} `MQTT` or `XMPP`
     */
    getProtocol() {
        return this.useMqttProtocol() ? 'MQTT' : 'XMPP';
    }

    /**
     * Returns true if the model is 950 type (MQTT/JSON)
     * e.g. Deebot OZMO 920, Deebot OZMO 950, Deebot T9 series
     * If the model is not registered,
     * it returns the default value (= is MQTT model)
     * @returns {boolean}
     */
    is950type() {
        if (this.is950type_V2()) {
            return true;
        }
        const defaultValue = this.useMqttProtocol();
        return this.getDeviceProperty('950type', defaultValue);
    }

    /**
     * Returns true if V2 commands are implemented (newer 950 type models)
     * e.g. Deebot T8, T9, T10, T20, X1, X2 series
     * If the model is not registered, it returns false
     * @returns {boolean}
     */
    is950type_V2() {
        return this.getDeviceProperty('950type_V2', false);
    }

    /**
     * Returns true if the model is not 950 type (XMPP/XML or MQTT/XML)
     * e.g. Deebot OZMO 930, Deebot 900/901, Deebot Slim 2
     * @returns {boolean}
     */
    isNot950type() {
        return (!this.is950type());
    }

    /**
     * Returns true if V2 commands are not implemented
     * e.g. Deebot OZMO 920/950 and all older models
     * @returns {boolean}
     */
    isNot950type_V2() {
        return (!this.is950type_V2());
    }

    /**
     * Returns true if the model is a fully supported model
     * @returns {boolean}
     */
    isFullySupportedModel() {
        return tools.isSupportedDevice(this.deviceClass);
    }

    /**
     * @deprecated
     * Returns true if the model is a supported model
     * @returns {boolean}
     */
    isSupportedDevice() {
        return tools.isSupportedDevice(this.deviceClass);
    }

    /**
     * Returns true if the model is a known model
     * @returns {boolean}
     */
    isKnownModel() {
        return this.isKnownDevice();
    }

    /**
     * @deprecated
     * Returns true if the model is a known model
     * @returns {boolean}
     */
    isKnownDevice() {
        return tools.isKnownDevice(this.deviceClass);
    }

    /**
     * Returns true if the model is a legacy model
     * @returns {boolean}
     */
    isLegacyModel() {
        return tools.isLegacyModel(this.deviceClass);
    }

    /**
     * Returns the type of the model
     * @returns {String}
     */
    getModelType() {
        return this.capabilityManager.getModelType();
    }

    isModelTypeN8() {
        return this.capabilityManager.isModelTypeN8();
    }

    isModelTypeT8() {
        return this.capabilityManager.isModelTypeT8();
    }

    isModelTypeT9() {
        return this.capabilityManager.isModelTypeT9();
    }

    isModelTypeT10() {
        return this.capabilityManager.isModelTypeT10();
    }

    isModelTypeT20() {
        return this.capabilityManager.isModelTypeT20();
    }

    isModelTypeX1() {
        return this.capabilityManager.isModelTypeX1();
    }

    isModelTypeX2() {
        return this.capabilityManager.isModelTypeX2();
    }

    isModelTypeAirbot() {
        return this.capabilityManager.isModelTypeAirbot();
    }

    isModelTypeT8Based() {
        return this.capabilityManager.isModelTypeT8Based();
    }

    isModelTypeT9Based() {
        return this.capabilityManager.isModelTypeT9Based();
    }

    /**
     * Get the value of the given property for the device class
     * @param {string} property - The property to get
     * @param {any} [defaultValue=false] - The default value to return if the property is not found
     * @returns {any} The value of the property
     */
    getDeviceProperty(property, defaultValue = false) {
        return this.capabilityManager.getDeviceProperty(property, defaultValue);
    }

    /**
     * Returns true if the model has a filter
     * @returns {boolean}
     */
    hasFilter() {
        return this.capabilityManager.hasFilter();
    }

    /**
     * Returns true if the model has a main brush
     * @returns {boolean}
     */
    hasMainBrush() {
        return this.capabilityManager.hasMainBrush();
    }

    /**
     * Returns true if the model has a side brush
     * @returns {boolean}
     */
    hasSideBrush() {
        return this.capabilityManager.hasSideBrush();
    }

    /**
     * Returns true if you can retrieve information about "unit care" (life span)
     * @returns {boolean}
     */
    hasUnitCareInfo() {
        return this.capabilityManager.hasUnitCareInfo();
    }

    /**
     * Returns true if you can retrieve information about "round mop" (life span)
     * @returns {boolean}
     */
    hasRoundMopInfo() {
        return this.capabilityManager.hasRoundMopInfo();
    }

    /**
     * Returns true if you can retrieve information about "air freshener" (life span)
     * @returns {boolean}
     */
    hasAirFreshenerInfo() {
        return this.capabilityManager.hasAirFreshenerInfo();
    }

    /**
     * Returns true if the model has Edge cleaning mode
     * It is assumed that a model can have either an Edge or Spot Area mode
     * @returns {boolean}
     */
    hasEdgeCleaningMode() {
        return this.capabilityManager.hasEdgeCleaningMode();
    }

    /**
     * Returns true if the model has Spot cleaning mode
     * It is assumed that a model can have either a Spot or Spot Area mode
     * @returns {boolean}
     */
    hasSpotCleaningMode() {
        return this.capabilityManager.hasSpotCleaningMode();
    }

    /**
     * @deprecated - please use `hasSpotAreaCleaningMode()` instead
     */
    hasSpotAreas() {
        return this.capabilityManager.hasSpotAreas();
    }

    /**
     * Returns true if the model has Spot Area cleaning mode
     * @returns {boolean}
     */
    hasSpotAreaCleaningMode() {
        return this.capabilityManager.hasSpotAreaCleaningMode();
    }

    /**
     * @deprecated - please use `hasCustomAreaCleaningMode()` instead
     */
    hasCustomAreas() {
        return this.capabilityManager.hasCustomAreas();
    }

    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasCustomAreaCleaningMode() {
        return this.capabilityManager.hasCustomAreaCleaningMode();
    }

    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasMappingCapabilities() {
        return this.capabilityManager.hasMappingCapabilities();
    }

    /**
     * Returns true if the model has mopping functionality
     * @returns {boolean}
     */
    hasMoppingSystem() {
        return this.capabilityManager.hasMoppingSystem();
    }

    /**
     * Returns true if the model has air drying functionality
     * @returns {boolean}
     */
    hasAirDrying() {
        return this.capabilityManager.hasAirDrying();
    }

    /**
     * Returns true if the model has power adjustment functionality
     * @returns {boolean}
     */
    hasVacuumPowerAdjustment() {
        return this.capabilityManager.hasVacuumPowerAdjustment();
    }

    /**
     * Returns true if the model has voice report functionality
     * @returns {boolean}
     */
    hasVoiceReports() {
        return this.capabilityManager.hasVoiceReports();
    }

    /**
     * Returns true if the model has an auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStation() {
        return this.capabilityManager.hasAutoEmptyStation();
    }

    /**
     * Returns true if the model supports map images
     * @returns {boolean}
     */
    isMapImageSupported() {
        return this.capabilityManager.isMapImageSupported();
    }

    /**
     * Get the nickname of the vacuum
     * @returns {string} the nickname
     */
    getName() {
        return this.getNickname();
    }

    /**
     * Get the nickname of the vacuum, if it exists, otherwise get the product name
     * @returns {string} the nickname, if it has one, or the product name
     */
    getNickname() {
        return this.vacuum['nick'] || this.getProductName();
    }

    /**
     * Get the product name of the device
     * @returns {string} the product name
     */
    getProductName() {
        return this.vacuum['deviceName'] || this.getModelName();
    }

    /**
     * Get the model name of the device
     * @returns {string} the model name
     */
    getModelName() {
        return this.getDeviceProperty('name', 'unknown');
    }

    /**
     * Get the product image URL of the image of the product
     * @returns {string} the URL
     */
    getProductImageURL() {
        return this.vacuum['icon'];
    }

    /**
     * Disconnect from MQTT server (fully async)
     */
    async disconnectAsync() {
        try {
            await this.ecovacs.disconnect();
            this.is_ready = false;
        } catch (e) {
            tools.envLogError(`error disconnecting: ${e.message}`);
        }
    }

    /**
     * Disconnect from MQTT server
     */
    disconnect() {
        (async () => {
            await this.disconnectAsync();
        })();
    }

    async callCleanResultsLogsApi() {
        return await this.historyManager.callCleanResultsLogsApi();
    }

    getCryptoHashStringForSecuredContent() {
        return this.historyManager.getCryptoHashStringForSecuredContent();
    }

    async downloadSecuredContent(url, targetFilename) {
        return await this.historyManager.downloadSecuredContent(url, targetFilename);
    }
    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload) {
        this.stateManager.handleCleanInfo(payload);
    }

    /**
     * Handle the payload of the `StationState` response/message
     * @param {Object} payload
     */
    handleStationState(payload) {
        this.stateManager.handleStationState(payload);
    }

    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload) {
        this.stateManager.handleStationInfo(payload);
    }

    /**
     * Handle the payload of the `WashInterval` response/message
     * @param {Object} payload
     */
    handleWashInterval(payload) {
        this.stateManager.handleWashInterval(payload);
    }


    /**
     * Handle the payload of the `WashInfo` response/message
     * @param {Object} payload
     */
    handleWashInfo(payload) {
        this.stateManager.handleWashInfo(payload);
    }

    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload) {
        this.stateManager.handleBattery(payload);
    }

    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload) {
        this.maintenanceManager.handleLifespan(payload);
    }

    /**
     * Handle the payload of the `Pos` response/message
     * (vacuum position and charger resp. charge position)
     * @param {Object} payload
     */
    handlePos(payload) {
        this.stateManager.handlePos(payload);
    }

    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload) {
        this.stateManager.handleEvt(payload);
    }

    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload) {
        this.stateManager.handleSpeed(payload);
    }

    /**
     * Handle the payload of the `NetInfo` response/message
     * (network addresses and Wi-Fi status)
     * @param {Object} payload
     */
    handleNetInfo(payload) {
        this.stateManager.handleNetInfo(payload);
    }

    handleClearMap(payload) {
        tools.envLogInfo(`ClearMap response: ${JSON.stringify(payload)}`);
    }

    handleBorderSwitch(payload) {
        this.stateManager.handleBorderSwitch(payload);
    }

    handleCrossMapBorderWarning(payload) {
        this.stateManager.handleCrossMapBorderWarning(payload);
    }

    handleCutDirection(payload) {
        this.stateManager.handleCutDirection(payload);
    }

    handleMoveupWarning(payload) {
        this.stateManager.handleMoveupWarning(payload);
    }

    handleSafeProtect(payload) {
        this.stateManager.handleSafeProtect(payload);
    }

    handleWorkState(payload) {
        this.stateManager.handleWorkState(payload);
    }

    handleStationAction(payload) {
        tools.envLogInfo(`StationAction response: ${JSON.stringify(payload)}`);
    }

    /**
     * Handle the payload of the `WaterInfo` response/message
     * (water level and water box status)
     * @param {Object} payload
     */
    handleWaterInfo(payload) {
        this.stateManager.handleWaterInfo(payload);
    }

    /**
     * Handle the payload of the `AICleanItemState` response/message
     * Particle Removal and Pet Poop Avoidance mode (e.g. X1)
     * @param {Object} payload
     */
    handleAICleanItemState(payload) {
        this.stateManager.handleAICleanItemState(payload);
    }

    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload) {
        this.stateManager.handleAirDryingState(payload);
    }

    handleDryingDuration(payload) {
        this.stateManager.handleDryingDuration(payload);
    }

    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload) {
        this.stateManager.handleBorderSpin(payload);
    }

    /**
     * Handle the payload of the `WorkMode` response/message
     * ('Work Mode', 'Cleaning Mode')
     * vacuum and mop = 0
     * vacuum only = 1
     * mop only = 2
     * mop after vacuum = 3
     * @param {Object} payload
     */
    handleWorkMode(payload) {
        this.stateManager.handleWorkMode(payload);
    }

    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload) {
        this.stateManager.handleCustomAreaMode(payload);
    }

    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload) {
        this.stateManager.handleSweepMode(payload);
    }

    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload) {
        this.stateManager.handleChargeState(payload);
    }

    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload) {
        this.stateManager.handleSleepStatus(payload);
    }

    /**
     * Handle the payload of the `MapState` response/message
     * @param {Object} payload
     */
    handleMapState(payload) {
        this.mapManager.handleMapState(payload);
    }

    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload) {
        this.mapManager.handleMultiMapState(payload);
    }

    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload) {
        this.stateManager.handleCleanLogs(payload);
    }

    /**
     * Emit all CleanLog-related events.
     * Consolidates the emit logic for both code paths
     * (MQTT response via `lg/log.do` and REST API via `dln/api/log/clean_result/list`)
     */
    emitCleanLogEvents() {
        this.stateManager.emitCleanLogEvents();
    }

    /**
     * Handle the payload of the `TotalStats` response/message
     * @param {Object} payload
     */
    handleTotalStats(payload) {
        this.stateManager.handleTotalStats(payload);
    }

    /**
     * Handle the payload of the `RelocationState` response/message
     * @param {Object} payload
     */
    handleRelocationState(payload) {
        this.stateManager.handleRelocationState(payload);
    }

    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload) {
        this.stateManager.handleVolume(payload);
    }

    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload) {
        this.stateManager.handleBreakPoint(payload);
    }

    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload) {
        this.stateManager.handleBlock(payload);
    }

    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload) {
        this.stateManager.handleAutoEmpty(payload);
    }

    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload) {
        this.stateManager.handleAdvancedMode(payload);
    }

    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload) {
        this.stateManager.handleTrueDetect(payload);
    }

    handleRecognization(payload) {
        this.stateManager.handleRecognization(payload);
    }

    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload) {
        this.stateManager.handleCleanCount(payload);
    }

    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload) {
        this.stateManager.handleDusterRemind(payload);
    }

    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * 'Auto-Boost Suction'
     * @param {Object} payload
     */
    handleCarpetPressure(payload) {
        this.stateManager.handleCarpetPressure(payload);
    }

    /**
     * Handle the payload of the 'CarpetInfo' response/message
     * 'Carpet cleaning strategy'
     * @param {Object} payload
     */
    handleCarpetInfo(payload) {
        this.stateManager.handleCarpetInfo(payload);
    }

    handleCleanPreference(payload) {
        this.stateManager.handleCleanPreference(payload);
    }

    handleLiveLaunchPwdState(payload) {
        this.stateManager.handleLiveLaunchPwdState(payload);
    }

    handleWiFiList(payload) {
        this.stateManager.handleWiFiList(payload);
    }

    handleOverTheAirUpdate(payload) {
        this.stateManager.handleOverTheAirUpdate(payload);
    }

    handleTimeZone(payload) {
        this.stateManager.handleTimeZone(payload);
    }

    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload) {
        this.stateManager.handleStats(payload);
    }

    /**
     * Handle the payload of the 'Sched' response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload) {
        this.stateManager.handleSched(payload);
    }

    /**
     * Handle the payload of the 'QuickCommand' response/message
     * @param {Object} payload - The payload containing the customized scenario cleaning.
     */
    handleQuickCommand(payload) {
        this.stateManager.handleQuickCommand(payload);
    }

    handleCachedMapInfo(payload) {
        return this.mapManager.handleCachedMapInfo(payload);
    }

    handleMapInfoV2(payload) {
        return this.mapManager.handleMapInfoV2(payload);
    }

    handleMapInfoV2_Yeedi(payload) {
        return this.mapManager.handleMapInfoV2_Yeedi(payload);
    }

    handleMapSet(payload) {
        return this.mapManager.handleMapSet(payload);
    }

    async handleMapSubset(payload) {
        return await this.mapManager.handleMapSubset(payload);
    }

    async handleMapSet_V2(payload) {
        return await this.mapManager.handleMapSet_V2(payload);
    }

    async handleMapImage(payload) {
        return await this.mapManager.handleMapImage(payload);
    }

    handleMajorMap(payload) {
        return this.mapManager.handleMajorMap(payload);
    }

    async handleMinorMap(payload) {
        return await this.mapManager.handleMinorMap(payload);
    }

    async handleMapTrace(payload) {
        return await this.mapManager.handleMapTrace(payload);
    }

    /**
     * Handle the payload of the 'Error' response/message
     * @param {Object} payload
     */
    handleResponseError(payload) {
        this.stateManager.handleResponseError(payload);
    }

    /**
     * Handles the air quality data received from the payload.
     * 'Indoor' Air Quality
     * @param {object} payload - The air quality data payload.
     */
    handleAirQuality(payload) {
        this.stateManager.handleAirQuality(payload);
    }

    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * @param {Object} payload
     */
    handleMonitorAirState(payload) {
        this.stateManager.handleMonitorAirState(payload);
    }

    /**
     * Handle the payload of the 'AngleFollow' response/message
     * 'Face to Me' option
     * @param {Object} payload
     */
    handleAngleFollow(payload) {
        this.stateManager.handleAngleFollow(payload);
    }

    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload) {
        this.stateManager.handleAngleWakeup(payload);
    }

    /**
     * Handle the payload of the 'Mic' response/message
     * 'Microphone'
     * @param {Object} payload
     */
    handleMic(payload) {
        this.stateManager.handleMic(payload);
    }

    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * 'Working Status Voice Report'
     * @param {Object} payload
     */
    handleVoiceSimple(payload) {
        this.stateManager.handleVoiceSimple(payload);
    }

    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload) {
        this.stateManager.handleDrivingWheel(payload);
    }

    /**
     * Handle the payload of the 'ChildLock' response/message
     * 'Child Lock'
     * @param {Object} payload
     */
    handleChildLock(payload) {
        this.stateManager.handleChildLock(payload);
    }

    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * 'YIKO Voice Assistant'
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload) {
        this.stateManager.handleVoiceAssistantState(payload);
    }

    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * 'Lab Features' => 'Follow Me'
     * @param {Object} payload
     */
    handleHumanoidFollow(payload) {
        this.stateManager.handleHumanoidFollow(payload);
    }

    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * 'Self-linked Purification'
     * @param {Object} payload
     */
    handleAutonomousClean(payload) {
        this.stateManager.handleAutonomousClean(payload);
    }

    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * 'Linked Purification' (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload) {
        this.stateManager.handleAirbotAutoModel(payload);
    }

    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * 'Bluetooth Speaker'
     * @param {Object} payload
     */
    handleBlueSpeaker(payload) {
        this.stateManager.handleBlueSpeaker(payload);
    }

    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload) {
        this.stateManager.handleEfficiency(payload);
    }

    /**
     * Handle the payload of the 'AtmoLight' response/message
     * 'Light Brightness'
     * @param {Object} payload
     */
    handleAtmoLight(payload) {
        this.stateManager.handleAtmoLight(payload);
    }

    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * 'Volume'
     * @param {Object} payload
     */
    handleAtmoVolume(payload) {
        this.stateManager.handleAtmoVolume(payload);
    }

    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload) {
        this.stateManager.handleThreeModule(payload);
    }

    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload) {
        this.stateManager.handleThreeModuleStatus(payload);
    }

    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload) {
        this.stateManager.handleAreaPoint(payload);
    }

    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload) {
        this.stateManager.handleAiBlockPlate(payload);
    }

    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload) {
        this.stateManager.handleSysinfo(payload);
    }

    handleTask(type, payload) {
        this.stateManager.handleTask(type, payload);
    }

    handleDModule(payload) {
        this.stateManager.handleDModule(payload);
    }

    getCmdForObstacleDetection() {
        return this.stateManager.getCmdForObstacleDetection();
    }
}

for (const [manager, props] of Object.entries(PROXY_MAPPINGS)) {
    for (const prop of props) {
        Object.defineProperty(VacBot.prototype, prop, {
            get() {
                return this[manager] ? this[manager][prop] : undefined;
            },
            set(val) {
                if (this[manager]) {
                    this[manager][prop] = val;
                }
            },
            enumerable: true,
            configurable: true
        });
    }
}

module.exports = VacBot;
