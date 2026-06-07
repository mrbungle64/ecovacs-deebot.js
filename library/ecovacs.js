'use strict';

const EventEmitter = require('events');
const tools = require('./tools');
const constants = require('./constants');
const { errorCodes } = require('./errorCodes.json');
const axios = require("axios").default;
const commandObj = require('./command');
const PendingCommandRegistry = require('./managers/pendingCommandRegistry');
const COMMAND_REGISTRY = require('./commandRegistry');

const MESSAGE_TYPE = Object.freeze({
    INCOMING: 'incoming',
    RESPONSE: 'response',
});

/**
 * Dispatch table for incoming MQTT/response messages.
 * Maps a normalised command name (the `abbreviatedCommand` computed in
 * `handleMessagePayload()`) to the name of the `Ecovacs` method that handles it.
 * Several command names may map to the same handler (e.g. 'AirQuality' and
 * 'JCYAirQuality', or all the FwBuryPoint task events).
 *
 * Commands with no entry here fall through to the registry-driven
 * `_handleUnknownMessage()` path. Commands that are intentionally accepted
 * without any reaction map to `_msgNoop` (so they don't trigger the
 * "unknown command" warning). Each handler is independently testable via
 * `ecovacs._msgX(payload[, ctx])`.
 */
const MESSAGE_HANDLERS = Object.freeze({
    AICleanItemState: '_msgAICleanItemState',
    AutoEmpty: '_msgAutoEmpty',
    Battery: '_msgBattery',
    Block: '_msgBlock',
    BreakPoint: '_msgBreakPoint',
    CleanLogs: '_msgCleanLogs',
    CarpertPressure: '_msgCarpetPressure', // The typo in 'Carpert' is intended
    CleanInfo: '_msgCleanInfo',
    ChargeState: '_msgChargeState',
    clearMap: '_msgClearMap',
    CustomAreaMode: '_msgCustomAreaMode',
    DModule: '_msgDModule',
    Evt: '_msgEvt',
    Error: '_msgError',
    LifeSpan: '_msgLifeSpan',
    NetInfo: '_msgNetInfo',
    Ota: '_msgOta',
    Pos: '_msgPos',
    QuickCommand: '_msgQuickCommand',
    Recognization: '_msgRecognization',
    RelocationState: '_msgRelocationState',
    Sched: '_msgSched',
    Sleep: '_msgSleep',
    Speed: '_msgSpeed',
    stationAction: '_msgStationAction',
    StationInfo: '_msgStationInfo',
    StationState: '_msgStationState',
    Stats: '_msgStats',
    SweepMode: '_msgSweepMode',
    TimeZone: '_msgTimeZone',
    TotalStats: '_msgTotalStats',
    TrueDetect: '_msgTrueDetect',
    WaterInfo: '_msgWaterInfo',
    WifiList: '_msgWifiList',
    WorkState: '_msgWorkState',

    // Map info
    CachedMapInfo: '_msgCachedMapInfo',
    MapInfo: '_msgMapInfo',
    MapInfo_V2: '_msgMapInfoV2',
    MapSet: '_msgMapSet',
    MapState: '_msgMapState',
    MultiMapState: '_msgMultiMapState',
    MapSet_V2: '_msgMapSetV2',
    MapSubSet: '_msgMapSubSet',

    // yeedi models only
    AirDring: '_msgAirDrying', // The typo in 'AirDring' is intended
    MapInfo_V2_Yeedi: '_msgMapInfoV2Yeedi',

    // AIRBOT Z1 / Z1 Air Quality Monitor
    AirQuality: '_msgAirQuality',
    JCYAirQuality: '_msgAirQuality',
    AiBlockPlate: '_msgAiBlockPlate',
    AirbotAutoModel: '_msgAirbotAutoModel',
    AngleWakeup: '_msgAngleWakeup',
    Efficiency: '_msgEfficiency',
    HumanoidFollow: '_msgHumanoidFollow',
    AirSpeed: '_msgAirPurifierLog',
    Humidity: '_msgAirPurifierLog',
    Temperature: '_msgAirPurifierLog',
    setVoice: '_msgSetVoice',
    Voice: '_msgVoice',

    // Partially implemented map messages (TODO)
    MajorMap: '_msgMajorMap',
    MapTrace: '_msgMapTrace',
    MinorMap: '_msgMinorMap',

    // Intentionally unhandled (accepted without warning)
    AIMap: '_msgNoop',
    AIMapAndMapSet: '_msgNoop',

    // FwBuryPoint messages
    'FwBuryPoint-bd_sysinfo': '_msgFwbpSysinfo',
    'FwBuryPoint-bd_air-quality': '_msgFwbpAirQuality',
    'FwBuryPoint-bd_task-return-normal-start': '_msgFwbpTask',
    'FwBuryPoint-bd_task-return-normal-stop': '_msgFwbpTask',
    'FwBuryPoint-bd_task-clean-move-start': '_msgFwbpTask',
    'FwBuryPoint-bd_task-clean-move-stop': '_msgFwbpTask',
    'FwBuryPoint-bd_task-clean-current-spot-start': '_msgFwbpTask',
    'FwBuryPoint-bd_task-clean-current-spot-stop': '_msgFwbpTask',
    'FwBuryPoint-bd_task-clean-specified-spot-start': '_msgFwbpTask',
    'FwBuryPoint-bd_task-clean-specified-spot-stop': '_msgFwbpTask',
    'FwBuryPoint-bd_dtofstart': '_msgNoop', // DToF-Laser-Sensor
    'FwBuryPoint-bd_errorcode': '_msgNoop',
    'FwBuryPoint-bd_relocation': '_msgNoop',
    'FwBuryPoint-bd_setting': '_msgNoop',
    'FwBuryPoint-bd_setting-evt': '_msgNoop', // Event -> Config stored...
    'FwBuryPoint-bd_gyrostart': '_msgNoop',
    'FwBuryPoint-bd_returnchargeinfo': '_msgNoop',
    'FwBuryPoint-bd_basicinfo-evt': '_msgNoop',
    'FwBuryPoint-bd_cri04': '_msgNoop',
});

