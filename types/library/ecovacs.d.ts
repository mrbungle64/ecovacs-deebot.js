export = Ecovacs;
declare class Ecovacs extends EventEmitter<any> {
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
    _clientListeners: {
        message: (topic: any, message: any) => void;
        connect: () => void;
        offline: () => void;
        disconnect: () => void;
        error: (error: any) => void;
    } | null | undefined;
    /**
     * Remove this instance's MQTT event handlers from `this.client`, if attached.
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
     * Handle life span components to emit combined object
     */
    handleLifeSpanCombined(): void;
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
     * If the vacuum has power adjustment and also has a mopping system
     * then emit a `MoppingSystemInfo` event with the `cleanStatus` and `cleanInfo` properties
     */
    emitMoppingSystemReport(): void;
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
    /**
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
     * @returns {Promise<void>}
     */
    handleMessagePayload(command: string, payload: any): Promise<void>;
    /**
     * "Strategic Particle Removal" and "Strategic Pet Poop Avoidance" mode (e.g. X1)
     * @param {Object} payload
     */
    _msgAICleanItemState(payload: Object): void;
    /**
     * "Auto empty" status (Auto-Empty Station)
     * @param {Object} payload
     */
    _msgAutoEmpty(payload: Object): void;
    /**
     * Battery status
     * @param {Object} payload
     */
    _msgBattery(payload: Object): void;
    /**
     * "Do Not Disturb" mode
     * @param {Object} payload
     */
    _msgBlock(payload: Object): void;
    /**
     * "Continuous Cleaning Mode" / "Resumed Clean"
     * @param {Object} payload
     */
    _msgBreakPoint(payload: Object): void;
    /**
     * "Cleaning Log"
     * @param {Object} payload
     */
    _msgCleanLogs(payload: Object): void;
    /**
     * "Auto-Boost Suction"
     * @param {Object} payload
     */
    _msgCarpetPressure(payload: Object): void;
    /**
     * Various information about the cleaning status
     * @param {Object} payload
     */
    _msgCleanInfo(payload: Object): void;
    /**
     * Various information about the charging status
     * @param {Object} payload
     */
    _msgChargeState(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgClearMap(payload: Object): void;
    /**
     * "Mopping Mode" / "Cleaning efficiency"
     * @param {Object} payload
     */
    _msgCustomAreaMode(payload: Object): void;
    /**
     * Air Freshener module (T9 AIVI)
     * @param {Object} payload
     */
    _msgDModule(payload: Object): void;
    /**
     * Rare event, little is known about it yet
     * @param {Object} payload
     */
    _msgEvt(payload: Object): void;
    /**
     * Error codes
     * @param {Object} payload
     */
    _msgError(payload: Object): void;
    /**
     * Consumable components
     * @param {Object} payload
     */
    _msgLifeSpan(payload: Object): void;
    /**
     * Various network/wifi information
     * @param {Object} payload
     */
    _msgNetInfo(payload: Object): void;
    /**
     * Over-the-air firmware update status
     * @param {Object} payload
     */
    _msgOta(payload: Object): void;
    /**
     * Various information about the position of the bot and the charging station
     * @param {Object} payload
     */
    _msgPos(payload: Object): void;
    /**
     * "Customized Scenario Cleaning" scenarios
     * @param {Object} payload
     */
    _msgQuickCommand(payload: Object): void;
    /**
     * True Detect / "AIVI 3D" (e.g. "AIVI Smart Recognition")
     * @param {Object} payload
     */
    _msgRecognization(payload: Object): void;
    /**
     * Relocation status
     * @param {Object} payload
     */
    _msgRelocationState(payload: Object): void;
    /**
     * "Scheduling"
     * @param {Object} payload
     */
    _msgSched(payload: Object): void;
    /**
     * Sleep mode/status
     * @param {Object} payload
     */
    _msgSleep(payload: Object): void;
    /**
     * "Vacuum Power" / "Suction Power"
     * @param {Object} payload
     */
    _msgSpeed(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgStationAction(payload: Object): void;
    /**
     * Various information about the cleaning station (e.g. X1 series)
     * @param {Object} payload
     */
    _msgStationInfo(payload: Object): void;
    /**
     * Various states of the cleaning station (e.g. X1 series)
     * @param {Object} payload
     */
    _msgStationState(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgStats(payload: Object): void;
    /**
     * "Mop-Only" mode
     * @param {Object} payload
     */
    _msgSweepMode(payload: Object): void;
    /**
     * The configured time zone
     * @param {Object} payload
     */
    _msgTimeZone(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgTotalStats(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgTrueDetect(payload: Object): void;
    /**
     * "Water Flow Level"
     * @param {Object} payload
     */
    _msgWaterInfo(payload: Object): void;
    /**
     * Configured WiFi networks
     * @param {Object} payload
     */
    _msgWifiList(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgWorkState(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgCachedMapInfo(payload: Object): void;
    /**
     * @param {Object} payload
     * @param {Object} ctx
     */
    _msgMapInfo(payload: Object, ctx: Object): Promise<void>;
    /**
     * @param {Object} payload
     */
    _msgMapInfoV2(payload: Object): void;
    /**
     * Handle spotAreas, virtualWalls, noMopZones
     * @param {Object} payload
     */
    _msgMapSet(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgMapState(payload: Object): void;
    /**
     * Status of the Multi Map functionality
     * @param {Object} payload
     */
    _msgMultiMapState(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgMapSetV2(payload: Object): Promise<void>;
    /**
     * Handle spotAreas, virtualWalls, noMopZones
     * @param {Object} payload
     */
    _msgMapSubSet(payload: Object): Promise<void>;
    /**
     * Air drying status (yeedi only; see StationState for Deebot models)
     * @param {Object} payload
     */
    _msgAirDrying(payload: Object): void;
    /**
     * MapInfo_V2 for yeedi models differs from the Ecovacs variant
     * @param {Object} payload
     */
    _msgMapInfoV2Yeedi(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgAirQuality(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgAiBlockPlate(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgAirbotAutoModel(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgAngleWakeup(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgEfficiency(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgHumanoidFollow(payload: Object): void;
    /**
     * Air purifier sensor readings (AirSpeed / Humidity / Temperature) — log only
     * @param {Object} payload
     * @param {Object} ctx
     */
    _msgAirPurifierLog(payload: Object, ctx: Object): void;
    /**
     * @param {Object} payload
     */
    _msgSetVoice(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgVoice(payload: Object): void;
    /**
     * @param {Object} payload
     */
    _msgMajorMap(payload: Object): Promise<void>;
    /**
     * @param {Object} payload
     */
    _msgMapTrace(payload: Object): void;
    /**
     * Handle a Minor Map piece: feed it to the live map image and emit the
     * rendered image once the full set of pieces has been received.
     * @param {Object} payload
     */
    _msgMinorMap(payload: Object): Promise<void>;
    /**
     * @param {Object} payload
     */
    _msgFwbpSysinfo(payload: Object): void;
    _msgFwbpAirQuality(): void;
    /**
     * @param {Object} payload
     * @param {Object} ctx
     */
    _msgFwbpTask(payload: Object, ctx: Object): void;
    /**
     * Intentionally unhandled message — accepted without emitting a warning.
     */
    _msgNoop(): void;
    /**
     * Fallback for messages with no entry in MESSAGE_HANDLERS.
     * Tries the registry-driven `Get<Command>` path (parse + emit the expected
     * event), then warns if the command is still unknown.
     * @param {string} abbreviatedCommand - the normalised command name
     * @param {Object} payload
     * @param {string} command - the original (un-abbreviated) command name
     */
    _handleUnknownMessage(abbreviatedCommand: string, payload: Object, command: string): void;
    /**
     * Given a command, return the prefix of the command
     * @param {string} command - the command that was sent
     * @returns {string} the prefix of the command
     */
    getCommandPrefix(command: string): string;
    handleV2commands(abbreviatedCommand: any): any;
    /**
     * Handle onFwBuryPoint message (e.g. T8/T9 series)
     * This is presumably some kind of debug or internal message
     * The main advantage of this message is that it's fired immediately
     * @param {Object} payload
     */
    handleFwBuryPoint(payload: Object): Promise<boolean>;
}
import EventEmitter = require("node:events");
import PendingCommandRegistry = require("./managers/pendingCommandRegistry");
//# sourceMappingURL=ecovacs.d.ts.map