const constants = require('./ecovacsConstants');

function is950type(deviceClass) {
    switch (deviceClass) {
        case 'yna5xi': // Ozmo 950
        case 'vi829v': // Ozmo 920
        case 'h18jkh': // Ozmo T8
        case '55aiho': // Ozmo T8+
        case 'x5d34r': // Ozmo T8 AIVI
            return true;
        default:
            return false;
    }
}

function isN79series(deviceClass) {
    switch (deviceClass) {
        case '126': // N79
        case '155': // N79S/SE
        case '165': // N79T/W
            return true;
        default:
            return false;
    }
}

function getAllKnownDevices() {
    let devices = {};
    devices = Object.assign(devices, getSupportedDevices());
    devices = Object.assign(devices, getKnownDevices());
    return devices;
}

function getSupportedDevices() {
    return constants.SupportedDevices;
}

function getKnownDevices() {
    return constants.KnownDevices;
}

function getProductIotMap() {
    return constants.EcoVacsHomeProducts;
}

function getTimeString(time) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time % 3600) / 60);
    let seconds = Math.floor(time % 60);
    let timeString = hours.toString() + 'h ' + ((minutes < 10) ? '0' : '') + minutes.toString() + 'm ' + ((seconds < 10) ? '0' : '') + seconds.toString() + 's';
    return timeString;
}

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
    let command = str.toLowerCase().replace(/^_+|_+$/g, '').replace("get","").replace("server", "");
    if(command.startsWith("on")) { //950 series incoming events
        command = command.substring(2);
    }
    switch (command.toLowerCase()) {
        case 'clean':
        case 'cleanreport':
        case 'cleaninfo':
        case 'cleanstate':
            return 'CleanReport';
        case 'charge':
        case 'chargestate':
            return 'ChargeState';
        case 'battery':
        case 'batteryinfo':
            return 'BatteryInfo';
        case 'lifespan':
            return 'LifeSpan';
        case 'waterlevel':
        case 'waterpermeability':
        case 'waterinfo':
            return 'WaterLevel';
        case 'waterboxinfo':
            return 'WaterBoxInfo';
        case 'dustcasest':
            return 'DustCaseST';
        case 'chargeposition':
        case 'chargerpos':
            return 'ChargePosition';
        case 'pos':
        case 'deebotposition':
            return 'DeebotPosition';
        case 'netinfo':
        case 'getnetinfo':
            return 'NetInfo';
        case 'error':
        case 'errors':
            return 'Error';
        case 'sleepstatus':
            return 'SleepStatus';
        case 'cleansum':
            return 'CleanSum';
        case 'cleanspeed':
            return 'CleanSpeed';
        case 'mapset':
            return 'MapSet';
        case 'mapm':
        case 'mapp':
            return 'MapP';
        case 'getmapdata':
            return 'GetMapData';
        case 'pullmp':
            return 'PullMP';
        case 'pullm':
            return 'PullM';
        case 'cleanlogs':
        case 'logapicleanlogs':
            return 'CleanLogs';
        case 'off':
        case 'getonoff':
            return 'GetOnOff';
        case 'setonoff':
            return 'SetOnOff';
        default:
            envLog('[tools] Unknown command name: %s str: %s', command, str);
            return command;
    }
}

envLog = function () {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
        if (arguments[0]=="[DEBUG_INCOMING_RAW]" || arguments[0]=="[DEBUG_INCOMING]") {
            console.log.apply(this, [...arguments].slice(1)); //to keep things as is for dev
         } else {
            console.log.apply(this, arguments);
         }
    } else {
        if (process.env.NODE_ENV === "DEBUG_INCOMING_RAW" && arguments[0]=="[DEBUG_INCOMING_RAW]") { // only process debug messages
            console.log.apply(this, [...arguments].slice(1));
        }else if (process.env.NODE_ENV === "DEBUG_INCOMING" && arguments[0]=="[DEBUG_INCOMING]") { // only process debug messages
            console.log.apply(this, [...arguments].slice(1));
        }
    }
};

module.exports.isObject = isObject;
module.exports.isValidJsonString = isValidJsonString;
module.exports.getEventNameForCommandString = getEventNameForCommandString;
module.exports.envLog = envLog;
module.exports.getAllKnownDevices = getAllKnownDevices;
module.exports.getSupportedDevices = getSupportedDevices;
module.exports.getKnownDevices = getKnownDevices;
module.exports.getProductIotMap = getProductIotMap;
module.exports.getTimeString = getTimeString;
module.exports.is950type = is950type;
module.exports.isN79type = isN79type;
