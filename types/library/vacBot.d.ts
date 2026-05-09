export = VacBot;
/**
 * @class VacBot
 * This class represents the vacuum bot
 */
declare class VacBot {
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
    constructor(user: string, hostname: string, resource: string, secret: string, vacuum: Object, continent: string, country?: string, serverAddress?: string, authDomain?: string);
    country: string | undefined;
    continent: string;
    did: any;
    res: any;
    resource: string;
    uid: string;
    user_access_token: string;
    vacuum: Object;
    authDomain: string;
    is_ready: boolean;
    deviceClass: any;
    deviceModel: string;
    deviceImageURL: string;
    components: {};
    lastComponentValues: {};
    emitFullLifeSpanEvent: boolean;
    errorCode: string;
    errorDescription: any;
    maps: {};
    mapImages: any[];
    mapVirtualBoundaries: any[];
    mapVirtualBoundariesResponses: any[];
    mapSpotAreaInfos: any[];
    mapVirtualBoundaryInfos: any[];
    currentMapName: string;
    currentMapMID: string;
    currentMapIndex: number;
    currentCustomAreaValues: string;
    currentSpotAreas: string;
    batteryLevel: any;
    batteryIsLow: boolean;
    cleanReport: any;
    chargeStatus: any;
    chargeMode: any;
    cleanSpeed: any;
    waterLevel: any;
    waterboxInfo: any;
    moppingType: any;
    scrubbingType: any;
    sleepStatus: any;
    deebotPosition: {
        x: null;
        y: null;
        a: null;
        isInvalid: boolean;
        currentSpotAreaID: string;
        currentSpotAreaName: string;
        changeFlag: boolean;
    };
    chargePosition: {
        x: null;
        y: null;
        a: null;
        changeFlag: boolean;
    };
    cleanSum_totalSquareMeters: number | null;
    cleanSum_totalSeconds: number | null;
    cleanSum_totalNumber: number | null;
    cleanLog: any[];
    cleanLog_lastImageUrl: any;
    cleanLog_lastTimestamp: number | null;
    cleanLog_lastTotalTime: number | null;
    cleanLog_lastTotalTimeString: string | null;
    cleanLog_lastSquareMeters: number | null;
    currentStats: {
        cleanedArea: null;
        cleanedSeconds: null;
        cleanType: null;
    };
    netInfoIP: any;
    netInfoWifiSSID: any;
    netInfoWifiSignal: any;
    netInfoMAC: any;
    doNotDisturbEnabled: any;
    continuousCleaningEnabled: any;
    voiceReportDisabled: any;
    commandsSent: any[];
    mapPiecePacketsSent: any[];
    createMapDataObject: boolean;
    createMapImage: boolean;
    createMapImageOnly: boolean;
    mapDataObject: any[] | null;
    mapDataObjectQueue: any[];
    mapImageDataQueue: any[];
    schedule: any[];
    genericCommand: any;
    vacBotCommand: typeof import("./commands/base").VacBotCommand;
    protocolModule: typeof import("./ecovacs");
    ecovacs: import("./ecovacs");
    /**
     * Handle object with infos about the maps to provide a full map data object
     * @param {Object} mapsData
     * @returns {Promise<void>}
     */
    handleMapsEvent(mapsData: Object): Promise<void>;
    /**
     * Handle object with spot area data to provide a full map data object
     * @param {Object} spotAreasObject
     * @returns {Promise<void>}
     */
    handleMapSpotAreasEvent(spotAreasObject: Object): Promise<void>;
    /**
     * Handle object with spot area info data to provide a full map data object
     * @param {Object} spotAreaInfo
     * @returns {Promise<void>}
     */
    handleMapSpotAreaInfo(spotAreaInfo: Object): Promise<void>;
    /**
     * Handle object with virtual boundary data to provide a full map data object
     * @param {Object} virtualBoundaries
     * @returns {Promise<void>}
     */
    handleMapVirtualBoundaries(virtualBoundaries: Object): Promise<void>;
    /**
     * Handle object with virtual boundary info data to provide a full map data object
     * @param {Object} virtualBoundaryInfo
     * @returns {Promise<void>}
     */
    handleMapVirtualBoundaryInfo(virtualBoundaryInfo: Object): Promise<void>;
    handleZeroVirtualBoundariesForMap(mapID: any): void;
    handleMapDataReady(): void;
    /**
     * Handle object with map image data to provide a full map data object
     * @param {Object} mapImageData
     * @returns {Promise<void>}
     */
    handleMapImageData(mapImageData: Object): Promise<void>;
    /**
     * It takes a single argument, `mode`, which defaults to `"Clean"` (auto clean)
     * The function then calls the `run` function with the value of `mode` as the first argument
     * @since 0.6.2
     * @param {string} [mode=Clean] - The mode to run the script in.
     */
    clean(mode?: string): void;
    /**
     * This is a wrapper function for auto clean mode
     * @since 0.6.2
     * @param {string} areas - A string with a list of spot area IDs
     */
    spotArea(areas: string): void;
    /**
     * This is a wrapper function that will start cleaning the area specified by the boundary coordinates
     * @since 0.6.2
     * @param {string} boundaryCoordinates - A list of coordinates that form the polygon boundary of the area to be cleaned
     * @param {number} [numberOfCleanings=1] - The number of times the robot will repeat the cleaning process
     */
    customArea(boundaryCoordinates: string, numberOfCleanings?: number): void;
    /**
     * This is a wrapper function for edge cleaning mode
     * @since 0.6.2
     */
    edge(): void;
    /**
     * This is a wrapper function for spot cleaning mode
     * @since 0.6.2
     */
    spot(): void;
    /**
     * This is a wrapper function to send the vacuum back to the charging station
     * @since 0.6.2
     */
    charge(): void;
    /**
     * This is a wrapper function to stop the bot
     * @since 0.6.2
     */
    stop(): void;
    /**
     * This is a wrapper function to pause the bot
     * @since 0.6.2
     */
    pause(mode?: string): void;
    /**
     * This is a wrapper function to resume the cleaning process
     * @since 0.6.2
     */
    resume(): void;
    /**
     * This is a wrapper function to play a sound
     * @param {number} soundID
     * @since 0.6.2
     */
    playSound(soundID?: number): void;
    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command: string, ...args: any[]): boolean;
    /**
     * Get the name of the spot area that the bot is currently in
     * @param {string} currentSpotAreaID - the ID of the spot area that the player is currently in
     * @returns {string} the name of the current spot area
     */
    getSpotAreaName(currentSpotAreaID: string): string;
    /**
     * Get the translated name of a spot area
     * @param {string} name - The name of the area
     * @param {string} [languageCode=en] - The language code of the language you want the area name in
     * @returns {string} The area name in the language specified
     */
    getAreaName_i18n(name: string, languageCode?: string): string;
    /**
     * @deprecated
     */
    connect_and_wait_until_ready(): void;
    /**
     * Connect to the robot
     */
    connect(): void;
    on(name: any, func: any): void;
    once(name: any, func: any): void;
    /**
     * If the value of `company` is `eco-ng`
     * the model uses MQTT as protocol
     * @returns {boolean}
     */
    useMqttProtocol(): boolean;
    /**
     * Returns the protocol that is used
     * @returns {string} `MQTT` or `XMPP`
     */
    getProtocol(): string;
    /**
     * Returns true if the model is 950 type (MQTT/JSON)
     * e.g. Deebot OZMO 920, Deebot OZMO 950, Deebot T9 series
     * If the model is not registered,
     * it returns the default value (= is MQTT model)
     * @returns {boolean}
     */
    is950type(): boolean;
    /**
     * Returns true if V2 commands are implemented (newer 950 type models)
     * e.g. Deebot T8, T9, T10, T20, X1, X2 series
     * If the model is not registered, it returns false
     * @returns {boolean}
     */
    is950type_V2(): boolean;
    /**
     * Returns true if the model is not 950 type (XMPP/XML or MQTT/XML)
     * e.g. Deebot OZMO 930, Deebot 900/901, Deebot Slim 2
     * @returns {boolean}
     */
    isNot950type(): boolean;
    /**
     * Returns true if V2 commands are not implemented
     * e.g. Deebot OZMO 920/950 and all older models
     * @returns {boolean}
     */
    isNot950type_V2(): boolean;
    /**
     * Returns true if the model is a fully supported model
     * @returns {boolean}
     */
    isFullySupportedModel(): boolean;
    /**
     * @deprecated
     * Returns true if the model is a supported model
     * @returns {boolean}
     */
    isSupportedDevice(): boolean;
    /**
     * Returns true if the model is a known model
     * @returns {boolean}
     */
    isKnownModel(): boolean;
    /**
     * @deprecated
     * Returns true if the model is a known model
     * @returns {boolean}
     */
    isKnownDevice(): boolean;
    /**
     * Returns true if the model is a legacy model
     * @returns {boolean}
     */
    isLegacyModel(): boolean;
    /**
     * Returns the type of the model
     * @returns {String}
     */
    getModelType(): string;
    isModelTypeN8(): boolean;
    isModelTypeT8(): boolean;
    isModelTypeT9(): boolean;
    isModelTypeT10(): boolean;
    isModelTypeT20(): boolean;
    isModelTypeX1(): boolean;
    isModelTypeX2(): boolean;
    isModelTypeAirbot(): boolean;
    isModelTypeT8Based(): boolean;
    isModelTypeT9Based(): boolean;
    /**
     * Get the value of the given property for the device class
     * @param {string} property - The property to get
     * @param {any} [defaultValue=false] - The default value to return if the property is not found
     * @returns {any} The value of the property
     */
    getDeviceProperty(property: string, defaultValue?: any): any;
    /**
     * Returns true if the model has a filter
     * @returns {boolean}
     */
    hasFilter(): boolean;
    /**
     * Returns true if the model has a main brush
     * @returns {boolean}
     */
    hasMainBrush(): boolean;
    /**
     * Returns true if the model has a side brush
     * @returns {boolean}
     */
    hasSideBrush(): boolean;
    /**
     * Returns true if you can retrieve information about "unit care" (life span)
     * @returns {boolean}
     */
    hasUnitCareInfo(): boolean;
    /**
     * Returns true if you can retrieve information about "round mop" (life span)
     * @returns {boolean}
     */
    hasRoundMopInfo(): boolean;
    /**
     * Returns true if you can retrieve information about "air freshener" (life span)
     * @returns {boolean}
     */
    hasAirFreshenerInfo(): boolean;
    /**
     * Returns true if the model has Edge cleaning mode
     * It is assumed that a model can have either an Edge or Spot Area mode
     * @returns {boolean}
     */
    hasEdgeCleaningMode(): boolean;
    /**
     * Returns true if the model has Spot cleaning mode
     * It is assumed that a model can have either a Spot or Spot Area mode
     * @returns {boolean}
     */
    hasSpotCleaningMode(): boolean;
    /**
     * @deprecated - please use `hasSpotAreaCleaningMode()` instead
     */
    hasSpotAreas(): boolean;
    /**
     * Returns true if the model has Spot Area cleaning mode
     * @returns {boolean}
     */
    hasSpotAreaCleaningMode(): boolean;
    /**
     * @deprecated - please use `hasCustomAreaCleaningMode()` instead
     */
    hasCustomAreas(): boolean;
    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasCustomAreaCleaningMode(): boolean;
    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasMappingCapabilities(): boolean;
    /**
     * Returns true if the model has mopping functionality
     * @returns {boolean}
     */
    hasMoppingSystem(): boolean;
    /**
     * Returns true if the model has air drying functionality
     * @returns {boolean}
     */
    hasAirDrying(): boolean;
    /**
     * Returns true if the model has power adjustment functionality
     * @returns {boolean}
     */
    hasVacuumPowerAdjustment(): boolean;
    /**
     * Returns true if the model has voice report functionality
     * @returns {boolean}
     */
    hasVoiceReports(): boolean;
    /**
     * Returns true if the model has an auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStation(): boolean;
    /**
     * Returns true if the model supports map images
     * @returns {boolean}
     */
    isMapImageSupported(): boolean;
    /**
     * Get the nickname of the vacuum
     * @returns {string} the nickname
     */
    getName(): string;
    /**
     * Get the nickname of the vacuum, if it exists, otherwise get the product name
     * @returns {string} the nickname, if it has one, or the product name
     */
    getNickname(): string;
    /**
     * Get the product name of the device
     * @returns {string} the product name
     */
    getProductName(): string;
    /**
     * Get the model name of the device
     * @returns {string} the model name
     */
    getModelName(): string;
    /**
     * Get the product image URL of the image of the product
     * @returns {string} the URL
     */
    getProductImageURL(): string;
    /**
     * Send a command to the vacuum
     * @param {Object} command - a VacBotCommand object
     */
    sendCommand(command: Object): void;
    /**
     * Disconnect from MQTT server (fully async)
     */
    disconnectAsync(): Promise<void>;
    /**
     * Disconnect from MQTT server
     */
    disconnect(): void;
    callCleanResultsLogsApi(): Promise<any>;
    getCryptoHashStringForSecuredContent(): string;
    downloadSecuredContent(url: any, targetFilename: any): Promise<void>;
    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload: Object): void;
    /**
     * Handle the payload of the `StationState` response/message
     * @param {Object} payload
     */
    handleStationState(payload: Object): void;
    stationState: {
        type: number;
        state: number;
        isAirDrying: boolean;
        isSelfCleaning: boolean;
        isActive: boolean;
    } | undefined;
    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload: Object): void;
    stationInfo: {
        state: any;
        name: any;
        model: any;
        sn: any;
        wkVer: any;
    } | undefined;
    /**
     * Handle the payload of the `WashInterval` response/message
     * @param {Object} payload
     */
    handleWashInterval(payload: Object): void;
    washInterval: any;
    /**
     * Handle the payload of the `WashInfo` response/message
     * @param {Object} payload
     */
    handleWashInfo(payload: Object): void;
    washInfo: any;
    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload: Object): void;
    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload: Object): void;
    /**
     * Handle the payload of the `Pos` response/message
     * (vacuum position and charger resp. charge position)
     * @param {Object} payload
     */
    handlePos(payload: Object): void;
    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload: Object): void;
    evt: {
        code: any;
        event: any;
    } | {
        code: any;
        event: string;
    } | undefined;
    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload: Object): void;
    /**
     * Handle the payload of the `NetInfo` response/message
     * (network addresses and Wi-Fi status)
     * @param {Object} payload
     */
    handleNetInfo(payload: Object): void;
    /**
     * Handle the payload of the `WaterInfo` response/message
     * (water level and water box status)
     * @param {Object} payload
     */
    handleWaterInfo(payload: Object): void;
    /**
     * Handle the payload of the `AICleanItemState` response/message
     * Particle Removal and Pet Poop Avoidance mode (e.g. X1)
     * @param {Object} payload
     */
    handleAICleanItemState(payload: Object): void;
    aiCleanItemState: {
        items: any;
        particleRemoval: boolean;
        petPoopPrevention: boolean;
    } | undefined;
    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload: Object): void;
    airDryingStatus: string | undefined;
    handleDryingDuration(payload: any): void;
    dryingDuration: any;
    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload: Object): void;
    borderSpin: any;
    /**
     * Handle the payload of the `WorkMode` response/message
     * ('Work Mode', 'Cleaning Mode')
     * vacuum and mop = 0
     * vacuum only = 1
     * mop only = 2
     * mop after vacuum = 3
     * @param {Object} payload
     */
    handleWorkMode(payload: Object): void;
    workMode: any;
    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload: Object): void;
    sweepMode: any;
    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload: Object): void;
    mopOnlyMode: boolean | undefined;
    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload: Object): void;
    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: Object): void;
    /**
     * Handle the payload of the `MapState` response/message
     * @param {Object} payload
     */
    handleMapState(payload: Object): void;
    mapState: any;
    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload: Object): void;
    multiMapState: any;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: Object): void;
    /**
     * Handle the payload of the `TotalStats` response/message
     * @param {Object} payload
     */
    handleTotalStats(payload: Object): void;
    /**
     * Handle the payload of the `RelocationState` response/message
     * @param {Object} payload
     */
    handleRelocationState(payload: Object): void;
    relocationStatus: Object | undefined;
    relocationState: any;
    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload: Object): void;
    volume: any;
    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload: Object): void;
    breakPoint: any;
    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload: Object): void;
    block: any;
    blockTime: {
        from: any;
        to: any;
    } | undefined;
    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload: Object): void;
    autoEmpty: any;
    autoEmptyStatus: any;
    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload: Object): void;
    advancedMode: any;
    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload: Object): void;
    trueDetect: any;
    handleRecognization(payload: any): void;
    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload: Object): void;
    cleanCount: any;
    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload: Object): void;
    dusterRemind: {
        enabled: any;
        period: any;
    } | undefined;
    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * 'Auto-Boost Suction'
     * @param {Object} payload
     */
    handleCarpetPressure(payload: Object): void;
    carpetPressure: any;
    /**
     * Handle the payload of the 'CarpetInfo' response/message
     * 'Carpet cleaning strategy'
     * @param {Object} payload
     */
    handleCarpetInfo(payload: Object): void;
    carpetInfo: any;
    handleCleanPreference(payload: any): void;
    cleanPreference: any;
    handleLiveLaunchPwdState(payload: any): void;
    liveLaunchPwdState: {
        state: any;
        hasPwd: any;
    } | undefined;
    handleWiFiList(payload: any): void;
    handleOverTheAirUpdate(payload: any): void;
    OTA: any;
    handleTimeZone(payload: any): void;
    timezone: string | undefined;
    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload: Object): void;
    avoidedObstacles: any;
    obstacleTypes: any;
    /**
     * Handle the payload of the 'Sched' response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload: Object): void;
    /**
     * Handle the payload of the 'QuickCommand' response/message
     * @param {Object} payload - The payload containing the customized scenario cleaning.
     */
    handleQuickCommand(payload: Object): void;
    customizedScenarioCleaning: Object | undefined;
    /**
     * Handle the payload of the 'CachedMapInfo' response/message
     * @param {Object} payload
     */
    handleCachedMapInfo(payload: Object): void;
    /**
     * Handle the payload of the 'MapInfo_V2' response/message
     * @param {Object} payload
     */
    handleMapInfoV2(payload: Object): void;
    /**
     * Handle the payload of the 'MapInfo_V2' response/message (Yeedi)
     * @param {Object} payload
     */
    handleMapInfoV2_Yeedi(payload: Object): void;
    /**
     * Handle the payload of the 'MapSet' response/message
     * @param {Object} payload
     */
    handleMapSet(payload: Object): {
        mapsetEvent: string;
        mapsetData?: undefined;
    } | {
        mapsetEvent: string;
        mapsetData: any;
    };
    /**
     * Handle the payload of the 'MapSubSet' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapSubset(payload: Object): Promise<Object>;
    /**
     * Handle the payload of the `MapSet_V2` response/message
     * @param {Object} payload
     */
    handleMapSet_V2(payload: Object): Promise<void>;
    mapSet_V2: {
        mid: any;
        subsets: any[];
    } | undefined;
    /**
     * Handle the payload of the 'MapInfo' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapImage(payload: Object): Promise<Object>;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload: Object): null | undefined;
    liveMapImage: mapTemplate.EcovacsLiveMapImage | undefined;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    handleMinorMap(payload: Object): Promise<null | {
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    handleMapTrace(payload: any): Promise<void>;
    /**
     * Handle the payload of the 'Error' response/message
     * @param {Object} payload
     */
    handleResponseError(payload: Object): void;
    /**
     * Handles the air quality data received from the payload.
     * 'Indoor' Air Quality
     * @param {object} payload - The air quality data payload.
     */
    handleAirQuality(payload: object): void;
    airQuality: {
        particulateMatter25: any;
        particulateMatter10: any;
        airQualityIndex: any;
        volatileOrganicCompounds: any;
        temperature: any;
        humidity: any;
    } | undefined;
    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * @param {Object} payload
     */
    handleMonitorAirState(payload: Object): void;
    monitorAirState: any;
    /**
     * Handle the payload of the 'AngleFollow' response/message
     * 'Face to Me' option
     * @param {Object} payload
     */
    handleAngleFollow(payload: Object): void;
    angleFollow: any;
    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload: Object): void;
    angleWakeup: any;
    /**
     * Handle the payload of the 'Mic' response/message
     * 'Microphone'
     * @param {Object} payload
     */
    handleMic(payload: Object): void;
    mic: any;
    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * 'Working Status Voice Report'
     * @param {Object} payload
     */
    handleVoiceSimple(payload: Object): void;
    voiceSimple: any;
    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload: Object): void;
    drivingWheel: any;
    /**
     * Handle the payload of the 'ChildLock' response/message
     * 'Child Lock'
     * @param {Object} payload
     */
    handleChildLock(payload: Object): void;
    childLock: any;
    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * 'YIKO Voice Assistant'
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload: Object): void;
    voiceAssistantState: any;
    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * 'Lab Features' => 'Follow Me'
     * @param {Object} payload
     */
    handleHumanoidFollow(payload: Object): void;
    humanoidFollow: {
        video: any;
        yiko: any;
    } | undefined;
    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * 'Self-linked Purification'
     * @param {Object} payload
     */
    handleAutonomousClean(payload: Object): void;
    autonomousClean: any;
    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * 'Linked Purification' (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload: Object): void;
    airbotAutoModel: {
        enable: any;
        trigger: any;
        aq: {
            aqStart: any;
            aqEnd: any;
        };
    } | undefined;
    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * 'Bluetooth Speaker'
     * @param {Object} payload
     */
    handleBlueSpeaker(payload: Object): void;
    bluetoothSpeaker: {
        enable: any;
        time: any;
        name: any;
    } | undefined;
    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload: Object): void;
    efficiency: any;
    /**
     * Handle the payload of the 'AtmoLight' response/message
     * 'Light Brightness'
     * @param {Object} payload
     */
    handleAtmoLight(payload: Object): void;
    atmoLightIntensity: any;
    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * 'Volume'
     * @param {Object} payload
     */
    handleAtmoVolume(payload: Object): void;
    atmoVolume: any;
    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload: Object): void;
    threeModule: Object | undefined;
    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload: Object): void;
    threeModuleStatus: Object | undefined;
    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload: Object): void;
    areaPoint: Object | undefined;
    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload: Object): void;
    aiBlockPlate: any;
    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload: Object): void;
    sysinfo: {
        load: any;
        uptime: any;
        signal: any;
        meminfo: any;
        pos: any;
    } | undefined;
    handleTask(type: any, payload: any): void;
    currentTask: any;
    handleDModule(payload: any): void;
    dmodule: any;
    getCmdForObstacleDetection(): "Recognization" | "TrueDetect";
}
import mapTemplate = require("./mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map