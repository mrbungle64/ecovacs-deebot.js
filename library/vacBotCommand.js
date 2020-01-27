const tools = require('./tools.js'),
    Element = require('ltx').Element,
    constants = require('./ecovacsConstants.js');

class VacBotCommand {
    constructor(name, args = {}) {
        this.name = name;
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

class Clean extends VacBotCommand {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let initCmd = {
            'type': constants.CLEAN_MODE_TO_ECOVACS[mode],
            'speed': constants.FAN_SPEED_TO_ECOVACS['normal'],
            'act': constants.CLEAN_ACTION_TO_ECOVACS[action]
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                initCmd[key] = kwargs[key];
            }
        }
        tools.envLog('initCmd %s', initCmd);
        super('Clean', {
            'clean': initCmd,
            'id': getReqID()
        })
    }
}

function getReqID(customid = '0') {
    // Generate a somewhat random string for request id, with minium 8 chars. Works similar to ecovacs app
    // This is required for the Ozmo 930
    if (customid !== '0') {
        rtnval = customid; // return provided id as string
    } else {
        rtnval = Math.floor(Math.random() * 99999999) + 1;
    }
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

class Charge extends VacBotCommand {
    constructor() {
        super('Charge', {
            'charge': {
                'type': constants.CHARGE_MODE_TO_ECOVACS['return']
            },
            'id': getReqID()
        });
    }
}

class GetDeviceInfo extends VacBotCommand {
    constructor() {
        super('GetDeviceInfo');
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
            'type': constants.COMPONENT_TO_ECOVACS[component],
            'id': getReqID()
        });
    }
}

class SetTime extends VacBotCommand {
    constructor(timestamp, timezone) {
        super('SetTime', {
            'time': {
                't': timestamp,
                'tz': timezone
            }
        });
    }
}

class GetCleanSpeed extends VacBotCommand {
    constructor(component) {
        super('GetCleanSpeed');
    }
}

class SetWaterLevel extends VacBotCommand {
    constructor(level) {
        super('SetWaterPermeability', {
            'v': constants.WATER_LEVEL_TO_ECOVACS[level]
        });
    }
}

class GetWaterLevel extends VacBotCommand {
    constructor() {
        super('GetWaterPermeability');
    }
}

class PlaySound extends VacBotCommand {
    constructor(sid = '0') {
        super('PlaySound', {'sid': sid});
    }
}

module.exports.Clean = Clean;
module.exports.Edge = Edge;
module.exports.Spot = Spot;
module.exports.SpotArea = SpotArea;
module.exports.CustomArea = CustomArea;
module.exports.Stop = Stop;
module.exports.Pause = Pause;
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
module.exports.PlaySound = PlaySound;
