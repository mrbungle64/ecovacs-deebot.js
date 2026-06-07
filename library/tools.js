'use strict';

const deebotModels = require('./models');
const modelTypes = require('./modelTypes');
const capabilityTypes = require('./capabilityTypes');
const constants = require('./constants');
const chalk = require('chalk');

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
 * Map rendering is pure-JS now (no native `canvas` module), so it is always
 * available regardless of the build toolchain.
 * @returns {boolean} always true
 */
function isMapRenderingAvailable() {
    return true;
}

/**
 * Backward-compatible alias for {@link isMapRenderingAvailable}. Kept because the
 * public `getCanvasModuleIsAvailable()` API and existing integrations call it.
 * @returns {boolean} always true
 */
function isCanvasModuleAvailable() {
    return isMapRenderingAvailable();
}

/**
 * Translates the Node.js error message for some network related error messages (e.g. `ENOTFOUND`)
 * @param {string} message - The error message received from the server
 * @param {string} [command=''] - The command
 * @returns {string} the error description
 */
function createErrorDescription(message, command = '') {
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
 * Generate a somewhat random 8-digit numeric string for use as a request ID.
 * @returns {string} the generated ID
 */
function getReqID() {
    let reqIdString = '';
    for (let i = 0; i < 8; i++) {
        const randomValue = Math.floor(Math.random() * 10).toString();
        reqIdString = reqIdString + randomValue;
    }
    return reqIdString;
}

/**
 * Recursively freezes an object and all nested plain-object / array values.
 * Only freezes own enumerable properties; skips null/non-objects.
 * @param {Object} obj
 * @returns {Object} the same object, now frozen
 */
function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
        return obj;
    }
    Object.freeze(obj);
    for (const val of Object.values(obj)) {
        deepFreeze(val);
    }
    return obj;
}

// Module-level frozen memos — built once at require() time, never cloned again.
const _supportedDevices = deepFreeze(
    Object.assign({}, deebotModels.SupportedDeebotModels, deebotModels.SupportedAirPurifierModels)
);
const _allKnownDevices = deepFreeze(
    Object.assign(
        {},
        deebotModels.SupportedDeebotModels,
        deebotModels.SupportedAirPurifierModels,
        deebotModels.KnownDeebotModels,
        deebotModels.KnownYeediModels,
        deebotModels.KnownLawnMowerModels,
        deebotModels.LegacyDevices
    )
);
const _allKnownModelTypes = deepFreeze(Object.assign({}, modelTypes.ModelTypes));

/**
 * Get all known devices, including the supported devices and the known devices
 * @returns {Object} a frozen dictionary of all known devices
 */
function getAllKnownDevices() {
    return _allKnownDevices;
}

/**
 * @returns {Object} a frozen dictionary of supported devices
 */
function getSupportedDevices() {
    return _supportedDevices;
}

/**
 * @returns {Object} a dictionary of known devices
 */
function getKnownDevices() {
    return Object.assign(
        {},
        deebotModels.KnownDeebotModels,
        deebotModels.KnownYeediModels,
        deebotModels.KnownLawnMowerModels
    );
}


/**
 * Check if the deviceClass belongs to a supported model
 * @param {string} deviceClass - The device class to check for
 * @returns {boolean} whether the deviceClass belongs to a supported model
 */
function isSupportedDevice(deviceClass) {
    return _supportedDevices.hasOwnProperty(deviceClass);
}

/**
 * Check if the deviceClass belongs to a known model
 * @param {string} deviceClass - The device class to check for
 * @returns {boolean} whether the deviceClass belongs to a known model
 */
function isKnownDevice(deviceClass) {
    return _allKnownDevices.hasOwnProperty(deviceClass);
}

/**
 * Returns true if the model is a legacy model
 * @returns {boolean}
 */
function isLegacyModel(deviceClass) {
    return getPlatformType(deviceClass) === 'legacy';
}

/**
 * Returns the platform/architecture type of the model (e.g. '950', 'T8', 'T20', 'airbot').
 * This is the technical architecture key, not the product category.
 * @param {string} deviceClass
 * @returns {string}
 */
