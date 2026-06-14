'use strict';

const VacBotCommand = require('../command');
const tools = require('../tools');
const dictionary = require('../dictionary');

/**
 * @class CommandDispatcher
 * Handles command dispatching for VacBot, especially for commands requiring special logic.
 */
class CommandDispatcher {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Dispatch a command with special logic.
     * @param {string} key - The command key.
     * @param {Object} options - Command options (e.g. returnPromise)
     * @param {...*} args - Command arguments.
     * @returns {Promise<any>|boolean} Promise if returnPromise is true, otherwise a boolean
     *   indicating whether a command was actually dispatched (false if the key is unknown or
     *   the arguments were invalid, so nothing was sent).
     */
    dispatch(key, options, ...args) {
        const isAsync = Boolean(options && options.returnPromise);
        let promise;
        // Tracks whether a command was actually sent in branches that issue
        // multiple commands but only build a combined `promise` when `isAsync`.
        let dispatched = false;

        switch (key) {
            case 'Generic'.toLowerCase(): {
                promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Generic(args[0], args[1]), options);
                this.bot.genericCommand = args[0];
                break;
            }
            case 'SpotArea'.toLowerCase(): {
                const area = args[1].toString();
                if (area === '') {
                    break;
                }
                const cleanings = args[2] || 1;
                promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SpotArea('start', area, cleanings), options);
                break;
            }
            case 'CustomArea'.toLowerCase(): {
                const area = args[1].toString();
                if (area === '') {
                    break;
                }
                const cleanings = args[2] || 1;
                promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.CustomArea('start', area, cleanings), options);
                break;
            }
            case 'Pause'.toLowerCase(): {
                if (this.bot.isPlatformTypeAirbot() || this.bot.isPlatformTypeX2()) {
                    // Airbot Z1 and Deebot X2 series
                    const command = 'clean_V2';
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Pause(command), options);
                } else if (args[0] !== undefined) {
                    // Legacy models
                    const mode = args[0];
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Pause(mode), options);
                } else {
                    // Standard
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Pause(), options);
                }
                break;
            }
            case 'Stop'.toLowerCase(): {
                if (this.bot.isPlatformTypeAirbot() || this.bot.isPlatformTypeX2()) {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Stop('clean_V2'), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Stop(), options);
                }
                break;
            }
            case 'Resume'.toLowerCase(): {
                if (this.bot.isPlatformTypeAirbot() || this.bot.isPlatformTypeX2()) {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Resume('clean_V2'), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Resume(), options);
                }
                break;
            }
            case 'PlaySound'.toLowerCase(): {
                const sid = args[0] || 0;
                promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.PlaySound(Number(sid)), options);
                break;
            }
            case 'ResetLifeSpan'.toLowerCase(): {
                const component = args[0];
                if (component !== '') {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.ResetLifeSpan(component), options);
                }
                break;
            }
            case 'SetWaterLevel'.toLowerCase(): {
                const amount = Number(args[0]);
                const sweepType = Number(args[1]);
                if ((amount >= 1) && (amount <= 4)) {
                    if ((sweepType === 1) || (sweepType === 2)) {
                        promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SetWaterLevel(amount, sweepType), options);
                    } else {
                        promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SetWaterLevel(amount), options);
                    }
                }
                break;
            }
            case 'SetCleanSpeed'.toLowerCase(): {
                const level = Number(args[0]);
                if ((level >= 1) && (level <= 4)) {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SetCleanSpeed(level), options);
                }
                break;
            }
            case 'Move'.toLowerCase(): {
                const command = args[0];
                if (command !== '') {
                    promise = this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Move(command), options);
                }
                break;
            }
            case 'GetMapInfo'.toLowerCase():
            case 'GetMapImage'.toLowerCase(): {
                const mapID = args[0].toString(); // mapID has to be a string
                const mapType = args[1] || 'outline';
                this.bot.createMapDataObject = true;
                this.bot.createMapImage = true;
                this.bot.createMapImageOnly = args[2] !== undefined ? args[2] : true;
                if (Number(mapID) > 0) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo(mapID, mapType), options);
                }
                break;
            }
            case 'GetMaps'.toLowerCase():
            case 'GetCachedMapInfo'.toLowerCase(): {
                const p1 = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapState(), options);
                const p2 = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMajorMap(), options);
                dispatched = true;
                this.bot.createMapImageOnly = false;
                this.bot.createMapDataObject = !!args[0] || false;
                this.bot.createMapImage = this.bot.createMapDataObject && this.bot.isMapImageSupported();
                if (args.length >= 2) {
                    this.bot.createMapImage = !!args[1];
                }
                // Workaround for some yeedi models (e.g. yeedi mop station)
                // TODO: Find a better solution
                let p3;
                if ((this.bot.deviceClass === 'p5nx9u') || (this.bot.deviceClass === 'vthpeg')) {
                    p3 = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2_Yeedi(), options);
                } else {
                    p3 = this.bot.ecovacs.sendCommand(new VacBotCommand.GetCachedMapInfo(), options);
                }
                if (isAsync) {
                    promise = Promise.all([p1, p2, p3]);
                }
                break;
            }
            case 'BackupMap'.toLowerCase(): {
                if (args.length === 0) { // Airbot Z1
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('backup'), options);
                } else if (args.length === 1) { // e.g. Deebot X1 series
                    const mid = args[0];
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('backup', mid), options);
                }
                break;
            }
            case 'RestoreMap'.toLowerCase(): {
                if (args.length === 0) { // Airbot Z1
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('restore'), options);
                } else if (args.length === 2) { // e.g. Deebot X1 series
                    const mid = args[0];
                    const reMid = args[1]; // backupId
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('restore', mid, reMid), options);
                }
                break;
            }
            case 'GetSpotAreas'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSpotAreas(mapID), options);
                }
                break;
            }
            case 'GetMapInfo_V2'.toLowerCase(): {
                if (args.length === 1) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0]), options);
                } else if (args.length >= 2) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0], args[1]), options);
                }
                break;
            }
            case 'GetMapSet_V2'.toLowerCase(): {
                if (args.length === 1) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSet_V2(args[0]), options);
                } else if (args.length >= 2) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSet_V2(args[0], args[1]), options);
                }
                break;
            }
            case 'SetMapSet_V2'.toLowerCase(): {
                if ((args.length >= 2) && (typeof args[1] === 'object')) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetMapSet_V2(args[0], args[1]), options);
                }
                break;
            }
            case 'GetSpotAreaInfo'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSpotAreaInfo(mapID, spotAreaID), options);
                }
                break;
            }
            case 'GetVirtualBoundaries'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    if (typeof this.bot.mapVirtualBoundariesResponses[mapID] === 'undefined') {
                        this.bot.mapVirtualBoundariesResponses[mapID] = [false, false];
                    } else {
                        this.bot.mapVirtualBoundariesResponses[mapID][0] = false;
                        this.bot.mapVirtualBoundariesResponses[mapID][1] = false;
                    }
                    const p1 = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'vw'), options);
                    const p2 = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'mw'), options);
                    dispatched = true;
                    if (isAsync) {
                        promise = Promise.all([p1, p2]);
                    }
                }
                break;
            }
            case 'GetVirtualBoundaryInfo'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaryInfo(mapID, spotAreaID, type), options);
                }
                break;
            }
            case 'AddVirtualBoundary'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const coordinates = args[1];
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (coordinates !== '')) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.AddMapVirtualBoundary(mapID, coordinates, type), options);
                }
                break;
            }
            case 'DeleteVirtualBoundary'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = args[2];
                if ((Number(mapID) > 0) && (Number(spotAreaID) >= 0) && (tools.isValidVirtualWallType(type))) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.DeleteMapVirtualBoundary(mapID, spotAreaID, type), options);
                }
                break;
            }
            case 'GetLifeSpan'.toLowerCase(): {
                if (!args.length) {
                    this.bot.emitFullLifeSpanEvent = true;
                    this.bot.components = {};
                    this.bot.lastComponentValues = {};
                    if (this.bot.isPlatformTypeAirbot()) {
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan([]), options);
                    } else {
                        const componentsArray = [];
                        componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['filter']);
                        componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['side_brush']);
                        componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['main_brush']);
                        if (this.bot.hasUnitCareInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['unit_care']);
                        }
                        if (this.bot.hasRoundMopInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['round_mop']);
                        }
                        if (this.bot.hasAirFreshenerInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['air_freshener']);
                        }
                        if (componentsArray.length) {
                            promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray), options);
                        }
                    }
                } else {
                    this.bot.emitFullLifeSpanEvent = false;
                    const component = args[0];
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS[component]
                    ];
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray), options);
                }
                break;
            }
            case 'EnableDoNotDisturb'.toLowerCase(): {
                const start = args[0];
                const end = args[1];
                if ((start !== '') && (end !== '')) {
                    promise = this.bot.run('SetDoNotDisturb', 1, start, end, options);
                } else {
                    promise = this.bot.run('SetDoNotDisturb', 1, options);
                }
                break;
            }
            case 'DisableDoNotDisturb'.toLowerCase(): {
                promise = this.bot.run('SetDoNotDisturb', 0, options);
                break;
            }
            case 'SetBlock'.toLowerCase():
            case 'SetDoNotDisturb'.toLowerCase(): {
                const enable = Number(!!args[0]);
                const start = args[1];
                const end = args[2];
                if ((start !== '') && (end !== '')) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetDoNotDisturb(enable, start, end), options);
                } else if (args.length >= 1) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetDoNotDisturb(enable), options);
                }
                break;
            }
            case 'GetCleanLogs'.toLowerCase(): {
                if (this.bot.isPlatformTypeT9Based()) {
                    const p = this.bot.callCleanResultsLogsApi().then((logData) => {
                        this.bot.handleCleanLogs(logData);
                        this.bot.emitCleanLogEvents();
                        return logData;
                    });
                    dispatched = true;
                    if (isAsync) {
                        promise = p;
                    }
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetCleanLogs(), options);
                }
                break;
            }
            case 'GetTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetRecognization(), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetTrueDetect(), options);
                }
                break;
            }
            case 'EnableAIVI'.toLowerCase():
            case 'EnableAIVI3D'.toLowerCase():
            case 'EnableTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetRecognization(1), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(1), options);
                }
                break;
            }
            case 'DisableAIVI'.toLowerCase():
            case 'DisableAIVI3D'.toLowerCase():
            case 'DisableTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetRecognization(0), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(0), options);
                }
                break;
            }
            case 'SetAIVI'.toLowerCase():
            case 'SetAIVI3D'.toLowerCase():
            case 'SetTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetRecognization(args[0]), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(args[0]), options);
                }
                break;
            }
            case 'EmptyDustBin'.toLowerCase():
            case 'EmptySuctionStation'.toLowerCase(): {
                if (this.bot.isPlatformTypeT20() || this.bot.isPlatformTypeX2()) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.EmptyDustBinSA(), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.EmptyDustBin(), options);
                }
                break;
            }
            case 'Clean_V2'.toLowerCase(): {
                if (this.bot.isPlatformTypeAirbot()) {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Clean_V2('move'), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Clean_V2(), options);
                }
                break;
            }
            case 'SpotArea_V2'.toLowerCase(): {
                const area = args[0].toString();
                if (area !== '') {
                    if (this.bot.isPlatformTypeX2()) {
                        const areaValues = tools.convertAreaValuesForFreeCleanCmd(area);
                        promise = this.bot.run('FreeClean', areaValues, options);
                    } else {
                        const cleanings = args[1] || 1;
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SpotArea_V2(area, cleanings), options);
                    }
                }
                break;
            }
            case 'FreeClean'.toLowerCase(): {
                if (args.length >= 1) {
                    const areaValues = args[0];
                    if (tools.areaValuesAreValidForFreeCleanCmd(areaValues)) {
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.FreeClean(areaValues), options);
                    }
                }
                break;
            }
            case 'CustomArea_V2'.toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 1;
                const doNotClean = args[2] || 0;
                if (area !== '') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.CustomArea_V2(area, cleanings, doNotClean), options);
                }
                break;
            }
            case 'GoToPosition'.toLowerCase(): {
                let area = args[0].toString();
                if (area !== '') {
                    if (this.bot.isPlatformTypeT9Based()) {
                        promise = this.bot.run('MapPoint_V2', area, options);
                    } else if (this.bot.isPlatformTypeT8Based()) {
                        area = area + ',' + area;
                        promise = this.bot.run('CustomArea_V2', area, 1, 1, options);
                    }
                }
                break;
            }
            case 'MapPoint_V2'.toLowerCase(): {
                const area = args[0].toString();
                if (area !== '') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.MapPoint_V2(area), options);
                }
                break;
            }
            case 'SetWorkMode'.toLowerCase(): {
                if (args.length >= 1) {
                    let workMode = args[0];
                    if (dictionary.WORKMODE_TO_ECOVACS.hasOwnProperty(workMode)) {
                        workMode = dictionary.WORKMODE_TO_ECOVACS[workMode];
                    }
                    if ((workMode >= 0) && (workMode <= 3)) {
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetWorkMode(workMode), options);
                    }
                }
                break;
            }
            case 'SetWashInterval'.toLowerCase(): {
                if (args.length >= 1) {
                    const washInterval = Number(args[0]);
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetWashInterval(washInterval), options);
                }
                break;
            }
            case 'SetWashInfo'.toLowerCase(): {
                if (args.length >= 1) {
                    const mode = Number(args[0]);
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetWashInfo(mode), options);
                }
                break;
            }
            case 'GetAirDrying'.toLowerCase(): {
                if (this.bot.getPlatformType() === 'yeedi') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetAirDrying(), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.GetStationState(), options);
                }
                break;
            }
            case 'SetAirDrying'.toLowerCase(): {
                if (args.length >= 1) {
                    if (this.bot.getPlatformType() === 'yeedi') {
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetAirDrying(args[0]), options);
                    } else {
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(args[0]), options);
                    }
                }
                break;
            }
            case 'AirDryingStart'.toLowerCase(): {
                if (this.bot.getPlatformType() === 'yeedi') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetAirDrying('start'), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(1), options);
                }
                break;
            }
            case 'AirDryingStop'.toLowerCase(): {
                if (this.bot.getPlatformType() === 'yeedi') {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.SetAirDrying('stop'), options);
                } else {
                    promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(4), options);
                }
                break;
            }
            case 'Drying'.toLowerCase(): {
                if (args.length >= 1) {
                    const value = args[0];
                    let act = Number(value);
                    if (isNaN(act)) {
                        // 'start' and 'stop' are also valid arguments
                        act = value === 'start' ? 1 : 4;
                    }
                    if ((act === 1) || (act === 4)) {
                        promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(act), options);
                    }
                }
                break;
            }
            case 'GetEfficiency'.toLowerCase(): {
                promise = this.bot.ecovacs.sendCommand(new VacBotCommand.Generic('getEfficiency'), options);
                break;
            }
            default: {
                return false;
            }
        }
        // For sync calls, report whether a command was actually sent — invalid
        // argument paths fall through without dispatching and now return false.
        return isAsync ? promise : (Boolean(promise) || dispatched);
    }
}

module.exports = CommandDispatcher;
