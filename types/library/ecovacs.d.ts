export = Ecovacs;
declare class Ecovacs extends EventEmitter {
    /**
     * @param {Object} vacBot - the VacBot object
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
    constructor(vacBot: any, user: string, hostname: string, resource: string, secret: string, continent: string, country: string, vacuum: any, serverAddress: string, serverPort?: number);
    bot: any;
    dictionary: typeof import("./950type/ecovacsConstants") | typeof import("./non950type/ecovacsConstants");
    user: string;
    hostname: string;
    resource: string;
    secret: string;
    country: string;
    continent: string;
    vacuum: any;
    serverAddress: string;
    serverPort: number;
    /**
     * Get the server address of the Ecovacs endpoint.
     * Different schema for accounts registered in China
     * @returns {string} the endpoint
     */
    getEcovacsEndpoint(): string;
    /**
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
     * @param {Object} event - the event object received from the Ecovacs API
     * @returns {Promise<void>}
     */
    handleMessagePayload(command: string, event: any): Promise<void>;
    /**
     * @returns the dictionary of Ecovacs related constants
     */
    getEcovacsDictionary(): typeof import("./950type/ecovacsConstants") | typeof import("./non950type/ecovacsConstants");
    handleLifeSpanCombined(): void;
    emitError(code: any, message: any): void;
    /**
     * Emit a network related error message
     * @param {string} message - the error message
     */
    emitNetworkError(message: string): void;
    emitLastErrorByErrorCode(errorCode: any): void;
    /**
     * Emit the error.
     * Disconnect if 'RequestOAuthError: Authentication error' error
     */
    emitLastError(): void;
    /**
     * If the vacuum has power adjustment and also has a mopping system
     * then emit a `MoppingSystemInfo` event with the `cleanStatus` and `cleanInfo` properties
     */
    emitMoppingSystemReport(): void;
}
import EventEmitter = require("events");
//# sourceMappingURL=ecovacs.d.ts.map