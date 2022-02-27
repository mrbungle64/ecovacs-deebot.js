export class AddMapVirtualBoundary extends AddMapSubSet {
}
export class Charge extends VacBotCommand {
    constructor();
}
export class Clean extends VacBotCommand {
    constructor(mode?: string, action?: string, kwargs?: {});
}
export class Clean_V2 extends VacBotCommand {
    constructor(mode?: string, action?: string, kwargs?: {});
}
export class CustomArea extends Clean {
    constructor(action?: string, area?: string, cleanings?: number);
}
export class CustomArea_V2 extends Clean_V2 {
    constructor(area?: string, cleanings?: number);
}
export class DeleteMapVirtualBoundary extends DeleteMapSubSet {
}
export class DisableContinuousCleaning extends VacBotCommand {
    constructor();
}
export class DisableDoNotDisturb extends VacBotCommand {
    constructor();
}
export class Edge extends Clean {
    constructor();
}
export class EmptyDustBin extends VacBotCommand {
    constructor();
}
export class EnableContinuousCleaning extends VacBotCommand {
    constructor();
}
export class EnableDoNotDisturb extends SetDoNotDisturb {
    constructor(start?: string, end?: string);
}
export class GetAdvancedMode extends VacBotCommand {
    constructor();
}
export class GetAutoEmpty extends VacBotCommand {
    constructor();
}
export class GetBatteryState extends VacBotCommand {
    constructor();
}
export class GetCarpetPressure extends VacBotCommand {
    constructor();
}
export class GetChargeState extends VacBotCommand {
    constructor();
}
export class GetCleanLogs extends VacBotCommand {
    constructor(count?: number);
}
export class GetCleanSpeed extends VacBotCommand {
    constructor();
}
export class GetCleanState extends VacBotCommand {
    constructor();
}
export class GetCleanSum extends VacBotCommand {
    constructor();
}
export class GetContinuousCleaning extends VacBotCommand {
    constructor();
}
export class GetDoNotDisturb extends VacBotCommand {
    constructor();
}
export class GetDusterRemind extends VacBotCommand {
    constructor();
}
export class GetError extends VacBotCommand {
    constructor();
}
export class GetLastCleanLog extends VacBotCommand {
    constructor();
}
export class GetLifeSpan extends VacBotCommand {
    constructor(componentsArray: any);
}
export class GetMapImage extends VacBotCommand {
    constructor(mapID: any, mapType?: string);
}
export class GetMapSet extends VacBotCommand {
    constructor(mapID: any, type?: string);
}
export class GetMapSpotAreaInfo extends GetMapSubSet {
    constructor(mapID: any, mapSubSetID: any);
}
export class GetMapSpotAreas extends GetMapSet {
    constructor(mapID: any);
}
export class GetMapVirtualBoundaries extends GetMapSet {
}
export class GetMapVirtualBoundaryInfo extends GetMapSubSet {
}
export class GetMaps extends VacBotCommand {
    constructor();
}
export class GetNetInfo extends VacBotCommand {
    constructor();
}
export class GetPosition extends VacBotCommand {
    constructor();
}
export class GetSchedule extends VacBotCommand {
    constructor();
}
export class GetSleepStatus extends VacBotCommand {
    constructor();
}
export class GetTrueDetect extends VacBotCommand {
    constructor();
}
export class GetVolume extends VacBotCommand {
    constructor();
}
export class GetWaterInfo extends VacBotCommand {
    constructor();
}
export class Move extends VacBotCommand {
    constructor(action: any);
}
export class MoveBackward extends Move {
    constructor();
}
export class MoveForward extends Move {
    constructor();
}
export class MoveLeft extends Move {
    constructor();
}
export class MoveRight extends Move {
    constructor();
}
export class MoveTurnAround extends Move {
    constructor();
}
export class Pause extends VacBotCommand {
    constructor();
}
export class PlaySound extends VacBotCommand {
    constructor(sid?: number);
}
export class Relocate extends VacBotCommand {
    constructor();
}
export class ResetLifeSpan extends VacBotCommand {
    constructor(component: any);
}
export class Resume extends VacBotCommand {
    constructor();
}
export class SetAdvancedMode extends VacBotCommand {
    constructor(enable?: number);
}
export class SetAutoEmpty extends VacBotCommand {
    constructor(enable?: number);
}
export class SetCarpetPressure extends VacBotCommand {
    constructor(enable?: number);
}
export class SetCleanSpeed extends VacBotCommand {
    constructor(level: any);
}
export class SetDoNotDisturb extends VacBotCommand {
    constructor(enable?: number, start?: string, end?: string);
}
export class SetDusterRemind extends VacBotCommand {
    constructor(enable?: number);
}
export class SetDusterRemindPeriod extends VacBotCommand {
    constructor(period?: number);
}
export class SetTrueDetect extends VacBotCommand {
    constructor(enable?: number);
}
export class SetVolume extends VacBotCommand {
    constructor(volume?: number);
}
export class SetWaterLevel extends VacBotCommand {
    constructor(level: any);
}
export class Spot extends Clean {
    constructor();
}
export class SpotArea extends Clean {
    constructor(action?: string, area?: string, cleanings?: number);
}
export class SpotArea_V2 extends Clean_V2 {
    constructor(area?: string, cleanings?: number);
}
export class Stop extends VacBotCommand {
    constructor();
}
declare class AddMapSubSet extends VacBotCommand {
    constructor(mapID: any, coordinates: any, mapSubSetType?: string);
}
declare class VacBotCommand {
    constructor(name: any, args?: {}, api?: string);
    name: any;
    args: {};
    api: string;
    getId(): any;
}
declare class DeleteMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string);
}
declare class GetMapSubSet extends VacBotCommand {
    constructor(mapID: any, mapSubSetID: any, type?: string);
}
export {};
//# sourceMappingURL=vacBotCommand.d.ts.map