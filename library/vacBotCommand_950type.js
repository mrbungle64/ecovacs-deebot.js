const tools = require('./tools.js'),
    constants_type = require('./ecovacsConstants_950type.js'),
    constants = require('./ecovacsConstants.js');

class VacBotCommand_950type {
    constructor(name, args = {}, api = constants.IOTDEVMANAGERAPI) {
        this.name = name;
        if (!args.hasOwnProperty('id')) {
            args = Object.assign(args, { 'id': tools.getReqID() })
        }
        this.args = args;
        this.api = api;
    }

    toString() {
        return this.command_name() + ' command';
    }

    command_name() {
        return this.name.toLowerCase();
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

class Edge extends Clean {
    constructor() {
        super('edge', 'start');
    }
}

class Spot extends Clean {
    constructor() {
        super('spot', 'start', {'content':'0,0'});
    }
}

class Pause extends VacBotCommand_950type {
    constructor() {
        super('clean', {'act': 'pause'});
    }
}

class Resume extends VacBotCommand_950type {
    constructor() {
        super('clean', {'act': 'resume'});
    }
}

class Stop extends VacBotCommand_950type {
    constructor() {
        super('clean',  {'act': 'stop'});
    }
}

class SpotArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        if (area !== '') {
            let cleaningAsNumber = Number(cleanings);
            super('spotArea', action, {'content': area, 'count': cleaningAsNumber});
        }
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', map_position = '', cleanings = 1) {
        if (map_position !== '') {
            let cleaningAsNumber = Number(cleanings);
            super('customArea', action, {'content': map_position, 'count': cleaningAsNumber});
        }
    }
}

class Charge extends VacBotCommand_950type {
    constructor() {
        super('charge', {'act': constants_type.CHARGE_MODE_TO_ECOVACS['return']}
        );
    }
}

class Move extends VacBotCommand_950type {
    constructor(action) {
        console.log(action);
        if (constants_type.MOVE_ACTION.hasOwnProperty(action)) {
            action = constants_type.MOVE_ACTION[action];
        }
        console.log(action);
        super("move", {'act': action});
    }
}

class MoveBackward extends Move {
    constructor() {
        super("backward");
    }
}

class MoveForward extends Move {
    constructor() {
        super("forward");
    }
}

class MoveLeft extends Move {
    constructor() {
        super("left");
    }
}

class MoveRight extends Move {
    constructor() {
        super("right");
    }
}

class MoveTurnAround extends Move {
    constructor() {
        super("turn_around");
    }
}

class GetDeviceInfo extends VacBotCommand_950type {
    constructor() {
        super('getDeviceInfo');
    }
}

class Relocate extends VacBotCommand_950type {
    constructor() {
        super('setRelocationState', { "mode": "manu" });
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
    constructor(component) {
        super('getLifeSpan', [constants_type.COMPONENT_TO_ECOVACS[component]]);
    }
}

class ResetLifeSpan extends VacBotCommand_950type {
    constructor(component) {
        super('resetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

class SetTime extends VacBotCommand_950type {
    constructor(timestamp, timezone) {
        super('setTime', {
            'time': {
                't': timestamp,
                'tz': timezone
            }
        });
    }
}

class GetCleanSpeed extends VacBotCommand_950type {
    constructor(component) {
        super('getSpeed');
    }
}

class GetError extends VacBotCommand_950type {
    constructor(component) {
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
        super('getPos', ["chargePos", "deebotPos"]);
    }
}

class PlaySound extends VacBotCommand_950type {
    constructor(sid = 0) {
        let sidAsNumber = Number(sid);
        super('playSound', {'sid': sidAsNumber});
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

class GetMaps extends VacBotCommand_950type {
    constructor() {
        super('getCachedMapInfo');
    }
}

class GetMapSet extends VacBotCommand_950type {
    constructor(mapID, type='ar') {
        super('getMapSet', {'mid': mapID, 'type': type});
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
    constructor(mapID, mapSubSetID, type='ar') { //default type is spotAreas
        super('getMapSubSet', {'mid': mapID, 'mssid': mapSubSetID, 'type': type});
    }
}

class DeleteMapSubSet extends VacBotCommand_950type {
    constructor(mapID, mapSubSetID, type='vw') { //default type is delete virtualWall
        super('setMapSubSet', {'act': 'del', 'mid': mapID, 'mssid': mapSubSetID, 'type': type});
    }
}

class AddMapSubSet extends VacBotCommand_950type {
    constructor(mapID, coordinates, mapSubSetType='vw') { //default type is virtualWall
        super('setMapSubSet', {'act': 'add', 'mid': mapID, 'type': mapSubSetType, 'value': coordinates});
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

class GetCleanLogsPullCleanF extends VacBotCommand_950type {
    constructor() {
        super('Pull', {}, constants.LGLOGAPI);
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

// T8 +/plus only
class GetAutoEmpty extends VacBotCommand_950type {
    constructor() {
        super('getAutoEmpty');
    }
}

// T8 +/plus only
class SetAutoEmpty extends VacBotCommand_950type {
    constructor(enable = 0) {
        super('setAutoEmpty', {
            'enable': enable
        });
    }
}

module.exports.Clean = Clean;
module.exports.Edge = Edge;
module.exports.Spot = Spot;
module.exports.SpotArea = SpotArea;
module.exports.CustomArea = CustomArea;
module.exports.Stop = Stop;
module.exports.Pause = Pause;
module.exports.Resume = Resume;
module.exports.Charge = Charge;
module.exports.Move = Move;
module.exports.MoveBackward = MoveBackward;
module.exports.MoveForward = MoveForward;
module.exports.MoveLeft = MoveLeft;
module.exports.MoveRight = MoveRight;
module.exports.MoveTurnAround = MoveTurnAround;
module.exports.GetDeviceInfo = GetDeviceInfo;
module.exports.GetCleanState = GetCleanState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.ResetLifeSpan = ResetLifeSpan;
module.exports.GetPosition = GetPosition;
module.exports.SetTime = SetTime;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.SetCleanSpeed = SetCleanSpeed;
module.exports.GetWaterInfo = GetWaterInfo;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.PlaySound = PlaySound;
module.exports.Relocate = Relocate;
module.exports.GetMaps = GetMaps;
module.exports.GetMapSet = GetMapSet;
module.exports.GetError = GetError;
module.exports.GetNetInfo = GetNetInfo;
module.exports.GetSleepStatus = GetSleepStatus;
module.exports.GetCleanSum = GetCleanSum;
module.exports.GetMapSpotAreas = GetMapSpotAreas;
module.exports.GetMapSpotAreaInfo = GetMapSpotAreaInfo;
module.exports.GetMapVirtualBoundaries = GetMapVirtualBoundaries;
module.exports.GetMapVirtualBoundaryInfo = GetMapVirtualBoundaryInfo;
module.exports.DeleteMapVirtualBoundary = DeleteMapVirtualBoundary;
module.exports.AddMapVirtualBoundary = AddMapVirtualBoundary;
module.exports.GetCleanLogs = GetCleanLogs;
module.exports.GetLastCleanLog = GetLastCleanLog;
module.exports.GetCleanLogsPullCleanF = GetCleanLogsPullCleanF;
module.exports.GetVolume = GetVolume;
module.exports.SetVolume = SetVolume;
module.exports.GetAutoEmpty = GetAutoEmpty;
module.exports.SetAutoEmpty = SetAutoEmpty;
