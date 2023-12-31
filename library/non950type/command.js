'use strict';

const tools = require('../tools');
const constants_type = require('./dictionary');
const Element = require('ltx').Element;

class VacBotCommand {
    constructor(name, args = {}) {
        this.name = name;
        if (!args.hasOwnProperty('id')) {
            Object.assign(args, {
                'id': tools.getReqID()
            });
        }
        this.args = args;
    }

    toXml() {
        let ctl = new Element('ctl', {
            td: this.name
        });
        for (let key in this.args) {
            if (this.args.hasOwnProperty(key)) {
                let value = this.args[key];
                if (tools.isObject(value)) {
                    ctl.c(key, value);
                } else {
                    ctl.attr(key, value);
                }
            }
        }
        return ctl;
    }

    getId() {
        return this.args.id;
    }
}

class Clean extends VacBotCommand {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let initCmd = {
            'type': constants_type.CLEAN_MODE_TO_ECOVACS[mode],
            'speed': constants_type.CLEAN_SPEED_TO_ECOVACS[2],
            'act': constants_type.CLEAN_ACTION_TO_ECOVACS[action]
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                initCmd[key] = kwargs[key];
            }
        }
        tools.envLog('initCmd %s', initCmd);
        super('Clean', {
            'clean': initCmd
        });
    }
}

class Edge extends Clean {
    constructor() {
        super('edge');
    }
}

class Spot extends Clean {
    constructor() {
        super('spot');
    }
}

class Pause extends Clean {
    constructor(mode = 'auto') {
        super(mode, 'pause');
    }
}

class Resume extends Clean {
    constructor() {
        super('auto', 'resume');
    }
}

class Stop extends Clean {
    constructor() {
        super('stop', 'stop');
    }
}

class SpotArea extends Clean {
    constructor(action = 'start', area = '') {
        super('spot_area', action, {
            'mid': area
        });
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', area = '', cleaningAsNumber = 1) {
        super('spot_area', action, {
            'p': area,
            'deep': cleaningAsNumber
        });
    }
}

class Charge extends VacBotCommand {
    constructor() {
        super('Charge', {
            'charge': {
                'type': 'go'
            }
        });
    }
}

class GetCleanState extends VacBotCommand {
    constructor() {
        super('GetCleanState');
    }
}

class GetChargeState extends VacBotCommand {
    constructor() {
        super('GetChargeState');
    }
}

class GetBatteryState extends VacBotCommand {
    constructor() {
        super('GetBatteryInfo');
    }
}

