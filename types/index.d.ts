export const EcovacsDevice: typeof import("./library/ecovacsDevice");
export type ApiDevice = {
    did?: string | undefined;
    name?: string | undefined;
    deviceName?: string | undefined;
    nick?: string | undefined;
    class?: string | undefined;
    company?: string | undefined;
    icon?: string | undefined;
    resource?: string | undefined;
    deviceNumber?: number | undefined;
};
/**
 * @class EcovacsAPI
 * An instance of this class provides access to the Ecovacs account and to the API
 * @property @private {string} resource - the resource of the device
 * @property @private {string} country - the country code of the country where the Ecovacs account is registered
 * @property @private {string} continent - the continent where the Ecovacs account is registered
 * @property @private {string} deviceId - the device ID of the bot
 * @property @private {string} authDomain - the domain for the authentication API
 * @fires EcovacsAPI#credentialsUpdated
 */
export class EcovacsAPI extends EventEmitter<any> {
    /**
     * Get the version of the package
     * @returns {string} the version of the package
     */
    static version(): string;
    /**
     * Is map rendering available? Always true – rendering is pure JS now.
     * Kept for backward compatibility (formerly reported native `canvas` availability).
     * @returns {boolean} always true
     */
    static isCanvasModuleAvailable(): boolean;
    /**
     * @param {string} company
     * @returns {boolean}
     */
    static isMQTTProtocolUsed(company: string): boolean;
    /**
     * Returns true if the device class is not a legacy model (i.e. is 950 type or newer)
     * @param {string} deviceClass - The device class to check
     * @returns {boolean} true if not legacy
     */
    static isDeviceClass950type(deviceClass: string): boolean;
    /**
     * Returns true if the device class is 950_v2 type
     * (i.e. implements the newer `_V2` JSON/MQTT commands).
     * Reads the canonical `V2` property, so it agrees with
     * `EcovacsDevice.is950type_V2()`.
     * @param {string} deviceClass - The device class to check
     * @returns {boolean} the value of the canonical `V2` property
     */
    static isDeviceClass950v2type(deviceClass: string): boolean;
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
     * Create a hash of the given text using the MD5 algorithm.
     * NOTE: MD5 is mandated by the Ecovacs API request-signature scheme (authSign)
     * and request-id generation — it is NOT used as a security primitive here.
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
    tokenExpiresAt: number | undefined;
    /**
     * Get the current credentials (user id + access token + expiry timestamp).
     * @returns {import('./library/typedefs').Credentials}
     */
    getCredentials(): import("./library/typedefs").Credentials;
    /**
     * Get the absolute timestamp (ms since epoch) at which the access token should
     * be refreshed, or `null` if not yet authenticated.
     * @returns {number|null}
     */
    getTokenExpiry(): number | null;
    /**
     * Enable automatic, proactive re-authentication shortly before the access
     * token expires. Opt-in: when enabled, the API re-runs the login flow and
     * emits a {@link EcovacsAPI#event:credentialsUpdated} event with the new
     * credentials. Wire it to your bot(s) so the refreshed token is applied:
     *
     * ```js
     * api.on('credentialsUpdated', (c) => vacbot.updateUserAccessToken(c.token));
     * api.enableAutoTokenRefresh(accountId, passwordHash);
     * ```
     *
     * @param {string} accountId - the account ID (same as used for `connect()`)
     * @param {string} passwordHash - the password hash (same as used for `connect()`)
     * @returns {EcovacsAPI} this (for chaining)
     */
    enableAutoTokenRefresh(accountId: string, passwordHash: string): EcovacsAPI;
    _autoRefresh: {
        accountId: string;
        passwordHash: string;
    } | null | undefined;
    /**
     * Disable automatic token refresh and cancel any pending refresh timer.
     */
    disableAutoTokenRefresh(): void;
    _refreshTimer: NodeJS.Timeout | null | undefined;
    /**
     * (Re)schedule the next token refresh based on the tracked expiry.
     * @private
     */
    private _scheduleTokenRefresh;
    /**
     * Perform a token refresh by re-running the login flow, then reschedule.
     * On failure, retries after a short delay.
     * @private
     * @fires EcovacsAPI#credentialsRefreshError
     */
    private _runTokenRefresh;
    /**
     * Select between an Ecovacs and a yeedi value based on the configured auth domain.
     * @template T
     * @param {T} ecovacsValue - value to use for the Ecovacs auth domain
     * @param {T} yeediValue - value to use for the yeedi auth domain
     * @returns {T}
     * @private
     */
    private _authDomainValue;
    /**
     * Get the parameters for the user login
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {string} the parameters
     */
    getUserLoginParams(params: Object): string;
    /**
     * Get the parameters for authentication
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {string} the parameters
     */
    getAuthParams(params: Object): string;
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
     * @returns {import('./library/typedefs').MetaObject}
     */
    getMetaObject(): import("./library/typedefs").MetaObject;
    /**
     * @param {string} loginPath - the login path
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {Promise<Object>} an object including access token and user ID
     */
    callUserAuthApi(loginPath: string, params: Object): Promise<Object>;
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
    callPortalApi(loginPath: string, func: string, args: Object): Promise<Object>;
    /**
     * It calls the API to login by access token
     * @returns {Promise<import('./library/typedefs').ItTokenResult>} an object including user token and user ID
     */
    callUserApiLoginByItToken(): Promise<import("./library/typedefs").ItTokenResult>;
    /**
     * Get the login path for the current country
     * @returns {string} the login path is being returned.
     */
    getLoginPath(): string;
    /**
     * @returns {Promise<Object>} a dictionary of Ecovacs products
     */
    getConfigProducts(): Promise<Object>;
    /**
     * @param {string} api - the API path
     * @param {string} func - the API function to be called
     * @returns {Promise<Object>} a dictionary of all devices of the users Ecovacs account
     */
    getDevices(api?: string, func?: string): Promise<Object>;
    /**
     * @returns {Promise<Array<ApiDevice>>} a list of all devices of the users Ecovacs account
     */
    devices(): Promise<Array<ApiDevice>>;
    /**
     * Merge the data from the global device list (GetGlobalDeviceList)
     * with the data from the device list (GetDeviceList) of the users Ecovacs account
     * @param {Object} deviceList - the list of devices of the Ecovacs account
     * @param {Object} globalDeviceList - the global device list returned by the API
     * @returns {Object} a dictionary of all known devices
     */
    mergeDeviceLists(deviceList: Object, globalDeviceList: Object): Object;
    /**
     * Get all known devices
     * @returns {Object} a dictionary of all known devices
     */
    getAllKnownDevices(): Object;
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
     * Get an `EcovacsDevice` instance for a device, using the credentials of the
     * current API session (convenience wrapper for `getDevice`, with only 1 parameter).
     * @param {ApiDevice} vacuum - The object for the device, retrieved by the `devices` dictionary
     * @param {Object} [options] - optional transport overrides forwarded to the device session (see {@link getDevice}); mainly for local testing
     * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
     */
    getDeviceObj(vacuum: ApiDevice, options?: Object): import("./library/ecovacsDevice");
    /**
     * @deprecated Use `getDeviceObj()` instead. Retained as a backward-compatible alias.
     * @param {ApiDevice} vacuum - The object for the device, retrieved by the `devices` dictionary
     * @param {Object} [options] - optional transport overrides forwarded to the device session
     * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
     */
    getVacBotObj(vacuum: ApiDevice, options?: Object): import("./library/ecovacsDevice");
    /**
     * Get a corresponding instance of the `EcovacsDevice` class
     * @param {string} user - the user ID (retrieved from Ecovacs API)
     * @param {string} hostname - the host name (for the Ecovacs API)
     * @param {string} resource - the resource of the device
     * @param {string} userToken - the user token
     * @param {ApiDevice} vacuum - the object for the specific device retrieved by the devices dictionary
     * @param {string} [continent] - the continent
     * @param {Object} [options] - optional transport overrides forwarded to the device session (see {@link EcovacsDeviceSession}); `{serverAddress, serverPort, protocol}`, mainly for local testing
     * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
     */
    getDevice(user: string, hostname: string, resource: string, userToken: string, vacuum: ApiDevice, continent?: string, options?: Object): import("./library/ecovacsDevice");
    /**
     * @deprecated Use `getDevice()` instead. Retained as a backward-compatible alias.
     * @param {string} user - the user ID (retrieved from Ecovacs API)
     * @param {string} hostname - the host name (for the Ecovacs API)
     * @param {string} resource - the resource of the device
     * @param {string} userToken - the user token
     * @param {ApiDevice} vacuum - the object for the specific device retrieved by the devices dictionary
     * @param {string} [continent] - the continent
     * @param {Object} [options] - optional transport overrides forwarded to the device session
     * @returns {import('./library/ecovacsDevice')} a corresponding instance of the `EcovacsDevice` class
     */
    getVacBot(user: string, hostname: string, resource: string, userToken: string, vacuum: ApiDevice, continent?: string, options?: Object): import("./library/ecovacsDevice");
    /**
     * Get the version of the package
     * @returns {string} the version of the package
     */
    getVersion(): string;
    /**
     * Is map rendering available? Always true – rendering is pure JS now.
     * Kept for backward compatibility (formerly reported native `canvas` availability).
     * @returns {boolean} always true
     */
    getCanvasModuleIsAvailable(): boolean;
    logInfo(message: any): void;
    logWarn(message: any): void;
    logError(message: any): void;
    logEvent(event: any, value: any): void;
}
export namespace EcovacsAPI {
    let PUBLIC_KEY: string;
    let REALM: "ecouser.net";
}
/**
 * @typedef {Object} ApiDevice
 * @property {string} [did]
 * @property {string} [name]
 * @property {string} [deviceName]
 * @property {string} [nick]
 * @property {string} [class]
 * @property {string} [company]
 * @property {string} [icon]
 * @property {string} [resource]
 * @property {number} [deviceNumber]
 */
/** @type {Object} */
export const countries: Object;
import EventEmitter = require("node:events");
export { EcovacsAPI as EcoVacsAPI, EcovacsDevice as VacBot };
//# sourceMappingURL=index.d.ts.map