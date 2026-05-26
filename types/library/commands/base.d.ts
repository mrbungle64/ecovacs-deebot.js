/**
 * This class is essentially a template for creating a command for a bot,
 * which includes a command name, arguments (payload), and an API endpoint
 */
export class VacBotCommand {
    /**
     * @constructor
     * @param {string} name - The name of the command
     * @param {object} [payload={}] - The payload object of the command (optional)
     * @param {string} [api=] - The hostname of the API endpoint (optional)
     */
    constructor(name: string, payload?: object, api?: string);
    name: string;
    args: object;
    api: string;
    getId(): any;
    /**
     * Parse the raw protocol response payload into a normalized result object.
     * Override this method in subclasses to provide command-specific parsing.
     * The default implementation returns the payload as-is.
     * @param {Object} payload - The raw `body.data` from the device response
     * @returns {any} normalized result
     */
    parseResponse(payload: Object): any;
}
//# sourceMappingURL=base.d.ts.map