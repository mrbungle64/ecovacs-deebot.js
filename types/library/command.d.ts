declare const _exports: {
    new (name: string, payload?: object, api?: string): import("./commands/base").VacBotCommand;
    getRequestUrl: (ecovacs: any, command: any, params: any) => any;
    getRequestHeaders: (ecovacs: any, params: any) => {
        'Content-Type': string;
        'Content-Length': number;
    };
    getRequestObject: (ecovacs: any, command: any) => {
        auth: {
            realm: "ecouser.net";
            resource: any;
            token: any;
            userid: any;
            with: string;
        };
        did: any;
        country: any;
        td: any;
        resource: any;
    } | {
        cmdName: any;
        payload: any;
        payloadType: any;
        auth: {
            realm: "ecouser.net";
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
    getCommandPayload: (command: any) => {
        header: {
            pri: string;
            ts: number;
            tzm: number;
            ver: string;
        };
        body: {
            data: any;
        };
    };
    getApiPath: (command: any) => "iot/devmanager.do";
    getCommandRequestObject: (ecovacs: any, command: any, payload: any) => {
        cmdName: any;
        payload: any;
        payloadType: any;
        auth: {
            realm: "ecouser.net";
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
    getCleanLogsCommandObject: (ecovacs: any, command: any) => {
        auth: {
            realm: "ecouser.net";
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
    getAuthObject: (ecovacs: any) => {
        realm: "ecouser.net";
        resource: any;
        token: any;
        userid: any;
        with: string;
    };
};
export = _exports;
//# sourceMappingURL=command.d.ts.map