export = VacBot_950type;
declare class VacBot_950type extends VacBot {
    constructor(user: any, hostname: any, resource: any, secret: any, vacuum: any, continent: any, country?: string, server_address?: any);
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
    handle_lifespan(payload: any): void;
    handle_deebotPosition(payload: any): void;
    handle_cleanSpeed(payload: any): void;
    handle_netInfo(payload: any): void;
    handle_cleanReport(payload: any): void;
    handle_cleanLogs(payload: any): void;
    handle_cleanSum(payload: any): void;
    handle_batteryInfo(payload: any): void;
    handle_waterLevel(payload: any): void;
    handle_relocationState(payload: any): void;
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
    handle_majorMap(payload: any): void;
    liveMapImage: map.EcovacsLiveMapImage;
    handle_minorMap(payload: any): Promise<{
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    handle_waterInfo(payload: any): void;
    handle_volume(payload: any): void;
    handle_chargeState(payload: any): void;
    handle_sleepStatus(payload: any): void;
    handle_breakPoint(payload: any): void;
    handle_block(payload: any): void;
    handle_autoEmpty(payload: any): void;
    handle_advancedMode(payload: any): void;
    handle_trueDetect(payload: any): void;
    handle_dusterRemind(payload: any): void;
    handle_carpetPressure(payload: any): void;
    handle_stats(payload: any): void;
    handleResponseError(payload: any): void;
    handle_Schedule(payload: any): void;
}
import VacBot = require("../vacBot");
import map = require("../mapTemplate");
//# sourceMappingURL=vacBot.d.ts.map