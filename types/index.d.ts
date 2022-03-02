declare class EcovacsAPI {
    static version(): any;
    static isCanvasModuleAvailable(): boolean;
    static isMQTTProtocolUsed(company: any): boolean;
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
    constructor(device_id: any, country: any, continent?: string);
    meta: {
        country: any;
        lang: string;
        deviceId: any;
        appCode: string;
        appVersion: string;
        channel: string;
        deviceType: string;
    };
    resource: any;
    country: any;
    continent: any;
    device_id: any;
    connect(account_id: any, password_hash: any): Promise<string>;
    uid: any;
    login_access_token: any;
    auth_code: any;
    user_access_token: any;
    getUserLoginParams(params: any): string;
    getAuthParams(params: any): string;
    callUserAuthApi(loginPath: any, params: any): Promise<any>;
    getPortalPath(loginPath: any): string;
    callPortalApi(api: any, func: any, args: any): Promise<any>;
    callUserApiLoginByItToken(): Promise<any>;
    getConfigProducts(): Promise<any>;
    getDevices(api?: string, todo?: string): Promise<any>;
    devices(): Promise<any>;
    mergeDeviceLists(deviceList: any, globalDeviceList: any): any;
    getAllKnownDevices(): {};
    getCountryName(): any;
    getContinent(): any;
    getVacBotObj(vacuum: any): import("./library/950type/vacBot") | import("./library/non950type/vacBot");
    getVacBot(user: any, hostname: any, resource: any, secret: any, vacuum: any, continent: any): import("./library/950type/vacBot") | import("./library/non950type/vacBot");
    getVersion(): any;
    getCanvasModuleIsAvailable(): boolean;
}
declare namespace EcovacsAPI {
    const PUBLIC_KEY: string;
    const REALM: string;
}
export { EcovacsAPI as EcoVacsAPI, countries };
//# sourceMappingURL=index.d.ts.map