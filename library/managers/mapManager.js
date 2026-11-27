'use strict';

const tools = require('../tools');
const map = require('../mapInfo');
const mapTemplate = require('../mapTemplate');
const vectorMap = require('../render/vectorMap');
const dictionary = require('../dictionary');
const VacBotCommand = require('../command');
const constants = require('../constants');

/**
 * @class MapManager
 * Handles all map-related logic, state, and event processing for VacBot.
 */
class MapManager {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot) {
        this.bot = bot;

        // Map State
        this.maps = {};
        this.mapImages = [];
        this.mapVirtualBoundaries = [];
        this.mapVirtualBoundariesResponses = []; // response from vw, mw per mapID
        this.mapSpotAreaInfos = [];
        this.mapVirtualBoundaryInfos = [];
        this.currentMapName = 'unknown';
        this.currentMapMID = '';
        this.currentMapIndex = 0;
        this.currentCustomAreaValues = '';
        this.currentSpotAreas = '';

        this.mapState = null;
        this.multiMapState = null;
        this.mapSet_V2 = null;
        this.liveMapImage = null;
        this.liveMapPendingPieces = null; // set of in-use piece indices awaited before rendering

        this.createMapDataObject = false;
        this.createMapImage = false;
        this.createMapImageOnly = false;
        this.mapDataObject = null;
        this.mapDataObjectQueue = [];
        this.mapImageDataQueue = [];

