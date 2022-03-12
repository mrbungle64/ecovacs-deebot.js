export = EcovacsMQTT_JSON;
declare class EcovacsMQTT_JSON extends EcovacsMQTT {
    /**
     * The function takes in a command and a recipient and returns a JSON object
     * @param {Object} command - the action to be performed
     * @param {string} recipient - the id of the device to send the command to
     * @returns {Object} the wrapped command to be sent to the vacuum
     */
    getCommandRequestObject(command: any, recipient: string): any;
    /**
     * It creates a payload request header (and body)
     * @param {Object} command - the action object that was passed to the getCommandRequestObject function
     * @returns {Object} the payloadRequest object
     */
    getCommandPayload(command: any): any;
    handleCommandResponse(action: any, message: any): void;
    /**
     * It handles incoming messages (MQTT message or response from API)
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