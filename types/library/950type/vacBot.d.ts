export = VacBot_950type;
/**
 * This class is relevant for 950 type models
 * e.g. Deebot OZMO 920/950, T8 series, T9 series (which are all MQTT based models)
 */
declare class VacBot_950type extends VacBot {
    advancedMode: any;
    aiBlockPlate: any;
    aiCleanItemState: {
        items: never[];
        particleRemoval: null;
        petPoopPrevention: null;
    };
    airbotAutoModel: {
        enable: null;
        trigger: null;
        aq: {
            aqStart: null;
            aqEnd: null;
        };
    };
    airDryingStatus: string | null;
    airQuality: {
        particulateMatter25: null;
        pm_10: null;
        particulateMatter10: null;
        airQualityIndex: null;
        volatileOrganicCompounds: null;
        temperature: null;
        humidity: null;
    };
    angleFollow: any;
    angleWakeup: any;
    areaPoint: {
        mapId: null;
        locationPoints: null;
    };
    atmoLightIntensity: any;
    atmoVolume: any;
    autoEmpty: any;
    autoEmptyStatus: any;
    autonomousClean: any;
    avoidedObstacles: any;
    block: any;
    blockTime: {
        from: null;
        to: null;
    };
    bluetoothSpeaker: {
        enable: null;
        time: null;
        name: null;
    };
    borderSpin: any;
    breakPoint: any;
    carpetInfo: any;
    carpetPressure: any;
    childLock: any;
    cleanCount: number;
    cleanPreference: any;
    currentTask: {
        type: null;
        triggerType: null;
        failed: null;
        stopReason: null;
    };
    customizedScenarioCleaning: any[];
    dmodule: {
        enabled: null;
        status: null;
    };
    drivingWheel: any;
    dryingDuration: any;
    dusterRemind: {
        enabled: null;
        period: null;
    };
    efficiency: any;
    evt: {};
    firmwareVersion: any;
    humanoidFollow: {
        video: null;
        yiko: null;
    };
    liveLaunchPwdState: {
        state: null;
        hasPwd: null;
    };
    mapSet_V2: {};
    mapState: any;
    mic: any;
    monitorAirState: any;
    mopOnlyMode: boolean | null;
    multiMapState: any;
    obstacleTypes: any;
    OTA: {
        status: null;
        result: null;
        isForce: null;
        progress: null;
        supportAuto: null;
        ver: null;
    };
    relocationState: any;
    relocationStatus: {};
    stationInfo: {
        state: null;
        name: null;
        model: null;
        sn: null;
        wkVer: null;
    };
    stationState: {
        type: null;
        state: null;
    };
    sweepMode: any;
    sysinfo: {
        load: null;
        uptime: null;
        signal: null;
        meminfo: null;
        pos: null;
    };
    threeModule: any[];
    threeModuleStatus: any[];
    timezone: string | null;
    trueDetect: any;
    volume: number;
    washInfo: any;
    washInterval: any;
    workMode: any;
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
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload: Object): void;
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
     * Handle the payload of the `MapState` response/message
     * @param {Object} payload
     */
    handleMapState(payload: Object): void;
    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload: Object): void;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: Object): void;
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
     * Handle the payload of the 'CachedMapInfo' response/message
     * @param {Object} payload
     */
    handleCachedMapInfo(payload: Object): void;
    /**
     * Handle the payload of the 'MapInfo_V2' response/message
     * @param {Object} payload
     */
    handleMapInfoV2(payload: Object): void;
    /**
     * Handle the payload of the 'MapInfo_V2' response/message (Yeedi)
     * @param {Object} payload
     */
    handleMapInfoV2_Yeedi(payload: Object): void;
    /**
     * Handle the payload of the 'MapSet' response/message
     * @param {Object} payload
     */
    handleMapSet(payload: Object): {
        mapsetEvent: string;
        mapsetData?: undefined;
    } | {
        mapsetEvent: string;
        mapsetData: any;
    };
    /**
     * Handle the payload of the 'MapSubSet' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapSubset(payload: Object): Promise<Object>;
    /**
     * Handle the payload of the `MapSet_V2` response/message
     * @param {Object} payload
     */
    handleMapSet_V2(payload: Object): Promise<void>;
    /**
     * Handle the payload of the 'MapInfo' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapImage(payload: Object): Promise<Object>;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload: Object): null | undefined;
    liveMapImage: mapTemplate.EcovacsLiveMapImage | undefined;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    handleMinorMap(payload: Object): Promise<null | {
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    handleMapTrace(payload: any): Promise<void>;
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
    voiceSimple: any;
    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload: Object): void;
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
    voiceAssistantState: any;
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
import VacBot = require("../vacBot");
import mapTemplate = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map