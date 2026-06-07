export = EcovacsMessageDispatcher;
/**
 * Translates incoming MQTT broadcasts and command responses into the library's
 * named events. Owns the command-name normalisation, the `MESSAGE_HANDLERS`
 * routing table and every `_msg*` handler, plus the unknown-message fallback.
 *
 * It deliberately does NOT own the transport or the EventEmitter: those live on
 * the {@link EcovacsDeviceSession} passed to the constructor and are reached
 * through the delegating accessors below. Keeping those as live getters lets the
 * handler bodies read `this.bot` / `this.emitMessage` exactly as they did when
 * they lived on the session.
 */
declare class EcovacsMessageDispatcher {
    /**
     * @param {import('./ecovacsDeviceSession')} session - the owning device session
     */
    constructor(session: import("./ecovacsDeviceSession"));
    session: import("./ecovacsDeviceSession");
    get bot(): Object;
    get dictionary(): typeof import("./dictionary");
    get pendingCommands(): import("./managers/pendingCommandRegistry");
    get _responseCommandId(): any;
    emit(...args: any[]): boolean;
    emitMessage(...args: any[]): void;
    /**
     * Handle life span components to emit combined object
     */
    handleLifeSpanCombined(): void;
    /**
     * If the vacuum has power adjustment and also has a mopping system
     * then emit a `MoppingSystemInfo` event with the `cleanStatus` and `cleanInfo` properties
     */
    emitMoppingSystemReport(): void;
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
//# sourceMappingURL=ecovacsMessageDispatcher.d.ts.map