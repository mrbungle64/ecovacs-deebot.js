export = EcovacsMQTT_XML;
declare class EcovacsMQTT_XML extends EcovacsMQTT {
    getCommandRequestObject(command: any, recipient: any): {
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
    } | {
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
    getCommandPayload(action: any): string;
    handleCommandResponse(action: any, json: any): void;
    handleMessage(topic: any, payload: any, type?: string): void;
    command_xml2json(xmlString: any, ...args: any[]): {
        event: any;
        attrs: {};
        children: any[];
    };
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_XML.d.ts.map