export = Ecovacs;
declare class Ecovacs extends EventEmitter {
    /**
     * @param {VacBot} bot - the name of the vacuum
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} country - the country where the Ecovacs account is registered
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} serverAddress - the address of the MQTT server
     * @param {number} [serverPort=8883] - the port that the MQTT server is listening on
     */
    constructor(bot: VacBot, user: string, hostname: string, resource: string, secret: string, continent: string, country: string, vacuum: any, serverAddress: string, serverPort?: number);
    bot: VacBot;
    dictionary: typeof import("./950type/ecovacsConstants.js") | typeof import("./non950type/ecovacsConstants.js");
    user: string;
    hostname: string;
    resource: string;
    secret: string;
    country: string;
    continent: string;
    vacuum: any;
    serverAddress: string;
    serverPort: number;
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