'use strict';

const tools = require('../tools');
const constants_type = require('./dictionary');
const constants = require('../constants');

/**
 * This class is essentially a template for creating a command for a bot,
 * which includes a command name, arguments (payload), and an API endpoint
 */
class VacBotCommand {
    /**
     * @constructor
     * @param {string} name - The name of the command
     * @param {object} [payload={}] - The payload object of the command (optional)
     * @param {string} [api=] - The hostname of the API endpoint (optional)
     */
    constructor(name, payload = {}, api = constants.IOT_DEVMANAGER_PATH) {
        this.name = name;
        if (!payload.hasOwnProperty('id')) {
            Object.assign(payload, {
                'id': tools.getReqID()
            });
        }
        this.args = payload;
        this.api = api;
    }

    getId() {
        return this.args.id;
    }
}

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
 * Represents a 'Hosted mode' cleaning
 * Used by newer models (e.g. X1 series)
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
 * @extends VacBotCommand
 */
class Pause extends VacBotCommand {
    constructor() {
        super('clean', {
            'act': 'pause'
        });
    }
}

/**
 * Represents the 'resume' function
 * @extends VacBotCommand
 */
class Resume extends VacBotCommand {
    constructor() {
        super('clean', {
            'act': 'resume'
        });
    }
}

/**
 * Represents the 'stop' function
 * For Airbot Z1 you have to use the `clean_V2` command
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
 * Represents the 'charge' function
 * @extends VacBotCommand
 */
class Charge extends VacBotCommand {
    constructor() {
        super('charge', {
                'act': 'go'
            }
        );
    }
}

/**
 * Represents a 'Move' command
 * The move commands often do not work properly on newer models
 * @extends VacBotCommand
 */
class Move extends VacBotCommand {
    constructor(action) {
        if (constants_type.MOVE_ACTION.hasOwnProperty(action)) {
            action = constants_type.MOVE_ACTION[action];
        }
        super('move', {
            'act': action
        });
    }
}

/**
 * Represents a 'Move Backward' command
 * @extends Move
 */
class MoveBackward extends Move {
    constructor() {
        super('backward');
    }
}

/**
 * Represents a 'Move Forward' command
 * @extends Move
 */
class MoveForward extends Move {
    constructor() {
        super('forward');
    }
}

/**
 * This command is used to manually relocate the position of a device
 * Works for models like OZMO 920/950 and the T8 series
 * @extends VacBotCommand
 */
