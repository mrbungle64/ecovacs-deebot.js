export = VacBot;
/**
 * This class represents the vacuum bot
 * There are 2 classes which derive from this class (`VacBot_950type` and `VacBot_non950type`)
 */
declare class VacBot {
    /**
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} country - the country where the Ecovacs account is registered
     * @param {string} serverAddress - the server address of the MQTT and XMPP server
     */
    constructor(user: string, hostname: string, resource: string, secret: string, vacuum: any, continent: string, country: string, serverAddress: string);
    ecovacs: import("./950type/ecovacsMQTT_JSON.js") | import("./non950type/ecovacsMQTT_XML.js") | import("./non950type/ecovacsXMPP_XML.js");
    vacuum: any;
    is_ready: boolean;
    useMqtt: boolean;
    deviceClass: any;
    deviceModel: string;
    deviceImageURL: string;
    components: {};
    lastComponentValues: {};
    emitFullLifeSpanEvent: boolean;
    errorCode: string;
    errorDescription: any;
    maps: any;
    mapImages: any[];
    mapVirtualBoundaries: any[];
    mapVirtualBoundariesResponses: any[];
    mapSpotAreaInfos: any[];
    mapVirtualBoundaryInfos: any[];
    currentMapName: string;
    currentMapMID: any;
    currentMapIndex: number;
    lastUsedAreaValues: any;
    batteryInfo: any;
    batteryIsLow: boolean;
    cleanReport: any;
    chargeStatus: any;
    cleanSpeed: any;
    waterLevel: any;
    waterboxInfo: any;
    sleepStatus: any;
    deebotPosition: {
        x: any;
        y: any;
        a: any;
        isInvalid: boolean;
        currentSpotAreaID: string;
        currentSpotAreaName: string;
        changeFlag: boolean;
    };
    chargePosition: {
        x: any;
        y: any;
        a: any;
        changeFlag: boolean;
    };
    cleanSum_totalSquareMeters: any;
    cleanSum_totalSeconds: any;
    cleanSum_totalNumber: any;
    cleanLog: any[];
    cleanLog_lastImageUrl: any;
    cleanLog_lastTimestamp: any;
    cleanLog_lastTotalTime: any;
    cleanLog_lastTotalTimeString: any;
    cleanLog_lastSquareMeters: any;
    currentStats: any;
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
    mapDataObject: any[];
    mapDataObjectQueue: any[];
    schedule: any[];
    vacBotCommand: typeof import("./950type/vacBotCommand") | typeof import("./non950type/vacBotCommand");
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
     * @param {Number} soundID
     * @since 0.6.2
     */
    playSound(soundID?: number): void;
    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command: string, ...args: any[]): void;
    handleMapsEvent(mapData: any): Promise<void>;
    handleMapSpotAreasEvent(spotAreas: any): Promise<void>;
    handleMapVirtualBoundaries(virtualBoundaries: any): Promise<void>;
    handleMapSpotAreaInfo(spotAreaInfo: any): Promise<void>;
    handleMapVirtualBoundaryInfo(virtualBoundaryInfo: any): Promise<void>;
    handleMapImageInfo(mapImageInfo: any): Promise<void>;
    /**
     * Get the name of the spot area that the bot is currently in
     * @param {String} currentSpotAreaID - the ID of the spot area that the player is currently in
     * @returns {String} the name of the current spot area
     */
    getSpotAreaName(currentSpotAreaID: string): string;
    /**
     * @deprecated
     */
    connect_and_wait_until_ready(): void;
    /**
     * Connect to the robot
     */
    connect(): void;
    on(name: any, func: any): void;
    getLibraryForCommands(): typeof import("./950type/vacBotCommand") | typeof import("./non950type/vacBotCommand");
    getLibraryForProtocol(): typeof import("./950type/ecovacsMQTT_JSON.js") | typeof import("./non950type/ecovacsMQTT_XML.js") | typeof import("./non950type/ecovacsXMPP_XML.js");
    useMqttProtocol(): boolean;
    getProtocol(): "MQTT" | "XMPP";
    is950type(): any;
    isNot950type(): boolean;
    /**
     * Returns true if the model is a N79 series model
     * @returns {Boolean}
     */
    isN79series(): boolean;
    /**
     * Returns true if the model is a supported model
     * @returns {Boolean}
     */
    isSupportedDevice(): boolean;
    /**
     * Returns true if the model is a known model
     * @returns {Boolean}
     */
    isKnownDevice(): boolean;
    /**
     * Get the value of the given property for the device class
     * @param {string} property - The property to get
     * @param {any} [defaultValue=false] - The default value to return if the property is not found
     * @returns {any} The value of the property
     */
    getDeviceProperty(property: string, defaultValue?: any): any;
    /**
     * Returns true if the model has a main brush
     * @returns {Boolean}
     */
    hasMainBrush(): boolean;
    /**
     * Returns true if the model has Edge cleaning mode
     * It is assumed that a model can have either an Edge or Spot Area mode
     * @returns {Boolean}
     */
    hasEdgeCleaningMode(): boolean;
    /**
     * Returns true if the model has Spot cleaning mode
     * It is assumed that a model can have either a Spot or Spot Area mode
     * @returns {Boolean}
     */
    hasSpotCleaningMode(): boolean;
    /**
     * @deprecated - please use `hasSpotAreaCleaningMode()` instead
     */
    hasSpotAreas(): boolean;
    /**
     * Returns true if the model has Spot Area cleaning mode
     * @returns {Boolean}
     */
    hasSpotAreaCleaningMode(): boolean;
    /**
     * @deprecated - please use `hasCustomAreaCleaningMode()` instead
     */
    hasCustomAreas(): boolean;
    /**
     * Returns true if the model has mapping capabilities
     * @returns {Boolean}
     */
    hasCustomAreaCleaningMode(): boolean;
    /**
     * Returns true if the model has mapping capabilities
     * @returns {Boolean}
     */
    hasMappingCapabilities(): boolean;
    /**
     * Returns true if the model has mopping functionality
     * @returns {Boolean}
     */
    hasMoppingSystem(): boolean;
    /**
     * Returns true if the model has power adjustment functionality
     * @returns {Boolean}
     */
    hasVacuumPowerAdjustment(): boolean;
    /**
     * Returns true if the model has voice report functionality
     * @returns {Boolean}
     */
    hasVoiceReports(): boolean;
    /**
     * Returns true if the model has an auto empty station
     * @returns {Boolean}
     */
    hasAutoEmptyStation(): boolean;
    /**
     * Returns true if the model supports map images
     * @returns {Boolean}
     */
    isMapImageSupported(): boolean;
    /**
     * Get the product name of the device
     * @returns {string} the product name
     */
    getProductName(): string;
    /**
     * Get the product image URL of the image of the product
     * @returns {string} the URL
     */
    getProductImageURL(): string;
    /**
     * Get the model name of the device
     * @returns {string} the model name
     */
    getModelName(): string;
    /**
     * Get the nickname of the vacuum, if it exists, otherwise return an empty string
     * @returns {string} the nickname
     */
    getName(): string;
    /**
     * Get the nickname of the vacuum, if it exists, otherwise get the product name
     * @returns {string} the nickname, if it has one, or the product name
     */
    getNickname(): string;
    /**
     * Send a command to the vacuum
     * @param {Object} command - a VacBotCommand object
     */
    sendCommand(command: any): void;
    /**
     * @deprecated
     */
    sendPing(): void;
    /**
     * It disconnects the robot
     */
    disconnect(): void;
    /**
     * Get the translated name of a spot area
     * @param {string} name - The name of the area
     * @param {string} [languageCode=en] - The language code of the language you want the area name in
     * @returns {string} The area name in the language specified
     */
    getAreaName_i18n(name: string, languageCode?: string): string;
    /**
     * Replace the `did` and `secret` with "[REMOVED]"
     * @param {string} logData - The log data to be removed
     * @returns {string} The log data with `did` and `secret` removed
     */
    removeFromLogs(logData: string): string;
}
//# sourceMappingURL=vacBot.d.ts.map