export = VacBot_non950type;
/**
 * This class is relevant for non 950 type models
 * e.g. Deebot OZMO 930, (OZMO) 900 series (legacy models - some are MQTT based and the older ones are XMPP based)
 * @extends VacBot
 */
declare class VacBot_non950type extends VacBot {
    dustcaseInfo: any;
    mapPiecePacketsCrcArray: any;
    /**
     * Handle the payload of the clean report (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handle_cleanReport(payload: any): void;
    /**
     * Handle the payload of the battery status
     * @param {Object} payload
     */
    handle_batteryInfo(payload: any): void;
    /**
     * Handle the payload for the life span components
     * @param {Object} payload
     */
    handle_lifespan(payload: any): void;
    /**
     * Handle the payload for the position data
     * @param {Object} payload
     */
    handle_deebotPosition(payload: any): void;
    /**
     * Handle the payload for vacuum power resp. suction power ("clean speed")
     * @param {Object} payload
     */
    handle_cleanSpeed(payload: any): void;
    /**
     * Handle the payload for network related data
     * @param {Object} payload
     */
    handle_netInfo(payload: any): void;
    handle_waterLevel(payload: any): void;
    handle_cachedMapInfo(payload: any): Promise<{}>;
    handleMapExecuted: boolean;
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
    handle_mapInfo(payload: any): Promise<void>;
    handle_mapPiecePacket(payload: any): Promise<any>;
    handle_chargePosition(payload: any): void;
    handle_dustcaseInfo(payload: any): void;
    handle_waterboxInfo(payload: any): void;
    handle_sleepStatus(payload: any): void;
    handle_chargeState(payload: any): void;
    handle_cleanSum(payload: any): void;
    handle_cleanLogs(payload: any): void;
    handle_onOff(payload: any): void;
    handle_stats(payload: any): void;
    handle_getSched(payload: any): void;
    handle_ResponseError(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map