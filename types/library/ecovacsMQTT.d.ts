export = EcovacsMQTT;
declare class EcovacsMQTT extends Ecovacs {
    constructor(bot: any, user: any, hostname: any, resource: any, secret: any, continent: any, country: any, vacuum: any, serverAddress: any, serverPort?: number);
    mqtt: typeof import("mqtt");
    username: string;
    payloadType: string;
    client: import("mqtt").Client;
    subscribe(): void;
    connect(): void;
    callEcouserApi(params: any, api: any): Promise<any>;
    /**
     * It sends a command to the Ecovacs API
     * @param {Object} command - the command to send to the Ecovacs API
     */
    sendCommand(command: any): Promise<void>;
    /**
     * This function is used to determine the API to use for the action
     * @param {Object} command - the command object
     * @returns {string} the API path that has to be called
     */
    getApiPath(command: any): string;
    getCommandStandardRequestObject(command: any, payload: any): {
        cmdName: any;
        payload: any;
        payloadType: string;
        auth: {
            realm: string;
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
        td: string;
        toId: any;
        toRes: any;
        toType: any;
    };
    getCommandCleanLogsObject(command: any): {
        auth: {
            realm: string;
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
        did: any;
        country: any;
        td: any;
        resource: any;
    };
    getAuthObject(): {
        realm: string;
        resource: any;
        token: any;
        userid: any;
        with: string;
    };
    /**
     * Disconnect the MQTT client
     */
    disconnect(): void;
}
import Ecovacs = require("./ecovacs");
//# sourceMappingURL=ecovacsMQTT.d.ts.map