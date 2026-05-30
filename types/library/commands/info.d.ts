/**
 * Requests information about the battery level
 * @extends VacBotCommand
 */
export class GetBatteryState extends VacBotCommand {
    /**
     * Parses the raw `Battery` protocol payload into a normalized result object.
     * Used both by `parseResponse()` (for `runAsync()`) and by `BotState.handleBattery()`
     * (for MQTT push events) to ensure a single source of truth.
     * @param {{ value: number, isLow?: number }} payload
     * @returns {{ level: number, isLow: boolean }}
     */
    static parse(payload: {
        value: number;
        isLow?: number;
    }): {
        level: number;
        isLow: boolean;
    };
    constructor();
    /**
     * @param {{ value: number, isLow?: number }} payload
     * @returns {{ level: number, isLow: boolean }}
     */
    parseResponse(payload: {
        value: number;
        isLow?: number;
    }): {
        level: number;
        isLow: boolean;
    };
}
/**
 * Requests information about the consumable components
 * You can specify the components or
 * send an empty array to request information for all components
 * (not sure if the empty array works for all models)
 * @extends VacBotCommand
 */
export class GetLifeSpan extends VacBotCommand {
    /**
     * @param {Array} componentsArray - An optional array of components
     */
    constructor(componentsArray?: any[]);
    /**
     * @param {Array} payload
     * @returns {Object}
     */
    parseResponse(payload: any[]): Object;
}
/**
 * Requests the 'Error' messages
 * In most cases it doesn't respond (if there's no error)
 * @extends VacBotCommand
 */
export class GetError extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload
     * @returns {{ code: number, description: string }}
     */
    parseResponse(payload: Object): {
        code: number;
        description: string;
    };
}
/**
 * Requests the 'Water Flow Level'
 * @extends VacBotCommand
 */
export class GetWaterInfo extends VacBotCommand {
    constructor();
    /**
     * @param {{ amount: number, enable: number, type?: number, sweepType?: number }} payload
     * @returns {{ waterLevel: number, waterboxInfo: number, moppingType?: number, scrubbingType?: number }}
     */
    parseResponse(payload: {
        amount: number;
        enable: number;
        type?: number;
        sweepType?: number;
    }): {
        waterLevel: number;
        waterboxInfo: number;
        moppingType?: number;
        scrubbingType?: number;
    };
}
/**
 * Requests information about the connected network and Wi-Fi
 * @extends VacBotCommand
 */
export class GetNetInfo extends VacBotCommand {
    constructor();
    /**
     * @param {{ ip?: string, wi?: string, ssid?: string, s?: string, rssi?: number, st?: number, mac?: string, wm?: string }} payload
     * @returns {{ ip: string, wifiSSID: string, wifiSignal: number, mac: string }}
     */
    parseResponse(payload: {
        ip?: string;
        wi?: string;
        ssid?: string;
        s?: string;
        rssi?: number;
        st?: number;
        mac?: string;
        wm?: string;
    }): {
        ip: string;
        wifiSSID: string;
        wifiSignal: number;
        mac: string;
    };
}
/**
 * Request information about if the bot is
 * in (energy saving) sleeping mode
 * @extends VacBotCommand
 */
export class GetSleepStatus extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Request the volume value
 * @extends VacBotCommand
 */
export class GetVolume extends VacBotCommand {
    constructor();
    /** @param {{ volume: number }} payload @returns {number} */
    parseResponse(payload: {
        volume: number;
    }): number;
}
/**
 * Request information if the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
export class GetAutoEmpty extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number, status?: number }} payload
     * @returns {{ enabled: boolean, status?: number }}
     */
    parseResponse(payload: {
        enable: number;
        status?: number;
    }): {
        enabled: boolean;
        status?: number;
    };
}
/**
 * Represents a command to empty the dust bin
 * of the Auto Empty Station
 * @extends VacBotCommand
 * TODO: potential duplicate of SetAutoEmpty (settings.js)
 */
