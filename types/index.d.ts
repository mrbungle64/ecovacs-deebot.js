/**
 * @class EcovacsAPI
 * An instance of this class provides access to the Ecovacs account and to the API
 * @property @private {string} resource - the resource of the device
 * @property @private {string} country - the country code of the country where the Ecovacs account is registered
 * @property @private {string} continent - the continent where the Ecovacs account is registered
 * @property @private {string} deviceId - the device ID of the bot
 * @property @private {string} authDomain - the domain for the authentication API
 */
declare class EcovacsAPI {
    /**
     * Get the version of the package
     * @returns {string} the version of the package
     */
    static version(): string;
    /**
     * Is the canvas module available?
     * @returns {boolean} a boolean value
     */
    static isCanvasModuleAvailable(): boolean;
    /**
     * @param {string} company
     * @returns {boolean}
     */
    static isMQTTProtocolUsed(company: string): boolean;
    /**
     * Returns true if the device class is 950 type
     * @param {string} deviceClass - The device class to check
     * @param [isMQTTProtocolUsed=true] - This value is used as default value if the deviceClass is not registered
     * @returns {boolean} the value of the '950type' property
     */
    static isDeviceClass950type(deviceClass: string, isMQTTProtocolUsed?: boolean): boolean;
    /**
     * Returns true if the device class is not 950 type
     * @param {string} deviceClass - The device class of the device
     * @returns {boolean} a boolean value.
     */
    static isDeviceClassNot950type(deviceClass: string): boolean;
    /**
     * Given a machine id and a device number, return the device ID
     * @param {string} machineId - the id of the device
     * @param {number} [deviceNumber=0] - the device number is a number that is assigned to each device
     * @returns {string} the device ID
     */
    static getDeviceId(machineId: string, deviceNumber?: number): string;
    /**
     * Create a hash of the given text using the MD5 algorithm
     * @param {string} text - the text to be hashed
     * @returns {string} the MD5 hash of the text
     */
    static md5(text: string): string;
    /**
     * It takes a string and encrypts it using the public key
     * @param {string} text - the text to encrypt
     * @returns {string} the encrypted string
     */
    static encrypt(text: string): string;
    /**
     * @param {string} deviceId - the device ID of the bot
     * @param {string} country - the country code of the country where the Ecovacs account is registered
     * @param {string} [continent=''] - the continent code
     * @param {string} [authDomain='ecovacs.com'] - the domain for the authentication API
     */
    constructor(deviceId: string, country: string, continent?: string, authDomain?: string);
    deviceId: string;
    country: string;
    continent: string;
    authDomain: string;
    resource: string;
    /**
     * @param {string} accountId - The account ID (Email or Ecovacs ID)
     * @param {string} passwordHash - The password hash
     * @returns {Promise<string>}
     */
    connect(accountId: string, passwordHash: string): Promise<string>;
    uid: any;
    authCode: any;
    user_access_token: any;
    /**
     * Get the parameters for the user login
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {string} the parameters
     */
    getUserLoginParams(params: any): string;
    /**
     * Get the parameters for authentication
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {string} the parameters
     */
    getAuthParams(params: any): string;
    /**
     * Used to generate the URL search parameters for the request
     * @param params - the basic set of parameters for the request
     * @param authSignParams - additional set of parameters for the request
     * @param authAppkey - The appkey for the request
     * @param authSecret - The secret key for the request
     * @returns An array of query strings
     */
    buildQueryList(params: any, authSignParams: any, authAppkey: any, authSecret: any): string;
    buildAuthSignText(authAppkey: any, authSignParams: any, authSecret: any): any;
    /**
     * Get the meta-object that will be used to make a request to the server
     * @returns {Object}
     */
    getMetaObject(): any;
    /**
     * @param {string} loginPath - the login path
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {Promise<Object>} an object including access token and user ID
     */
    callUserAuthApi(loginPath: string, params: any): Promise<any>;
    /**
     * Returns the portal path for the given login path
     * @param {string} loginPath - the path for the login
     * @returns {string} the portal path
     */
    getPortalPath(loginPath: string): string;
    /**
     * @param {string} loginPath - the API path
     * @param {string} func - the API function to be called
     * @param {Object} args - an object with the params for the POST request
     * @returns {Promise<Object>}
     */
    callPortalApi(loginPath: string, func: string, args: any): Promise<any>;
    /**
     * It calls the API to login by access token
     * @returns {Promise<Object>} an object including user token and user ID
     */
    callUserApiLoginByItToken(): Promise<any>;
    /**
     * Get the login path for the current country
     * @returns {string} the login path is being returned.
     */
    getLoginPath(): string;
    /**
     * @returns {Promise<Object>} a dictionary of Ecovacs products
     */
    getConfigProducts(): Promise<any>;
    /**
     * @param {string} api - the API path
     * @param {string} func - the API function to be called
     * @returns {Promise<Object>} a dictionary of all devices of the users Ecovacs account
     */
    getDevices(api?: string, func?: string): Promise<any>;
    /**
     * @returns {Promise<Object>} a dictionary of all devices of the users Ecovacs account
     */
    devices(): Promise<any>;
    /**
     * Merge the data from the global device list (GetGlobalDeviceList)
     * with the data from the device list (GetDeviceList) of the users Ecovacs account
     * @param {Object} deviceList - the list of devices of the Ecovacs account
     * @param {Object} globalDeviceList - the global device list returned by the API
     * @returns {Object} a dictionary of all known devices
     */
    mergeDeviceLists(deviceList: any, globalDeviceList: any): any;
    /**
     * Get all known devices
     * @returns {Object} a dictionary of all known devices
     */
    getAllKnownDevices(): any;
    /**
     * Get the name of the country from the countries object
     * @returns {string} the name of the country
     */
    getCountryName(): string;
    /**
     * Get the continent code from the countries object
     * @returns {string} the continent (lower case)
     */
    getContinent(): string;
    /**
     * Wrapper method for the `getVacBot` method (but with only 1 parameter)
     * @param {Object} vacuum - The object for the vacuum, retrieved by the `devices` dictionary
     * @returns {Object} a corresponding instance of the 'vacBot' class
     */
    getVacBotObj(vacuum: any): any;
    /**
     * Get a corresponding instance of the `vacBot` class
     * @param {string} user - the user ID (retrieved from Ecovacs API)
     * @param {string} hostname - the host name (for the Ecovacs API)
     * @param {string} resource - the resource of the vacuum
     * @param {string} userToken - the user token
     * @param {Object} vacuum - the object for the specific device retrieved by the devices dictionary
     * @param {string} [continent] - the continent
     * @returns {Object} a corresponding instance of the `VacBot` class
     */
    getVacBot(user: string, hostname: string, resource: string, userToken: string, vacuum: any, continent?: string): any;
    /**
     * Get the version of the package
     * @returns {string} the version of the package
     */
    getVersion(): string;
    /**
     * Is the canvas module available?
     * @returns {boolean} a boolean value
     */
    getCanvasModuleIsAvailable(): boolean;
    logInfo(message: any): void;
    logWarn(message: any): void;
    logError(message: any): void;
    logEvent(event: any, value: any): void;
}
declare namespace EcovacsAPI {
    const PUBLIC_KEY: string;
    const REALM: string;
}
/** @type {Object} */
export const countries: any;
export { EcovacsAPI as EcoVacsAPI };
//# sourceMappingURL=index.d.ts.map