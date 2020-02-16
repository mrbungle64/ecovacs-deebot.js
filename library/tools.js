
function isObject(val) {
    if (val === null) {
        return false;
    }
    return ((typeof val === 'function') || (typeof val === 'object'));
}

function isValidJsonString(str) {
    try {
        envLog("[tools] isValidJsonString() str: %s", str);
        JSON.parse(str);
    } catch (e) {
        envLog("[tools] isValidJsonString() false");
        return false;
    }
    envLog("[tools] isValidJsonString() true");
    return true;
}

function getEventNameForCommandString(str) {
    envLog("[tools] getEventNameForCommandString() str: %s", str);
    let command = str.toLowerCase().replace(/^_+|_+$/g, '').replace("get","").replace("server", "");
    envLog("[tools] getEventNameForCommandString() command: %s", command);
    switch (command.toLowerCase()) {
        case 'clean':
        case 'cleanreport':
        case 'cleaninfo':
            return 'CleanReport';
        case 'charge':
        case 'chargestate':
            return 'ChargeState';
        case "battery":
        case 'batteryinfo':
            return 'BatteryInfo';
        case 'lifespan':
            return 'LifeSpan';
        case "waterlevel":
        case "waterpermeability":
        case "waterinfo":
            return 'WaterLevel';
        case "waterboxinfo":
            return 'WaterBoxInfo';
        case "deebotposition":
            return 'DeebotPosition';
        default:
            envLog("[tools] Unknown command name: %s str: %s", command, str);
            return command;
    }
}

envLog = function () {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
        console.log.apply(this, arguments);
    }
};

module.exports.isObject = isObject;
module.exports.isValidJsonString = isValidJsonString;
module.exports.getEventNameForCommandString = getEventNameForCommandString;
module.exports.envLog = envLog;
