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
    capabilityManager: CapabilityManager;
    deviceModel: string;
    deviceImageURL: string;
    commandsSent: any[];
    mapPiecePacketsSent: any[];
    genericCommand: any;
    vacBotCommand: {
        new (name: string, payload?: object, api?: string): import("./commands/base").VacBotCommand;
        getRequestUrl: (ecovacs: any, command: any, params: any) => any;
        getRequestHeaders: (ecovacs: any, params: any) => {
            'Content-Type': string;
            'Content-Length': number;
        };
        getRequestObject: (ecovacs: any, command: any) => {
            auth: {
                realm: "ecouser.net";
                resource: any;
                token: any;
                userid: any;
                with: string;
            };
            did: any;
            country: any;
            td: any;
            resource: any;
        } | {
            cmdName: any;
            payload: any;
            payloadType: any;
            auth: {
                realm: "ecouser.net";
                resource: any;
                token: any;
                userid: any;
                with: string;
            };
            td: string;
            toId: any;
            toRes: any;
            toType: any;
        };
        getCommandPayload: (command: any) => {
            header: {
                pri: string;
                ts: number;
                tzm: number;
                ver: string;
            };
            body: {
                data: any;
            };
        };
        getApiPath: (command: any) => "iot/devmanager.do";
        getCommandRequestObject: (ecovacs: any, command: any, payload: any) => {
            cmdName: any;
            payload: any;
            payloadType: any;
            auth: {
                realm: "ecouser.net";
                resource: any;
                token: any;
                userid: any;
                with: string;
            };
            td: string;
            toId: any;
            toRes: any;
            toType: any;
        };
        getCleanLogsCommandObject: (ecovacs: any, command: any) => {
            auth: {
                realm: "ecouser.net";
                resource: any;
                token: any;
                userid: any;
                with: string;
            };
            did: any;
            country: any;
            td: any;
            resource: any;
        };
        getAuthObject: (ecovacs: any) => {
            realm: "ecouser.net";
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
    };
    protocolModule: typeof import("./ecovacs");
    ecovacs: import("./ecovacs");
    dispatcher: CommandDispatcher;
    mapManager: MapManager;
    stateManager: BotState;
    historyManager: HistoryManager;
    maintenanceManager: MaintenanceManager;
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
     * Returns true if the model is not a legacy model (i.e. is 950 type or newer)
     * e.g. Deebot OZMO 920, Deebot OZMO 950, Deebot T9 series
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
    /**
     * Returns the device type
     * @returns {String}
     */
    getDeviceType(): string;
    isModelTypeLegacy(): boolean;
    isModelTypeN8(): boolean;
    isModelTypeT8(): boolean;
    isModelTypeT9(): boolean;
    isModelTypeT10(): boolean;
    isModelTypeT20(): boolean;
    isModelTypeX1(): boolean;
    isModelTypeX2(): boolean;
    isModelTypeAirbot(): boolean;
    isModelTypeLawnMower(): boolean;
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
     * Returns true if the model has an optional auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStationOptional(): boolean;
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
     * Disconnect from MQTT server (fully async)
     */
    disconnectAsync(): Promise<void>;
    /**
     * Disconnect from MQTT server
     */
    disconnect(): void;
    callCleanResultsLogsApi(): Promise<Object>;
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
    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload: Object): void;
    /**
     * Handle the payload of the `WashInterval` response/message
     * @param {Object} payload
     */
    handleWashInterval(payload: Object): void;
    /**
     * Handle the payload of the `WashInfo` response/message
     * @param {Object} payload
     */
    handleWashInfo(payload: Object): void;
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
    handleClearMap(payload: any): void;
    handleBorderSwitch(payload: any): void;
    handleCrossMapBorderWarning(payload: any): void;
    handleCutDirection(payload: any): void;
    handleMoveupWarning(payload: any): void;
    handleSafeProtect(payload: any): void;
    handleWorkState(payload: any): void;
    handleStationAction(payload: any): void;
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
    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload: Object): void;
    handleDryingDuration(payload: any): void;
    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload: Object): void;
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
    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload: Object): void;
    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload: Object): void;
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
    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload: Object): void;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: Object): void;
    /**
     * Emit all CleanLog-related events.
     * Consolidates the emit logic for both code paths
     * (MQTT response via `lg/log.do` and REST API via `dln/api/log/clean_result/list`)
     */
    emitCleanLogEvents(): void;
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
    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload: Object): void;
    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload: Object): void;
    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload: Object): void;
    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload: Object): void;
    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload: Object): void;
    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload: Object): void;
    handleRecognization(payload: any): void;
    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload: Object): void;
    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload: Object): void;
    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * 'Auto-Boost Suction'
     * @param {Object} payload
     */
    handleCarpetPressure(payload: Object): void;
    /**
     * Handle the payload of the 'CarpetInfo' response/message
     * 'Carpet cleaning strategy'
     * @param {Object} payload
     */
    handleCarpetInfo(payload: Object): void;
    handleCleanPreference(payload: any): void;
    handleLiveLaunchPwdState(payload: any): void;
    handleWiFiList(payload: any): void;
    handleOverTheAirUpdate(payload: any): void;
    handleTimeZone(payload: any): void;
    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload: Object): void;
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
    handleCachedMapInfo(payload: any): void;
    handleMapInfoV2(payload: any): void;
    handleMapInfoV2_Yeedi(payload: any): void;
    handleMapSet(payload: any): {
        mapsetEvent: string;
        mapsetData?: undefined;
    } | {
        mapsetEvent: string;
        mapsetData: any;
    };
    handleMapSubset(payload: any): Promise<Object>;
    handleMapSet_V2(payload: any): Promise<void>;
    handleMapImage(payload: any): Promise<Object>;
    handleMajorMap(payload: any): null | undefined;
    handleMinorMap(payload: any): Promise<{
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    } | null>;
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
    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * @param {Object} payload
     */
    handleMonitorAirState(payload: Object): void;
    /**
     * Handle the payload of the 'AngleFollow' response/message
     * 'Face to Me' option
     * @param {Object} payload
     */
    handleAngleFollow(payload: Object): void;
    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload: Object): void;
    /**
     * Handle the payload of the 'Mic' response/message
     * 'Microphone'
     * @param {Object} payload
     */
    handleMic(payload: Object): void;
    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * 'Working Status Voice Report'
     * @param {Object} payload
     */
    handleVoiceSimple(payload: Object): void;
    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload: Object): void;
    /**
     * Handle the payload of the 'ChildLock' response/message
     * 'Child Lock'
     * @param {Object} payload
     */
    handleChildLock(payload: Object): void;
    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * 'YIKO Voice Assistant'
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload: Object): void;
    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * 'Lab Features' => 'Follow Me'
     * @param {Object} payload
     */
    handleHumanoidFollow(payload: Object): void;
    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * 'Self-linked Purification'
     * @param {Object} payload
     */
    handleAutonomousClean(payload: Object): void;
    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * 'Linked Purification' (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload: Object): void;
    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * 'Bluetooth Speaker'
     * @param {Object} payload
     */
    handleBlueSpeaker(payload: Object): void;
    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload: Object): void;
    /**
     * Handle the payload of the 'AtmoLight' response/message
     * 'Light Brightness'
     * @param {Object} payload
     */
    handleAtmoLight(payload: Object): void;
    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * 'Volume'
     * @param {Object} payload
     */
    handleAtmoVolume(payload: Object): void;
    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload: Object): void;
    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload: Object): void;
    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload: Object): void;
    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload: Object): void;
    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload: Object): void;
    handleTask(type: any, payload: any): void;
    handleDModule(payload: any): void;
    getCmdForObstacleDetection(): "Recognization" | "TrueDetect";
}
import CapabilityManager = require("./managers/capabilityManager");
import CommandDispatcher = require("./managers/commandDispatcher");
import MapManager = require("./managers/mapManager");
import BotState = require("./managers/botState");
import HistoryManager = require("./managers/historyManager");
import MaintenanceManager = require("./managers/maintenanceManager");
//# sourceMappingURL=vacBot.d.ts.map