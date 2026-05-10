/**
 * Resets the life span value for a specific component to 100%
 * @extends VacBotCommand
 */
export class ResetLifeSpan extends VacBotCommand {
    constructor(component: any);
}
/**
 * Set the 'Fan Speed' for Airbot Z1
 * 1 = 'quiet'
 * 2 = 'standard'
 * 3 = 'strong'
 * 4 = 'smart'
 * @extends VacBotCommand
 * TODO: potential duplicate of SetCleanSpeed (clean.js)
 */
export class SetFanSpeed extends VacBotCommand {
    constructor(level: any);
}
/**
 * Sets the 'Water Flow Level'
 * (and the 'Scrubbing Pattern' for a few models)
 * @extends VacBotCommand
 * TODO: potential duplicate of SetWaterInfo
 */
export class SetWaterLevel extends VacBotCommand {
    constructor(level: any, sweepType?: number);
}
/**
 * Sends a 'PlaySound' command with a sid
 * You can find a (incomplete) list here:
 * https://github.com/mrbungle64/ecovacs-deebot.js/wiki/playSound
 * @extends VacBotCommand
 */
export class PlaySound extends VacBotCommand {
    constructor(sid?: number);
}
/**
 * Set the volume value
 * @extends VacBotCommand
 */
export class SetVolume extends VacBotCommand {
    constructor(volume?: number);
}
/**
 * Sets the value whether the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 * TODO: potential duplicate of EmptyDustBin (info.js)
 */
export class SetAutoEmpty extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value for 'Do Not Disturb' option
 * @extends VacBotCommand
 */
export class SetDoNotDisturb extends VacBotCommand {
    constructor(enable?: number, start?: string, end?: string);
}
/**
 * Sets the value whether the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class SetAdvancedMode extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
export class SetRecognization extends VacBotCommand {
    constructor(state?: number);
}
/**
 * Sets the value whether the (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetTrueDetect extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
export class SetDusterRemind extends VacBotCommand {
    constructor(enable?: number, period?: number);
}
/**
 * Sets the value whether the 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
export class SetCarpetPressure extends VacBotCommand {
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
export class SetCarpetInfo extends VacBotCommand {
    constructor(mode?: number);
}
/**
 * Sets the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetWashInterval extends VacBotCommand {
    constructor(interval?: number);
}
/**
 * Set the value whether hot water
 * should be used for cleaning the mopping pads (e.g. T20 series)
 * 0 = off
 * 1 = on
 * @extends VacBotCommand
 */
export class SetWashInfo extends VacBotCommand {
    constructor(mode?: number);
}
/**
 * Start und Stop 'Air Drying' (Yeedi Mop Station)
 * @extends VacBotCommand
 */
export class SetAirDrying extends VacBotCommand {
    constructor(act?: string);
}
export class SetDryingDuration extends VacBotCommand {
    constructor(duration?: number);
}
/**
 * Sets the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetBorderSpin extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Border Switch' is enabled
 * @extends VacBotCommand
 */
export class SetBorderSwitch extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetSweepMode extends VacBotCommand {
    constructor(type?: number);
}
/**
 * Sets the value to enable and disable 'YIKO' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetVoiceAssistantState extends VacBotCommand {
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
export class SetWorkMode extends VacBotCommand {
    constructor(mode?: number);
}
/**
 * Sets the value whether the 'Cross Map Border Warning' is enabled
 * @extends VacBotCommand
 */
export class SetCrossMapBorderWarning extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the 'Cut Direction'
 * @extends VacBotCommand
 */
export class SetCutDirection extends VacBotCommand {
    constructor(angle: any);
}
/**
 * Sets the 'Efficiency Mode'
 * @extends VacBotCommand
 */
export class SetEfficiencyMode extends VacBotCommand {
    constructor(efficiency: any);
}
/**
 * Sets the value whether the 'Move Up Warning' is enabled
 * @extends VacBotCommand
 */
export class SetMoveUpWarning extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Multi-map' state is enabled
 * @extends VacBotCommand
 */
export class SetMultimapState extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value for 'Over The Air' updates
 * @extends VacBotCommand
 */
export class SetOta extends VacBotCommand {
    constructor(autoSwitch?: number);
}
/**
 * Sets the value whether the 'Safe Protect' option is enabled
 * @extends VacBotCommand
 */
export class SetSafeProtect extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the 'Water Flow Level' and other water related information
 * @extends VacBotCommand
 */
export class SetWaterInfo extends VacBotCommand {
    constructor(amount: any, customAmount: any, sweepType: any);
}
/**
 * Represents a command to trigger a station action
 * @extends VacBotCommand
 * TODO: potential duplicate of EmptyDustBinSA / Drying (info.js)
 */
export class StationAction extends VacBotCommand {
    constructor(action: any, act?: number);
}
/**
 * Sets data for the Voice Report (untested)
 * @extends VacBotCommand
 */
export class SetVoice extends VacBotCommand {
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
export class SetAirbotAutoModel extends VacBotCommand {
    constructor(on?: number, aqEnd?: number, aqStart?: number);
}
/**
 * Sets the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
export class SetAngleFollow extends VacBotCommand {
    constructor(on?: number);
}
/**
 * Sets the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
export class SetAtmoLight extends VacBotCommand {
    constructor(intensity?: number);
}
/**
 * Sets the 'Volume' (0-16)
 * @extends VacBotCommand
 */
export class SetAtmoVolume extends VacBotCommand {
    constructor(volume?: number);
}
/**
 * Sets the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
export class SetBlueSpeaker extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
export class SetChildLock extends VacBotCommand {
    constructor(on?: number);
}
/**
 * Sets the enabled state of the microphone
 * @extends VacBotCommand
 */
export class SetMic extends VacBotCommand {
    constructor(on?: number);
}
/**
 * Sets the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
export class SetMonitorAirState extends VacBotCommand {
    constructor(on?: number);
}
/**
 * Represents a 'setThreeModule' command
 * @extends VacBotCommand
 */
export class SetThreeModule extends VacBotCommand {
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
export class SetVoiceSimple extends VacBotCommand {
    constructor(on?: number);
}
import { VacBotCommand } from "./base";
//# sourceMappingURL=settings.d.ts.map