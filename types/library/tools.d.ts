/**
 * Returns true if the value is an object, false if it is not
 * @param {any} val - The value to check.
 * @returns {Boolean} whether it is an object
 */
export function isObject(val: any): boolean;
/**
 * Given a string, return true if it is a valid JSON string, false otherwise
 * @param {String} jsonString - The string to be tested
 * @returns {Boolean} whether it is a valid JSON string
 */
export function isValidJsonString(jsonString: string): boolean;
/**
 * Given a string, return true if it is either `vw` or `mw`
 * @param {String} type - The type of the virtual boundary
 * @returns {Boolean} whether it is a virtual wall type
 */
export function isValidVirtualWallType(type: string): boolean;
/**
 * Prints to `stdout` only in development mode (`dev` or `development`)
 */
export function envLog(...args: any[]): void;
/**
 * Get all known devices, including the supported devices and the known devices
 * @returns {Object} a dictionary of all known devices
 */
export function getAllKnownDevices(): any;
/**
 * @returns {Object} a dictionary of supported devices
 */
export function getSupportedDevices(): any;
/**
 * @returns {Object} a dictionary of known devices
 */
export function getKnownDevices(): any;
/**
 * Check if the deviceClass belongs to a supported model
 * @param {String} deviceClass - The device class to check for
 * @returns {Boolean} whether the deviceClass belongs to a supported model
 */
export function isSupportedDevice(deviceClass: string): boolean;
/**
 * Check if the deviceClass belongs to a known model
 * @param {String} deviceClass - The device class to check for
 * @returns {Boolean} whether the deviceClass belongs to a known model
 */
export function isKnownDevice(deviceClass: string): boolean;
/**
 * Get the value of the given property for the device class
 * @param {String} deviceClass - The device class to get the property for
 * @param {String} property - The property to get
 * @param {any} [defaultValue=false] - The default value to return if the property is not found
 * @returns {any} The value of the property for the device class
 */
export function getDeviceProperty(deviceClass: string, property: string, defaultValue?: any): any;
/**
 * Given a total number of seconds, return a string that is formatted as hours, minutes, and seconds
 * @param {Number} totalSeconds - The total number of seconds to format
 * @returns {String} a string that is formatted as hours, minutes, and seconds
 */
export function getTimeStringFormatted(totalSeconds: number): string;
/**
 * @param {String} deviceClass - The device class of the device
 * @returns {Boolean} a Boolean value whether the device a N79 series modell
 */
export function isN79series(deviceClass: string): boolean;
/**
 * @param {String} deviceClass - The device class of the device
 * @returns {Boolean} a Boolean value whether the device a 710 series modell
 */
export function is710series(deviceClass: string): boolean;
/**
 * Generate a somewhat random string for request id with 8 chars.
 * This is required for e.g. the OZMO 930 (possibly required for all models using XMPP)
 * @returns {string} the generated ID
 */
export function getReqID(): string;
/**
 * @returns {Boolean} whether the canvas module is available
 */
export function isCanvasModuleAvailable(): boolean;
/**
 * Translates the Node.js error message for some network related error messages (e.g. `ENOTFOUND`)
 * @param {string} message - The error message received from the server.
 * @returns {string} the error description
 */
export function createErrorDescription(message: string): string;
//# sourceMappingURL=tools.d.ts.map