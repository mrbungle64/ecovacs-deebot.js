/**
 * This command is used to manually relocate the position of a device
 * Works for models like OZMO 920/950 and the T8 series
 * @extends VacBotCommand
 */
export class Relocate extends VacBotCommand {
    constructor();
}
/**
 * Requests the position data of the device and the charging station
 * @extends VacBotCommand
 */
export class GetPosition extends VacBotCommand {
    constructor();
}
/**
 * Request map data via `getMajorMap` command
 * TODO: Finish implementation of handling the response
 * @extends VacBotCommand
 */
export class GetMajorMap extends VacBotCommand {
    constructor();
}
/**
 * Request map image data via `getMinorMap` command
 * TODO: Finish implementation of handling the response
 * @extends VacBotCommand
 */
export class GetMinorMap extends VacBotCommand {
    constructor(mid: any, pieceIndex: any, type?: string);
}
/**
 * Represents a `getMapTrace` command
 * TODO: Implementation of handling the response
 * @extends VacBotCommand
 */
export class GetMapTrace extends VacBotCommand {
    constructor(traceStart?: number, pointCount?: number);
}
/**
 * Represents a command to get map image data
 * @extends VacBotCommand
 */
export class GetMapInfo extends VacBotCommand {
    /**
     * @param {string} mapID - The ID of the map
     * @param {string} [mapType='outline'] - The type of the map. Default value is 'outline'
     */
    constructor(mapID: string, mapType?: string);
}
/**
 * Represents a `getMapInfo_V2` command (e.g. Deebot X1)
 * @extends VacBotCommand
 */
export class GetMapInfo_V2 extends VacBotCommand {
    constructor(mapID: any, type?: string);
}
/**
 * Request information about the available maps
 * @extends VacBotCommand
 */
export class GetMapInfo_V2_Yeedi extends VacBotCommand {
    constructor(mapType?: string);
}
/**
 * Request information about the available maps
 * @extends VacBotCommand
 */
export class GetCachedMapInfo extends VacBotCommand {
    constructor();
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
export class SetCachedMapInfo extends VacBotCommand {
    constructor(act: any, mid?: null, reMid?: null);
}
/**
 * Request information about areas and virtual walls
 * @extends VacBotCommand
 */
export class GetMapSet extends VacBotCommand {
    constructor(mapID: any, type?: string);
}
/**
 * Request information about areas and virtual walls
 * used by newer models
 * @extends VacBotCommand
 */
export class GetMapSet_V2 extends VacBotCommand {
    constructor(mapID: any, type?: string);
}
/**
 * Represents a command to clear a map
 * @extends VacBotCommand
 */
export class ClearMap extends VacBotCommand {
    constructor();
}
/**
 * Represents a command to merge rooms
 * Not yet used and not yet tested
 * @extends VacBotCommand
 */
export class SetMapSet extends VacBotCommand {
    constructor(mapID: any, subsets: any, act?: string);
}
/**
 * Request information about the virtual boundaries
 * @extends GetMapSet
 */
export class GetMapVirtualBoundaries extends GetMapSet {
}
/**
 * Request information about the virtual boundaries for newer models (e.g. X1 series)
 * @extends GetMapSet_V2
 */
export class GetMapVirtualBoundaries_V2 extends GetMapSet_V2 {
}
/**
 * Requests information of a map sub set
 * Default type is `ar` = spot areas
 * @extends VacBotCommand
 */
export class GetMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string, msid?: null);
}
/**
 * Represents a command to delete a sub set
 * Default type is `vw` = virtual wall
 * @extends VacBotCommand
 */
export class DeleteMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string);
}
/**
 * Represents a command to add a new sub set
 * Default type is `vw` = virtual wall
 * @extends VacBotCommand
 */
export class AddMapSubSet extends VacBotCommand {
    constructor(mapID: any, coordinates: any, mapSubSetType?: string);
}
/**
 * Request information about a sub set
 * Default type is `vw` = virtual wall
 * @extends GetMapSubSet
 */
export class GetMapVirtualBoundaryInfo extends GetMapSubSet {
    constructor(mapID: any, mapSubSetID: any, mapVirtualBoundaryType?: string);
}
/**
 * Represents a command to delete a sub set
 * Default type is `vw` = virtual wall
 * @extends DeleteMapSubSet
 */
export class DeleteMapVirtualBoundary extends DeleteMapSubSet {
}
/**
 * Represents a command to add a new sub set
 * Default type is `vw` = virtual wall
 * @extends AddMapSubSet
 */
export class AddMapVirtualBoundary extends AddMapSubSet {
}
/**
 * Request information about if a map is built
 * @extends VacBotCommand
 */
export class GetMapState extends VacBotCommand {
    constructor();
}
/**
 * Request information about if more than 1 map is available
 * @extends VacBotCommand
 */
export class GetMultiMapState extends VacBotCommand {
    constructor();
}
/**
 * Requests some information about the current map
 * TODO: Handle response data
 * @extends VacBotCommand
 */
export class GetAIMap extends VacBotCommand {
    constructor();
}
/**
 * Set area (sub set) data for the given map
 */
export class SetMapSet_V2 extends VacBotCommand {
    constructor(mapID: any, mapArray: any);
}
/**
 * Represents a command to set the major map
 * @extends VacBotCommand
 */
export class SetMajorMap extends VacBotCommand {
    constructor(mapID: any);
}
/**
 * Represents a command to set the relocation state
 * @extends VacBotCommand
 * TODO: potential duplicate of Relocate
 */
export class SetRelocationState extends VacBotCommand {
    constructor();
}
/**
 * Represents a command to get the map trace
 * TODO: Implement handling of the response
 * @extends VacBotCommand
 */
export class GetMapTrace_V2 extends VacBotCommand {
    constructor(type?: number);
}
import { VacBotCommand } from "./base";
//# sourceMappingURL=map.d.ts.map