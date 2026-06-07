export = EcovacsDeviceSession;
declare class EcovacsDeviceSession extends EventEmitter<any> {
    /**
     * @param {Object} vacBot - the VacBot object
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} country - the country where the Ecovacs account is registered
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} serverAddress - the address of the MQTT server
     * @param {number} [serverPort=8883] - the port that the MQTT server is listening on
     */
    constructor(vacBot: Object, user: string, hostname: string, resource: string, secret: string, continent: string, country: string, vacuum: Object, serverAddress: string, serverPort?: number);
    bot: Object;
    dictionary: typeof import("./dictionary");
    user: string;
    hostname: string;
    resource: string;
    secret: string;
    country: string;
    continent: string;
    vacuum: Object;
    serverAddress: string;
    serverPort: number;
    mqtt: typeof import("mqtt");
    channel: string;
    username: string;
    payloadType: string;
    pendingCommands: PendingCommandRegistry;
    dispatcher: EcovacsMessageDispatcher;
    /**
     * Get the server address of the Ecovacs endpoint.
     * Different schema for accounts registered in China
     * @returns {string} the endpoint
     */
    getEcovacsEndpoint(): string;
    /**
     * Subscribe for "broadcast" messages to the MQTT channel
     * @see https://deebot.readthedocs.io/advanced/protocols/mqtt/#mqtt
     */
    subscribe(): void;
    /**
     * Connect to the MQTT server and listen to broadcast messages
     */
    connect(): void;
    client: Object | import("mqtt").MqttClient | undefined;
    /**
     * Attach to an existing MQTT client owned by another Ecovacs instance.
     * Used when multiple vacbots share one MQTT session (one login, one connection,
     * multiple topic subscriptions). The caller retains ownership of the client;
     * this instance will subscribe/unsubscribe but will NOT call client.end().
     * @param {Object} existingClient - connected mqtt.Client to reuse
     */
    connectShared(existingClient: Object): void;
    _sharedClient: boolean | undefined;
    /**
     * Bind this instance's MQTT event handlers and attach them to `this.client`.
     * The handlers are stored so they can be removed again in `disconnect()`.
     * Any previously-attached handlers are detached first, so repeated
     * `connect()`/`connectShared()` calls (reconnects, token refresh) and shared
     * clients shared by several bots do not accumulate duplicate listeners.
     * @private
     */
    private _attachClientListeners;
    _maxListenersBump: number | undefined;
    _clientListeners: {
        message: (topic: any, message: any) => void;
        connect: () => void;
        offline: () => void;
        disconnect: () => void;
        error: (error: any) => void;
    } | null | undefined;
    /**
     * Remove this instance's MQTT event handlers from `this.client`, if attached,
     * and revert any max-listener cap increase this instance applied.
     * @private
     */
    private _detachClientListeners;
    /**
     * Parse and dispatch an incoming MQTT broadcast message for this device.
     * A shared client receives messages for every device on the account, so
     * messages whose topic `did` does not match this instance are ignored.
     * @param {string} topic - the MQTT topic the message arrived on
     * @param {Buffer} message - the raw message payload
     * @private
     */
    private _onMqttMessage;
    /**
     * Emit a network error for a client-level MQTT event (offline/disconnect/error),
     * falling back to a log line if emitting fails.
     * @param {string} message - the error message
     * @private
     */
    private _onClientNetworkEvent;
    /**
     * Apply a refreshed user access token. Takes effect immediately for REST
     * commands (which read `this.secret` when building the auth object). For an
     * owned MQTT connection the client is reconnected with the new password; for
     * a shared client only the secret is updated and the owner is responsible
     * for reconnecting.
     * @param {string} newToken - the refreshed user access token
     */
    updateToken(newToken: string): void;
    /**
     * Reconnect the owned MQTT client using the current `this.secret` as password.
     * @private
     */
    private _reconnectWithNewSecret;
    /**
     * It sends a command to the Ecovacs API.
     * Optionally returns a Promise that resolves with the response payload
     * when the command's expected event fires.
     * @param {Object} command - the command to send to the Ecovacs API
     * @param {Object} [options={}]
     * @param {boolean} [options.returnPromise=false] - if true, returns a Promise
     * @param {number}  [options.timeoutMs=10000] - timeout in ms before the Promise rejects
     * @returns {Promise<any>|void}
     */
    sendCommand(command: Object, options?: {
        returnPromise?: boolean | undefined;
        timeoutMs?: number | undefined;
    }): Promise<any> | void;
    /**
     * Emit an event message and resolve any pending commands waiting for this event.
     * @param {string} name - Event name.
     * @param {*} payload - The main payload of the event.
     * @param {*} [rawPayload] - Optional raw payload of the event.
     */
    emitMessage(name: string, payload: any, rawPayload?: any): void;
    /**
     * Emit an `Availability` event, but only on a state change (edge-triggered),
     * so consumers see the device going offline (errno 4200) and recovering.
     * @param {boolean} available - whether the device is currently reachable
     * @private
     */
    private _emitAvailability;
    _deviceAvailable: any;
    /**
     * Emit a network related error message
     * @param {string} message - the error message
     * @param {string} [command=''] - the command
     */
    emitNetworkError(message: string, command?: string): void;
    /**
     * Set values for emitting an error
     * @param {string} code - the error code
     * @param {string} message - the error message
     */
    emitError(code: string, message: string): void;
    /**
     * Emit an error by a given error code
     * @param {string} errorCode
     */
    emitLastErrorByErrorCode(errorCode: string): void;
    /**
     * Emit the error.
     * Disconnect if 'RequestOAuthError: Authentication error' error
     */
    emitLastError(): void;
    /**
     * Disconnect the MQTT client
     */
    disconnect(): Promise<any>;
    /**
     * It handles the response from the Ecovacs API
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {import('./typedefs').MessageEnvelope & {resp?: Object, ret?: string}} messagePayload - The message payload that was received
     */
    handleCommandResponse(command: Object, messagePayload: import("./typedefs").MessageEnvelope & {
        resp?: Object;
        ret?: string;
    }): void;
    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} name - the name of the command or MQTT event
     * @param {import('./typedefs').MessageEnvelope} envelope - the message envelope
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     * @param {string|null} [commandId] - request id of the originating command (response path only)
     */
    handleMessage(name: string, envelope: import("./typedefs").MessageEnvelope, type?: string, commandId?: string | null): void;
    /**
     * Extracts and returns the payload from an incoming MQTT message envelope.
     * Logs a warning if the message structure is unhandled.
     * @param {string} name - Event name.
     * @param {import('./typedefs').MessageEnvelope} envelope - The message envelope.
     * @returns {*} The extracted payload, or undefined if invalid.
     */
    _extractIncomingPayload(name: string, envelope: import("./typedefs").MessageEnvelope): any;
    /**
     * Extracts and returns the payload from a REST/HTTP response envelope.
     * Validates the result code and handles firmware versioning.
     * @param {string} name - Command name.
     * @param {import('./typedefs').MessageEnvelope} envelope - The response envelope.
     * @returns {*} The extracted payload, or undefined if invalid or error code is non-zero.
     */
    _extractResponsePayload(name: string, envelope: import("./typedefs").MessageEnvelope): any;
    /**
     * Parses a raw incoming MQTT message into eventName + payload.
     * Topic format: "iot/atr/<eventName>/<did>/<class>/<resource>/j"
     * @param {string} name
     * @param {string} rawMessage - JSON string
     * @returns {Object|null} parsed JSON object, null if malformed
     */
    _parseMqttMessage(name: string, rawMessage: string): Object | null;
    /**
     * Emits HeaderInfo if the firmware version changed.
     * @param {{ fwVer: string, hwVer: string }} header
     */
    _handleFirmwareVersion(header: {
        fwVer: string;
        hwVer: string;
    }): void;
    /** @returns {void} — intentionally fire-and-forget */
    _dispatchPayload(eventName: any, payload: any, commandId?: null): void;
    _responseCommandId: any;
}
import EventEmitter = require("node:events");
import PendingCommandRegistry = require("./managers/pendingCommandRegistry");
import EcovacsMessageDispatcher = require("./ecovacsMessageDispatcher");
//# sourceMappingURL=ecovacsDeviceSession.d.ts.map