
function isObject(val) {
    if (val === null) {
        return false;
    }
    return ((typeof val === 'function') || (typeof val === 'object'));
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
module.exports.xmlDocumentElement2Json = xmlDocumentElement2Json;
module.exports.envLog = envLog;
