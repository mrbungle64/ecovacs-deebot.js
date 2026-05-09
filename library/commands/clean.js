'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');
const { GetMapSet } = require('./map');
const { GetMapSet_V2 } = require('./map');
const { GetMapSubSet } = require('./map');
const { SetThreeModule } = require('./settings');

/**
 * It represents a basic clean mode,
 * and it runs an auto clean command
 * @extends VacBotCommand
 */
class Clean extends VacBotCommand {
    /**
     * @constructor
     * @param {string} [mode='auto'] - The mode for cleaning. Default is 'auto'
     * @param {string} [action='start'] - The action for cleaning. Default is 'start'
     * @param {Object} [kwargs={}] - Additional arguments in the form of key-value pairs
     * @return {void}
     */
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let payload = {
            'act': constants_type.CLEAN_ACTION_TO_ECOVACS[action],
            'count': 1,
            'donotClean': 0,
            'router': 'plan',
            'type': constants_type.CLEAN_MODE_TO_ECOVACS[mode]
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                payload[key] = kwargs[key];
            }
        }
        super('clean', payload);
    }
}

/**
 * Similar to the `Clean` class but with a different payload structure
 * Used for most newer models than OZMO 920/950 (e.g. T8, T9, X1 series etc.)
 * @extends VacBotCommand
 */
class Clean_V2 extends VacBotCommand {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let payload = {
            'act': constants_type.CLEAN_ACTION_TO_ECOVACS[action],
            'content': {
                'count': 1,
                'donotClean': '',
                'type': constants_type.CLEAN_MODE_TO_ECOVACS[mode]
            },
            'mode': '',
            'router': 'plan'
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                Object.assign(payload[key], kwargs[key]);
            }
        }
        super('clean_V2', payload);
    }
}

/**
 * Represents a 'Custom' area cleaning mode
 * @extends Clean
 */
class CustomArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('customArea', action, {
            'content': area,
            'count': cleaningAsNumber
        });
    }
}

/**
 * Represents a 'Custom' area cleaning mode
 * Similar to the `CustomArea` class but with a different payload structure
 * Used by newer models
 * @extends Clean_V2
 */
class CustomArea_V2 extends Clean_V2 {
    constructor(area = '', cleanings = 1, donotClean = 0) {
        let cleaningAsNumber = Number(cleanings);
        super('customArea', 'start', {
            'content': {
                'total': 0,
                'donotClean': donotClean,
                'count': cleaningAsNumber,
                'value': area
            }
        });
    }
}

/**
 * Represents a (spot) 'Area' cleaning mode
 * @extends Clean
 */
class SpotArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('spotArea', action, {
            'content': area,
            'count': cleaningAsNumber
        });
    }
}

/**
 * Represents a (spot) 'Area' cleaning mode
 * Similar to the `SpotArea` class but with a different payload structure
 * Used by newer models
 * @extends Clean_V2
 */
class SpotArea_V2 extends Clean_V2 {
    constructor(area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('spotArea', 'start', {
            'content': {
                'count': cleaningAsNumber,
                'value': area
            }
        });
    }
}

/**
 * Represents a (spot) 'Area' cleaning mode
 * Similar to the `SpotArea` class but with a different payload structure
 * Used by the X2 series
 * @extends Clean_V2
 */
class FreeClean extends Clean_V2 {
    constructor(areaValues = '') {
        super('freeClean', 'start', {
            'content': {
                'value': areaValues
            }
        });
    }
}

/**
 * Represents a 'Hosted mode' cleaning
 * Used by newer models (e.g. X1 series)
 * With the X2 series it's not a separate mode anymore
 * (There's an option for AI based cleaning)
 * @extends Clean_V2
 */
class HostedCleanMode extends Clean_V2 {
    constructor() {
        super('entrust', 'start');
    }
}

/**
 * Sends the device to a specific position
 * without cleaning ('go to position')
 * Used by newer models (e.g. T9 and X1 series)
 * @extends Clean_V2
 */
class MapPoint_V2 extends Clean_V2 {
    constructor(area = '') {
        super('mapPoint', 'start', {
            'content': {
                'total': 0,
                'donotClean': 0,
                'count': 0,
                'value': area
            }
        });
    }
}

