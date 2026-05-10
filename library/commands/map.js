'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

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
 * Requests the position data of the device and the charging station
 * @extends VacBotCommand
 */
class GetPosition extends VacBotCommand {
    constructor() {
        super('getPos', ['chargePos', 'deebotPos']);
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
 * Represents a command to back up, restore, modify or delete maps
 *
 * Possible values for `act`:
 * - backup
 * - restore
 * - mod
 * - del
 *
 * Tested on Airbot Z1
 * @extends VacBotCommand
 */
class SetCachedMapInfo extends VacBotCommand {
    constructor(act, mid = null, reMid = null) {
        super('setCachedMapInfo', {
            'act': act, mid, reMid
        });
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
 * Represents a command to clear a map
 * @extends VacBotCommand
 */
class ClearMap extends VacBotCommand {
    constructor() {
        super('clearMap', {
            'type': 'all'
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
    constructor(mapID, mapSubSetID, type = 'ar', msid = null) {
        super('getMapSubSet', {
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type,
            'msid': msid
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
 * Represents a command to set the major map
 * @extends VacBotCommand
 */
class SetMajorMap extends VacBotCommand {
    constructor(mapID) {
        super('setMajorMap', {
            'mid': mapID
        });
    }
}

/**
 * Represents a command to set the relocation state
 * @extends VacBotCommand
 * TODO: potential duplicate of Relocate
 */
class SetRelocationState extends VacBotCommand {
    constructor() {
        super('setRelocationState', {
            'mode': 'manu'
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

module.exports = {
    Relocate,
    GetPosition,
    GetMajorMap,
    GetMinorMap,
    GetMapTrace,
    GetMapInfo,
    GetMapInfo_V2,
    GetMapInfo_V2_Yeedi,
    GetCachedMapInfo,
    SetCachedMapInfo,
    GetMapSet,
    GetMapSet_V2,
    ClearMap,
    SetMapSet,
    GetMapVirtualBoundaries,
    GetMapVirtualBoundaries_V2,
    GetMapSubSet,
    DeleteMapSubSet,
    AddMapSubSet,
    GetMapVirtualBoundaryInfo,
    DeleteMapVirtualBoundary,
    AddMapVirtualBoundary,
    GetMapState,
    GetMultiMapState,
    GetAIMap,
    SetMapSet_V2,
    SetMajorMap,
    SetRelocationState,
    GetMapTrace_V2,
};