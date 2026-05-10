'use strict';

const tools = require('../tools');
const dictionary = require('../dictionary');

/**
 * @class MaintenanceManager
 * Handles consumable components and their lifespans.
 */
class MaintenanceManager {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot) {
        this.bot = bot;
        this.components = {};
        this.lastComponentValues = {};
        this.emitFullLifeSpanEvent = false;
    }

    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload) {
        for (let index in payload) {
            if (payload[index]) {
                const type = payload[index][`type`];
                let component = type;
                if (dictionary.COMPONENT_FROM_ECOVACS[type]) {
                    component = dictionary.COMPONENT_FROM_ECOVACS[type];
                } else {
                    tools.envLogWarn(`unknown life span component type: ${type}`);
                    this.bot.ecovacs.emit('Debug', `Unknown life span component type: ${type}`);
                }
                const left = payload[index]['left'];
                const total = payload[index]['total'];
                const lifespan = parseInt(left) / parseInt(total) * 100;
                this.components[component] = Number(lifespan.toFixed(2));
            }
        }
    }
}

module.exports = MaintenanceManager;