export class EmptyDustBin extends VacBotCommand {
    constructor();
}
/**
 * Empty dust bin (e.g. T20 series)
 * `EmptyDustBinSA` = 'EmptyDustBinStationAction'
 * @extends VacBotCommand
 * TODO: potential duplicate of StationAction (settings.js)
 */
export class EmptyDustBinSA extends VacBotCommand {
    constructor();
}
/**
 * Request information if the 'Do Not Disturb' option is enabled
 * @extends VacBotCommand
 */
export class GetDoNotDisturb extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number, start?: string, end?: string }} payload
     * @returns {{ enabled: boolean, blockTime?: { from: string, to: string } }}
     */
    parseResponse(payload: {
        enable: number;
        start?: string;
        end?: string;
    }): {
        enabled: boolean;
        blockTime?: {
            from: string;
            to: string;
        };
    };
}
/**
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class GetAdvancedMode extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
export class GetRecognization extends VacBotCommand {
    constructor();
    /**
     * @param {{ state: number|boolean }} payload
     * @returns {boolean}
     */
    parseResponse(payload: {
        state: number | boolean;
    }): boolean;
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetTrueDetect extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number }} payload
     * @returns {boolean}
     */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
export class GetDusterRemind extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number, period: number }} payload
     * @returns {{ enabled: boolean, period: number }}
     */
    parseResponse(payload: {
        enable: number;
        period: number;
    }): {
        enabled: boolean;
        period: number;
    };
}
/**
 * Request the value whether the 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
export class GetCarpetPressure extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
export class GetCarpetInfo extends VacBotCommand {
    constructor();
    /** @param {{ mode: number }} payload @returns {number} */
    parseResponse(payload: {
        mode: number;
    }): number;
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. the state of 'Air Drying', 'Mopping Pads Cleaning' etc.
 * @extends VacBotCommand
 */
export class GetStationState extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload
     * @returns {{ type: number, state: number, isAirDrying: boolean, isSelfCleaning: boolean, isActive: boolean }}
     */
    parseResponse(payload: Object): {
        type: number;
        state: number;
        isAirDrying: boolean;
        isSelfCleaning: boolean;
        isActive: boolean;
    };
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. model, firmware etc.
 * @extends VacBotCommand
 */
export class GetStationInfo extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload
     * @returns {{ state: number|string, name: string, model: string, sn: string, wkVer: string }}
     */
    parseResponse(payload: Object): {
        state: number | string;
        name: string;
        model: string;
        sn: string;
        wkVer: string;
    };
}
/**
 * Receive the value of the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetWashInterval extends VacBotCommand {
    constructor();
    /** @param {{ interval: number }} payload @returns {number} */
    parseResponse(payload: {
        interval: number;
    }): number;
}
/**
 * Request the value whether hot water
 * is used for cleaning the mopping pads (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWashInfo extends VacBotCommand {
    constructor();
    /**
     * @param {{ mode: number }} payload
     * @returns {number}
     */
    parseResponse(payload: {
        mode: number;
    }): number;
}
/**
 * Receive the value if 'Air Drying' is active (Yeedi Mop Station)
 * The typo in 'AirDring' is intended
 * @extends VacBotCommand
 */
export class GetAirDrying extends VacBotCommand {
    constructor();
    /**
     * @param {{ status: number|string }} payload
     * @returns {string|null}
     */
    parseResponse(payload: {
        status: number | string;
    }): string | null;
}
/**
 * Start und Stop 'Air Drying' (e.g. X1 series)
 * 1 = start
 * 4 = stop
 * @extends VacBotCommand
 */
export class Drying extends VacBotCommand {
    constructor(act: any);
}
export class GetDryingDuration extends VacBotCommand {
    constructor();
    /**
     * @param {{ duration: number }} payload
     * @returns {number}
     */
    parseResponse(payload: {
        duration: number;
    }): number;
}
/**
 * Requests the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetBorderSpin extends VacBotCommand {
    constructor();
    /** @param {{ enable: number, type: number }} payload @returns {boolean|null} */
    parseResponse(payload: {
        enable: number;
        type: number;
    }): boolean | null;
}
/**
 * Requests the value whether the 'Border Switch' is enabled
 * @extends VacBotCommand
 */
