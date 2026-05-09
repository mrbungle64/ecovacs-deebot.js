/**
 * Represents the 'charge' function
 * @extends VacBotCommand
 */
export class Charge {
}
/**
 * Represents a 'Move' command
 * The move commands often do not work properly on newer models
 * @extends VacBotCommand
 */
export class Move {
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
export class GetChargeState {
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
//# sourceMappingURL=movement.d.ts.map