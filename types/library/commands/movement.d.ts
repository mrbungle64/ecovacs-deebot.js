/**
 * Represents the 'charge' function
 * @extends VacBotCommand
 */
export class Charge extends VacBotCommand {
    constructor();
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
 * Requests information about the charge status
 * @extends VacBotCommand
 */
export class GetChargeState extends VacBotCommand {
    constructor();
}
import { VacBotCommand } from "./base";
//# sourceMappingURL=movement.d.ts.map