function getPlatformType(deviceClass) {
    if (_allKnownDevices.hasOwnProperty(deviceClass)) {
        return getDeviceProperty(deviceClass, 'type', 'unknown');
    }
    const dynamicDevice = getDynamicDevice(deviceClass);
    if (dynamicDevice) {
        return getDeviceProperty(deviceClass, 'type', 'unknown');
    }
    return 'unknown';
}

/**
 * Returns the human-readable product category of the device
 * (e.g. 'Vacuum Cleaner', 'Air Purifier', 'Lawn Mower').
 * @param {string} deviceClass
 * @returns {string}
 */
function getDeviceCategory(deviceClass) {
    if (_allKnownDevices.hasOwnProperty(deviceClass)) {
        return getDeviceProperty(deviceClass, 'deviceCategory', 'unknown');
    }
    const dynamicDevice = getDynamicDevice(deviceClass);
    if (dynamicDevice) {
        return getDeviceProperty(deviceClass, 'deviceCategory', 'unknown');
    }
    return 'unknown';
}

/**
 * Returns the smartType (internal IoT platform generation/protocol) of the model
 * (e.g. 'MQ_AP', 'BLAP2', 'QRP', 'SPA', 'BT').
 * @param {string} deviceClass
 * @returns {string}
 */
function getSmartType(deviceClass) {
    if (_allKnownDevices.hasOwnProperty(deviceClass)) {
        return getDeviceProperty(deviceClass, 'smartType', 'unknown');
    }
    const dynamicDevice = getDynamicDevice(deviceClass);
    if (dynamicDevice) {
        return getDeviceProperty(deviceClass, 'smartType', 'unknown');
    }
    return 'unknown';
}


/**
 * @deprecated use getPlatformType()
 * Returns the type of the model
 * @returns {string}
 */
function getModelType(deviceClass) {
    return getPlatformType(deviceClass);
}

/**
 * @deprecated use getDeviceCategory()
 * Returns the device type
 * @returns {string}
 */
function getDeviceType(deviceClass) {
    return getDeviceCategory(deviceClass);
}

/**
 * Get the value of the given property for the device class
 * @param {string} deviceClass - The device class to get the property for
 * @param {string} property - The property to get
 * @param {any} [defaultValue=false] - The default value to return if the property is not found
 * @returns {any} The value of the property for the device class
 */
function getDeviceProperty(deviceClass, property, defaultValue = false) {
    let value = defaultValue;
    const devices = _allKnownDevices;
    let device;

    if (devices.hasOwnProperty(deviceClass)) {
        device = devices[deviceClass];
    } else {
        device = getDynamicDevice(deviceClass);
    }

    if (device) {
        if (device.hasOwnProperty('deviceClassLink') && devices[device.deviceClassLink]) {
            device = devices[device.deviceClassLink];
        }

        let platformType = device.type;
        if (platformType) {
            const platformTypeProperties = _allKnownModelTypes[platformType];
            if (platformTypeProperties && platformTypeProperties.hasOwnProperty(property)) {
                value = platformTypeProperties[property];
            }
        }

        if (device.capabilities && Array.isArray(device.capabilities)) {
            for (const capability of device.capabilities) {
                const capProps = capabilityTypes.CapabilityTypes[capability];
                if (capProps && capProps.hasOwnProperty(property)) {
                    value = capProps[property];
                }
            }
        }

        if (device.hasOwnProperty(property)) {
            value = device[property];
        }

        // Backward compatibility
        if (property === 'mopping_system') {
            if (value === defaultValue) {
                const waterAmount = getDeviceProperty(deviceClass, 'water_amount', 'NOT_FOUND');
                if (waterAmount !== 'NOT_FOUND') {
                    value = true;
                }
            }
        } else if (property === '950type_V2') {
            if (value === defaultValue) {
                const v2 = getDeviceProperty(deviceClass, 'V2', 'NOT_FOUND');
                if (v2 !== 'NOT_FOUND') {
                    value = v2;
                }
            }
        } else if (property === '950type') {
            if (value === defaultValue) {
                value = !isLegacyModel(deviceClass);
            }
        } else if (property === 'auto_empty_station') {
            if (value === defaultValue) {
                const opt = getDeviceProperty(deviceClass, 'auto_empty_station_optional', 'NOT_FOUND');
                if (opt !== 'NOT_FOUND') {
                    value = opt;
                }
            }
        }
    }
    return value;
}

