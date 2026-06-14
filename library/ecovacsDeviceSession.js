'use strict';

const EventEmitter = require('events');
const tools = require('./tools');
const constants = require('./constants');
const { errorCodes } = require('./errorCodes.json');
const axios = require("axios").default;
const commandObj = require('./command');
const PendingCommandRegistry = require('./managers/pendingCommandRegistry');
const COMMAND_REGISTRY = require('./commandRegistry');
const EcovacsMessageDispatcher = require('./ecovacsMessageDispatcher');

const MESSAGE_TYPE = Object.freeze({
    INCOMING: 'incoming',
    RESPONSE: 'response',
});

class EcovacsDeviceSession extends EventEmitter {
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
    constructor(vacBot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort = 8883) {
        super();

        this.bot = vacBot;
        this.dictionary = require('./dictionary');
        this.user = user;
        this.hostname = hostname;
        this.resource = resource;
        this.secret = secret;
        this.country = country.toUpperCase();
        this.continent = continent;
        this.vacuum = vacuum;

        if (!serverAddress) {
            this.serverAddress = this.getEcovacsEndpoint();
        } else {
            this.serverAddress = serverAddress;
        }
        this.serverPort = serverPort;

        this.mqtt = require('mqtt');
        this.channel = '';
        // MQTT is using domain without tld extension
        const customDomain = hostname.split(".")[0];
        this.username = user + '@' + customDomain;
        // The payload type is either 'x' (XML) or 'j' (JSON)
        this.payloadType = 'j';

        this.pendingCommands = new PendingCommandRegistry();

        // Translates incoming messages/responses into named events. The session
        // owns the transport and EventEmitter; the dispatcher reaches both back
        // through the reference passed here (see EcovacsMessageDispatcher).
        this.dispatcher = new EcovacsMessageDispatcher(this);

        // Registered once for the lifetime of this instance. The 'ready' event
        // fires on every (re)subscribe, so attaching it here — rather than in
        // connect()/connectShared() — avoids accumulating listeners across
        // reconnects/token refreshes (which would trip MaxListenersExceededWarning).
        this.on('ready', () => {
            const suffix = this._sharedClient ? ' (shared connection)' : '';
            tools.envLogSuccess(`MQTT client received ready event${suffix}`);
        });
    }

    /**
     * Get the server address of the Ecovacs endpoint.
     * Different schema for accounts registered in China
     * @returns {string} the endpoint
     */
    getEcovacsEndpoint() {
        const urlPrefix = 'mq';
        let serverAddress = `${urlPrefix}-${this.continent}.${constants.REALM}`;
        if (this.country === 'CN') {
            serverAddress = `${urlPrefix}.${constants.REALM}`;
        }
        return serverAddress;
    }

    /**
     * Subscribe for "broadcast" messages to the MQTT channel
     * @see https://deebot.readthedocs.io/advanced/protocols/mqtt/#mqtt
     */
    subscribe() {
        tools.envLogHeader(`subscribe()`);
        this.channel = `iot/atr/+/${this.vacuum['did']}/${this.vacuum['class']}/${this.vacuum['resource']}/${this.payloadType}`;
        tools.envLogInfo(`atr channel: '${this.channel}'`);
        this.client.subscribe(this.channel, (error) => {
            if (!error) {
                tools.envLogSuccess(`successfully subscribed to atr channel`);
                this.emit('ready', 'Successfully subscribed to atr channel');
            } else {
                tools.envLogError(`subscribe error: ${error.toString()}`);
            }
        });
    }

    /**
     * Connect to the MQTT server and listen to broadcast messages
     */
    connect() {
        tools.envLogHeader(`connect()`);
        // Detach from any previous client before replacing it, so the old client
        // stops routing events here (and the listener bookkeeping stays correct)
        this._detachClientListeners();
        this._sharedClient = false;
        const url = `mqtts://${this.serverAddress}:${this.serverPort}`;
        const clientId = this.username + '/' + this.resource;
        tools.envLogInfo(`url: '${url}'`);
        tools.envLogInfo(`username: '${this.username}'`);
        tools.envLogInfo(`clientId: '${clientId}'`);
        this.client = this.mqtt.connect(url, {
            clientId: clientId,
            username: this.username,
            password: this.secret,
            protocolVersion: 4,
            keepalive: 120,
            rejectUnauthorized: false
        });

        this._attachClientListeners();
    }