/**
 * Represents the 'pause' function
 * For Airbot Z1 and Deebot X2 you have to use the `clean_V2` command
 * @extends VacBotCommand
 */
class Pause extends VacBotCommand {
    constructor(command = 'clean') {
        super(command, {
            'act': 'pause'
        });
    }
}

/**
 * Represents the 'resume' function
 * @extends VacBotCommand
 */
class Resume extends VacBotCommand {
    constructor(command = 'clean') {
        super(command, {
            'act': 'resume'
        });
    }
}

/**
 * Represents the 'stop' function
 * For Airbot Z1 and Deebot X2 you have to use the `clean_V2` command
 * @extends VacBotCommand
 */
class Stop extends VacBotCommand {
    constructor(command = 'clean') {
        super(command, {
            'act': 'stop'
        });
    }
}

/**
 * Requests various information about the cleaning status
 * @extends VacBotCommand
 * TODO: Rename to `GetCleanInfo`
 */
class GetCleanState extends VacBotCommand {
    constructor() {
        super('getCleanInfo');
    }
}

/**
 * Requests various information about the cleaning status
 * Similar to the `GetCleanState` class
 * Used by newer models
 * @extends VacBotCommand
 * TODO: Rename to `GetCleanInfo_V2`
 */
class GetCleanState_V2 extends VacBotCommand {
    constructor() {
        super('getCleanInfo_V2');
    }
}

/**
 * Requests the 'Suction Power' level
 * @extends VacBotCommand
 */
class GetCleanSpeed extends VacBotCommand {
    constructor() {
        super('getSpeed');
    }
}

/**
 * Sets the 'Suction Power' level
 * @extends VacBotCommand
 */
class SetCleanSpeed extends VacBotCommand {
    constructor(level) {
        if (constants_type.CLEAN_SPEED_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.CLEAN_SPEED_TO_ECOVACS[level];
        }
        super('setSpeed', {
            'speed': level
        });
    }
}

/**
 * Requests the `Mopping Mode` (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetCustomAreaMode extends VacBotCommand {
    constructor() {
        super('getCustomAreaMode');
    }
}

/**
 * Sets the 'Mopping Mode'/'Efficiency' (e.g. X1 series)
 * @extends VacBotCommand
 */
class SetCustomAreaMode extends VacBotCommand {
    constructor(sweepMode = 0) {
        super('setCustomAreaMode', {
            'sweepMode': sweepMode
        });
    }
}

/**
 * Request various information about the current/last cleaning
 * @extends VacBotCommand
 */
class GetCleanSum extends VacBotCommand {
    constructor() {
        super('getTotalStats');
    }
}

/**
 * Request information about the (spot) areas
 * @extends GetMapSet
 */
class GetMapSpotAreas extends GetMapSet {
    constructor(mapID) {
        super(mapID, 'ar');
    }
}

/**
 * Request information * about the (spot) areas for newer models (e.g. X1 series)
 * @extends GetMapSet_V2
 */
class GetMapSpotAreas_V2 extends GetMapSet_V2 {
    constructor(mapID) {
        super(mapID, 'ar');
    }
}

/**
 * Request information about a (spot) area
 * @extends GetMapSubSet
 */
