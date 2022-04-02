export = VacBot_950type;
/**
 * This class is relevant for 950 type models
 * e.g. Deebot OZMO 920/950, (OZMO) T8 series, T9 series (which are all MQTT based models)
 */
declare class VacBot_950type extends VacBot {
    breakPoint: any;
    block: any;
    autoEmpty: any;
    advancedMode: any;
    trueDetect: any;
    dusterRemind: {
        enabled: any;
        period: any;
    };
    carpetPressure: any;
    volume: number;
    relocationState: any;
    firmwareVersion: any;
    /**
     * Handle the payload of the `CleanInfo` response/message
     * e.g. charge status, clean status and the last area values
     * @param {Object} payload
     */
    handleCleanReport(payload: any): void;
    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBatteryInfo(payload: any): void;
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
    handleDeebotPosition(payload: any): void;
    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleCleanSpeed(payload: any): void;
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
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload: any): void;
    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: any): void;
    handle_cleanLogs(payload: any): void;
    handle_cleanSum(payload: any): void;
    handle_relocationState(payload: any): void;
    handle_volume(payload: any): void;
    handle_breakPoint(payload: any): void;
    handle_block(payload: any): void;
    handle_autoEmpty(payload: any): void;
    handle_advancedMode(payload: any): void;
    handle_trueDetect(payload: any): void;
    handle_dusterRemind(payload: any): void;
    handle_carpetPressure(payload: any): void;
    handle_stats(payload: any): void;
    handle_Schedule(payload: any): void;
    handle_cachedMapInfo(payload: any): void;
    handle_mapSet(payload: any): {
        mapsetEvent: string;
        mapsetData?: undefined;
    } | {
        mapsetEvent: string;
        mapsetData: any;
    };
    handle_mapSubset(payload: any): Promise<{
        mapsubsetEvent: string;
        mapsubsetData: map.EcovacsMapSpotAreaInfo;
    } | {
        mapsubsetEvent: string;
        mapsubsetData: map.EcovacsMapVirtualBoundaryInfo;
    } | {
        mapsubsetEvent: string;
        mapsubsetData?: undefined;
    }>;
    handle_mapInfo(payload: any): Promise<any>;
    /**
     * @todo: finish the implementation
     * @param payload
     */
    handle_majorMap(payload: any): void;
    liveMapImage: map.EcovacsLiveMapImage;
    /**
     * @todo: finish the implementation
     * @param payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    handle_minorMap(payload: any): Promise<null | {
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    handle_ResponseError(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map