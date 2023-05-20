export = VacBot_950type;
/**
 * This class is relevant for 950 type models
 * e.g. Deebot OZMO 920/950, T8 series, T9 series (which are all MQTT based models)
 */
declare class VacBot_950type extends VacBot {
    breakPoint: any;
    block: any;
    autoEmpty: any;
    autoEmptyStatus: any;
    advancedMode: any;
    trueDetect: any;
    cleanCount: number;
    dusterRemind: {
        enabled: any;
        period: any;
    };
    carpetPressure: any;
    cleanPreference: any;
    liveLaunchPwdState: {
        state: any;
        hasPwd: any;
    };
    volume: number;
    relocationState: any;
    firmwareVersion: any;
    airDryingStatus: string;
    mopOnlyMode: boolean;
    sweepMode: any;
    borderSpin: any;
    airQuality: {
        particulateMatter25: any;
        pm_10: any;
        particulateMatter10: any;
        airQualityIndex: any;
        volatileOrganicCompounds: any;
        temperature: any;
        humidity: any;
    };
    mic: any;
    humanoidFollow: {
        video: any;
        yiko: any;
    };
    angleFollow: any;
    aiBlockPlate: any;
    autonomousClean: any;
    bluetoothSpeaker: {
        enabled: any;
        timeout: any;
        name: any;
    };
    childLock: any;
    drivingWheel: any;
    monitorAirState: any;
    angleWakeup: any;
    efficiency: any;
    atmoLightIntensity: any;
    sysinfo: {
        load: any;
        uptime: any;
        signal: any;
        meminfo: any;
        pos: any;
    };
    blockTime: {
        from: any;
        to: any;
    };
    humidification: {
        enabled: any;
        level: any;
    };
    airFreshening: {
        enabled: any;
        level: any;
        error: any;
    };
    uvAirCleaning: {
        enabled: any;
    };
    areaPoint: {
        mapId: any;
        locationPoints: any;
    };
    airbotAutoModel: {
        enable: any;
        trigger: any;
        aq: {
            aqStart: any;
            aqEnd: any;
        };
    };
    currentTask: {
        type: any;
        triggerType: any;
        failed: any;
    };
    obstacleTypes: any;
    avoidedObstacles: any;
    OTA: {
        status: any;
        result: any;
        isForce: any;
        progress: any;
        supportAuto: any;
        ver: any;
    };
    timezone: string;
    dmodule: {
        enabled: any;
        status: any;
    };
    stationState: {
        type: any;
        state: any;
    };
    washInterval: any;
    aiCleanItemState: {
        items: any[];
        particleRemoval: any;
        petPoopPrevention: any;
    };
    stationInfo: {
        state: any;
        name: any;
        model: any;
        sn: any;
        wkVer: any;
    };
    multiMapState: any;
    evt: {};
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
    handleWashInterval(payload: any): void;
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
     * @param {Object} payload
     */
    handleAICleanItemState(payload: any): void;
    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See StationState for Deebot X1 series
     * @param {Object} payload
     */
    handleAirDryingState(payload: any): void;
    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload: any): void;
    handleCustomAreaMode(payload: any): void;
    /**
     * Handle the payload of the `SweepMode` response/message
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
     * Handle the payload of the `Sleep` response/message (sleep status)
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
     * @param {Object} payload
     */
    handleCarpetPressure(payload: any): void;
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
    handleAirQuality(payload: any): void;
    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleGetAiBlockPlate(payload: any): void;
    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * @param {Object} payload
     */
    handleGetMonitorAirState(payload: any): void;
    /**
     * Handle the payload of the 'AngleFollow' response/message
     * @param {Object} payload
     */
    handleGetAngleFollow(payload: any): void;
    /**
     * Handle the payload of the 'Mic' response/message
     * @param {Object} payload
     */
    handleGetMic(payload: any): void;
    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * @param {Object} payload
     */
    handleGetVoiceSimple(payload: any): void;
    voiceSimple: any;
    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleGetDrivingWheel(payload: any): void;
    /**
     * Handle the payload of the 'ChildLock' response/message
     * @param {Object} payload
     */
    handleGetChildLock(payload: any): void;
    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload: any): void;
    voiceAssistantState: any;
    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * @param {Object} payload
     */
    handleHumanoidFollow(payload: any): void;
    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * @param {Object} payload
     */
    handleGetAutonomousClean(payload: any): void;
    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * @param {Object} payload
     */
    handleGetBlueSpeaker(payload: any): void;
    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload: any): void;
    /**
     * Handle the payload of the 'Efficiency' response/message
     * @param {Object} payload
     */
    handleEfficiency(payload: any): void;
    /**
     * Handle the payload of the 'Efficiency' response/message
     * @param {Object} payload
     */
    handleGetAtmoLight(payload: any): void;
    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload: any): void;
    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload: any): void;
    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * @param {Object} payload
     */
    handleThreeModule(payload: any): void;
    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload: any): void;
    handleTask(type: any, payload: any): void;
    handleAudioCallState(event: any): void;
    handleDModule(payload: any): void;
}
import VacBot = require("../vacBot");
import mapTemplate = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map