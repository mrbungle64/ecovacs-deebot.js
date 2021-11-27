const tools = require('./tools');
const constants_type = require('./ecovacsConstants_950type');
const constants = require('./ecovacsConstants');

class VacBotCommand_950type {
    constructor(name, args = {}, api = constants.IOTDEVMANAGERAPI) {
        this.name = name;
        if (!args.hasOwnProperty('id')) {
            Object.assign(args, {
                'id': tools.getReqID()
            })
        }
        this.args = args;
        this.api = api;
    }

    getId() {
        return this.args.id;
    }
}

class Clean extends VacBotCommand_950type {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let initCmd = {
            'type': constants_type.CLEAN_MODE_TO_ECOVACS[mode],
            'act': constants_type.CLEAN_ACTION_TO_ECOVACS[action]
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                initCmd[key] = kwargs[key];
            }
        }
        tools.envLog('initCmd %s', initCmd);
        super('clean', initCmd);
    }
}

class Clean_V2 extends VacBotCommand_950type {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let initCmd = {
            'act': constants_type.CLEAN_ACTION_TO_ECOVACS[action],
            'content': {
                'type': constants_type.CLEAN_MODE_TO_ECOVACS[mode],
            }
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                Object.assign(initCmd[key], kwargs[key])
            }
        }
        tools.envLog('initCmd %s', initCmd);
        super('clean_V2', initCmd);
    }
}

class Edge extends Clean {
    constructor() {
        super('edge', 'start');
    }
}

class Spot extends Clean {
    constructor() {
        super('spot', 'start', {
            'content': '0,0'
        });
    }
}

class SpotArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('spotArea', action, {
            'content': area,
            'count': cleaningAsNumber
        });
    }
}

class SpotArea_V2 extends Clean_V2 {
    constructor(area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('spotArea', 'start', {
            'content': {
                'total': 0,
                'donotClean': 0,
                'count': cleaningAsNumber,
                'value': area
            }
        });
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('customArea', action, {
            'content': area,
            'count': cleaningAsNumber
        });
    }
}

class CustomArea_V2 extends Clean_V2 {
    constructor(area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('customArea', 'start', {
            'content': {
                'total': 0,
                'donotClean': 0,
                'count': cleaningAsNumber,
                'value': area
            }
        });
    }
}

class Pause extends VacBotCommand_950type {
    constructor() {
        super('clean', {
            'act': 'pause'
        });
    }
}

class Resume extends VacBotCommand_950type {
    constructor() {
        super('clean', {
            'act': 'resume'
        });
    }
}

class Stop extends VacBotCommand_950type {
    constructor() {
        super('clean', {
            'act': 'stop'
        });
    }
}

class Charge extends VacBotCommand_950type {
    constructor() {
        super('charge', {
                'act': 'go'
            }
        );
    }
}

class Move extends VacBotCommand_950type {
    constructor(action) {
        if (constants_type.MOVE_ACTION.hasOwnProperty(action)) {
            action = constants_type.MOVE_ACTION[action];
        }
        super('move', {
            'act': action
        });
    }
}

class MoveBackward extends Move {
    constructor() {
        super('backward');
    }
}

class MoveForward extends Move {
    constructor() {
        super('forward');
    }
}

class MoveLeft extends Move {
    constructor() {
        super('left');
    }
}

class MoveRight extends Move {
    constructor() {
        super('right');
    }
}

class MoveTurnAround extends Move {
    constructor() {
        super('turn_around');
    }
}

class Relocate extends VacBotCommand_950type {
    constructor() {
        super('setRelocationState', {
            'mode': 'manu'
        });
    }
}

class GetCleanState extends VacBotCommand_950type {
    constructor() {
        super('getCleanInfo');
    }
}

class GetChargeState extends VacBotCommand_950type {
    constructor() {
        super('getChargeState');
    }
}

class GetBatteryState extends VacBotCommand_950type {
    constructor() {
        super('getBattery');
    }
}

