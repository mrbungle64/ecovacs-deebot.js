'use strict';

const VacBot = require('../950type/vacBot');
const tools = require('../tools');

/**
 * This class is relevant for 950_v2 type models
 * e.g. Deebot OZMO T80 series (which are all MQTT based models)
 */
class VacBot_950v2type extends VacBot {

    run(command, ...args) {
        // Map 950 commands to V2 variant
        let command_v2 = command + '_V2';

        // try v2 command first (if available)
        if (super.run(command_v2, ...args) == false)
        {
            // v2 command not found, try original command
            super.run(command, ...args);
        }

    }
}

module.exports = VacBot_950v2type;