    /**
     * Attach to an existing MQTT client owned by another Ecovacs instance.
     * Used when multiple vacbots share one MQTT session (one login, one connection,
     * multiple topic subscriptions). The caller retains ownership of the client;
     * this instance will subscribe/unsubscribe but will NOT call client.end().
     * @param {Object} existingClient - connected mqtt.Client to reuse
     */
    connectShared(existingClient) {
        tools.envLogHeader(`connectShared()`);
        tools.envLogInfo(`vacuum did: '${this.vacuum['did']}'`);

        // Detach from any previous client before replacing it, so the old client
        // stops routing events here and the max-listeners revert is applied to
        // the client that was actually bumped
        this._detachClientListeners();
        this._sharedClient = true;
        this.client = existingClient;

        this._attachClientListeners();

        if (this.client.connected) {
            this.subscribe();
        }
    }

    /**
     * Bind this instance's MQTT event handlers and attach them to `this.client`.
     * The handlers are stored so they can be removed again in `disconnect()`.
     * Any previously-attached handlers are detached first, so repeated
     * `connect()`/`connectShared()` calls (reconnects, token refresh) and shared
     * clients shared by several bots do not accumulate duplicate listeners.
     * @private
     */
    _attachClientListeners() {
        this._detachClientListeners();
        const listeners = {
            message: (topic, message) => this._onMqttMessage(topic, message),
            connect: () => {
                const prefix = this._sharedClient ? 'shared ' : '';
                tools.envLogSuccess(`${prefix}MQTT client connected, subscribing for did '${this.vacuum['did']}'`);
                this.subscribe();
            },
            offline: () => this._onClientNetworkEvent('MQTT server is offline or not reachable'),
            disconnect: () => this._onClientNetworkEvent('MQTT client received disconnect event'),
            error: (error) => this._onClientNetworkEvent(`MQTT client error: ${error.message}`)
        };
        // Each bot on a shared client adds its own listener set; raise the cap so
        // legitimate multi-bot sharing does not trip MaxListenersExceededWarning.
        // The bump is tracked and reverted in _detachClientListeners(), so the cap
        // does not ratchet upward across reconnects / bot churn (which would mask
        // genuine leaks).
        if (this._sharedClient && typeof this.client.setMaxListeners === 'function') {
            this._maxListenersBump = Object.keys(listeners).length;
            this.client.setMaxListeners(this.client.getMaxListeners() + this._maxListenersBump);
        }
        for (const [event, handler] of Object.entries(listeners)) {
            this.client.on(event, handler);
        }
        this._clientListeners = listeners;
    }

    /**
     * Remove this instance's MQTT event handlers from `this.client`, if attached,
     * and revert any max-listener cap increase this instance applied.
     * @private
     */
    _detachClientListeners() {
        if (!this.client || !this._clientListeners) {
            return;
        }
        for (const [event, handler] of Object.entries(this._clientListeners)) {
            this.client.removeListener(event, handler);
        }
        if (this._maxListenersBump && typeof this.client.setMaxListeners === 'function') {
            this.client.setMaxListeners(this.client.getMaxListeners() - this._maxListenersBump);
        }
        this._maxListenersBump = 0;
        this._clientListeners = null;
    }

    /**
     * Parse and dispatch an incoming MQTT broadcast message for this device.
     * A shared client receives messages for every device on the account, so
     * messages whose topic `did` does not match this instance are ignored.
     * @param {string} topic - the MQTT topic the message arrived on
     * @param {Buffer} message - the raw message payload
     * @private
     */
    _onMqttMessage(topic, message) {
        const topicParts = topic.split('/');
        if (topicParts[3] !== this.vacuum['did']) {
            return;
        }
        const eventName = topicParts[2];
        tools.envLogMqtt(topic);
        tools.envLogMqtt(eventName);
        const parsedEnvelope = this._parseMqttMessage(eventName, message.toString());
        if (parsedEnvelope) {
            this.handleMessage(eventName, parsedEnvelope, MESSAGE_TYPE.INCOMING);
        }
    }

    /**
     * Emit a network error for a client-level MQTT event (offline/disconnect/error),
     * falling back to a log line if emitting fails.
     * @param {string} message - the error message
     * @private
     */
    _onClientNetworkEvent(message) {
        try {
            this.emitNetworkError(message);
        } catch {
            tools.envLogError(message);
        }
    }

