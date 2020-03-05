const tools = require('./tools');
const constants_type = require('./ecovacsConstants_non950type');
const Element = require('ltx').Element;

class VacBotCommand_non950type {
    constructor(name, args = {}) {
        this.name = name;
        if (!args.hasOwnProperty('id')) {
            args = Object.assign(args, { 'id': getReqID() })
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
            'speed': constants_type.FAN_SPEED_TO_ECOVACS['normal'],
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

function getReqID() {
    // This is required for the Ozmo 930
    rtnval = Math.floor(Math.random() * 99999999) + 1;
    return rtnval.toString(); // return as string
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
            super('spot_area', action, {'mid': area});
        }
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', map_position = '', cleanings = 1) {
        if (map_position !== '') {
            super('spot_area', action, {'p': map_position, 'deep': cleanings});
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

class GetDeviceInfo extends VacBotCommand_non950type {
    constructor() {
        super('GetDeviceInfo');
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

class SetTime extends VacBotCommand_non950type {
    constructor(timestamp, timezone) {
        super('SetTime', {
            'time': {
                't': timestamp,
                'tz': timezone
            }
        });
    }
}

class GetCleanSpeed extends VacBotCommand_non950type {
    constructor(component) {
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
        super('PlaySound', {'count': 1, 'sid': sid});
    }
}

class GetNetInfo extends VacBotCommand_non950type {
    constructor() {
        super('GetNetInfo');
    }
}

class GetFirmwareVersion extends VacBotCommand_non950type {
    constructor() {
        super('GetVersion', {
            'name': 'FW'
        });
    }
}

class GetPos extends VacBotCommand_non950type {
    constructor() {
        super('GetPos');
    }
}

class GetChargerPos extends VacBotCommand_non950type {
    constructor() {
        super('GetChargerPos', {
            'id': '999999999'
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
module.exports.GetDeviceInfo = GetDeviceInfo;
module.exports.GetCleanState = GetCleanState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.SetTime = SetTime;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.GetWaterLevel = GetWaterLevel;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.GetWaterBoxInfo = GetWaterBoxInfo;
module.exports.PlaySound = PlaySound;
module.exports.GetFirmwareVersion = GetFirmwareVersion;
module.exports.GetPos = GetPos;
module.exports.GetChargerPos = GetChargerPos;
module.exports.GetNetInfo = GetNetInfo;
