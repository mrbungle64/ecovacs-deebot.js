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
     * Encrypt text with a base64-encoded SPKI DER RSA public key using
     * PKCS#1 v1.5 padding. Used for the device-verification account encryption
     * where the key is fetched at runtime (see {@link getVerificationPublicKey}).
     * @param {string} text - the text to encrypt
     * @param {string} base64Der - the base64-encoded SPKI DER public key
     * @returns {string} the base64-encoded ciphertext
     */
    static encryptWithPublicKey(text: string, base64Der: string): string;
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
    account: string | undefined;
    /**
     * Finish a login with a freshly obtained account uid + access token (from the
     * password login or from device verification), remember them as the account
     * session and announce it, so callers can persist it.
     * @param {string} uid - the account uid
     * @param {string} accessToken - the account access token
     * @returns {Promise<string>} `'ready'` on success
     * @fires EcovacsAPI#credentialsUpdated
     * @fires EcovacsAPI#accountSessionUpdated
     * @private
     */
    private loginWithAccountToken;
    uid: any;
    accountUid: string | undefined;
    loginAccessToken: string | null | undefined;
    /**
     * Finish the login once a login access token has been obtained – either from
     * the password login (`connect`) or from device verification (`verifyDevice`).
     * Exchanges the token for an auth code, performs `loginByItToken`, tracks the
     * expiry and fires the `credentialsUpdated` event.
     * @param {string} loginAccessToken - the login access token
     * @returns {Promise<string>} `'ready'` on success
     * @fires EcovacsAPI#credentialsUpdated
     * @private
     */
    private completeLogin;
    authCode: any;
    user_access_token: any;
    tokenExpiresAt: number | undefined;
    /**
     * Request an e-mailed device-verification code for the account used with
     * {@link connect}. This is step one of the two-step device-verification flow
     * that Ecovacs requires when {@link connect} throws a
     * {@link DeviceVerificationRequired} (response code `1013`): the cloud sends a
     * code to the account's e-mail address. Confirm it with {@link verifyDevice}.
     *
     * ```js
     * try {
     *   await api.connect(account, passwordHash);
     * } catch (e) {
     *   if (e instanceof EcovacsAPI.DeviceVerificationRequired) {
     *     await api.requestDeviceVerificationCode();
     *     // ... obtain the code from the user's mailbox ...
     *     await api.verifyDevice(code);
     *   }
     * }
     * ```
     * @returns {Promise<void>}
     */
    requestDeviceVerificationCode(): Promise<void>;
    /**
     * Confirm a device-verification code (step two) and finish the login. On
     * success the credentials are stored and the same `credentialsUpdated` event /
     * refresh mechanism as a normal login is triggered, so `authenticate()` /
     * {@link getCredentials} return the fresh credentials afterwards.
     * @param {string} code - the verification code from the e-mail (surrounding whitespace is trimmed)
     * @returns {Promise<string>} `'ready'` on success
     * @throws {InvalidVerificationCode} if the code is invalid or expired (response code `1012`)
     * @fires EcovacsAPI#credentialsUpdated
     */
    verifyDevice(code: string): Promise<string>;
    /**
     * Get the current account session (account uid + access token, bound to this
     * client device id) for persisting, or `null` before the first login. Pass it
     * to {@link restoreAccountSession} on a later start to log in without the
     * password – a repeated password login may require device verification again.
     * The access token is as sensitive as the password: never log it.
     * @returns {import('./library/typedefs').AccountSession|null}
     */
    getAccountSession(): import("./library/typedefs").AccountSession | null;
    /**
     * Log in from a session previously returned by {@link getAccountSession},
     * without the password. Fires `credentialsUpdated` like a normal login.
     *
     * ```js
     * try {
     *   await api.restoreAccountSession(savedSession);
     * } catch (e) {
     *   if (!(e instanceof EcovacsAPI.AccountSessionRejected)) throw e;
     *   await api.connect(account, passwordHash); // may require device verification
     * }
     * ```
     * @param {import('./library/typedefs').AccountSession} session - the stored session
     * @returns {Promise<string>} `'ready'` on success
     * @throws {AccountSessionRejected} if the session is malformed, belongs to another
     *   client device id / country / auth domain, or is no longer accepted by the cloud
     * @fires EcovacsAPI#credentialsUpdated
     */
    restoreAccountSession(session: import("./library/typedefs").AccountSession): Promise<string>;
    /**
     * Exchange the stored account access token for fresh credentials. A rejection
     * by the auth API (any response code) discards the session and is reported as
     * {@link AccountSessionRejected}; network/portal errors pass through unchanged.
     * @returns {Promise<string>} `'ready'` on success
     * @throws {AccountSessionRejected}
     * @private
     */
    private loginWithAccountSession;
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
     * Enable automatic, proactive re-authentication before the access token
     * expires. Opt-in: when enabled, the API renews the credentials from the
     * account session (no password login) and emits a
     * {@link EcovacsAPI#event:credentialsUpdated} event with the new credentials.
     * Only if the cloud rejects the session does it fall back to a password login
     * – which may require device verification – and only if `passwordHash` was
     * given. Wire it to your bot(s) so the refreshed token is applied:
     *
     * ```js
     * api.on('credentialsUpdated', (c) => vacbot.updateUserAccessToken(c.token));
     * api.enableAutoTokenRefresh(accountId, passwordHash);
     * ```
     *
     * @param {string} [accountId] - the account ID (same as used for `connect()`)
     * @param {string} [passwordHash] - the password hash (same as used for `connect()`);
     *   omit both to refresh from the account session only
     * @returns {EcovacsAPI} this (for chaining)
     * @throws {Error} if neither an account session nor a password is available
     */
    enableAutoTokenRefresh(accountId?: string, passwordHash?: string): EcovacsAPI;
    _autoRefresh: {
        accountId: string | undefined;
        passwordHash: string | undefined;
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
     * Perform a token refresh, then reschedule. On a transient failure, retries
     * after a short delay; if neither the session nor a password login can
     * succeed without user interaction, the auto refresh is disabled.
     * @private
     * @fires EcovacsAPI#credentialsRefreshError
     */
    private _runTokenRefresh;
    /**
     * Renew the credentials from the account session; fall back to a password
     * login only if the session was rejected and a password hash is available.
     * @returns {Promise<string>} `'ready'` on success
     * @private
     */
    private _refreshCredentials;
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
     * Get the meta-object for the device-verification endpoints. Derives from
     * {@link getMetaObject} (inheriting the correct appCode via
     * {@link _authDomainValue}) and overrides only the country casing and the
     * distinct app version the verification endpoints require.
     * @returns {import('./library/typedefs').MetaObject}
     */
    getVerificationMetaObject(): import("./library/typedefs").MetaObject;
    /**
     * Build the per-request metadata (request id, timestamp, time zone) shared by
     * the signed device-verification requests.
     * @returns {{requestId: string, authTimespan: number, authTimeZone: string}}
     */
    getRequestMetadata(): {
        requestId: string;
        authTimespan: number;
        authTimeZone: string;
    };
    /**
     * Call one of the signed device-verification GET endpoints. Uses the same
     * private-API host and signing scheme as `user/login` but with the
     * verification meta object (see {@link getVerificationMetaObject}).
     * @param {string} endpoint - the endpoint, e.g. `common/getConfig`
     * @param {Object} params - the endpoint-specific parameters (before signing)
     * @returns {Promise<Object|Array>} the response `data`
     * @private
     */
    private callVerificationApi;
    /**
     * Fetch (and cache) the RSA public key used to encrypt the account for the
     * device-verification requests. Retrieves it via `common/getConfig`, whose
     * response is a list; the `PUBLIC.KEY.CONFIG` entry's `value` is a JSON string
     * `{"publicKey":"<base64 SPKI DER>"}`.
     * @returns {Promise<string>} the base64-encoded SPKI DER public key
     * @private
     */
    private getVerificationPublicKey;
    verificationPublicKey: any;
    /**
     * Encrypt the account (e-mail) with the device-verification public key using
     * RSA / PKCS#1 v1.5 padding, base64-encoded.
     * @param {string} account - the account (e-mail) to encrypt
     * @returns {Promise<string>} the base64-encoded ciphertext
     * @private
     */
    private encryptAccount;
    /**
     * @param {string} loginPath - the login path
     * @param {Object} params - an object with the data to retrieve the parameters
     * @returns {Promise<Object>} an object including access token and user ID
     */
    callUserAuthApi(loginPath: string, params: Object): Promise<Object>;
    /**
     * Shared handler for the private auth API response envelope (`user/login`,
     * `user/getAuthCode` and the device-verification endpoints). Returns the
     * `data` payload on success (a list for `common/getConfig`, an object
     * otherwise) or throws a typed error for a known failure code.
     *
     * Security: a successful response may carry tokens / credentials, so only the
     * response code is logged here – never the full payload.
     * @param {Object} result - the parsed response envelope (`{ code, data, msg }`)
     * @returns {Object|Array} the response `data`
     * @throws {DeviceVerificationRequired} on code `1013`
     * @throws {InvalidVerificationCode} on code `1012`
     * @private
     */
    private handleAuthResponse;
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
     * @param {Object} [options] - optional transport overrides forwarded to the device session (see {@link EcovacsDeviceSession}); `{serverAddress, serverPort, protocol, rejectUnauthorized}`. The first three are mainly for local testing; `rejectUnauthorized` defaults to `false` because the Ecovacs cloud broker uses a private CA that is not publicly verifiable — set it to `true` only for a local broker whose CA Node can verify
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
    let AuthError: typeof errors.AuthError;
    let DeviceVerificationRequired: typeof errors.DeviceVerificationRequired;
    let InvalidVerificationCode: typeof errors.InvalidVerificationCode;
    let AccountSessionRejected: typeof errors.AccountSessionRejected;
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
import errors = require("./library/errors");
export { EcovacsAPI as EcoVacsAPI, AuthError, DeviceVerificationRequired, InvalidVerificationCode, AccountSessionRejected, EcovacsDevice as VacBot };
//# sourceMappingURL=index.d.ts.map