    /**
     * Apply a refreshed user access token. Takes effect immediately for REST
     * commands (which read `this.secret` when building the auth object). For an
     * owned MQTT connection the client is reconnected with the new password; for
     * a shared client only the secret is updated and the owner is responsible
     * for reconnecting.
     * @param {string} newToken - the refreshed user access token
     */
    updateToken(newToken) {
        if (!newToken || newToken === this.secret) {
            return;
        }
        this.secret = newToken;
        if (this._sharedClient) {
            tools.envLogInfo(`updateToken on shared client: secret updated, owner must reconnect`);
            return;
        }
        // Replace the owned client even when it is currently offline: the mqtt
        // client keeps its original password in its options and would otherwise
        // keep auto-reconnecting with the now-stale credentials.
        if (this.client) {
            this._reconnectWithNewSecret();
        }
    }

    /**
     * Reconnect the owned MQTT client using the current `this.secret` as password.
     * @private
     */
    _reconnectWithNewSecret() {
        tools.envLogInfo(`reconnecting MQTT client with refreshed token`);
        try {
            this.client.end(true, () => {
                this.connect();
            });
        } catch (e) {
            tools.envLogError(`error during token reconnect: ${e.message}`);
        }
    }

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
    async sendCommand(command, options = {}) {
        tools.envLogCommand(command.name);
        tools.envLogPayload(command.args);

        let commandPromise = null;
        let rejectPromise = null;
        let resolvePromise = null;
        let expectedEvent = null;

        if (options.returnPromise) {
            const registryKey = COMMAND_REGISTRY.resolveKey(command._registryKey || command.constructor.name)
                || COMMAND_REGISTRY.resolveKey(command.name);
            const entry = registryKey ? COMMAND_REGISTRY[registryKey] : null;
            expectedEvent = (entry && entry.expectedEvent) || null;

            commandPromise = new Promise((resolve, reject) => {
                rejectPromise = reject;
                if (expectedEvent) {
                    this.pendingCommands.register(
                        command.getId(),
                        command.name,
                        expectedEvent,
                        command,
                        resolve,
                        reject,
                        options.timeoutMs || 10000
                    );
                } else {
                    resolvePromise = resolve;
                }
            });
            // The registry timeout (or rejectAll on disconnect) may reject this
            // Promise while we are still awaiting the HTTP request below — i.e.
            // before the caller had any chance to attach handlers. Mark it as
            // handled so a slow portal request cannot trigger an unhandled
            // rejection; the caller still receives the rejection when awaiting.
            commandPromise.catch(() => {});
        }

        const rejectCommand = (e) => {
            if (expectedEvent) {
                this.pendingCommands.rejectById(command.getId(), e);
            } else if (rejectPromise) {
                rejectPromise(e);
            }
        };

        let params, portalUrl, headers;
        try {
            params = commandObj.getRequestObject(this, command);
            portalUrl = commandObj.getRequestUrl(this, command, params);
            headers = commandObj.getRequestHeaders(this, params);
        } catch (e) {
            this.emitNetworkError(e.message, command.name);
            rejectCommand(e);
            tools.envLogError(`error building command request: ${e.toString()}`);
            return commandPromise;
        }

        let responseData;
        try {
            // The Ecovacs cloud sporadically returns HTTP 502; retry defensively.
            const response = await tools.withRetry(
                () => axios.post(portalUrl, params, { headers }),
                { retryOn: ({ error }) => tools.isBadGatewayError(error) }
            );
            responseData = response.data;
            tools.envLogSuccess(`got response for '${command.name}' with id '${command.args.id}':`);
        } catch (e) {
            this.emitNetworkError(e.message, command.name);
            rejectCommand(e);
            return commandPromise;
        }

        if ((responseData['result'] === 'ok') || (responseData['ret'] === 'ok')) {
            this.emitLastErrorByErrorCode('0');
            this._emitAvailability(true);
            this.handleCommandResponse(command, responseData);
            if (resolvePromise) {
                resolvePromise(responseData);
            }
        } else {
            const errorCodeObj = {
                code: responseData['errno'],
                error: responseData['error']
            };
            // Error code 4200 = bot offline / not reachable
            if (Number(responseData['errno']) === 4200) {
                this._emitAvailability(false);
            }
            this.bot.handleResponseError(errorCodeObj);
            // Error code 500 = wait for response timed out (see issue #19)
            if (this.bot.errorCode === '500') {
                this.bot.errorDescription = this.bot.errorDescription + ` (command '${command.name}')`;
            }
            this.emitLastError();
            tools.envLogInfo(`[EcovacsDeviceSession] failure code ${responseData['errno']} (${responseData['error']}) sending command '${command.name}'`);
            rejectCommand(new Error(`Failure code ${responseData['errno']} (${responseData['error']})`));
        }

        return commandPromise;
    }

