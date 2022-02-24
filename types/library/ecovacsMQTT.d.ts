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
    sendCommand(action: any, recipient: any): Promise<void>;
    getAPI(action: any): string;
    disconnect(): void;
}
import Ecovacs = require("./ecovacs");
//# sourceMappingURL=ecovacsMQTT.d.ts.map