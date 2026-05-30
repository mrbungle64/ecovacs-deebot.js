'use strict';

const nodeMachineId = require('node-machine-id');
const { EcoVacsAPI } = require('../../index');

/**
 * Encapsulates the authentication and connection logic for the examples.
 */
class ExampleClient {
    /**
     * @param {Object} config - Configuration object
     * @param {string} config.ACCOUNT_ID
     * @param {string} config.PASSWORD
     * @param {string} config.COUNTRY_CODE
     * @param {number} [config.DEVICE_NUMBER=0]
     * @param {string} [config.AUTH_DOMAIN='']
     */
    constructor(config) {
        this.config = config;
        this.api = null;
        this.vacbot = null;
    }

    /**
     * Connects to the EcoVacs API and returns a VacBot instance.
     * @returns {Promise<Object>} The connected VacBot instance
     */
    async init() {
        const { ACCOUNT_ID, PASSWORD, COUNTRY_CODE, DEVICE_NUMBER = 0, AUTH_DOMAIN = '' } = this.config;

        const passwordHash = EcoVacsAPI.md5(PASSWORD);
        const machineId = await nodeMachineId.machineId();
        const deviceId = EcoVacsAPI.getDeviceId(machineId, DEVICE_NUMBER);

        this.api = new EcoVacsAPI(deviceId, COUNTRY_CODE, '', AUTH_DOMAIN);

        try {
            await this.api.connect(ACCOUNT_ID, passwordHash);
            const devices = await this.api.devices();

            if (!devices || devices.length === 0) {
                throw new Error('No devices found in this account.');
            }

            const device = devices[DEVICE_NUMBER];
            if (!device) {
                throw new Error(`Device at index ${DEVICE_NUMBER} not found.`);
            }

            this.vacbot = this.api.getVacBot(
                this.api.uid,
                EcoVacsAPI.REALM,
                this.api.resource,
                this.api.user_access_token,
                device
            );

            return this.vacbot;
        } catch (error) {
            throw new Error(`Failed to initialize ExampleClient: ${error.message}`);
        }
    }

    /**
     * Disconnects the VacBot session.
     */
    async disconnect() {
        if (this.vacbot) {
            await this.vacbot.disconnectAsync();
        }
    }
}

module.exports = ExampleClient;
