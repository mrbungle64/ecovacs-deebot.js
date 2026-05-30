/**
 * It represents a basic clean mode,
 * and it runs an auto clean command
 * @extends VacBotCommand
 */
export class Clean extends VacBotCommand {
    /**
     * @constructor
     * @param {string} [mode='auto'] - The mode for cleaning. Default is 'auto'
     * @param {string} [action='start'] - The action for cleaning. Default is 'start'
     * @param {Object} [kwargs={}] - Additional arguments in the form of key-value pairs
     * @return {void}
     */
    constructor(mode?: string, action?: string, kwargs?: Object);
}
/**
 * Similar to the `Clean` class but with a different payload structure
 * Used for most newer models than OZMO 920/950 (e.g. T8, T9, X1 series etc.)
 * @extends VacBotCommand
 */
export class Clean_V2 extends VacBotCommand {
    constructor(mode?: string, action?: string, kwargs?: {});
}
/**
 * Represents a 'Custom' area cleaning mode
 * @extends Clean
 */
export class CustomArea extends Clean {
    constructor(action?: string, area?: string, cleanings?: number);
}
/**
 * Represents a 'Custom' area cleaning mode
 * Similar to the `CustomArea` class but with a different payload structure
 * Used by newer models
 * @extends Clean_V2
 */
export class CustomArea_V2 extends Clean_V2 {
    constructor(area?: string, cleanings?: number, donotClean?: number);
}
/**
 * Represents a (spot) 'Area' cleaning mode
 * @extends Clean
 */
export class SpotArea extends Clean {
    constructor(action?: string, area?: string, cleanings?: number);
}
/**
 * Represents a (spot) 'Area' cleaning mode
 * Similar to the `SpotArea` class but with a different payload structure
 * Used by newer models
 * @extends Clean_V2
 */
export class SpotArea_V2 extends Clean_V2 {
    constructor(area?: string, cleanings?: number);
}
/**
 * Represents a (spot) 'Area' cleaning mode
 * Similar to the `SpotArea` class but with a different payload structure
 * Used by the X2 series
 * @extends Clean_V2
 */
export class FreeClean extends Clean_V2 {
    constructor(areaValues?: string);
}
/**
 * Represents a 'Hosted mode' cleaning
 * Used by newer models (e.g. X1 series)
 * With the X2 series it's not a separate mode anymore
 * (There's an option for AI based cleaning)
 * @extends Clean_V2
 */
export class HostedCleanMode extends Clean_V2 {
    constructor();
}
/**
 * Sends the device to a specific position
 * without cleaning ('go to position')
 * Used by newer models (e.g. T9 and X1 series)
 * @extends Clean_V2
 */
export class MapPoint_V2 extends Clean_V2 {
    constructor(area?: string);
}
/**
 * Represents the 'pause' function
 * For Airbot Z1 and Deebot X2 you have to use the `clean_V2` command
 * @extends VacBotCommand
 */
export class Pause extends VacBotCommand {
    constructor(command?: string);
}
/**
 * Represents the 'resume' function
 * @extends VacBotCommand
 */
export class Resume extends VacBotCommand {
    constructor(command?: string);
}
/**
 * Represents the 'stop' function
 * For Airbot Z1 and Deebot X2 you have to use the `clean_V2` command
 * @extends VacBotCommand
 */
export class Stop extends VacBotCommand {
    constructor(command?: string);
}
/**
 * Requests various information about the cleaning status
 * @extends VacBotCommand
 * TODO: Rename to `GetCleanInfo`
 */
export class GetCleanState extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload
     * @returns {{ state: string|number, trigger: string }}
     */
    parseResponse(payload: Object): {
        state: string | number;
        trigger: string;
    };
}
/**
 * Requests various information about the cleaning status
 * Similar to the `GetCleanState` class
 * Used by newer models
 * @extends VacBotCommand
 * TODO: Rename to `GetCleanInfo_V2`
 */
export class GetCleanState_V2 extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload - The raw clean info payload
     * @returns {{ state: string, raw: Object }}
     */
    parseResponse(payload: Object): {
        state: string;
        raw: Object;
    };
}
/**
 * Requests the 'Suction Power' level
 * @extends VacBotCommand
 */
export class GetCleanSpeed extends VacBotCommand {
    constructor();
    /** @param {{ speed: number }} payload @returns {number} */
    parseResponse(payload: {
        speed: number;
    }): number;
}
/**
 * Sets the 'Suction Power' level
 * @extends VacBotCommand
 */
export class SetCleanSpeed extends VacBotCommand {
    constructor(level: any);
}
/**
 * Requests the `Mopping Mode` (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetCustomAreaMode extends VacBotCommand {
    constructor();
    /** @param {{ sweepMode?: number }} payload @returns {number|null} */
    parseResponse(payload: {
        sweepMode?: number;
    }): number | null;
}
/**
 * Sets the 'Mopping Mode'/'Efficiency' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetCustomAreaMode extends VacBotCommand {
    constructor(sweepMode?: number);
}
/**
 * Request various information about the current/last cleaning
 * @extends VacBotCommand
 * TODO: potential duplicate of GetTotalStats (info.js)
 */
export class GetCleanSum extends VacBotCommand {
    constructor();
    /**
     * @param {{ area: number, time: number, count: number }} payload
     * @returns {{ totalSquareMeters: number, totalSeconds: number, totalNumber: number }}
     */
    parseResponse(payload: {
        area: number;
        time: number;
        count: number;
    }): {
        totalSquareMeters: number;
        totalSeconds: number;
        totalNumber: number;
    };
}
/**
 * Request information about the (spot) areas
 * @extends GetMapSet
 */