class GetMapSpotAreaInfo extends GetMapSubSet {
    constructor(mapID, mapSubSetID) {
        super(mapID, mapSubSetID, 'ar');
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

/**
 * Request information if the 'Continuous Cleaning'/'Resumed clean' option is enabled
 * @extends VacBotCommand
 */
class GetContinuousCleaning extends VacBotCommand {
    constructor() {
        super('getBreakPoint');
    }
}

/**
 * Sets the value for 'Continuous Cleaning'/'Resumed clean' option
 * @extends VacBotCommand
 */
class SetContinuousCleaning extends VacBotCommand {
    constructor(enable = 0) {
        super('setBreakPoint', {
            'enable': enable
        });
    }
}

/**
 * Request the number of cleaning repetitions ('Cleaning Times')
 * @extends VacBotCommand
 */
class GetCleanCount extends VacBotCommand {
    constructor() {
        super('getCleanCount');
    }
}

/**
 * Sets the number of cleaning repetitions ('Cleaning Times')
 * @extends VacBotCommand
 */
class SetCleanCount extends VacBotCommand {
    constructor(count = 1) {
        super('setCleanCount', {
            'count': count
        });
    }
}

/**
 * Request information if the 'Cleaning Preference' mode is enabled
 * @extends VacBotCommand
 */
class GetCleanPreference extends VacBotCommand {
    constructor() {
        super('getCleanPreference');
    }
}

/**
 * Sets the value whether the 'Cleaning Preference' mode is enabled
 * @extends VacBotCommand
 */
class SetCleanPreference extends VacBotCommand {
    constructor(enable = 0) {
        super('setCleanPreference', {
            'enable': enable
        });
    }
}

/**
 * Receive information if the 'Strategic Particle Removal'
 * and the 'Strategic Pet Poop Avoidance' mode is enabled (e.g. X1 series)
 */
class GetAICleanItemState extends VacBotCommand {
    constructor() {
        super('getAICleanItemState');
    }
}

/**
 * Start und Stop 'Mopping Pads Cleaning' (e.g. X1 series)
 * @extends Clean_V2
 */
class Washing extends Clean_V2 {
    constructor(action = 'stop') {
        super('washing', action);
    }
}

/**
 * Starts an 'Area' cleaning
 * The areas have to be set via 'SetMapSet_V2' command
 * @extends Clean_V2
 */
class Area_V2 extends Clean_V2 {
    constructor() {
        super('area', 'start');
    }
}

/**
 * Starts an 'Spot' cleaning at the given position
 * @extends Clean_V2
 */
class SinglePoint_V2 extends Clean_V2 {
    constructor(spotCoordinates = '') {
        super('singlePoint', 'start', {
            'content': {
                'value': spotCoordinates
            }
        });
    }
}

/**
 * Requests the enabled state
 * of the 'Self-linked Purification' function
 * @extends VacBotCommand
 */
class GetAutonomousClean extends VacBotCommand {
    constructor() {
        super('getAutonomousClean');
    }
}

/**
 * Sets the enabled state
 * of the 'Self-linked Purification' function
 * @extends VacBotCommand
 */
class SetAutonomousClean extends VacBotCommand {
    constructor(on = 0) {
        super('setAutonomousClean', {
            'on': on
        });
    }
}

/**
 * Sets the 'Sanitization' state
 * of the 'UV Sanitizer' module
 *
 * @extends SetThreeModule
 * @constructor
 * @param {number} [enable=0] - The enable state
 */
class SetUVCleaner extends SetThreeModule {
    constructor(enable = 0) {
        super(0, 'uvLight', enable);
    }
}

class GetAreaPoint extends VacBotCommand {
    constructor(mid) {
        super('getAreaPoint', {
            'mid': mid
        });
    }
}

/**
 * 'Edge' cleaning mode
 * Used by models with Random navigation (e.g. U2 series)
 * @deprecated
 * @extends Clean
 */
class Edge extends Clean {
    constructor() {
        super('edge', 'start');
    }
}

/**
 * 'Spot' cleaning mode
 * Used by models with Random navigation (e.g. U2 series)
 * @deprecated
 * @extends Clean
 */
class Spot extends Clean {
    constructor() {
        super('spot', 'start', {
            'content': '0,0'
        });
    }
}

module.exports = {
    Clean,
    Clean_V2,
    CustomArea,
    CustomArea_V2,
    SpotArea,
    SpotArea_V2,
    FreeClean,
    HostedCleanMode,
    MapPoint_V2,
    Pause,
    Resume,
    Stop,
    GetCleanState,
    GetCleanState_V2,
    GetCleanSpeed,
    SetCleanSpeed,
    GetCustomAreaMode,
    SetCustomAreaMode,
    GetCleanSum,
    GetMapSpotAreas,
    GetMapSpotAreas_V2,
    GetMapSpotAreaInfo,
    GetCleanLogs,
    GetContinuousCleaning,
    SetContinuousCleaning,
    GetCleanCount,
    SetCleanCount,
    GetCleanPreference,
    SetCleanPreference,
    GetAICleanItemState,
    Washing,
    Area_V2,
    SinglePoint_V2,
    GetAutonomousClean,
    SetAutonomousClean,
    SetUVCleaner,
    GetAreaPoint,
    Edge,
    Spot,
};
