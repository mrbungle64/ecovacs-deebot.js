declare class EcovacsAPI {
    static version(): any;
    static isCanvasModuleAvailable(): boolean;
    static isMQTTProtocolUsed(company: any): boolean;
    static isDeviceClass950type(deviceClass: any, isMQTTProtocolUsed?: boolean): any;
    static isDeviceClassNot950type(deviceClass: any): boolean;
    static getDeviceId(machineId: any, deviceNumber?: number): string;
    static md5(text: any): string;
    static encrypt(text: any): string;
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