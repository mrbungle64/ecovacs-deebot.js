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
export function getAllKnownDevices(): any;
/**
 * Get the value of the given property for the device class
 * @param {string} deviceClass - The device class to get the property for
 * @param {string} property - The property to get
 * @param {any} [defaultValue=false] - The default value to return if the property is not found
 * @returns {any} The value of the property for the device class
 */
export function getDeviceProperty(deviceClass: string, property: string, defaultValue?: any): any;
/**
 * @returns {Object} a dictionary of known devices
 */
export function getKnownDevices(): any;
/**
 * Returns the type of the model
 * @returns {String}
 */
export function getModelType(deviceClass: any): string;
/**
 * Generate a somewhat random string for request id with 8 chars.
 * This is required for e.g. the OZMO 930 (possibly required for all models using XMPP)
 * @returns {string} the generated ID
 */
export function getReqID(): string;
/**
 * @returns {Object} a dictionary of supported devices
 */
export function getSupportedDevices(): any;
export function getCmdForObstacleDetection(modelName: any): "Recognization" | "TrueDetect";
/**
 * Given a total number of seconds, return a string that is formatted as hours, minutes, and seconds
 * @param {number} totalSeconds - The total number of seconds to format
 * @returns {string} a string that is formatted as hours, minutes, and seconds
 */
export function getTimeStringFormatted(totalSeconds: number): string;
/**
 * @param {string} deviceClass - The device class of the device
 * @returns {boolean} a Boolean value whether the device a 710 series model
 */
export function is710series(deviceClass: string): boolean;
/**
 * @param {string} deviceClass - The device class of the device
 * @returns {boolean} a Boolean value whether the device is an air purifier
 */
export function isAirPurifier(deviceClass: string): boolean;
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
 * @param {string} deviceClass - The device class of the device
 * @returns {boolean} a Boolean value whether the device a N79 series model
 */
export function isN79series(deviceClass: string): boolean;
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
export function paramsToQueryList(params: any): string;
export function envLogCommand(message: any): void;
export function envLogError(message: any): void;
export function envLogFwBuryPoint(message: any): void;
export function envLogHeader(message: any): void;
export function envLogInfo(message: any): void;
export function envLogMqtt(message: any): void;
export function envLogNotice(message: any): void;
export function envLogPayload(message: any): void;
export function envLogRaw(message: any): void;
export function envLogResult(message: any): void;
export function envLogSuccess(message: any): void;
export function envLogWarn(message: any): void;
export function logError(message: any): void;
export function logEvent(event: any, value: any): void;
export function logInfo(message: any): void;
export function logWarn(message: any): void;
//# sourceMappingURL=tools.d.ts.map