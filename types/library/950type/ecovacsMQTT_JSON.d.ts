export = EcovacsMQTT_JSON;
declare class EcovacsMQTT_JSON extends EcovacsMQTT {
    vacBot: any;
    /**
     * It creates an object for the request payload with header and body
     * @param {Object} command - the command object
     * @returns {Object} the request payload object
     */
    getCommandPayload(command: any): any;
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