export class GetBorderSwitch extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Requests information about the Firmware
 * and 'Over The Air' updates (e.g. X1 series, Airbot Z1)
 * (e.g. version, status, progress)
 * @extends VacBotCommand
 */
export class GetOta extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload
     * @returns {{ supportAuto: boolean, autoSwitch: boolean, version: string, status: string, progress: string|number }}
     */
    parseResponse(payload: Object): {
        supportAuto: boolean;
        autoSwitch: boolean;
        version: string;
        status: string;
        progress: string | number;
    };
}
/**
 * Request the current relocation state
 * @extends VacBotCommand
 */
export class GetRelocationState extends VacBotCommand {
    constructor();
    /**
     * @param {{ state: string }} payload
     * @returns {{ status: Object, state: string }}
     */
    parseResponse(payload: {
        state: string;
    }): {
        status: Object;
        state: string;
    };
}
/**
 * Requests the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetSweepMode extends VacBotCommand {
    constructor();
    /**
     * @param {{ type: number }} payload
     * @returns {boolean}
     */
    parseResponse(payload: {
        type: number;
    }): boolean;
}
/**
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetVoiceAssistantState extends VacBotCommand {
    constructor();
    /** @param {{ enable?: number, state?: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable?: number;
        state?: number;
    }): boolean;
}
/**
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWorkMode extends VacBotCommand {
    constructor();
    /**
     * @param {{ mode: number }} payload
     * @returns {number}
     */
    parseResponse(payload: {
        mode: number;
    }): number;
}
/**
 * Request information about the work status
 * @extends VacBotCommand
 */
