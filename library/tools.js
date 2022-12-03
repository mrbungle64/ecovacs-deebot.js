'use strict';

const deebotModels = require('./models');

function formatString(string) {
    if (arguments.length === 0) {
        return string;
    }
    const args = arguments[1];
    return string.replace(/{(\w+)}/g, function (match, key) {
        return typeof args[key] !== 'undefined' ? args[key] : match;
    });
}

/**
 * @returns {boolean} whether the canvas module is available
 */
function isCanvasModuleAvailable() {
    try {
        require.resolve('canvas');
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Translates the Node.js error message for some network related error messages (e.g. `ENOTFOUND`)
 * @param {string} message - The error message received from the server
 * @param {string} [command=''] - The command
 * @returns {string} the error description
 */
function createErrorDescription(message, command= '') {
    if (message.includes('ENOTFOUND')) {
        return `DNS lookup failed: ${message}`;
    } else if (message.includes('EHOSTUNREACH')) {
        return `Host is unreachable: ${message}`;
    } else if (message.includes('ECONNRESET')) {
        return `Connection is interrupted: ${message}`;
    } else if (message.includes('ETIMEDOUT') || message.includes('EAI_AGAIN')) {
        return `Network connectivity error: ${message}`;
    } else if (command !== '') {
        return `Received error message: ${message} for command ${command}`;
    } else {
        return `Received error message: ${message}`;
    }
}

/**
 * Generate a somewhat random string for request id with 8 chars.
 * This is required for e.g. the OZMO 930 (possibly required for all models using XMPP)
 * @returns {string} the generated ID
 */
function getReqID() {
    let reqIdString = '';
    let randomValue = '';
    for (let i = 0; i < 8; i++) {
        randomValue = Math.floor(Math.random() * 10).toString();
        reqIdString = reqIdString + randomValue;
    }
    return reqIdString;
}

/**
 * @param {string} deviceClass - The device class of the device
 * @returns {boolean} a Boolean value whether the device a 710 series model
 */
function is710series(deviceClass) {
    return deviceClass === 'uv242z';
}

/**
 * @param {string} deviceClass - The device class of the device
 * @returns {boolean} a Boolean value whether the device a N79 series model
 */
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

/**
 * @param {string} deviceClass - The device class of the device
 * @returns {boolean} a Boolean value whether the device is an air purifier
 */
function isAirPurifier(deviceClass) {
    switch (deviceClass) {
        case 'sdp1y1': // AIRBOT Z1
        case '20anby': // Z1 Air Quality Monitor
            return true;
        default:
            return false;
    }
}

/**
 * Get all known devices, including the supported devices and the known devices
 * @returns {Object} a dictionary of all known devices
 */
function getAllKnownDevices() {
    let devices = {};
    Object.assign(devices, getSupportedDevices());
    Object.assign(devices, getKnownDevices());
    return devices;
}

/**
 * @returns {Object} a dictionary of supported devices
 */
function getSupportedDevices() {
    return deebotModels.SupportedDevices;
}

/**
 * @returns {Object} a dictionary of known devices
 */
function getKnownDevices() {
    return deebotModels.KnownDevices;
}

/**
 * Check if the deviceClass belongs to a supported model
 * @param {string} deviceClass - The device class to check for
 * @returns {boolean} whether the deviceClass belongs to a supported model
 */
function isSupportedDevice(deviceClass) {
    const devices = JSON.parse(JSON.stringify(getSupportedDevices()));
    return devices.hasOwnProperty(deviceClass);
}

/**
 * Check if the deviceClass belongs to a known model
 * @param {string} deviceClass - The device class to check for
 * @returns {boolean} whether the deviceClass belongs to a known model
 */
function isKnownDevice(deviceClass) {
    const devices = JSON.parse(JSON.stringify(getKnownDevices()));
    return devices.hasOwnProperty(deviceClass) || isSupportedDevice(deviceClass);
}

/**
 * Returns true if the model is a legacy model
 * @returns {boolean}
 */
function isLegacyModel(deviceClass) {
    return getModelType(deviceClass) === 'legacy';
}

/**
 * Returns the type of the model
 * @returns {String}
 */
function getModelType(deviceClass) {
    const devices = JSON.parse(JSON.stringify(getKnownDevices()));
    if (devices.hasOwnProperty(deviceClass) || isSupportedDevice(deviceClass)) {
        return getDeviceProperty(deviceClass, 'type', 'unknown');
    }
    return 'unknown';
}

/**
 * Get the value of the given property for the device class
 * @param {string} deviceClass - The device class to get the property for
 * @param {string} property - The property to get
 * @param {any} [defaultValue=false] - The default value to return if the property is not found
 * @returns {any} The value of the property for the device class
 */
function getDeviceProperty(deviceClass, property, defaultValue = false) {
    const devices = JSON.parse(JSON.stringify(getAllKnownDevices()));
    if (devices.hasOwnProperty(deviceClass)) {
        let device = devices[deviceClass];
        if ((!device.hasOwnProperty(property)) && (device.hasOwnProperty('deviceClassLink'))) {
            device = devices[device.deviceClassLink];
        }
        if (device.hasOwnProperty(property)) {
            return device[property];
        }
    }
    return defaultValue;
}

/**
 * Given a total number of seconds, return a string that is formatted as hours, minutes, and seconds
 * @param {number} totalSeconds - The total number of seconds to format
 * @returns {string} a string that is formatted as hours, minutes, and seconds
 */
function getTimeStringFormatted(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return hours + 'h ' + ((minutes < 10) ? '0' : '') + minutes + 'm ' + ((seconds < 10) ? '0' : '') + seconds + 's';
}

/**
 * Returns true if the value is an object, false if it is not
 * @param {any} val - The value to check.
 * @returns {boolean} whether it is an object
 */
function isObject(val) {
    if (val === null) {
        return false;
    }
    return ((typeof val === 'function') || (typeof val === 'object'));
}

/**
 * Given a string, return true if it is a valid JSON string, false otherwise
 * @param {string} jsonString - The string to be tested
 * @returns {boolean} whether it is a valid JSON string
 */
function isValidJsonString(jsonString) {
    try {
        envLog('[tools] isValidJsonString() str: %s', jsonString);
        JSON.parse(jsonString);
    } catch (e) {
        envLog('[tools] isValidJsonString() false');
        return false;
    }
    envLog('[tools] isValidJsonString() true');
    return true;
}

/**
 * Given a string, return true if it is either `vw` or `mw`
 * @param {string} type - The type of the virtual boundary
 * @returns {boolean} whether it is a virtual wall type
 */
function isValidVirtualWallType(type) {
    return (type === 'vw') || (type === 'mw');
}

/**
 * Given a dictionary of parameters, return a string of the form "key1=value1&key2=value2&key3=value3"
 * @param {Object} params - the parameters to be encoded
 * @returns {string} a string of the form "key1=value1&key2=value2&key3=value3"
 */
function paramsToQueryList(params) {
    let query = [];
    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            query.push(key + "=" + encodeURIComponent(params[key]));
        }
    }
    return query.join('&');
}

