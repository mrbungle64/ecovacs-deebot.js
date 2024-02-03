export = VacBot_950type;
/**
 * This class is relevant for 950 type models
 * e.g. Deebot OZMO 920/950, T8 series, T9 series (which are all MQTT based models)
 */
declare class VacBot_950type extends VacBot {
    advancedMode: any;
    aiBlockPlate: any;
    aiCleanItemState: {
        items: any[];
        particleRemoval: any;
        petPoopPrevention: any;
    };
    airbotAutoModel: {
        enable: any;
        trigger: any;
        aq: {
            aqStart: any;
            aqEnd: any;
        };
    };
    airDryingStatus: string;
    airQuality: {
        particulateMatter25: any;
        pm_10: any;
        particulateMatter10: any;
        airQualityIndex: any;
        volatileOrganicCompounds: any;
        temperature: any;
        humidity: any;
    };
    angleFollow: any;
    angleWakeup: any;
    areaPoint: {
        mapId: any;
        locationPoints: any;
    };
    atmoLightIntensity: any;
    atmoVolume: any;
    autoEmpty: any;
    autoEmptyStatus: any;
    autonomousClean: any;
    avoidedObstacles: any;
    block: any;
    blockTime: {
        from: any;
        to: any;
    };
    bluetoothSpeaker: {
        enable: any;
        time: any;
        name: any;
    };
    borderSpin: any;
    breakPoint: any;
    carpetInfo: any;
    carpetPressure: any;
    childLock: any;
    cleanCount: number;
    cleanPreference: any;
    currentTask: {
        type: any;
        triggerType: any;
        failed: any;
        stopReason: any;
    };
    customizedScenarioCleaning: any[];
    dmodule: {
        enabled: any;
        status: any;
    };
    drivingWheel: any;
    dusterRemind: {
        enabled: any;
        period: any;
    };
    efficiency: any;
    evt: {};
    firmwareVersion: any;
    humanoidFollow: {
        video: any;
        yiko: any;
    };
    liveLaunchPwdState: {
        state: any;
        hasPwd: any;
    };
    mapSet_V2: {};
    mapState: any;
    mic: any;
    monitorAirState: any;
    mopOnlyMode: boolean;
    multiMapState: any;
    obstacleTypes: any;
    OTA: {
        status: any;
        result: any;
        isForce: any;
        progress: any;
        supportAuto: any;
        ver: any;
    };
    relocationState: any;
    relocationStatus: {};
    stationInfo: {
        state: any;
        name: any;
        model: any;
        sn: any;
        wkVer: any;
    };
    stationState: {
        type: any;
        state: any;
    };
    sweepMode: any;
    sysinfo: {
        load: any;
        uptime: any;
        signal: any;
        meminfo: any;
        pos: any;
    };
    threeModule: any[];
    threeModuleStatus: any[];
    timezone: string;
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
    handleCleanInfo(payload: any): void;
    /**
     * Handle the payload of the `StationState` response/message
     * @param {Object} payload
     */
    handleStationState(payload: any): void;
    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload: any): void;
    /**
     * Handle the payload of the `WashInterval` response/message
     * @param {Object} payload
     */
    handleWashInterval(payload: any): void;
    /**
     * Handle the payload of the `WashInfo` response/message
     * @param {Object} payload
     */
    handleWashInfo(payload: any): void;
    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload: any): void;
    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload: any): void;
    /**
     * Handle the payload of the `Pos` response/message
     * (vacuum position and charger resp. charge position)
     * @param {Object} payload
     */
    handlePos(payload: any): void;
    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload: any): void;
    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload: any): void;
    /**
     * Handle the payload of the `NetInfo` response/message
     * (network addresses and Wi-Fi status)
     * @param {Object} payload
     */
    handleNetInfo(payload: any): void;
    /**
     * Handle the payload of the `WaterInfo` response/message
     * (water level and water box status)
     * @param {Object} payload
     */
    handleWaterInfo(payload: any): void;
    /**
     * Handle the payload of the `AICleanItemState` response/message
     * Particle Removal and Pet Poop Avoidance mode (e.g. X1)
     * @param {Object} payload
     */
    handleAICleanItemState(payload: any): void;
    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload: any): void;
    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload: any): void;
    /**
     * Handle the payload of the `WorkMode` response/message
     * ('Work Mode', 'Cleaning Mode')
     * vacuum and mop = 0
     * vacuum only = 1
     * mop only = 2
     * mop after vacuum = 3
     * @param {Object} payload
     */
    handleWorkMode(payload: any): void;
    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload: any): void;
    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload: any): void;
    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload: any): void;
    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: any): void;
    /**
     * Handle the payload of the `MapState` response/message
     * @param {Object} payload
     */
    handleMapState(payload: any): void;
    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload: any): void;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: any): void;
    /**
     * Handle the payload of the `TotalStats` response/message
     * @param {Object} payload
     */
    handleTotalStats(payload: any): void;
    /**
     * Handle the payload of the `RelocationState` response/message
     * @param {Object} payload
     */
    handleRelocationState(payload: any): void;
    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload: any): void;
    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload: any): void;
    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload: any): void;
    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload: any): void;
    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload: any): void;
    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload: any): void;
    handleRecognization(payload: any): void;
    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload: any): void;
    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload: any): void;
    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * 'Auto-Boost Suction'
     * @param {Object} payload
     */
    handleCarpetPressure(payload: any): void;
    /**
     * Handle the payload of the 'CarpetInfo' response/message
     * 'Carpet cleaning strategy'
     * @param {Object} payload
     */
    handleCarpetInfo(payload: any): void;
    handleCleanPreference(payload: any): void;
    handleLiveLaunchPwdState(payload: any): void;
    handleWiFiList(payload: any): void;
    handleOverTheAirUpdate(payload: any): void;
    handleTimeZone(payload: any): void;
    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload: any): void;
    /**
     * Handle the payload of the 'Sched' response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload: any): void;
    /**
     * Handle the payload of the 'QuickCommand' response/message
     * @param {Object} payload - The payload containing the customized scenario cleaning.
     */
    handleQuickCommand(payload: any): void;
    /**
     * Handle the payload of the 'CachedMapInfo' response/message
     * @param {Object} payload
     */
    handleCachedMapInfo(payload: any): void;
    /**
     * Handle the payload of the 'MapInfo_V2' response/message
     * @param {Object} payload
     */
    handleMapInfoV2(payload: any): void;
    /**
     * Handle the payload of the 'MapInfo_V2' response/message (Yeedi)
     * @param {Object} payload
     */
    handleMapInfoV2_Yeedi(payload: any): void;
    /**
     * Handle the payload of the 'MapSet' response/message
     * @param {Object} payload
     */
    handleMapSet(payload: any): {
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
    handleMapSubset(payload: any): Promise<any>;
    /**
     * Handle the payload of the `MapSet_V2` response/message
     * @param {Object} payload
     */
    handleMapSet_V2(payload: any): Promise<void>;
    /**
     * Handle the payload of the 'MapInfo' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapImage(payload: any): Promise<any>;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload: any): any;
    liveMapImage: mapTemplate.EcovacsLiveMapImage;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    handleMinorMap(payload: any): Promise<{
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    handleMapTrace(payload: any): Promise<void>;
    /**
     * Handle the payload of the 'Error' response/message
     * @param {Object} payload
     */
    handleResponseError(payload: any): void;
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
    handleMonitorAirState(payload: any): void;
    /**
     * Handle the payload of the 'AngleFollow' response/message
     * 'Face to Me' option
     * @param {Object} payload
     */
    handleAngleFollow(payload: any): void;
    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload: any): void;
    /**
     * Handle the payload of the 'Mic' response/message
     * 'Microphone'
     * @param {Object} payload
     */
    handleMic(payload: any): void;
    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * 'Working Status Voice Report'
     * @param {Object} payload
     */
    handleVoiceSimple(payload: any): void;
    voiceSimple: any;
    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload: any): void;
    /**
     * Handle the payload of the 'ChildLock' response/message
     * 'Child Lock'
     * @param {Object} payload
     */
    handleChildLock(payload: any): void;
    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * 'YIKO Voice Assistant'
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload: any): void;
    voiceAssistantState: any;
    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * 'Lab Features' => 'Follow Me'
     * @param {Object} payload
     */
    handleHumanoidFollow(payload: any): void;
    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * 'Self-linked Purification'
     * @param {Object} payload
     */
    handleAutonomousClean(payload: any): void;
    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * 'Linked Purification' (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload: any): void;
    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * 'Bluetooth Speaker'
     * @param {Object} payload
     */
    handleBlueSpeaker(payload: any): void;
    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload: any): void;
    /**
     * Handle the payload of the 'AtmoLight' response/message
     * 'Light Brightness'
     * @param {Object} payload
     */
    handleAtmoLight(payload: any): void;
    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * 'Volume'
     * @param {Object} payload
     */
    handleAtmoVolume(payload: any): void;
    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload: any): void;
    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload: any): void;
    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload: any): void;
    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload: any): void;
    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload: any): void;
    handleTask(type: any, payload: any): void;
    handleDModule(payload: any): void;
}
import VacBot = require("../vacBot");
import mapTemplate = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map