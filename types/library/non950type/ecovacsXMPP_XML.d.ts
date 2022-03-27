export = EcovacsXMPP_XML;
declare class EcovacsXMPP_XML extends Ecovacs {
    vacBot: any;
    iqElementId: number;
    pingInterval: NodeJS.Timer;
    simpleXmpp: any;
    /**
     * Connect to the Ecovacs server
     */
    connect(): void;
    /**
     * Sends a command to the device
     * @param {Object} command - the command object used to send
     */
    sendCommand(command: any): Promise<void>;
    /**
     * Create a specific XML element with the given command and return it
     * @param {Object} command - the command as XML to send to the device
     * @returns The specific XML for the command
     */
    getCommandXml(command: any): any;
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