    /**
     * Emit an event message and resolve any pending commands waiting for this event.
     * @param {string} name - Event name.
     * @param {*} payload - The main payload of the event.
     * @param {*} [rawPayload] - Optional raw payload of the event.
     */
    emitMessage(name, payload, rawPayload) {
        tools.envLogResult(name, JSON.stringify(payload));
        this.emit(name, payload);
        // Resolve any pending Promise that is waiting for this event. When this
        // emit originates from a command response, `_responseCommandId` lets the
        // registry resolve that exact command rather than the oldest match.
        if (this.pendingCommands.size > 0) {
            this.pendingCommands.resolveByEvent(name, rawPayload === undefined ? payload : rawPayload, this._responseCommandId);
        }
    }

    /**
     * Emit an `Availability` event, but only on a state change (edge-triggered),
     * so consumers see the device going offline (errno 4200) and recovering.
     * @param {boolean} available - whether the device is currently reachable
     * @private
     */
    _emitAvailability(available) {
        if (this._deviceAvailable === available) {
            return;
        }
        this._deviceAvailable = available;
        this.emitMessage('Availability', { available });
    }

    /**
     * Emit a network related error message
     * @param {string} message - the error message
     * @param {string} [command=''] - the command
     */
    emitNetworkError(message, command = '') {
        this.emitError('-1', tools.createErrorDescription(message, command));
    }

    /**
     * Set values for emitting an error
     * @param {string} code - the error code
     * @param {string} message - the error message
     */
    emitError(code, message) {
        tools.envLogWarn(`received error event with code '${code}' and message '${message}'`);
        this.bot.errorCode = code;
        this.bot.errorDescription = message;
        this.emitLastError();
    }

    /**
     * Emit an error by a given error code
     * @param {string} errorCode
     */
    emitLastErrorByErrorCode(errorCode) {
        if (errorCode !== this.bot.errorCode) {
            this.bot.errorCode = errorCode;
            if (errorCodes[errorCode]) {
                this.bot.errorDescription = errorCodes[errorCode];
            } else {
                this.bot.errorDescription = 'Unknown error code';
            }
            this.emitLastError();
        }
    }

    /**
     * Emit the error.
     * Disconnect if 'RequestOAuthError: Authentication error' error
     */
    emitLastError() {
        this.emit('Error', this.bot.errorDescription);
        this.emit('ErrorCode', this.bot.errorCode);
        this.emit('LastError', {
            'error': this.bot.errorDescription,
            'code': this.bot.errorCode
        });
        // Error code 3 = 'RequestOAuthError: Authentication error'
        if (this.bot.errorCode === '3') {
            this.emit('disconnect', true);
            // Fire-and-forget: a failing disconnect must not surface as an
            // unhandled rejection in the consuming application
            this.disconnect().catch((e) => {
                tools.envLogError(`error disconnecting after auth error: ${e.message}`);
            });
        }
    }

    /**
     * Disconnect the MQTT client
     */
    async disconnect() {
        this.pendingCommands.rejectAll(new Error('Connection closed'));
        // Remove this instance's listeners first so a shared client (which we do
        // not close) stops routing messages here and does not accumulate handlers.
        this._detachClientListeners();
        if (!this.client || !this.client.connected) {
            return Promise.resolve(false);
        }
        return new Promise((resolve, reject) => {
            this.client.unsubscribe(this.channel, error => {
                if (error) {
                    tools.envLogError(`error unsubscribing from the atr channel: ${error.toString()}`);
                    reject(new Error(`failed to unsubscribe from the atr channel: ${error.toString()}`));
                } else {
                    tools.envLogSuccess(`successfully unsubscribed from the atr channel`);
                    if (!this._sharedClient) {
                        tools.envLogInfo(`now trying to close MQTT client connection ...`);
                        this.client.end();
                    }
                    resolve(true);
                }
            });
        });
    }

