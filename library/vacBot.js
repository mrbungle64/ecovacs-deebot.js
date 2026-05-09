'use strict';

const tools = require('./tools');
const VacBotCommand = require('./command');
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

        // OnOff
        this.doNotDisturbEnabled = null;
        this.continuousCleaningEnabled = null;
        this.voiceReportDisabled = null;

        this.commandsSent = [];
        this.mapPiecePacketsSent = [];

        this.createMapDataObject = false;
        this.createMapImage = false;
        this.createMapImageOnly = false;
        this.mapDataObject = null;
        this.mapDataObjectQueue = [];
        this.mapImageDataQueue = [];

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

        this.ecovacs.on('ready', () => {
            tools.envLogInfo(`[VacBot] Ready event!`);
            this.is_ready = true;
        });

        this.on('Maps', (mapData) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapsEvent(mapData);
                    } catch (e) {
                        tools.envLogInfo(`[vacBot] Error handleMapsEvent: ${e.message}`);
                    }
                })();
            }
        });

        this.on('MapSpotAreas', (spotAreas) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapSpotAreasEvent(spotAreas);
                    } catch (e) {
                        tools.envLogInfo(`[vacBot] Error handleMapSpotAreasEvent: ${e.message}`);
                    }
                })();
            }
        });

        this.on('MapSpotAreaInfo', (spotAreaInfo) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapSpotAreaInfo(spotAreaInfo);
                    } catch (e) {
                        tools.envLogInfo(`[vacBot] Error handleMapSpotAreaInfo: ${e.message}`);
                    }
                })();
            }
        });

        this.on('MapVirtualBoundaries', (virtualBoundaries) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapVirtualBoundaries(virtualBoundaries);
                    } catch (e) {
                        tools.envLogInfo(`[vacBot] Error handleMapVirtualBoundaries: ${e.message}`);
                    }
                })();
            }
        });

        this.on('MapVirtualBoundaryInfo', (virtualBoundaryInfo) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapVirtualBoundaryInfo(virtualBoundaryInfo);
                    } catch (e) {
                        tools.envLogInfo(`[vacBot] Error handleMapVirtualBoundaryInfo: ${e.message}`);
                    }
                })();
            }
        });

        this.on('MapImageData', (mapImageData) => {
            if (this.createMapDataObject) {
                (async () => {
                    try {
                        await this.handleMapImageData(mapImageData);
                    } catch (e) {
                        tools.envLogInfo(`[vacBot] Error handleMapImageInfo: ${e.message}`);
                    }
                })();
            }
        });

        this.on('MapDataReady', () => {
            if (this.createMapImage && tools.isCanvasModuleAvailable() && this.is950type()) {
                for (let m = 0; m < this.mapImageDataQueue.length; m++) {
                    const mapID = this.mapImageDataQueue[m]['mapID'];
                    this.run('GetMapInfo', mapID, 'outline', false); // GetMapImage
                }
            }
            if (this.mapDataObject && !this.mapImageDataQueue.length) {
                if (this.createMapImageOnly) {
                    if (this.mapDataObject[0] && this.mapDataObject[0].mapImage) {
                        this.createMapDataObject = false;
                        this.ecovacs.emit('MapImage', this.mapDataObject[0].mapImage);
                        this.createMapImageOnly = false;
                    }
                } else {
                    this.ecovacs.emit('MapDataObject', this.mapDataObject);
                }
            } else {
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
                    this.run('GetSpotAreas', mapID);
                    this.mapDataObjectQueue.push({
                        'type': 'GetSpotAreas',
                        'mapID': mapID
                    });
                    if (this.createMapImage && tools.isCanvasModuleAvailable() && this.is950type()) {
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
                    this.run('GetSpotAreaInfo', mapID, mapSpotAreaID);
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

        this.run('GetVirtualBoundaries', mapID);
        this.mapDataObjectQueue.push({
            'type': 'GetVirtualBoundaries',
            'mapID': mapID
        });
        setTimeout(() => {
            this.handleZeroVirtualBoundariesForMap(mapID);
        }, this.mapDataObject.length * 500);
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
                    this.run('GetVirtualBoundaryInfo', mapID, mapVirtualBoundaryID, mapVirtualBoundaryType);
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
            this.ecovacs.emit('MapDataReady');
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
            this.ecovacs.emit('MapDataReady');
        }
    }

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

        // Commands with special logic (model branching, validation, side-effects)
        switch (key) {
            case 'Generic': {
                this.ecovacs.sendCommand(new this.vacBotCommand.Generic(args[0], args[1]));
                this.genericCommand = args[0];
                break;
            }
            case 'SpotArea': {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.ecovacs.sendCommand(new this.vacBotCommand.SpotArea('start', area, cleanings));
                }
                break;
            }
            case 'CustomArea': {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.ecovacs.sendCommand(new this.vacBotCommand.CustomArea('start', area, cleanings));
                }
                break;
            }
            case 'Pause': {
                if (this.isModelTypeAirbot() || this.isModelTypeX2()) {
                    // Airbot Z1 and Deebot X2 series
                    const command = 'clean_V2';
                    this.ecovacs.sendCommand(new this.vacBotCommand.Pause(command));
                } else if (args[0] !== undefined) {
                    // Legacy models
                    const mode = args[0];
                    this.ecovacs.sendCommand(new this.vacBotCommand.Pause(mode));
                } else {
                    // Standard
                    this.ecovacs.sendCommand(new this.vacBotCommand.Pause());
                }
                break;
            }
            case 'Stop':
                if (this.isModelTypeAirbot() || this.isModelTypeX2()) {
                    this.ecovacs.sendCommand(new this.vacBotCommand.Stop('clean_V2'));
                } else {
                    this.ecovacs.sendCommand(new this.vacBotCommand.Stop());
                }
                break;
            case 'Resume':
                if (this.isModelTypeAirbot() || this.isModelTypeX2()) {
                    this.ecovacs.sendCommand(new this.vacBotCommand.Resume('clean_V2'));
                } else {
                    this.ecovacs.sendCommand(new this.vacBotCommand.Resume());
                }
                break;
            case 'PlaySound': {
                let sid = args[0] || 0;
                this.ecovacs.sendCommand(new this.vacBotCommand.PlaySound(Number(sid)));
                break;
            }
            case 'ResetLifeSpan': {
                const component = args[0];
                if (component !== '') {
                    this.ecovacs.sendCommand(new this.vacBotCommand.ResetLifeSpan(component));
                }
                break;
            }
            case 'SetWaterLevel': {
                const amount = Number(args[0]);
                const sweepType = Number(args[1]);
                if ((amount >= 1) && (amount <= 4)) {
                    if ((sweepType === 1) || (sweepType === 2)) {
                        this.ecovacs.sendCommand(new this.vacBotCommand.SetWaterLevel(amount, sweepType));
                    } else {
                        this.ecovacs.sendCommand(new this.vacBotCommand.SetWaterLevel(amount));
                    }
                }
                break;
            }
            case 'SetCleanSpeed': {
                const level = Number(args[0]);
                if ((level >= 1) && (level <= 4)) {
                    this.ecovacs.sendCommand(new this.vacBotCommand.SetCleanSpeed(level));
                }
                break;
            }
            case 'move': {
                const command = args[0];
                if (command !== '') {
                    this.ecovacs.sendCommand(new this.vacBotCommand.Move(command));
                }
                break;
            }
            case 'GetMapInfo':
            case 'getmapimage': {
                const mapID = args[0].toString(); // mapID has to be a string
                const mapType = args[1] || 'outline';
                this.createMapDataObject = true;
                this.createMapImage = true;
                this.createMapImageOnly = args[2] !== undefined ? args[2] : true;
                if (Number(mapID) > 0) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapInfo(mapID, mapType));
                }
                break;
            }
            case 'GetMaps':
            case 'GetCachedMapInfo':
                this.ecovacs.sendCommand(new VacBotCommand.GetMapState());
                this.ecovacs.sendCommand(new VacBotCommand.GetMajorMap());
                this.createMapImageOnly = false;
                this.createMapDataObject = !!args[0] || false;
                this.createMapImage = this.createMapDataObject && this.isMapImageSupported();
                if (args.length >= 2) {
                    this.createMapImage = !!args[1];
                }
                // Workaround for some yeedi models (e.g. yeedi mop station)
                // TODO: Find a better solution
                if ((this.deviceClass === 'p5nx9u') || (this.deviceClass === 'vthpeg')) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2_Yeedi());
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.GetCachedMapInfo());
                }
                break;
            case 'BackupMap':
                if (args.length === 0) { // Airbot Z1
                    this.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('backup'));
                } else if (args.length === 1) { // e.g. Deebot X1 series
                    const mid = args[0];
                    this.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('backup', mid));
                }
                break;
            case 'RestoreMap':
                if (args.length === 0) { // Airbot Z1
                    this.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('restore'));
                } else if (args.length === 2) { // e.g. Deebot X1 series
                    const mid = args[0];
                    const reMid = args[1]; // backupId
                    this.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('restore', mid, reMid));
                }
                break;
            case 'GetSpotAreas': {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapSpotAreas(mapID));
                }
                break;
            }
            case 'GetMapInfo_V2':
                if (args.length === 1) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0]));
                } else if (args.length >= 2) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0], args[1]));
                }
                break;
            case 'GetMapSet_V2':
                if (args.length === 1) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapSet_V2(args[0]));
                } else if (args.length >= 2) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapSet_V2(args[0], args[1]));
                }
                break;
            case 'SetMapSet_V2':
                if ((args.length >= 2) && (typeof args[1] === 'object')) {
                    this.ecovacs.sendCommand(new VacBotCommand.SetMapSet_V2(args[0], args[1]));
                }
                break;
            case 'GetSpotAreaInfo': {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapSpotAreaInfo(mapID, spotAreaID));
                }
                break;
            }
            case 'GetVirtualBoundaries': {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    if (typeof this.mapVirtualBoundariesResponses[mapID] === 'undefined') {
                        this.mapVirtualBoundariesResponses[mapID] = [false, false];
                    } else {
                        this.mapVirtualBoundariesResponses[mapID][0] = false;
                        this.mapVirtualBoundariesResponses[mapID][1] = false;
                    }
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'vw'));
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'mw'));
                }
                break;
            }
            case 'GetVirtualBoundaryInfo': {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    this.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaryInfo(mapID, spotAreaID, type));
                }
                break;
            }
            case 'AddVirtualBoundary': {
                const mapID = args[0]; // mapID is a string
                const coordinates = args[1];
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (coordinates !== '')) {
                    this.ecovacs.sendCommand(new VacBotCommand.AddMapVirtualBoundary(mapID, coordinates, type));
                }
                break;
            }
            case 'DeleteVirtualBoundary': {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = args[2];
                if ((Number(mapID) > 0) && (Number(spotAreaID) >= 0) && (tools.isValidVirtualWallType(type))) {
                    this.ecovacs.sendCommand(new VacBotCommand.DeleteMapVirtualBoundary(mapID, spotAreaID, type));
                }
                break;
            }
            case 'GetLifeSpan': {
                if (!args.length) {
                    this.emitFullLifeSpanEvent = true;
                    this.components = {};
                    this.lastComponentValues = {};
                    if (this.isModelTypeAirbot()) {
                        this.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan([]));
                    } else {
                        const componentsArray = [];
                        if (this.hasFilter()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['filter']);
                        }
                        if (this.hasSideBrush()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['side_brush']);
                        }
                        if (this.hasMainBrush()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['main_brush']);
                        }
                        if (this.hasUnitCareInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['unit_care']);
                        }
                        if (this.hasRoundMopInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['round_mop']);
                        }
                        if (this.hasAirFreshenerInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['air_freshener']);
                        }
                        if (componentsArray.length) {
                            this.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
                        }
                    }
                } else {
                    this.emitFullLifeSpanEvent = false;
                    const component = args[0];
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS[component]
                    ];
                    this.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
                }
                break;
            }
            case 'EnableDoNotDisturb': {
                const start = args[0];
                const end = args[1];
                if ((start !== '') && (end !== '')) {
                    this.run('SetDoNotDisturb', 1, start, end);
                } else {
                    this.run('SetDoNotDisturb', 1);
                }
                break;
            }
            case 'DisableDoNotDisturb': {
                this.run('SetDoNotDisturb', 0);
                break;
            }
            case 'SetBlock':
            case 'SetDoNotDisturb': {
                const enable = Number(!!args[0]);
                const start = args[1];
                const end = args[2];
                if ((start !== '') && (end !== '')) {
                    this.ecovacs.sendCommand(new VacBotCommand.SetDoNotDisturb(enable, start, end));
                } else if (args.length >= 1) {
                    this.ecovacs.sendCommand(new VacBotCommand.SetDoNotDisturb(enable));
                }
                break;
            }
            case 'GetCleanLogs':
                if (this.isModelTypeT9Based()) {
                    this.callCleanResultsLogsApi().then((logData) => {
                        this.handleCleanLogs(logData);
                        this.emitCleanLogEvents();
                    });
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.GetCleanLogs());
                }
                break;
            case 'GetTrueDetect':
                if (this.getCmdForObstacleDetection() === 'Recognization') {
                    this.ecovacs.sendCommand(new VacBotCommand.GetRecognization());
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.GetTrueDetect());
                }
                break;
            case 'EnableAIVI':
            case 'EnableAIVI3D':
            case 'EnableTrueDetect':
                if (this.getCmdForObstacleDetection() === 'Recognization') {
                    this.ecovacs.sendCommand(new VacBotCommand.SetRecognization(1));
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(1));
                }
                break;
            case 'DisableAIVI':
            case 'DisableAIVI3D':
            case 'DisableTrueDetect':
                if (this.getCmdForObstacleDetection() === 'Recognization') {
                    this.ecovacs.sendCommand(new VacBotCommand.SetRecognization(0));
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(0));
                }
                break;
            case 'SetAIVI':
            case 'SetAIVI3D':
            case 'SetTrueDetect':
                if (this.getCmdForObstacleDetection() === 'Recognization') {
                    this.ecovacs.sendCommand(new VacBotCommand.SetRecognization(args[0]));
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(args[0]));
                }
                break;
            case 'EmptyDustBin':
            case 'EmptySuctionStation':
                if (this.isModelTypeT20() || this.isModelTypeX2()) {
                    this.ecovacs.sendCommand(new VacBotCommand.EmptyDustBinSA());
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.EmptyDustBin());
                }
                break;
            case 'Clean_V2': {
                if (this.isModelTypeAirbot()) {
                    this.ecovacs.sendCommand(new VacBotCommand.Clean_V2('move'));
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.Clean_V2());
                }
                break;
            }
            case 'SpotArea_V2': {
                const area = args[0].toString();
                if (area !== '') {
                    if (this.isModelTypeX2()) {
                        const areaValues = tools.convertAreaValuesForFreeCleanCmd(area);
                        this.run('FreeClean', areaValues);
                    } else {
                        const cleanings = args[1] || 1;
                        this.ecovacs.sendCommand(new VacBotCommand.SpotArea_V2(area, cleanings));
                    }
                }
                break;
            }
            case 'FreeClean': {
                if (args.length >= 1) {
                    const areaValues = args[0];
                    if (tools.areaValuesAreValidForFreeCleanCmd(areaValues)) {
                        this.ecovacs.sendCommand(new VacBotCommand.FreeClean(areaValues));
                    }
                }
                break;
            }
            case 'CustomArea_V2': {
                const area = args[0].toString();
                const cleanings = args[1] || 1;
                const doNotClean = args[2] || 0;
                if (area !== '') {
                    this.ecovacs.sendCommand(new VacBotCommand.CustomArea_V2(area, cleanings, doNotClean));
                }
                break;
            }
            case 'GoToPosition': {
                let area = args[0].toString();
                if (area !== '') {
                    if (this.isModelTypeT9Based()) {
                        this.run('MapPoint_V2', area);
                    } else if (this.isModelTypeT8Based()) {
                        area = area + ',' + area;
                        this.run('CustomArea_V2', area, 1, 1);
                    }
                }
                break;
            }
            case 'MapPoint_V2': {
                const area = args[0].toString();
                if (area !== '') {
                    this.ecovacs.sendCommand(new VacBotCommand.MapPoint_V2(area));
                }
                break;
            }
            case 'SetWorkMode':
                if (args.length >= 1) {
                    let workMode = args[0];
                    if (dictionary.WORKMODE_TO_ECOVACS.hasOwnProperty(workMode)) {
                        workMode = dictionary.WORKMODE_TO_ECOVACS[workMode];
                    }
                    if ((workMode >= 0) && (workMode <= 3)) {
                        this.ecovacs.sendCommand(new VacBotCommand.SetWorkMode(workMode));
                    }
                }
                break;
            case 'SetWashInterval':
                if (args.length >= 1) {
                    const washInterval = Number(args[0]);
                    this.ecovacs.sendCommand(new VacBotCommand.SetWashInterval(washInterval));
                }
                break;
            case 'GetAirDrying':
                if (this.getModelType() === 'yeedi') {
                    this.ecovacs.sendCommand(new VacBotCommand.GetAirDrying());
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.GetStationState());
                }
                break;
            case 'SetAirDrying':
                if (args.length >= 1) {
                    if (this.getModelType() === 'yeedi') {
                        this.ecovacs.sendCommand(new VacBotCommand.SetAirDrying(args[0]));
                    } else {
                        this.ecovacs.sendCommand(new VacBotCommand.Drying(args[0]));
                    }
                }
                break;
            case 'AirDryingStart':
                if (this.getModelType() === 'yeedi') {
                    this.ecovacs.sendCommand(new VacBotCommand.SetAirDrying('start'));
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.Drying(1));
                }
                break;
            case 'AirDryingStop':
                if (this.getModelType() === 'yeedi') {
                    this.ecovacs.sendCommand(new VacBotCommand.SetAirDrying('stop'));
                } else {
                    this.ecovacs.sendCommand(new VacBotCommand.Drying(4));
                }
                break;
            case 'Drying':
                if (args.length >= 1) {
                    let value = args[0];
                    let act = Number(value);
                    if (isNaN(act)) {
                        // 'start' and 'stop' are also valid arguments
                        act = value === 'start' ? 1 : 4;
                    }
                    if ((act === 1) || (act === 4)) {
                        this.ecovacs.sendCommand(new VacBotCommand.Drying(act));
                    }
                }
                break;
            case 'GetEfficiency':
                this.ecovacs.sendCommand(new VacBotCommand.Generic('getEfficiency'));
                break;
            default:
                return false;
        }
        return true;
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
        this.netInfoIP = payload['ip'];
        this.netInfoWifiSSID = payload['ssid'];
        this.netInfoWifiSignal = payload['rssi'];
        this.netInfoMAC = payload['mac'];
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
                this.deebotPosition, this.chargePosition, this.currentMapMID, this.mapDataObject
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
                if (crcArray[c] !== constants.CRC_EMPTY_PIECE) { // skipping empty pieces
                    this.ecovacs.sendCommand(new VacBotCommand.GetMinorMap(mapID, c));
                }
            }
            // TODO: Implement liveMapImage
            // this.ecovacs.sendCommand(new VacBotCommand.GetMapTrace());
            // TODO: handle liveMapImage
            if (HANDLE_LIVE_MAP) {
                const type = payload['type'];
                const pieceWidth = payload['pieceWidth'];
                const pieceHeight = payload['pieceHeight'];
                const cellWidth = payload['cellWidth'];
                const cellHeight = payload['cellHeight'];
                const pixel = payload['pixel'];
                this.liveMapImage = new mapTemplate.EcovacsLiveMapImage(
                    mapID, type, pieceWidth, pieceHeight, cellWidth, cellHeight, pixel, crcList);
            }
        } else {
            // TODO: handle liveMapImage
            if (HANDLE_LIVE_MAP) {
                this.liveMapImage.updateMapDataPiecesCrc(crcList);
            }
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
        if (HANDLE_LIVE_MAP) {
            await this.liveMapImage.updateMapPiece(payload['pieceIndex'], payload['pieceValue']);
            try {
                return this.liveMapImage.getBase64PNG(
                    this.deebotPosition, this.chargePosition, this.currentMapMID, this.mapDataObject
                );
            } catch (e) {
                tools.envLogError(`error calling getBase64PNG: ${e.message}`);
                throw new Error(e);
            }
        }
    }

    async handleMapTrace(payload) {
        tools.envLogPayload(payload);
        /*
        const totalCount = payload['totalCount'];
        const traceStart = payload['traceStart'];
        const traceValue = payload['traceValue'];
        const pointCount = payload['pointCount'];
        const tid = payload['tid'];*/
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
