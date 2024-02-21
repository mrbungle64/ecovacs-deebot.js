'use strict';

const tools = require('./tools');
const i18n = require('./i18n');
const map = require('./mapInfo');
const {errorCodes} = require('./errorCodes.json');
const constants = require("./constants");
const crypto = require("crypto");
const querystring = require("node:querystring");
const axios = require('axios').default;

/**
 * @class VacBot
 * This class represents the vacuum bot
 * There are 2 classes which derive from this class (`VacBot_950type` and `VacBot_non950type`)
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

        if (this.is950type()) {
            this.vacBotCommand = require('./950type/command');
        } else {
            this.vacBotCommand = require('./non950type/command');
        }

        if (this.is950type()) {
            this.protocolModule = require('./950type/ecovacsMQTT_JSON');
        } else if (this.useMqttProtocol()) {
            this.protocolModule = require('./non950type/ecovacsMQTT_XML');
        } else {
            this.protocolModule = require('./non950type/ecovacsXMPP_XML');
        }

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
                for (let m=0; m < this.mapImageDataQueue.length; m++) {
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
        setTimeout(()=> {
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
        switch (command.toLowerCase()) {
            case "Generic".toLowerCase(): {
                this.sendCommand(new this.vacBotCommand.Generic(args[0], args[1]));
                this.genericCommand = args[0];
                break;
            }
            case "Clean".toLowerCase(): {
                this.sendCommand(new this.vacBotCommand.Clean());
                break;
            }
            case "SpotArea".toLowerCase(): {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.sendCommand(new this.vacBotCommand.SpotArea('start', area, cleanings));
                }
                break;
            }
            case "CustomArea".toLowerCase(): {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.sendCommand(new this.vacBotCommand.CustomArea('start', area, cleanings));
                }
                break;
            }
            case "Edge".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Edge());
                break;
            case "Spot".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Spot());
                break;
            case "Pause".toLowerCase(): {
                if (this.isModelTypeAirbot() || this.isModelTypeX2()) {
                    // Airbot Z1 and Deebot X2 series
                    const command = 'clean_V2';
                    this.sendCommand(new this.vacBotCommand.Pause(command));
                } else if (args[0] !== undefined) {
                    // Legacy models
                    const mode = args[0];
                    this.sendCommand(new this.vacBotCommand.Pause(mode));
                } else {
                    // Standard
                    this.sendCommand(new this.vacBotCommand.Pause());
                }
                break;
            }
            case "Stop".toLowerCase():
                if (this.isModelTypeAirbot() || this.isModelTypeX2()) {
                    this.sendCommand(new this.vacBotCommand.Stop('clean_V2'));
                } else {
                    this.sendCommand(new this.vacBotCommand.Stop());
                }
                break;
            case "Resume".toLowerCase():
                if (this.isModelTypeAirbot() || this.isModelTypeX2()) {
                    this.sendCommand(new this.vacBotCommand.Resume('clean_V2'));
                } else {
                    this.sendCommand(new this.vacBotCommand.Resume());
                }
                break;
            case "Charge".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Charge());
                break;
            case "GetChargeState".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetChargeState());
                break;
            case "GetBatteryState".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetBatteryState());
                break;
            case "GetCleanState".toLowerCase():
            case "GetCleanInfo".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetCleanState());
                break;
            case "GetCleanSpeed".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetCleanSpeed());
                break;
            case "GetNetInfo".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetNetInfo());
                break;
            case "GetSleepStatus".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetSleepStatus());
                break;
            case "GetPosition".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetPosition());
                break;
            case "GetSchedule".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetSchedule());
                break;
            case "PlaySound".toLowerCase(): {
                let sid = args[0] || 0;
                this.sendCommand(new this.vacBotCommand.PlaySound(Number(sid)));
                break;
            }
            case "GetCleanSum".toLowerCase(): {
                if (!this.isN79series()) {
                    // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/67
                    this.sendCommand(new this.vacBotCommand.GetCleanSum());
                }
                break;
            }
            case "ResetLifeSpan".toLowerCase(): {
                const component = args[0];
                if (component !== '') {
                    this.sendCommand(new this.vacBotCommand.ResetLifeSpan(component));
                }
                break;
            }
            case "SetWaterLevel".toLowerCase(): {
                const amount = Number(args[0]);
                const sweepType = Number(args[1]);
                if ((amount >= 1) && (amount <= 4)) {
                    if ((sweepType === 1) || (sweepType === 2)) {
                        this.sendCommand(new this.vacBotCommand.SetWaterLevel(amount, sweepType));
                    } else {
                        this.sendCommand(new this.vacBotCommand.SetWaterLevel(amount));
                    }
                }
                break;
            }
            case "SetCleanSpeed".toLowerCase(): {
                const level = Number(args[0]);
                if ((level >= 1) && (level <= 4)) {
                    this.sendCommand(new this.vacBotCommand.SetCleanSpeed(level));
                }
                break;
            }
            case "GetDoNotDisturb".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetDoNotDisturb());
                break;
            case 'GetBreakPoint'.toLowerCase():
            case "GetContinuousCleaning".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetContinuousCleaning());
                break;
            case "EnableContinuousCleaning".toLowerCase():
                this.sendCommand(new this.vacBotCommand.SetContinuousCleaning(1));
                break;
            case "DisableContinuousCleaning".toLowerCase():
                this.sendCommand(new this.vacBotCommand.SetContinuousCleaning(0));
                break;
            case "Move".toLowerCase(): {
                const command = args[0];
                if (command !== '') {
                    this.sendCommand(new this.vacBotCommand.Move(command));
                }
                break;
            }
            case "MoveBackward".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveBackward());
                break;
            case "MoveForward".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveForward());
                break;
            case "MoveLeft".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveLeft());
                break;
            case "MoveRight".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveRight());
                break;
            case "MoveTurnAround".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveTurnAround());
                break;
        }
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
     * Returns true if the model is a N79 series model
     * @returns {boolean}
     */
    isN79series() {
        return tools.isN79series(this.deviceClass);
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
     * Send a command to the vacuum
     * @param {Object} command - a VacBotCommand object
     */
    sendCommand(command) {
        if (!this.is950type()) {
            this.commandsSent[command.getId()] = command;
            if ((command.name === 'PullMP') && (command.args)) {
                this.mapPiecePacketsSent[command.getId()] = command.args.pid;
            }
        }
        let actionPayload = this.useMqttProtocol() ? command : command.toXml();
        (async () => {
            try {
                await this.ecovacs.sendCommand(actionPayload);
            } catch (e) {
                tools.envLogError(`error sendCommand: ${e.message}`);
            }
        })();
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

        portalPath = tools.formatString(portalPath, {continent: this.continent});
        if (this.country === 'CN') {
            portalPath = portalPath.replace('.com','.cn');
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
                'country':  this.country,
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
}

module.exports = VacBot;
