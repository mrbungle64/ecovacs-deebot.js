export = EcovacsMQTT_XML;
declare class EcovacsMQTT_XML extends EcovacsMQTT {
    wrapCommand(action: any, recipient: any): {
        auth: {
            realm: string;
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
        did: any;
        country: any;
        td: string;
        resource: any;
        cmdName?: undefined;
        payload?: undefined;
        payloadType?: undefined;
        toId?: undefined;
        toRes?: undefined;
        toType?: undefined;
    } | {
        auth: {
            realm: string;
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
        cmdName: any;
        payload: string;
        payloadType: string;
        td: string;
        toId: any;
        toRes: any;
        toType: any;
        did?: undefined;
        country?: undefined;
        resource?: undefined;
    };
    wrapCommand_getPayload(action: any): string;
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