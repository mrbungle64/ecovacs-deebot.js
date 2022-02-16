'use strict';

const deebotModels = require('./deebotModels');

function isCanvasModuleAvailable() {
    try {
        require.resolve('canvas');
        return true;
    } catch (e) {
        return false;
    }
}

function createErrorDescription(message) {
    if (message.includes('ENOTFOUND')) {
        return `DNS lookup failed: ${message}`;
    } else if (message.includes('EHOSTUNREACH')) {
        return `Host is unreachable: ${message}`;
    } else if (message.includes('ECONNRESET')) {
        return `Connection is interrupted: ${message}`;
    } else if (message.includes('ETIMEDOUT') || message.includes('EAI_AGAIN')) {
        return `Network connectivity error: ${message}`;
    } else {
        return `Received error message: ${message}`;
    }
}

// Generate a somewhat random string for request id with 8 chars.
// Works similar to ecovacs app
// This is required for e.g. the Ozmo 930
function getReqID() {
    let reqIdString = '';
    let rtnval = '';
    for (let i = 0; i < 8; i++) {
        rtnval = Math.floor(Math.random() * 10);
        reqIdString = reqIdString + rtnval.toString();
    }
    return reqIdString.toString();
}

function is710series(deviceClass) {
    return deviceClass === 'uv242z';
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
    Object.assign(devices, getSupportedDevices());
    Object.assign(devices, getKnownDevices());
    return devices;
}

function getSupportedDevices() {
    return deebotModels.SupportedDevices;
}

function getKnownDevices() {
    return deebotModels.KnownDevices;
}

function isSupportedDevice(deviceClass) {
    const devices = JSON.parse(JSON.stringify(getSupportedDevices()));
    return devices.hasOwnProperty(deviceClass);
}

function isKnownDevice(deviceClass) {
    const devices = JSON.parse(JSON.stringify(getKnownDevices()));
    return devices.hasOwnProperty(deviceClass) || isSupportedDevice(deviceClass);
}

function getDeviceProperty(deviceClass, property, defaultValue = false) {
    const devices = JSON.parse(JSON.stringify(getAllKnownDevices()));
    if (devices.hasOwnProperty(deviceClass)) {
        let device = devices[deviceClass];
        if ((!device.hasOwnProperty(property)) && (device.hasOwnProperty('deviceClassLink'))) {
            device = devices[device['deviceClassLink']];
        }
        if (device.hasOwnProperty(property)) {
            return device[property];
        }
    }
    return defaultValue;
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
        envLog('[tools] isValidJsonString() str: %s', str);
        JSON.parse(str);
    } catch (e) {
        envLog('[tools] isValidJsonString() false');
        return false;
    }
    envLog('[tools] isValidJsonString() true');
    return true;
}

function isValidVirtualWallType(type) {
    return (type === 'vw') || (type === 'mw');
}

let envLog = function () {
    if ((process.env.NODE_ENV === 'development') || (process.env.NODE_ENV === 'dev')) {
        console.log.apply(this, arguments);
    }
};

module.exports.isObject = isObject;
module.exports.isValidJsonString = isValidJsonString;
module.exports.isValidVirtualWallType = isValidVirtualWallType;
module.exports.envLog = envLog;
module.exports.getAllKnownDevices = getAllKnownDevices;
module.exports.getSupportedDevices = getSupportedDevices;
module.exports.getKnownDevices = getKnownDevices;
module.exports.isSupportedDevice = isSupportedDevice;
module.exports.isKnownDevice = isKnownDevice;
module.exports.getDeviceProperty = getDeviceProperty;
module.exports.getTimeString = getTimeString;
module.exports.isN79series = isN79series;
module.exports.is710series = is710series;
module.exports.getReqID = getReqID;
module.exports.isCanvasModuleAvailable = isCanvasModuleAvailable;
module.exports.createErrorDescription = createErrorDescription;