export class GetWorkState extends VacBotCommand {
    constructor();
    /** @param {{ state: number }} payload @returns {number} */
    parseResponse(payload: {
        state: number;
    }): number;
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * @extends VacBotCommand
 */
export class GetSchedule extends VacBotCommand {
    constructor();
    /** @param {Object} payload @returns {Array} */
    parseResponse(payload: Object): any[];
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * Used by newer models
 * @extends VacBotCommand
 */
export class GetSchedule_V2 extends VacBotCommand {
    constructor();
}
/**
 * Request information about the total stats
 * total square meters ('area'), total seconds ('time'), total number ('count')
 * @extends VacBotCommand
 * TODO: potential duplicate of GetCleanSum (clean.js)
 */
export class GetTotalStats extends VacBotCommand {
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
 * Request information about the stats
 * @extends VacBotCommand
 */
export class GetStats extends VacBotCommand {
    constructor();
    /**
     * @param {{ area: number, time: number, type: string }} payload
     * @returns {{ cleanedArea: number, cleanedSeconds: number, cleanType: string }}
     */
    parseResponse(payload: {
        area: number;
        time: number;
        type: string;
    }): {
        cleanedArea: number;
        cleanedSeconds: number;
        cleanType: string;
    };
}
/**
 * Request information about the
 * 'Customized Scenario Cleaning' scenarios (T20, X2 series)
 *
 * @extends VacBotCommand
 */
export class GetQuickCommand extends VacBotCommand {
    constructor(type?: string);
}
/**
 * Request the 'WiFi List'
 * @extends VacBotCommand
 */
export class GetWifiList extends VacBotCommand {
    constructor();
    /** @param {{ list: Array }} payload @returns {Array} */
    parseResponse(payload: {
        list: any[];
    }): any[];
}
/**
 * Air quality (Z1 Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetJCYAirQuality extends VacBotCommand {
    constructor();
    /**
     * Same structure as GetAirQuality — normalized into the same shape.
     * @param {Object} payload
     * @returns {{ particulateMatter25: number, particulateMatter10: number, airQualityIndex: number, volatileOrganicCompounds: number, temperature: number, humidity: number }}
     */
    parseResponse(payload: Object): {
        particulateMatter25: number;
        particulateMatter10: number;
        airQualityIndex: number;
        volatileOrganicCompounds: number;
        temperature: number;
        humidity: number;
    };
}
/**
 * Air quality (Airbot Z1)
 * @extends VacBotCommand
 */
export class GetAirQuality extends VacBotCommand {
    constructor();
    /**
     * @param {Object} payload
     * @returns {{ particulateMatter25: number, particulateMatter10: number, airQualityIndex: number, volatileOrganicCompounds: number, temperature: number, humidity: number }}
     */
    parseResponse(payload: Object): {
        particulateMatter25: number;
        particulateMatter10: number;
        airQualityIndex: number;
        volatileOrganicCompounds: number;
        temperature: number;
        humidity: number;
    };
}
/**
 * Requests an object with data
 * for the 'Linked Purification' function
 * (linked to Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetAirbotAutoModel extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number, trigger: string, aq?: { aqStart: number, aqEnd: number } }} payload
     * @returns {{ enable: number, trigger: string, aq?: { aqStart: number, aqEnd: number } }|null}
     */
    parseResponse(payload: {
        enable: number;
        trigger: string;
        aq?: {
            aqStart: number;
            aqEnd: number;
        };
    }): {
        enable: number;
        trigger: string;
        aq?: {
            aqStart: number;
            aqEnd: number;
        };
    } | null;
}
/**
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
export class GetAngleFollow extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
export class GetAtmoLight extends VacBotCommand {
    constructor();
    /** @param {{ intensity: number }} payload @returns {number} */
    parseResponse(payload: {
        intensity: number;
    }): number;
}
/**
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
export class GetAtmoVolume extends VacBotCommand {
    constructor();
    /** @param {{ volume: number }} payload @returns {number} */
    parseResponse(payload: {
        volume: number;
    }): number;
}
/**
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
export class GetBlueSpeaker extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number, time: number, name: string }} payload
     * @returns {{ enabled: boolean, time: number, name: string }}
     */
    parseResponse(payload: {
        enable: number;
        time: number;
        name: string;
    }): {
        enabled: boolean;
        time: number;
        name: string;
    };
}
/**
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
export class GetChildLock extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Request the enabled state for 'DrivingWheel'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetDrivingWheel extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Request the enabled state of the
 * 'Lab Features' => 'Follow Me'
 * @extends VacBotCommand
 */
export class GetHumanoidFollow extends VacBotCommand {
    constructor();
    /**
     * @param {{ video: number, yiko: number }} payload
     * @returns {{ video: boolean, yiko: boolean }}
     */
    parseResponse(payload: {
        video: number;
        yiko: number;
    }): {
        video: boolean;
        yiko: boolean;
    };
}
/**
 * Request the Live Launch password state
 * Used by the Video Manager
 * @extends VacBotCommand
 */
export class GetLiveLaunchPwdState extends VacBotCommand {
    constructor();
    /**
     * @param {{ state: string, hasPwd: boolean }} payload
     * @returns {{ state: string, hasPwd: boolean }}
     */
    parseResponse(payload: {
        state: string;
        hasPwd: boolean;
    }): {
        state: string;
        hasPwd: boolean;
    };
}
/**
 * Request the enabled state of the microphone
 * @extends VacBotCommand
 */
export class GetMic extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Request the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
export class GetMonitorAirState extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Request various information about the 'Purification Scenario'
 * @extends VacBotCommand
 */
export class GetScene extends VacBotCommand {
    constructor();
}
/**
 * Request data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModule extends VacBotCommand {
    constructor();
    /**
     * Returns the raw payload (UV, Humidifier, AirFreshener levels).
     * Structure varies by module configuration.
     * @param {Object} payload
     * @returns {Object}
     */
    parseResponse(payload: Object): Object;
}
/**
 * Request status data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModuleStatus extends VacBotCommand {
    constructor();
    /**
     * Returns the raw working status payload (UV, Humidifier, AirFreshener).
     * @param {Object} payload
     * @returns {Object}
     */
    parseResponse(payload: Object): Object;
}
/**
 * Request the 'Time Zone' value
 * @extends VacBotCommand
 */
