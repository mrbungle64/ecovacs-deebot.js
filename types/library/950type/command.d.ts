/**
 * This class is essentially a template for creating a command for a bot,
 * which includes a command name, arguments (payload), and an API endpoint
 */
declare class VacBotCommand {
    /**
     * @constructor
     * @param {string} name - The name of the command
     * @param {object} [payload={}] - The payload object of the command (optional)
     * @param {string} [api=] - The hostname of the API endpoint (optional)
     */
    constructor(name: string, payload?: object, api?: string);
    name: string;
    args: any;
    api: string;
    getId(): any;
}
/**
 * Represents a command to add a new sub set
 * Default type is `vw` = virtual wall
 * @extends AddMapSubSet
 */
export class AddMapVirtualBoundary extends AddMapSubSet {
}
/**
 * Represents the 'charge' function
 * @extends VacBotCommand
 */
export class Charge extends VacBotCommand {
    constructor();
}
/**
 * It represents a basic clean mode,
 * and it runs an auto clean command
 * @extends VacBotCommand
 */
export class Clean extends VacBotCommand {
    /**
     * @constructor
     * @param {string} [mode='auto'] - The mode for cleaning. Default is 'auto'
     * @param {string} [action='start'] - The action for cleaning. Default is 'start'
     * @param {Object} [kwargs={}] - Additional arguments in the form of key-value pairs
     * @return {void}
     */
    constructor(mode?: string, action?: string, kwargs?: any);
}
/**
 * Similar to the `Clean` class but with a different payload structure
 * Used for most newer models than OZMO 920/950 (e.g. T8, T9, X1 series etc.)
 * @extends VacBotCommand
 */
export class Clean_V2 extends VacBotCommand {
    constructor(mode?: string, action?: string, kwargs?: {});
}
/**
 * Represents a 'Custom' area cleaning mode
 * @extends Clean
 */
export class CustomArea extends Clean {
    constructor(action?: string, area?: string, cleanings?: number);
}
/**
 * Represents a 'Custom' area cleaning mode
 * Similar to the `CustomArea` class but with a different payload structure
 * Used by newer models
 * @extends Clean_V2
 */
export class CustomArea_V2 extends Clean_V2 {
    constructor(area?: string, cleanings?: number, donotClean?: number);
}
/**
 * Represents a command to delete a sub set
 * Default type is `vw` = virtual wall
 * @extends DeleteMapSubSet
 */
