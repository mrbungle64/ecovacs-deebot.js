/**
 * Requests information about the battery level
 * @extends VacBotCommand
 */
export class GetBatteryState extends VacBotCommand {
    constructor();
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
}
/**
 * Requests the 'Error' messages
 * In most cases it doesn't respond (if there's no error)
 * @extends VacBotCommand
 */
export class GetError extends VacBotCommand {
    constructor();
}
/**
 * Requests the 'Water Flow Level'
 * @extends VacBotCommand
 */
export class GetWaterInfo extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the connected network and Wi-Fi
 * @extends VacBotCommand
 */
export class GetNetInfo extends VacBotCommand {
    constructor();
}
/**
 * Request information about if the bot is
 * in (energy saving) sleeping mode
 * @extends VacBotCommand
 */
export class GetSleepStatus extends VacBotCommand {
    constructor();
}
/**
 * Request the volume value
 * @extends VacBotCommand
 */
export class GetVolume extends VacBotCommand {
    constructor();
}
/**
 * Request information if the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
export class GetAutoEmpty extends VacBotCommand {
    constructor();
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
}
/**
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class GetAdvancedMode extends VacBotCommand {
    constructor();
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
export class GetRecognization extends VacBotCommand {
    constructor();
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetTrueDetect extends VacBotCommand {
    constructor();
}
/**
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
export class GetDusterRemind extends VacBotCommand {
    constructor();
}
/**
 * Request information about if 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
export class GetCarpetPressure extends VacBotCommand {
    constructor();
}
/**
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
export class GetCarpetInfo extends VacBotCommand {
    constructor();
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. the state of 'Air Drying', 'Mopping Pads Cleaning' etc.
 * @extends VacBotCommand
 */
export class GetStationState extends VacBotCommand {
    constructor();
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. model, firmware etc.
 * @extends VacBotCommand
 */
export class GetStationInfo extends VacBotCommand {
    constructor();
}
/**
 * Receive the value of the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetWashInterval extends VacBotCommand {
    constructor();
}
/**
 * Request the value whether hot water
 * is used for cleaning the mopping pads (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWashInfo extends VacBotCommand {
    constructor();
}
/**
 * Receive the value if 'Air Drying' is active (Yeedi Mop Station)
 * The typo in 'AirDring' is intended
 * @extends VacBotCommand
 */
export class GetAirDrying extends VacBotCommand {
    constructor();
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
}
/**
 * Requests the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetBorderSpin extends VacBotCommand {
    constructor();
}
/**
 * Requests the value whether the 'Border Switch' is enabled
 * @extends VacBotCommand
 */
export class GetBorderSwitch extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the Firmware
 * and 'Over The Air' updates (e.g. X1 series, Airbot Z1)
 * (e.g. version, status, progress)
 * @extends VacBotCommand
 */
export class GetOta extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the relocation status (e.g. X1 series, Airbot Z1)
 * @extends VacBotCommand
 */
export class GetRelocationState extends VacBotCommand {
    constructor();
}
/**
 * Requests the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetSweepMode extends VacBotCommand {
    constructor();
}
/**
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetVoiceAssistantState extends VacBotCommand {
    constructor();
}
/**
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWorkMode extends VacBotCommand {
    constructor();
}
/**
 * Request information about the work status
 * @extends VacBotCommand
 */
export class GetWorkState extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * @extends VacBotCommand
 */
export class GetSchedule extends VacBotCommand {
    constructor();
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
}
/**
 * Request information about the stats
 * @extends VacBotCommand
 */
export class GetStats extends VacBotCommand {
    constructor();
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
 * Request information about the Wi-Fi that is in use
 * and also about the stored Wi-Fi settings
 * (incl. Password in plain text!)
 * @extends VacBotCommand
 */
export class GetWifiList extends VacBotCommand {
    constructor();
}
/**
 * Air quality (Z1 Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetJCYAirQuality extends VacBotCommand {
    constructor();
}
/**
 * Air quality (Airbot Z1)
 * @extends VacBotCommand
 */
export class GetAirQuality extends VacBotCommand {
    constructor();
}
/**
 * Requests an object with data
 * for the 'Linked Purification' function
 * (linked to Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetAirbotAutoModel extends VacBotCommand {
    constructor();
}
/**
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
export class GetAngleFollow extends VacBotCommand {
    constructor();
}
/**
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
export class GetAtmoLight extends VacBotCommand {
    constructor();
}
/**
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
export class GetAtmoVolume extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
export class GetBlueSpeaker extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
export class GetChildLock extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state for 'DrivingWheel'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetDrivingWheel extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the
 * 'Lab Features' => 'Follow Me'
 * @extends VacBotCommand
 */
export class GetHumanoidFollow extends VacBotCommand {
    constructor();
}
/**
 * Request Video Manager status info
 * @extends VacBotCommand
 */
export class GetLiveLaunchPwdState extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the microphone
 * @extends VacBotCommand
 */
export class GetMic extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
export class GetMonitorAirState extends VacBotCommand {
    constructor();
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
}
/**
 * Request status data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModuleStatus extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Time Zone'
 * @extends VacBotCommand
 */
export class GetTimeZone extends VacBotCommand {
    constructor();
}
/**
 * Request enabled state for the 'VoiceLifeRemindState'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetVoiceLifeRemindState extends VacBotCommand {
    constructor();
}
/**
 * Request enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
export class GetVoiceSimple extends VacBotCommand {
    constructor();
}
/**
 * Request information if the 'Cross Map Border Warning' is enabled
 * @extends VacBotCommand
 */
export class GetCrossMapBorderWarning extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Cut Direction'
 * @extends VacBotCommand
 */
export class GetCutDirection extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Fan Speed'
 * @extends VacBotCommand
 */
export class GetFanSpeed extends VacBotCommand {
    constructor();
}
/**
 * Request information if the 'Move Up Warning' is enabled
 * @extends VacBotCommand
 */
export class GetMoveUpWarning extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the connected network and Wi-Fi (Legacy)
 * @extends VacBotCommand
 */
export class GetNetInfoLegacy extends VacBotCommand {
    constructor();
}
/**
 * Request information if the 'Safe Protect' option is enabled
 * @extends VacBotCommand
 */
export class GetSafeProtect extends VacBotCommand {
    constructor();
}
/**
 * Request an array of cleaning log information
 * The `count` attribute seems to have no affect,
 * but it has to be set anyway
 * @extends VacBotCommand
 */
export class GetCleanLogs extends VacBotCommand {
    constructor(count?: number);
}
import { VacBotCommand } from "./base";
//# sourceMappingURL=info.d.ts.map