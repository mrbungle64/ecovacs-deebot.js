export = MapManager;
/**
 * @class MapManager
 * Handles all map-related logic, state, and event processing for VacBot.
 */
declare class MapManager {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot: import("../vacBot"));
    bot: import("../vacBot");
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
    mapState: any;
    multiMapState: any;
    mapSet_V2: {
        mid: any;
        subsets: any[];
    } | null;
    liveMapImage: mapTemplate.EcovacsLiveMapImage | null;
    liveMapPendingPieces: Set<any> | null;
    createMapDataObject: boolean;
    createMapImage: boolean;
    createMapImageOnly: boolean;
    mapDataObject: any[] | null;
    mapDataObjectQueue: any[];
    mapImageDataQueue: any[];
    /**
     * Set up all the event listeners on the bot for map events.
     */
    setupEventListeners(): void;
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
    /**
     * Handle the scenario when there are zero virtual boundaries configured for a map.
     * @param {string} mapID - The ID of the map.
     */
    handleZeroVirtualBoundariesForMap(mapID: string): void;
    /**
     * Handle object with map image data to provide a full map data object
     * @param {Object} mapImageData
     * @returns {Promise<void>}
     */
    handleMapImageData(mapImageData: Object): Promise<void>;
    /**
     * Check if all map data components are ready and emit MapDataReady.
     */
    handleMapDataReady(): void;
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
     * Handle the payload of the `CachedMapInfo` response/message.
     * @param {Object} payload - The message payload.
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
    handleMajorMap(payload: Object): Promise<null>;
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
    /**
     * Handle the payload of the `MapTrace` response/message.
     * @param {Object} payload - The message payload.
     */
    handleMapTrace(payload: Object): Promise<void>;
    /**
     * Get the name of the spot area that the bot is currently in
     * @param {string} currentSpotAreaID - the ID of the spot area that the player is currently in
     * @returns {string} the name of the current spot area
     */
    getSpotAreaName(currentSpotAreaID: string): string;
}
import mapTemplate = require("../mapTemplate");
//# sourceMappingURL=mapManager.d.ts.map