/**
 * Prints to `stdout` only in development mode (`dev` or `development`)
 */
let envLog = function () {
    if ((process.env.NODE_ENV === 'development') || (process.env.NODE_ENV === 'dev')) {
        if (arguments) {
            console.log.apply(this, arguments);
        } else {
            console.log(this);
        }
    }
};

module.exports.createErrorDescription = createErrorDescription;
module.exports.envLog = envLog;
module.exports.formatString = formatString;
module.exports.getAllKnownDevices = getAllKnownDevices;
module.exports.getDeviceProperty = getDeviceProperty;
module.exports.getKnownDevices = getKnownDevices;
module.exports.getModelType = getModelType;
module.exports.getReqID = getReqID;
module.exports.getSupportedDevices = getSupportedDevices;
module.exports.getTimeStringFormatted = getTimeStringFormatted;
module.exports.is710series = is710series;
module.exports.isAirPurifier = isAirPurifier;
module.exports.isCanvasModuleAvailable = isCanvasModuleAvailable;
module.exports.isKnownDevice = isKnownDevice;
module.exports.isLegacyModel = isLegacyModel;
module.exports.isN79series = isN79series;
module.exports.isObject = isObject;
module.exports.isSupportedDevice = isSupportedDevice;
module.exports.isValidJsonString = isValidJsonString;
module.exports.isValidVirtualWallType = isValidVirtualWallType;
module.exports.paramsToQueryList = paramsToQueryList;
