'use strict';

const nodeMachineId = require('node-machine-id');
const { EcovacsAPI } = require('../../index');

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
     * Connects to the Ecovacs API and returns an EcovacsDevice instance.
     * @returns {Promise<Object>} The connected EcovacsDevice instance
     */
    async init() {
        const { ACCOUNT_ID, PASSWORD, COUNTRY_CODE, DEVICE_NUMBER = 0, AUTH_DOMAIN = '' } = this.config;

        const passwordHash = EcovacsAPI.md5(PASSWORD);
        const machineId = await nodeMachineId.machineId();
        const deviceId = EcovacsAPI.getDeviceId(machineId, DEVICE_NUMBER);

        this.api = new EcovacsAPI(deviceId, COUNTRY_CODE, '', AUTH_DOMAIN);

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

            this.vacbot = this.api.getDevice(
                this.api.uid,
                EcovacsAPI.REALM,
                this.api.resource,
                this.api.user_access_token,
                device
            );

            return this.vacbot;
        } catch (error) {
            throw new Error(`Failed to initialize ExampleClient: ${error.message}`, { cause: error });
        }
    }

    /**
     * Disconnects the EcovacsDevice session.
     */
    async disconnect() {
        if (this.vacbot) {
            await this.vacbot.disconnect();
        }
    }
}

module.exports = ExampleClient;