    /**
     * It handles the response from the Ecovacs API
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {import('./typedefs').MessageEnvelope & {resp?: Object, ret?: string}} messagePayload - The message payload that was received
     */
    handleCommandResponse(command, messagePayload) {
        // The originating command is known for a response, so its request id can
        // disambiguate which pending Promise to resolve (see resolveByEvent).
        const commandId = (typeof command.getId === 'function') ? command.getId() : null;
        if (messagePayload) {
            if (messagePayload.hasOwnProperty('resp')) {
                this.handleMessage(command.name, messagePayload['resp'], MESSAGE_TYPE.RESPONSE, commandId);
            } else if (command.api === constants.CLEANLOGS_PATH) {
                // CleanLogs uses a different API path and response format
                tools.envLogInfo(`got CleanLogs response`);
                if (messagePayload['ret'] === 'ok') {
                    this._dispatchPayload(command.name, messagePayload, commandId);
                }
            } else {
                tools.envLogWarn(`handleCommandResponse invalid response`);
            }
        }
    }

    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} name - the name of the command or MQTT event
     * @param {import('./typedefs').MessageEnvelope} envelope - the message envelope
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     * @param {string|null} [commandId] - request id of the originating command (response path only)
     */
    handleMessage(name, envelope, type = MESSAGE_TYPE.INCOMING, commandId = null) {
        let payload;
        if (type === MESSAGE_TYPE.INCOMING) {
            payload = this._extractIncomingPayload(name, envelope);
        } else if (type === MESSAGE_TYPE.RESPONSE) {
            payload = this._extractResponsePayload(name, envelope);
            const body = envelope?.body;
            if (!body || body.code !== 0) {
                tools.envLogWarn(`got payload with empty body for command '${name}'`);
                return;
            }
        }
        if (payload === undefined) {
            tools.envLogWarn(`got empty payload for command '${name}'`);
            return;
        }

        this._dispatchPayload(name, payload, commandId);
    }

    /**
     * Extracts and returns the payload from an incoming MQTT message envelope.
     * Logs a warning if the message structure is unhandled.
     * @param {string} name - Event name.
     * @param {import('./typedefs').MessageEnvelope} envelope - The message envelope.
     * @returns {*} The extracted payload, or undefined if invalid.
     */
    _extractIncomingPayload(name, envelope) {
        const body = envelope?.body;
        if (!body) {
            tools.envLogWarn(`Unhandled MQTT message payload for event '${name}'`);
            return undefined;
        }
        return Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
    }

    /**
     * Extracts and returns the payload from a REST/HTTP response envelope.
     * Validates the result code and handles firmware versioning.
     * @param {string} name - Command name.
     * @param {import('./typedefs').MessageEnvelope} envelope - The response envelope.
     * @returns {*} The extracted payload, or undefined if invalid or error code is non-zero.
     */
    _extractResponsePayload(name, envelope) {
        const body = envelope?.body;
        if (!body) {
            return undefined;
        }

        if (envelope.header) {
            this._handleFirmwareVersion(envelope.header);
        }

        const resultCode = body.code;
        if (resultCode !== 0) {
            const resultCodeMessage = body.msg;
            tools.envLogError(`got unexpected resultCode for command '${name}': ${resultCode}`);
            tools.envLogError(`resultCodeMessage for command '${name}': '${resultCodeMessage}'`);
            return undefined;
        }

        return body.data;
    }

    /**
     * Parses a raw incoming MQTT message into eventName + payload.
     * Topic format: "iot/atr/<eventName>/<did>/<class>/<resource>/j"
     * @param {string} name
     * @param {string} rawMessage - JSON string
     * @returns {Object|null} parsed JSON object, null if malformed
     */
    _parseMqttMessage(name, rawMessage) {
        try {
            return JSON.parse(rawMessage);
        } catch (e) {
            tools.envLogError(`Failed to parse MQTT message on event '${name}': ${e.message}`);
            return null;
        }
    }

    /**
     * Emits HeaderInfo if the firmware version changed.
     * @param {{ fwVer: string, hwVer: string }} header
     */
    _handleFirmwareVersion(header) {
        if (this.bot.firmwareVersion !== header['fwVer']) {
            this.bot.firmwareVersion = header['fwVer'];
            this.emitMessage('HeaderInfo', {
                'fwVer': header['fwVer'],
                'hwVer': header['hwVer']
            });
        }
    }

    /** @returns {void} — intentionally fire-and-forget */
    _dispatchPayload(eventName, payload, commandId = null) {
        (async () => {
            // Expose the originating command id (if any) to emitMessage() for the
            // duration of this dispatch, so a command response resolves its own
            // pending Promise by id rather than the oldest event-name match.
            const previous = this._responseCommandId;
            this._responseCommandId = commandId;
            try {
                await this.dispatcher.handleMessagePayload(eventName, payload);
            } catch (e) {
                this.emitError('-2', e.message);
            } finally {
                this._responseCommandId = previous;
            }
        })();
    }

}

module.exports = EcovacsDeviceSession;