class GetLifeSpan extends VacBotCommand {
    constructor(component) {
        super('GetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

class GetCleanSpeed extends VacBotCommand {
    constructor() {
        super('GetCleanSpeed');
    }
}

class SetWaterLevel extends VacBotCommand {
    constructor(level) {
        super('SetWaterPermeability', {
            'v': level
        });
    }
}

class GetWaterLevel extends VacBotCommand {
    constructor() {
        super('GetWaterPermeability');
    }
}

class GetWaterBoxInfo extends VacBotCommand {
    constructor() {
        super('GetWaterBoxInfo');
    }
}

class PlaySound extends VacBotCommand {
    constructor(sid) {
        super('PlaySound', {
            'sid': sid
        });
    }
}

class GetNetInfo extends VacBotCommand {
    constructor() {
        super('GetNetInfo');
    }
}

class GetPosition extends VacBotCommand {
    constructor() {
        super('GetPos');
    }
}

class GetChargerPos extends VacBotCommand {
    constructor() {
        super('GetChargerPos');
    }
}

class GetSleepStatus extends VacBotCommand {
    constructor() {
        super('GetSleepStatus');
    }
}

class GetCleanSum extends VacBotCommand {
    constructor() {
        super('GetCleanSum');
    }
}

class GetMapM extends VacBotCommand {
    constructor() {
        super('GetMapM');
    }
}

class PullMP extends VacBotCommand {
    constructor(pid) {
        super('PullMP', {
            'pid': pid
        });
    }
}

class PullM extends VacBotCommand {
    constructor(mapSetType, mapSetId, mapDetailId) {
        super('PullM', {
            'tp': mapSetType,
            'msid': mapSetId,
            'mid': mapDetailId
        });
    }
}

class GetMapSet extends VacBotCommand {
    // sa = spot areas
    // vw = virtual walls
    constructor(tp = 'sa') {
        super('GetMapSet', {
            'tp': tp
        });
    }
}

class SetCleanSpeed extends VacBotCommand {
    constructor(level) {
        if (constants_type.CLEAN_SPEED_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.CLEAN_SPEED_TO_ECOVACS[level];
        }
        super('SetCleanSpeed', {
            'speed': level
        });
    }
}

class Move extends VacBotCommand {
    constructor(action) {
        if (constants_type.ACTION.hasOwnProperty(action)) {
            action = constants_type.ACTION[action];
        }
        super("Move", {
            'move': {
                'action': action
            }
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

class GetLogs extends VacBotCommand {
    constructor(count = 20) {
        super('GetLogs', {
            'count': count
        });
    }
}

class GetCleanLogs extends VacBotCommand {
    constructor(count = 20) {
        super('GetCleanLogs', {
            'count': count
        });
    }
}

class GetLogApiCleanLogs extends VacBotCommand {
    constructor() {
        super('GetLogApiCleanLogs');
    }
}

class GetOnOff extends VacBotCommand {
    constructor(type) {
        if (constants_type.ON_OFF_TO_ECOVACS.hasOwnProperty(type)) {
            type = constants_type.ON_OFF_TO_ECOVACS[type];
        }
        super('GetOnOff', {
            't': type
        });
    }
}

class SetOnOff extends VacBotCommand {
    constructor(type, on) {
        // on = 1, off = 0
        if (constants_type.ON_OFF_TO_ECOVACS.hasOwnProperty(type)) {
            type = constants_type.ON_OFF_TO_ECOVACS[type];
        }
        super('SetOnOff', {
            't': type,
            'on': on
        });
    }
}

class GetContinuousCleaning extends GetOnOff {
    constructor() {
        super('continuous_cleaning');
    }
}

class SetContinuousCleaning extends SetOnOff {
    constructor(enable = 0) {
        super('continuous_cleaning', enable);
    }
}

class GetDoNotDisturb extends GetOnOff {
    constructor() {
        super('do_not_disturb');
    }
}

class SetDoNotDisturb extends SetOnOff {
    constructor(enable = 0) {
        super('do_not_disturb', enable);
    }
}

// Untested
// Seems to be N79 Series only
class SetLifeSpan extends VacBotCommand {
    constructor(component, val = 100) {
        super('SetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component],
            'val': val
        });
    }
}

class ResetLifeSpan extends VacBotCommand {
    constructor(component) {
        super('ResetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

// Tested with
// - OZMO 930 (it works)
// - Deebot 901 (does not work)
class RenameSpotArea extends VacBotCommand {
    constructor(msid, mid, name) {
        super('RenameM', {
            'tp': 'sa',
            'msid': msid,
            'm': {
                'mid': mid,
                'n': name
            }
        });
    }
}

class GetSchedule extends VacBotCommand {
    constructor() {
        super('GetSched');
    }
}

module.exports.Generic = VacBotCommand;

module.exports.Charge = Charge;
module.exports.Clean = Clean;
module.exports.CustomArea = CustomArea;
module.exports.Edge = Edge;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetChargerPos = GetChargerPos;
module.exports.GetCleanLogs = GetCleanLogs;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.GetCleanState = GetCleanState;
module.exports.GetCleanSum = GetCleanSum;
module.exports.GetContinuousCleaning = GetContinuousCleaning;
module.exports.GetDoNotDisturb = GetDoNotDisturb;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.GetLogApiCleanLogs = GetLogApiCleanLogs;
module.exports.GetLogs = GetLogs;
module.exports.GetMapM = GetMapM;
module.exports.GetMapSet = GetMapSet;
module.exports.GetNetInfo = GetNetInfo;
module.exports.GetOnOff = GetOnOff;
module.exports.GetPosition = GetPosition;
module.exports.GetSchedule = GetSchedule;
module.exports.GetSleepStatus = GetSleepStatus;
module.exports.GetWaterBoxInfo = GetWaterBoxInfo;
module.exports.GetWaterLevel = GetWaterLevel;
module.exports.Move = Move;
module.exports.MoveBackward = MoveBackward;
module.exports.MoveForward = MoveForward;
module.exports.MoveLeft = MoveLeft;
module.exports.MoveRight = MoveRight;
module.exports.MoveTurnAround = MoveTurnAround;
module.exports.Pause = Pause;
module.exports.PlaySound = PlaySound;
module.exports.PullM = PullM;
module.exports.PullMP = PullMP;
module.exports.RenameSpotArea = RenameSpotArea;
module.exports.ResetLifeSpan = ResetLifeSpan;
module.exports.Resume = Resume;
module.exports.SetCleanSpeed = SetCleanSpeed;
module.exports.SetContinuousCleaning = SetContinuousCleaning;
module.exports.SetDoNotDisturb = SetDoNotDisturb;
module.exports.SetLifeSpan = SetLifeSpan;
module.exports.SetOnOff = SetOnOff;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.Spot = Spot;
module.exports.SpotArea = SpotArea;
module.exports.Stop = Stop;