class Relocate extends VacBotCommand {
    constructor() {
        super('setRelocationState', {
            'mode': 'manu'
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
 * Requests information about the charge status
 * @extends VacBotCommand
 */
class GetChargeState extends VacBotCommand {
    constructor() {
        super('getChargeState');
    }
}

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
 * Set the 'Fan Speed' for Airbot Z1
 * 1 = 'quiet'
 * 2 = 'standard'
 * 3 = 'strong'
 * 4 = 'smart'
 * @extends VacBotCommand
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
 * Requests the 'Water Flow Level'
 * @extends VacBotCommand
 */
class GetWaterInfo extends VacBotCommand {
    constructor() {
        super('getWaterInfo');
    }
}

/**
 * Sets the 'Water Flow Level'
 * (and the 'Scrubbing Pattern' for a few models)
 * @extends VacBotCommand
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
            Object.assign(payload, {'sweepType': sweepType});
        }
        super('setWaterInfo', payload);
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
 * Sets the `Mopping Mode` (e.g. X1 series)
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
 * Requests the position data of the device and the charging station
 * @extends VacBotCommand
 */
class GetPosition extends VacBotCommand {
    constructor() {
        super('getPos', ['chargePos', 'deebotPos']);
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
 * Requests information about the connected network and Wi-Fi
 * @extends VacBotCommand
 */
class GetNetInfo extends VacBotCommand {
    constructor() {
        super('getNetInfo');
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
 * Request map data via `getMajorMap` command
 * TODO: Finish implementation of handling the response
 * @extends VacBotCommand
 */
class GetMajorMap extends VacBotCommand {
    constructor() {
        super('getMajorMap');
    }
}

/**
 * Request map image data via `getMinorMap` command
 * TODO: Finish implementation of handling the response
 * @extends VacBotCommand
 */
class GetMinorMap extends VacBotCommand {
    constructor(mid, pieceIndex, type = 'ol') {
        super('getMinorMap', {
            'mid': mid,
            'pieceIndex': pieceIndex,
            'type': type
        });
    }
}

/**
 * Represents a `getMapTrace` command
 * TODO: Implementation of handling the response
 * @extends VacBotCommand
 */
class GetMapTrace extends VacBotCommand {
    constructor(traceStart = 0, pointCount = 400) {
        super('getMapTrace', {
            'traceStart': traceStart,
            'pointCount': pointCount
        });
    }
}

/**
 * Represents a command to get map image data
 * @extends VacBotCommand
 */
class GetMapInfo extends VacBotCommand {
    /**
     * @param {string} mapID - The ID of the map
     * @param {string} [mapType='outline'] - The type of the map. Default value is 'outline'
     */
    constructor(mapID, mapType = 'outline') {
        const dictToEcovacs = {
            'outline': 'ol',
            'wifiHeatMap': 'st',
            'ai': 'ai',
            'workarea': 'wa'
        };
        if (dictToEcovacs.hasOwnProperty(mapType)) {
            mapType = dictToEcovacs[mapType];
        }
        super('getMapInfo', {
            'mid': mapID,
            'type': mapType
        });
    }
}

/**
 * Represents a `getMapInfo_V2` command (e.g. Deebot X1)
 * @extends VacBotCommand
 */
class GetMapInfo_V2 extends VacBotCommand {
    constructor(mapID, type = '0') {
        super('getMapInfo_V2', {
            'mid': mapID,
            'type': type
        });
    }
}

/**
 * Request information about the available maps
 * @extends VacBotCommand
 */
class GetMapInfo_V2_Yeedi extends VacBotCommand {
    constructor(mapType = '0') {
        super('getMapInfo_V2', {
            'type': mapType
        });
    }
}

/**
 * Request information about the available maps
 * @extends VacBotCommand
 */
class GetCachedMapInfo extends VacBotCommand {
    constructor() {
        super('getCachedMapInfo');
    }
}

/**
 * Request information about areas and virtual walls
 * @extends VacBotCommand
 */
class GetMapSet extends VacBotCommand {
    constructor(mapID, type = 'ar') {
        super('getMapSet', {
            'mid': mapID,
            'type': type
        });
    }
}

/**
 * Request information about areas and virtual walls
 * used by newer models
 * @extends VacBotCommand
 */
class GetMapSet_V2 extends VacBotCommand {
    constructor(mapID, type = 'ar') {
        super('getMapSet_V2', {
            'mid': mapID,
            'type': type
        });
    }
}

/**
 * Represents a command to merge rooms
 * Not yet used and not yet tested
 * @extends VacBotCommand
 */
class SetMapSet extends VacBotCommand {
    constructor(mapID, subsets, act = 'merge') {
        super('setMapSet', {
            'mid': mapID,
            'subsets': subsets,
            'act': act,
            'type': 'ar'
        });
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
 * Request information about the virtual boundaries
 * @extends GetMapSet
 */
class GetMapVirtualBoundaries extends GetMapSet {
    constructor(mapID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapVirtualBoundaryType);
    }
}

/**
 * Request information about the virtual boundaries for newer models (e.g. X1 series)
 * @extends GetMapSet_V2
 */
class GetMapVirtualBoundaries_V2 extends GetMapSet_V2 {
    constructor(mapID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapVirtualBoundaryType);
    }
}

/**
 * Requests information of a map sub set
 * Default type is `ar` = spot areas
 * @extends VacBotCommand
 */
class GetMapSubSet extends VacBotCommand {
    constructor(mapID, mapSubSetID, type = 'ar') {
        super('getMapSubSet', {
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type
        });
    }
}

/**
 * Represents a command to delete a sub set
 * Default type is `vw` = virtual wall
 * @extends VacBotCommand
 */
class DeleteMapSubSet extends VacBotCommand {
    constructor(mapID, mapSubSetID, type = 'vw') {
        super('setMapSubSet', {
            'act': 'del',
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type
        });
    }
}

/**
 * Represents a command to add a new sub set
 * Default type is `vw` = virtual wall
 * @extends VacBotCommand
 */
class AddMapSubSet extends VacBotCommand {
    constructor(mapID, coordinates, mapSubSetType = 'vw') {
        super('setMapSubSet', {
            'act': 'add',
            'mid': mapID,
            'type': mapSubSetType,
            'value': coordinates
        });
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
 * Request information about a sub set
 * Default type is `vw` = virtual wall
 * @extends GetMapSubSet
 */
class GetMapVirtualBoundaryInfo extends GetMapSubSet {
    constructor(mapID, mapSubSetID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapSubSetID, mapVirtualBoundaryType);
    }
}

/**
 * Represents a command to delete a sub set
 * Default type is `vw` = virtual wall
 * @extends DeleteMapSubSet
 */
class DeleteMapVirtualBoundary extends DeleteMapSubSet {
    constructor(mapID, mapSubSetID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapSubSetID, mapVirtualBoundaryType);
    }
}

/**
 * Represents a command to add a new sub set
 * Default type is `vw` = virtual wall
 * @extends AddMapSubSet
 */
class AddMapVirtualBoundary extends AddMapSubSet {
    constructor(mapID, mapVirtualBoundaryCoordinates, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapVirtualBoundaryCoordinates, mapVirtualBoundaryType);
    }
}

/**
 * Request information about if a map is built
 * @extends VacBotCommand
 */
class GetMapState extends VacBotCommand {
    constructor() {
        super('getMapState');
    }
}

/**
 * Request information about if more than 1 map is available
 * @extends VacBotCommand
 */
class GetMultiMapState extends VacBotCommand {
    constructor() {
        super('getMultiMapState');
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
 * Request the volume value
 * @extends VacBotCommand
 */
class GetVolume extends VacBotCommand {
    constructor() {
        super('getVolume');
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
 * Sets the value whether the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
class SetAutoEmpty extends VacBotCommand {
    constructor(enable = 0) {
        super('setAutoEmpty', {
            'enable': enable
        });
    }
}

/**
 * Represents a command to empty the dust bin
 * of the Auto Empty Station
 * @extends VacBotCommand
 */
class EmptyDustBin extends VacBotCommand {
    constructor() {
        super('setAutoEmpty', {
            'act': 'start'
        });
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
 * Request information if the 'Do Not Disturb' option is enabled
 * @extends VacBotCommand
 */
class GetDoNotDisturb extends VacBotCommand {
    constructor() {
        super('getBlock');
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
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
class GetAdvancedMode extends VacBotCommand {
    constructor() {
        super('getAdvancedMode');
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
class GetRecognization extends VacBotCommand {
    constructor() {
        super('getRecognization');
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
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
class GetDusterRemind extends VacBotCommand {
    constructor() {
        super('getDusterRemind');
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
 * Request information about if 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
class GetCarpetPressure extends VacBotCommand {
    constructor() {
        super('getCarpertPressure');
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
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
class GetCarpetInfo extends VacBotCommand {
    constructor() {
        super('getCarpetInfo');
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
 * Start und Stop 'Mopping Pads Cleaning' (e.g. X1 series)
 * @extends Clean_V2
 */
class Washing extends Clean_V2 {
    constructor(action = 'stop') {
        super('washing', action);
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

/**
 * Requests some information about the current map
 * TODO: Handle response data
 * @extends VacBotCommand
 */
class GetAIMap extends VacBotCommand {
    constructor() {
        super('getAIMap', {
            'pointCount': 1,
            'pointStart': 0
        });
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
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetVoiceAssistantState extends VacBotCommand {
    constructor() {
        super('getVoiceAssistantState');
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
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
class GetWorkMode extends VacBotCommand {
    constructor() {
        super('getWorkMode');
    }
}

/**
 * Sets the 'Cleaning Mode' (e.g. T20 series)
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
 */
class GetTotalStats extends VacBotCommand {
    constructor() {
        super('getTotalStats');
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

// =============================
// Air Purifier (e.g. AIRBOT Z1)
// =============================

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
 * Set area (sub set) data for the given map
 */
class SetMapSet_V2 extends VacBotCommand {
    constructor(mapID, mapArray) {
        super('setMapSet_V2', {
            mid: mapID,
            subsets: mapArray
        });
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
 * Sends the 'Linked Purification' (linked to Air Quality Monitor)
 * enabled state and also the start and end value
 * 1, 3, 4 = 'poor <> medium',
 * 1, 2, 4 = 'poor <> Fair',
 * 1, 1, 4 = 'poor <> Good',
 * 1, 2, 3 = 'medium <> fair',
 * 1, 1, 3 = 'medium <> good',
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
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
class GetAngleFollow extends VacBotCommand {
    constructor() {
        super('getAngleFollow');
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
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
class GetAtmoLight extends VacBotCommand {
    constructor() {
        super('getAtmoLight');
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
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
class GetAtmoVolume extends VacBotCommand {
    constructor() {
        super('getAtmoVolume');
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
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
class GetBlueSpeaker extends VacBotCommand {
    constructor() {
        super('getBlueSpeaker');
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
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
class GetChildLock extends VacBotCommand {
    constructor() {
        super('getChildLock');
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

/**
 * Represents a command to get the map trace
 * TODO: Implement handling of the response
 * @extends VacBotCommand
 */
class GetMapTrace_V2 extends VacBotCommand {
    constructor(type = 0) {
        super('getMapTrace_V2', {
            'type': type
        });
    }
}

class GetAreaPoint extends VacBotCommand {
    constructor(mid) {
        super('getAreaPoint', {
            'mid': mid
        });
    }
}

// ===================
// Deprecated commands
// ===================

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

/**
 * @deprecated
 * @extends Move
 */
class MoveLeft extends Move {
    constructor() {
        super('left');
    }
}

/**
 * @deprecated
 * @extends Move
 */
class MoveRight extends Move {
    constructor() {
        super('right');
    }
}

/**
 * @deprecated
 * @extends Move
 */
class MoveTurnAround extends Move {
    constructor() {
        super('turn_around');
    }
}

module.exports.Generic = VacBotCommand;

module.exports.AddMapVirtualBoundary = AddMapVirtualBoundary;
module.exports.Charge = Charge;
module.exports.Clean = Clean;
module.exports.Clean_V2 = Clean_V2;
module.exports.CustomArea = CustomArea;
module.exports.CustomArea_V2 = CustomArea_V2;
module.exports.DeleteMapVirtualBoundary = DeleteMapVirtualBoundary;
module.exports.Drying = Drying;
module.exports.EmptyDustBin = EmptyDustBin;
module.exports.GetAICleanItemState = GetAICleanItemState;
module.exports.GetAIMap = GetAIMap;
module.exports.GetAdvancedMode = GetAdvancedMode;
module.exports.GetAirDrying = GetAirDrying;
module.exports.GetAreaPoint = GetAreaPoint;
module.exports.GetAutoEmpty = GetAutoEmpty;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetBorderSpin = GetBorderSpin;
module.exports.GetCachedMapInfo = GetCachedMapInfo;
module.exports.GetCarpetInfo = GetCarpetInfo;
module.exports.GetCarpetPressure = GetCarpetPressure;
module.exports.GetChargeState = GetChargeState;
module.exports.GetCleanCount = GetCleanCount;
module.exports.GetCleanLogs = GetCleanLogs;
module.exports.GetCleanPreference = GetCleanPreference;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.GetCleanState = GetCleanState;
module.exports.GetCleanState_V2 = GetCleanState_V2;
module.exports.GetCleanSum = GetCleanSum;
module.exports.GetContinuousCleaning = GetContinuousCleaning;
module.exports.GetCustomAreaMode = GetCustomAreaMode;
module.exports.GetDoNotDisturb = GetDoNotDisturb;
module.exports.GetDusterRemind = GetDusterRemind;
module.exports.GetError = GetError;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.GetLiveLaunchPwdState = GetLiveLaunchPwdState;
module.exports.GetMajorMap = GetMajorMap;
module.exports.GetMapInfo = GetMapInfo;
module.exports.GetMapInfo_V2 = GetMapInfo_V2;
module.exports.GetMapInfo_V2_Yeedi = GetMapInfo_V2_Yeedi;
module.exports.GetMapSet = GetMapSet;
module.exports.GetMapSet_V2 = GetMapSet_V2;
module.exports.GetMapSpotAreaInfo = GetMapSpotAreaInfo;
module.exports.GetMapSpotAreas = GetMapSpotAreas;
module.exports.GetMapSpotAreas_V2 = GetMapSpotAreas_V2;
module.exports.GetMapState = GetMapState;
module.exports.GetMapTrace = GetMapTrace;
module.exports.GetMapTrace_V2 = GetMapTrace_V2;
module.exports.GetMapVirtualBoundaries = GetMapVirtualBoundaries;
module.exports.GetMapVirtualBoundaries_V2 = GetMapVirtualBoundaries_V2;
module.exports.GetMapVirtualBoundaryInfo = GetMapVirtualBoundaryInfo;
module.exports.GetMinorMap = GetMinorMap;
module.exports.GetMultiMapState = GetMultiMapState;
module.exports.GetNetInfo = GetNetInfo;
module.exports.GetPosition = GetPosition;
module.exports.GetRecognization = GetRecognization;
module.exports.GetSchedule = GetSchedule;
module.exports.GetSchedule_V2 = GetSchedule_V2;
module.exports.GetSleepStatus = GetSleepStatus;
module.exports.GetStationInfo = GetStationInfo;
module.exports.GetStationState = GetStationState;
module.exports.GetSweepMode = GetSweepMode;
module.exports.GetTrueDetect = GetTrueDetect;
module.exports.GetVoiceAssistantState = GetVoiceAssistantState;
module.exports.GetVolume = GetVolume;
module.exports.GetWashInterval = GetWashInterval;
module.exports.GetWaterInfo = GetWaterInfo;
module.exports.GetWorkMode = GetWorkMode;
module.exports.HostedCleanMode = HostedCleanMode;
module.exports.MapPoint_V2 = MapPoint_V2;
module.exports.Move = Move;
module.exports.MoveBackward = MoveBackward;
module.exports.MoveForward = MoveForward;
module.exports.Pause = Pause;
module.exports.PlaySound = PlaySound;
module.exports.Relocate = Relocate;
module.exports.ResetLifeSpan = ResetLifeSpan;
module.exports.Resume = Resume;
module.exports.SetAdvancedMode = SetAdvancedMode;
module.exports.SetAirDrying = SetAirDrying;
module.exports.SetAutoEmpty = SetAutoEmpty;
module.exports.SetBorderSpin = SetBorderSpin;
module.exports.SetCarpetInfo = SetCarpetInfo;
module.exports.SetCarpetPressure = SetCarpetPressure;
module.exports.SetCleanCount = SetCleanCount;
module.exports.SetCleanPreference = SetCleanPreference;
module.exports.SetCleanSpeed = SetCleanSpeed;
module.exports.SetContinuousCleaning = SetContinuousCleaning;
module.exports.SetCustomAreaMode = SetCustomAreaMode;
module.exports.SetDoNotDisturb = SetDoNotDisturb;
module.exports.SetDusterRemind = SetDusterRemind;
module.exports.SetMapSet = SetMapSet;
module.exports.SetMapSet_V2 = SetMapSet_V2;
module.exports.SetRecognization = SetRecognization;
module.exports.SetSweepMode = SetSweepMode;
module.exports.SetTrueDetect = SetTrueDetect;
module.exports.SetVoiceAssistantState = SetVoiceAssistantState;
module.exports.SetVolume = SetVolume;
module.exports.SetWashInterval = SetWashInterval;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.SetWorkMode = SetWorkMode;
module.exports.SpotArea = SpotArea;
module.exports.SpotArea_V2 = SpotArea_V2;
module.exports.Stop = Stop;
module.exports.Washing = Washing;

// Air Purifier (e.g. AIRBOT Z1)
module.exports.Area_V2 = Area_V2;
module.exports.GetAirQuality = GetAirQuality;
module.exports.GetAirbotAutoModel = GetAirbotAutoModel;
module.exports.GetAngleFollow = GetAngleFollow;
module.exports.GetAtmoLight = GetAtmoLight;
module.exports.GetAtmoVolume = GetAtmoVolume;
module.exports.GetAutonomousClean = GetAutonomousClean;
module.exports.GetBlueSpeaker = GetBlueSpeaker;
module.exports.GetChildLock = GetChildLock;
module.exports.GetDrivingWheel = GetDrivingWheel;
module.exports.GetHumanoidFollow = GetHumanoidFollow;
module.exports.GetJCYAirQuality = GetJCYAirQuality;
module.exports.GetMic = GetMic;
module.exports.GetMonitorAirState = GetMonitorAirState;
module.exports.GetOta = GetOta;
module.exports.GetRelocationState = GetRelocationState;
module.exports.GetScene = GetScene;
module.exports.GetThreeModule = GetThreeModule;
module.exports.GetThreeModuleStatus = GetThreeModuleStatus;
module.exports.GetTimeZone = GetTimeZone;
module.exports.GetTotalStats = GetTotalStats;
module.exports.GetVoiceLifeRemindState = GetVoiceLifeRemindState;
module.exports.GetVoiceSimple = GetVoiceSimple;
module.exports.GetWifiList = GetWifiList;
module.exports.SetAirbotAutoModel = SetAirbotAutoModel;
module.exports.SetAngleFollow = SetAngleFollow;
module.exports.SetAtmoLight = SetAtmoLight;
module.exports.SetAtmoVolume = SetAtmoVolume;
module.exports.SetAutonomousClean = SetAutonomousClean;
module.exports.SetBlueSpeaker = SetBlueSpeaker;
module.exports.SetChildLock = SetChildLock;
module.exports.SetFanSpeed = SetFanSpeed;
module.exports.SetFreshenerLevel = SetFreshenerLevel;
module.exports.SetHumidifierLevel = SetHumidifierLevel;
module.exports.SetMic = SetMic;
module.exports.SetMonitorAirState = SetMonitorAirState;
module.exports.SetThreeModule = SetThreeModule;
module.exports.SetUVCleaner = SetUVCleaner;
module.exports.SetVoice = SetVoice;
module.exports.SetVoiceSimple = SetVoiceSimple;
module.exports.SinglePoint_V2 = SinglePoint_V2;

// Deprecated
module.exports.Edge = Edge;
module.exports.Spot = Spot;
module.exports.MoveLeft = MoveLeft;
module.exports.MoveRight = MoveRight;
module.exports.MoveTurnAround = MoveTurnAround;
