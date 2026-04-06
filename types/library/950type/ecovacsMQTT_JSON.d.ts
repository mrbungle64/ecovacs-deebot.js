export = EcovacsMQTT_JSON;
declare class EcovacsMQTT_JSON extends EcovacsMQTT {
    vacBot: Object;
    /**
     * It creates an object for the request payload with header and body
     * @param {Object} command - the command object
     * @returns {Object} the request payload object
     */
    getCommandPayload(command: Object): Object;
    /**
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
     * @returns {Promise<void>}
     */
    handleMessagePayload(command: string, payload: any): Promise<void>;
    /**
     * Given a command, return the prefix of the command
     * @param {string} command - the command that was sent
     * @returns {string} the prefix of the command
     */
    getCommandPrefix(command: string): string;
    handleV2commands(abbreviatedCommand: any): any;
    /**
     * Handle onFwBuryPoint message (e.g. T8/T9 series)
     * This is presumably some kind of debug or internal message
     * The main advantage of this message is that it's fired immediately
     * @param {Object} payload
     */
    handleFwBuryPoint(payload: Object): Promise<boolean>;
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_JSON.d.ts.map