const dynamicDevicesCache = new Map();
let productIotMapData = null;

/**
 * Gets or resolves an unknown deviceClass dynamically using model similarity & heuristics.
 * @param {string} deviceClass - The 6-character class ID.
 * @returns {Object|null} The resolved device properties object, or null.
 */
function getDynamicDevice(deviceClass) {
    if (!deviceClass) {
        return null;
    }
    if (dynamicDevicesCache.has(deviceClass)) {
        return dynamicDevicesCache.get(deviceClass);
    }
    try {
        if (!productIotMapData) {
            productIotMapData = require('./productIotMap.json');
        }
        const modelResolver = require('./modelResolver');
        const resolved = modelResolver.resolveDeviceProperties(deviceClass, productIotMapData, getAllKnownDevices());
        if (resolved) {
            dynamicDevicesCache.set(deviceClass, resolved);
            if (resolved.resolvedViaSimilarity) {
                logWarn(`[tools] Device class "${deviceClass}" is not explicitly registered. Dynamically resolved to ${resolved.name} (Similarity: ${resolved.resolvedSimilarityScore}%) based on dynamic analysis.`);
            } else if (resolved.resolvedViaHeuristics) {
                logWarn(`[tools] Device class "${deviceClass}" is not explicitly registered. Inferred features dynamically via heuristic patterns.`);
            }
            return resolved;
        }
    } catch (err) {
        logError(`[tools] Failed to dynamically resolve properties for device class "${deviceClass}": ${err.message}`);
    }
    return null;
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
        envLog(`[tools] isValidJsonString() str: ${jsonString}`);
        JSON.parse(jsonString);
    } catch {
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
 * Converts the comma separated area value list to a format
 * that the Deebot X2 requires for the freeClean cleaning type
 *
 * @param {string} areaValues - The area values string to be converted
 * @returns {string} The converted area values string
 */
function convertAreaValuesForFreeCleanCmd(areaValues) {
    areaValues = areaValues.replace(/ /g, ''); // Remove all spaces
    areaValues = areaValues.replace(/,$/, ''); // Remove trailing comma
    if (!areaValues.includes(';')) {
        let areas = areaValues.split(',');
        areaValues = '1,' + areas[0] + ';';
        for (let i = 1; i < areas.length; i++) {
            const value = areas[i];
            if (value !== '') {
                areaValues = areaValues + '1,' + value + ';';
            }
        }
    }
    return areaValues;
}

/**
 * Checks if the area values are valid
 * for the freeClean cleaning type (X2 series)
 *
 * @param {string} areaValues - The area values to be checked.
 * @returns {boolean} - True if all area values are valid, false otherwise.
 */
function areaValuesAreValidForFreeCleanCmd(areaValues) {
    // Regular expression that matches an integer, a comma and another integer
    const regex = /^\d+,?\d+(;|$)/;
    // Remove trailing semikolon
    areaValues = areaValues.replace(/;$/, '');
    // Split the string into segments using semicolons
    const segments = areaValues.split(';');
    // Check whether each segment corresponds to the regular expression
    return segments.every(segment => regex.test(segment));
}

/**
 * Selects the portal base-URL format string for the given account region.
 * China accounts use the CN portal; a `WW` country or continent uses the legacy
 * portal; everything else uses the default `api-app` portal. The returned string
 * still contains the `{continent}` placeholder for {@link formatString}.
 * @param {string} country - the (upper-case) ISO country code
 * @param {string} [continent=''] - the continent code
 * @returns {string} the templated portal base URL
 */
function getPortalUrlFormat(country, continent = '') {
    if (country === 'CN') {
        return constants.PORTAL_ECOUSER_API_CN;
    }
    if ((country === 'WW') || ((continent || '').toUpperCase() === 'WW')) {
        return constants.PORTAL_ECOUSER_API_LEGACY;
    }
    return constants.PORTAL_ECOUSER_API;
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

function verbose(message) {
    if ((process.env.NODE_ENV === 'development') || (process.env.NODE_ENV === 'dev')) {
        if (message !== '') {
            return true;
        }
    }
    return false;
}

function envLogHeader(message) {
    if (verbose(message)) {
        console.log(chalk.bgRgb(255, 233, 0).blue(' function ') + ' ' + chalk.rgb(255, 233, 0)(message));
    }
}

function envLogCommand(message) {
    if (verbose(message)) {
        console.log(chalk.bgRgb(255, 233, 0).blue(' command ') + ' ' + chalk.rgb(255, 233, 0)(message));
    }
}

function envLogMqtt(message) {
    if (verbose(message)) {
        console.log(chalk.bgRgb(255, 233, 0).black(' MQTT ') + ' ' + message);
    }
}

function envLogFwBuryPoint(message) {
    if (verbose(message)) {
        if (typeof message === 'object') {
            console.log(chalk.bgMagenta.white(' FwBuryPoint '));
            console.log(message);
        } else if (message !== '') {
            console.log(chalk.bgMagenta.white(' FwBuryPoint ') + ' ' + chalk.white(message));
        }
    }
}

function envLogResult(name, message) {
    if (verbose(message)) {
        console.log(chalk.bgGreen.white(' result ') + ' ' + chalk.bgYellow.black(name) + ' ' + message);
    }
}

function envLogSuccess(message) {
    if (verbose(message)) {
        console.log(chalk.bgGreen.white(' success ') + ' ' + chalk.green(message));
    }
}

function envLogNotice(message) {
    if (verbose(message)) {
        console.log(chalk.bgRgb(255, 233, 0).black(' notice ') + ' ' + chalk.italic(message));
    }
}

function envLogPayload(message) {
    if (verbose(message)) {
        if (typeof message === 'object') {
            console.log(chalk.bgGreen.white(' payload '));
            console.log(message);
        } else if (message !== '') {
            console.log(chalk.bgGreen.white(' payload ') + ' ' + chalk.green(message));
        }
    }
}

function envLogInfo(message) {
    if (verbose(message)) {
        logInfo(message);
    }
}

function envLogWarn(message) {
    if (verbose(message)) {
        logWarn(message);
    }
}

function envLogError(message) {
    if (verbose(message)) {
        logError(message);
    }
}

function envLogRaw(message) {
    if (verbose(message)) {
        console.log(message);
    }
}

function logEvent(event, value) {
    if (typeof value === 'object') {
        console.log(chalk.bgGreen.white(' event ') + ' ' + chalk.green(event));
        console.log(value);
    } else {
        console.log(chalk.bgGreen.white(' event ') + ' ' + chalk.green(event) + ' ' + value);
    }
}

/**
 * Logs an event only in development mode (`dev`/`development`). Used for the
 * library's internal per-payload tracing so it stays silent by default and does
 * not leak raw robot payloads into consumer logs. The public `logEvent` remains
 * available for callers that want to log unconditionally.
 * @param {string} event - the event name
 * @param {*} value - the event value/payload
 */
function envLogEvent(event, value) {
    if (verbose(event)) {
        logEvent(event, value);
    }
}

function logInfo(message) {
    if (typeof message === 'object') {
        console.log(chalk.bgWhite.black(' object '));
        console.log(message);
    } else if (message !== '') {
        console.log(chalk.bgWhite.black(' info ') + ' ' + message);
    }
}

function logWarn(message) {
    if (message !== '') {
        console.log(chalk.bgRgb(255, 164, 0).white(' warn ') + ' ' + chalk.rgb(255, 164, 0)(message));
    }
}

function logError(message) {
    if (message !== '') {
        console.log(chalk.bgRed.white(' error ') + ' ' + chalk.red(message));
    }
}

/**
 * Resolves after the given number of milliseconds.
 * @param {number} ms - the delay in milliseconds
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if the given (axios) error represents an HTTP 502 Bad Gateway
 * response. The Ecovacs cloud returns this sporadically; it is safe to retry.
 * @param {*} error - the caught error
 * @returns {boolean}
 */
function isBadGatewayError(error) {
    return Boolean(error && error.response && error.response.status === 502);
}

/**
 * Runs an async operation with limited, defensive retries.
 *
 * Only retries when `retryOn({error})` or `retryOn({result})` returns true.
 * Waits `backoffMs[attempt]` (clamped to the last entry) before each retry.
 * Re-throws the last error / returns the last result once retries are exhausted,
 * so the caller's existing success/error handling stays unchanged.
 *
 * @template T
 * @param {() => Promise<T>} fn - the async operation to (re)try
 * @param {Object} [opts]
 * @param {number} [opts.retries=3] - total number of attempts (including the first)
 * @param {(info: {error?: *, result?: T}) => boolean} [opts.retryOn] - predicate deciding whether to retry
 * @param {number[]} [opts.backoffMs] - delay before each retry (default `[0, 500, 1500]`)
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
    const retries = opts.retries ?? 3;
    const retryOn = opts.retryOn ?? (() => false);
    const backoffMs = opts.backoffMs ?? [0, 500, 1500];
    for (let attempt = 0; ; attempt++) {
        const isLast = attempt >= retries - 1;
        try {
            const result = await fn();
            if (!isLast && retryOn({ result })) {
                await delay(backoffMs[Math.min(attempt, backoffMs.length - 1)]);
                continue;
            }
            return result;
        } catch (error) {
            if (!isLast && retryOn({ error })) {
                await delay(backoffMs[Math.min(attempt, backoffMs.length - 1)]);
                continue;
            }
            throw error;
        }
    }
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

module.exports.areaValuesAreValidForFreeCleanCmd = areaValuesAreValidForFreeCleanCmd;
module.exports.convertAreaValuesForFreeCleanCmd = convertAreaValuesForFreeCleanCmd;
module.exports.createErrorDescription = createErrorDescription;
module.exports.delay = delay;
module.exports.envLog = envLog;
module.exports.formatString = formatString;
module.exports.isBadGatewayError = isBadGatewayError;
module.exports.withRetry = withRetry;
module.exports.getAllKnownDevices = getAllKnownDevices;
module.exports.getDeviceProperty = getDeviceProperty;
module.exports.getDynamicDevice = getDynamicDevice;
module.exports.getKnownDevices = getKnownDevices;
module.exports.getPlatformType = getPlatformType;
module.exports.getPortalUrlFormat = getPortalUrlFormat;
module.exports.getDeviceCategory = getDeviceCategory;
module.exports.getSmartType = getSmartType;
module.exports.getModelType = getModelType;     // @deprecated – use getPlatformType
module.exports.getDeviceType = getDeviceType;   // @deprecated – use getDeviceCategory
module.exports.getReqID = getReqID;
module.exports.getSupportedDevices = getSupportedDevices;
module.exports.getTimeStringFormatted = getTimeStringFormatted;
module.exports.isCanvasModuleAvailable = isCanvasModuleAvailable;
module.exports.isMapRenderingAvailable = isMapRenderingAvailable;
module.exports.isKnownDevice = isKnownDevice;
module.exports.isLegacyModel = isLegacyModel;
module.exports.isObject = isObject;
module.exports.isSupportedDevice = isSupportedDevice;
module.exports.isValidJsonString = isValidJsonString;
module.exports.isValidVirtualWallType = isValidVirtualWallType;
module.exports.paramsToQueryList = paramsToQueryList;

module.exports.envLogCommand = envLogCommand;
module.exports.envLogError = envLogError;
module.exports.envLogEvent = envLogEvent;
module.exports.envLogFwBuryPoint = envLogFwBuryPoint;
module.exports.envLogHeader = envLogHeader;
module.exports.envLogInfo = envLogInfo;
module.exports.envLogMqtt = envLogMqtt;
module.exports.envLogNotice = envLogNotice;
module.exports.envLogPayload = envLogPayload;
module.exports.envLogRaw = envLogRaw;
module.exports.envLogResult = envLogResult;
module.exports.envLogSuccess = envLogSuccess;
module.exports.envLogWarn = envLogWarn;

module.exports.logError = logError;
module.exports.logEvent = logEvent;
module.exports.logInfo = logInfo;
module.exports.logWarn = logWarn;