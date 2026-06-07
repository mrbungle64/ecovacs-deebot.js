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
const COMMAND_REGISTRY = require('./commandRegistry');

/**
 * Internal Symbol used to identify options objects passed from runAsync() to run().
 * Using a Symbol prevents accidental collision with user-supplied command arguments.
 * @private
 */
const RUN_OPTIONS_SYMBOL = Symbol('RunOptions');

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
        'schedule', 'dryingDuration', 'airDryingStatus'
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
 * Maps each manager to the `handleX(payload)` message handlers it owns.
 * These are pure passthroughs — `bot.handleX(payload)` simply forwards to
 * `this[manager].handleX(payload)` and returns its result (so async map
 * handlers keep returning a Promise the caller can await).
 *
 * The delegators are generated onto `VacBot.prototype` at the bottom of this
 * file, the same way `PROXY_MAPPINGS` generates the property getters/setters.
 * Handlers that are NOT simple passthroughs (e.g. `handleClearMap`,
 * `handleStationAction`, `handleTask`) stay hand-written in the class body.
 * @private
 */
const HANDLER_MAPPINGS = {
    stateManager: [
        'handleCleanInfo', 'handleStationState', 'handleStationInfo', 'handleWashInterval',
        'handleWashInfo', 'handleBattery', 'handlePos', 'handleEvt', 'handleSpeed',
        'handleNetInfo', 'handleBorderSwitch', 'handleCrossMapBorderWarning', 'handleCutDirection',
        'handleMoveupWarning', 'handleSafeProtect', 'handleWorkState', 'handleWaterInfo',
        'handleAICleanItemState', 'handleAirDryingState', 'handleDryingDuration', 'handleBorderSpin',
        'handleWorkMode', 'handleCustomAreaMode', 'handleSweepMode', 'handleChargeState',
        'handleSleepStatus', 'handleCleanLogs', 'handleTotalStats', 'handleRelocationState',
        'handleVolume', 'handleBreakPoint', 'handleBlock', 'handleAutoEmpty', 'handleAdvancedMode',
        'handleTrueDetect', 'handleRecognization', 'handleCleanCount', 'handleDusterRemind',
        'handleCarpetPressure', 'handleCarpetInfo', 'handleCleanPreference', 'handleLiveLaunchPwdState',
        'handleWiFiList', 'handleOverTheAirUpdate', 'handleTimeZone', 'handleStats', 'handleSched',
        'handleQuickCommand', 'handleResponseError', 'handleAirQuality', 'handleMonitorAirState',
        'handleAngleFollow', 'handleAngleWakeup', 'handleMic', 'handleVoiceSimple', 'handleDrivingWheel',
        'handleChildLock', 'handleVoiceAssistantState', 'handleHumanoidFollow', 'handleAutonomousClean',
        'handleAirbotAutoModel', 'handleBlueSpeaker', 'handleEfficiency', 'handleAtmoLight',
        'handleAtmoVolume', 'handleThreeModule', 'handleThreeModuleStatus', 'handleAreaPoint',
        'handleAiBlockPlate', 'handleSysinfo', 'handleDModule'
    ],
    maintenanceManager: [
        'handleLifespan'
    ],
    mapManager: [
        'handleMapState', 'handleMultiMapState', 'handleCachedMapInfo', 'handleMapInfoV2',
        'handleMapInfoV2_Yeedi', 'handleMapSet', 'handleMapSubset', 'handleMapSet_V2',
        'handleMapImage', 'handleMajorMap', 'handleMinorMap', 'handleMapTrace'
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
        this.capabilityManager = new CapabilityManager(this);

        this.deviceModel = this.getProductName();
        this.deviceImageURL = this.getProductImageURL();

        this.commandsSent = [];
        this.mapPiecePacketsSent = [];

        this.genericCommand = null;

        if (!this.is950type()) {
            const msg = '\'XML\' based model identified (unsupported)';
            tools.envLogError(msg);
            throw new Error(msg);
        }

        this.vacBotCommand = VacBotCommand;
        this.protocolModule = require('./ecovacsDeviceSession');

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
     * This is a wrapper function to start cleaning.
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
     * Run a command and return a Promise that resolves with the response payload.
     * The Promise resolves when the command's `expectedEvent` fires (as defined in commandRegistry).
     *
     * Existing `bot.on('EventName', ...)` listeners continue to work unchanged.
     *
     * @param {string} command - The command name (same as used in `run()`)
     * @param {...*} args - Zero or more arguments to perform the command (optionally an options object at the end)
     * @returns {Promise<any>}
     */
    runAsync(command, ...args) {
        const options = { returnPromise: true, timeoutMs: 10000 };
        options[RUN_OPTIONS_SYMBOL] = true;

        const KNOWN_OPTION_KEYS = ['timeoutMs', 'returnPromise'];

        // Support runAsync('Command', arg1, { timeoutMs: 250 })
        if (args.length > 0) {
            const lastArg = args[args.length - 1];
            const isPlainObject = (lastArg !== null) && (typeof lastArg === 'object') && !Array.isArray(lastArg);
            if (isPlainObject) {
                const isInternalOptions = Boolean(lastArg[RUN_OPTIONS_SYMBOL]);
                const hasUserOptionKeys = KNOWN_OPTION_KEYS.some(key => lastArg.hasOwnProperty(key));
                if (!isInternalOptions && hasUserOptionKeys) {
                    const userOptions = args.pop();
                    Object.assign(options, userOptions);
                    options[RUN_OPTIONS_SYMBOL] = true;
                }
            }
        }

        try {
            const result = this.run(command, ...args, options);

            if (result instanceof Promise) {
                return result;
            }
            // run() returned false or undefined — command exists but has no async support
            return Promise.reject(
                new Error(`Command '${command}' is not supported via runAsync()`)
            );
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Run a specific command
     * @param {string} command - The command name
     * @param {...*} args - Zero or more arguments to perform the command
     * @returns {Promise<any>|boolean} Returns a Promise if returnPromise is true, otherwise boolean
     */
    run(command, ...args) {
        // Extract internal options object stamped by runAsync() with RUN_OPTIONS_SYMBOL.
        // Using a Symbol prevents accidental collision with user-supplied arguments.
        let _options = {};
        if ((args.length > 0) && (args[args.length - 1]?.[RUN_OPTIONS_SYMBOL] === true)) {
            _options = args.pop();
        }
        const isAsync = Boolean(_options.returnPromise);

        let cmdToRun = command;
        if (this.is950type_V2() && !command.toLowerCase().endsWith('_v2')) {
            const command_v2 = command + '_V2';
            const v2Key = COMMAND_REGISTRY.resolveKey(command_v2);
            if (v2Key) {
                cmdToRun = command_v2;
            }
        }

        const key = COMMAND_REGISTRY.resolveKey(cmdToRun);
        const entry = COMMAND_REGISTRY[key];

        // Guard: unknown command
        if (!entry) {
            const msg = `Unknown command: '${command}'`;
            tools.envLogError(msg);
            return isAsync ? Promise.reject(new Error(msg)) : false;
        }

        // Delegate commands with special dispatch logic
        if (entry.specialLogic) {
            return this.dispatcher.dispatch(key.toLowerCase(), _options, ...args);
        }

        // Guard: insufficient arguments
        if (entry.minArgs && (args.length < entry.minArgs)) {
            const msg = `Command '${command}' requires at least ${entry.minArgs} argument(s), got ${args.length}`;
            tools.envLogError(msg);
            return isAsync ? Promise.reject(new Error(msg)) : false;
        }

        const cmdArgs = entry.fixedArgs || args;
        const commandInstance = new VacBotCommand[entry.className](...cmdArgs);
        commandInstance._registryKey = key;
        return this.ecovacs.sendCommand(commandInstance, _options);
    }

    /**
     * Sends a raw `VacBotCommand` instance directly to the device.
     * Compatibility wrapper for the pre-1.0 API; prefer `run()` / `runAsync()` for named commands.
     * @param {Object} command - a `VacBotCommand` instance
     * @param {Object} [options={}] - optional command options
     * @returns {Promise} resolves with the command response
     */
    sendCommand(command, options = {}) {
        return this.ecovacs.sendCommand(command, options);
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

    /**
     * Attach to an existing MQTT client owned by another VacBot instance.
     * @param {Object} existingMqttClient - connected mqtt.Client to reuse
     */
    connectShared(existingMqttClient) {
        this.ecovacs.connectShared(existingMqttClient);
    }

    /**
     * Apply a refreshed user access token (e.g. from the `EcovacsAPI`
     * `credentialsUpdated` event). Updates REST auth immediately and reconnects
     * the MQTT connection with the new credentials.
     * @param {string} token - the refreshed user access token
     */
    updateUserAccessToken(token) {
        this.user_access_token = token;
        this.ecovacs.updateToken(token);
    }

    /**
     * Return the underlying MQTT client, or null if not yet connected.
     * @returns {Object|null}
     */
    getMqttClient() {
        return this.ecovacs ? this.ecovacs.client : null;
    }

    /**
     * Getter for the underlying MQTT client.
     * @returns {Object|null}
     */
    get client() {
        return this.getMqttClient();
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
     * Returns true if the model is not 950 type (XMPP/XML or MQTT/XML)
     * e.g. Deebot OZMO 930, Deebot 900/901, Deebot Slim 2
     * @returns {boolean}
     */
    isNot950type() {
        return (!this.is950type());
    }

    /**
     * Returns true if the model is not a legacy model (i.e. is 950 type or newer)
     * e.g. Deebot OZMO 920, Deebot OZMO 950, Deebot T9 series
     * @returns {boolean}
     */
    is950type() {
        return !this.isLegacyModel();
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
     * Returns true if V2 commands are implemented (newer 950 type models)
     * e.g. Deebot T8, T9, T10, T20, X1, X2 series
     * If the model is not registered, it returns false
     * @returns {boolean}
     */
    is950type_V2() {
        return this.getDeviceProperty('V2', false);
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
     * Returns the platform/architecture type of the model
     * (e.g. '950', 'T8', 'T20', 'airbot').
     * @returns {string}
     */
    getPlatformType() {
        if (this.capabilityManager) {
            return this.capabilityManager.getPlatformType();
        }
        return 'unknown';
    }

    /**
     * Returns the human-readable product category of the device
     * (e.g. 'Vacuum Cleaner', 'Air Purifier', 'Lawn Mower').
     * @returns {string}
     */
    getDeviceCategory() {
        if (this.capabilityManager) {
            const category = this.capabilityManager.getDeviceCategory();
            if (category && category !== 'unknown') {
                return category;
            }
        }
        if (typeof this.getDeviceProperty === 'function') {
            const category = this.getDeviceProperty('deviceCategory');
            if (category && category !== 'unknown') {
                return category;
            }
        }
        return 'unknown';
    }

    /**
     * Returns the smartType (internal IoT platform generation/protocol) of the model
     * (e.g. 'MQ_AP', 'BLAP2', 'QRP', 'SPA', 'BT').
     * @returns {string}
     */
    getSmartType() {
        if (this.capabilityManager) {
            const smartType = this.capabilityManager.getSmartType();
            if (smartType && smartType !== 'unknown') {
                return smartType;
            }
        }
        if (typeof this.getDeviceProperty === 'function') {
            const smartType = this.getDeviceProperty('smartType');
            if (smartType && smartType !== 'unknown') {
                return smartType;
            }
        }
        return 'unknown';
    }

    /**
     * @deprecated use getPlatformType()
     * Returns the type of the model
     * @returns {string}
     */
    getModelType() {
        return this.getPlatformType();
    }

    /**
     * @deprecated use getDeviceCategory()
     * Returns the device type
     * @returns {string}
     */
    getDeviceType() {
        return this.getDeviceCategory();
    }

    /**
     * @deprecated use isPlatformTypeLegacy()
     */
    isModelTypeLegacy() {
        return this.isPlatformTypeLegacy();
    }

    /**
     * @deprecated use isPlatformTypeN8()
     */
    isModelTypeN8() {
        return this.isPlatformTypeN8();
    }

    /**
     * @deprecated use isPlatformTypeT8()
     */
    isModelTypeT8() {
        return this.isPlatformTypeT8();
    }

    /**
     * @deprecated use isPlatformTypeT9()
     */
    isModelTypeT9() {
        return this.isPlatformTypeT9();
    }

    /**
     * @deprecated use isPlatformTypeT10()
     */
    isModelTypeT10() {
        return this.isPlatformTypeT10();
    }

    /**
     * @deprecated use isPlatformTypeT20()
     */
    isModelTypeT20() {
        return this.isPlatformTypeT20();
    }

    /**
     * @deprecated use isPlatformTypeX1()
     */
    isModelTypeX1() {
        return this.isPlatformTypeX1();
    }

    /**
     * @deprecated use isPlatformTypeX2()
     */
    isModelTypeX2() {
        return this.isPlatformTypeX2();
    }

    /**
     * @deprecated use isPlatformTypeAirbot()
     */
    isModelTypeAirbot() {
        return this.isPlatformTypeAirbot();
    }

    /**
     * @deprecated use isPlatformTypeAqMonitor()
     */
    isModelTypeAqMonitor() {
        return this.isPlatformTypeAqMonitor();
    }

    /**
     * @deprecated use isPlatformTypeLawnMower()
     */
    isModelTypeLawnMower() {
        return this.isPlatformTypeLawnMower();
    }

    /**
     * @deprecated use isPlatformTypeT8Based()
     */
    isModelTypeT8Based() {
        return this.isPlatformTypeT8Based();
    }

    /**
     * @deprecated use isPlatformTypeT9Based()
     */
    isModelTypeT9Based() {
        return this.isPlatformTypeT9Based();
    }

    /**
     * Check if the device platform type is legacy.
     * @returns {boolean}
     */
    isPlatformTypeLegacy() {
        return this.capabilityManager.isPlatformTypeLegacy();
    }

    /**
     * Check if the device platform type is N8.
     * @returns {boolean}
     */
    isPlatformTypeN8() {
        return this.capabilityManager.isPlatformTypeN8();
    }

    /**
     * Check if the device platform type is T8.
     * @returns {boolean}
     */
    isPlatformTypeT8() {
        return this.capabilityManager.isPlatformTypeT8();
    }

    /**
     * Check if the device platform type is T9.
     * @returns {boolean}
     */
    isPlatformTypeT9() {
        return this.capabilityManager.isPlatformTypeT9();
    }

    /**
     * Check if the device platform type is T10.
     * @returns {boolean}
     */
    isPlatformTypeT10() {
        return this.capabilityManager.isPlatformTypeT10();
    }

    /**
     * Check if the device platform type is T20.
     * @returns {boolean}
     */
    isPlatformTypeT20() {
        return this.capabilityManager.isPlatformTypeT20();
    }

    /**
     * Check if the device platform type is X1.
     * @returns {boolean}
     */
    isPlatformTypeX1() {
        return this.capabilityManager.isPlatformTypeX1();
    }

    /**
     * Check if the device platform type is X2.
     * @returns {boolean}
     */
    isPlatformTypeX2() {
        return this.capabilityManager.isPlatformTypeX2();
    }

    /**
     * Check if the device platform type is Airbot.
     * @returns {boolean}
     */
    isPlatformTypeAirbot() {
        return this.capabilityManager.isPlatformTypeAirbot();
    }

    /**
     * Check if the device platform type is Air Quality Monitor.
     * @returns {boolean}
     */
    isPlatformTypeAqMonitor() {
        return this.capabilityManager.isPlatformTypeAqMonitor();
    }

    /**
     * Check if the device platform type is Lawn Mower.
     * @returns {boolean}
     */
    isPlatformTypeLawnMower() {
        return this.capabilityManager.isPlatformTypeLawnMower();
    }

    /**
     * Check if the device platform type is T8-based.
     * @returns {boolean}
     */
    isPlatformTypeT8Based() {
        return this.capabilityManager.isPlatformTypeT8Based();
    }

    /**
     * Check if the device platform type is T9-based.
     * @returns {boolean}
     */
    isPlatformTypeT9Based() {
        return this.capabilityManager.isPlatformTypeT9Based();
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
     * Returns true if the station supports hot-water mop washing (55 °C).
     * Introduced with the T20 OMNI; not available on X1 or older platforms.
     * @returns {boolean}
     */
    hasHotWaterWashing() {
        return this.capabilityManager.hasHotWaterWashing();
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
     * Returns true if the model has an optional auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStationOptional() {
        return this.capabilityManager.hasAutoEmptyStationOptional();
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

    handleClearMap(payload) {
        tools.envLogInfo(`ClearMap response: ${JSON.stringify(payload)}`);
    }

    handleStationAction(payload) {
        tools.envLogInfo(`StationAction response: ${JSON.stringify(payload)}`);
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
     * Handle the payload of a FwBuryPoint task message
     * @param {string} type - The task event type
     * @param {Object} payload
     */
    handleTask(type, payload) {
        this.stateManager.handleTask(type, payload);
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

for (const [manager, handlers] of Object.entries(HANDLER_MAPPINGS)) {
    for (const handler of handlers) {
        VacBot.prototype[handler] = function (payload) {
            return this[manager][handler](payload);
        };
    }
}

module.exports = VacBot;
