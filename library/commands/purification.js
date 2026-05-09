'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

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
