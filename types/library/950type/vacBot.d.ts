export = VacBot_950type;
/**
 * This class is relevant for 950 type models
 * e.g. Deebot OZMO 920/950, T8 series, T9 series (which are all MQTT based models)
 */
declare class VacBot_950type extends VacBot {
    breakPoint: any;
    block: any;
    autoEmpty: any;
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
    airQuality: {
        particulateMatter25: any;
        pm_10: any;
        particulateMatter10: any;
        airQualityIndex: any;
        volatileOrganicCompounds: any;
        temperature: any;
        humidity: any;
    };
    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload: any): void;
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
    * Handle the payload of the `AirDring` response/message (air drying status)
    * @param {Object} payload
    */
    handleAirDryingState(payload: any): void;
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
     * Handle the payload of the `AutoEmpty` response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload: any): void;
    /**
     * Handle the payload of the `AdvancedMode` response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload: any): void;
    /**
     * Handle the payload of the `TrueDetect` response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload: any): void;
    /**
     * Handle the payload of the `CleanCount` response/message
     * @param {Object} payload
     */
    handleCleanCount(payload: any): void;
    /**
     * Handle the payload of the `DusterRemind` response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload: any): void;
    /**
     * Handle the payload of the `CarpertPressure` (sic) response/message
     * @param {Object} payload
     */
    handleCarpetPressure(payload: any): void;
    handleCleanPreference(payload: any): void;
    handleLiveLaunchPwdState(payload: any): void;
    /**
     * Handle the payload of the `Stats` response/message
     * @param {Object} payload
     */
    handleStats(payload: any): void;
    /**
     * Handle the payload of the `Sched` response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload: any): void;
    /**
     * Handle the payload of the `CachedMapInfo` response/message
     * @param {Object} payload
     */
    handleCachedMapInfo(payload: any): void;
    /**
     * Handle the payload of the `MapInfo_V2` response/message
     * @param {Object} payload
     */
    handleMapInfoV2(payload: any): void;
    /**
     * Handle the payload of the `MapSet` response/message
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
     * Handle the payload of the `MapSubSet` response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapSubset(payload: any): Promise<any>;
    /**
     * Handle the payload of the `MapInfo` response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapInfo(payload: any): Promise<any>;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload: any): void;
    liveMapImage: map.EcovacsLiveMapImage;
    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    handleMinorMap(payload: any): Promise<null | {
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    /**
     * Handle the payload of the `Error` response/message
     * @param {Object} payload
     */
    handleResponseError(payload: any): void;
    handleAirQuality(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map