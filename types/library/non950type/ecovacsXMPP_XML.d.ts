export = EcovacsXMPP_XML;
declare class EcovacsXMPP_XML extends Ecovacs {
    vacBot: Object;
    iqElementId: number;
    pingInterval: NodeJS.Timeout | null;
    simpleXmpp: any;
    /**
     * Connect to the Ecovacs server
     */
    connect(): void;
    /**
     * Sends a command to the device
     * @param {Object} command - the command object used to send
     * @returns {Promise<void>}
     */
    sendCommand(command: Object): Promise<void>;
    /**
     * Create a specific XML element with the given command and return it
     * @param {Object} command - the command as XML to send to the device
     * @returns The specific XML for the command
     */
    getCommandXml(command: Object): any;
    /**
     * @returns {string} the Jabber Identifier of the device
     */
    getDeviceJID(): string;
    /**
     * @returns {string} the Jabber Identifier of the server side
     */
    getServerJID(): string;
    /**
     * Sends a ping to the device
     */
    sendPing(): void;
}
import Ecovacs = require("../ecovacs");
//# sourceMappingURL=ecovacsXMPP_XML.d.ts.map