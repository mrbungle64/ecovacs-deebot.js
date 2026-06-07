/**
 * Response data of the credential login (`user/login`).
 */
export type LoginResult = {
    /**
     * - the user id
     */
    uid: string;
    /**
     * - the login access token (exchanged for an auth code)
     */
    accessToken: string;
};
/**
 * Response data of the auth-code exchange (`user/getAuthCode`).
 */
export type AuthCodeResult = {
    /**
     * - the one-time auth code
     */
    authCode: string;
};
/**
 * Response data of `loginByItToken`.
 */
export type ItTokenResult = {
    /**
     * - the user access token (a.k.a. secret), used for portal + MQTT
     */
    token: string;
    /**
     * - the resolved user id
     */
    userId: string;
    /**
     * - token validity window in milliseconds (typically 7 days)
     */
    last?: string | number | undefined;
};
/**
 * The credentials snapshot emitted on (re-)login.
 */
export type Credentials = {
    /**
     * - the user id
     */
    userId: string;
    /**
     * - the user access token (secret)
     */
    token: string;
    /**
     * - absolute refresh timestamp (ms since epoch), or null
     */
    expiresAt: number | null;
};
/**
 * The app-identity meta object mixed into auth requests/signatures.
 */
export type MetaObject = {
    country: string;
    lang: string;
    deviceId: string;
    appCode: string;
    appVersion: string;
    channel: string;
    deviceType: string;
};
/**
 * The auth object attached to every portal/device-manager request.
 */
export type AuthObject = {
    realm: string;
    resource: string;
    token: string;
    userid: string;
    with: string;
};
/**
 * The `payload` of a device-manager command request.
 */
export type CommandPayload = {
    header: {
        pri: string;
        ts: number;
        tzm: number;
        ver: string;
    };
    body: {
        data: Object;
    };
};
/**
 * The full device-manager command request body (`iot/devmanager.do`).
 */
export type CommandRequestObject = {
    cmdName: string;
    payload: CommandPayload;
    payloadType: string;
    auth: AuthObject;
    td: string;
    toId: string;
    toRes: string;
    toType: string;
};
/**
 * The (flatter) request body used for `GetCleanLogs` (`lg/log.do`).
 */
export type CleanLogsCommandObject = {
    auth: AuthObject;
    did: string;
    country: string;
    td: string;
    resource: string;
};
/**
 * The shared header of every JSON message (MQTT push and REST response).
 */
export type MessageHeader = {
    pri?: string | number | undefined;
    tzm?: number | undefined;
    ts?: string | number | undefined;
    ver?: string | undefined;
    /**
     * - firmware version (watched; change emits `HeaderInfo`)
     */
    fwVer?: string | undefined;
    /**
     * - hardware version
     */
    hwVer?: string | undefined;
};
/**
 * The body of a JSON message. `data` carries the actual payload.
 */
export type MessageBody = {
    /**
     * - result code (`0` = ok for REST responses)
     */
    code?: number | undefined;
    msg?: string | undefined;
    data?: Object | undefined;
};
/**
 * A full JSON message envelope shared by MQTT pushes and REST responses.
 */
export type MessageEnvelope = {
    header?: MessageHeader | undefined;
    body?: MessageBody | undefined;
};
//# sourceMappingURL=typedefs.d.ts.map