export class GetMapSpotAreas extends GetMapSet {
    constructor(mapID: any);
}
/**
 * Request information * about the (spot) areas for newer models (e.g. X1 series)
 * @extends GetMapSet_V2
 */
export class GetMapSpotAreas_V2 extends GetMapSet_V2 {
    constructor(mapID: any);
}
/**
 * Request information about a (spot) area
 * @extends GetMapSubSet
 */
export class GetMapSpotAreaInfo extends GetMapSubSet {
    constructor(mapID: any, mapSubSetID: any);
}
/**
 * Request information if the 'Continuous Cleaning'/'Resumed clean' option is enabled
 * @extends VacBotCommand
 */
export class GetContinuousCleaning extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Sets the value for 'Continuous Cleaning'/'Resumed clean' option
 * @extends VacBotCommand
 */
export class SetContinuousCleaning extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Request the number of cleaning repetitions ('Cleaning Times')
 * @extends VacBotCommand
 */
export class GetCleanCount extends VacBotCommand {
    constructor();
    /** @param {{ count: number }} payload @returns {number} */
    parseResponse(payload: {
        count: number;
    }): number;
}
/**
 * Sets the number of cleaning repetitions ('Cleaning Times')
 * @extends VacBotCommand
 */
export class SetCleanCount extends VacBotCommand {
    constructor(count?: number);
}
/**
 * Request information if the 'Cleaning Preference' mode is enabled
 * @extends VacBotCommand
 */
export class GetCleanPreference extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Sets the value whether the 'Cleaning Preference' mode is enabled
 * @extends VacBotCommand
 */
export class SetCleanPreference extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Receive information if the 'Strategic Particle Removal'
 * and the 'Strategic Pet Poop Avoidance' mode is enabled (e.g. X1 series)
 */
export class GetAICleanItemState extends VacBotCommand {
    constructor();
    /**
     * @param {{ items?: Array }} payload
     * @returns {{ items: Array, particleRemoval: boolean, petPoopPrevention: boolean }|null}
     */
    parseResponse(payload: {
        items?: any[];
    }): {
        items: any[];
        particleRemoval: boolean;
        petPoopPrevention: boolean;
    } | null;
}
/**
 * Start und Stop 'Mopping Pads Cleaning' (e.g. X1 series)
 * @extends Clean_V2
 */
export class Washing extends Clean_V2 {
    constructor(action?: string);
}
/**
 * Starts an 'Area' cleaning
 * The areas have to be set via 'SetMapSet_V2' command
 * @extends Clean_V2
 */
export class Area_V2 extends Clean_V2 {
    constructor();
}
/**
 * Starts an 'Spot' cleaning at the given position
 * @extends Clean_V2
 */
export class SinglePoint_V2 extends Clean_V2 {
    constructor(spotCoordinates?: string);
}
/**
 * Requests the enabled state
 * of the 'Self-linked Purification' function
 * @extends VacBotCommand
 */
export class GetAutonomousClean extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Sets the enabled state
 * of the 'Self-linked Purification' function
 * @extends VacBotCommand
 */
export class SetAutonomousClean extends VacBotCommand {
    constructor(on?: number);
}
/**
 * Sets the 'Sanitization' state
 * of the 'UV Sanitizer' module
 *
 * @extends SetThreeModule
 * @constructor
 * @param {number} [enable=0] - The enable state
 */
export class SetUVCleaner extends SetThreeModule {
    constructor(enable?: number);
}
export class GetAreaPoint extends VacBotCommand {
    constructor(mid: any);
}
/**
 * 'Edge' cleaning mode
 * Used by models with Random navigation (e.g. U2 series)
 * @deprecated
 * @extends Clean
 */
export class Edge extends Clean {
    constructor();
}
/**
 * 'Spot' cleaning mode
 * Used by models with Random navigation (e.g. U2 series)
 * @deprecated
 * @extends Clean
 */
export class Spot extends Clean {
    constructor();
}
/**
 * Represents a 'Clean Area' command (e.g., spotArea or customArea)
 * @extends VacBotCommand
 */
export class CleanArea extends VacBotCommand {
    /**
     * @constructor
     * @param {string} mode - 'spotArea' or 'customArea'
     * @param {string|Array<number|string>} area - area IDs or coordinates
     * @param {number} [cleanings=1] - number of cleaning iterations
     */
    constructor(mode: string, area: string | Array<number | string>, cleanings?: number);
}
/**
 * Represents a 'Clean Area' command V2 (newer models)
 * @extends VacBotCommand
 */
export class CleanArea_V2 extends VacBotCommand {
    /**
     * @constructor
     * @param {string} mode - 'spotArea' or 'customArea'
     * @param {string|Array<number|string>} area - area IDs or coordinates
     */
    constructor(mode: string, area: string | Array<number | string>);
}
/**
 * Requests the clean state/info V2
 * @extends VacBotCommand
 */
export class GetCleanInfoV2 extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload - The raw clean info payload
     * @returns {{ state: string, raw: Object }}
     */
    parseResponse(payload: Object): {
        state: string;
        raw: Object;
    };
}
import { VacBotCommand } from "./base";
import { GetMapSet } from "./map";
import { GetMapSet_V2 } from "./map";
import { GetMapSubSet } from "./map";
import { SetThreeModule } from "./settings";
//# sourceMappingURL=clean.d.ts.map