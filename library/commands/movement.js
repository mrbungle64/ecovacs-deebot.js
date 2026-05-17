'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

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
 * Requests information about the charge status
 * @extends VacBotCommand
 */
class GetChargeState extends VacBotCommand {
    constructor() {
        super('getChargeState');
    }
}

/**
 * @deprecated
 * @extends Move
 */
module.exports = {
    Charge,
    Move,
    MoveBackward,
    MoveForward,
    GetChargeState,
};
