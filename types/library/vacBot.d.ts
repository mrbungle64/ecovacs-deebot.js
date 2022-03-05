export = VacBot;
declare class VacBot {
    constructor(user: any, hostname: any, resource: any, secret: any, vacuum: any, continent: any, country: any, server_address?: any);
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
    stop(): void;
    pause(mode?: string): void;
    resume(): void;
    playSound(soundID?: number): void;
    run(action: any, ...args: any[]): void;
    handleMapsEvent(mapData: any): Promise<void>;
    handleMapSpotAreasEvent(spotAreas: any): Promise<void>;
    handleMapVirtualBoundaries(virtualBoundaries: any): Promise<void>;
    handleMapSpotAreaInfo(spotAreaInfo: any): Promise<void>;
    handleMapVirtualBoundaryInfo(virtualBoundaryInfo: any): Promise<void>;
    handleMapImageInfo(mapImageInfo: any): Promise<void>;
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
    isN79series(): boolean;
    isSupportedDevice(): boolean;
    isKnownDevice(): boolean;
    getDeviceProperty(property: any, defaultValue?: boolean): any;
    hasMainBrush(): any;
    hasEdgeCleaningMode(): boolean;
    hasSpotCleaningMode(): boolean;
    /**
     * @deprecated
     */
    hasSpotAreas(): any;
    hasSpotAreaCleaningMode(): any;
    /**
     * @deprecated
     */
    hasCustomAreas(): any;
    hasCustomAreaCleaningMode(): any;
    hasMappingCapabilities(): any;
    hasMoppingSystem(): any;
    hasVacuumPowerAdjustment(): any;
    hasVoiceReports(): any;
    hasAutoEmptyStation(): any;
    isMapImageSupported(): any;
    /**
     * Get the device id for the vacuum
     * @returns {string} the device ID
     */
    getVacBotDeviceId(): string;
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
     * @returns {string} the nickname if it exists, otherwise it returns an empty string
     */
    getName(): string;
    /**
     * Get the nickname of the vacuum, if it exists, otherwise get the product name
     * @returns {string} the vacuum's nickname, if it has one, or the product name
     */
    getNickname(): string;
    /**
     * Send a command to the vacuum
     * @param {Object} action - A VacBotCommand object
     */
    sendCommand(action: any): void;
    /**
     * Send a ping to the server
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