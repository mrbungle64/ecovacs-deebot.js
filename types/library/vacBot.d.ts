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
        getRequestUrl: (ecovacs: any, command: any, params: any) => string;
        getRequestHeaders: (ecovacs: any, params: any) => {
            'Content-Type': string;
            'Content-Length': number;
        };
        getRequestObject: (ecovacs: any, command: any) => import("./typedefs").CommandRequestObject | import("./typedefs").CleanLogsCommandObject;
        getCommandPayload: (command: any) => import("./typedefs").CommandPayload;
        getApiPath: (command: any) => string;
        getCommandRequestObject: (ecovacs: any, command: any, payload: import("./typedefs").CommandPayload) => import("./typedefs").CommandRequestObject;
        getCleanLogsCommandObject: (ecovacs: any, command: any) => import("./typedefs").CleanLogsCommandObject;
        getAuthObject: (ecovacs: any) => import("./typedefs").AuthObject;
    };
    protocolModule: typeof import("./ecovacsDeviceSession");
    ecovacs: import("./ecovacsDeviceSession");
    dispatcher: CommandDispatcher;
    mapManager: MapManager;
    stateManager: BotState;
    historyManager: HistoryManager;
    maintenanceManager: MaintenanceManager;
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
     * This is a wrapper function to start cleaning.
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
     * Run a command and return a Promise that resolves with the response payload.
     * The Promise resolves when the command's `expectedEvent` fires (as defined in commandRegistry).
     *
     * Existing `bot.on('EventName', ...)` listeners continue to work unchanged.
     *
     * @param {string} command - The command name (same as used in `run()`)
     * @param {...*} args - Zero or more arguments to perform the command (optionally an options object at the end)
     * @returns {Promise<any>}
     */
    runAsync(command: string, ...args: any[]): Promise<any>;
    /**
     * Run a specific command
     * @param {string} command - The command name
     * @param {...*} args - Zero or more arguments to perform the command
     * @returns {Promise<any>|boolean} Returns a Promise if returnPromise is true, otherwise boolean
     */
    run(command: string, ...args: any[]): Promise<any> | boolean;
    /**
     * Sends a raw `VacBotCommand` instance directly to the device.
     * Compatibility wrapper for the pre-1.0 API; prefer `run()` / `runAsync()` for named commands.
     * @param {Object} command - a `VacBotCommand` instance
     * @param {Object} [options={}] - optional command options
     * @returns {Promise} resolves with the command response
     */
    sendCommand(command: Object, options?: Object): Promise<any>;
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
    /**
     * Attach to an existing MQTT client owned by another VacBot instance.
     * @param {Object} existingMqttClient - connected mqtt.Client to reuse
     */
    connectShared(existingMqttClient: Object): void;
    /**
     * Apply a refreshed user access token (e.g. from the `EcovacsAPI`
     * `credentialsUpdated` event). Updates REST auth immediately and reconnects
     * the MQTT connection with the new credentials.
     * @param {string} token - the refreshed user access token
     */
    updateUserAccessToken(token: string): void;
    /**
     * Return the underlying MQTT client, or null if not yet connected.
     * @returns {Object|null}
     */
    getMqttClient(): Object | null;
    /**
     * Getter for the underlying MQTT client.
     * @returns {Object|null}
     */
    get client(): Object | null;
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
     * Returns true if the model is not 950 type (XMPP/XML or MQTT/XML)
     * e.g. Deebot OZMO 930, Deebot 900/901, Deebot Slim 2
     * @returns {boolean}
     */
    isNot950type(): boolean;
    /**
     * Returns true if the model is not a legacy model (i.e. is 950 type or newer)
     * e.g. Deebot OZMO 920, Deebot OZMO 950, Deebot T9 series
     * @returns {boolean}
     */
    is950type(): boolean;
    /**
     * Returns true if V2 commands are not implemented
     * e.g. Deebot OZMO 920/950 and all older models
     * @returns {boolean}
     */
    isNot950type_V2(): boolean;
    /**
     * Returns true if V2 commands are implemented (newer 950 type models)
     * e.g. Deebot T8, T9, T10, T20, X1, X2 series
     * If the model is not registered, it returns false
     * @returns {boolean}
     */
    is950type_V2(): boolean;
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
     * Returns the platform/architecture type of the model
     * (e.g. '950', 'T8', 'T20', 'airbot').
     * @returns {string}
     */
    getPlatformType(): string;
    /**
     * Returns the human-readable product category of the device
     * (e.g. 'Vacuum Cleaner', 'Air Purifier', 'Lawn Mower').
     * @returns {string}
     */
    getDeviceCategory(): string;
    /**
     * Returns the smartType (internal IoT platform generation/protocol) of the model
     * (e.g. 'MQ_AP', 'BLAP2', 'QRP', 'SPA', 'BT').
     * @returns {string}
     */
    getSmartType(): string;
    /**
     * @deprecated use getPlatformType()
     * Returns the type of the model
     * @returns {string}
     */
    getModelType(): string;
    /**
     * @deprecated use getDeviceCategory()
     * Returns the device type
     * @returns {string}
     */
    getDeviceType(): string;
    /**
     * @deprecated use isPlatformTypeLegacy()
     */
    isModelTypeLegacy(): boolean;
    /**
     * @deprecated use isPlatformTypeN8()
     */
    isModelTypeN8(): boolean;
    /**
     * @deprecated use isPlatformTypeT8()
     */
    isModelTypeT8(): boolean;
    /**
     * @deprecated use isPlatformTypeT9()
     */
    isModelTypeT9(): boolean;
    /**
     * @deprecated use isPlatformTypeT10()
     */
    isModelTypeT10(): boolean;
    /**
     * @deprecated use isPlatformTypeT20()
     */
    isModelTypeT20(): boolean;
    /**
     * @deprecated use isPlatformTypeX1()
     */
    isModelTypeX1(): boolean;
    /**
     * @deprecated use isPlatformTypeX2()
     */
    isModelTypeX2(): boolean;
    /**
     * @deprecated use isPlatformTypeAirbot()
     */
    isModelTypeAirbot(): boolean;
    /**
     * @deprecated use isPlatformTypeAqMonitor()
     */
    isModelTypeAqMonitor(): boolean;
    /**
     * @deprecated use isPlatformTypeLawnMower()
     */
    isModelTypeLawnMower(): boolean;
    /**
     * @deprecated use isPlatformTypeT8Based()
     */
    isModelTypeT8Based(): boolean;
    /**
     * @deprecated use isPlatformTypeT9Based()
     */
    isModelTypeT9Based(): boolean;
    /**
     * Check if the device platform type is legacy.
     * @returns {boolean}
     */
    isPlatformTypeLegacy(): boolean;
    /**
     * Check if the device platform type is N8.
     * @returns {boolean}
     */
    isPlatformTypeN8(): boolean;
    /**
     * Check if the device platform type is T8.
     * @returns {boolean}
     */
    isPlatformTypeT8(): boolean;
    /**
     * Check if the device platform type is T9.
     * @returns {boolean}
     */
    isPlatformTypeT9(): boolean;
    /**
     * Check if the device platform type is T10.
     * @returns {boolean}
     */
    isPlatformTypeT10(): boolean;
    /**
     * Check if the device platform type is T20.
     * @returns {boolean}
     */
    isPlatformTypeT20(): boolean;
    /**
     * Check if the device platform type is X1.
     * @returns {boolean}
     */
    isPlatformTypeX1(): boolean;
    /**
     * Check if the device platform type is X2.
     * @returns {boolean}
     */
    isPlatformTypeX2(): boolean;
    /**
     * Check if the device platform type is Airbot.
     * @returns {boolean}
     */
    isPlatformTypeAirbot(): boolean;
    /**
     * Check if the device platform type is Air Quality Monitor.
     * @returns {boolean}
     */
    isPlatformTypeAqMonitor(): boolean;
    /**
     * Check if the device platform type is Lawn Mower.
     * @returns {boolean}
     */
    isPlatformTypeLawnMower(): boolean;
    /**
     * Check if the device platform type is T8-based.
     * @returns {boolean}
     */
    isPlatformTypeT8Based(): boolean;
    /**
     * Check if the device platform type is T9-based.
     * @returns {boolean}
     */
    isPlatformTypeT9Based(): boolean;
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
     * Returns true if the station supports hot-water mop washing (55 °C).
     * Introduced with the T20 OMNI; not available on X1 or older platforms.
     * @returns {boolean}
     */
    hasHotWaterWashing(): boolean;
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
    handleClearMap(payload: any): void;
    handleStationAction(payload: any): void;
    /**
     * Emit all CleanLog-related events.
     * Consolidates the emit logic for both code paths
     * (MQTT response via `lg/log.do` and REST API via `dln/api/log/clean_result/list`)
     */
    emitCleanLogEvents(): void;
    /**
     * Handle the payload of a FwBuryPoint task message
     * @param {string} type - The task event type
     * @param {Object} payload
     */
    handleTask(type: string, payload: Object): void;
    getCmdForObstacleDetection(): string;
}
import CapabilityManager = require("./managers/capabilityManager");
import CommandDispatcher = require("./managers/commandDispatcher");
import MapManager = require("./managers/mapManager");
import BotState = require("./managers/botState");
import HistoryManager = require("./managers/historyManager");
import MaintenanceManager = require("./managers/maintenanceManager");
//# sourceMappingURL=vacBot.d.ts.map