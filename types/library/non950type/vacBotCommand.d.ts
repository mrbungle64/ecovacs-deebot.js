export class Charge extends VacBotCommand {
    constructor();
}
export class Clean extends VacBotCommand {
    constructor(mode?: string, action?: string, kwargs?: {});
}
export class CustomArea extends Clean {
    constructor(action?: string, area?: string, cleaningAsNumber?: number);
}
export class DisableContinuousCleaning extends SetOnOff {
    constructor();
}
export class DisableDoNotDisturb extends SetOnOff {
    constructor();
}
export class Edge extends Clean {
    constructor();
}
export class EnableContinuousCleaning extends SetOnOff {
    constructor();
}
export class EnableDoNotDisturb extends SetOnOff {
    constructor();
}
export class GetBatteryState extends VacBotCommand {
    constructor();
}
export class GetChargeState extends VacBotCommand {
    constructor();
}
export class GetChargerPos extends VacBotCommand {
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
export class GetContinuousCleaning extends GetOnOff {
    constructor();
}
export class GetDoNotDisturb extends GetOnOff {
    constructor();
}
export class GetLifeSpan extends VacBotCommand {
    constructor(component: any);
}
export class GetLogApiCleanLogs extends VacBotCommand {
    constructor();
}
export class GetLogs extends VacBotCommand {
    constructor(count?: number);
}
export class GetMapM extends VacBotCommand {
    constructor();
}
export class GetMapSet extends VacBotCommand {
    constructor(tp?: string);
}
export class GetNetInfo extends VacBotCommand {
    constructor();
}
export class GetOnOff extends VacBotCommand {
    constructor(type: any);
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
export class GetWaterBoxInfo extends VacBotCommand {
    constructor();
}
export class GetWaterLevel extends VacBotCommand {
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
export class Pause extends Clean {
    constructor(mode?: string);
}
export class PlaySound extends VacBotCommand {
    constructor(sid: any);
}
export class PullM extends VacBotCommand {
    constructor(mapSetType: any, mapSetId: any, mapDetailId: any);
}
export class PullMP extends VacBotCommand {
    constructor(pid: any);
}
export class RenameSpotArea extends VacBotCommand {
    constructor(msid: any, mid: any, name: any);
}
export class ResetLifeSpan extends VacBotCommand {
    constructor(component: any);
}
export class Resume extends Clean {
    constructor();
}
export class SetCleanSpeed extends VacBotCommand {
    constructor(level: any);
}
export class SetLifeSpan extends VacBotCommand {
    constructor(component: any, val?: number);
}
export class SetOnOff extends VacBotCommand {
    constructor(type: any, on: any);
}
export class SetWaterLevel extends VacBotCommand {
    constructor(level: any);
}
export class Spot extends Clean {
    constructor();
}
export class SpotArea extends Clean {
    constructor(action?: string, area?: string);
}
export class Stop extends Clean {
    constructor();
}
declare class VacBotCommand {
    constructor(name: any, args?: {});
    name: any;
    args: {};
    to_xml(): any;
    getId(): any;
}
export {};
//# sourceMappingURL=vacBotCommand.d.ts.map