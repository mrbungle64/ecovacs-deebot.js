'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

/**
 * Requests information about the battery level
 * @extends VacBotCommand
 */
class GetBatteryState extends VacBotCommand {
    constructor() {
        super('getBattery');
    }
}

/**
 * Requests information about the consumable components
 * You can specify the components or
 * send an empty array to request information for all components
 * (not sure if the empty array works for all models)
 * @extends VacBotCommand
 */
class GetLifeSpan extends VacBotCommand {
    /**
     * @param {Array} componentsArray - An optional array of components
     */
    constructor(componentsArray = []) {
        super('getLifeSpan', componentsArray);
    }
}

/**
 * Requests the 'Error' messages
 * In most cases it doesn't respond (if there's no error)
 * @extends VacBotCommand
 */
class GetError extends VacBotCommand {
    constructor() {
        super('getError');
    }
}

/**
 * Requests the 'Water Flow Level'
 * @extends VacBotCommand
 */
class GetWaterInfo extends VacBotCommand {
    constructor() {
        super('getWaterInfo');
    }
}

/**
 * Requests information about the connected network and Wi-Fi
 * @extends VacBotCommand
 */
class GetNetInfo extends VacBotCommand {
    constructor() {
        super('getNetInfo');
    }
}

/**
 * Request information about if the bot is
 * in (energy saving) sleeping mode
 * @extends VacBotCommand
 */
class GetSleepStatus extends VacBotCommand {
    constructor() {
        super('getSleep');
    }
}

/**
 * Request the volume value
 * @extends VacBotCommand
 */
class GetVolume extends VacBotCommand {
    constructor() {
        super('getVolume');
    }
}

/**
 * Request information if the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
class GetAutoEmpty extends VacBotCommand {
    constructor() {
        super('getAutoEmpty');
    }
}

/**
 * Represents a command to empty the dust bin
 * of the Auto Empty Station
 * @extends VacBotCommand
 * TODO: potential duplicate of SetAutoEmpty (settings.js)
 */
class EmptyDustBin extends VacBotCommand {
    constructor() {
        super('setAutoEmpty', {
            'act': 'start'
        });
    }
}

/**
 * Empty dust bin (e.g. T20 series)
 * `EmptyDustBinSA` = 'EmptyDustBinStationAction'
 * @extends VacBotCommand
 * TODO: potential duplicate of StationAction (settings.js)
 */
class EmptyDustBinSA extends VacBotCommand {
    constructor() {
        super('stationAction', {
            'act': 1,
            'type': 1
        });
    }
}

/**
 * Request information if the 'Do Not Disturb' option is enabled
 * @extends VacBotCommand
 */
class GetDoNotDisturb extends VacBotCommand {
    constructor() {
        super('getBlock');
    }
}

/**
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
class GetAdvancedMode extends VacBotCommand {
    constructor() {
        super('getAdvancedMode');
    }
}

/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
class GetRecognization extends VacBotCommand {
    constructor() {
        super('getRecognization');
    }
}

/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
class GetTrueDetect extends VacBotCommand {
    constructor() {
        super('getTrueDetect');
    }
}

/**
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
class GetDusterRemind extends VacBotCommand {
    constructor() {
        super('getDusterRemind');
    }
}

/**
 * Request information about if 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
class GetCarpetPressure extends VacBotCommand {
    constructor() {
        super('getCarpertPressure');
    }
}

/**
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
class GetCarpetInfo extends VacBotCommand {
    constructor() {
        super('getCarpetInfo');
    }
}

/**
 * Receive information about the station (e.g. X1 series)
 * e.g. the state of 'Air Drying', 'Mopping Pads Cleaning' etc.
 * @extends VacBotCommand
 */
class GetStationState extends VacBotCommand {
    constructor() {
        super('getStationState');
    }
}

/**
 * Receive information about the station (e.g. X1 series)
 * e.g. model, firmware etc.
 * @extends VacBotCommand
 */
class GetStationInfo extends VacBotCommand {
    constructor() {
        super('getStationInfo');
    }
}

/**
 * Receive the value of the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetWashInterval extends VacBotCommand {
    constructor() {
        super('getWashInterval');
    }
}

/**
 * Request the value whether hot water
 * is used for cleaning the mopping pads (e.g. T20 series)
 * @extends VacBotCommand
 */
class GetWashInfo extends VacBotCommand {
    constructor() {
        super('getWashInfo');
    }
}

/**
 * Receive the value if 'Air Drying' is active (Yeedi Mop Station)
 * The typo in 'AirDring' is intended
 * @extends VacBotCommand
 */
class GetAirDrying extends VacBotCommand {
    constructor() {
        super('getAirDring');
    }
}

/**
 * Start und Stop 'Air Drying' (e.g. X1 series)
 * 1 = start
 * 4 = stop
 * @extends VacBotCommand
 */
class Drying extends VacBotCommand {
    constructor(act) {
        super('stationAction', {
            'act': act,
            'type': 2
        });
    }
}

