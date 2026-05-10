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
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Dispatch a command with special logic.
     * @param {string} key - The command key.
     * @param {Array} args - Command arguments.
     * @returns {boolean} True if handled, false otherwise.
     */
    dispatch(key, ...args) {
        switch (key) {
            case 'Generic'.toLowerCase(): {
                this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Generic(args[0], args[1]));
                this.bot.genericCommand = args[0];
                break;
            }
            case 'SpotArea'.toLowerCase(): {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SpotArea('start', area, cleanings));
                }
                break;
            }
            case 'CustomArea'.toLowerCase(): {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.CustomArea('start', area, cleanings));
                }
                break;
            }
            case 'Pause'.toLowerCase(): {
                if (this.bot.isModelTypeAirbot() || this.bot.isModelTypeX2()) {
                    // Airbot Z1 and Deebot X2 series
                    const command = 'clean_V2';
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Pause(command));
                } else if (args[0] !== undefined) {
                    // Legacy models
                    const mode = args[0];
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Pause(mode));
                } else {
                    // Standard
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Pause());
                }
                break;
            }
            case 'Stop'.toLowerCase(): {
                if (this.bot.isModelTypeAirbot() || this.bot.isModelTypeX2()) {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Stop('clean_V2'));
                } else {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Stop());
                }
                break;
            }
            case 'Resume'.toLowerCase(): {
                if (this.bot.isModelTypeAirbot() || this.bot.isModelTypeX2()) {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Resume('clean_V2'));
                } else {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Resume());
                }
                break;
            }
            case 'PlaySound'.toLowerCase(): {
                let sid = args[0] || 0;
                this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.PlaySound(Number(sid)));
                break;
            }
            case 'ResetLifeSpan'.toLowerCase(): {
                const component = args[0];
                if (component !== '') {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.ResetLifeSpan(component));
                }
                break;
            }
            case 'SetWaterLevel'.toLowerCase(): {
                const amount = Number(args[0]);
                const sweepType = Number(args[1]);
                if ((amount >= 1) && (amount <= 4)) {
                    if ((sweepType === 1) || (sweepType === 2)) {
                        this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SetWaterLevel(amount, sweepType));
                    } else {
                        this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SetWaterLevel(amount));
                    }
                }
                break;
            }
            case 'SetCleanSpeed'.toLowerCase(): {
                const level = Number(args[0]);
                if ((level >= 1) && (level <= 4)) {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.SetCleanSpeed(level));
                }
                break;
            }
            case 'Move'.toLowerCase(): {
                const command = args[0];
                if (command !== '') {
                    this.bot.ecovacs.sendCommand(new this.bot.vacBotCommand.Move(command));
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
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo(mapID, mapType));
                }
                break;
            }
            case 'GetMaps'.toLowerCase():
            case 'GetCachedMapInfo'.toLowerCase(): {
                this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapState());
                this.bot.ecovacs.sendCommand(new VacBotCommand.GetMajorMap());
                this.bot.createMapImageOnly = false;
                this.bot.createMapDataObject = !!args[0] || false;
                this.bot.createMapImage = this.bot.createMapDataObject && this.bot.isMapImageSupported();
                if (args.length >= 2) {
                    this.bot.createMapImage = !!args[1];
                }
                // Workaround for some yeedi models (e.g. yeedi mop station)
                // TODO: Find a better solution
                if ((this.bot.deviceClass === 'p5nx9u') || (this.bot.deviceClass === 'vthpeg')) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2_Yeedi());
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetCachedMapInfo());
                }
                break;
            }
            case 'BackupMap'.toLowerCase(): {
                if (args.length === 0) { // Airbot Z1
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('backup'));
                } else if (args.length === 1) { // e.g. Deebot X1 series
                    const mid = args[0];
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('backup', mid));
                }
                break;
            }
            case 'RestoreMap'.toLowerCase(): {
                if (args.length === 0) { // Airbot Z1
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('restore'));
                } else if (args.length === 2) { // e.g. Deebot X1 series
                    const mid = args[0];
                    const reMid = args[1]; // backupId
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetCachedMapInfo('restore', mid, reMid));
                }
                break;
            }
            case 'GetSpotAreas'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSpotAreas(mapID));
                }
                break;
            }
            case 'GetMapInfo_V2'.toLowerCase(): {
                if (args.length === 1) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0]));
                } else if (args.length >= 2) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0], args[1]));
                }
                break;
            }
            case 'GetMapSet_V2'.toLowerCase(): {
                if (args.length === 1) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSet_V2(args[0]));
                } else if (args.length >= 2) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSet_V2(args[0], args[1]));
                }
                break;
            }
            case 'SetMapSet_V2'.toLowerCase(): {
                if ((args.length >= 2) && (typeof args[1] === 'object')) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetMapSet_V2(args[0], args[1]));
                }
                break;
            }
            case 'GetSpotAreaInfo'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapSpotAreaInfo(mapID, spotAreaID));
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
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'vw'));
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'mw'));
                }
                break;
            }
            case 'GetVirtualBoundaryInfo'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetMapVirtualBoundaryInfo(mapID, spotAreaID, type));
                }
                break;
            }
            case 'AddVirtualBoundary'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const coordinates = args[1];
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (coordinates !== '')) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.AddMapVirtualBoundary(mapID, coordinates, type));
                }
                break;
            }
            case 'DeleteVirtualBoundary'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = args[2];
                if ((Number(mapID) > 0) && (Number(spotAreaID) >= 0) && (tools.isValidVirtualWallType(type))) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.DeleteMapVirtualBoundary(mapID, spotAreaID, type));
                }
                break;
            }
            case 'GetLifeSpan'.toLowerCase(): {
                if (!args.length) {
                    this.bot.emitFullLifeSpanEvent = true;
                    this.bot.components = {};
                    this.bot.lastComponentValues = {};
                    if (this.bot.isModelTypeAirbot()) {
                        this.bot.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan([]));
                    } else {
                        const componentsArray = [];
                        if (this.bot.hasFilter()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['filter']);
                        }
                        if (this.bot.hasSideBrush()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['side_brush']);
                        }
                        if (this.bot.hasMainBrush()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['main_brush']);
                        }
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
                            this.bot.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
                        }
                    }
                } else {
                    this.bot.emitFullLifeSpanEvent = false;
                    const component = args[0];
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS[component]
                    ];
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
                }
                break;
            }
            case 'EnableDoNotDisturb'.toLowerCase(): {
                const start = args[0];
                const end = args[1];
                if ((start !== '') && (end !== '')) {
                    this.bot.run('SetDoNotDisturb', 1, start, end);
                } else {
                    this.bot.run('SetDoNotDisturb', 1);
                }
                break;
            }
            case 'DisableDoNotDisturb'.toLowerCase(): {
                this.bot.run('SetDoNotDisturb', 0);
                break;
            }
            case 'SetBlock'.toLowerCase():
            case 'SetDoNotDisturb'.toLowerCase(): {
                const enable = Number(!!args[0]);
                const start = args[1];
                const end = args[2];
                if ((start !== '') && (end !== '')) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetDoNotDisturb(enable, start, end));
                } else if (args.length >= 1) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetDoNotDisturb(enable));
                }
                break;
            }
            case 'GetCleanLogs'.toLowerCase(): {
                if (this.bot.isModelTypeT9Based()) {
                    this.bot.callCleanResultsLogsApi().then((logData) => {
                        this.bot.handleCleanLogs(logData);
                        this.bot.emitCleanLogEvents();
                    });
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetCleanLogs());
                }
                break;
            }
            case 'GetTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetRecognization());
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetTrueDetect());
                }
                break;
            }
            case 'EnableAIVI'.toLowerCase():
            case 'EnableAIVI3D'.toLowerCase():
            case 'EnableTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetRecognization(1));
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(1));
                }
                break;
            }
            case 'DisableAIVI'.toLowerCase():
            case 'DisableAIVI3D'.toLowerCase():
            case 'DisableTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetRecognization(0));
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(0));
                }
                break;
            }
            case 'SetAIVI'.toLowerCase():
            case 'SetAIVI3D'.toLowerCase():
            case 'SetTrueDetect'.toLowerCase(): {
                if (this.bot.getCmdForObstacleDetection() === 'Recognization') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetRecognization(args[0]));
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetTrueDetect(args[0]));
                }
                break;
            }
            case 'EmptyDustBin'.toLowerCase():
            case 'EmptySuctionStation'.toLowerCase(): {
                if (this.bot.isModelTypeT20() || this.bot.isModelTypeX2()) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.EmptyDustBinSA());
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.EmptyDustBin());
                }
                break;
            }
            case 'Clean_V2'.toLowerCase(): {
                if (this.bot.isModelTypeAirbot()) {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.Clean_V2('move'));
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.Clean_V2());
                }
                break;
            }
            case 'SpotArea_V2'.toLowerCase(): {
                const area = args[0].toString();
                if (area !== '') {
                    if (this.bot.isModelTypeX2()) {
                        const areaValues = tools.convertAreaValuesForFreeCleanCmd(area);
                        this.bot.run('FreeClean', areaValues);
                    } else {
                        const cleanings = args[1] || 1;
                        this.bot.ecovacs.sendCommand(new VacBotCommand.SpotArea_V2(area, cleanings));
                    }
                }
                break;
            }
            case 'FreeClean'.toLowerCase(): {
                if (args.length >= 1) {
                    const areaValues = args[0];
                    if (tools.areaValuesAreValidForFreeCleanCmd(areaValues)) {
                        this.bot.ecovacs.sendCommand(new VacBotCommand.FreeClean(areaValues));
                    }
                }
                break;
            }
            case 'CustomArea_V2'.toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 1;
                const doNotClean = args[2] || 0;
                if (area !== '') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.CustomArea_V2(area, cleanings, doNotClean));
                }
                break;
            }
            case 'GoToPosition'.toLowerCase(): {
                let area = args[0].toString();
                if (area !== '') {
                    if (this.bot.isModelTypeT9Based()) {
                        this.bot.run('MapPoint_V2', area);
                    } else if (this.bot.isModelTypeT8Based()) {
                        area = area + ',' + area;
                        this.bot.run('CustomArea_V2', area, 1, 1);
                    }
                }
                break;
            }
            case 'MapPoint_V2'.toLowerCase(): {
                const area = args[0].toString();
                if (area !== '') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.MapPoint_V2(area));
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
                        this.bot.ecovacs.sendCommand(new VacBotCommand.SetWorkMode(workMode));
                    }
                }
                break;
            }
            case 'SetWashInterval'.toLowerCase(): {
                if (args.length >= 1) {
                    const washInterval = Number(args[0]);
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetWashInterval(washInterval));
                }
                break;
            }
            case 'SetWashInfo'.toLowerCase(): {
                if (args.length >= 1) {
                    const mode = Number(args[0]);
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetWashInfo(mode));
                }
                break;
            }
            case 'GetAirDrying'.toLowerCase(): {
                if (this.bot.getModelType() === 'yeedi') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetAirDrying());
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.GetStationState());
                }
                break;
            }
            case 'SetAirDrying'.toLowerCase(): {
                if (args.length >= 1) {
                    if (this.bot.getModelType() === 'yeedi') {
                        this.bot.ecovacs.sendCommand(new VacBotCommand.SetAirDrying(args[0]));
                    } else {
                        this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(args[0]));
                    }
                }
                break;
            }
            case 'AirDryingStart'.toLowerCase(): {
                if (this.bot.getModelType() === 'yeedi') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetAirDrying('start'));
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(1));
                }
                break;
            }
            case 'AirDryingStop'.toLowerCase(): {
                if (this.bot.getModelType() === 'yeedi') {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.SetAirDrying('stop'));
                } else {
                    this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(4));
                }
                break;
            }
            case 'Drying'.toLowerCase(): {
                if (args.length >= 1) {
                    let value = args[0];
                    let act = Number(value);
                    if (isNaN(act)) {
                        // 'start' and 'stop' are also valid arguments
                        act = value === 'start' ? 1 : 4;
                    }
                    if ((act === 1) || (act === 4)) {
                        this.bot.ecovacs.sendCommand(new VacBotCommand.Drying(act));
                    }
                }
                break;
            }
            case 'GetEfficiency'.toLowerCase(): {
                this.bot.ecovacs.sendCommand(new VacBotCommand.Generic('getEfficiency'));
                break;
            }
            default: {
                return false;
            }
        }
        return true;
    }
}

module.exports = CommandDispatcher;
