export = VacBot_non950type;
/**
 * This class is relevant for non 950 type models
 * e.g. Deebot OZMO 930, (OZMO) 900 series (legacy models - some are MQTT based and the older ones are XMPP based)
 */
declare class VacBot_non950type extends VacBot {
    dustcaseInfo: any;
    mapPiecePacketsCrcArray: any;
    /**
     * Handle the payload of the `CleanReport` response/message
     * e.g. charge status, clean status and the last area values
     * @param {Object} payload
     */
    handleCleanReport(payload: any): void;
    /**
     * Handle the payload of the `BatteryInfo` response/message (battery level)
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
     * (position of the vacuum and the charging station)
     * @param {Object} payload
     */
    handleDeebotPosition(payload: any): void;
    /**
     * Handle the payload of the `CleanSpeed` response/message
     * (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleCleanSpeed(payload: any): void;
    /**
     * Handle the payload of the `NetInfo` response/message
     * (ip address and Wi-Fi ssid)
     * @param {Object} payload
     */
    handleNetInfo(payload: any): void;
    /**
     * Handle the payload of the `WaterPermeability` response/message (water level)
     * @param {Object} payload
     */
    handleWaterPermeability(payload: any): void;
    /**
     * Handle the payload of the `WaterBoxInfo` response/message (water tank status)
     * @param {Object} payload
     */
    handleWaterboxInfo(payload: any): void;
    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload: any): void;
    /**
     * Handle the payload of the `ChargerPos` response/message
     * (charger resp. charge position)
     * @param {Object} payload
     */
    handleChargePosition(payload: any): void;
    /**
     * Handle the payload of the `DustCaseST` response/message (dust case status)
     * @param {Object} payload
     */
    handleDustcaseInfo(payload: any): void;
    /**
     * Handle the payload of the `SleepStatus` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: any): void;
    /**
     *
     * @param {Object} payload
     */
    handle_cleanSum(payload: any): void;
    /**
     *
     * @param {Object} payload
     */
    handle_cleanLogs(payload: any): void;
    /**
     *
     * @param {Object} payload
     */
    handle_onOff(payload: any): void;
    /**
     *
     * @param {Object} payload
     */
    handle_stats(payload: any): void;
    /**
     *
     * @param {Object} payload
     */
    handle_getSched(payload: any): void;
    /**
     * Handle the payload for the map info data (CachedMapInfo)
     * @param {Object} payload
     */
    handle_cachedMapInfo(payload: any): Promise<{}>;
    handleMapExecuted: boolean;
    /**
     *
     * @param {Object} payload
     */
    handle_mapSet(payload: any): {
        mapsetEvent: string;
        mapsetData: map.EcovacsMapSpotAreas;
    } | {
        mapsetEvent: string;
        mapsetData: map.EcovacsMapVirtualBoundaries;
    } | {
        mapsetEvent: string;
        mapsetData?: undefined;
    };
    /**
     *
     * @param {Object} payload
     */
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
    /**
     *
     * @param {Object} payload
     */
    handle_mapInfo(payload: any): Promise<void>;
    /**
     *
     * @param {Object} payload
     */
    handle_mapPiecePacket(payload: any): Promise<any>;
    /**
     *
     * @param {Object} payload
     */
    handle_ResponseError(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map