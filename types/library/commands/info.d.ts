/**
 * Requests information about the battery level
 * @extends VacBotCommand
 */
export class GetBatteryState {
}
/**
 * Requests information about the consumable components
 * You can specify the components or
 * send an empty array to request information for all components
 * (not sure if the empty array works for all models)
 * @extends VacBotCommand
 */
export class GetLifeSpan {
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
export class GetError {
}
/**
 * Requests the 'Water Flow Level'
 * @extends VacBotCommand
 */
export class GetWaterInfo {
}
/**
 * Requests information about the connected network and Wi-Fi
 * @extends VacBotCommand
 */
export class GetNetInfo {
}
/**
 * Request information about if the bot is
 * in (energy saving) sleeping mode
 * @extends VacBotCommand
 */
export class GetSleepStatus {
}
/**
 * Request the volume value
 * @extends VacBotCommand
 */
export class GetVolume {
}
/**
 * Request information if the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
export class GetAutoEmpty {
}
/**
 * Represents a command to empty the dust bin
 * of the Auto Empty Station
 * @extends VacBotCommand
 */
export class EmptyDustBin {
}
/**
 * Empty dust bin (e.g. T20 series)
 * `EmptyDustBinSA` = 'EmptyDustBinStationAction'
 * @extends VacBotCommand
 */
export class EmptyDustBinSA {
}
/**
 * Request information if the 'Do Not Disturb' option is enabled
 * @extends VacBotCommand
 */
export class GetDoNotDisturb {
}
/**
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class GetAdvancedMode {
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
export class GetRecognization {
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetTrueDetect {
}
/**
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
export class GetDusterRemind {
}
/**
 * Request information about if 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
export class GetCarpetPressure {
}
/**
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
export class GetCarpetInfo {
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. the state of 'Air Drying', 'Mopping Pads Cleaning' etc.
 * @extends VacBotCommand
 */
export class GetStationState {
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. model, firmware etc.
 * @extends VacBotCommand
 */
export class GetStationInfo {
}
/**
 * Receive the value of the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetWashInterval {
}
/**
 * Request the value whether hot water
 * is used for cleaning the mopping pads (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWashInfo {
}
/**
 * Receive the value if 'Air Drying' is active (Yeedi Mop Station)
 * The typo in 'AirDring' is intended
 * @extends VacBotCommand
 */
export class GetAirDrying {
}
/**
 * Start und Stop 'Air Drying' (e.g. X1 series)
 * 1 = start
 * 4 = stop
 * @extends VacBotCommand
 */
export class Drying {
    constructor(act: any);
}
export class GetDryingDuration {
}
/**
 * Requests the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetBorderSpin {
}
/**
 * Requests information about the Firmware
 * and 'Over The Air' updates (e.g. X1 series, Airbot Z1)
 * (e.g. version, status, progress)
 * @extends VacBotCommand
 */
export class GetOta {
}
/**
 * Requests information about the relocation status (e.g. X1 series, Airbot Z1)
 * @extends VacBotCommand
 */
export class GetRelocationState {
}
/**
 * Requests the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetSweepMode {
}
/**
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetVoiceAssistantState {
}
/**
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWorkMode {
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * @extends VacBotCommand
 */
export class GetSchedule {
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * Used by newer models
 * @extends VacBotCommand
 */
export class GetSchedule_V2 {
}
/**
 * Request information about the total stats
 * total square meters ('area'), total seconds ('time'), total number ('count')
 * @extends VacBotCommand
 */
export class GetTotalStats {
}
/**
 * Request information about the
 * 'Customized Scenario Cleaning' scenarios (T20, X2 series)
 *
 * @extends VacBotCommand
 */
export class GetQuickCommand {
    constructor(type?: string);
}
/**
 * Request information about the Wi-Fi that is in use
 * and also about the stored Wi-Fi settings
 * (incl. Password in plain text!)
 * @extends VacBotCommand
 */
export class GetWifiList {
}
/**
 * Air quality (Z1 Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetJCYAirQuality {
}
/**
 * Air quality (Airbot Z1)
 * @extends VacBotCommand
 */
export class GetAirQuality {
}
/**
 * Requests an object with data
 * for the 'Linked Purification' function
 * (linked to Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetAirbotAutoModel {
}
/**
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
export class GetAngleFollow {
}
/**
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
export class GetAtmoLight {
}
/**
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
export class GetAtmoVolume {
}
/**
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
export class GetBlueSpeaker {
}
/**
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
export class GetChildLock {
}
/**
 * Request the enabled state for 'DrivingWheel'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetDrivingWheel {
}
/**
 * Request the enabled state of the
 * 'Lab Features' => 'Follow Me'
 * @extends VacBotCommand
 */
export class GetHumanoidFollow {
}
/**
 * Request Video Manager status info
 * @extends VacBotCommand
 */
export class GetLiveLaunchPwdState {
}
/**
 * Request the enabled state of the microphone
 * @extends VacBotCommand
 */
export class GetMic {
}
/**
 * Request the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
export class GetMonitorAirState {
}
/**
 * Request various information about the 'Purification Scenario'
 * @extends VacBotCommand
 */
export class GetScene {
}
/**
 * Request data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModule {
}
/**
 * Request status data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModuleStatus {
}
/**
 * Request information about the 'Time Zone'
 * @extends VacBotCommand
 */
export class GetTimeZone {
}
/**
 * Request enabled state for the 'VoiceLifeRemindState'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetVoiceLifeRemindState {
}
/**
 * Request enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
export class GetVoiceSimple {
}
//# sourceMappingURL=info.d.ts.map