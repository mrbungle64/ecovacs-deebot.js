export = Ecovacs;
declare class Ecovacs extends EventEmitter {
    constructor(bot: any, user: any, hostname: any, resource: any, secret: any, continent: any, country: any, vacuum: any, server_address: any, server_port: any);
    bot: any;
    dictionary: typeof import("./950type/ecovacsConstants.js") | typeof import("./non950type/ecovacsConstants.js");
    user: any;
    hostname: any;
    resource: any;
    secret: any;
    country: any;
    continent: any;
    vacuum: any;
    server_address: any;
    server_port: any;
    session_start(event: any): void;
    getServerAddress(): string;
    handleMessagePayload(command: any, event: any): Promise<void>;
    getDictionary(): typeof import("./950type/ecovacsConstants.js") | typeof import("./non950type/ecovacsConstants.js");
    handleLifeSpanCombined(): void;
    emitError(code: any, message: any): void;
    emitNetworkError(message: any): void;
    emitLastErrorByErrorCode(errorCode: any): void;
    emitLastError(): void;
    emitMoppingSystemReport(): void;
}
import EventEmitter = require("events");
//# sourceMappingURL=ecovacs.d.ts.map