export = EcovacsMQTT_JSON;
declare class EcovacsMQTT_JSON extends EcovacsMQTT {
    wrapCommand(action: any, recipient: any): {
        auth: {
            realm: string;
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
        cmdName: any;
        payload: {
            header: {};
            body: {};
        };
        payloadType: string;
        td: string;
        toId: any;
        toRes: any;
        toType: any;
        did?: undefined;
        country?: undefined;
        resource?: undefined;
    } | {
        did: any;
        country: any;
        td: any;
        auth: {
            token: any;
            resource: any;
            userid: any;
            with: string;
            realm: string;
        };
        resource: any;
        cmdName?: undefined;
        payload?: undefined;
        payloadType?: undefined;
        toId?: undefined;
        toRes?: undefined;
        toType?: undefined;
    };
    wrapCommand_getPayload(action: any): {
        header: {};
        body: {};
    };
    handleCommandResponse(action: any, message: any): void;
    handleMessage(topic: any, message: any, type?: string): void;
    getPayload(event: any): any;
    getCommandPrefix(command: any): string;
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_JSON.d.ts.map