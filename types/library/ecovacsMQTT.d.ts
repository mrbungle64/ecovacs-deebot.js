export = EcovacsMQTT;
declare class EcovacsMQTT extends Ecovacs {
    constructor(bot: any, user: any, hostname: any, resource: any, secret: any, continent: any, country: any, vacuum: any, server_address: any, server_port?: number);
    mqtt: typeof import("mqtt");
    customdomain: any;
    username: string;
    datatype: string;
    client: import("mqtt").Client;
    subscribe(): void;
    connect(): void;
    callEcouserApi(params: any, api: any): Promise<any>;
    /**
     * It sends a command to the Ecovacs API
     * @param {Object} command - the command to send to the Ecovacs API
     * @param {string} recipient - the recipient of the command. This is the device ID
     */
    sendCommand(command: any, recipient: string): Promise<void>;
    /**
     * This function is used to determine the API to use for the action
     * @param {Object} command - the command object
     * @returns {string} the API path that has to be called
     */
    getAPI(command: any): string;
    /**
     * Disconnect the MQTT client
     */
    disconnect(): void;
}
import Ecovacs = require("./ecovacs");
//# sourceMappingURL=ecovacsMQTT.d.ts.map