export = EcovacsXMPP_XML;
declare class EcovacsXMPP_XML extends Ecovacs {
    constructor(bot: any, user: any, hostname: any, resource: any, secret: any, continent: any, country: any, vacuum: any, server_address: any, server_port?: number);
    iqElementId: number;
    pingInterval: NodeJS.Timer;
    simpleXmpp: any;
    connect(): void;
    sendCommand(action: any): Promise<void>;
    getCommandXml(command: any): any;
    /**
     * Get the device id for the vacuum
     * @returns {string} the device ID
     */
    getDeviceId(): string;
    getMyAddress(): string;
    sendPing(to: any): void;
    disconnect(): void;
}
import Ecovacs = require("../ecovacs");
//# sourceMappingURL=ecovacsXMPP_XML.d.ts.map