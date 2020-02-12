
function isObject(val) {
    if (val === null) {
        return false;
    }
    return ((typeof val === 'function') || (typeof val === 'object'));
}

function isValidJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function getEventNameForCommandString(str) {
    envLog("[tools] getEventNameForCommandString() str: %s", str);
    let command = str.replace(/^_+|_+$/g, '').replace('Get','').replace("Server", "");
    switch (command.toLowerCase()) {
        case 'clean':
        case 'cleanreport':
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

function xmlDocumentElement2Json(element) {
    let json = {};
    json[element.nodeName] = {};
    for (let a = 0; a < element.attributes.length; a++) {
        json[element.nodeName][element.attributes[a].name] = element.attributes[a].value;
    }
    for (let c = 0; c < element.childNodes.length; c++) {
        let child = element.childNodes[c];
        json[element.nodeName][child.nodeName] = {};
        for (a = 0; a < child.attributes.length; a++) {
            json[element.nodeName][child.nodeName][child.attributes[a].name] = child.attributes[a].value;
        }
    }
    return json;
}

envLog = function () {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
        console.log.apply(this, arguments);
    }
};

module.exports.isObject = isObject;
module.exports.isValidJsonString = isValidJsonString;
module.exports.getEventNameForCommandString = getEventNameForCommandString;
module.exports.xmlDocumentElement2Json = xmlDocumentElement2Json;
module.exports.envLog = envLog;
