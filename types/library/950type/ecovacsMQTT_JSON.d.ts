export = EcovacsMQTT_JSON;
/**
 * @extends EcovacsMQTT
 */
declare class EcovacsMQTT_JSON extends EcovacsMQTT {
    vacBot: any;
    /**
     * The function returns the request object
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getCommandRequestObject(command: any): any;
    /**
     * It creates an object for the request payload with header and body
     * @param {Object} command - the command object
     * @returns {Object} the request payload object
     */
    getCommandPayload(command: any): any;
    /**
     * It handles the response from the Ecovacs API
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {Object} messagePayload - The message payload that was received
     */
    handleCommandResponse(command: any, messagePayload: any): void;
    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} topic - the topic of the message
     * @param {Object|string} message - the message
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     */
    handleMessage(topic: string, message: any | string, type?: string): void;
    /**
     * Given an event, return the payload
     * @param {Object} event - The event object that was passed to the handler
     * @returns The payload of the event
     */
    getPayload(event: any): any;
    /**
     * Given a command, return the prefix of the command
     * @param {string} command - the command that was sent
     * @returns {string} the prefix of the command
     */
    getCommandPrefix(command: string): string;
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_JSON.d.ts.map