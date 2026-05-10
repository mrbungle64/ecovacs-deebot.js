'use strict';

const tools = require('./tools');
const map = require('./mapInfo');
const mapTemplate = require('./mapTemplate');
const dictionary = require('./dictionary');
const VacBotCommand = require('./command');

/**
 * @class MapManager
 * Handles all map-related logic, state, and event processing for VacBot.
 */
class MapManager {
    /**
     * @param {VacBot} bot - The VacBot instance.
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

        this.createMapDataObject = false;
        this.createMapImage = false;
        this.createMapImageOnly = false;
        this.mapDataObject = null;
        this.mapDataObjectQueue = [];
        this.mapImageDataQueue = [];

        this.setupEventListeners();
    }

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

    handleZeroVirtualBoundariesForMap(mapID) {
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            return !((item.mapID === mapID) && (item.type === 'GetVirtualBoundaries'));
        });
        this.handleMapDataReady();
    }

    handleMapDataReady() {
        if (this.mapDataObjectQueue.length === 0) {
            this.bot.ecovacs.emit('MapDataReady');
        }
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

    handleCachedMapInfo(payload) {
        this.currentMapName = 'unknown';
        this.maps = { 'maps': [] };
        const info = payload['info'];
        for (let mapIndex in info) {
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
    handleMapInfoV2(payload) {
        this.currentMapMID = payload['mid'];
        tools.envLogNotice(`mid: ${this.currentMapMID}`);
        tools.envLogNotice(`batid: ${payload['batid']}`);
        tools.envLogNotice(`serial: ${payload['serial']}`);
        tools.envLogNotice(`index: ${payload['index']}`);
        tools.envLogNotice(`type: ${payload['type']}`);
        tools.envLogNotice(`outlineVer: ${payload['outlineVer']}`);
        tools.envLogNotice(`info: ${payload['info']}`);
        tools.envLogNotice(`infoSize: ${payload['infoSize']}`);
        tools.envLogNotice(`using: ${payload['using']}`);
        tools.envLogNotice(`outlineCpmplete: ${payload['outlineCpmplete']}`); // The typo in 'Cpmplete' is intended
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
            let mapSpotAreas = new map.EcovacsMapSpotAreas(mapID, payload['msid']);
            for (let mapIndex in payload['subsets']) {
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
            for (let mapIndex in payload['subsets']) {
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
                mapSpotAreaBoundaries = await mapTemplate.mapPieceToIntArray(payload['value']);
            }
            let customName = '';
            if (payload['name']) {
                customName = payload['name'];
            }
            //TODO: filter out reportMapSubSet events (missing data)
            //reportMapSubSet event comes without map reference, replace
            let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
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
            let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(mapID, payload['mssid'], payload['type'], payload['value']);
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
            subsets = JSON.parse(await mapTemplate.mapPieceToIntArray(subsets));
        }
        if ((subsets !== undefined) && Array.isArray(subsets)) {
            const type = payload['type'];
            let subsetData = [];
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
            throw new Error(`error calling getBase64PNG: ${e.message}`);
        }
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload) {
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
        const crcList = payload['value'];
        if (!this.liveMapImage || (this.liveMapImage.mapID !== mapID)) {
            const crcArray = crcList.split(',');
            for (let c = 0; c < crcArray.length; c++) {
                if (crcArray[c] !== '00000000') { // constants.CRC_EMPTY_PIECE
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMinorMap(mapID, c));
                }
            }
            // TODO: Implement liveMapImage
            // this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapTrace());
            // TODO: handle liveMapImage
            // if (HANDLE_LIVE_MAP) ...
        } else {
            // TODO: handle liveMapImage
        }
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
        // TODO: finish implementation
    }

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
