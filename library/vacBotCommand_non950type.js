const tools = require('./tools');
const constants_type = require('./ecovacsConstants_non950type');
const Element = require('ltx').Element;

class VacBotCommand_non950type {
    constructor(name, args = {}) {
        this.name = name;
        if (!args.hasOwnProperty('id')) {
            args = Object.assign(args, {
                'id': tools.getReqID()
            })
        }
        this.args = args;
    }

    to_xml() {
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
        return this.args['id'];
    }

    toString() {
        return this.command_name() + ' command';
    }

    command_name() {
        return this.name.toLowerCase();
    }
}

class Clean extends VacBotCommand_non950type {
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
        super('Clean', {
            'clean': initCmd
        })
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
    constructor() {
        super('pause', 'pause');
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
        if (area !== '') {
            super('spot_area', action, {
                'mid': area
            });
        }
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', map_position = '', cleanings = 1) {
        if (map_position !== '') {
            super('spot_area', action, {
                'p': map_position,
                'deep': cleanings
            });
        }
    }
}

class Charge extends VacBotCommand_non950type {
    constructor() {
        super('Charge', {
            'charge': {
                'type': constants_type.CHARGE_MODE_TO_ECOVACS['return']
            }
        });
    }
}

class GetCleanState extends VacBotCommand_non950type {
    constructor() {
        super('GetCleanState');
    }
}

class GetChargeState extends VacBotCommand_non950type {
    constructor() {
        super('GetChargeState');
    }
}

class GetBatteryState extends VacBotCommand_non950type {
    constructor() {
        super('GetBatteryInfo');
    }
}

class GetLifeSpan extends VacBotCommand_non950type {
    constructor(component) {
        super('GetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

class GetCleanSpeed extends VacBotCommand_non950type {
    constructor() {
        super('GetCleanSpeed');
    }
}

class SetWaterLevel extends VacBotCommand_non950type {
    constructor(level) {
        super('SetWaterPermeability', {
            'v': level
        });
    }
}

class GetWaterLevel extends VacBotCommand_non950type {
    constructor() {
        super('GetWaterPermeability');
    }
}

class GetWaterBoxInfo extends VacBotCommand_non950type {
    constructor() {
        super('GetWaterBoxInfo');
    }
}

class PlaySound extends VacBotCommand_non950type {
    constructor(sid = '0') {
        super('PlaySound', {
            'count': 1,
            'sid': sid
        });
    }
}

class GetNetInfo extends VacBotCommand_non950type {
    constructor() {
        super('GetNetInfo');
    }
}

class GetPosition extends VacBotCommand_non950type {
    constructor() {
        super('GetPos');
    }
}

class GetChargerPos extends VacBotCommand_non950type {
    constructor() {
        super('GetChargerPos');
    }
}

class GetSleepStatus extends VacBotCommand_non950type {
    constructor() {
        super('GetSleepStatus');
    }
}

class GetCleanSum extends VacBotCommand_non950type {
    constructor() {
        super('GetCleanSum');
    }
}

class GetMapM extends VacBotCommand_non950type {
    constructor() {
        super('GetMapM');
    }
}

class PullMP extends VacBotCommand_non950type {
    constructor(pid) {
        super('PullMP', {
            'pid': pid
        });
    }
}

class PullM extends VacBotCommand_non950type {
    constructor(pid, tp, msid, mid) {
        super('PullM', {
            'tp': tp,
            'msid': msid,
            'mid': mid
        });
    }
}

class GetMapSet extends VacBotCommand_non950type {
    // sa = spot areas
    // vw = virtual walls
    constructor(tp = 'sa') {
        super('GetMapSet', {
            'tp': tp
        });
    }
}

class SetCleanSpeed extends VacBotCommand_non950type {
    constructor(level) {
        if (constants_type.CLEAN_SPEED_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.CLEAN_SPEED_TO_ECOVACS[level];
        }
        super('SetCleanSpeed', {
            'speed': level
        });
    }
}

class Move extends VacBotCommand_non950type {
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

class GetLogs extends VacBotCommand_non950type {
    constructor(count = 20) {
        super('GetLogs', {
            'count': count
        });
    }
}

class GetCleanLogs extends VacBotCommand_non950type {
    constructor(count = 20) {
        super('GetCleanLogs', {
            'count': count
        });
    }
}

class GetLogApiCleanLogs extends VacBotCommand_non950type {
    constructor() {
        super('GetLogApiCleanLogs');
    }
}

class GetOnOff extends VacBotCommand_non950type {
    constructor(type) {
        type = constants_type.ON_OFF_TO_ECOVACS[type];
        super('GetOnOff', {
            't': type
        });
    }
}

class SetOnOff extends VacBotCommand_non950type {
    constructor(type, on) {
        // on = 1, off = 0
        type = constants_type.ON_OFF_TO_ECOVACS[type];
        super('SetOnOff', {
            't': type,
            'on': on
        });
    }
}

class EnableDoNotDisturb extends SetOnOff {
    constructor() {
        super('do_not_disturb', 1);
    }
}

class DisableDoNotDisturb extends SetOnOff {
    constructor() {
        super('do_not_disturb', 0);
    }
}

// Untested
// Seems to be N79 Series only
class SetLifeSpan extends VacBotCommand_non950type {
    constructor(component, val = 100) {
        super('SetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component],
            'val': val
        });
    }
}

class ResetLifeSpan extends VacBotCommand_non950type {
    constructor(component) {
        super('ResetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

// Tested with
// - OZMO 930 (it works)
// - Deebot 901 (does not work)
class RenameSpotArea extends VacBotCommand_non950type {
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

module.exports.Charge = Charge;
module.exports.Clean = Clean;
module.exports.CustomArea = CustomArea;
module.exports.DisableDoNotDisturb = DisableDoNotDisturb;
module.exports.Edge = Edge;
module.exports.EnableDoNotDisturb = EnableDoNotDisturb;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetChargerPos = GetChargerPos;
module.exports.GetCleanLogs = GetCleanLogs;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.GetCleanState = GetCleanState;
module.exports.GetCleanSum = GetCleanSum;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.GetLogApiCleanLogs = GetLogApiCleanLogs;
module.exports.GetLogs = GetLogs;
module.exports.GetMapM = GetMapM;
module.exports.GetMapSet = GetMapSet;
module.exports.GetNetInfo = GetNetInfo;
module.exports.GetOnOff = GetOnOff;
module.exports.GetPosition = GetPosition;
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
module.exports.SetLifeSpan = SetLifeSpan;
module.exports.SetOnOff = SetOnOff;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.Spot = Spot;
module.exports.SpotArea = SpotArea;
module.exports.Stop = Stop;
