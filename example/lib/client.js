'use strict';

const readline = require('node:readline/promises');
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
        const { ACCOUNT_ID, PASSWORD, COUNTRY_CODE, DEVICE_NUMBER = 0, AUTH_DOMAIN = '', CLIENT_DEVICE_ID = '' } = this.config;

        const passwordHash = EcovacsAPI.md5(PASSWORD);
        // Derive the client device id from either the explicitly configured
        // CLIENT_DEVICE_ID or the host machine id. In both cases the
        // DEVICE_NUMBER is folded in so that multiple instances sharing the
        // same .env but addressing different robots get distinct MQTT client
        // identities (resource = deviceId.substring(0,8)).
        const machineId = CLIENT_DEVICE_ID || await nodeMachineId.machineId();
        const deviceId = EcovacsAPI.getDeviceId(machineId, DEVICE_NUMBER);

        this.api = new EcovacsAPI(deviceId, COUNTRY_CODE, '', AUTH_DOMAIN);

        try {
            await this.connectWithDeviceVerification(ACCOUNT_ID, passwordHash);
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
     * Runs the login and, if Ecovacs requires client-device verification
     * (response code `1013`), performs the two-step e-mail-code flow:
     * request a code, read it from stdin, then confirm it. Retries on an
     * invalid/expired code.
     * @param {string} accountId - the Ecovacs account id (e-mail)
     * @param {string} passwordHash - the MD5 password hash
     * @returns {Promise<void>}
     */
    async connectWithDeviceVerification(accountId, passwordHash) {
        try {
            await this.api.connect(accountId, passwordHash);
        } catch (error) {
            if (!(error instanceof EcovacsAPI.DeviceVerificationRequired)) {
                throw error;
            }
            console.log('\nEcovacs requires verification of this device before login.');
            await this.api.requestDeviceVerificationCode();
            console.log('A verification code has been sent to your account e-mail address.');

            for (; ;) {
                const code = await this.promptForCode('Enter the verification code from the e-mail: ');
                try {
                    await this.api.verifyDevice(code);
                    return;
                } catch (verifyError) {
                    if (!(verifyError instanceof EcovacsAPI.InvalidVerificationCode)) {
                        throw verifyError;
                    }
                    console.error('Invalid or expired code – please try again.');
                }
            }
        }
    }

    /**
     * Prompt the user for a single line of input on stdin.
     * @param {string} question - the prompt text
     * @returns {Promise<string>} the entered line
     */
    promptForCode(question) {
        // Print the prompt via console.log first (newline-terminated, so it is
        // flushed and visible even under `docker compose up` log multiplexing),
        // then read the answer from stdin.
        console.log(question);
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return rl.question('> ').finally(() => rl.close());
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
