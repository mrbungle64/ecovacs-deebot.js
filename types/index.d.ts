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
     * @param {String} deviceClass - The device class of the device.
     * @returns A boolean value.
     */
    static isDeviceClassNot950type(deviceClass: string): boolean;
    /**
     * Given a machine id and a device number, return the device ID
     * @param {String} machineId - The id of the device.
     * @param {Number} [deviceNumber=0] - The device number is a number that is assigned to each device.
     * @returns {String} the device ID.
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
     * @param {Object} params - The parameters to be encoded.
     * @returns {String} A string of the form "key1=value1&key2=value2&key3=value3"
     */
    static paramsToQueryList(params: any): string;
    /**
     * The constructor function takes in the device_id, country, and continent. It then sets up the meta object, which
     * contains the country, language, device id, app code, app version, channel, device type, and sets the resource to the
     * first 8 characters of the device id. It then sets the country to the uppercase version of the country, and sets the
     * continent to the continent of the country if it's not set
     * @param {string} device_id - The device ID of the vacuum
     * @param {string} country - The country code
     * @param {string} [continent] - The continent (optional)
     */
    constructor(device_id: string, country: string, continent?: string);
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
     * It connects to the Ecovacs API
     * @param {string} account_id - The account ID of the user
     * @param {string} password_hash - The password hash
     * @returns {string} The return value is a string that is either "ready" or "error"
     */
    connect(account_id: string, password_hash: string): string;
    userId: any;
    login_access_token: any;
    auth_code: any;
    user_access_token: any;
    /**
     *
     * @param {Object} params
     * @returns {String}
     */
    getUserLoginParams(params: any): string;
    /**
     *
     * @param {Object} params
     * @returns {String}
     */
    getAuthParams(params: any): string;
    /**
     *
     * @param {string} loginPath
     * @param {Object} params
     * @returns {Promise<*>}
     */
    callUserAuthApi(loginPath: string, params: any): Promise<any>;
    /**
     *
     * @param {string} loginPath
     * @returns {string}
     */
    getPortalPath(loginPath: string): string;
    /**
     *
     * @param {string} api
     * @param {string} func
     * @param {Object} args
     * @returns {Promise<any>}
     */
    callPortalApi(api: string, func: string, args: any): Promise<any>;
    /**
     *
     * @returns {Promise<any>}
     */
    callUserApiLoginByItToken(): Promise<any>;
    /**
     *
     * @returns {Promise<unknown>}
     */
    getConfigProducts(): Promise<unknown>;
    /**
     *
     * @param api
     * @param todo
     * @returns {Promise<unknown>}
     */
    getDevices(api?: string, todo?: string): Promise<unknown>;
    /**
     *
     * @returns {Promise<*>}
     */
    devices(): Promise<any>;
    /**
     *
     * @param deviceList
     * @param globalDeviceList
     * @returns {*}
     */
    mergeDeviceLists(deviceList: any, globalDeviceList: any): any;
    /**
     *
     * @returns {{}}
     */
    getAllKnownDevices(): {};
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
     *
     * @param {Object} vacuum
     * @returns {*}
     */
    getVacBotObj(vacuum: any): any;
    /**
     *
     * @param {String} user
     * @param {String} hostname
     * @param {String} resource
     * @param {String} secret
     * @param {Object} vacuum
     * @param {String} continent
     * @returns {*}
     */
    getVacBot(user: string, hostname: string, resource: string, secret: string, vacuum: any, continent: string): any;
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