export class DeleteMapVirtualBoundary extends DeleteMapSubSet {
}
export class DisableDoNotDisturb extends VacBotCommand {
    constructor();
}
export class Drying extends VacBotCommand {
    constructor(act: any);
}
export class EmptyDustBin extends VacBotCommand {
    constructor();
}
export class SetContinuousCleaning extends VacBotCommand {
    constructor(enable?: number);
}
export class EnableDoNotDisturb extends SetDoNotDisturb {
    constructor(start?: string, end?: string);
}
export class GetAICleanItemState extends VacBotCommand {
    constructor();
}
export class GetAIMap extends VacBotCommand {
    constructor();
}
export class GetAdvancedMode extends VacBotCommand {
    constructor();
}
export class GetAirDrying extends VacBotCommand {
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
 * Requests information about the battery level
 * @extends VacBotCommand
 */
export class GetBatteryState extends VacBotCommand {
    constructor();
}
export class GetBorderSpin extends VacBotCommand {
    constructor();
}
/**
 * Request information about the available maps
 * @extends VacBotCommand
 */
export class GetCachedMapInfo extends VacBotCommand {
    constructor();
}
export class GetCarpetPressure extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the charge status
 * @extends VacBotCommand
 */
export class GetChargeState extends VacBotCommand {
    constructor();
}
export class GetCleanCount extends VacBotCommand {
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
export class GetCleanPreference extends VacBotCommand {
    constructor();
}
/**
 * Requests the 'Suction Power' level
 * @extends VacBotCommand
 */
export class GetCleanSpeed extends VacBotCommand {
    constructor();
}
/**
 * Requests various information about the cleaning status
 * @extends VacBotCommand
 * TODO: Rename to `GetCleanInfo`
 */
export class GetCleanState extends VacBotCommand {
    constructor();
}
/**
 * Requests various information about the cleaning status
 * Similar to the `GetCleanState` class
 * Used by newer models
 * @extends VacBotCommand
 * TODO: Rename to `GetCleanInfo_V2`
 */
export class GetCleanState_V2 extends VacBotCommand {
    constructor();
}
/**
 * Request various information about the current/last cleaning
 * @extends VacBotCommand
 */
export class GetCleanSum extends VacBotCommand {
    constructor();
}
export class GetContinuousCleaning extends VacBotCommand {
    constructor();
}
/**
 * Requests the `Mopping Mode` (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetCustomAreaMode extends VacBotCommand {
    constructor();
}
export class GetDoNotDisturb extends VacBotCommand {
    constructor();
}
export class GetDusterRemind extends VacBotCommand {
    constructor();
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
export class GetLiveLaunchPwdState extends VacBotCommand {
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
 * Request information about a (spot) area
 * @extends GetMapSubSet
 */
export class GetMapSpotAreaInfo extends GetMapSubSet {
    constructor(mapID: any, mapSubSetID: any);
}
/**
 * Request information about the (spot) areas
 * @extends GetMapSet
 */
export class GetMapSpotAreas extends GetMapSet {
    constructor(mapID: any);
}
/**
 * Request information * about the (spot) areas for newer models (e.g. X1 series)
 * @extends GetMapSet_V2
 */
export class GetMapSpotAreas_V2 extends GetMapSet_V2 {
    constructor(mapID: any);
}
/**
 * Request information about if a map is built
 * @extends VacBotCommand
 */
export class GetMapState extends VacBotCommand {
    constructor();
}
/**
 * Represents a `getMapTrace` command
 * TODO: Implementation of handling the response
 * @extends VacBotCommand
 */
export class GetMapTrace extends VacBotCommand {
    constructor(traceStart?: number, pointCount?: number);
}
export class GetMapTrace_V2 extends VacBotCommand {
    constructor(type?: number);
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
 * Request information about a sub set
 * Default type is `vw` = virtual wall
 * @extends GetMapSubSet
 */
export class GetMapVirtualBoundaryInfo extends GetMapSubSet {
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
 * Request information about if more than 1 map is available
 * @extends VacBotCommand
 */
export class GetMultiMapState extends VacBotCommand {
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
 * Requests the position data of the device and the charging station
 * @extends VacBotCommand
 */
export class GetPosition extends VacBotCommand {
    constructor();
}
export class GetRecognization extends VacBotCommand {
    constructor();
}
export class GetSchedule extends VacBotCommand {
    constructor();
}
export class GetSchedule_V2 extends VacBotCommand {
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
export class GetStationInfo extends VacBotCommand {
    constructor();
}
export class GetStationState extends VacBotCommand {
    constructor();
}
/**
 * Requests the sweep mode (e.g. X1 series)
 */
export class GetSweepMode extends VacBotCommand {
    constructor();
}
export class GetTrueDetect extends VacBotCommand {
    constructor();
}
export class GetVoiceAssistantState extends VacBotCommand {
    constructor();
}
/**
 * Request the volume value
 * @extends VacBotCommand
 */
export class GetVolume extends VacBotCommand {
    constructor();
}
export class GetWashInterval extends VacBotCommand {
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
 * Requests the "Cleaning Mode" (e.g. T20 series)
 */
export class GetWorkMode extends VacBotCommand {
    constructor();
}
/**
 * Represents a 'Hosted mode' cleaning
 * Used by newer models (e.g. X1 series)
 * @extends Clean_V2
 */
export class HostedCleanMode extends Clean_V2 {
    constructor();
}
/**
 * Sends the device to a specific position
 * without cleaning ('go to position')
 * Used by newer models (e.g. T9 and X1 series)
 * @extends Clean_V2
 */
export class MapPoint_V2 extends Clean_V2 {
    constructor(area?: string);
}
/**
 * Represents a 'Move' command
 * The move commands often do not work properly on newer models
 * @extends VacBotCommand
 */
export class Move extends VacBotCommand {
    constructor(action: any);
}
/**
 * Represents a 'Move Backward' command
 * @extends Move
 */
export class MoveBackward extends Move {
    constructor();
}
/**
 * Represents a 'Move Forward' command
 * @extends Move
 */
export class MoveForward extends Move {
    constructor();
}
/**
 * Represents the 'pause' function
 * @extends VacBotCommand
 */
export class Pause extends VacBotCommand {
    constructor();
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
 * This command is used to manually relocate the position of a device
 * Works for models like OZMO 920/950 and the T8 series
 * @extends VacBotCommand
 */
export class Relocate extends VacBotCommand {
    constructor();
}
/**
 * Resets the life span value for a specific component to 100%
 * @extends VacBotCommand
 */
export class ResetLifeSpan extends VacBotCommand {
    constructor(component: any);
}
/**
 * Represents the 'resume' function
 * @extends VacBotCommand
 */
export class Resume extends VacBotCommand {
    constructor();
}
export class SetAdvancedMode extends VacBotCommand {
    constructor(enable?: number);
}
export class SetAirDrying extends VacBotCommand {
    constructor(act?: string);
}
/**
 * Sets the value if 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
export class SetAutoEmpty extends VacBotCommand {
    constructor(enable?: number);
}
export class SetBorderSpin extends VacBotCommand {
    constructor(enable?: number);
}
export class SetCarpetPressure extends VacBotCommand {
    constructor(enable?: number);
}
export class SetCleanCount extends VacBotCommand {
    constructor(count?: number);
}
export class SetCleanPreference extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the 'Suction Power' level
 * @extends VacBotCommand
 */
export class SetCleanSpeed extends VacBotCommand {
    constructor(level: any);
}
/**
 * Sets the `Mopping Mode` (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetCustomAreaMode extends VacBotCommand {
    constructor(sweepMode?: number);
}
export class SetDoNotDisturb extends VacBotCommand {
    constructor(enable?: number, start?: string, end?: string);
}
export class SetDusterRemind extends VacBotCommand {
    constructor(enable?: number, period?: number);
}
/**
 * Represents a command to merge rooms
 * Not yet used and not yet tested
 * @extends VacBotCommand
 */
export class SetMapSet extends VacBotCommand {
    constructor(mapID: any, subsets: any, act?: string);
}
export class SetMapSet_V2 extends VacBotCommand {
    constructor(mapID: any, mapArray: any);
}
export class SetRecognization extends VacBotCommand {
    constructor(state?: number);
}
/**
 * Sets the "Sweep Only" mode (e.g. X1 series)
 */
export class SetSweepMode extends VacBotCommand {
    constructor(type?: number);
}
export class SetTrueDetect extends VacBotCommand {
    constructor(enable?: number);
}
export class SetVoiceAssistantState extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Set the volume value
 * @extends VacBotCommand
 */
export class SetVolume extends VacBotCommand {
    constructor(volume?: number);
}
export class SetWashInterval extends VacBotCommand {
    constructor(interval?: number);
}
/**
 * Sets the 'Water Flow Level'
 * (and the 'Scrubbing Pattern' for a few models)
 * @extends VacBotCommand
 */
export class SetWaterLevel extends VacBotCommand {
    constructor(level: any, sweepType?: number);
}
/**
 * Sets the "Cleaning Mode" (e.g. T20 series)
 */
export class SetWorkMode extends VacBotCommand {
    constructor(mode?: number);
}
/**
 * Represents a (spot) 'Area' cleaning mode
 * @extends Clean
 */
export class SpotArea extends Clean {
    constructor(action?: string, area?: string, cleanings?: number);
}
/**
 * Represents a (spot) 'Area' cleaning mode
 * Similar to the `SpotArea` class but with a different payload structure
 * Used by newer models
 * @extends Clean_V2
 */
export class SpotArea_V2 extends Clean_V2 {
    constructor(area?: string, cleanings?: number);
}
/**
 * Represents the 'stop' function
 * @extends VacBotCommand
 */
export class Stop extends VacBotCommand {
    constructor();
}
export class Washing extends Clean_V2 {
    constructor(action?: string);
}
export class Area_V2 extends Clean_V2 {
    constructor();
}
export class GetAirQuality extends VacBotCommand {
    constructor();
}
export class GetAirbotAutoModel extends VacBotCommand {
    constructor();
}
export class GetAngleFollow extends VacBotCommand {
    constructor();
}
export class GetAntiDrop extends VacBotCommand {
    constructor();
}
export class GetAtmoLight extends VacBotCommand {
    constructor();
}
export class GetAtmoVolume extends VacBotCommand {
    constructor();
}
export class GetAudioCallState extends VacBotCommand {
    constructor();
}
export class GetAutonomousClean extends VacBotCommand {
    constructor();
}
export class GetBlock extends VacBotCommand {
    constructor();
}
export class GetBlueSpeaker extends VacBotCommand {
    constructor();
}
export class GetBreakPoint extends VacBotCommand {
    constructor();
}
export class GetChildLock extends VacBotCommand {
    constructor();
}
export class GetDrivingWheel extends VacBotCommand {
    constructor();
}
export class GetHumanoidFollow extends VacBotCommand {
    constructor();
}
export class GetJCYAirQuality extends VacBotCommand {
    constructor();
}
export class GetMic extends VacBotCommand {
    constructor();
}
export class GetMonitorAirState extends VacBotCommand {
    constructor();
}
export class GetOta extends VacBotCommand {
    constructor();
}
export class GetRelocationState extends VacBotCommand {
    constructor();
}
export class GetScene extends VacBotCommand {
    constructor();
}
export class GetThreeModule extends VacBotCommand {
    constructor();
}
export class GetThreeModuleStatus extends VacBotCommand {
    constructor();
}
export class GetTimeZone extends VacBotCommand {
    constructor();
}
export class GetTotalStats extends VacBotCommand {
    constructor();
}
export class GetVoice extends VacBotCommand {
    constructor();
}
export class GetVoiceLifeRemindState extends VacBotCommand {
    constructor();
}
export class GetVoiceSimple extends VacBotCommand {
    constructor();
}
export class GetWifiList extends VacBotCommand {
    constructor();
}
export class SetAirbotAutoModel extends VacBotCommand {
    constructor(on?: number, aqEnd?: number, aqStart?: number);
}
export class SetAngleFollow extends VacBotCommand {
    constructor(on?: number);
}
export class SetAtmoLight extends VacBotCommand {
    constructor(intensity?: number);
}
export class SetAtmoVolume extends VacBotCommand {
    constructor(volume?: number);
}
export class SetAutonomousClean extends VacBotCommand {
    constructor(on?: number);
}
export class SetBlock extends VacBotCommand {
    constructor(enable?: number, start?: string, end?: string);
}
export class SetBlueSpeaker extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Set the 'Fan Speed' for Airbot Z1
 * 1 = 'quiet'
 * 2 = 'standard'
 * 3 = 'strong'
 * 4 = 'smart'
 * @extends VacBotCommand
 */
export class SetFanSpeed extends VacBotCommand {
    constructor(level: any);
}
export class SetFreshenerLevel extends SetThreeModule {
    constructor(level?: number, enable?: number);
}
export class SetHumidifierLevel extends SetThreeModule {
    constructor(level?: number, enable?: number);
}
export class SetMic extends VacBotCommand {
    constructor(on?: number);
}
export class SetMonitorAirState extends VacBotCommand {
    constructor(on?: number);
}
export class SetThreeModule extends VacBotCommand {
    constructor(level?: number, type?: string, enable?: number);
}
export class SetUVCleaner extends SetThreeModule {
    constructor(enable?: number);
}
export class SetVoice extends VacBotCommand {
    constructor(enable?: number, md5sum?: string, size?: number, type?: string, url?: string, vid?: string);
}
export class SetVoiceSimple extends VacBotCommand {
    constructor(on?: number);
}
export class SinglePoint_V2 extends Clean_V2 {
    constructor(spotCoordinates?: string);
}
export class VideoOpened extends VacBotCommand {
    constructor();
}
/**
 * 'Edge' cleaning mode
 * Used by models with Random navigation (e.g. U2 series)
 * @deprecated
 * @extends Clean
 */
export class Edge extends Clean {
    constructor();
}
/**
 * 'Spot' cleaning mode
 * Used by models with Random navigation (e.g. U2 series)
 * @deprecated
 * @extends Clean
 */
export class Spot extends Clean {
    constructor();
}
/**
 * @deprecated
 * @extends Move
 */
export class MoveLeft extends Move {
    constructor();
}
/**
 * @deprecated
 * @extends Move
 */
export class MoveRight extends Move {
    constructor();
}
/**
 * @deprecated
 * @extends Move
 */
export class MoveTurnAround extends Move {
    constructor();
}
/**
 * Represents a command to add a new sub set
 * Default type is `vw` = virtual wall
 * @extends VacBotCommand
 */
declare class AddMapSubSet extends VacBotCommand {
    constructor(mapID: any, coordinates: any, mapSubSetType?: string);
}
/**
 * Represents a command to delete a sub set
 * Default type is `vw` = virtual wall
 * @extends VacBotCommand
 */
declare class DeleteMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string);
}
/**
 * Represents a `getMapSubSet` command
 * Default type is `ar` = spot areas
 * @extends VacBotCommand
 */
declare class GetMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string);
}
export { VacBotCommand as Generic };
//# sourceMappingURL=command.d.ts.map