'use strict';

/**
 * Shared JSDoc type definitions for the Ecovacs protocol shapes.
 *
 * This module intentionally contains no runtime code — it only declares
 * `@typedef`s that other files reference via
 * `import('./typedefs').<TypeName>` so the generated `.d.ts` typings and IDE
 * inspection share one source of truth for the protocol envelopes.
 */

// ─── Authentication ───────────────────────────────────────────────────

/**
 * Response data of the credential login (`user/login`).
 * @typedef {Object} LoginResult
 * @property {string} uid - the user id
 * @property {string} accessToken - the login access token (exchanged for an auth code)
 */

/**
 * Response data of the auth-code exchange (`user/getAuthCode`).
 * @typedef {Object} AuthCodeResult
 * @property {string} authCode - the one-time auth code
 */

/**
 * Response data of `loginByItToken`.
 * @typedef {Object} ItTokenResult
 * @property {string} token - the user access token (a.k.a. secret), used for portal + MQTT
 * @property {string} userId - the resolved user id
 * @property {string|number} [last] - token validity window in milliseconds (typically 7 days)
 */

/**
 * The credentials snapshot emitted on (re-)login.
 * @typedef {Object} Credentials
 * @property {string} userId - the user id
 * @property {string} token - the user access token (secret)
 * @property {number|null} expiresAt - absolute refresh timestamp (ms since epoch), or null
 */

/**
 * The app-identity meta object mixed into auth requests/signatures.
 * @typedef {Object} MetaObject
 * @property {string} country
 * @property {string} lang
 * @property {string} deviceId
 * @property {string} appCode
 * @property {string} appVersion
 * @property {string} channel
 * @property {string} deviceType
 */

// ─── Portal command envelope ──────────────────────────────────────────

/**
 * The auth object attached to every portal/device-manager request.
 * @typedef {Object} AuthObject
 * @property {string} realm
 * @property {string} resource
 * @property {string} token
 * @property {string} userid
 * @property {string} with
 */

/**
 * The `payload` of a device-manager command request.
 * @typedef {Object} CommandPayload
 * @property {{pri: string, ts: number, tzm: number, ver: string}} header
 * @property {{data: Object}} body
 */

/**
 * The full device-manager command request body (`iot/devmanager.do`).
 * @typedef {Object} CommandRequestObject
 * @property {string} cmdName
 * @property {CommandPayload} payload
 * @property {string} payloadType
 * @property {AuthObject} auth
 * @property {string} td
 * @property {string} toId
 * @property {string} toRes
 * @property {string} toType
 */

/**
 * The (flatter) request body used for `GetCleanLogs` (`lg/log.do`).
 * @typedef {Object} CleanLogsCommandObject
 * @property {AuthObject} auth
 * @property {string} did
 * @property {string} country
 * @property {string} td
 * @property {string} resource
 */

// ─── Message envelope ─────────────────────────────────────────────────

/**
 * The shared header of every JSON message (MQTT push and REST response).
 * @typedef {Object} MessageHeader
 * @property {number|string} [pri]
 * @property {number} [tzm]
 * @property {number|string} [ts]
 * @property {string} [ver]
 * @property {string} [fwVer] - firmware version (watched; change emits `HeaderInfo`)
 * @property {string} [hwVer] - hardware version
 */

/**
 * The body of a JSON message. `data` carries the actual payload.
 * @typedef {Object} MessageBody
 * @property {number} [code] - result code (`0` = ok for REST responses)
 * @property {string} [msg]
 * @property {Object} [data]
 */

/**
 * A full JSON message envelope shared by MQTT pushes and REST responses.
 * @typedef {Object} MessageEnvelope
 * @property {MessageHeader} [header]
 * @property {MessageBody} [body]
 */

module.exports = {};
