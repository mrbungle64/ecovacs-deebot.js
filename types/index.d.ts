declare class EcovacsAPI {
    /**
     * Get the version of the package
     * @returns {string} The version of the package
     */
    static version(): string;
    /**
     * Is the canvas module available?
     * @returns {boolean} a boolean value
     */
    static isCanvasModuleAvailable(): boolean;
    /**
     * @param {String} company
     * @returns {boolean}
     */
    static isMQTTProtocolUsed(company: string): boolean;
    /**
     * Returns true if the device class is 950 type
     * @param {String} deviceClass - The device class to check
     * @param [isMQTTProtocolUsed=true] - This value is used as default value if the deviceClass is not registered
     * @returns The value of the '950type' property
     */
    static isDeviceClass950type(deviceClass: string, isMQTTProtocolUsed?: boolean): any;
    /**
     * Returns true if the device class is not 950 type
     * @param {String} deviceClass - The device class of the device
     * @returns A boolean value.
     */
    static isDeviceClassNot950type(deviceClass: string): boolean;
    /**
     * Given a machine id and a device number, return the device ID
     * @param {String} machineId - The id of the device
     * @param {Number} [deviceNumber=0] - The device number is a number that is assigned to each device
     * @returns {String} the device ID
     */
    static getDeviceId(machineId: string, deviceNumber?: number): string;
    /**
     * Create a hash of the given text using the MD5 algorithm
     * @param {String} text - The text to be hashed
     * @returns {String} The MD5 hash of the text
     */
    static md5(text: string): string;
    /**
     * It takes a string and encrypts it using the public key
     * @param {String} text - The text to encrypt
     * @returns {String} The encrypted string
     */
    static encrypt(text: string): string;
    /**
     * Given a dictionary of parameters, return a string of the form "key1=value1&key2=value2&key3=value3"
     * @param {Object} params - The parameters to be encoded
     * @returns {String} A string of the form "key1=value1&key2=value2&key3=value3"
     */
    static paramsToQueryList(params: any): string;
    /**
     * @param {string} deviceId - The device ID of the bot
     * @param {string} country - The country code
     * @param {string} [continent] - The continent (deprecated)
     */
    constructor(deviceId: string, country: string, continent?: string);
    meta: {
        country: string;
        lang: string;
        deviceId: string;
        appCode: string;
        appVersion: string;
        channel: string;
        deviceType: string;
    };
    resource: string;
    country: string;
    continent: string;
    device_id: string;
    /**
     * @param {string} accountId - The account ID (Email or Ecovacs ID)
     * @param {string} password_hash - The password hash
     * @returns {string}
     */
    connect(accountId: string, password_hash: string): string;
    uid: any;
    login_access_token: any;
    auth_code: any;
    user_access_token: any;
    /**
     * Get the parameters for the user login
     * @param {Object} params - An object with the data to retrieve the parameters
     * @returns {String} the parameters
     */
    getUserLoginParams(params: any): string;
    /**
     * Get the parameters for authentication
     * @param {Object} params - An object with the data to retrieve the parameters
     * @returns {String} the parameters
     */
    getAuthParams(params: any): string;
    /**
     * @param {string} loginPath - The login path
     * @param {Object} params - An object with the data to retrieve the parameters
     * @returns {Promise<Object>} an object including access token and user ID
     */
    callUserAuthApi(loginPath: string, params: any): Promise<any>;
    /**
     * Returns the portal path for the given login path
     * @param {string} loginPath - The path for the login
     * @returns {string} the portal path
     */
    getPortalPath(loginPath: string): string;
    /**
     * @param {string} api - the API path
     * @param {string} func - the API function to be called
     * @param {Object} args - An object with the params for the POST request
     * @returns {Promise<Object>}
     */
    callPortalApi(api: string, func: string, args: any): Promise<any>;
    /**
     * It calls the API to login by access token
     * @returns {Promise<Object>} an object including user token and user ID
     */
    callUserApiLoginByItToken(): Promise<any>;
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
     * @param deviceList - The list of devices of the Ecovacs account
     * @param globalDeviceList - The global device list returned by the API
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
     * @param {String} user - The user ID (retrieved from Ecovacs API)
     * @param {String} hostname - The host name (for the Ecovacs API)
     * @param {String} resource - the resource of the vacuum
     * @param {String} userToken - The user token
     * @param {Object} vacuum - The object for the specific device retrieved by the devices dictionary
     * @returns {Object} a corresponding instance of the `vacBot` class
     */
    getVacBot(user: string, hostname: string, resource: string, userToken: string, vacuum: any): any;
    /**
     * Get the version of the package
     * @returns {string} The version of the package
     */
    getVersion(): string;
    /**
     * Is the canvas module available?
     * @returns {boolean} a boolean value
     */
    getCanvasModuleIsAvailable(): boolean;
}
declare namespace EcovacsAPI {
    const PUBLIC_KEY: string;
    const REALM: string;
}
export { EcovacsAPI as EcoVacsAPI, countries };
//# sourceMappingURL=index.d.ts.map