class GetDryingDuration extends VacBotCommand {
    constructor() {
        super('getDryingDuration');
    }
}

/**
 * Requests the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetBorderSpin extends VacBotCommand {
    constructor() {
        super('getBorderSpin');
    }
}

/**
 * Requests the value whether the 'Border Switch' is enabled
 * @extends VacBotCommand
 */
class GetBorderSwitch extends VacBotCommand {
    constructor() {
        super('getBorderSwitch');
    }
}

/**
 * Requests information about the Firmware
 * and 'Over The Air' updates (e.g. X1 series, Airbot Z1)
 * (e.g. version, status, progress)
 * @extends VacBotCommand
 */
class GetOta extends VacBotCommand {
    constructor() {
        super('getOta');
    }
}

/**
 * Requests information about the relocation status (e.g. X1 series, Airbot Z1)
 * @extends VacBotCommand
 */
class GetRelocationState extends VacBotCommand {
    constructor() {
        super('getRelocationState');
    }
}

/**
 * Requests the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetSweepMode extends VacBotCommand {
    constructor() {
        super('getSweepMode');
    }
}

/**
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetVoiceAssistantState extends VacBotCommand {
    constructor() {
        super('getVoiceAssistantState');
    }
}

/**
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
class GetWorkMode extends VacBotCommand {
    constructor() {
        super('getWorkMode');
    }
}

/**
 * Request information about the work status
 * @extends VacBotCommand
 */
class GetWorkState extends VacBotCommand {
    constructor() {
        super('getWorkState');
    }
}

/**
 * Request information about the 'Scheduled Cleaning' tasks
 * @extends VacBotCommand
 */
class GetSchedule extends VacBotCommand {
    constructor() {
        super('getSched');
    }
}

/**
 * Request information about the 'Scheduled Cleaning' tasks
 * Used by newer models
 * @extends VacBotCommand
 */
class GetSchedule_V2 extends VacBotCommand {
    constructor() {
        super('getSched_V2', {
            type: 1
        });
    }
}

/**
 * Request information about the total stats
 * total square meters ('area'), total seconds ('time'), total number ('count')
 * @extends VacBotCommand
 * TODO: potential duplicate of GetCleanSum (clean.js)
 */
class GetTotalStats extends VacBotCommand {
    constructor() {
        super('getTotalStats');
    }
}

/**
 * Request information about the stats
 * @extends VacBotCommand
 */
class GetStats extends VacBotCommand {
    constructor() {
        super('getStats');
    }
}

/**
 * Request information about the
 * 'Customized Scenario Cleaning' scenarios (T20, X2 series)
 *
 * @extends VacBotCommand
 */
class GetQuickCommand extends VacBotCommand {
    constructor(type = '1,2') {
        super('getQuickCommand', {
            'type': type
        });
    }
}

/**
 * Request information about the Wi-Fi that is in use
 * and also about the stored Wi-Fi settings
 * (incl. Password in plain text!)
 * @extends VacBotCommand
 */
class GetWifiList extends VacBotCommand {
    constructor() {
        super('getWifiList');
    }
}

/**
 * Air quality (Z1 Air Quality Monitor)
 * @extends VacBotCommand
 */
class GetJCYAirQuality extends VacBotCommand {
    constructor() {
        super('getJCYAirQuality');
    }
}

/**
 * Air quality (Airbot Z1)
 * @extends VacBotCommand
 */
class GetAirQuality extends VacBotCommand {
    constructor() {
        super('getAirQuality');
    }
}

/**
 * Requests an object with data
 * for the 'Linked Purification' function
 * (linked to Air Quality Monitor)
 * @extends VacBotCommand
 */
class GetAirbotAutoModel extends VacBotCommand {
    constructor() {
        super('getAirbotAutoModel');
    }
}

/**
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
class GetAngleFollow extends VacBotCommand {
    constructor() {
        super('getAngleFollow');
    }
}

/**
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
class GetAtmoLight extends VacBotCommand {
    constructor() {
        super('getAtmoLight');
    }
}

/**
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
class GetAtmoVolume extends VacBotCommand {
    constructor() {
        super('getAtmoVolume');
    }
}

/**
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
class GetBlueSpeaker extends VacBotCommand {
    constructor() {
        super('getBlueSpeaker');
    }
}

/**
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
class GetChildLock extends VacBotCommand {
    constructor() {
        super('getChildLock');
    }
}

/**
 * Request the enabled state for 'DrivingWheel'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
class GetDrivingWheel extends VacBotCommand {
    constructor() {
        super('getDrivingWheel');
    }
}

/**
 * Request the enabled state of the
 * 'Lab Features' => 'Follow Me'
 * @extends VacBotCommand
 */
class GetHumanoidFollow extends VacBotCommand {
    constructor() {
        super('getHumanoidFollow');
    }
}

/**
 * Request Video Manager status info
 * @extends VacBotCommand
 */