class GetLifeSpan extends VacBotCommand_950type {
    constructor(componentsArray) {
        super('getLifeSpan', componentsArray);
    }
}

class ResetLifeSpan extends VacBotCommand_950type {
    constructor(component) {
        super('resetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

class GetCleanSpeed extends VacBotCommand_950type {
    constructor() {
        super('getSpeed');
    }
}

class GetError extends VacBotCommand_950type {
    constructor() {
        super('getError');
    }
}

class SetCleanSpeed extends VacBotCommand_950type {
    constructor(level) {
        if (constants_type.CLEAN_SPEED_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.CLEAN_SPEED_TO_ECOVACS[level];
        }
        super('setSpeed', {
            'speed': level
        });
    }
}

class SetWaterLevel extends VacBotCommand_950type {
    constructor(level) {
        if (constants_type.WATER_LEVEL_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.WATER_LEVEL_TO_ECOVACS[level];
        }
        super('setWaterInfo', {
            'amount': level
        });
    }
}

class GetWaterInfo extends VacBotCommand_950type {
    constructor() {
        super('getWaterInfo');
    }
}

class GetPosition extends VacBotCommand_950type {
    constructor() {
        super('getPos', ['chargePos', 'deebotPos']);
    }
}

class PlaySound extends VacBotCommand_950type {
    constructor(sid = 0) {
        let sidAsNumber = Number(sid);
        super('playSound', {
            'sid': sidAsNumber
        });
    }
}

class GetNetInfo extends VacBotCommand_950type {
    constructor() {
        super('getNetInfo');
    }
}

class GetCleanSum extends VacBotCommand_950type {
    constructor() {
        super('getTotalStats');
    }
}

class GetMajorMap extends VacBotCommand_950type {
    constructor() {
        super('getMajorMap');
    }
}

class GetMapImage extends VacBotCommand_950type {
    constructor(mapID, mapType = 'outline') {
        if (constants.MAPINFOTYPE_TO_ECOVACS.hasOwnProperty(mapType)) {
            mapType = constants.MAPINFOTYPE_TO_ECOVACS[mapType];
        }
        super('getMapInfo', {
            'mid': mapID,
            'type': mapType
        });
    }
}

class GetMaps extends VacBotCommand_950type {
    constructor() {
        super('getCachedMapInfo');
    }
}

class GetMapSet extends VacBotCommand_950type {
    constructor(mapID, type = 'ar') {
        super('getMapSet', {
            'mid': mapID,
            'type': type
        });
    }
}

class GetMapSpotAreas extends GetMapSet {
    constructor(mapID) {
        super(mapID, 'ar');
    }
}

class GetMapVirtualBoundaries extends GetMapSet {
    constructor(mapID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapVirtualBoundaryType);
    }
}

class GetMapSubSet extends VacBotCommand_950type {
    constructor(mapID, mapSubSetID, type = 'ar') { //default type is spotAreas
        super('getMapSubSet', {
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type
        });
    }
}

class DeleteMapSubSet extends VacBotCommand_950type {
    constructor(mapID, mapSubSetID, type = 'vw') { //default type is delete virtualWall
        super('setMapSubSet', {
            'act': 'del',
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type
        });
    }
}

class AddMapSubSet extends VacBotCommand_950type {
    constructor(mapID, coordinates, mapSubSetType = 'vw') { //default type is virtualWall
        super('setMapSubSet', {
            'act': 'add',
            'mid': mapID,
            'type': mapSubSetType,
            'value': coordinates
        });
    }
}

class GetMapSpotAreaInfo extends GetMapSubSet {
    constructor(mapID, mapSubSetID) {
        super(mapID, mapSubSetID, 'ar');
    }
}

class GetMapVirtualBoundaryInfo extends GetMapSubSet {
    constructor(mapID, mapSubSetID, mapVirtualBoundaryType = 'vw') { //default type is virtualWall
        super(mapID, mapSubSetID, mapVirtualBoundaryType);
    }
}

class DeleteMapVirtualBoundary extends DeleteMapSubSet {
    constructor(mapID, mapSubSetID, mapVirtualBoundaryType = 'vw') { //default type is virtualWall
        super(mapID, mapSubSetID, mapVirtualBoundaryType);
    }
}

class AddMapVirtualBoundary extends AddMapSubSet {
    constructor(mapID, mapVirtualBoundaryCoordinates, mapVirtualBoundaryType = 'vw') { //default type is virtualWall
        super(mapID, mapVirtualBoundaryCoordinates, mapVirtualBoundaryType);
    }
}

class GetSleepStatus extends VacBotCommand_950type {
    constructor() {
        super('getSleep');
    }
}

class GetCleanLogs extends VacBotCommand_950type {
    constructor(count = 3) {
        super('GetCleanLogs', {'count': count}, constants.LGLOGAPI);
    }
}

class GetLastCleanLog extends VacBotCommand_950type {
    constructor() {
        super('GetLastCleanLog', {}, constants.LGLOGAPI);
    }
}

class GetVolume extends VacBotCommand_950type {
    constructor() {
        super('getVolume');
    }
}

class SetVolume extends VacBotCommand_950type {
    constructor(volume = 1) {
        super('setVolume', {
            'volume': volume
        });
    }
}

class GetAutoEmpty extends VacBotCommand_950type {
    constructor() {
        super('getAutoEmpty');
    }
}

class SetAutoEmpty extends VacBotCommand_950type {
    constructor(enable = 0) {
        super('setAutoEmpty', {
            'enable': enable
        });
    }
}

class EmptyDustBin extends VacBotCommand_950type {
    constructor() {
        super('setAutoEmpty', {
            'act': 'start'
        });
    }
}

class GetContinuousCleaning extends VacBotCommand_950type {
    constructor() {
        super('getBreakPoint');
    }
}

class EnableContinuousCleaning extends VacBotCommand_950type {
    constructor() {
        super('setBreakPoint', {
            'enable': 1
        });
    }
}

class DisableContinuousCleaning extends VacBotCommand_950type {
    constructor() {
        super('setBreakPoint', {
            'enable': 0
        });
    }
}

class SetDoNotDisturb extends VacBotCommand_950type {
    constructor(enable = 0, start = '22:00', end = '21:59') {
        super('setBlock', {
            'enable': enable,
            'start': start,
            'end': end
        });
    }
}

class GetDoNotDisturb extends VacBotCommand_950type {
    constructor() {
        super('getBlock');
    }
}

class EnableDoNotDisturb extends SetDoNotDisturb {
    constructor(start = '22:00', end = '21:59') {
        super(1, start, end);
    }
}

class DisableDoNotDisturb extends VacBotCommand_950type {
    constructor() {
        super('setBlock', {
            'enable': 0
        });
    }
}

class SetAdvancedMode extends VacBotCommand_950type {
    constructor(enable = 0) {
        super('setAdvancedMode', {
            'enable': enable
        });
    }
}

class GetAdvancedMode extends VacBotCommand_950type {
    constructor() {
        super('getAdvancedMode');
    }
}

class SetTrueDetect extends VacBotCommand_950type {
    constructor(enable = 0) {
        super('setTrueDetect', {
            'enable': enable
        });
    }
}

class GetTrueDetect extends VacBotCommand_950type {
    constructor() {
        super('getTrueDetect');
    }
}

class GetSchedule extends VacBotCommand_950type {
    constructor() {
        super('getSched');
    }
}

class GetDusterRemind extends VacBotCommand_950type {
    constructor() {
        super('getDusterRemind');
    }
}

class SetDusterRemind extends VacBotCommand_950type {
    constructor(enable = 0) {
        super('setDusterRemind', {
            'enable': enable
        });
    }
}

class SetDusterRemindPeriod extends VacBotCommand_950type {
    constructor(period = 30) {
        super('setDusterRemind', {
            'period': period
        });
    }
}

class GetCarpetPressure extends VacBotCommand_950type {
    constructor() {
        super('getCarpertPressure');
    }
}

class SetCarpetPressure extends VacBotCommand_950type {
    constructor(enable = 0) {
        super('setCarpertPressure', {
            'enable': enable
        });
    }
}

module.exports.AddMapVirtualBoundary = AddMapVirtualBoundary;
module.exports.Charge = Charge;
module.exports.Clean = Clean;
module.exports.Clean_V2 = Clean_V2;
module.exports.CustomArea = CustomArea;
module.exports.CustomArea_V2 = CustomArea_V2;
module.exports.DeleteMapVirtualBoundary = DeleteMapVirtualBoundary;
module.exports.DisableContinuousCleaning = DisableContinuousCleaning;
module.exports.DisableDoNotDisturb = DisableDoNotDisturb;
module.exports.Edge = Edge;
module.exports.EmptyDustBin = EmptyDustBin;
module.exports.EnableContinuousCleaning = EnableContinuousCleaning;
module.exports.EnableDoNotDisturb = EnableDoNotDisturb;
module.exports.GetAdvancedMode = GetAdvancedMode;
module.exports.GetAutoEmpty = GetAutoEmpty;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetCarpetPressure = GetCarpetPressure;
module.exports.GetChargeState = GetChargeState;
module.exports.GetCleanLogs = GetCleanLogs;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.GetCleanState = GetCleanState;
module.exports.GetCleanSum = GetCleanSum;
module.exports.GetContinuousCleaning = GetContinuousCleaning;
module.exports.GetDoNotDisturb = GetDoNotDisturb;
module.exports.GetDusterRemind = GetDusterRemind;
module.exports.GetError = GetError;
module.exports.GetLastCleanLog = GetLastCleanLog;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.GetMapImage = GetMapImage;
module.exports.GetMapSet = GetMapSet;
module.exports.GetMapSpotAreaInfo = GetMapSpotAreaInfo;
module.exports.GetMapSpotAreas = GetMapSpotAreas;
module.exports.GetMapVirtualBoundaries = GetMapVirtualBoundaries;
module.exports.GetMapVirtualBoundaryInfo = GetMapVirtualBoundaryInfo;
module.exports.GetMaps = GetMaps;
module.exports.GetNetInfo = GetNetInfo;
module.exports.GetPosition = GetPosition;
module.exports.GetSchedule = GetSchedule;
module.exports.GetSleepStatus = GetSleepStatus;
module.exports.GetTrueDetect = GetTrueDetect;
module.exports.GetVolume = GetVolume;
module.exports.GetWaterInfo = GetWaterInfo;
module.exports.Move = Move;
module.exports.MoveBackward = MoveBackward;
module.exports.MoveForward = MoveForward;
module.exports.MoveLeft = MoveLeft;
module.exports.MoveRight = MoveRight;
module.exports.MoveTurnAround = MoveTurnAround;
module.exports.Pause = Pause;
module.exports.PlaySound = PlaySound;
module.exports.Relocate = Relocate;
module.exports.ResetLifeSpan = ResetLifeSpan;
module.exports.Resume = Resume;
module.exports.SetAdvancedMode = SetAdvancedMode;
module.exports.SetAutoEmpty = SetAutoEmpty;
module.exports.SetCarpetPressure = SetCarpetPressure;
module.exports.SetCleanSpeed = SetCleanSpeed;
module.exports.SetDoNotDisturb = SetDoNotDisturb;
module.exports.SetDusterRemind = SetDusterRemind;
module.exports.SetDusterRemindPeriod = SetDusterRemindPeriod;
module.exports.SetTrueDetect = SetTrueDetect;
module.exports.SetVolume = SetVolume;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.Spot = Spot;
module.exports.SpotArea = SpotArea;
module.exports.SpotArea_V2 = SpotArea_V2;
module.exports.Stop = Stop;