export class GetTimeZone extends VacBotCommand {
    constructor();
    /** @param {{ tz: string }} payload @returns {string} */
    parseResponse(payload: {
        tz: string;
    }): string;
}
/**
 * Request enabled state for the 'VoiceLifeRemindState'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetVoiceLifeRemindState extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Request enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
export class GetVoiceSimple extends VacBotCommand {
    constructor();
    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload: {
        on: number;
    }): boolean;
}
/**
 * Request whether the robot mops across map borders (e.g. X1)
 * @extends VacBotCommand
 */
export class GetCrossMapBorderWarning extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Request the cut direction value (Lawn Mower)
 * @extends VacBotCommand
 */
export class GetCutDirection extends VacBotCommand {
    constructor();
    /** @param {{ angle: number }} payload @returns {number} */
    parseResponse(payload: {
        angle: number;
    }): number;
}
/**
 * Request information about the 'Fan Speed'
 * @extends VacBotCommand
 */
export class GetFanSpeed extends VacBotCommand {
    constructor();
    /** @param {{ speed: number }} payload @returns {number} */
    parseResponse(payload: {
        speed: number;
    }): number;
}
/**
 * Request whether the 'Move Up Warning' is enabled
 * @extends VacBotCommand
 */
export class GetMoveUpWarning extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Requests information about the connected network and Wi-Fi (Legacy)
 * @extends VacBotCommand
 */
export class GetNetInfoLegacy extends VacBotCommand {
    constructor();
    /**
     * Same payload shape as GetNetInfo — reuses the same normalization.
     * @param {{ ip?: string, wi?: string, ssid?: string, s?: string, rssi?: number, st?: number, mac?: string, wm?: string }} payload
     * @returns {{ ip: string, wifiSSID: string, wifiSignal: number, mac: string }}
     */
    parseResponse(payload: {
        ip?: string;
        wi?: string;
        ssid?: string;
        s?: string;
        rssi?: number;
        st?: number;
        mac?: string;
        wm?: string;
    }): {
        ip: string;
        wifiSSID: string;
        wifiSignal: number;
        mac: string;
    };
}
/**
 * Request the safety protection status
 * @extends VacBotCommand
 */
export class GetSafeProtect extends VacBotCommand {
    constructor();
    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Request an array of cleaning log information
 * The `count` attribute seems to have no affect,
 * but it has to be set anyway
 * @extends VacBotCommand
 */
export class GetCleanLogs extends VacBotCommand {
    constructor(count?: number);
    /**
     * @param {Object} payload
     * @returns {Array<Object>}
     */
    parseResponse(payload: Object): Array<Object>;
}
/**
 * Requests the 'Carpet Auto Fan Boost' state
 * @extends VacBotCommand
 */
export class GetCarpetAutoFanBoost extends VacBotCommand {
    constructor();
    /**
     * @param {{ enable: number }} payload
     * @returns {boolean}
     */
    parseResponse(payload: {
        enable: number;
    }): boolean;
}
/**
 * Requests the 'Efficiency Mode'
 * @extends VacBotCommand
 */
export class GetEfficiencyMode extends VacBotCommand {
    constructor();
    /**
     * @param {{ efficiency: number }} payload
     * @returns {number}
     */
    parseResponse(payload: {
        efficiency: number;
    }): number;
}
/**
 * Requests the 'Mop Auto Wash Frequency' (cleaning interval)
 * @extends VacBotCommand
 */
export class GetMopAutoWashFrequency extends VacBotCommand {
    constructor();
    /**
     * @param {{ interval: number }} payload
     * @returns {number}
     */
    parseResponse(payload: {
        interval: number;
    }): number;
}
import { VacBotCommand } from "./base";
//# sourceMappingURL=info.d.ts.map