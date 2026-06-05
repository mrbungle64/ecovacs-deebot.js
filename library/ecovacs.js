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
        let clientIdSuffix = '';
        if (this.vacuum && this.vacuum['did']) {
            const cleanDid = this.vacuum['did'].replace(/[^a-zA-Z0-9]/g, '');
            clientIdSuffix = '_' + cleanDid.substring(0, 8);
        }
        const clientId = this.username + '/' + this.resource + clientIdSuffix;
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
            const eventName = topic.split('/')[2];
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
            } catch (e) {
                tools.envLogError(`MQTT server is offline or not reachable`);
            }
        });

        this.client.on('disconnect', function () {
            try {
                ecovacsMQTT.emitNetworkError('MQTT client received disconnect event');
            } catch (e) {
                tools.envLogWarn(`MQTT client received disconnect event`);
            }
        });

        this.client.on('error', (error) => {
            try {
                ecovacsMQTT.emitNetworkError(`MQTT client error: ${error.message}`);
            } catch (e) {
                tools.envLogError(`MQTT client error: '${error.message}'`);
            }
        });

        this.on("ready", () => {
            tools.envLogSuccess(`MQTT client received ready event`);
        });
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

        try {
            const params = commandObj.getRequestObject(this, command);
            const portalUrl = commandObj.getRequestUrl(this, command, params);
            const headers = commandObj.getRequestHeaders(this, params);
            let responseData;
            try {
                const response = await axios.post(portalUrl, params, {
                    headers: headers
                });
                responseData = response.data;
                tools.envLogSuccess(`got response for '${command.name}' with id '${command.args.id}':`);
            } catch (e) {
                this.emitNetworkError(e.message, command.name);
                if (expectedEvent) {
                    this.pendingCommands.rejectById(command.getId(), e);
                } else if (rejectPromise) {
                    rejectPromise(e);
                }
                throw e;
            }

            if ((responseData['result'] === 'ok') || (responseData['ret'] === 'ok')) {
                this.emitLastErrorByErrorCode('0');
                this.handleCommandResponse(command, responseData);
                if (resolvePromise) {
                    resolvePromise(responseData);
                }
            } else {
                const errorCodeObj = {
                    code: responseData['errno'],
                    error: responseData['error']
                };
                this.bot.handleResponseError(errorCodeObj);
                // Error code 500 = wait for response timed out (see issue #19)
                if (this.bot.errorCode === '500') {
                    this.bot.errorDescription = this.bot.errorDescription + ` (command '${command.name}')`;
                }
                this.emitLastError();
                tools.envLogInfo(`[EcovacsMQTT] failure code ${responseData['errno']} (${responseData['error']}) sending command '${command.name}'`);
                const err = new Error(`Failure code ${responseData['errno']} (${responseData['error']})`);
                if (expectedEvent) {
                    this.pendingCommands.rejectById(command.getId(), err);
                } else if (rejectPromise) {
                    rejectPromise(err);
                }
                throw err;
            }
        } catch (e) {
            tools.envLogError(`error sending command: ${e.toString()}`);
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
        return new Promise((resolve, reject) => {
            this.client.unsubscribe(this.channel, error => {
                if (error) {
                    tools.envLogError(`error unsubscribing from the atr channel: ${error.toString()}`);
                    reject(false);
                } else {
                    tools.envLogSuccess(`successfully unsubscribed from the atr channel`);
                    tools.envLogInfo(`now trying to close MQTT client connection ...`);
                    this.client.end();
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
        switch (abbreviatedCommand) {
            // AdvancedMode handled dynamically
            case 'AICleanItemState': {
                // "Strategic Particle Removal" and "Strategic Pet Poop Avoidance" mode (e.g. X1)
                this.bot.handleAICleanItemState(payload);
                if (this.bot.aiCleanItemState.items.length) {
                    this.emitMessage('AICleanItemState', this.bot.aiCleanItemState, payload);
                }
                break;
            }
            case 'AutoEmpty': {
                // "Auto empty" status (Auto-Empty Station)
                this.bot.handleAutoEmpty(payload);
                this.emitMessage("AutoEmpty", this.bot.autoEmpty, payload);
                const autoEmptyStatus = {
                    'autoEmptyEnabled': (this.bot.autoEmpty === 1),
                    'stationStatus': this.bot.autoEmptyStatus,
                    'stationActive': (this.bot.autoEmptyStatus === 1),
                    'dustBagFull': (this.bot.autoEmptyStatus === 5)
                };
                this.emitMessage("AutoEmptyStatus", autoEmptyStatus);
                break;
            }
            case "Battery": {
                // Battery status
                this.bot.handleBattery(payload);
                if (this.bot.batteryLevel) {
                    this.emitMessage("BatteryInfo", this.bot.batteryLevel, payload);
                    this.emitMessage("BatteryIsLow", this.bot.batteryIsLow);
                }
                break;
            }
            case 'Block': {
                // "Do Not Disturb" mode
                this.bot.handleBlock(payload);
                this.emitMessage("DoNotDisturbEnabled", this.bot.block, payload);
                const doNotDisturbEnabled = Boolean(this.bot.block);
                if (doNotDisturbEnabled) {
                    this.emitMessage("DoNotDisturbBlockTime", this.bot.blockTime);
                }
                break;
            }
            // BorderSpin and BorderSwitch handled dynamically
            case 'BreakPoint': {
                // "Continuous Cleaning Mode" / "Resumed Clean"
                this.bot.handleBreakPoint(payload);
                this.emitMessage("ContinuousCleaningEnabled", this.bot.breakPoint, payload);
                break;
            }
            case 'CleanLogs': {
                // "Cleaning Log"
                this.bot.handleCleanLogs(payload);
                this.bot.emitCleanLogEvents();
                break;
            }
            case 'CarpertPressure': { // The typo in 'Carpert' is intended
                // "Auto-Boost Suction"
                this.bot.handleCarpetPressure(payload);
                this.emitMessage("CarpetPressure", this.bot.carpetPressure, payload);
                break;
            }
            // CarpetInfo, CleanPreference, CleanCount handled dynamically
            case "CleanInfo": {
                // Various information about the cleaning status
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
                break;
            }
            case "ChargeState": {
                // Various information about the charging status
                this.bot.handleChargeState(payload);
                if (this.bot.chargeStatus) {
                    this.emitMessage("ChargeState", this.bot.chargeStatus, payload);
                }
                if (this.bot.chargeMode) {
                    this.emitMessage("ChargeMode", this.bot.chargeMode);
                }
                break;
            }
            case 'clearMap': {
                this.bot.handleClearMap(payload);
                break;
            }
            // CrossMapBorderWarning handled dynamically
            case 'CustomAreaMode': {
                // "Mopping Mode" / "Cleaning efficiency"
                this.bot.handleCustomAreaMode(payload);
                this.emitMessage('SweepMode', this.bot.sweepMode, payload);
                break;
            }
            // CutDirection and DryingDuration handled dynamically
            case 'DModule': { // Air Freshener module (T9 AIVI)
                this.bot.handleDModule(payload);
                if (this.bot.dmodule.enabled) {
                    this.emitMessage("DModuleEnabled", this.bot.dmodule.enabled, payload);
                    this.emitMessage("DModuleStatus", this.bot.dmodule.status);
                }
                break;
            }
            // DusterRemind handled dynamically
            case 'Evt': {
                // Rare event, little is known about it yet
                this.bot.handleEvt(payload);
                if (this.bot.evt.event) {
                    this.emitMessage("Evt", this.bot.evt, payload);
                }
                break;
            }
            case "Error": {
                // Error codes
                this.bot.handleResponseError(payload);
                this.emitMessage("Error", this.bot.errorDescription, payload);
                this.emitMessage('ErrorCode', this.bot.errorCode);
                this.emitMessage('LastError', {
                    'error': this.bot.errorDescription,
                    'code': this.bot.errorCode
                });
                break;
            }
            case "LifeSpan": {
                // Consumable components
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
                break;
            }
            // LiveLaunchPwdState and MoveupWarning handled dynamically
            case "NetInfo": {
                // Various network/wifi information
                this.bot.handleNetInfo(payload);
                this.emitMessage("NetworkInfo", {
                    'ip': this.bot.netInfoIP,
                    'mac': this.bot.netInfoMAC,
                    'wifiSSID': this.bot.netInfoWifiSSID,
                    'wifiSignal': this.bot.netInfoWifiSignal,
                }, payload);
                break;
            }
            case 'Ota': {
                this.bot.handleOverTheAirUpdate(payload);
                this.emitMessage('Ota', payload, payload);
                break;
            }
            case "Pos": {
                // Various information about the position of the bot and the charging station
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
                break;
            }
            case 'QuickCommand': {
                // "Customized Scenario Cleaning" scenarios
                this.bot.handleQuickCommand(payload);
                this.emitMessage("CustomizedScenarioCleaning", this.bot.customizedScenarioCleaning, payload);
                break;
            }
            case 'Recognization': {
                // True Detect / "AIVI 3D"
                // e.g. "AIVI Smart Recognition"
                this.bot.handleRecognization(payload);
                this.emitMessage('TrueDetect', this.bot.trueDetect, payload);
                break;
            }
            case "RelocationState": {
                // Relocation status
                this.bot.handleRelocationState(payload);
                this.emitMessage("RelocationStatus", this.bot.relocationStatus);
                this.emitMessage("RelocationState", this.bot.relocationState, payload);
                break;
            }
            // SafeProtect handled dynamically
            case 'Sched': {
                // "Scheduling"
                this.bot.handleSched(payload);
                if (this.bot.schedule) {
                    this.emitMessage('Schedule', this.bot.schedule, payload);
                }
                break;
            }
            case 'Sleep': {
                // Sleep mode/status
                this.bot.handleSleepStatus(payload);
                this.emitMessage("SleepStatus", this.bot.sleepStatus, payload);
                break;
            }
            case "Speed": {
                // "Vacuum Power" / "Suction Power"
                this.bot.handleSpeed(payload);
                this.emitMessage("CleanSpeed", this.bot.cleanSpeed, payload);
                break;
            }
            case 'stationAction': {
                this.bot.handleStationAction(payload);
                break;
            }
            case "StationInfo": {
                // Various information about the cleaning station (e.g. X1 series)
                this.bot.handleStationInfo(payload);
                this.emitMessage('StationInfo', this.bot.stationInfo, payload);
                break;
            }
            case "StationState": {
                // Various states of the cleaning station (e.g. X1 series)
                this.bot.handleStationState(payload);
                if (this.bot.stationState.type !== null) {
                    this.emitMessage("StationState", this.bot.stationState, payload);
                    const airDryingState = this.bot.stationState.isAirDrying ? 'airdrying' : 'idle';
                    this.emitMessage('AirDryingState', airDryingState);
                }
                break;
            }
            case "Stats": {
                this.bot.handleStats(payload);
                if (this.bot.currentStats) {
                    this.emitMessage("CurrentStats", this.bot.currentStats, payload);
                    this.bot.currentStats = null;
                }
                break;
            }
            case 'SweepMode': {
                // "Mop-Only" mode
                this.bot.handleSweepMode(payload);
                this.emitMessage('MopOnlyMode', this.bot.mopOnlyMode, payload);
                break;
            }
            case 'TimeZone': {
                // The configured time zone
                this.bot.handleTimeZone(payload);
                this.emitMessage('TimeZone', payload, payload);
                break;
            }
            case 'TotalStats': {
                this.bot.handleTotalStats(payload);
                this.emitMessage('CleanSum', {
                    'totalSquareMeters': this.bot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.bot.cleanSum_totalSeconds,
                    'totalNumber': this.bot.cleanSum_totalNumber
                }, payload);
                break;
            }
            case 'TrueDetect': {
                this.bot.handleTrueDetect(payload);
                this.emitMessage("TrueDetect", this.bot.trueDetect, payload);
                break;
            }
            // Volume, WashInfo, WashInterval handled dynamically
            case "WaterInfo": {
                // "Water Flow Level"
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
                break;
            }
            case 'WifiList': {
                // Configured WiFi networks
                this.bot.handleWiFiList(payload);
                this.emitMessage('WifiList', payload, payload);
                break;
            }
            // WorkMode handled dynamically
            case 'WorkState': {
                this.bot.handleWorkState(payload);
                this.emitMessage('WorkState', this.bot.workState, payload);
                break;
            }
            // ========
            // Map info
            // ========
            case "CachedMapInfo": {
                if (!this.bot.hasMappingCapabilities()) {
                    tools.envLogWarn(`Skipping 'CachedMapInfo' push: device lacks mapping capabilities`);
                    break;
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
                break;
            }
            case "MapInfo": {
                if (commandPrefix === 'get') { //the getMapInfo only triggers the onMapInfo events but itself returns only status
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
                break;
            }
            case "MapInfo_V2": {
                try {
                    this.bot.handleMapInfoV2(payload);
                } catch (e) {
                    tools.envLogError(`error on handling MapInfo_V2: ${e.message}`);
                }
                break;
            }
            case "MapSet": {
                if (!this.bot.hasMappingCapabilities()) {
                    tools.envLogWarn(`Skipping 'MapSet' push: device lacks mapping capabilities`);
                    break;
                }
                // Handle spotAreas, virtualWalls, noMopZones
                let mapset = this.bot.handleMapSet(payload);
                if ((mapset["mapsetEvent"] !== 'error') || (mapset["mapsetEvent"] !== 'skip')) { //skip if not both boundary types are already processed
                    this.emitMessage(mapset["mapsetEvent"], mapset["mapsetData"], payload);
                }
                break;
            }
            case 'MapState': {
                this.bot.handleMapState(payload);
                this.emitMessage("MapState", this.bot.mapState, payload);
                break;
            }
            case 'MultiMapState': {
                if (!this.bot.hasMappingCapabilities()) {
                    tools.envLogWarn(`Skipping 'MultiMapState' push: device lacks mapping capabilities`);
                    break;
                }
                // Status of the Multi Map functionality
                this.bot.handleMultiMapState(payload);
                this.emitMessage("MultiMapState", this.bot.multiMapState, payload);
                break;
            }
            case "MapSet_V2": {
                await this.bot.handleMapSet_V2(payload);
                this.emitMessage("MapSet_V2", this.bot.mapSet_V2, payload);
                break;
            }
            case "MapSubSet": {
                if (!this.bot.hasMappingCapabilities()) {
                    tools.envLogWarn(`Skipping 'MapSubSet' push: device lacks mapping capabilities`);
                    break;
                }
                // Handle spotAreas, virtualWalls, noMopZones
                let mapsubset = await this.bot.handleMapSubset(payload);
                if (mapsubset["mapsubsetEvent"] !== 'error') {
                    // MapSpotAreaInfo, MapVirtualBoundaryInfo
                    this.emitMessage(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"], payload);
                }
                break;
            }
            // =================
            // yeedi models only
            // =================
            case 'AirDring': { // The typo in 'AirDring' is intended
                // Air drying status
                this.bot.handleAirDryingState(payload);
                if (this.bot.airDryingStatus) {
                    this.emitMessage('AirDryingState', this.bot.airDryingStatus, payload);
                }
                break;
            }
            case "MapInfo_V2_Yeedi": {
                // "_Yeedi" was appended as suffix
                // MapInfo_V2 for yeedi models differs from the Ecovacs variant
                try {
                    this.bot.handleMapInfoV2_Yeedi(payload);
                    this.emitMessage("CurrentMapMID", this.bot.currentMapMID, payload);
                    this.emitMessage("CurrentMapName", this.bot.currentMapName);
                    this.emitMessage("CurrentMapIndex", this.bot.currentMapIndex);
                    this.emitMessage("Maps", this.bot.maps);
                } catch (e) {
                    tools.envLogError(`error on handling MapInfo_V2 (yeedi): ${e.message}`);
                }
                break;
            }
            // ==================================
            // AIRBOT Z1 / Z1 Air Quality Monitor
            // ==================================
            case 'AirQuality':
            case 'JCYAirQuality': { // Z1 Air Quality Monitor
                this.bot.handleAirQuality(payload);
                if (this.bot.airQuality) {
                    this.emitMessage('AirQuality', this.bot.airQuality, payload);
                }
                break;
            }
            case 'AiBlockPlate': {
                this.bot.handleAiBlockPlate(payload);
                this.emitMessage('AiBlockPlate', this.bot.aiBlockPlate, payload);
                break;
            }
            case 'AirbotAutoModel': {
                this.bot.handleAirbotAutoModel(payload);
                if (this.bot.airbotAutoModel) {
                    this.emitMessage('AirbotAutoModel', this.bot.airbotAutoModel, payload);
                }
                break;
            }
            // AngleFollow handled dynamically
            case 'AngleWakeup': {
                this.bot.handleAngleWakeup(payload);
                this.emitMessage('AngleWakeup', this.bot.angleWakeup, payload);
                break;
            }
            // AtmoLight handled dynamically
            // AtmoVolume handled dynamically
            // AreaPoint handled dynamically
            // AutonomousClean handled dynamically
            // BlueSpeaker handled dynamically
            // ChildLock and DrivingWheel handled dynamically
            case 'Efficiency': {
                this.bot.handleEfficiency(payload);
                if (this.bot.efficiency) {
                    this.emitMessage('Efficiency', this.bot.efficiency, payload);
                }
                break;
            }
            case 'HumanoidFollow': {
                this.bot.handleHumanoidFollow(payload);
                if (this.bot.humanoidFollow?.yiko || this.bot.humanoidFollow?.video) {
                    if (this.bot.humanoidFollow.yiko) {
                        this.emitMessage('HumanoidFollowYiko', this.bot.humanoidFollow.yiko, payload);
                    }
                    if (this.bot.humanoidFollow.video) {
                        this.emitMessage('HumanoidFollowVideo', this.bot.humanoidFollow.video, payload);
                    }
                }
                break;
            }
            // Mic and MonitorAirState handled dynamically
            // ThreeModule handled dynamically
            // ThreeModuleStatus handled dynamically
            // VoiceSimple and VoiceAssistantState handled dynamically
            case 'AirSpeed':
            case 'Humidity':
            case 'Temperature': {
                if (payload) {
                    tools.envLogInfo(`[AirPurifier] Payload for ${abbreviatedCommand} message: ${JSON.stringify(payload)}`);
                }
                break;
            }
            case 'setVoice': {
                tools.envLogInfo(`[EcovacsMQTT_JSON] SETVOICE:`);
                tools.envLogInfo(payload);
                this.emitMessage('SetVoice', payload, payload);
                break;
            }
            case 'Voice': {
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
                break;
            }
            // =========
            // Unhandled
            // =========
            case 'AIMap': {
                // TODO: handle `AIMap` message
                break;
            }
            case 'AIMapAndMapSet': {
                // TODO: handle `AIMapAndMapSet` message
                // {"onAIMap":{"mid":"1839835603","totalCount":4},"onMapSet":{"mid":"1839835603","type":"svm","hasUnRead":0}}
                break;
            }
            case 'MajorMap': {
                this.bot.handleMajorMap(payload);
                // TODO: finish implementing MajorMap
                break;
            }
            case 'MapTrace': {
                if (!this.bot.hasMappingCapabilities()) {
                    tools.envLogWarn(`Skipping 'MapTrace' push: device lacks mapping capabilities`);
                    break;
                }
                this.bot.handleMapTrace(payload);
                // TODO: finish implementing MapTrace
                break;
            }
            case 'MinorMap': {
                if (!this.bot.hasMappingCapabilities()) {
                    tools.envLogWarn(`Skipping 'MinorMap' push: device lacks mapping capabilities`);
                    break;
                }
                // TODO: finish implementing MinorMap and emit MapLiveImage
                // let mapImage = this.bot.handleMinorMap(payload);
                break;
            }
            // ====================
            // FwBuryPoint messages
            // ====================
            case 'FwBuryPoint-bd_sysinfo':
                this.bot.handleSysinfo(payload);
                if (this.bot.sysinfo) {
                    this.emitMessage('Sysinfo', this.bot.sysinfo, payload);
                }
                break;
            case 'FwBuryPoint-bd_air-quality':
                this.bot.run('GetAirQuality');
                break;
            case 'FwBuryPoint-bd_task-return-normal-start':
            case 'FwBuryPoint-bd_task-return-normal-stop':
            case 'FwBuryPoint-bd_task-clean-move-start':
            case 'FwBuryPoint-bd_task-clean-move-stop':
            case 'FwBuryPoint-bd_task-clean-current-spot-start':
            case 'FwBuryPoint-bd_task-clean-current-spot-stop':
            case 'FwBuryPoint-bd_task-clean-specified-spot-start':
            case 'FwBuryPoint-bd_task-clean-specified-spot-stop': {
                const fwBuryPointEvent = abbreviatedCommand.substring(20);
                this.bot.handleTask(fwBuryPointEvent, payload);
                if (this.currentTask) {
                    this.emitMessage('TaskStarted', this.currentTask, payload);
                }
                break;
            }
            case 'FwBuryPoint-bd_dtofstart': // DToF-Laser-Sensor
            case 'FwBuryPoint-bd_errorcode':
            case 'FwBuryPoint-bd_relocation':
            case 'FwBuryPoint-bd_setting':
            case 'FwBuryPoint-bd_setting-evt': // Event -> Config stored...
            case 'FwBuryPoint-bd_gyrostart':
            case 'FwBuryPoint-bd_returnchargeinfo':
            case 'FwBuryPoint-bd_basicinfo-evt':
                break;
            case 'FwBuryPoint-bd_cri04':
                // {"gid":"G1716202154868","index":"0000002865","ts":"1702804165007","cr":26,"rr":692}
                // Vermutung: es handelt sich um Signal(stärke)werte vom/zum externen Sensor
                // Assumption: these are signal values (strength) from/to the external sensor
                break;
            default: {
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
                        break;
                    }
                }
                if (command === 'onFwBuryPoint') {
                    tools.envLogWarn('onFwBuryPoint message was unhandled');
                } else {
                    tools.envLogWarn(`got payload for unknown command '${command}': ${JSON.stringify(payload)}`);
                }
                break;
            }
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
                } catch (e) {
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