        this.setupEventListeners();
    }

    /**
     * Set up all the event listeners on the bot for map events.
     */
    setupEventListeners() {
        this.bot.on('Maps', (mapData) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapsEvent(mapData);
                    } catch (e) {
                        tools.envLogInfo(`[MapManager] Error handleMapsEvent: ${e.message}`);
                    }
                })();
            }
        });

        this.bot.on('MapSpotAreas', (spotAreas) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapSpotAreasEvent(spotAreas);
                    } catch (e) {
                        tools.envLogInfo(`[MapManager] Error handleMapSpotAreasEvent: ${e.message}`);
                    }
                })();
            }
        });

        this.bot.on('MapSpotAreaInfo', (spotAreaInfo) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapSpotAreaInfo(spotAreaInfo);
                    } catch (e) {
                        tools.envLogInfo(`[MapManager] Error handleMapSpotAreaInfo: ${e.message}`);
                    }
                })();
            }
        });

        this.bot.on('MapVirtualBoundaries', (virtualBoundaries) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapVirtualBoundaries(virtualBoundaries);
                    } catch (e) {
                        tools.envLogInfo(`[MapManager] Error handleMapVirtualBoundaries: ${e.message}`);
                    }
                })();
            }
        });

        this.bot.on('MapVirtualBoundaryInfo', (virtualBoundaryInfo) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapVirtualBoundaryInfo(virtualBoundaryInfo);
                    } catch (e) {
                        tools.envLogInfo(`[MapManager] Error handleMapVirtualBoundaryInfo: ${e.message}`);
                    }
                })();
            }
        });

        this.bot.on('MapImageData', (mapImageData) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapImageData(mapImageData);
                    } catch (e) {
                        tools.envLogInfo(`[MapManager] Error handleMapImageInfo: ${e.message}`);
                    }
                })();
            }
        });

        this.bot.on('MapDataReady', () => {
            if (this.createMapImage && tools.isCanvasModuleAvailable() && this.bot.is950type()) {
                for (let m = 0; m < this.mapImageDataQueue.length; m++) {
                    const mapID = this.mapImageDataQueue[m]['mapID'];
                    this.bot.run('GetMapInfo', mapID, 'outline', false); // GetMapImage
                }
            }
            if (this.mapDataObject && !this.mapImageDataQueue.length) {
                if (this.createMapImageOnly) {
                    if (this.mapDataObject[0] && this.mapDataObject[0].mapImage) {
                        this.createMapDataObject = false;
                        this.bot.ecovacs.emit('MapImage', this.mapDataObject[0].mapImage);
                        this.createMapImageOnly = false;
                    }
                } else {
                    this.bot.ecovacs.emit('MapDataObject', this.mapDataObject);
                }
            } else if (!this.mapImageDataQueue.length) {
                tools.envLogWarn('mapDataObject is empty');
            }
        });
    }

    /**
     * Handle object with infos about the maps to provide a full map data object
     * @param {Object} mapsData
     * @returns {Promise<void>}
     */
    async handleMapsEvent(mapsData) {
        if (!this.mapDataObject) {
            this.mapDataObject = [];
            for (const m in mapsData['maps']) {
                if (Object.prototype.hasOwnProperty.call(mapsData['maps'], m)) {
                    const mapID = mapsData['maps'][m]['mapID'];
                    this.mapDataObject.push(mapsData['maps'][m].toJSON());
                    this.bot.run('GetSpotAreas', mapID);
                    this.mapDataObjectQueue.push({
                        'type': 'GetSpotAreas',
                        'mapID': mapID
                    });
                    if (this.createMapImage && tools.isCanvasModuleAvailable() && this.bot.is950type()) {
                        this.mapImageDataQueue.push({
                            'type': 'GetMapInfo',
                            'mapID': mapID
                        });
                    }
                }
            }
        }
    }

    /**
     * Handle object with spot area data to provide a full map data object
     * @param {Object} spotAreasObject
     * @returns {Promise<void>}
     */
    async handleMapSpotAreasEvent(spotAreasObject) {
        const mapID = spotAreasObject['mapID'];
        const mapObject = map.getMapObject(this.mapDataObject, mapID);
        if (mapObject) {
            mapObject['mapSpotAreas'] = [];
            for (const s in spotAreasObject['mapSpotAreas']) {
                if (Object.prototype.hasOwnProperty.call(spotAreasObject['mapSpotAreas'], s)) {
                    const mapSpotAreaData = spotAreasObject['mapSpotAreas'][s];
                    const mapSpotAreaID = mapSpotAreaData['mapSpotAreaID'];
                    mapObject['mapSpotAreas'].push(mapSpotAreaData.toJSON());
                    this.bot.run('GetSpotAreaInfo', mapID, mapSpotAreaID);
                    this.mapDataObjectQueue.push({
                        'type': 'GetSpotAreaInfo',
                        'mapID': mapID,
                        'mapSpotAreaID': mapSpotAreaID
                    });
                }
            }
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            return !((item.mapID === mapID) && (item.type === 'GetSpotAreas'));
        });

        this.bot.run('GetVirtualBoundaries', mapID);
        this.mapDataObjectQueue.push({
            'type': 'GetVirtualBoundaries',
            'mapID': mapID
        });
        setTimeout(() => {
            this.handleZeroVirtualBoundariesForMap(mapID);
        }, (this.mapDataObject ? this.mapDataObject.length : 1) * 500);
    }

    /**
     * Handle object with spot area info data to provide a full map data object
     * @param {Object} spotAreaInfo
     * @returns {Promise<void>}
     */
    async handleMapSpotAreaInfo(spotAreaInfo) {
        const mapID = spotAreaInfo['mapID'];
        const mapSpotAreaID = spotAreaInfo['mapSpotAreaID'];
        const spotAreaObject = map.getSpotAreaObject(this.mapDataObject, mapID, mapSpotAreaID);
        if (spotAreaObject) {
            Object.assign(spotAreaObject, spotAreaInfo.toJSON());
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetSpotAreaInfo')) {
                if (item.mapSpotAreaID === mapSpotAreaID) {
                    return false;
                }
            }
            return true;
        });
        this.handleMapDataReady();
    }

    /**
     * Handle object with virtual boundary data to provide a full map data object
     * @param {Object} virtualBoundaries
     * @returns {Promise<void>}
     */
    async handleMapVirtualBoundaries(virtualBoundaries) {
        const mapID = virtualBoundaries['mapID'];
        const mapObject = map.getMapObject(this.mapDataObject, mapID);
        if (mapObject) {
            mapObject['mapVirtualBoundaries'] = [];
            const virtualBoundariesCombined = [...virtualBoundaries['mapVirtualWalls'], ...virtualBoundaries['mapNoMopZones']];
            const virtualBoundaryArray = [];
            for (const i in virtualBoundariesCombined) {
                if (virtualBoundariesCombined.hasOwnProperty(i)) {
                    virtualBoundaryArray[virtualBoundariesCombined[i]['mapVirtualBoundaryID']] = virtualBoundariesCombined[i];
                }
            }
            for (const i in virtualBoundaryArray) {
                if (virtualBoundaryArray.hasOwnProperty(i)) {
                    const mapVirtualBoundaryID = virtualBoundaryArray[i]['mapVirtualBoundaryID'];
                    const mapVirtualBoundaryType = virtualBoundaryArray[i]['mapVirtualBoundaryType'];
                    mapObject['mapVirtualBoundaries'].push(virtualBoundaryArray[i].toJSON());
                    this.bot.run('GetVirtualBoundaryInfo', mapID, mapVirtualBoundaryID, mapVirtualBoundaryType);
                    this.mapDataObjectQueue.push({
                        'type': 'GetVirtualBoundaryInfo',
                        'mapID': mapID,
                        'mapVirtualBoundaryID': mapVirtualBoundaryID,
                        'mapVirtualBoundaryType': mapVirtualBoundaryType
                    });
                }
            }
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            return !((item.mapID === mapID) && (item.type === 'GetVirtualBoundaries'));
        });
        this.handleMapDataReady();
    }

    /**
     * Handle object with virtual boundary info data to provide a full map data object
     * @param {Object} virtualBoundaryInfo
     * @returns {Promise<void>}
     */
    async handleMapVirtualBoundaryInfo(virtualBoundaryInfo) {
        const mapID = virtualBoundaryInfo['mapID'];
        const virtualBoundaryID = virtualBoundaryInfo['mapVirtualBoundaryID'];
        const virtualBoundaryObject = map.getVirtualBoundaryObject(this.mapDataObject, mapID, virtualBoundaryID);
        if (virtualBoundaryObject) {
            Object.assign(virtualBoundaryObject, virtualBoundaryInfo.toJSON());
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetVirtualBoundaryInfo')) {
                if (item.mapVirtualBoundaryType === virtualBoundaryInfo.mapVirtualBoundaryType) {
                    if (item.mapVirtualBoundaryID === virtualBoundaryID) {
                        return false;
                    }
                }
            }
            return true;
        });
        this.handleMapDataReady();
    }

    /**
     * Handle the scenario when there are zero virtual boundaries configured for a map.
     * @param {string} mapID - The ID of the map.
     */
    handleZeroVirtualBoundariesForMap(mapID) {
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            return !((item.mapID === mapID) && (item.type === 'GetVirtualBoundaries'));
        });
        this.handleMapDataReady();
    }

    /**
     * Handle object with map image data to provide a full map data object
     * @param {Object} mapImageData
     * @returns {Promise<void>}
     */
    async handleMapImageData(mapImageData) {
        const mapID = mapImageData['mapID'];
        const mapObject = map.getMapObject(this.mapDataObject, mapID);
        if (mapObject) {
            mapObject['mapImage'] = mapImageData;
        }
        this.mapImageDataQueue = this.mapImageDataQueue.filter(item => {
            return !((item.mapID === mapID) && (item.type === 'GetMapInfo'));
        });
        if ((this.mapImageDataQueue.length === 0) || this.createMapImageOnly) {
            this.handleMapDataReady();
        }
    }

    /**
     * Check if all map data components are ready and emit MapDataReady.
     */
    handleMapDataReady() {
        if (this.mapDataObjectQueue.length === 0) {
            this.bot.ecovacs.emit('MapDataReady');
        }
    }

    /**
     * Handle the payload of the `MapState` response/message
     * @param {Object} payload
     */
    handleMapState(payload) {
        this.mapState = payload['state'];
    }

    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload) {
        this.multiMapState = payload['enable'];
    }

    /**
     * Handle the payload of the `CachedMapInfo` response/message.
     * @param {Object} payload - The message payload.
     */
    handleCachedMapInfo(payload) {
        this.currentMapName = 'unknown';
        this.maps = { 'maps': [] };
        const info = payload['info'];
        for (const mapIndex in info) {
            if (info.hasOwnProperty(mapIndex)) {
                if (info[mapIndex]['mid'] !== '0') {
                    const data = info[mapIndex];
                    const ecovacsMap = new map.EcovacsMap(
                        data['mid'], data['index'], data['name'], data['status'], data['using'], data['built']
                    );
                    this.maps['maps'].push(ecovacsMap);
                    if (info[mapIndex]['using'] === 1) {
                        this.currentMapMID = data['mid'];
                        this.currentMapName = data['name'];
                        this.currentMapIndex = data['index'];
                    }
                }
            }
        }
    }

    /**
     * Handle the payload of the 'MapInfo_V2' response/message
     * @param {Object} payload
     */
    async handleMapInfoV2(payload) {
        this.currentMapMID = payload['mid'];
        tools.envLogNotice(`[MapManager] MapInfo_V2 mid: ${this.currentMapMID} type: ${payload['type']} infoSize: ${payload['infoSize']}`);
        // Newer devices (T80/T80S/X8 OMNI ...) deliver the active map as a vector
        // floor plan in the base64 + Zstandard `info` field, not as raster pieces.
        // Decode it and render a PNG so consumers get a map image via 'MapImage'.
        if (!payload['info']) {
            return;
        }
        try {
            const decoded = await mapTemplate.decompressToString(payload['info']);
            if (!decoded) {
                // e.g. zstd unsupported on this Node runtime (< 22.15)
                tools.envLogWarn('[MapManager] Could not decode MapInfo_V2 info payload');
                return;
            }
            const vector = JSON.parse(decoded);
            const dataURL = vectorMap.renderVectorMapPNG(vector, {
                deebotPosition: this.bot.deebotPosition,
                chargePosition: this.bot.chargePosition
            });
            if (!dataURL) {
                tools.envLogInfo('[MapManager] MapInfo_V2 vector produced no renderable geometry');
                return;
            }
            this.mapImageV2 = dataURL;
            this.bot.ecovacs.emit('MapImageV2', { mapID: this.currentMapMID, mapBase64PNG: dataURL });
            this.bot.ecovacs.emit('MapImage', dataURL);
        } catch (e) {
            tools.envLogError(`[MapManager] Error rendering MapInfo_V2 map: ${e.message}`);
        }
    }

    /**
     * Handle the payload of the 'MapInfo_V2' response/message (Yeedi)
     * @param {Object} payload
     */
    handleMapInfoV2_Yeedi(payload) {
        this.currentMapMID = payload['mid'];
        this.currentMapName = 'standard';
        this.currentMapIndex = 0;
        this.maps = { 'maps': [] };
        this.maps['maps'].push(
            new map.EcovacsMap(
                this.currentMapMID, this.currentMapIndex, this.currentMapName, 1, 1, 1
            )
        );
    }

    /**
     * Handle the payload of the 'MapSet' response/message
     * @param {Object} payload
     */
    handleMapSet(payload) {
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MapSet');
                return { mapsetEvent: 'skip' };
            }
        }
        if (payload['subsets'] && !payload['subsets'].length) {
            tools.envLogWarn('Skipping message: subsets empty');
            return { mapsetEvent: 'skip' };
        }
        if (payload['type'] === 'ar') {
            const mapSpotAreas = new map.EcovacsMapSpotAreas(mapID, payload['msid']);
            for (const mapIndex in payload['subsets']) {
                if (payload['subsets'].hasOwnProperty(mapIndex)) {
                    mapSpotAreas.push(
                        new map.EcovacsMapSpotArea(payload['subsets'][mapIndex]['mssid'])
                    );
                }
            }
            return {
                mapsetEvent: 'MapSpotAreas',
                mapsetData: mapSpotAreas
            };
        } else if ((payload['type'] === 'vw') || (payload['type'] === 'mw')) {
            if (typeof this.mapVirtualBoundaries[mapID] === 'undefined') {
                // initialize array for mapVirtualBoundaries if not existing
                this.mapVirtualBoundaries[mapID] = new map.EcovacsMapVirtualBoundaries(mapID);
                this.mapVirtualBoundariesResponses[mapID] = [false, false];
            }
            for (const mapIndex in payload['subsets']) {
                if (payload['subsets'].hasOwnProperty(mapIndex)) {
                    this.mapVirtualBoundaries[mapID].push(
                        new map.EcovacsMapVirtualBoundary(payload['subsets'][mapIndex]['mssid'], payload['type'])
                    );
                }
            }
            if (payload['type'] === 'vw') {
                this.mapVirtualBoundariesResponses[mapID][0] = true;
            } else if (payload['type'] === 'mw') {
                this.mapVirtualBoundariesResponses[mapID][1] = true;
            }
            if (this.mapVirtualBoundariesResponses[mapID][0] && this.mapVirtualBoundariesResponses[mapID][1]) {
                // only return if both responses were processed
                return {
                    mapsetEvent: 'MapVirtualBoundaries',
                    mapsetData: this.mapVirtualBoundaries[mapID]
                };
            } else {
                tools.envLogWarn(`Skipping mapVirtualBoundaries for map ` + mapID);
                return { mapsetEvent: 'skip' };
            }
        }

        tools.envLogWarn(`unknown mapset type: ${JSON.stringify(payload['type'])}`);
        return { mapsetEvent: 'error' };
    }

    /**
     * Handle the payload of the 'MapSubSet' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapSubset(payload) {
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MapSubset');
                return { mapsubsetEvent: 'error' };
            }
        }
        if (payload['type'] === 'ar') {
            let mapSpotAreaBoundaries = payload['value'];
            if (payload['compress']) {
                // Compressed boundaries are a coordinate *string* ("x,y;x,y;…"), not pixels.
                mapSpotAreaBoundaries = await mapTemplate.decompressToString(payload['value']);
            }
            let customName = '';
            if (payload['name']) {
                customName = payload['name'];
            }
            //TODO: filter out reportMapSubSet events (missing data)
            //reportMapSubSet event comes without map reference, replace
            const mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
                mapID,
                payload['mssid'],
                payload['connections'], //reportMapSubSet event comes without connections
                mapSpotAreaBoundaries,
                payload['subtype'],
                customName
            );
            // Cleaning preference
            if (payload.hasOwnProperty('cleanset') && (payload['cleanset'] !== '')) {
                mapSpotAreaInfo.setCleanSet(payload['cleanset']);
            }
            // Cleaning sequence
            if (payload.hasOwnProperty('index')) {
                mapSpotAreaInfo.setSequenceNumber(payload['index']);
            }
            if (typeof this.mapSpotAreaInfos[mapID] === 'undefined') {
                this.mapSpotAreaInfos[mapID] = []; //initialize array for mapSpotAreaInfos if not existing
            }
            this.mapSpotAreaInfos[mapID][payload['mssid']] = mapSpotAreaInfo;
            return {
                mapsubsetEvent: 'MapSpotAreaInfo',
                mapsubsetData: mapSpotAreaInfo
            };
        } else if ((payload['type'] === 'vw') || (payload['type'] === 'mw')) {
            const mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(mapID, payload['mssid'], payload['type'], payload['value']);
            if (typeof this.mapVirtualBoundaryInfos[mapID] === 'undefined') {
                this.mapVirtualBoundaryInfos[mapID] = []; //initialize array for mapVirtualBoundaryInfos if not existing
            }
            this.mapVirtualBoundaryInfos[mapID][payload['mssid']] = mapVirtualBoundaryInfo;
            return {
                mapsubsetEvent: 'MapVirtualBoundaryInfo',
                mapsubsetData: mapVirtualBoundaryInfo
            };
        }

        tools.envLogWarn(`unknown mapset type: ${JSON.stringify(payload['type'])}`);
        return { mapsubsetEvent: 'error' };
    }

    /**
     * Handle the payload of the `MapSet_V2` response/message
     * @param {Object} payload
     */
    async handleMapSet_V2(payload) {
        let subsets = payload['subsets'];
        if (typeof subsets === 'string') {
            subsets = JSON.parse(await mapTemplate.decompressToString(subsets));
        }
        if ((subsets !== undefined) && Array.isArray(subsets)) {
            const type = payload['type'];
            const subsetData = [];
            subsets.forEach((subset) => {
                const mssid = subset[0];
                const name = subset[1];
                const subtype = subset[2];
                const areaConnections = subset[3];
                const index = subset[4];
                const spotPosition = subset[5] + ',' + subset[6];
                const cleanCount = subset[7].split('-')[0];
                const cleanSpeed = subset[7].split('-')[1];
                const waterLevel = subset[7].split('-')[2];
                const singleSubsetData = {
                    'index': index,
                    'mssid': mssid,
                    'name': name,
                    'subtype': subtype,
                    'type': type,
                    'areaConnections': areaConnections.replace(/-/g, ','),
                    'cleanCount': Number(cleanCount),
                    'cleanSpeed': dictionary.CLEAN_SPEED_FROM_ECOVACS[cleanSpeed],
                    'waterLevel': Number(waterLevel),
                    'spotPosition': spotPosition
                };
                subsetData.push(singleSubsetData);
            });
            this.mapSet_V2 = {
                'mid': payload['mid'],
                'subsets': subsetData
            };
        }
    }

    /**
     * Handle the payload of the 'MapInfo' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapImage(payload) {
        let mapID = payload['mid'];
        const type = payload['type'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MapImage');
                throw new Error('mid is not a number');
            }
        }
        if (typeof this.mapImages[mapID] === 'undefined') {
            this.mapImages[mapID] = [];
        }
        if (typeof this.mapImages[mapID][type] === 'undefined') {
            this.mapImages[mapID][type] = new mapTemplate.EcovacsMapImage(
                mapID, type,
                payload['totalWidth'], payload['totalHeight'],
                payload['pixel'], payload['totalCount']
            );
        }
        if (payload['pieceValue'] !== '') {
            await this.mapImages[mapID][type].updateMapPiece(
                payload['index'],
                payload['startX'], payload['startY'],
                payload['width'], payload['height'],
                payload['crc'], payload['value']
            );
        }
        try {
            return await this.mapImages[mapID][type].getBase64PNG(
                this.bot.deebotPosition, this.bot.chargePosition, this.currentMapMID, this.mapDataObject
            );
        } catch (e) {
            tools.envLogError(`error calling getBase64PNG: ${e.message}`);
            throw new Error(`error calling getBase64PNG: ${e.message}`, { cause: e });
        }
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    async handleMajorMap(payload) {
        tools.envLogPayload(payload);
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MajorMap');
                return null;
            }
        }
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }

        // (Re)create the live map image when the map changes, otherwise refresh its piece CRCs.
        if (!this.liveMapImage || (this.liveMapImage.mapID !== mapID)) {
            this.liveMapImage = new mapTemplate.EcovacsLiveMapImage(
                mapID, payload['type'] || 'ol',
                payload['pieceWidth'], payload['pieceHeight'],
                payload['cellWidth'], payload['cellHeight'],
                payload['pixel'], payload['value']
            );
            await this.liveMapImage.initCanvas(); // ensure the canvas exists before pieces arrive
        } else {
            this.liveMapImage.updateMapDataPiecesCrc(payload['value']);
        }

        // Request only the pieces that are actually in use (non-empty CRC) and track them
        // so the image is rendered once the full set has been received.
        const crcArray = String(payload['value']).split(',');
        this.liveMapPendingPieces = new Set();
        for (let c = 0; c < crcArray.length; c++) {
            if (crcArray[c] !== constants.CRC_EMPTY_PIECE) {
                this.liveMapPendingPieces.add(c);
                this.bot.ecovacs.sendCommand(new VacBotCommand.GetMinorMap(mapID, c));
            }
        }
        return null;
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    async handleMinorMap(payload) {
        tools.envLogPayload(payload);
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MinorMap');
                return null;
            }
        }
        if (!this.liveMapImage || (this.liveMapImage.mapID !== mapID)) {
            return null;
        }
        const pieceIndex = payload['pieceIndex'];
        const pieceValue = payload['pieceValue'];
        if ((pieceValue === undefined) || (pieceValue === '')) {
            return null;
        }

        await this.liveMapImage.updateMapPiece(pieceIndex, pieceValue);

        // Wait until every in-use piece has arrived before rendering, to avoid
        // re-rendering the whole map for each of the (up to 64) individual pieces.
        if (this.liveMapPendingPieces) {
            this.liveMapPendingPieces.delete(pieceIndex);
            if (this.liveMapPendingPieces.size > 0) {
                return null;
            }
        }

        try {
            return await this.liveMapImage.getBase64PNG(
                this.bot.deebotPosition, this.bot.chargePosition, mapID, this.mapDataObject
            );
        } catch (e) {
            tools.envLogError(`error rendering live map: ${e.message}`);
            return null;
        }
    }

    /**
     * Handle the payload of the `MapTrace` response/message.
     * @param {Object} payload - The message payload.
     */
    async handleMapTrace(payload) {
        tools.envLogPayload(payload);
    }

    /**
     * Get the name of the spot area that the bot is currently in
     * @param {string} currentSpotAreaID - the ID of the spot area that the player is currently in
     * @returns {string} the name of the current spot area
     */
    getSpotAreaName(currentSpotAreaID) {
        let currentSpotAreaName = 'unknown';
        const mapInfo = this.mapSpotAreaInfos[this.currentMapMID];
        if (mapInfo && mapInfo[currentSpotAreaID]) {
            currentSpotAreaName = mapInfo[currentSpotAreaID].mapSpotAreaName;
        }
        return currentSpotAreaName;
    }
}

module.exports = MapManager;
