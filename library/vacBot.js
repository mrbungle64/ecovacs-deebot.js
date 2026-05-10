'use strict';

const tools = require('./tools');
const VacBotCommand = require('./command');
const CommandDispatcher = require('./commandDispatcher');
const MapManager = require('./mapManager');
const i18n = require('./i18n');
const map = require('./mapInfo');
const { errorCodes } = require('./errorCodes.json');
const constants = require("./constants");
const crypto = require("crypto");
const querystring = require("node:querystring");
const axios = require('axios').default;
const dictionary = require('./dictionary');
const mapTools = require('./mapTools');
const mapTemplate = require('./mapTemplate');
const { eventCodes } = require('./eventCodes.json');
const COMMAND_REGISTRY = require('./commandRegistry');

const HANDLE_LIVE_MAP = false;
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
        this.components = {};
        this.lastComponentValues = {};
        this.emitFullLifeSpanEvent = false;

        this.errorCode = '0';
        this.errorDescription = errorCodes[this.errorCode];

        this.batteryLevel = null;
        this.batteryIsLow = false;
        this.cleanReport = null;
        this.chargeStatus = null;
        this.chargeMode = null;
        this.cleanSpeed = null;
        this.waterLevel = null;
        this.waterboxInfo = null;
        this.moppingType = null;
        this.scrubbingType = null;
        this.sleepStatus = null;

        this.deebotPosition = {
            x: null,
            y: null,
            a: null,
            isInvalid: false,
            currentSpotAreaID: 'unknown',
            currentSpotAreaName: 'unknown',
            changeFlag: false
        };
        this.chargePosition = {
            x: null,
            y: null,
            a: null,
            changeFlag: false
        };

        this.cleanSum_totalSquareMeters = null;
        this.cleanSum_totalSeconds = null;
        this.cleanSum_totalNumber = null;

        this.cleanLog = [];
        this.cleanLog_lastImageUrl = null;
        this.cleanLog_lastTimestamp = null;
        this.cleanLog_lastTotalTime = null;
        this.cleanLog_lastTotalTimeString = null;
        this.cleanLog_lastSquareMeters = null;

        this.currentStats = {
            'cleanedArea': null,
            'cleanedSeconds': null,
            'cleanType': null
        };

        this.netInfoIP = null;
        this.netInfoWifiSSID = null;
        this.netInfoWifiSignal = null;
        this.netInfoMAC = null;

        this.firmwareVersion = null;
        this.timezone = null;
        this.OTA = null;
        this.sysinfo = null;

        this.stationState = null;
        this.stationInfo = null;
        this.washInterval = null;
        this.washInfo = null;

        this.advancedMode = null;
        this.autoEmpty = null;
        this.autoEmptyStatus = null;
        this.cleanCount = null;
        this.cleanPreference = null;
        this.workMode = null;
        this.workState = null;
        this.sweepMode = null;
        this.mopOnlyMode = null;
        this.borderSpin = null;
        this.borderSwitch = null;
        this.dusterRemind = null;
        this.carpetPressure = null;
        this.carpetInfo = null;
        this.block = null;
        this.blockTime = null;
        this.breakPoint = null;
        this.volume = null;
        this.voiceSimple = null;
        this.voiceAssistantState = null;

        this.trueDetect = null;
        this.avoidedObstacles = 0;
        this.obstacleTypes = null;
        this.aiCleanItemState = null;

        this.crossMapBorderWarning = null;
        this.cutDirection = null;
        this.moveupWarning = null;
        this.safeProtect = null;

        this.evt = null;
        this.currentTask = {
            'type': 'none',
            'triggerType': 'none',
            'failed': false,
            'stopReason': 'none'
        };
        this.liveLaunchPwdState = null;

        this.airQuality = null;
        this.aiBlockPlate = null;
        this.airbotAutoModel = null;
        this.angleFollow = null;
        this.angleWakeup = null;
        this.atmoLightIntensity = null;
        this.atmoVolume = null;
        this.areaPoint = null;
        this.autonomousClean = null;
        this.bluetoothSpeaker = null;
        this.childLock = null;
        this.humanoidFollow = null;
        this.mic = null;
        this.monitorAirState = null;
        this.threeModule = null;
        this.threeModuleStatus = null;
        this.dmodule = null;
        this.efficiency = null;

        this.commandsSent = [];
        this.mapPiecePacketsSent = [];

        this.schedule = [];

        this.genericCommand = null;

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

        this.ecovacs.on('ready', () => {
            tools.envLogInfo(`[VacBot] Ready event!`);
            this.is_ready = true;
        });
    }

    get maps() { return this.mapManager.maps; }
    get mapImages() { return this.mapManager.mapImages; }
    get mapVirtualBoundaries() { return this.mapManager.mapVirtualBoundaries; }
    get mapVirtualBoundariesResponses() { return this.mapManager.mapVirtualBoundariesResponses; }
    get mapSpotAreaInfos() { return this.mapManager.mapSpotAreaInfos; }
    get mapVirtualBoundaryInfos() { return this.mapManager.mapVirtualBoundaryInfos; }
    get currentMapName() { return this.mapManager.currentMapName; }
    get currentMapMID() { return this.mapManager.currentMapMID; }
    get currentMapIndex() { return this.mapManager.currentMapIndex; }
    get currentCustomAreaValues() { return this.mapManager.currentCustomAreaValues; }
    get currentSpotAreas() { return this.mapManager.currentSpotAreas; }
    get createMapDataObject() { return this.mapManager.createMapDataObject; }
    get createMapImage() { return this.mapManager.createMapImage; }
    get createMapImageOnly() { return this.mapManager.createMapImageOnly; }
    get mapDataObject() { return this.mapManager.mapDataObject; }
    get mapDataObjectQueue() { return this.mapManager.mapDataObjectQueue; }
    get mapImageDataQueue() { return this.mapManager.mapImageDataQueue; }
    get mapState() { return this.mapManager.mapState; }
    get multiMapState() { return this.mapManager.multiMapState; }
    get mapSet_V2() { return this.mapManager.mapSet_V2; }
    get liveMapImage() { return this.mapManager.liveMapImage; }

    set maps(val) { this.mapManager.maps = val; }
    set mapImages(val) { this.mapManager.mapImages = val; }
    set mapVirtualBoundaries(val) { this.mapManager.mapVirtualBoundaries = val; }
    set mapVirtualBoundariesResponses(val) { this.mapManager.mapVirtualBoundariesResponses = val; }
    set mapSpotAreaInfos(val) { this.mapManager.mapSpotAreaInfos = val; }
    set mapVirtualBoundaryInfos(val) { this.mapManager.mapVirtualBoundaryInfos = val; }
    set currentMapName(val) { this.mapManager.currentMapName = val; }
    set currentMapMID(val) { this.mapManager.currentMapMID = val; }
    set currentMapIndex(val) { this.mapManager.currentMapIndex = val; }
    set currentCustomAreaValues(val) { this.mapManager.currentCustomAreaValues = val; }
    set currentSpotAreas(val) { this.mapManager.currentSpotAreas = val; }
    set createMapDataObject(val) { this.mapManager.createMapDataObject = val; }
    set createMapImage(val) { this.mapManager.createMapImage = val; }
    set createMapImageOnly(val) { this.mapManager.createMapImageOnly = val; }
    set mapDataObject(val) { this.mapManager.mapDataObject = val; }
    set mapDataObjectQueue(val) { this.mapManager.mapDataObjectQueue = val; }
    set mapImageDataQueue(val) { this.mapManager.mapImageDataQueue = val; }
    set mapState(val) { this.mapManager.mapState = val; }
    set multiMapState(val) { this.mapManager.multiMapState = val; }
    set mapSet_V2(val) { this.mapManager.mapSet_V2 = val; }
    set liveMapImage(val) { this.mapManager.liveMapImage = val; }

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
        const key = command;
        // Registry-based lookup for trivial commands
        const entry = COMMAND_REGISTRY[key];
        if (entry && !entry.specialLogic) {
            const cmdArgs = entry.fixedArgs || args;
            if (entry.minArgs && args.length < entry.minArgs) {
                return false;
            }
            this.ecovacs.sendCommand(new VacBotCommand[entry.cmd](...cmdArgs));
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
        return tools.getModelType(this.deviceClass);
    }

    isModelTypeN8() {
        return this.getModelType() === 'N8';
    }

    isModelTypeT8() {
        return this.getModelType() === 'T8';
    }

    isModelTypeT9() {
        return this.getModelType() === 'T9';
    }

    isModelTypeT10() {
        return this.getModelType() === 'T10';
    }

    isModelTypeT20() {
        return this.getModelType() === 'T20';
    }

    isModelTypeX1() {
        return this.getModelType() === 'X1';
    }

    isModelTypeX2() {
        return this.getModelType() === 'X2';
    }

    isModelTypeAirbot() {
        return this.getModelType() === 'airbot';
    }

    isModelTypeT8Based() {
        return this.isModelTypeT8() || this.isModelTypeN8();
    }

    isModelTypeT9Based() {
        return this.isModelTypeT9() || this.isModelTypeT10() || this.isModelTypeT20() || this.isModelTypeX1() || this.isModelTypeX2();
    }

    /**
     * Get the value of the given property for the device class
     * @param {string} property - The property to get
     * @param {any} [defaultValue=false] - The default value to return if the property is not found
     * @returns {any} The value of the property
     */
    getDeviceProperty(property, defaultValue = false) {
        return tools.getDeviceProperty(this.deviceClass, property, defaultValue);
    }

    /**
     * Returns true if the model has a filter
     * @returns {boolean}
     */
    hasFilter() {
        return this.getDeviceProperty('filter');
    }

    /**
     * Returns true if the model has a main brush
     * @returns {boolean}
     */
    hasMainBrush() {
        return this.getDeviceProperty('main_brush');
    }

    /**
     * Returns true if the model has a side brush
     * @returns {boolean}
     */
    hasSideBrush() {
        return this.getDeviceProperty('side_brush');
    }

    /**
     * Returns true if you can retrieve information about "unit care" (life span)
     * @returns {boolean}
     */
    hasUnitCareInfo() {
        return this.getDeviceProperty('unit_care_info');
    }

    /**
     * Returns true if you can retrieve information about "round mop" (life span)
     * @returns {boolean}
     */
    hasRoundMopInfo() {
        return this.getDeviceProperty('round_mop_info');
    }

    /**
     * Returns true if you can retrieve information about "air freshener" (life span)
     * @returns {boolean}
     */
    hasAirFreshenerInfo() {
        return this.getDeviceProperty('air_freshener_info');
    }

    /**
     * Returns true if the model has Edge cleaning mode
     * It is assumed that a model can have either an Edge or Spot Area mode
     * @returns {boolean}
     */
    hasEdgeCleaningMode() {
        return (!this.hasSpotAreaCleaningMode());
    }

    /**
     * Returns true if the model has Spot cleaning mode
     * It is assumed that a model can have either a Spot or Spot Area mode
     * @returns {boolean}
     */
    hasSpotCleaningMode() {
        return (!this.hasSpotAreaCleaningMode());
    }

    /**
     * @deprecated - please use `hasSpotAreaCleaningMode()` instead
     */
    hasSpotAreas() {
        return this.hasSpotAreaCleaningMode();
    }

    /**
     * Returns true if the model has Spot Area cleaning mode
     * @returns {boolean}
     */
    hasSpotAreaCleaningMode() {
        return this.getDeviceProperty('spot_area');
    }

    /**
     * @deprecated - please use `hasCustomAreaCleaningMode()` instead
     */
    hasCustomAreas() {
        return this.hasCustomAreaCleaningMode();
    }

    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasCustomAreaCleaningMode() {
        return this.getDeviceProperty('custom_area');
    }

    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasMappingCapabilities() {
        return this.hasSpotAreaCleaningMode() && this.hasCustomAreaCleaningMode();
    }

    /**
     * Returns true if the model has mopping functionality
     * @returns {boolean}
     */
    hasMoppingSystem() {
        return this.getDeviceProperty('mopping_system');
    }

    /**
     * Returns true if the model has air drying functionality
     * @returns {boolean}
     */
    hasAirDrying() {
        return this.getDeviceProperty('air_drying');
    }

    /**
     * Returns true if the model has power adjustment functionality
     * @returns {boolean}
     */
    hasVacuumPowerAdjustment() {
        return this.getDeviceProperty('clean_speed');
    }

    /**
     * Returns true if the model has voice report functionality
     * @returns {boolean}
     */
    hasVoiceReports() {
        return this.getDeviceProperty('voice_report');
    }

    /**
     * Returns true if the model has an auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStation() {
        return this.getDeviceProperty('auto_empty_station');
    }

    /**
     * Returns true if the model supports map images
     * @returns {boolean}
     */
    isMapImageSupported() {
        return this.getDeviceProperty('map_image_supported');
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
        let portalPath = constants.APP_ECOUSER_API;
        if (this.country === 'CN') {
            portalPath = constants.APP_ECOUSER_API;
        }

        portalPath = tools.formatString(portalPath, { continent: this.continent });
        if (this.country === 'CN') {
            portalPath = portalPath.replace('.com', '.cn');
        }
        portalPath = portalPath + '/dln/api/log/clean_result/list?';

        let auth = {
            "realm": constants.REALM,
            "with": "users",
            "userid": this.uid,
            "token": this.user_access_token,
            "resource": this.resource
        };

        let ts = Date.now();
        let sign = crypto.createHash('sha256').update(constants.APP_ID + constants.APP_SK + ts.toString()).digest("hex");

        let queryParams = {
            'auth': JSON.stringify(auth),
            'channel': 'google_play',
            'did': this.did,
            'et1': ts,
            'defaultLang': 'EN',
            'logType': 'clean',
            'reqid': '##REQID##',
            'res': this.res,
            'size': 20,
            'version': 'v2'
        };

        let config = {
            headers: {
                'Authorization': 'Bearer ' + this.user_access_token,
                'token': this.user_access_token,
                'appid': 'ecovacs',
                'plat': 'android',
                'userid': this.uid,
                'user-agent': 'EcovacsHome/2.3.7 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)',
                'v': '2.3.7',
                'country': this.country,
                'sign': sign,
                'signType': 'sha256'
            }
        };

        let searchParams = querystring.encode(queryParams);
        tools.envLogInfo(`[EcoVacsAPI] callLogsApi calling ${portalPath}`);
        try {
            const res = await axios.get(portalPath + searchParams, config);
            return res.data;
        } catch (err) {
            tools.envLogInfo(`[EcoVacsAPI] callLogsApi error: ${err}`);
            throw err;
        }
    }

    getCryptoHashStringForSecuredContent() {
        const ts = Date.now();
        return constants.APP_ID + constants.APP_SK + ts.toString();
    }

    async downloadSecuredContent(url, targetFilename) {
        let sign = crypto.createHash('sha256').update(this.getCryptoHashStringForSecuredContent()).digest("hex");

        let headers = {
            'Authorization': 'Bearer ' + this.user_access_token,
            'token': this.user_access_token,
            'appid': 'ecovacs',
            'plat': 'android',
            'userid': this.uid,
            'user-agent': 'EcovacsHome/2.3.7 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)',
            'v': '2.3.7',
            'country': this.country,
            'sign': sign,
            'signType': 'sha256'
        };

        try {
            const res = await axios.get(url, {
                headers,
                responseType: 'arraybuffer'
            });
            const result = res.data;
            const fs = require('fs');
            fs.writeFile(targetFilename, result, err => {
                if (err) {
                    tools.envLogInfo(`[EcoVacsAPI] downloadSecuredContent error: ${err}`);
                }
            });
        } catch (err) {
            tools.envLogInfo(`[EcoVacsAPI] downloadSecuredContent error: ${err}`);
            throw err;
        }
    }
    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload) {
        this.currentSpotAreas = '';
        this.currentCustomAreaValues = '';
        if (payload['state'] === 'clean') {
            let type = payload['cleanState']['type'];
            const content = payload['cleanState']['content'];
            if (typeof content === 'object') {
                type = content['type'];
            }
            if (payload['cleanState']['motionState'] === 'working') {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
            } else {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['cleanState']['motionState']];
            }
            if ((type === 'spotArea') || (type === 'customArea')) {
                let areaValues;
                if (typeof content === `object`) {
                    areaValues = content['value'];
                } else {
                    areaValues = content;
                }
                if (type === 'customArea') {
                    if (typeof content === 'object') {
                        const doNotClean = content['donotClean'];
                        if ((doNotClean === 1) || (areaValues.split(',').length === 2)) {
                            // Controlled via Video Manager
                            this.cleanReport = 'setLocation';
                        }
                    }
                    this.currentCustomAreaValues = areaValues;
                } else if (type === 'spotArea') {
                    this.currentSpotAreas = areaValues;
                }
            }
        } else if (payload['trigger'] === 'alert') {
            this.cleanReport = 'alert';
        } else {
            this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']];
            if (dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']] === 'returning') {
                // set charge state on returning to dock
                const chargeStatus = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']];
                if (chargeStatus) {
                    this.chargeStatus = chargeStatus;
                }
            } else if (dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']] === 'idle') {
                // when clean state = idle the bot can be charging on the dock or the return to dock has been canceled
                // if this is not run, the status when canceling the return stays on 'returning'
                this.run('GetChargeState');
            }
        }
    }

    /**
     * Handle the payload of the `StationState` response/message
     * @param {Object} payload
     */
    handleStationState(payload) {
        let type = 0;
        let state = 0;
        if (payload.hasOwnProperty('content')) {
            type = payload['content']['type'];
        }
        if (payload.hasOwnProperty('state')) {
            state = payload['state'];
        }
        this.stationState = {
            'type': type,
            'state': state,
            'isAirDrying': Boolean((type === 2) && state),
            'isSelfCleaning': Boolean((type === 3) && state),
            'isActive': Boolean(state)
        };
    }

    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload) {
        this.stationInfo = {
            state: payload.state,
            name: payload.name,
            model: payload.model,
            sn: payload.sn,
            wkVer: payload.wkVer
        };
    }

    /**
     * Handle the payload of the `WashInterval` response/message
     * @param {Object} payload
     */
    handleWashInterval(payload) {
        if (payload.hasOwnProperty('interval')) {
            this.washInterval = payload['interval'];
        }
    }


    /**
     * Handle the payload of the `WashInfo` response/message
     * @param {Object} payload
     */
    handleWashInfo(payload) {
        if (payload.hasOwnProperty('mode')) {
            this.washInfo = payload['mode'];
        }
    }

    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload) {
        this.batteryLevel = payload['value'];
        if (payload.hasOwnProperty('isLow')) {
            this.batteryIsLow = !!Number(payload['isLow']);
        } else {
            this.batteryIsLow = (this.batteryLevel <= 15);
        }
    }

    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload) {
        for (let index in payload) {
            if (payload[index]) {
                const type = payload[index][`type`];
                let component = type;
                if (dictionary.COMPONENT_FROM_ECOVACS[type]) {
                    component = dictionary.COMPONENT_FROM_ECOVACS[type];
                } else {
                    tools.envLogWarn(`unknown life span component type: ${type}`);
                    this.ecovacs.emit('Debug', `Unknown life span component type: ${type}`);
                }
                const left = payload[index]['left'];
                const total = payload[index]['total'];
                const lifespan = parseInt(left) / parseInt(total) * 100;
                this.components[component] = Number(lifespan.toFixed(2));
            }
        }
    }

    /**
     * Handle the payload of the `Pos` response/message
     * (vacuum position and charger resp. charge position)
     * @param {Object} payload
     */
    handlePos(payload) {
        // is only available in some DeebotPosition messages (e.g. on start cleaning)
        // there can be more than one charging station only handles first charging station
        const chargePos = payload['chargePos'];
        if (chargePos) {
            // check if position changed
            let changed = (
                chargePos[0]['x'] !== this.chargePosition.x ||
                chargePos[0]['y'] !== this.chargePosition.y ||
                chargePos[0]['a'] !== this.chargePosition.a
            );
            if (changed) {
                this.chargePosition = {
                    x: chargePos[0]['x'],
                    y: chargePos[0]['y'],
                    a: chargePos[0]['a'],
                    changeFlag: true
                };
            }
        }
        // as deebotPos and chargePos can also appear in other messages (CleanReport)
        // the handling should be extracted to a separate function
        const deebotPos = payload['deebotPos'];
        if (typeof deebotPos === 'object') {
            // check if position changed or currentSpotAreaID is 'unknown'
            let changed = (
                deebotPos['x'] !== this.deebotPosition.x ||
                deebotPos['y'] !== this.deebotPosition.y ||
                deebotPos['a'] !== this.deebotPosition.a ||
                deebotPos['invalid'] !== this.deebotPosition.isInvalid ||
                this.deebotPosition.currentSpotAreaID === 'unknown'
            );
            if (changed) {
                const posX = Number(deebotPos['x']);
                const posY = Number(deebotPos['y']);
                let currentSpotAreaID = mapTools.getCurrentSpotAreaID(
                    posX, posY, this.mapSpotAreaInfos[this.currentMapMID]
                );
                let isInvalid = Number(deebotPos['invalid']) === 1;
                let distanceToChargingStation = null;
                if (this.chargePosition) {
                    const pos = deebotPos['x'] + ',' + deebotPos['y'];
                    const chargePos = this.chargePosition.x + ',' + this.chargePosition.y;
                    distanceToChargingStation = mapTools.getDistanceToChargingStation(pos, chargePos);
                }
                this.deebotPosition = {
                    x: deebotPos['x'],
                    y: deebotPos['y'],
                    a: deebotPos['a'],
                    isInvalid: isInvalid,
                    currentSpotAreaID: currentSpotAreaID,
                    currentSpotAreaName: this.getSpotAreaName(currentSpotAreaID),
                    changeFlag: true,
                    distanceToChargingStation: distanceToChargingStation
                };
            }
        }
    }

    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload) {
        const code = payload['code'];
        if (eventCodes.hasOwnProperty(code)) {
            tools.envLogWarn(`Evt code: '${eventCodes[code]}'`);
            this.evt = {
                code: code,
                event: eventCodes[code]
            };
        } else {
            const eventMessage = `Unhandled Evt code: '${code}'`;
            tools.envLogWarn(eventMessage);
            this.evt = {
                code: code,
                event: eventMessage
            };
        }
    }

    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload) {
        const speed = payload['speed'];
        this.cleanSpeed = speed;
        if (!this.isModelTypeAirbot()) {
            this.cleanSpeed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        }
    }

    /**
     * Handle the payload of the `NetInfo` response/message
     * (network addresses and Wi-Fi status)
     * @param {Object} payload
     */
    handleNetInfo(payload) {
        this.netInfoIP = payload['ip'] || payload['wi'];
        this.netInfoWifiSSID = payload['ssid'] || payload['s'];
        this.netInfoWifiSignal = payload['rssi'] || payload['st'];
        this.netInfoMAC = payload['mac'] || payload['wm'];
    }

    handleClearMap(payload) {
        tools.envLogInfo(`ClearMap response: ${JSON.stringify(payload)}`);
    }

    handleBorderSwitch(payload) {
        this.borderSwitch = payload['enable'];
    }

    handleCrossMapBorderWarning(payload) {
        this.crossMapBorderWarning = payload['enable'];
    }

    handleCutDirection(payload) {
        this.cutDirection = payload['angle'];
    }

    handleMoveupWarning(payload) {
        this.moveupWarning = payload['enable'];
    }

    handleSafeProtect(payload) {
        this.safeProtect = payload['enable'];
    }

    handleWorkState(payload) {
        this.workState = {
            robot: payload['robotState'] ? payload['robotState']['state'] : null,
            station: payload['stationState'] ? payload['stationState']['state'] : null,
            paused: Boolean(payload['paused'])
        };
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
        this.waterLevel = payload['amount'];
        this.waterboxInfo = payload['enable'];
        if (payload.hasOwnProperty('type')) {
            // 1 = Regular
            // 2 = OZMO Pro
            this.moppingType = payload['type'];
        }
        if (payload.hasOwnProperty('sweepType')) {
            // Scrubbing pattern
            // 1 = Quick scrubbing
            // 2 = Deep scrubbing
            this.scrubbingType = payload['sweepType'];
        }
    }

    /**
     * Handle the payload of the `AICleanItemState` response/message
     * Particle Removal and Pet Poop Avoidance mode (e.g. X1)
     * @param {Object} payload
     */
    handleAICleanItemState(payload) {
        if (payload.hasOwnProperty('items')) {
            const items = payload.items;
            const particleRemoval = Boolean(items[0].state);
            const petPoopPrevention = Boolean(items[2].state);
            this.aiCleanItemState = {
                items: items,
                particleRemoval: particleRemoval,
                petPoopPrevention: petPoopPrevention
            };
        }
    }

    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload) {
        let airDryingStatus = null;
        const status = parseInt(payload['status']);
        if (status === 1) {
            airDryingStatus = 'airdrying';
        } else if (status === 2) {
            airDryingStatus = 'idle';
        }
        if (airDryingStatus) {
            this.airDryingStatus = airDryingStatus;
        }
    }

    handleDryingDuration(payload) {
        if (payload.hasOwnProperty('duration')) {
            this.dryingDuration = payload['duration'];
        }
    }

    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload) {
        const enable = payload['enable'];
        const type = payload['type']; // The value of type seems to be always 1
        if (type) {
            this.borderSpin = enable;
        }
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
        this.workMode = payload['mode'];
    }

    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload) {
        if (payload.hasOwnProperty('sweepMode')) {
            this.sweepMode = payload['sweepMode'];
        }
    }

    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload) {
        if (payload.hasOwnProperty('type')) {
            this.mopOnlyMode = Boolean(payload['type']);
        }
    }

    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload) {
        this.chargeStatus = 'idle';
        if (parseInt(payload['isCharging']) === 1) {
            this.chargeStatus = 'charging';
        }
        this.chargeMode = 'slot';
        if (payload.hasOwnProperty('mode')) {
            this.chargeMode = payload['mode'];
        }
    }

    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload) {
        this.sleepStatus = payload['enable'];
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
        let logs = [];
        this.cleanLog = [];
        if (payload.hasOwnProperty('logs')) {
            logs = payload['logs'];
        } else if (payload.hasOwnProperty('log')) {
            logs = payload['log'];
        } else if (payload.hasOwnProperty('data')) {
            logs = payload['data'];
        }

        for (let logIndex in logs) {
            if (logs.hasOwnProperty(logIndex)) {
                const logEntry = logs[logIndex];
                if (!this.cleanLog[logEntry['id']]) { //log not yet existing
                    let squareMeters = parseInt(logEntry['area']);
                    let timestamp = Number(logEntry['ts']);
                    let date = new Date(timestamp * 1000);
                    let len = parseInt(logEntry['last']);
                    let totalTimeString = tools.getTimeStringFormatted(len);
                    let imageUrl = logEntry['imageUrl'];
                    if ((this.cleanLog_lastTimestamp < timestamp) || (!this.cleanLog_lastTimestamp)) {
                        this.cleanLog_lastImageUrl = imageUrl;
                        this.cleanLog_lastTimestamp = timestamp;
                        this.cleanLog_lastSquareMeters = squareMeters;
                        this.cleanLog_lastTotalTime = len;
                        this.cleanLog_lastTotalTimeString = totalTimeString;
                    }
                    this.cleanLog[logEntry['id']] = {
                        'squareMeters': squareMeters,
                        'timestamp': timestamp,
                        'date': date,
                        'lastTime': len,
                        'totalTime': len,
                        'totalTimeFormatted': totalTimeString,
                        'imageUrl': imageUrl,
                        'type': logEntry['type'],
                        'stopReason': logEntry['stopReason']
                    };
                }
            }
        }
    }

    /**
     * Emit all CleanLog-related events.
     * Consolidates the emit logic for both code paths
     * (MQTT response via `lg/log.do` and REST API via `dln/api/log/clean_result/list`)
     */
    emitCleanLogEvents() {
        let cleanLog = [];
        for (let i in this.cleanLog) {
            if (this.cleanLog.hasOwnProperty(i)) {
                cleanLog.push(this.cleanLog[i]);
            }
        }
        this.ecovacs.emitMessage('CleanLog', cleanLog);
        this.ecovacs.emitMessage('LastCleanLogs', {
            'timestamp': this.cleanLog_lastTimestamp,
            'squareMeters': this.cleanLog_lastSquareMeters,
            'totalTime': this.cleanLog_lastTotalTime,
            'totalTimeFormatted': this.cleanLog_lastTotalTimeString,
            'imageUrl': this.cleanLog_lastImageUrl
        });
    }

    /**
     * Handle the payload of the `TotalStats` response/message
     * @param {Object} payload
     */
    handleTotalStats(payload) {
        this.cleanSum_totalSquareMeters = parseInt(payload['area']);
        this.cleanSum_totalSeconds = parseInt(payload['time']);
        this.cleanSum_totalNumber = parseInt(payload['count']);
    }

    /**
     * Handle the payload of the `RelocationState` response/message
     * @param {Object} payload
     */
    handleRelocationState(payload) {
        this.relocationStatus = payload;
        this.relocationState = payload['state'];
    }

    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload) {
        this.volume = payload['volume'];
    }

    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload) {
        this.breakPoint = payload['enable'];
    }

    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload) {
        this.block = payload['enable'];
        if (payload.hasOwnProperty('start')) {
            this.blockTime = {
                'from': payload['start'],
                'to': payload['end']
            };
        }
    }

    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload) {
        this.autoEmpty = payload['enable'];
        if (payload.hasOwnProperty('status')) {
            // 0 disabled
            // 1 enabled
            // 2 dust bag not full
            // 5 dust bag need to be changed
            this.autoEmptyStatus = payload['status'];
        }
    }

    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload) {
        this.advancedMode = payload['enable'];
    }

    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload) {
        this.trueDetect = payload['enable'];
    }

    handleRecognization(payload) {
        this.trueDetect = payload['state'];
        if (payload) {
            tools.envLogInfo(`payload for Recognization message: ${JSON.stringify(payload)}`);
        }
    }

    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload) {
        this.cleanCount = payload['count'];
    }

    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload) {
        this.dusterRemind = {
            enabled: payload['enable'],
            period: payload['period']
        };
    }

    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * 'Auto-Boost Suction'
     * @param {Object} payload
     */
    handleCarpetPressure(payload) {
        this.carpetPressure = payload['enable'];
    }

    /**
     * Handle the payload of the 'CarpetInfo' response/message
     * 'Carpet cleaning strategy'
     * @param {Object} payload
     */
    handleCarpetInfo(payload) {
        this.carpetInfo = payload['mode'];
    }

    handleCleanPreference(payload) {
        this.cleanPreference = payload['enable'];
    }

    handleLiveLaunchPwdState(payload) {
        this.liveLaunchPwdState = {
            state: payload.state,
            hasPwd: payload.hasPwd
        };
    }

    handleWiFiList(payload) {
        if (payload.list) {
            tools.envLogInfo('Configured networks:');
            payload.list.forEach((network) => {
                tools.envLogInfo('- ' + network);
            });
        }
        tools.envLogInfo(`mac address: ${payload.mac}`);
    }

    handleOverTheAirUpdate(payload) {
        this.OTA = payload;
        tools.envLogInfo(`ota status: ${JSON.stringify(payload)}`);
    }

    handleTimeZone(payload) {
        this.timezone = 'GMT' + (payload.tzm > 0 ? '+' : '-') + (payload.tzm / 60) + ':00';
    }

    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload) {
        this.currentStats = {
            'cleanedArea': payload['area'],
            'cleanedSeconds': payload['time'],
            'cleanType': payload['type']
        };
        if (payload.hasOwnProperty('avoidCount')) {
            if (this.avoidedObstacles !== payload['avoidCount']) {
                tools.envLogNotice('whoops ... there might be something in the way');
            }
            this.avoidedObstacles = payload['avoidCount'];
        }
        if (payload.hasOwnProperty('aiopen') && Number(payload['aiopen']) === 1) {
            if (JSON.stringify(this.obstacleTypes) !== JSON.stringify(payload['aitypes'])) {
                tools.envLogNotice('whoops ... there might be something new blocking my way');
            }
            this.obstacleTypes = payload['aitypes'];
        }
    }

    /**
     * Handle the payload of the 'Sched' response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload) {
        this.schedule = [];
        for (let c = 0; c < payload.length; c++) {
            const resultData = payload[c];
            if (resultData.repeat !== undefined) {
                let cleanCtl = {
                    'type': 'auto'
                };
                if (resultData.hasOwnProperty('content') && resultData.content.hasOwnProperty('jsonStr')) {
                    const json = JSON.parse(resultData.content.jsonStr);
                    Object.assign(cleanCtl, {
                        'type': json.type
                    });
                    if (cleanCtl.type === 'spotArea') {
                        Object.assign(cleanCtl, {
                            'spotAreas': json.content
                        });
                    }
                }
                const onlyOnce = Number(resultData.repeat) === 0;
                const weekdays = resultData.repeat.split('');
                const weekdaysObj = {
                    'Mon': Boolean(Number(weekdays[1])),
                    'Tue': Boolean(Number(weekdays[2])),
                    'Wed': Boolean(Number(weekdays[3])),
                    'Thu': Boolean(Number(weekdays[4])),
                    'Fri': Boolean(Number(weekdays[5])),
                    'Sat': Boolean(Number(weekdays[6])),
                    'Sun': Boolean(Number(weekdays[0]))
                };
                const object = {
                    'sid': resultData.sid,
                    'cleanCmd': cleanCtl,
                    'content': resultData.content,
                    'enabled': Boolean(Number(resultData.enable)),
                    'onlyOnce': onlyOnce,
                    'weekdays': weekdaysObj,
                    'hour': resultData.hour,
                    'minute': resultData.minute,
                    'mapID': resultData.mid
                };
                this.schedule.push(object);
            }
        }
    }

    /**
     * Handle the payload of the 'QuickCommand' response/message
     * @param {Object} payload - The payload containing the customized scenario cleaning.
     */
    handleQuickCommand(payload) {
        this.customizedScenarioCleaning = payload;
    }

    /**
     * Handle the payload of the 'CachedMapInfo' response/message
     * @param {Object} payload
     */
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
        this.errorCode = payload['code'].toString();
        if (this.errorCode === '') {
            this.errorCode = '-3';
        }
        // known errorCode from library
        if (errorCodes[this.errorCode]) {
            this.errorDescription = errorCodes[this.errorCode];
            // Request error
            if (this.errorCode === '1') {
                this.errorDescription = this.errorDescription + ': ' + payload.error;
            }
        } else {
            this.errorDescription = `unknown errorCode: ${this.errorCode}`;
        }
        if (this.errorCode !== '0') {
            tools.envLogWarn(`errorCode: ${this.errorCode}`);
            tools.envLogWarn(`errorDescription: ${this.errorDescription}`);
        }
    }

    /**
     * Handles the air quality data received from the payload.
     * 'Indoor' Air Quality
     * @param {object} payload - The air quality data payload.
     */
    handleAirQuality(payload) {
        if (!payload['pm25']) {
            // Handle 'onJCYAirQuality' event for Z1 AirQuality Monitor
            const keys = Object.keys(payload);
            payload = payload[keys[0]];
        }
        this.airQuality = {
            'particulateMatter25': payload['pm25'],
            'particulateMatter10': payload['pm10'],
            'airQualityIndex': payload['aq'],
            'volatileOrganicCompounds': payload['voc'],
            'temperature': payload['tem'],
            'humidity': payload['hum']
        };
        // The Z1 AirQuality Monitor also has
        // another 'voc' (Volatile Organic Compounds) value
        if (payload['voc_num'] !== undefined) {
            Object.assign(this.airQuality, {
                'volatileOrganicCompounds_parts': payload['voc_num']
            });
        }
        // Note: There's also has another pm10 value ('pm_10')
        // but it seems that there is no additional benefit
    }

    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * @param {Object} payload
     */
    handleMonitorAirState(payload) {
        this.monitorAirState = payload['on'];
    }

    /**
     * Handle the payload of the 'AngleFollow' response/message
     * 'Face to Me' option
     * @param {Object} payload
     */
    handleAngleFollow(payload) {
        this.angleFollow = payload['on'];
    }

    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload) {
        this.angleWakeup = payload['on'];
    }

    /**
     * Handle the payload of the 'Mic' response/message
     * 'Microphone'
     * @param {Object} payload
     */
    handleMic(payload) {
        this.mic = payload['on'];
    }

    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * 'Working Status Voice Report'
     * @param {Object} payload
     */
    handleVoiceSimple(payload) {
        this.voiceSimple = payload['on'];
    }

    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload) {
        this.drivingWheel = payload['on'];
    }

    /**
     * Handle the payload of the 'ChildLock' response/message
     * 'Child Lock'
     * @param {Object} payload
     */
    handleChildLock(payload) {
        this.childLock = payload['on'];
    }

    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * 'YIKO Voice Assistant'
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload) {
        this.voiceAssistantState = payload['enable'];
    }

    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * 'Lab Features' => 'Follow Me'
     * @param {Object} payload
     */
    handleHumanoidFollow(payload) {
        this.humanoidFollow = {
            'video': payload['video'],
            'yiko': payload['yiko']
        };
    }

    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * 'Self-linked Purification'
     * @param {Object} payload
     */
    handleAutonomousClean(payload) {
        this.autonomousClean = payload['on'];
    }

    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * 'Linked Purification' (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload) {
        if (payload['aq'] && payload['aq']['aqStart'] && payload['aq']['aqEnd']) {
            this.airbotAutoModel = {
                'enable': payload['enable'],
                'trigger': payload['trigger'],
                'aq': {
                    'aqStart': payload['aq']['aqStart'],
                    'aqEnd': payload['aq']['aqEnd']
                }
            };
        }
    }

    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * 'Bluetooth Speaker'
     * @param {Object} payload
     */
    handleBlueSpeaker(payload) {
        this.bluetoothSpeaker = {
            'enable': payload['enable'],
            'time': payload['time'],
            'name': payload['name']
        };
    }

    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload) {
        this.efficiency = payload['efficiency'];
    }

    /**
     * Handle the payload of the 'AtmoLight' response/message
     * 'Light Brightness'
     * @param {Object} payload
     */
    handleAtmoLight(payload) {
        this.atmoLightIntensity = payload['intensity'];
    }

    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * 'Volume'
     * @param {Object} payload
     */
    handleAtmoVolume(payload) {
        this.atmoVolume = payload['volume'];
    }

    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload) {
        this.threeModule = payload;
    }

    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload) {
        this.threeModuleStatus = payload;
    }

    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload) {
        this.areaPoint = payload;
    }

    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload) {
        this.aiBlockPlate = payload['on'];
    }

    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload) {
        try {
            let event = payload[0];
            this.sysinfo = {
                'load': event['uptime'].substring(event['uptime'].indexOf('average') + 9),
                'uptime': event['uptime'].substring(event['uptime'].indexOf('up') + 3).substr(0, event['uptime'].substring(event['uptime'].indexOf('up') + 3).indexOf('users')).substr(0, event['uptime'].substring(event['uptime'].indexOf('up') + 3).substr(0, event['uptime'].substring(event['uptime'].indexOf('up') + 3).indexOf('users')).lastIndexOf(',')),
                'signal': event['signal'],
                'meminfo': event['meminfo'],
                'pos': event['pos']
            };
        } catch (e) {
            tools.envLogWarn(`error handling System information: ${e.toString()}`);
        }
    }

    handleTask(type, payload) {
        const stopReason = this.currentTask.stopReason;
        this.currentTask = {
            'type': type,
            'triggerType': payload.hasOwnProperty('triggerType') ? payload['triggerType'] : 'none',
            'failed': false,
            'stopReason': stopReason
        };
        if (payload.hasOwnProperty('go_fail')) {
            this.currentTask.failed = true;
        }
        if (payload.hasOwnProperty('stopReason')) {
            this.currentTask.stopReason = payload['stopReason'];
        }
    }

    handleDModule(payload) {
        this.dmodule = payload;
    }

    getCmdForObstacleDetection() {
        if ((this.getModelType() === 'T8') || (this.getModelType() === 'T9')) {
            return "Recognization";
        } else {
            return "TrueDetect";
        }
    }

    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */

}

module.exports = VacBot;
