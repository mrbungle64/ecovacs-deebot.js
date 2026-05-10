'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

/**
 * Resets the life span value for a specific component to 100%
 * @extends VacBotCommand
 */
class ResetLifeSpan extends VacBotCommand {
    constructor(component) {
        super('resetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
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
class SetFanSpeed extends VacBotCommand {
    constructor(level) {
        if ((level < 1) || (level > 4)) {
            level = 4; // smart
        }
        super('setSpeed', {
            'speed': level
        });
    }
}

/**
 * Sets the 'Water Flow Level'
 * (and the 'Scrubbing Pattern' for a few models)
 * @extends VacBotCommand
 * TODO: potential duplicate of SetWaterInfo
 */
class SetWaterLevel extends VacBotCommand {
    constructor(level, sweepType = 0) {
        // 'Water Flow Level'
        const payload = {
            'amount': level
        };
        // 'Scrubbing Pattern' (e.g. OZMO T8 AIVI)
        // 1 = 'Quick Scrubbing'
        // 2 = 'Deep Scrubbing'
        if ((sweepType === 1) || (sweepType === 2)) {
            Object.assign(payload, { 'sweepType': sweepType });
        }
        super('setWaterInfo', payload);
    }
}

/**
 * Sets the 'Water Flow Level' and other water related information
 * @extends VacBotCommand
 */
class SetWaterInfo extends VacBotCommand {
    constructor(amount, customAmount, sweepType) {
        super('setWaterInfo', {
            'amount': amount,
            'customAmount': customAmount,
            'sweepType': sweepType
        });
    }
}

/**
 * Sends a 'PlaySound' command with a sid
 * You can find a (incomplete) list here:
 * https://github.com/mrbungle64/ecovacs-deebot.js/wiki/playSound
 * @extends VacBotCommand
 */
class PlaySound extends VacBotCommand {
    constructor(sid = 0) {
        let sidAsNumber = Number(sid);
        super('playSound', {
            'sid': sidAsNumber
        });
    }
}

/**
 * Set the volume value
 * @extends VacBotCommand
 */
class SetVolume extends VacBotCommand {
    constructor(volume = 1) {
        super('setVolume', {
            'volume': volume
        });
    }
}

/**
 * Sets the value whether the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 * TODO: potential duplicate of EmptyDustBin (info.js)
 */
class SetAutoEmpty extends VacBotCommand {
    constructor(enable = 0) {
        super('setAutoEmpty', {
            'enable': enable
        });
    }
}

/**
 * Sets the value for 'Do Not Disturb' option
 * @extends VacBotCommand
 */
class SetDoNotDisturb extends VacBotCommand {
    constructor(enable = 0, start = '22:00', end = '21:59') {
        super('setBlock', {
            'enable': enable,
            'start': start,
            'end': end
        });
    }
}

/**
 * Sets the value whether the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
class SetAdvancedMode extends VacBotCommand {
    constructor(enable = 0) {
        super('setAdvancedMode', {
            'enable': enable
        });
    }
}

/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
class SetRecognization extends VacBotCommand {
    constructor(state = 0) {
        super('setRecognization', {
            'state': state
        });
    }
}

/**
 * Sets the value whether the (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
class SetTrueDetect extends VacBotCommand {
    constructor(enable = 0) {
        super('setTrueDetect', {
            'enable': enable
        });
    }
}

/**
 * Sets the value whether the 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
class SetDusterRemind extends VacBotCommand {
    constructor(enable = 0, period = 30) {
        super('setDusterRemind', {
            'enable': enable,
            'period': period
        });
    }
}

/**
 * Sets the value whether the 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
class SetCarpetPressure extends VacBotCommand {
    constructor(enable = 0) {
        super('setCarpertPressure', {
            'enable': enable
        });
    }
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
class SetCarpetInfo extends VacBotCommand {
    constructor(mode = 0) {
        super('setCarpetInfo', {
            'mode': mode
        });
    }
}

/**
 * Sets the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
class SetWashInterval extends VacBotCommand {
    constructor(interval = 10) {
        super('setWashInterval', {
            interval: interval
        });
    }
}

/**
 * Set the value whether hot water
 * should be used for cleaning the mopping pads (e.g. T20 series)
 * 0 = off
 * 1 = on
 * @extends VacBotCommand
 */
class SetWashInfo extends VacBotCommand {
    constructor(mode = 0) {
        super('setWashInfo', {
            'mode': mode
        });
    }
}

/**
 * Start und Stop 'Air Drying' (Yeedi Mop Station)
 * @extends VacBotCommand
 */
class SetAirDrying extends VacBotCommand {
    constructor(act = 'stop') {
        super('setAirDring', {
            'act': act
        });
    }
}

class SetDryingDuration extends VacBotCommand {
    constructor(duration = 0) {
        super('setDryingDuration', {
            'duration': duration
        });
    }
}

/**
 * Sets the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class SetBorderSpin extends VacBotCommand {
    constructor(enable = 0) {
        super('setBorderSpin', {
            'enable': enable,
            'type': 1
        });
    }
}

/**
 * Sets the value whether the 'Border Switch' is enabled
 * @extends VacBotCommand
 */
class SetBorderSwitch extends VacBotCommand {
    constructor(enable = 0) {
        super('setBorderSwitch', {
            'enable': enable
        });
    }
}

/**
 * Sets the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class SetSweepMode extends VacBotCommand {
    constructor(type = 0) {
        super('setSweepMode', {
            'type': type
        });
    }
}

/**
 * Sets the value to enable and disable 'YIKO' (e.g. X1 series)
 * @extends VacBotCommand
 */
class SetVoiceAssistantState extends VacBotCommand {
    constructor(enable = 0) {
        super('setVoiceAssistantState', {
            'enable': enable
        });
    }
}

/**
 * Sets the 'Cleaning Mode' (e.g. T20 series)
 * vacuum and mop = 0
 * vacuum only = 1
 * mop only = 2
 * mop after vacuum = 3
 * @extends VacBotCommand
 */
class SetWorkMode extends VacBotCommand {
    constructor(mode = 0) {
        super('setWorkMode', {
            'mode': mode
        });
    }
}

/**
 * Sets the value whether the 'Cross Map Border Warning' is enabled
 * @extends VacBotCommand
 */
class SetCrossMapBorderWarning extends VacBotCommand {
    constructor(enable = 0) {
        super('setCrossMapBorderWarning', {
            'enable': enable
        });
    }
}

/**
 * Sets the 'Cut Direction'
 * @extends VacBotCommand
 */
class SetCutDirection extends VacBotCommand {
    constructor(angle) {
        super('setCutDirection', {
            'angle': angle
        });
    }
}

/**
 * Sets the 'Efficiency Mode'
 * @extends VacBotCommand
 */
class SetEfficiencyMode extends VacBotCommand {
    constructor(efficiency) {
        super('setEfficiency', {
            'efficiency': efficiency
        });
    }
}

/**
 * Sets the value whether the 'Move Up Warning' is enabled
 * @extends VacBotCommand
 */
class SetMoveUpWarning extends VacBotCommand {
    constructor(enable = 0) {
        super('setMoveupWarning', {
            'enable': enable
        });
    }
}

/**
 * Sets the value whether the 'Multi-map' state is enabled
 * @extends VacBotCommand
 */
class SetMultimapState extends VacBotCommand {
    constructor(enable = 0) {
        super('setMultiMapState', {
            'enable': enable
        });
    }
}

/**
 * Sets the value for 'Over The Air' updates
 * @extends VacBotCommand
 */
class SetOta extends VacBotCommand {
    constructor(autoSwitch = 0) {
        super('setOta', {
            'autoSwitch': autoSwitch
        });
    }
}

/**
 * Sets the value whether the 'Safe Protect' option is enabled
 * @extends VacBotCommand
 */
class SetSafeProtect extends VacBotCommand {
    constructor(enable = 0) {
        super('setSafeProtect', {
            'enable': enable
        });
    }
}

/**
 * Represents a command to trigger a station action
 * @extends VacBotCommand
 * TODO: potential duplicate of EmptyDustBinSA / Drying (info.js)
 */
class StationAction extends VacBotCommand {
    constructor(action, act = 1) {
        super('stationAction', {
            'act': act,
            'type': action
        });
    }
}

/**
 * Sets data for the Voice Report (untested)
 * @extends VacBotCommand
 */
class SetVoice extends VacBotCommand {
    constructor(enable = 0, md5sum = '', size = 0, type = '', url = '', vid = 'default') {
        super('setVoice', {
            'enable': enable,
            'md5': md5sum,
            'size': '' + size,
            'type': type,
            'url': url,
            'vid': vid
        });
    }
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
class SetAirbotAutoModel extends VacBotCommand {
    constructor(on = 0, aqEnd = 2, aqStart = 3) {
        super('setAirbotAutoModel', {
            'aq': {
                'aqEnd': aqEnd,
                'aqStart': aqStart
            },
            'enable': on
        });
    }
}

/**
 * Sets the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
class SetAngleFollow extends VacBotCommand {
    constructor(on = 0) {
        super('setAngleFollow', {
            'on': on
        });
    }
}

/**
 * Sets the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
class SetAtmoLight extends VacBotCommand {
    constructor(intensity = 0) {
        super('setAtmoLight', {
            'intensity': intensity,
            'type': 'system',
            'total': 4
        });
    }
}

/**
 * Sets the 'Volume' (0-16)
 * @extends VacBotCommand
 */
class SetAtmoVolume extends VacBotCommand {
    constructor(volume = 0) {
        super('setAtmoVolume', {
            'total': 16,
            'type': 'system',
            'volume': volume
        });
    }
}

/**
 * Sets the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
class SetBlueSpeaker extends VacBotCommand {
    constructor(enable = 0) {
        super('setBlueSpeaker', {
            'enable': enable,
            'name': 'ECOVACS Z1',
            'resetTime': 1
        });
    }
}

/**
 * Sets the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
class SetChildLock extends VacBotCommand {
    constructor(on = 0) {
        super('setChildLock', {
            'on': on
        });
    }
}

/**
 * Sets the enabled state of the microphone
 * @extends VacBotCommand
 */
class SetMic extends VacBotCommand {
    constructor(on = 0) {
        super('setMic', {
            'on': on
        });
    }
}

/**
 * Sets the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
class SetMonitorAirState extends VacBotCommand {
    constructor(on = 0) {
        super('setMonitorAirState', {
            'on': on
        });
    }
}

/**
 * Represents a 'setThreeModule' command
 * @extends VacBotCommand
 */
class SetThreeModule extends VacBotCommand {
    constructor(level = 0, type = '', enable = 0) {
        super('setThreeModule', {
            'level': level,
            'type': type,
            'enable': enable,
            'state': 0,
            'err': 0,
            'work': 0
        });
    }
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
class SetFreshenerLevel extends SetThreeModule {
    constructor(level = 0, enable = 0) {
        super(level, 'smell', enable);
    }
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
class SetHumidifierLevel extends SetThreeModule {
    constructor(level = 0, enable = 0) {
        super(level, 'humidify', enable);
    }
}

/**
 * Sets enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
class SetVoiceSimple extends VacBotCommand {
    constructor(on = 0) {
        super('setVoiceSimple', {
            'on': on
        });
    }
}

module.exports = {
    ResetLifeSpan,
    SetFanSpeed,
    SetWaterLevel,
    PlaySound,
    SetVolume,
    SetAutoEmpty,
    SetDoNotDisturb,
    SetAdvancedMode,
    SetRecognization,
    SetTrueDetect,
    SetDusterRemind,
    SetCarpetPressure,
    SetCarpetInfo,
    SetWashInterval,
    SetWashInfo,
    SetAirDrying,
    SetDryingDuration,
    SetBorderSpin,
    SetBorderSwitch,
    SetSweepMode,
    SetVoiceAssistantState,
    SetWorkMode,
    SetCrossMapBorderWarning,
    SetCutDirection,
    SetEfficiencyMode,
    SetMoveUpWarning,
    SetMultimapState,
    SetOta,
    SetSafeProtect,
    SetWaterInfo,
    StationAction,
    SetVoice,
    SetAirbotAutoModel,
    SetAngleFollow,
    SetAtmoLight,
    SetAtmoVolume,
    SetBlueSpeaker,
    SetChildLock,
    SetMic,
    SetMonitorAirState,
    SetThreeModule,
    SetFreshenerLevel,
    SetHumidifierLevel,
    SetVoiceSimple,
};
