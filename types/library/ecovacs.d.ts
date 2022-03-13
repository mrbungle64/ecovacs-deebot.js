export = Ecovacs;
declare class Ecovacs extends EventEmitter {
    constructor(bot: any, user: any, hostname: any, resource: any, secret: any, continent: any, country: any, vacuum: any, serverAddress: any, serverPort: any);
    bot: any;
    dictionary: typeof import("./950type/ecovacsConstants.js") | typeof import("./non950type/ecovacsConstants.js");
    user: any;
    hostname: any;
    resource: any;
    secret: any;
    country: any;
    continent: any;
    vacuum: any;
    serverAddress: any;
    serverPort: any;
    session_start(event: any): void;
    getServerAddress(): string;
    handleMessagePayload(command: any, event: any): Promise<void>;
    getDictionary(): typeof import("./950type/ecovacsConstants.js") | typeof import("./non950type/ecovacsConstants.js");
    handleLifeSpanCombined(): void;
    emitError(code: any, message: any): void;
    /**
     * Emit a network related error message
     * @param {string} message - the error message
     */
    emitNetworkError(message: string): void;
    emitLastErrorByErrorCode(errorCode: any): void;
    emitLastError(): void;
    /**
     * If the vacuum has power adjustment and also has a mopping system
     * then emit a `MoppingSystemInfo` event with the `cleanStatus` and `cleanInfo` properties
     */
    emitMoppingSystemReport(): void;
}
import EventEmitter = require("events");
//# sourceMappingURL=ecovacs.d.ts.map