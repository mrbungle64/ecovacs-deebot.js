const tools = require('./tools.js'),
    constants_type = require('./ecovacsConstants_950type.js');

class VacBotCommand_950type {
    constructor(name, args = {}) {
        this.name = name;
        this.args = Object.assign(args, { 'id': getReqID() });
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
            'speed': constants_type.FAN_SPEED_TO_ECOVACS['normal'],
            'act': constants_type.CLEAN_ACTION_TO_ECOVACS[action]
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                initCmd[key] = kwargs[key];
            }
        }
        tools.envLog('initCmd %s', initCmd);
        super('Clean', initCmd);
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
        super('Clean', {'act': 'pause'});
    }
}

class Resume extends VacBotCommand_950type {
    constructor() {
        super('Clean', {'act': 'resume'});
    }
}

class Stop extends VacBotCommand_950type {
    constructor() {
        super('Clean',  {'act': 'stop'});
    }
}

class SpotArea extends Clean {
    constructor(action = 'start', area = '') {
        if (area !== '') {
            super('spotArea', action, {'content': area, 'count': '1'});
        }
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', map_position = '', cleanings = 1) {
        if (map_position !== '') {
            super('customArea', action, {'content': map_position, 'count': cleanings});
        }
    }
}

class Charge extends VacBotCommand_950type {
    constructor() {
        super('Charge', {'act': constants_type.CHARGE_MODE_TO_ECOVACS['return']}
        );
    }
}

class GetDeviceInfo extends VacBotCommand_950type {
    constructor() {
        super('GetDeviceInfo');
    }
}

class GetCleanState extends VacBotCommand_950type {
    constructor() {
        super('GetCleanState');
    }
}

class GetChargeState extends VacBotCommand_950type {
    constructor() {
        super('GetChargeState');
    }
}

class GetBatteryState extends VacBotCommand_950type {
    constructor() {
        super('GetBatteryInfo');
    }
}

class GetLifeSpan extends VacBotCommand_950type {
    constructor(component) {
        super('GetLifeSpan', [constants_type.COMPONENT_TO_ECOVACS[component]]);
    }
}

class SetTime extends VacBotCommand_950type {
    constructor(timestamp, timezone) {
        super('SetTime', {
            'time': {
                't': timestamp,
                'tz': timezone
            }
        });
    }
}

class GetCleanSpeed extends VacBotCommand_950type {
    constructor(component) {
        super('GetCleanSpeed');
    }
}

class SetWaterLevel extends VacBotCommand_950type {
    constructor(level) {
        if (constants_type.WATER_LEVEL_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.WATER_LEVEL_TO_ECOVACS[level];
        }
        super('SetWaterPermeability', {
            'amount': level
        });
    }
}

class GetWaterLevel extends VacBotCommand_950type {
    constructor() {
        super('GetWaterPermeability');
    }
}

class GetWaterBoxInfo extends VacBotCommand_950type {
    constructor() {
        super('GetWaterBoxInfo');
    }
}

class GetDeebotPos extends VacBotCommand_950type {
    constructor() {
        super('GetDeebotPos');
    }
}

class PlaySound extends VacBotCommand_950type {
    constructor(sid = '0') {
        super('PlaySound', {'count': 1, 'sid': sid});
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
module.exports.GetDeebotPos = GetDeebotPos;
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