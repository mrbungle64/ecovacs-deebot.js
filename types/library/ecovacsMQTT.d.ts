export = EcovacsMQTT;
declare class EcovacsMQTT extends Ecovacs {
    mqtt: typeof import("mqtt");
    channel: string;
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
    client: import("mqtt").MqttClient | undefined;
    /**
     * @param {Object} command - the command object
     * @param {Object} params
     */
    getRequestUrl(command: Object, params: Object): any;
    getRequestHeaders(params: any): {
        'Content-Type': string;
        'Content-Length': number;
    };
    /**
     * The function returns the request object
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getRequestObject(command: Object): Object;
    /**
     * @param {Object} command - the command object
     * @returns {string|object} the specific payload for the request object
     * @abstract
     */
    getCommandPayload(command: Object): string | object;
    /**
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {Object} messagePayload - The message payload that was received
     * @abstract
     */
    handleCommandResponse(command: Object, messagePayload: Object): void;
    /**
     * @param {string} topic - the topic of the message
     * @param {Object|string} message - the message
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     * @abstract
     */
    handleMessage(topic: string, message: Object | string, type?: string): void;
    /**
     * It sends a command to the Ecovacs API
     * @param {Object} command - the command to send to the Ecovacs API
     * @returns {Promise<void>}
     */
    sendCommand(command: Object): Promise<void>;
    /**
     * This function is used to determine the API to use for the action
     * @param {Object} command - the command object
     * @returns {string} the API path that has to be called
     */
    getApiPath(command: Object): string;
    /**
     * This function returns a standard request object for sending commands
     * @param {Object} command - the command object
     * @param {Object} payload - the payload object
     * @returns {Object} the JSON object
     */
    getCommandRequestObject(command: Object, payload: Object): Object;
    /**
     * Returns a request object for receiving clean logs
     * @param {Object} command - the command object
     * @returns {Object} the JSON object
     */
    getCleanLogsCommandObject(command: Object): Object;
    /**
     * Returns the `auth` object used for the command object
     * @returns {Object} the JSON object
     */
    getAuthObject(): Object;
    /**
     * Disconnect the MQTT client
     */
    disconnect(): Promise<any>;
}
import Ecovacs = require("./ecovacs");
//# sourceMappingURL=ecovacsMQTT.d.ts.map