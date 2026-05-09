'use strict';

const tools = require('../tools');
const constants = require('../constants');

/**
 * This class is essentially a template for creating a command for a bot,
 * which includes a command name, arguments (payload), and an API endpoint
 */
class VacBotCommand {
    /**
     * @constructor
     * @param {string} name - The name of the command
     * @param {object} [payload={}] - The payload object of the command (optional)
     * @param {string} [api=] - The hostname of the API endpoint (optional)
     */
    constructor(name, payload = {}, api = constants.IOT_DEVMANAGER_PATH) {
        this.name = name;
        if (!payload.hasOwnProperty('id')) {
            Object.assign(payload, {
                'id': tools.getReqID()
            });
        }
        this.args = payload;
        this.api = api;
    }

    getId() {
        return this.args.id;
    }
}

module.exports = {
    VacBotCommand,
};
module.exports.VacBotCommand = VacBotCommand;
