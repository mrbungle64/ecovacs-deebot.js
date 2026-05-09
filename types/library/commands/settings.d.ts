/**
 * Resets the life span value for a specific component to 100%
 * @extends VacBotCommand
 */
export class ResetLifeSpan {
    constructor(component: any);
}
/**
 * Set the 'Fan Speed' for Airbot Z1
 * 1 = 'quiet'
 * 2 = 'standard'
 * 3 = 'strong'
 * 4 = 'smart'
 * @extends VacBotCommand
 */
export class SetFanSpeed {
    constructor(level: any);
}
/**
 * Sets the 'Water Flow Level'
 * (and the 'Scrubbing Pattern' for a few models)
 * @extends VacBotCommand
 */
export class SetWaterLevel {
    constructor(level: any, sweepType?: number);
}
/**
 * Sends a 'PlaySound' command with a sid
 * You can find a (incomplete) list here:
 * https://github.com/mrbungle64/ecovacs-deebot.js/wiki/playSound
 * @extends VacBotCommand
 */
export class PlaySound {
    constructor(sid?: number);
}
/**
 * Set the volume value
 * @extends VacBotCommand
 */
export class SetVolume {
    constructor(volume?: number);
}
/**
 * Sets the value whether the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
export class SetAutoEmpty {
    constructor(enable?: number);
}
/**
 * Sets the value for 'Do Not Disturb' option
 * @extends VacBotCommand
 */
export class SetDoNotDisturb {
    constructor(enable?: number, start?: string, end?: string);
}
/**
 * Sets the value whether the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class SetAdvancedMode {
    constructor(enable?: number);
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
export class SetRecognization {
    constructor(state?: number);
}
/**
 * Sets the value whether the (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetTrueDetect {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
export class SetDusterRemind {
    constructor(enable?: number, period?: number);
}
/**
 * Sets the value whether the 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
export class SetCarpetPressure {
    constructor(enable?: number);
}
/**
 * Sets the value of the 'Carpet cleaning strategy' option
 * (e.g. T20 series)
 *
 * 0 = 'Auto'
 * 1 = 'Bypass'
 * 2 = 'Include'
 *
 * @extends VacBotCommand
 */
export class SetCarpetInfo {
    constructor(mode?: number);
}
/**
 * Sets the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetWashInterval {
    constructor(interval?: number);
}
/**
 * Set the value whether hot water
 * should be used for cleaning the mopping pads (e.g. T20 series)
 * 0 = off
 * 1 = on
 * @extends VacBotCommand
 */
export class SetWashInfo {
    constructor(mode?: number);
}
/**
 * Start und Stop 'Air Drying' (Yeedi Mop Station)
 * @extends VacBotCommand
 */
export class SetAirDrying {
    constructor(act?: string);
}
export class SetDryingDuration {
    constructor(duration?: number);
}
/**
 * Sets the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetBorderSpin {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetSweepMode {
    constructor(type?: number);
}
/**
 * Sets the value to enable and disable 'YIKO' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetVoiceAssistantState {
    constructor(enable?: number);
}
/**
 * Sets the 'Cleaning Mode' (e.g. T20 series)
 * vacuum and mop = 0
 * vacuum only = 1
 * mop only = 2
 * mop after vacuum = 3
 * @extends VacBotCommand
 */
export class SetWorkMode {
    constructor(mode?: number);
}
/**
 * Sets data for the Voice Report (untested)
 * @extends VacBotCommand
 */
export class SetVoice {
    constructor(enable?: number, md5sum?: string, size?: number, type?: string, url?: string, vid?: string);
}
/**
 * Sends the 'Linked Purification' (linked to Air Quality Monitor)
 * enabled state and also the start and end value
 * 1, 3, 4 = 'very poor <> poor',
 * 1, 2, 4 = 'very poor <> fair',
 * 1, 1, 4 = 'very poor <> good',
 * 1, 2, 3 = 'poor <> fair',
 * 1, 1, 3 = 'poor <> good',
 * 1, 1, 2 = 'fair <> good'
 * @extends VacBotCommand
 */
export class SetAirbotAutoModel {
    constructor(on?: number, aqEnd?: number, aqStart?: number);
}
/**
 * Sets the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
export class SetAngleFollow {
    constructor(on?: number);
}
/**
 * Sets the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
export class SetAtmoLight {
    constructor(intensity?: number);
}
/**
 * Sets the 'Volume' (0-16)
 * @extends VacBotCommand
 */
export class SetAtmoVolume {
    constructor(volume?: number);
}
/**
 * Sets the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
export class SetBlueSpeaker {
    constructor(enable?: number);
}
/**
 * Sets the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
export class SetChildLock {
    constructor(on?: number);
}
/**
 * Sets the enabled state of the microphone
 * @extends VacBotCommand
 */
export class SetMic {
    constructor(on?: number);
}
/**
 * Sets the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
export class SetMonitorAirState {
    constructor(on?: number);
}
/**
 * Represents a 'setThreeModule' command
 * @extends VacBotCommand
 */
export class SetThreeModule {
    constructor(level?: number, type?: string, enable?: number);
}
/**
 * Sets the 'Air Freshening' level of the 'Air freshener' module
 *
 * 1 = 'light'
 * 2 = 'standard'
 * 3 = 'strong'
 *
 * @extends SetThreeModule
 * @constructor
 * @param {number} [level=0] - The level
 * @param {number} [enable=0] - The enable state
 */
export class SetFreshenerLevel extends SetThreeModule {
    constructor(level?: number, enable?: number);
}
/**
 * Sets the 'Humidification' level
 * of the 'Humidifier' module
 *
 * 45 = 'lower humidity'
 * 55 = 'cozy'
 * 65 = 'higher humidity'
 *
 * @extends SetThreeModule
 * @constructor
 * @param {number} [level=0] - The level
 * @param {number} [enable=0] - The enable state
 */
export class SetHumidifierLevel extends SetThreeModule {
    constructor(level?: number, enable?: number);
}
/**
 * Sets enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
export class SetVoiceSimple {
    constructor(on?: number);
}
//# sourceMappingURL=settings.d.ts.map