/**
 * Checks if the area values are valid
 * for the freeClean cleaning type (X2 series)
 *
 * @param {string} areaValues - The area values to be checked.
 * @returns {boolean} - True if all area values are valid, false otherwise.
 */
export function areaValuesAreValidForFreeCleanCmd(areaValues: string): boolean;
/**
 * Converts the comma separated area value list to a format
 * that the Deebot X2 requires for the freeClean cleaning type
 *
 * @param {string} areaValues - The area values string to be converted
 * @returns {string} The converted area values string
 */
export function convertAreaValuesForFreeCleanCmd(areaValues: string): string;
/**
 * Translates the Node.js error message for some network related error messages (e.g. `ENOTFOUND`)
 * @param {string} message - The error message received from the server
 * @param {string} [command=''] - The command
 * @returns {string} the error description
 */
export function createErrorDescription(message: string, command?: string): string;
/**
 * Prints to `stdout` only in development mode (`dev` or `development`)
 */
export function envLog(...args: any[]): void;
export function formatString(string: any, ...args: any[]): any;
/**
 * Get all known devices, including the supported devices and the known devices
 * @returns {Object} a dictionary of all known devices
 */
export function getAllKnownDevices(): Object;
/**
 * Get the value of the given property for the device class
 * @param {string} deviceClass - The device class to get the property for
 * @param {string} property - The property to get
 * @param {any} [defaultValue=false] - The default value to return if the property is not found
 * @returns {any} The value of the property for the device class
 */
export function getDeviceProperty(deviceClass: string, property: string, defaultValue?: any): any;
/**
 * Gets or resolves an unknown deviceClass dynamically using model similarity & heuristics.
 * @param {string} deviceClass - The 6-character class ID.
 * @returns {Object|null} The resolved device properties object, or null.
 */
export function getDynamicDevice(deviceClass: string): Object | null;
/**
 * @returns {Object} a dictionary of known devices
 */
export function getKnownDevices(): Object;
/**
 * Returns the platform/architecture type of the model (e.g. '950', 'T8', 'T20', 'airbot').
 * This is the technical architecture key, not the product category.
 * @param {string} deviceClass
 * @returns {string}
 */
export function getPlatformType(deviceClass: string): string;
/**
 * Returns the human-readable product category of the device
 * (e.g. 'Vacuum Cleaner', 'Air Purifier', 'Lawn Mower').
 * @param {string} deviceClass
 * @returns {string}
 */
export function getDeviceCategory(deviceClass: string): string;
/**
 * Returns the smartType (internal IoT platform generation/protocol) of the model
 * (e.g. 'MQ_AP', 'BLAP2', 'QRP', 'SPA', 'BT').
 * @param {string} deviceClass
 * @returns {string}
 */
export function getSmartType(deviceClass: string): string;
/**
 * @deprecated use getPlatformType()
 * Returns the type of the model
 * @returns {string}
 */
export function getModelType(deviceClass: any): string;
/**
 * @deprecated use getDeviceCategory()
 * Returns the device type
 * @returns {string}
 */
export function getDeviceType(deviceClass: any): string;
/**
 * Generate a somewhat random string for request id with 8 chars.
 * This is required for e.g. the OZMO 930 (possibly required for all models using XMPP)
 * @returns {string} the generated ID
 */
export function getReqID(): string;
/**
 * @returns {Object} a dictionary of supported devices
 */
export function getSupportedDevices(): Object;
/**
 * Given a total number of seconds, return a string that is formatted as hours, minutes, and seconds
 * @param {number} totalSeconds - The total number of seconds to format
 * @returns {string} a string that is formatted as hours, minutes, and seconds
 */
export function getTimeStringFormatted(totalSeconds: number): string;
/**
 * @returns {boolean} whether the canvas module is available
 */
export function isCanvasModuleAvailable(): boolean;
/**
 * Check if the deviceClass belongs to a known model
 * @param {string} deviceClass - The device class to check for
 * @returns {boolean} whether the deviceClass belongs to a known model
 */
export function isKnownDevice(deviceClass: string): boolean;
/**
 * Returns true if the model is a legacy model
 * @returns {boolean}
 */
export function isLegacyModel(deviceClass: any): boolean;
/**
 * Returns true if the value is an object, false if it is not
 * @param {any} val - The value to check.
 * @returns {boolean} whether it is an object
 */
export function isObject(val: any): boolean;
/**
 * Check if the deviceClass belongs to a supported model
 * @param {string} deviceClass - The device class to check for
 * @returns {boolean} whether the deviceClass belongs to a supported model
 */
export function isSupportedDevice(deviceClass: string): boolean;
/**
 * Given a string, return true if it is a valid JSON string, false otherwise
 * @param {string} jsonString - The string to be tested
 * @returns {boolean} whether it is a valid JSON string
 */
export function isValidJsonString(jsonString: string): boolean;
/**
 * Given a string, return true if it is either `vw` or `mw`
 * @param {string} type - The type of the virtual boundary
 * @returns {boolean} whether it is a virtual wall type
 */
export function isValidVirtualWallType(type: string): boolean;
/**
 * Given a dictionary of parameters, return a string of the form "key1=value1&key2=value2&key3=value3"
 * @param {Object} params - the parameters to be encoded
 * @returns {string} a string of the form "key1=value1&key2=value2&key3=value3"
 */
export function paramsToQueryList(params: Object): string;
export function envLogCommand(message: any): void;
export function envLogError(message: any): void;
export function envLogFwBuryPoint(message: any): void;
export function envLogHeader(message: any): void;
export function envLogInfo(message: any): void;
export function envLogMqtt(message: any): void;
export function envLogNotice(message: any): void;
export function envLogPayload(message: any): void;
export function envLogRaw(message: any): void;
export function envLogResult(name: any, message: any): void;
export function envLogSuccess(message: any): void;
export function envLogWarn(message: any): void;
export function logError(message: any): void;
export function logEvent(event: any, value: any): void;
export function logInfo(message: any): void;
export function logWarn(message: any): void;
//# sourceMappingURL=tools.d.ts.map