class GetLiveLaunchPwdState extends VacBotCommand {
    constructor() {
        super('getLiveLaunchPwdState');
    }
}

/**
 * Request the enabled state of the microphone
 * @extends VacBotCommand
 */
class GetMic extends VacBotCommand {
    constructor() {
        super('getMic');
    }
}

/**
 * Request the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
class GetMonitorAirState extends VacBotCommand {
    constructor() {
        super('getMonitorAirState');
    }
}

/**
 * Request various information about the 'Purification Scenario'
 * @extends VacBotCommand
 */
class GetScene extends VacBotCommand {
    constructor() {
        super('getScene');
    }
}

/**
 * Request data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
class GetThreeModule extends VacBotCommand {
    constructor() {
        super('getThreeModule', []);
    }
}

/**
 * Request status data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
class GetThreeModuleStatus extends VacBotCommand {
    constructor() {
        super('getThreeModuleStatus');
    }
}

/**
 * Request information about the 'Time Zone'
 * @extends VacBotCommand
 */
class GetTimeZone extends VacBotCommand {
    constructor() {
        super('getTimeZone');
    }
}

/**
 * Request enabled state for the 'VoiceLifeRemindState'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
class GetVoiceLifeRemindState extends VacBotCommand {
    constructor() {
        super('getVoiceLifeRemindState');
    }
}

/**
 * Request enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
class GetVoiceSimple extends VacBotCommand {
    constructor() {
        super('getVoiceSimple');
    }
}

/**
 * Request information if the 'Cross Map Border Warning' is enabled
 * @extends VacBotCommand
 */
class GetCrossMapBorderWarning extends VacBotCommand {
    constructor() {
        super('getCrossMapBorderWarning');
    }
}

/**
 * Request information about the 'Cut Direction'
 * @extends VacBotCommand
 */
class GetCutDirection extends VacBotCommand {
    constructor() {
        super('getCutDirection');
    }
}

/**
 * Request information about the 'Fan Speed'
 * @extends VacBotCommand
 */
class GetFanSpeed extends VacBotCommand {
    constructor() {
        super('getSpeed');
    }
}

/**
 * Request information if the 'Move Up Warning' is enabled
 * @extends VacBotCommand
 */
class GetMoveUpWarning extends VacBotCommand {
    constructor() {
        super('getMoveupWarning');
    }
}

/**
 * Requests information about the connected network and Wi-Fi (Legacy)
 * @extends VacBotCommand
 */
class GetNetInfoLegacy extends VacBotCommand {
    constructor() {
        super('GetNetInfo');
    }
}

/**
 * Request information if the 'Safe Protect' option is enabled
 * @extends VacBotCommand
 */
class GetSafeProtect extends VacBotCommand {
    constructor() {
        super('getSafeProtect');
    }
}

/**
 * Request an array of cleaning log information
 * The `count` attribute seems to have no affect,
 * but it has to be set anyway
 * @extends VacBotCommand
 */
class GetCleanLogs extends VacBotCommand {
    constructor(count = 0) {
        super('GetCleanLogs',
            {
                'count': count
            },
            constants.CLEANLOGS_PATH);
    }
}

module.exports = {
    GetBatteryState,
    GetLifeSpan,
    GetError,
    GetWaterInfo,
    GetNetInfo,
    GetSleepStatus,
    GetVolume,
    GetAutoEmpty,
    EmptyDustBin,
    EmptyDustBinSA,
    GetDoNotDisturb,
    GetAdvancedMode,
    GetRecognization,
    GetTrueDetect,
    GetDusterRemind,
    GetCarpetPressure,
    GetCarpetInfo,
    GetStationState,
    GetStationInfo,
    GetWashInterval,
    GetWashInfo,
    GetAirDrying,
    Drying,
    GetDryingDuration,
    GetBorderSpin,
    GetBorderSwitch,
    GetOta,
    GetRelocationState,
    GetSweepMode,
    GetVoiceAssistantState,
    GetWorkMode,
    GetWorkState,
    GetSchedule,
    GetSchedule_V2,
    GetTotalStats,
    GetStats,
    GetQuickCommand,
    GetWifiList,
    GetJCYAirQuality,
    GetAirQuality,
    GetAirbotAutoModel,
    GetAngleFollow,
    GetAtmoLight,
    GetAtmoVolume,
    GetBlueSpeaker,
    GetChildLock,
    GetDrivingWheel,
    GetHumanoidFollow,
    GetLiveLaunchPwdState,
    GetMic,
    GetMonitorAirState,
    GetScene,
    GetThreeModule,
    GetThreeModuleStatus,
    GetTimeZone,
    GetVoiceLifeRemindState,
    GetVoiceSimple,
    GetCrossMapBorderWarning,
    GetCutDirection,
    GetFanSpeed,
    GetMoveUpWarning,
    GetNetInfoLegacy,
    GetSafeProtect,
    GetCleanLogs,
};