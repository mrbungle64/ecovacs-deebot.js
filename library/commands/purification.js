'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

/**
 * @extends VacBotCommand
 * TODO: potential duplicate of Clean_V2 (clean.js)
 */
class BasicPurification extends VacBotCommand {
    constructor() {
        super('clean_V2', {
            'act': 'start',
            'content': {
                'type': 'spot'
            }
        });
    }
}

/**
 * @extends VacBotCommand
 * TODO: potential duplicate of Clean_V2 (clean.js)
 */
class MobilePurification extends VacBotCommand {
    constructor() {
        super('clean_V2', {
            'act': 'start',
            'content': {
                'type': 'move'
            }
        });
    }
}

module.exports = {
    BasicPurification,
    MobilePurification,
};
