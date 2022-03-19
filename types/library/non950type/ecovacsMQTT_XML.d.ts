export = EcovacsMQTT_XML;
declare class EcovacsMQTT_XML extends EcovacsMQTT {
    /**
     * The function returns the request object
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getCommandRequestObject(command: any): any;
    /**
     * It creates a string with the payload in xml format
     * and also removes the td element
     * @param {Object} command - the command object
     * @returns {string}
     */
    getCommandPayload(command: any): string;
    /**
     * It handles the response from the Ecovacs API
     * @todo Refactor this method
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {Object} messagePayload - The message payload that was received
     */
    handleCommandResponse(command: any, messagePayload: any): void;
    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} topic - the topic of the message
     * @param {Object|string} payload - the payload
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     */
    handleMessage(topic: string, payload: any | string, type?: string): void;
    /**
     * It takes an XML string and converts it into JSON object
     * @param {string} xmlString - the XML string
     * @returns {Object} a JSON object
     */
    command_xml2json(xmlString: string, ...args: any[]): any;
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_XML.d.ts.map