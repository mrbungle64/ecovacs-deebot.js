export = EcovacsMQTT;
/**
 * @extends Ecovacs
 */
declare class EcovacsMQTT extends Ecovacs {
    mqtt: typeof import("mqtt");
    username: string;
    payloadType: string;
    /**
     * Subscribe for "broadcast" messages to the MQTT channel
     * @see https://deebot.readthedocs.io/advanced/protocols/mqtt/#mqtt
     */
    subscribe(): void;
    /**
     * Connect to the MQTT server and listen to broadcast messages
     */
    connect(): void;
    client: import("mqtt").Client;
    /**
     * Send post request to the Ecovacs API
     * @param {Object} params - parameter object for building the URL
     * @param {string} apiPath - the API path
     * @returns {Promise<{Object}>}
     */
    callEcouserApi(params: any, apiPath: string): Promise<{
        Object;
    }>;
    /**
     * It sends a command to the Ecovacs API
     * @param {Object} command - the command to send to the Ecovacs API
     */
    sendCommand(command: any): Promise<void>;
    /**
     * This function is used to determine the API to use for the action
     * @param {Object} command - the command object
     * @returns {string} the API path that has to be called
     */
    getApiPath(command: any): string;
    /**
     * This function returns a standard request object for sending commands
     * @param {Object} command - the command object
     * @param {Object} payload - the payload object
     * @returns {Object} the JSON object
     */
    getCommandStandardRequestObject(command: any, payload: any): any;
    /**
     * Returns a request object for receiving clean logs
     * @param {Object} command - the command object
     * @returns {Object} the JSON object
     */
    getCommandCleanLogsObject(command: any): any;
    /**
     * Returns the `auth` object used for the command object
     * @returns {Object} the JSON object
     */
    getAuthObject(): any;
    /**
     * Disconnect the MQTT client
     */
    disconnect(): void;
}
import Ecovacs = require("./ecovacs");
//# sourceMappingURL=ecovacsMQTT.d.ts.map