class Ecovacs extends EventEmitter {
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
        let url = `mqtts://${this.serverAddress}:${this.serverPort}`;
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

        let ecovacsMQTT = this;

        this.client.on('connect', function () {
            tools.envLogSuccess(`MQTT client connected`);
            ecovacsMQTT.subscribe();
        });

        this.client.on('message', (topic, message) => {
            const topicParts = topic.split('/');
            if (topicParts[3] !== this.vacuum['did']) return;
            const eventName = topicParts[2];
            tools.envLogMqtt(topic);
            tools.envLogMqtt(eventName);
            const parsedEnvelope = this._parseMqttMessage(eventName, message.toString());
            if (parsedEnvelope) {
                this.handleMessage(eventName, parsedEnvelope, MESSAGE_TYPE.INCOMING);
            }
        });

        this.client.on('offline', function () {
            try {
                ecovacsMQTT.emitNetworkError('MQTT server is offline or not reachable');
            } catch {
                tools.envLogError(`MQTT server is offline or not reachable`);
            }
        });

        this.client.on('disconnect', function () {
            try {
                ecovacsMQTT.emitNetworkError('MQTT client received disconnect event');
            } catch {
                tools.envLogWarn(`MQTT client received disconnect event`);
            }
        });

        this.client.on('error', (error) => {
            try {
                ecovacsMQTT.emitNetworkError(`MQTT client error: ${error.message}`);
            } catch {
                tools.envLogError(`MQTT client error: '${error.message}'`);
            }
        });
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

        this._sharedClient = true;
        this.client = existingClient;

        this.client.on('message', (topic, message) => {
            const topicParts = topic.split('/');
            if (topicParts[3] !== this.vacuum['did']) return;
            const eventName = topicParts[2];
            tools.envLogMqtt(topic);
            tools.envLogMqtt(eventName);
            const parsedEnvelope = this._parseMqttMessage(eventName, message.toString());
            if (parsedEnvelope) {
                this.handleMessage(eventName, parsedEnvelope, MESSAGE_TYPE.INCOMING);
            }
        });

        this.client.on('connect', () => {
            tools.envLogSuccess(`shared MQTT client reconnected, re-subscribing for did '${this.vacuum['did']}'`);
            this.subscribe();
        });

        this.client.on('offline', () => {
            try {
                this.emitNetworkError('MQTT server is offline or not reachable');
            } catch {
                tools.envLogError(`MQTT server is offline or not reachable`);
            }
        });

        this.client.on('error', (error) => {
            try {
                this.emitNetworkError(`MQTT client error: ${error.message}`);
            } catch {
                tools.envLogError(`MQTT client error: '${error.message}'`);
            }
        });

        if (this.client.connected) {
            this.subscribe();
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
            tools.envLogInfo(`[EcovacsMQTT] failure code ${responseData['errno']} (${responseData['error']}) sending command '${command.name}'`);
            rejectCommand(new Error(`Failure code ${responseData['errno']} (${responseData['error']})`));
        }

