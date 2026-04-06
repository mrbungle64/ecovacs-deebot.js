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
    handleCleanReport(payload: Object): void;
    /**
     * Handle the values for `currentStats`
     * @param {number} area - number of square meters
     * @param {number} seconds - number of seconds
     * @param {string} cleanType - the clean mode type
     * @param {string} [type=''] - the action type
     */
    handleCurrentStatsValues(area: number, seconds: number, cleanType: string, type?: string): void;
    /**
     * Handle the payload of the `CleanSt` response/message (Stats)
     * @param {Object} payload
     */
    handleCleanSt(payload: Object): void;
    /**
     * @param {Object} payload
     */
    handleCurrentAreaValues(payload: Object): void;
    /**
     * Handle the payload of the `BatteryInfo` response/message (battery level)
     * @param {Object} payload
     */
    handleBatteryInfo(payload: Object): void;
    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload: Object): void;
    /**
     * Handle the payload of the `Pos` response/message
     * (position of the vacuum and the charging station)
     * @param {Object} payload
     */
    handlePos(payload: Object): void;
    /**
     * Handle the payload of the `CleanSpeed` response/message
     * (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleCleanSpeed(payload: Object): void;
    /**
     * Handle the payload of the `NetInfo` response/message
     * (ip address and Wi-Fi ssid)
     * @param {Object} payload
     */
    handleNetInfo(payload: Object): void;
    /**
     * Handle the payload of the `WaterPermeability` response/message (water level)
     * @param {Object} payload
     */
    handleWaterPermeability(payload: Object): void;
    /**
     * Handle the payload of the `WaterBoxInfo` response/message (water tank status)
     * @param {Object} payload
     */
    handleWaterboxInfo(payload: Object): void;
    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload: Object): void;
    /**
     * Handle the payload of the `ChargerPos` response/message
     * (charger resp. charge position)
     * @param {Object} payload
     */
    handleChargePos(payload: Object): void;
    /**
     * Handle the payload of the `DustCaseST` response/message (dust case status)
     * @param {Object} payload
     */
    handleDustCaseST(payload: Object): void;
    /**
     * Handle the payload of the `SleepStatus` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload: Object): void;
    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload: Object): void;
    /**
     * Handle the payload of the `CleanSum` response/message
     * @param {Object} payload
     */
    handleCleanSum(payload: Object): void;
    /**
     * Handle the payload of the `OnOff` response/message
     * (do not disturb, continuous cleaning, voice report)
     * @param {Object} payload
     */
    handleOnOff(payload: Object): void;
    /**
     * Handle the payload of the `Sched` response/message
     * @param {Object} payload
     */
    handleSched(payload: Object): void;
    /**
     * Handle the payload for `MapM` response/message
     * (see also `CachedMapInfo` for non 950 type)
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handleMapM(payload: Object): Promise<Object>;
    handleMapExecuted: boolean | undefined;
    /**
     * Handle the payload of the `MapSet` response/message
     * @param {Object} payload
     */
    handleMapSet(payload: Object): {
        mapsetEvent: string;
        mapsetData: any;
    } | {
        mapsetEvent: string;
        mapsetData?: undefined;
    };
    /**
     * Handle the payload of the `PullM` response/message
     * (see also `MapSubset` for non 950 type)
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handlePullM(payload: Object): Promise<Object>;
    /**
     * Handle the payload for the map image
     * triggered by the `handleMapM` response/message
     * (see also `MapInfo` for non 950 type)
     * @param {Object} payload
     * @returns {Promise<void>}
     */
    handleMapInfo(payload: Object): Promise<void>;
    /**
     * Handle the payload of the `PullMP` response/message (map piece packet)
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    handlePullMP(payload: Object): Promise<Object>;
    /**
     * Handle the payload of the `Error` response/message
     * @param {Object} payload
     */
    handleResponseError(payload: Object): void;
    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command: string, ...args: any[]): void;
}
import VacBot = require("../vacBot");
//# sourceMappingURL=vacBot.d.ts.map