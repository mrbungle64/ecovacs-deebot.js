export = BotState;
/**
 * @class BotState
 * Manages the internal state and status properties of the VacBot.
 */
declare class BotState {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot: VacBot);
    bot: VacBot;
    batteryLevel: any;
    batteryIsLow: boolean;
    cleanReport: any;
    chargeStatus: any;
    chargeMode: any;
    cleanSpeed: any;
    waterLevel: any;
    waterboxInfo: any;
    moppingType: any;
    scrubbingType: any;
    sleepStatus: any;
    deebotPosition: {
        x: null;
        y: null;
        a: null;
        isInvalid: boolean;
        currentSpotAreaID: string;
        currentSpotAreaName: string;
        changeFlag: boolean;
    };
    chargePosition: {
        x: null;
        y: null;
        a: null;
        changeFlag: boolean;
    };
    cleanSum_totalSquareMeters: number | null;
    cleanSum_totalSeconds: number | null;
    cleanSum_totalNumber: number | null;
    cleanLog: any[];
    cleanLog_lastImageUrl: any;
    cleanLog_lastTimestamp: number | null;
    cleanLog_lastTotalTime: number | null;
    cleanLog_lastTotalTimeString: string | null;
    cleanLog_lastSquareMeters: number | null;
    currentStats: {
        cleanedArea: null;
        cleanedSeconds: null;
        cleanType: null;
    };
    netInfoIP: any;
    netInfoWifiSSID: any;
    netInfoWifiSignal: any;
    netInfoMAC: any;
    firmwareVersion: any;
    timezone: string | null;
    OTA: any;
    sysinfo: {
        load: any;
        uptime: any;
        signal: any;
        meminfo: any;
        pos: any;
    } | null;
    stationState: {
        type: number;
        state: number;
        isAirDrying: boolean;
        isSelfCleaning: boolean;
        isActive: boolean;
    } | null;
    stationInfo: {
        state: any;
        name: any;
        model: any;
        sn: any;
        wkVer: any;
    } | null;
    washInterval: any;
    washInfo: any;
    advancedMode: any;
    autoEmpty: any;
    autoEmptyStatus: any;
    cleanCount: any;
    cleanPreference: any;
    workMode: any;
    workState: {
        robot: any;
        station: any;
        paused: boolean;
    } | null;
    sweepMode: any;
    mopOnlyMode: boolean | null;
    borderSpin: any;
    borderSwitch: any;
    dusterRemind: {
        enabled: any;
        period: any;
    } | null;
    carpetPressure: any;
    carpetInfo: any;
    block: any;
    blockTime: {
        from: any;
        to: any;
    } | null;
    breakPoint: any;
    volume: any;
    voiceSimple: any;
    voiceAssistantState: any;
    trueDetect: any;
    avoidedObstacles: number;
    obstacleTypes: any;
    aiCleanItemState: {
        items: any;
        particleRemoval: boolean;
        petPoopPrevention: boolean;
    } | null;
    crossMapBorderWarning: any;
    cutDirection: any;
    moveupWarning: any;
    safeProtect: any;
    evt: {
        code: any;
        event: any;
    } | {
        code: any;
        event: string;
    } | null;
    currentTask: {
        type: string;
        triggerType: string;
        failed: boolean;
        stopReason: string;
    };
    liveLaunchPwdState: {
        state: any;
        hasPwd: any;
    } | null;
    airQuality: {
        particulateMatter25: any;
        particulateMatter10: any;
        airQualityIndex: any;
        volatileOrganicCompounds: any;
        temperature: any;
        humidity: any;
    } | null;
    aiBlockPlate: any;
    airbotAutoModel: {
        enable: any;
        trigger: any;
        aq: {
            aqStart: any;
            aqEnd: any;
        };
    } | null;
    angleFollow: any;
    angleWakeup: any;
    atmoLightIntensity: any;
    atmoVolume: any;
    areaPoint: Object | null;
    autonomousClean: any;
    bluetoothSpeaker: {
        enable: any;
        time: any;
        name: any;
    } | null;
    childLock: any;
    humanoidFollow: {
        video: any;
        yiko: any;
    } | null;
    mic: any;
    monitorAirState: any;
    threeModule: Object | null;
    threeModuleStatus: Object | null;
    dmodule: any;
    efficiency: any;
    dryingDuration: any;
    airDryingStatus: string | null;
    relocationStatus: Object | null;
    relocationState: any;
    customizedScenarioCleaning: Object | null;
    errorCode: string;
    errorDescription: string;
    schedule: any[];
    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload: Object): void;
    /**
     * Handle the payload of the `StationState` response/message
     * @param {Object} payload
     */
    handleStationState(payload: Object): void;
    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload: Object): void;
    /**
     * Handle the payload of the `WashInterval` response/message
     * @param {Object} payload
     */
    handleWashInterval(payload: Object): void;
    /**
     * Handle the payload of the `WashInfo` response/message
     * @param {Object} payload
     */
    handleWashInfo(payload: Object): void;
    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload: Object): void;
    /**
     * Handle the payload of the `Pos` response/message
     * (vacuum position and charger resp. charge position)
     * @param {Object} payload
     */
    handlePos(payload: Object): void;
    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload: Object): void;
    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload: Object): void;
    /**
     * Handle the payload of the `NetInfo` response/message
     * (network addresses and Wi-Fi status)
     * @param {Object} payload
     */
    handleNetInfo(payload: Object): void;
    handleBorderSwitch(payload: any): void;
    handleCrossMapBorderWarning(payload: any): void;
    handleCutDirection(payload: any): void;
    handleMoveupWarning(payload: any): void;
    handleSafeProtect(payload: any): void;
    handleWorkState(payload: any): void;
    /**
     * Handle the payload of the `WaterInfo` response/message
     * (water level and water box status)
     * @param {Object} payload
     */
    handleWaterInfo(payload: Object): void;
    /**
     * Handle the payload of the `AICleanItemState` response/message
     * Particle Removal and Pet Poop Avoidance mode (e.g. X1)
     * @param {Object} payload
     */
    handleAICleanItemState(payload: Object): void;
    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload: Object): void;
    handleDryingDuration(payload: any): void;
    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload: Object): void;
    /**
     * Handle the payload of the `WorkMode` response/message
     * ('Work Mode', 'Cleaning Mode')
     * vacuum and mop = 0
     * vacuum only = 1
     * mop only = 2
     * mop after vacuum = 3
     * @param {Object} payload
     */
    handleWorkMode(payload: Object): void;
    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload: Object): void;
    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload: Object): void;
    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload: Object): void;
    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: Object): void;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: Object): void;
    /**
     * Emit all CleanLog-related events.
     * Consolidates the emit logic for both code paths
     * (MQTT response via `lg/log.do` and REST API via `dln/api/log/clean_result/list`)
     */
    emitCleanLogEvents(): void;
    /**
     * Handle the payload of the `TotalStats` response/message
     * @param {Object} payload
     */
    handleTotalStats(payload: Object): void;
    /**
     * Handle the payload of the `RelocationState` response/message
     * @param {Object} payload
     */
    handleRelocationState(payload: Object): void;
    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload: Object): void;
    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload: Object): void;
    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload: Object): void;
    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload: Object): void;
    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload: Object): void;
    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload: Object): void;
    handleRecognization(payload: any): void;
    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload: Object): void;
    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload: Object): void;
    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * 'Auto-Boost Suction'
     * @param {Object} payload
     */
    handleCarpetPressure(payload: Object): void;
    /**
     * Handle the payload of the 'CarpetInfo' response/message
     * 'Carpet cleaning strategy'
     * @param {Object} payload
     */
    handleCarpetInfo(payload: Object): void;
    handleCleanPreference(payload: any): void;
    handleLiveLaunchPwdState(payload: any): void;
    handleWiFiList(payload: any): void;
    handleOverTheAirUpdate(payload: any): void;
    handleTimeZone(payload: any): void;
    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload: Object): void;
    /**
     * Handle the payload of the 'Sched' response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload: Object): void;
    /**
     * Handle the payload of the 'QuickCommand' response/message
     * @param {Object} payload - The payload containing the customized scenario cleaning.
     */
    handleQuickCommand(payload: Object): void;
    /**
     * Handle the payload of the 'Error' response/message
     * @param {Object} payload
     */
    handleResponseError(payload: Object): void;
    /**
     * Handles the air quality data received from the payload.
     * 'Indoor' Air Quality
     * @param {object} payload - The air quality data payload.
     */
    handleAirQuality(payload: object): void;
    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * @param {Object} payload
     */
    handleMonitorAirState(payload: Object): void;
    /**
     * Handle the payload of the 'AngleFollow' response/message
     * 'Face to Me' option
     * @param {Object} payload
     */
    handleAngleFollow(payload: Object): void;
    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload: Object): void;
    /**
     * Handle the payload of the 'Mic' response/message
     * 'Microphone'
     * @param {Object} payload
     */
    handleMic(payload: Object): void;
    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * 'Working Status Voice Report'
     * @param {Object} payload
     */
    handleVoiceSimple(payload: Object): void;
    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload: Object): void;
    drivingWheel: any;
    /**
     * Handle the payload of the 'ChildLock' response/message
     * 'Child Lock'
     * @param {Object} payload
     */
    handleChildLock(payload: Object): void;
    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * 'YIKO Voice Assistant'
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload: Object): void;
    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * 'Lab Features' => 'Follow Me'
     * @param {Object} payload
     */
    handleHumanoidFollow(payload: Object): void;
    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * 'Self-linked Purification'
     * @param {Object} payload
     */
    handleAutonomousClean(payload: Object): void;
    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * 'Linked Purification' (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload: Object): void;
    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * 'Bluetooth Speaker'
     * @param {Object} payload
     */
    handleBlueSpeaker(payload: Object): void;
    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload: Object): void;
    /**
     * Handle the payload of the 'AtmoLight' response/message
     * 'Light Brightness'
     * @param {Object} payload
     */
    handleAtmoLight(payload: Object): void;
    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * 'Volume'
     * @param {Object} payload
     */
    handleAtmoVolume(payload: Object): void;
    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload: Object): void;
    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload: Object): void;
    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload: Object): void;
    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload: Object): void;
    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload: Object): void;
    handleTask(type: any, payload: any): void;
    handleDModule(payload: any): void;
    getCmdForObstacleDetection(): "Recognization" | "TrueDetect";
}
//# sourceMappingURL=botState.d.ts.map