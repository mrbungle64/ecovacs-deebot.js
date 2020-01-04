const tools = require('./tools.js'),
    Element = require('ltx').Element,
    constants = require('./ecovacsConstants.js');

class VacBotCommand {
    constructor(name, args = null) {
        if (args === null) {
            args = {}
        }
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
        return this.command_name() + " command";
    }

    command_name() {
        return this.name.toLowerCase();
    }
}

class Clean extends VacBotCommand {
    constructor(mode = "auto", speed = "normal", iotmq = false, action = 'start') {
        if (arguments.length < 5) {
            // Looks like action is needed for some bots, shouldn't affect older models
            super('Clean', {
                'clean': {
                    'type': constants.CLEAN_MODE_TO_ECOVACS[mode],
                    'speed': constants.ecovacs_fan_speed(speed),
                    'act': constants.CLEAN_ACTION_TO_ECOVACS[action]
                }
            })
        } else {
            let initCmd = {
                'type': constants.CLEAN_MODE_TO_ECOVACS[mode],
                'speed': constants.ecovacs_fan_speed(speed)
            };
            for (let key in arguments) {
                if (arguments.hasOwnProperty(key)) {
                    initCmd[key] = arguments[key];
                }
            }
            super('Clean', {
                'clean': initCmd
            })
        }
    }
}

class Edge extends Clean {
    constructor() {
        super('edge', 'high')
    }
}

class Spot extends Clean {
    constructor() {
        super('spot', 'high')
    }
}

class Stop extends Clean {
    constructor() {
        super('stop', 'normal')
    }
}

class Charge extends VacBotCommand {
    constructor() {
        super("Charge", {
            'charge': {
                'type': constants.CHARGE_MODE_TO_ECOVACS['return']
            }
        });
    }
}

class GetDeviceInfo extends VacBotCommand {
    constructor() {
        super("GetDeviceInfo");
    }
}

class GetCleanState extends VacBotCommand {
    constructor() {
        super("GetCleanState");
    }
}

class GetChargeState extends VacBotCommand {
    constructor() {
        super("GetChargeState");
    }
}

class GetBatteryState extends VacBotCommand {
    constructor() {
        super("GetBatteryInfo");
    }
}

class GetLifeSpan extends VacBotCommand {
    constructor(component) {
        super("GetLifeSpan", {
            'type': constants.COMPONENT_TO_ECOVACS[component]
        });
    }
}

class SetTime extends VacBotCommand {
    constructor(timestamp, timezone) {
        super("SetTime", {
            'time': {
                't': timestamp,
                'tz': timezone
            }
        });
    }
}

module.exports.VacBotCommand = VacBotCommand;
module.exports.Clean = Clean;
module.exports.Edge = Edge;
module.exports.Spot = Spot;
module.exports.Stop = Stop;
module.exports.Charge = Charge;
module.exports.GetDeviceInfo = GetDeviceInfo;
module.exports.GetCleanState = GetCleanState;
module.exports.GetChargeState = GetChargeState;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.SetTime = SetTime;
