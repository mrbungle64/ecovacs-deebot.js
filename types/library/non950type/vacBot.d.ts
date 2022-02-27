export = VacBot_non950type;
declare class VacBot_non950type extends VacBot {
    constructor(user: any, hostname: any, resource: any, secret: any, vacuum: any, continent: any, country?: string, server_address?: any);
    dustcaseInfo: any;
    mapPiecePacketsCrcArray: any;
    handle_lifespan(payload: any): void;
    handle_netInfo(payload: any): void;
    handle_cleanReport(payload: any): void;
    handle_cleanSpeed(payload: any): void;
    handle_batteryInfo(payload: any): void;
    handle_waterLevel(payload: any): void;
    handle_cachedMapInfo(payload: any): Promise<any>;
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
    handle_deebotPosition(payload: any): void;
    handle_chargePosition(payload: any): void;
    handle_dustcaseInfo(payload: any): void;
    handle_waterboxInfo(payload: any): void;
    handle_sleepStatus(payload: any): void;
    handle_chargeState(payload: any): void;
    handle_cleanSum(payload: any): void;
    handle_cleanLogs(payload: any): void;
    handle_onOff(payload: any): void;
    handle_stats(payload: any): void;
    handleResponseError(payload: any): void;
    handle_getSched(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map