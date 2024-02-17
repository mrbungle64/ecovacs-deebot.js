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
/**
 * Start und Stop 'Air Drying' (e.g. X1 series)
 * 1 = start
 * 4 = stop
 * @extends VacBotCommand
 */
export class Drying extends VacBotCommand {
    constructor(act: any);
}
/**
 * Represents a command to empty the dust bin
 * of the Auto Empty Station
 * @extends VacBotCommand
 */
export class EmptyDustBin extends VacBotCommand {
    constructor();
}
/**
 * Empty dust bin (e.g. T20 series)
 * `EmptyDustBinSA` = 'EmptyDustBinStationAction'
 * @extends VacBotCommand
 */
export class EmptyDustBinSA extends VacBotCommand {
    constructor();
}
/**
 * Represents a (spot) 'Area' cleaning mode
 * Similar to the `SpotArea` class but with a different payload structure
 * Used by the X2 series
 * @extends Clean_V2
 */
export class FreeClean extends Clean_V2 {
    constructor(areaValues?: string);
}
/**
 * Receive information if the 'Strategic Particle Removal'
 * and the 'Strategic Pet Poop Avoidance' mode is enabled (e.g. X1 series)
 */
export class GetAICleanItemState extends VacBotCommand {
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
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class GetAdvancedMode extends VacBotCommand {
    constructor();
}
/**
 * Receive the value if 'Air Drying' is active (Yeedi Mop Station)
 * The typo in 'AirDring' is intended
 * @extends VacBotCommand
 */
export class GetAirDrying extends VacBotCommand {
    constructor();
}
export class GetAreaPoint extends VacBotCommand {
    constructor(mid: any);
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
/**
 * Requests the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
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
/**
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
export class GetCarpetInfo extends VacBotCommand {
    constructor();
}
/**
 * Request information about if 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
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
/**
 * Request the number of cleaning repetitions ('Cleaning Times')
 * @extends VacBotCommand
 */
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
/**
 * Request information if the 'Cleaning Preference' mode is enabled
 * @extends VacBotCommand
 */
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
/**
 * Request information if the 'Continuous Cleaning'/'Resumed clean' option is enabled
 * @extends VacBotCommand
 */
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
/**
 * Request information if the 'Do Not Disturb' option is enabled
 * @extends VacBotCommand
 */
export class GetDoNotDisturb extends VacBotCommand {
    constructor();
}
/**
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
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
/**
 * Request Video Manager status info
 * @extends VacBotCommand
 */
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
/**
 * Represents a command to get the map trace
 * TODO: Implement handling of the response
 * @extends VacBotCommand
 */
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
/**
 * Request information about the
 * 'Customized Scenario Cleaning' scenarios (T20, X2 series)
 *
 * @extends VacBotCommand
 */
export class GetQuickCommand extends VacBotCommand {
    constructor(type?: string);
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
export class GetRecognization extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * @extends VacBotCommand
 */
export class GetSchedule extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Scheduled Cleaning' tasks
 * Used by newer models
 * @extends VacBotCommand
 */
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
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. model, firmware etc.
 * @extends VacBotCommand
 */
export class GetStationInfo extends VacBotCommand {
    constructor();
}
/**
 * Receive information about the station (e.g. X1 series)
 * e.g. the state of 'Air Drying', 'Mopping Pads Cleaning' etc.
 * @extends VacBotCommand
 */
export class GetStationState extends VacBotCommand {
    constructor();
}
/**
 * Requests the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetSweepMode extends VacBotCommand {
    constructor();
}
/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
export class GetTrueDetect extends VacBotCommand {
    constructor();
}
/**
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
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
/**
 * Request the value whether hot water
 * is used for cleaning the mopping pads (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWashInfo extends VacBotCommand {
    constructor();
}
/**
 * Receive the value of the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
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
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
export class GetWorkMode extends VacBotCommand {
    constructor();
}
/**
 * Represents a 'Hosted mode' cleaning
 * Used by newer models (e.g. X1 series)
 * With the X2 series it's not a separate mode anymore
 * (There's an option for AI based cleaning)
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
 * For Airbot Z1 and Deebot X2 you have to use the `clean_V2` command
 * @extends VacBotCommand
 */
export class Pause extends VacBotCommand {
    constructor(command?: string);
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
/**
 * Sets the value whether the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
export class SetAdvancedMode extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Start und Stop 'Air Drying' (Yeedi Mop Station)
 * @extends VacBotCommand
 */
export class SetAirDrying extends VacBotCommand {
    constructor(act?: string);
}
/**
 * Sets the value whether the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
export class SetAutoEmpty extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetBorderSpin extends VacBotCommand {
    constructor(enable?: number);
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
    constructor(act: any, mid?: any, reMid?: any);
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
 * Sets the value whether the 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
export class SetCarpetPressure extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the number of cleaning repetitions ('Cleaning Times')
 * @extends VacBotCommand
 */
export class SetCleanCount extends VacBotCommand {
    constructor(count?: number);
}
/**
 * Sets the value whether the 'Cleaning Preference' mode is enabled
 * @extends VacBotCommand
 */
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
 * Sets the value for 'Continuous Cleaning'/'Resumed clean' option
 * @extends VacBotCommand
 */
export class SetContinuousCleaning extends VacBotCommand {
    constructor(enable?: number);
}
/**
 * Sets the 'Mopping Mode'/'Efficiency' (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetCustomAreaMode extends VacBotCommand {
    constructor(sweepMode?: number);
}
/**
 * Sets the value for 'Do Not Disturb' option
 * @extends VacBotCommand
 */
export class SetDoNotDisturb extends VacBotCommand {
    constructor(enable?: number, start?: string, end?: string);
}
/**
 * Sets the value whether the 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
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
/**
 * Set area (sub set) data for the given map
 */
export class SetMapSet_V2 extends VacBotCommand {
    constructor(mapID: any, mapArray: any);
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
 * Sets the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
export class SetSweepMode extends VacBotCommand {
    constructor(type?: number);
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
 * Sets the value to enable and disable 'YIKO' (e.g. X1 series)
 * @extends VacBotCommand
 */
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
 * Sets the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
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
 * For Airbot Z1 and Deebot X2 you have to use the `clean_V2` command
 * @extends VacBotCommand
 */
export class Stop extends VacBotCommand {
    constructor(command?: string);
}
/**
 * Start und Stop 'Mopping Pads Cleaning' (e.g. X1 series)
 * @extends Clean_V2
 */
export class Washing extends Clean_V2 {
    constructor(action?: string);
}
/**
 * Starts an 'Area' cleaning
 * The areas have to be set via 'SetMapSet_V2' command
 * @extends Clean_V2
 */
export class Area_V2 extends Clean_V2 {
    constructor();
}
export class BasicPurification extends VacBotCommand {
    constructor();
}
/**
 * Air quality (Airbot Z1)
 * @extends VacBotCommand
 */
export class GetAirQuality extends VacBotCommand {
    constructor();
}
/**
 * Requests an object with data
 * for the 'Linked Purification' function
 * (linked to Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetAirbotAutoModel extends VacBotCommand {
    constructor();
}
/**
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
export class GetAngleFollow extends VacBotCommand {
    constructor();
}
/**
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
export class GetAtmoLight extends VacBotCommand {
    constructor();
}
/**
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
export class GetAtmoVolume extends VacBotCommand {
    constructor();
}
/**
 * Requests the enabled state
 * of the 'Self-linked Purification' function
 * @extends VacBotCommand
 */
export class GetAutonomousClean extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
export class GetBlueSpeaker extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
export class GetChildLock extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state for 'DrivingWheel'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetDrivingWheel extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the
 * 'Lab Features' => 'Follow Me'
 * @extends VacBotCommand
 */
export class GetHumanoidFollow extends VacBotCommand {
    constructor();
}
/**
 * Air quality (Z1 Air Quality Monitor)
 * @extends VacBotCommand
 */
export class GetJCYAirQuality extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the microphone
 * @extends VacBotCommand
 */
export class GetMic extends VacBotCommand {
    constructor();
}
/**
 * Request the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
export class GetMonitorAirState extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the Firmware
 * and 'Over The Air' updates (e.g. X1 series, Airbot Z1)
 * (e.g. version, status, progress)
 * @extends VacBotCommand
 */
export class GetOta extends VacBotCommand {
    constructor();
}
/**
 * Requests information about the relocation status (e.g. X1 series, Airbot Z1)
 * @extends VacBotCommand
 */
export class GetRelocationState extends VacBotCommand {
    constructor();
}
/**
 * Request various information about the 'Purification Scenario'
 * @extends VacBotCommand
 */
export class GetScene extends VacBotCommand {
    constructor();
}
/**
 * Request data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModule extends VacBotCommand {
    constructor();
}
/**
 * Request status data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
export class GetThreeModuleStatus extends VacBotCommand {
    constructor();
}
/**
 * Request information about the 'Time Zone'
 * @extends VacBotCommand
 */
export class GetTimeZone extends VacBotCommand {
    constructor();
}
/**
 * Request information about the total stats
 * total square meters ('area'), total seconds ('time'), total number ('count')
 * @extends VacBotCommand
 */
export class GetTotalStats extends VacBotCommand {
    constructor();
}
/**
 * Request enabled state for the 'VoiceLifeRemindState'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
export class GetVoiceLifeRemindState extends VacBotCommand {
    constructor();
}
/**
 * Request enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
export class GetVoiceSimple extends VacBotCommand {
    constructor();
}
/**
 * Request information about the Wi-Fi that is in use
 * and also about the stored Wi-Fi settings
 * (incl. Password in plain text!)
 * @extends VacBotCommand
 */
export class GetWifiList extends VacBotCommand {
    constructor();
}
export class MobilePurification extends VacBotCommand {
    constructor();
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
 * Sets the enabled state
 * of the 'Self-linked Purification' function
 * @extends VacBotCommand
 */
export class SetAutonomousClean extends VacBotCommand {
    constructor(on?: number);
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
 * Sets the 'Sanitization' state
 * of the 'UV Sanitizer' module
 *
 * @extends SetThreeModule
 * @constructor
 * @param {number} [enable=0] - The enable state
 */
export class SetUVCleaner extends SetThreeModule {
    constructor(enable?: number);
}
/**
 * Sets data for the Voice Report (untested)
 * @extends VacBotCommand
 */
export class SetVoice extends VacBotCommand {
    constructor(enable?: number, md5sum?: string, size?: number, type?: string, url?: string, vid?: string);
}
/**
 * Sets enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
export class SetVoiceSimple extends VacBotCommand {
    constructor(on?: number);
}
/**
 * Starts an 'Spot' cleaning at the given position
 * @extends Clean_V2
 */
export class SinglePoint_V2 extends Clean_V2 {
    constructor(spotCoordinates?: string);
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
 * Requests information of a map sub set
 * Default type is `ar` = spot areas
 * @extends VacBotCommand
 */
declare class GetMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string);
}
export { VacBotCommand as Generic, MapPoint_V2 as SpotPurification };
//# sourceMappingURL=command.d.ts.map