        return commandPromise;
    }

    /**
     * Handle life span components to emit combined object
     */
    handleLifeSpanCombined() {
        const emitComponent = {};
        for (let component in this.dictionary.COMPONENT_TO_ECOVACS) {
            if (this.dictionary.COMPONENT_TO_ECOVACS.hasOwnProperty(component)) {
                if (this.bot.components[component]) {
                    emitComponent[component] = this.bot.components[component] && (this.bot.components[component] !== this.bot.lastComponentValues[component]);
                }
            }
        }
        if (emitComponent['filter'] &&
            emitComponent['side_brush'] &&
            (!this.bot.hasMainBrush() || emitComponent['main_brush']) &&
            (!this.bot.hasRoundMopInfo() || emitComponent['round_mop']) &&
            (!this.bot.hasAirFreshenerInfo() || emitComponent['air_freshener']) &&
            (!this.bot.hasUnitCareInfo() || emitComponent['unit_care'])) {
            this.emit('LifeSpan', {
                'filter': this.bot.components['filter'],
                'side_brush': this.bot.components['side_brush'],
                'main_brush': this.bot.components['main_brush'],
                'unit_care': this.bot.components['unit_care']
            });
        }
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
        // Resolve any pending Promise that is waiting for this event
        if (this.pendingCommands.size > 0) {
            this.pendingCommands.resolveByEvent(name, rawPayload === undefined ? payload : rawPayload);
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
            this.disconnect();
        }
    }

    /**
     * If the vacuum has power adjustment and also has a mopping system
     * then emit a `MoppingSystemInfo` event with the `cleanStatus` and `cleanInfo` properties
     */
    emitMoppingSystemReport() {
        const vacuumPowerAdjustmentOk = !this.bot.hasVacuumPowerAdjustment() || (this.bot.cleanSpeed !== null);
        const moppingSystemOk = !this.bot.hasMoppingSystem() || (this.bot.waterLevel !== null);
        if (vacuumPowerAdjustmentOk && moppingSystemOk) {
            let r = {
                'cleanStatus': this.bot.cleanReport
            };
            if (this.bot.hasVacuumPowerAdjustment() && (this.bot.cleanSpeed !== null)) {
                r['cleanInfo'] = {
                    'level': this.bot.cleanSpeed
                };
            }
            if (this.bot.hasMoppingSystem() && (this.bot.waterLevel !== null)) {
                r['waterInfo'] = {
                    'enabled': Boolean(Number(this.bot.waterboxInfo || 0)),
                    'level': this.bot.waterLevel
                };
                if (this.bot.sleepStatus === 0) {
                    if (this.bot.moppingType !== null) {
                        Object.assign(r['waterInfo'], { 'moppingType': this.bot.moppingType });
                    }
                    if (this.bot.scrubbingType !== null) {
                        Object.assign(r['waterInfo'], { 'scrubbingType': this.bot.scrubbingType });
                    }
                }
            }
            this.emit('MoppingSystemInfo', r);
        }
    }

    /**
     * Disconnect the MQTT client
     */
    async disconnect() {
        this.pendingCommands.rejectAll(new Error('Connection closed'));
        if (!this.client || !this.client.connected) {
            return Promise.resolve(false);
        }
        return new Promise((resolve, reject) => {
            this.client.unsubscribe(this.channel, error => {
                if (error) {
                    tools.envLogError(`error unsubscribing from the atr channel: ${error.toString()}`);
                    reject(false);
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
     * @param {Object} messagePayload - The message payload that was received
     */
    handleCommandResponse(command, messagePayload) {
        if (messagePayload) {
            if (messagePayload.hasOwnProperty('resp')) {
                this.handleMessage(command.name, messagePayload['resp'], MESSAGE_TYPE.RESPONSE);
            } else if (command.api === constants.CLEANLOGS_PATH) {
                // CleanLogs uses a different API path and response format
                tools.envLogInfo(`got CleanLogs response`);
                if (messagePayload['ret'] === 'ok') {
                    this._dispatchPayload(command.name, messagePayload);
                }
            } else {
                tools.envLogWarn(`handleCommandResponse invalid response`);
            }
        }
    }

    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} name - the name of the command or MQTT event
     * @param {Object|string} message - the message
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     */
    handleMessage(name, envelope, type = MESSAGE_TYPE.INCOMING) {
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

        this._dispatchPayload(name, payload);
    }

    /**
     * Extracts and returns the payload from an incoming MQTT message envelope.
     * Logs a warning if the message structure is unhandled.
     * @param {string} name - Event name.
     * @param {Object} envelope - The message envelope.
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
     * @param {Object} envelope - The response envelope.
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
    _dispatchPayload(eventName, payload) {
        (async () => {
            try {
                await this.handleMessagePayload(eventName, payload);
            } catch (e) {
                this.emitError('-2', e.message);
            }
        })();
    }

    /**
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
     * @returns {Promise<void>}
     */
    async handleMessagePayload(command, payload) {
        tools.logEvent(command, payload);
        let abbreviatedCommand = command.replace(/^_+|_+$/g, '');
        const commandPrefix = this.getCommandPrefix(abbreviatedCommand);
        abbreviatedCommand = abbreviatedCommand.substring(commandPrefix.length);
        if (this.bot.genericCommand) {
            const genericCommandPrefix = this.getCommandPrefix(this.bot.genericCommand);
            const abbreviatedGenericCommand = this.bot.genericCommand.substring(genericCommandPrefix.length);
            if (abbreviatedGenericCommand.toLowerCase() === abbreviatedCommand.toLowerCase()) {
                this.emit('genericCommandPayload', payload);
                this.bot.genericCommand = null;
            }
        }
        // e.g. T8, T9, T10, T20, N8, X1, X2 series and Airbot Z1
        if (abbreviatedCommand.endsWith("_V2")) {
            abbreviatedCommand = this.handleV2commands(abbreviatedCommand);
        }
        this.emit('messageReceived', command + ' => ' + abbreviatedCommand);
        if (abbreviatedCommand.startsWith('FwBuryPoint')) {
            // Main function to handle FwBuryPoint messages
            const status = await this.handleFwBuryPoint(payload);
            if (status) {
                return;
            }
        }
        const handlerName = MESSAGE_HANDLERS[abbreviatedCommand];
        if (handlerName) {
            await this[handlerName](payload, { abbreviatedCommand, commandPrefix, command });
            return;
        }
        this._handleUnknownMessage(abbreviatedCommand, payload, command);
    }

    /**
     * "Strategic Particle Removal" and "Strategic Pet Poop Avoidance" mode (e.g. X1)
     * @param {Object} payload
     */
    _msgAICleanItemState(payload) {
        this.bot.handleAICleanItemState(payload);
        if (this.bot.aiCleanItemState.items.length) {
            this.emitMessage('AICleanItemState', this.bot.aiCleanItemState, payload);
        }
    }

    /**
     * "Auto empty" status (Auto-Empty Station)
     * @param {Object} payload
     */
    _msgAutoEmpty(payload) {
        this.bot.handleAutoEmpty(payload);
        this.emitMessage("AutoEmpty", this.bot.autoEmpty, payload);
        const autoEmptyStatus = {
            'autoEmptyEnabled': (this.bot.autoEmpty === 1),
            'stationStatus': this.bot.autoEmptyStatus,
            'stationActive': (this.bot.autoEmptyStatus === 1),
            'dustBagFull': (this.bot.autoEmptyStatus === 5)
        };
        this.emitMessage("AutoEmptyStatus", autoEmptyStatus);
    }

    /**
     * Battery status
     * @param {Object} payload
     */
    _msgBattery(payload) {
        this.bot.handleBattery(payload);
        if (this.bot.batteryLevel) {
            this.emitMessage("BatteryInfo", this.bot.batteryLevel, payload);
            this.emitMessage("BatteryIsLow", this.bot.batteryIsLow);
        }
    }

    /**
     * "Do Not Disturb" mode
     * @param {Object} payload
     */
    _msgBlock(payload) {
        this.bot.handleBlock(payload);
        this.emitMessage("DoNotDisturbEnabled", this.bot.block, payload);
        const doNotDisturbEnabled = Boolean(this.bot.block);
        if (doNotDisturbEnabled) {
            this.emitMessage("DoNotDisturbBlockTime", this.bot.blockTime);
        }
    }

    /**
     * "Continuous Cleaning Mode" / "Resumed Clean"
     * @param {Object} payload
     */
    _msgBreakPoint(payload) {
        this.bot.handleBreakPoint(payload);
        this.emitMessage("ContinuousCleaningEnabled", this.bot.breakPoint, payload);
    }

    /**
     * "Cleaning Log"
     * @param {Object} payload
     */
    _msgCleanLogs(payload) {
        this.bot.handleCleanLogs(payload);
        this.bot.emitCleanLogEvents();
    }

    /**
     * "Auto-Boost Suction"
     * @param {Object} payload
     */
    _msgCarpetPressure(payload) {
        this.bot.handleCarpetPressure(payload);
        this.emitMessage("CarpetPressure", this.bot.carpetPressure, payload);
    }

    /**
     * Various information about the cleaning status
     * @param {Object} payload
     */
    _msgCleanInfo(payload) {
        this.bot.handleCleanInfo(payload);
        this.emitMessage("CleanReport", this.bot.cleanReport, payload);
        this.emitMoppingSystemReport();
        if (this.bot.chargeStatus) {
            this.emitMessage("ChargeState", this.bot.chargeStatus);
        }
        if (this.bot.currentCustomAreaValues) {
            this.emitMessage("LastUsedAreaValues", this.bot.currentCustomAreaValues);
        }
        this.emitMessage("CurrentCustomAreaValues", this.bot.currentCustomAreaValues);
        this.emitMessage("CurrentSpotAreas", this.bot.currentSpotAreas);
    }

    /**
     * Various information about the charging status
     * @param {Object} payload
     */
    _msgChargeState(payload) {
        this.bot.handleChargeState(payload);
        if (this.bot.chargeStatus) {
            this.emitMessage("ChargeState", this.bot.chargeStatus, payload);
        }
        if (this.bot.chargeMode) {
            this.emitMessage("ChargeMode", this.bot.chargeMode);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgClearMap(payload) {
        this.bot.handleClearMap(payload);
    }

    /**
     * "Mopping Mode" / "Cleaning efficiency"
     * @param {Object} payload
     */
    _msgCustomAreaMode(payload) {
        this.bot.handleCustomAreaMode(payload);
        this.emitMessage('SweepMode', this.bot.sweepMode, payload);
    }

    /**
     * Air Freshener module (T9 AIVI)
     * @param {Object} payload
     */
    _msgDModule(payload) {
        this.bot.handleDModule(payload);
        if (this.bot.dmodule.enabled) {
            this.emitMessage("DModuleEnabled", this.bot.dmodule.enabled, payload);
            this.emitMessage("DModuleStatus", this.bot.dmodule.status);
        }
    }

    /**
     * Rare event, little is known about it yet
     * @param {Object} payload
     */
    _msgEvt(payload) {
        this.bot.handleEvt(payload);
        if (this.bot.evt.event) {
            this.emitMessage("Evt", this.bot.evt, payload);
        }
    }

    /**
     * Error codes
     * @param {Object} payload
     */
    _msgError(payload) {
        this.bot.handleResponseError(payload);
        this.emitMessage("Error", this.bot.errorDescription, payload);
        this.emitMessage('ErrorCode', this.bot.errorCode);
        this.emitMessage('LastError', {
            'error': this.bot.errorDescription,
            'code': this.bot.errorCode
        });
    }

    /**
     * Consumable components
     * @param {Object} payload
     */
    _msgLifeSpan(payload) {
        this.bot.handleLifespan(payload);
        if (this.bot.isPlatformTypeAirbot()) {
            this.emitMessage("LifeSpan", this.bot.components, payload);
        } else {
            if (!this.bot.emitFullLifeSpanEvent) {
                for (let component in this.dictionary.COMPONENT_TO_ECOVACS) {
                    if (this.dictionary.COMPONENT_TO_ECOVACS.hasOwnProperty(component)) {
                        if (this.bot.components[component]) {
                            if (this.bot.components[component] !== this.bot.lastComponentValues[component]) {
                                this.emitMessage("LifeSpan_" + component, this.bot.components[component]);
                                this.bot.lastComponentValues[component] = this.bot.components[component];
                            }
                        }
                    }
                }
            } else {
                this.handleLifeSpanCombined();
            }
            // Resolve GetLifeSpan Promise
            if (this.pendingCommands.size > 0) {
                this.pendingCommands.resolveByEvent("LifeSpan", payload);
            }
        }
    }

    /**
     * Various network/wifi information
     * @param {Object} payload
     */
    _msgNetInfo(payload) {
        this.bot.handleNetInfo(payload);
        this.emitMessage("NetworkInfo", {
            'ip': this.bot.netInfoIP,
            'mac': this.bot.netInfoMAC,
            'wifiSSID': this.bot.netInfoWifiSSID,
            'wifiSignal': this.bot.netInfoWifiSignal,
        }, payload);
    }

    /**
     * Over-the-air firmware update status
     * @param {Object} payload
     */
    _msgOta(payload) {
        this.bot.handleOverTheAirUpdate(payload);
        this.emitMessage('Ota', payload, payload);
    }

    /**
     * Various information about the position of the bot and the charging station
     * @param {Object} payload
     */
    _msgPos(payload) {
        this.bot.handlePos(payload);
        if (this.bot.deebotPosition["changeFlag"]) {
            if ((this.bot.deebotPosition["isInvalid"] === true) && ((this.bot.relocationState === 'ok') || (this.bot.relocationState === null))) {
                this.bot.relocationState = 'required';
                this.emitMessage("RelocationState", this.bot.relocationState);
            } else if (this.bot.deebotPosition["x"] && this.bot.deebotPosition["y"]) {
                this.emitMessage("DeebotPositionCurrentSpotAreaID", this.bot.deebotPosition["currentSpotAreaID"]);
                this.emitMessage("DeebotPositionCurrentSpotAreaName", this.bot.deebotPosition["currentSpotAreaName"]);
                this.emitMessage('Position', {
                    'coords': this.bot.deebotPosition['x'] + "," + this.bot.deebotPosition['y'] + "," + this.bot.deebotPosition['a'],
                    'x': this.bot.deebotPosition['x'],
                    'y': this.bot.deebotPosition['y'],
                    'a': this.bot.deebotPosition['a'],
                    'invalid': this.bot.deebotPosition["isInvalid"],
                    'spotAreaID': this.bot.deebotPosition["currentSpotAreaID"],
                    'spotAreaName': this.bot.deebotPosition["currentSpotAreaName"],
                    'distanceToChargingStation': this.bot.deebotPosition["distanceToChargingStation"]
                }, payload);
            }
            this.bot.deebotPosition["changeFlag"] = false;
        }
        if (this.bot.chargePosition["changeFlag"]) {
            this.emitMessage("ChargePosition", this.bot.chargePosition["x"] + "," + this.bot.chargePosition["y"] + "," + this.bot.chargePosition["a"]);
            this.emitMessage('ChargingPosition', {
                'coords': this.bot.chargePosition['x'] + "," + this.bot.chargePosition['y'] + "," + this.bot.chargePosition['a'],
                'x': this.bot.chargePosition['x'],
                'y': this.bot.chargePosition['y'],
                'a': this.bot.chargePosition['a']
            });
            this.bot.chargePosition["changeFlag"] = false;
        }
    }

    /**
     * "Customized Scenario Cleaning" scenarios
     * @param {Object} payload
     */
    _msgQuickCommand(payload) {
        this.bot.handleQuickCommand(payload);
        this.emitMessage("CustomizedScenarioCleaning", this.bot.customizedScenarioCleaning, payload);
    }

    /**
     * True Detect / "AIVI 3D" (e.g. "AIVI Smart Recognition")
     * @param {Object} payload
     */
    _msgRecognization(payload) {
        this.bot.handleRecognization(payload);
        this.emitMessage('TrueDetect', this.bot.trueDetect, payload);
    }

    /**
     * Relocation status
     * @param {Object} payload
     */
    _msgRelocationState(payload) {
        this.bot.handleRelocationState(payload);
        this.emitMessage("RelocationStatus", this.bot.relocationStatus);
        this.emitMessage("RelocationState", this.bot.relocationState, payload);
    }

    /**
     * "Scheduling"
     * @param {Object} payload
     */
    _msgSched(payload) {
        this.bot.handleSched(payload);
        if (this.bot.schedule) {
            this.emitMessage('Schedule', this.bot.schedule, payload);
        }
    }

    /**
     * Sleep mode/status
     * @param {Object} payload
     */
    _msgSleep(payload) {
        this.bot.handleSleepStatus(payload);
        this.emitMessage("SleepStatus", this.bot.sleepStatus, payload);
    }

    /**
     * "Vacuum Power" / "Suction Power"
     * @param {Object} payload
     */
    _msgSpeed(payload) {
        this.bot.handleSpeed(payload);
        this.emitMessage("CleanSpeed", this.bot.cleanSpeed, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgStationAction(payload) {
        this.bot.handleStationAction(payload);
    }

    /**
     * Various information about the cleaning station (e.g. X1 series)
     * @param {Object} payload
     */
    _msgStationInfo(payload) {
        this.bot.handleStationInfo(payload);
        this.emitMessage('StationInfo', this.bot.stationInfo, payload);
    }

    /**
     * Various states of the cleaning station (e.g. X1 series)
     * @param {Object} payload
     */
    _msgStationState(payload) {
        this.bot.handleStationState(payload);
        if (this.bot.stationState.type !== null) {
            this.emitMessage("StationState", this.bot.stationState, payload);
            const airDryingState = this.bot.stationState.isAirDrying ? 'airdrying' : 'idle';
            this.emitMessage('AirDryingState', airDryingState);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgStats(payload) {
        this.bot.handleStats(payload);
        if (this.bot.currentStats) {
            this.emitMessage("CurrentStats", this.bot.currentStats, payload);
            this.bot.currentStats = null;
        }
    }

    /**
     * "Mop-Only" mode
     * @param {Object} payload
     */
    _msgSweepMode(payload) {
        this.bot.handleSweepMode(payload);
        this.emitMessage('MopOnlyMode', this.bot.mopOnlyMode, payload);
    }

    /**
     * The configured time zone
     * @param {Object} payload
     */
    _msgTimeZone(payload) {
        this.bot.handleTimeZone(payload);
        this.emitMessage('TimeZone', payload, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgTotalStats(payload) {
        this.bot.handleTotalStats(payload);
        this.emitMessage('CleanSum', {
            'totalSquareMeters': this.bot.cleanSum_totalSquareMeters,
            'totalSeconds': this.bot.cleanSum_totalSeconds,
            'totalNumber': this.bot.cleanSum_totalNumber
        }, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgTrueDetect(payload) {
        this.bot.handleTrueDetect(payload);
        this.emitMessage("TrueDetect", this.bot.trueDetect, payload);
    }

    /**
     * "Water Flow Level"
     * @param {Object} payload
     */
    _msgWaterInfo(payload) {
        this.bot.handleWaterInfo(payload);
        this.emitMessage("WaterInfo", payload, payload);
        this.emitMessage("WaterLevel", this.bot.waterLevel);
        this.emitMessage("WaterBoxInfo", this.bot.waterboxInfo);
        if (this.bot.moppingType !== null) {
            this.emitMessage("WaterBoxMoppingType", this.bot.moppingType);
        }
        if (this.bot.scrubbingType !== null) {
            this.emitMessage("WaterBoxScrubbingType", this.bot.scrubbingType);
        }
        this.emitMoppingSystemReport();
    }

    /**
     * Configured WiFi networks
     * @param {Object} payload
     */
    _msgWifiList(payload) {
        this.bot.handleWiFiList(payload);
        this.emitMessage('WifiList', payload, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgWorkState(payload) {
        this.bot.handleWorkState(payload);
        this.emitMessage('WorkState', this.bot.workState, payload);
    }

    // ========
    // Map info
    // ========

    /**
     * @param {Object} payload
     */
    _msgCachedMapInfo(payload) {
        if (!this.bot.hasMappingCapabilities()) {
            tools.envLogWarn(`Skipping 'CachedMapInfo' push: device lacks mapping capabilities`);
            return;
        }
        try {
            this.bot.handleCachedMapInfo(payload);
            this.emitMessage("CurrentMapMID", this.bot.currentMapMID, payload);
            this.emitMessage("CurrentMapName", this.bot.currentMapName);
            this.emitMessage("CurrentMapIndex", this.bot.currentMapIndex);
            this.emitMessage("Maps", this.bot.maps);
        } catch (e) {
            tools.envLogError(`error on handling CachedMapInfo: ${e.message}`);
        }
    }

    /**
     * @param {Object} payload
     * @param {Object} ctx
     */
    async _msgMapInfo(payload, ctx) {
        if (ctx.commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
            tools.envLogWarn(`getMapInfo responded: ${JSON.stringify(payload)}`);
        } else if (tools.isCanvasModuleAvailable()) {
            let mapImage = await this.bot.handleMapImage(payload);
            if (mapImage !== null) {
                this.emitMessage("MapImageData", mapImage, payload);
                if (this.bot.createMapImageOnly) {
                    this.emitMessage("MapImage", mapImage);
                }
            }
        }
    }

    /**
     * @param {Object} payload
     */
    _msgMapInfoV2(payload) {
        try {
            this.bot.handleMapInfoV2(payload);
        } catch (e) {
            tools.envLogError(`error on handling MapInfo_V2: ${e.message}`);
        }
    }

    /**
     * Handle spotAreas, virtualWalls, noMopZones
     * @param {Object} payload
     */
    _msgMapSet(payload) {
        if (!this.bot.hasMappingCapabilities()) {
            tools.envLogWarn(`Skipping 'MapSet' push: device lacks mapping capabilities`);
            return;
        }
        let mapset = this.bot.handleMapSet(payload);
        if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
            this.emitMessage(mapset["mapsetEvent"], mapset["mapsetData"], payload);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgMapState(payload) {
        this.bot.handleMapState(payload);
        this.emitMessage("MapState", this.bot.mapState, payload);
    }

    /**
     * Status of the Multi Map functionality
     * @param {Object} payload
     */
    _msgMultiMapState(payload) {
        if (!this.bot.hasMappingCapabilities()) {
            tools.envLogWarn(`Skipping 'MultiMapState' push: device lacks mapping capabilities`);
            return;
        }
        this.bot.handleMultiMapState(payload);
        this.emitMessage("MultiMapState", this.bot.multiMapState, payload);
    }

    /**
     * @param {Object} payload
     */
    async _msgMapSetV2(payload) {
        await this.bot.handleMapSet_V2(payload);
        this.emitMessage("MapSet_V2", this.bot.mapSet_V2, payload);
    }

    /**
     * Handle spotAreas, virtualWalls, noMopZones
     * @param {Object} payload
     */
    async _msgMapSubSet(payload) {
        if (!this.bot.hasMappingCapabilities()) {
            tools.envLogWarn(`Skipping 'MapSubSet' push: device lacks mapping capabilities`);
            return;
        }
        let mapsubset = await this.bot.handleMapSubset(payload);
        if (mapsubset["mapsubsetEvent"] !== 'error') {
            // MapSpotAreaInfo, MapVirtualBoundaryInfo
            this.emitMessage(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"], payload);
        }
    }

    // =================
    // yeedi models only
    // =================

    /**
     * Air drying status (yeedi only; see StationState for Deebot models)
     * @param {Object} payload
     */
    _msgAirDrying(payload) {
        this.bot.handleAirDryingState(payload);
        if (this.bot.airDryingStatus) {
            this.emitMessage('AirDryingState', this.bot.airDryingStatus, payload);
        }
    }

    /**
     * MapInfo_V2 for yeedi models differs from the Ecovacs variant
     * @param {Object} payload
     */
    _msgMapInfoV2Yeedi(payload) {
        try {
            this.bot.handleMapInfoV2_Yeedi(payload);
            this.emitMessage("CurrentMapMID", this.bot.currentMapMID, payload);
            this.emitMessage("CurrentMapName", this.bot.currentMapName);
            this.emitMessage("CurrentMapIndex", this.bot.currentMapIndex);
            this.emitMessage("Maps", this.bot.maps);
        } catch (e) {
            tools.envLogError(`error on handling MapInfo_V2 (yeedi): ${e.message}`);
        }
    }

    // ==================================
    // AIRBOT Z1 / Z1 Air Quality Monitor
    // ==================================

    /**
     * @param {Object} payload
     */
    _msgAirQuality(payload) {
        this.bot.handleAirQuality(payload);
        if (this.bot.airQuality) {
            this.emitMessage('AirQuality', this.bot.airQuality, payload);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgAiBlockPlate(payload) {
        this.bot.handleAiBlockPlate(payload);
        this.emitMessage('AiBlockPlate', this.bot.aiBlockPlate, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgAirbotAutoModel(payload) {
        this.bot.handleAirbotAutoModel(payload);
        if (this.bot.airbotAutoModel) {
            this.emitMessage('AirbotAutoModel', this.bot.airbotAutoModel, payload);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgAngleWakeup(payload) {
        this.bot.handleAngleWakeup(payload);
        this.emitMessage('AngleWakeup', this.bot.angleWakeup, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgEfficiency(payload) {
        this.bot.handleEfficiency(payload);
        if (this.bot.efficiency) {
            this.emitMessage('Efficiency', this.bot.efficiency, payload);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgHumanoidFollow(payload) {
        this.bot.handleHumanoidFollow(payload);
        if (this.bot.humanoidFollow?.yiko || this.bot.humanoidFollow?.video) {
            if (this.bot.humanoidFollow.yiko) {
                this.emitMessage('HumanoidFollowYiko', this.bot.humanoidFollow.yiko, payload);
            }
            if (this.bot.humanoidFollow.video) {
                this.emitMessage('HumanoidFollowVideo', this.bot.humanoidFollow.video, payload);
            }
        }
    }

    /**
     * Air purifier sensor readings (AirSpeed / Humidity / Temperature) — log only
     * @param {Object} payload
     * @param {Object} ctx
     */
    _msgAirPurifierLog(payload, ctx) {
        if (payload) {
            tools.envLogInfo(`[AirPurifier] Payload for ${ctx.abbreviatedCommand} message: ${JSON.stringify(payload)}`);
        }
    }

    /**
     * @param {Object} payload
     */
    _msgSetVoice(payload) {
        tools.envLogInfo(`[EcovacsMQTT_JSON] SETVOICE:`);
        tools.envLogInfo(payload);
        this.emitMessage('SetVoice', payload, payload);
    }

    /**
     * @param {Object} payload
     */
    _msgVoice(payload) {
        if (payload && payload.downloads) {
            payload.downloads.forEach((dlObject) => {
                if (dlObject.status === "dl") {
                    tools.envLogInfo(`[EcovacsMQTT_JSON] Download(` + dlObject.type + `): ` + dlObject.progress + `%`);
                    this.emitMessage('VoiceDownloadProgress', dlObject, payload);
                } else if (dlObject.status === "dld") {
                    tools.envLogInfo(`[EcovacsMQTT_JSON] Download(` + dlObject.type + `): Complete`);
                    this.emitMessage('VoiceDownloadComplete', dlObject, payload);
                } else {
                    tools.envLogInfo(`[EcovacsMQTT_JSON] unknown download state`);
                    tools.envLogInfo(dlObject);
                }
            });
        }
    }

    // =========================
    // Partially implemented map
    // =========================

    /**
     * @param {Object} payload
     */
    async _msgMajorMap(payload) {
        await this.bot.handleMajorMap(payload);
    }

    /**
     * @param {Object} payload
     */
    _msgMapTrace(payload) {
        if (!this.bot.hasMappingCapabilities()) {
            tools.envLogWarn(`Skipping 'MapTrace' push: device lacks mapping capabilities`);
            return;
        }
        this.bot.handleMapTrace(payload);
        // TODO: finish implementing MapTrace
    }

    /**
     * Handle a Minor Map piece: feed it to the live map image and emit the
     * rendered image once the full set of pieces has been received.
     * @param {Object} payload
     */
    async _msgMinorMap(payload) {
        if (!this.bot.hasMappingCapabilities()) {
            tools.envLogWarn(`Skipping 'MinorMap' push: device lacks mapping capabilities`);
            return;
        }
        if (!tools.isCanvasModuleAvailable()) {
            return;
        }
        const mapImage = await this.bot.handleMinorMap(payload);
        if (mapImage !== null) {
            this.emitMessage('MapImage', mapImage);
        }
    }

    // ====================
    // FwBuryPoint messages
    // ====================

    /**
     * @param {Object} payload
     */
    _msgFwbpSysinfo(payload) {
        this.bot.handleSysinfo(payload);
        if (this.bot.sysinfo) {
            this.emitMessage('Sysinfo', this.bot.sysinfo, payload);
        }
    }

    _msgFwbpAirQuality() {
        this.bot.run('GetAirQuality');
    }

    /**
     * @param {Object} payload
     * @param {Object} ctx
     */
    _msgFwbpTask(payload, ctx) {
        const fwBuryPointEvent = ctx.abbreviatedCommand.substring(20);
        this.bot.handleTask(fwBuryPointEvent, payload);
        if (this.currentTask) {
            this.emitMessage('TaskStarted', this.currentTask, payload);
        }
    }

    /**
     * Intentionally unhandled message — accepted without emitting a warning.
     */
    _msgNoop() {
        // no-op
    }

    /**
     * Fallback for messages with no entry in MESSAGE_HANDLERS.
     * Tries the registry-driven `Get<Command>` path (parse + emit the expected
     * event), then warns if the command is still unknown.
     * @param {string} abbreviatedCommand - the normalised command name
     * @param {Object} payload
     * @param {string} command - the original (un-abbreviated) command name
     */
    _handleUnknownMessage(abbreviatedCommand, payload, command) {
        const registryKey = COMMAND_REGISTRY.resolveKey('Get' + abbreviatedCommand);
        const entry = registryKey ? COMMAND_REGISTRY[registryKey] : null;
        if (entry && entry.expectedEvent && !entry.specialLogic) {
            const CommandClass = commandObj[entry.className];
            if (CommandClass) {
                const cmd = new CommandClass();
                const result = cmd.parseResponse(payload);

                const handlerName = 'handle' + abbreviatedCommand;
                if (typeof this.bot[handlerName] === 'function') {
                    this.bot[handlerName](payload);
                } else {
                    const propName = entry.expectedEvent[0].toLowerCase() + entry.expectedEvent.slice(1);
                    if (propName in this.bot) {
                        this.bot[propName] = result;
                    }
                }

                if (result !== undefined && result !== null) {
                    this.emitMessage(entry.expectedEvent, result, payload);
                }
                return;
            }
        }
        if (command === 'onFwBuryPoint') {
            tools.envLogWarn('onFwBuryPoint message was unhandled');
        } else {
            tools.envLogWarn(`got payload for unknown command '${command}': ${JSON.stringify(payload)}`);
        }
    }

    /**
     * Given a command, return the prefix of the command
     * @param {string} command - the command that was sent
     * @returns {string} the prefix of the command
     */
    getCommandPrefix(command) {
        let commandPrefix = '';
        // Incoming events (on)
        if (command.startsWith("on")) {
            commandPrefix = 'on';
        }
        // Incoming events for (3rd) unknown/unsaved map
        if (command.startsWith("off")) {
            commandPrefix = 'off';
        }
        // Incoming events (report)
        if (command.startsWith("report")) {
            commandPrefix = 'report';
        }
        // Remove "get" from the command
        if (command.startsWith("get") || command.startsWith("Get")) {
            commandPrefix = 'get';
        }
        return commandPrefix;
    }

    handleV2commands(abbreviatedCommand) {
        if (abbreviatedCommand === 'MapSet_V2') {
            // TODO: handle subsets
            return abbreviatedCommand;
        }
        if (abbreviatedCommand === 'MapInfo_V2') {
            if (this.bot.authDomain === constants.AUTH_DOMAIN_YD) {
                return 'MapInfo_V2_Yeedi';
            } else {
                return abbreviatedCommand;
            }
        }
        return abbreviatedCommand.slice(0, -3);
    }

    /**
     * Handle onFwBuryPoint message (e.g. T8/T9 series)
     * This is presumably some kind of debug or internal message
     * The main advantage of this message is that it's fired immediately
     * @param {Object} payload
     */
    async handleFwBuryPoint(payload) {
        try {
            let fwBuryPointEvent = '';
            let fwBuryPoint = {};
            if (payload.hasOwnProperty('new')) {
                tools.envLogFwBuryPoint(payload);
                fwBuryPoint = payload.new;
            } else if (payload.hasOwnProperty('content')) {
                const content = JSON.parse(payload['content']);
                fwBuryPointEvent = content["rn"];
                tools.envLogFwBuryPoint(`event: ${fwBuryPointEvent}`);
                tools.envLogFwBuryPoint(payload);
                let dVal = content['d']['body']['data']['d_val'];
                let dValObject = null;
                // try to fix invalid JSON
                try {
                    dValObject = (typeof dVal === 'string') ? JSON.parse(dVal) : dVal;
                } catch {
                    if (dVal.indexOf("}") < dVal.indexOf("{")) {
                        if (dVal.indexOf("]") > -1 && dVal.indexOf("[") === -1) {
                            dVal = "[" + dVal.substring(dVal.indexOf("{"));
                        } else {
                            dVal = "[" + dVal.substring(dVal.indexOf("{"));
                        }
                    } else if (dVal.indexOf("]") < dVal.indexOf("[")) {
                        dVal = "[" + dVal.substring(dVal.indexOf("{"));
                    }
                    dValObject = JSON.parse(dVal);
                }
                fwBuryPoint = dValObject;
            }

            if (fwBuryPointEvent === 'bd_wifi_24g') {
                //
            } else if (fwBuryPointEvent === 'bd_onoffline') {
                // after reconnection
            } else if (fwBuryPointEvent === 'bd_PowerOnOff') {
                // after powered on
            } else if (fwBuryPointEvent === 'bd_fbi08') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_returnchargeinfo') {
                // charging informations
            } else if (fwBuryPointEvent === 'bd_returndock') {
                // returning to dock
            } else if (fwBuryPointEvent === 'bd_trigger') {
                // when pyhsical- or app button is pressed
            } else if (fwBuryPointEvent === 'bd_task') {
                // when a tasks starts
            } else if (fwBuryPointEvent === 'bd_sensortriggerinfo') {
                // when a sensor gets triggered
            } else if (fwBuryPointEvent === 'bd_cri01') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_cc10') {
                // Charging Case
            } else if (fwBuryPointEvent === 'bd_vslaminfo') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_planinfo') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_extramap') {
                // seems to get raised, when the robot found extra space that is not on the map
            } else if (fwBuryPointEvent === 'bd_light') {
                // unknown
            } else if (fwBuryPointEvent === 'bd_cache') {
                // unknown
            }

            // Info whether the dust case is installed
            if (fwBuryPoint.hasOwnProperty('dirtboxState')) {
                const val = fwBuryPoint.dirtboxState;
                this.emitMessage('DustCaseInfo', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('code')) {
                if (fwBuryPoint.code === 110) { /* NoDustBox: Dust Bin Not installed */
                    const val = Number(!fwBuryPoint.state);
                    this.emitMessage('DustCaseInfo', val);
                    return true;
                }
            }
            if (fwBuryPoint.hasOwnProperty('multiMap')) {
                // Info whether multi-map mode is enabled
                const val = fwBuryPoint.multiMap;
                this.emitMessage('SettingInfoMultiMap', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('AI')) {
                // Info whether AIVI is enabled
                const val = fwBuryPoint.AI;
                this.emitMessage('SettingInfoAIVI', val);
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('aromamode')) {
                // aromamode: 0 = disabled, 1 = enabled
                const val = fwBuryPoint.aromamode;
                this.emitMessage('AromaMode', val);
                return true;
            }
            // ----------------------------------
            // Use these properties as trigger
            // ----------------------------------
            if (fwBuryPoint.hasOwnProperty('waterAmount') || fwBuryPoint.hasOwnProperty('waterbox')) {
                // Mopping functionality related data
                this.bot.run("GetWaterInfo");
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('mopremind')) {
                // Info whether 'Cleaning Cloth Reminder' is enabled
                this.bot.run('GetDusterRemind');
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('isPressurized')) {
                // Info whether 'Auto-Boost Suction' is enabled
                this.bot.run('GetCarpetPressure');
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('DND')) {
                // Info whether 'Do Not Disturb' is enabled
                this.bot.run('GetDoNotDisturb');
                return true;
            }
            if (fwBuryPoint.hasOwnProperty('continue')) {
                // Info whether 'Continuous Cleaning' is enabled
                this.bot.run('GetContinuousCleaning');
                return true;
            }
        } catch (e) {
            tools.envLogWarn(`error handling onFwBuryPoint payload: '${e.message}'`);
            //tools.envLogPayload(payload);
        }
        return false;
    }
}

module.exports = Ecovacs;
