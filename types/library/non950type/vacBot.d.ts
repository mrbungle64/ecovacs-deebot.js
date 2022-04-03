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
    handlePos(payload: any): void;
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
    handleChargePos(payload: any): void;
    /**
     * Handle the payload of the `DustCaseST` response/message (dust case status)
     * @param {Object} payload
     */
    handleDustCaseST(payload: any): void;
    /**
     * Handle the payload of the `SleepStatus` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: any): void;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: any): void;
    /**
     * Handle the payload of the `CleanSum` response/message
     * @param {Object} payload
     */
    handleCleanSum(payload: any): void;
    /**
     * Handle the payload of the `OnOff` response/message
     * (do_not_disturb, continuous_cleaning, silence_voice_report)
     * @param {Object} payload
     */
    handleOnOff(payload: any): void;
    /**
     * Handle the payload of the `CleanSt` response/message (Stats)
     * @param {Object} payload
     */
    handleCleanSt(payload: any): void;
    /**
     * Handle the payload of the `Sched` response/message
     * @param {Object} payload
     */
    handleSched(payload: any): void;
    /**
     * Handle the payload for the map info data
     * (see also `CachedMapInfo` for non 950 type)
     * @param {Object} payload
     */
    handleMapM(payload: any): Promise<{}>;
    handleMapExecuted: boolean;
    /**
     * Handle the payload of the `MapSet` response/message
     * @param {Object} payload
     */
    handleMapSet(payload: any): {
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
     * Handle the payload of the `PullM` response/message
     * (see also `MapSubset` for non 950 type)
     * @param {Object} payload
     */
    handlePullM(payload: any): Promise<{
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
     * Handle the payload for the map image
     * triggered by the `handleMapM` response/message
     * (see also `MapInfo` for non 950 type)
     * @param {Object} payload
     */
    handleMapInfo(payload: any): Promise<void>;
    /**
     * Handle the payload of the `PullMP` response/message (map piece packet)
     * @param {Object} payload
     */
    handlePullMP(payload: any): Promise<any>;
    /**
     * Handle the payload of the `Error` response/message
     * @param {Object} payload
     */
    handleResponseError(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map