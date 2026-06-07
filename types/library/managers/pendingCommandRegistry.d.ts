export = PendingCommandRegistry;
/**
 * @class PendingCommandRegistry
 * Tracks pending VacBot commands and their associated Promises.
 *
 * When a command is sent with `returnPromise: true`, it is registered here
 * with its request ID, expected event name, and Promise callbacks.
 * Once the expected event fires via `emitMessage()`, the Promise is resolved.
 *
 * Two matching strategies are supported:
 *  - ID-based: uses the `id` from the response header/body when available
 *  - Event-based: matches the oldest pending entry by `expectedEvent` name (MQTT fallback)
 */
declare class PendingCommandRegistry {
    /**
     * @type {Map<string, {
     *   resolve: Function,
     *   reject: Function,
     *   timer: NodeJS.Timeout,
     *   commandName: string,
     *   expectedEvent: string|null,
     *   commandInstance: Object
     * }>}
     */
    _pending: Map<string, {
        resolve: Function;
        reject: Function;
        timer: NodeJS.Timeout;
        commandName: string;
        expectedEvent: string | null;
        commandInstance: Object;
    }>;
    /**
     * Register a new pending command.
     * @param {string} requestId - The command's request ID (command.args.id)
     * @param {string} commandName - The raw protocol command name (e.g. 'getBattery')
     * @param {string|null} expectedEvent - The EventEmitter event name to wait for (e.g. 'BatteryInfo')
     * @param {Object} commandInstance - The VacBotCommand instance (used to call parseResponse())
     * @param {Function} resolve - Promise resolve callback
     * @param {Function} reject - Promise reject callback
     * @param {number} [timeoutMs=10000] - Timeout in milliseconds before the Promise rejects
     */
    register(requestId: string, commandName: string, expectedEvent: string | null, commandInstance: Object, resolve: Function, reject: Function, timeoutMs?: number): void;
    /**
     * Resolve a pending command by its request ID.
     * Used when an ID can be extracted from the response.
     * @param {string} requestId
     * @param {any} rawPayload - The raw response body data
     * @returns {boolean} true if a matching pending entry was found and resolved
     */
    resolveById(requestId: string, rawPayload: any): boolean;
    /**
     * Resolve a single pending entry: normalize the payload via
     * `commandInstance.parseResponse()` (falling back to the raw payload),
     * resolve its Promise, and remove it from the registry.
     * @param {string} requestId
     * @param {Object} entry - the pending entry
     * @param {any} rawPayload - the raw response body data
     * @returns {boolean} always true (the entry was resolved)
     * @private
     */
    private _resolveEntry;
    /**
     * Resolve a pending command that matches the given event name.
     *
     * When `preferredId` is supplied (e.g. an HTTP command response, where the
     * originating command — and thus its request id — is known) the entry with
     * that exact id is resolved, so concurrent commands waiting on the same event
     * are not mismatched. Otherwise — or if the preferred id is not pending — it
     * falls back to the oldest matching entry (e.g. unsolicited MQTT broadcasts).
     *
     * Calls `commandInstance.parseResponse(rawPayload)` to normalize the result
     * before resolving the Promise. Falls back to the raw payload if not overridden.
     * @param {string} eventName - The event name that just fired (e.g. 'BatteryInfo')
     * @param {any} rawPayload - The raw payload (should be raw command response data)
     * @param {string|null} [preferredId] - request id of the originating command, if known
     * @returns {boolean} true if a matching pending entry was found and resolved
     */
    resolveByEvent(eventName: string, rawPayload: any, preferredId?: string | null): boolean;
    /**
     * Reject a pending command by its request ID.
     * Used when the command fails immediately (e.g. network or gateway error).
     * @param {string} requestId
     * @param {Error} error
     * @returns {boolean} true if a matching pending entry was found and rejected
     */
    rejectById(requestId: string, error: Error): boolean;
    /**
     * Reject all pending commands.
     * Should be called on disconnect to avoid hanging Promises.
     * @param {Error} error
     */
    rejectAll(error: Error): void;
    /**
     * @returns {number} number of currently pending commands
     */
    get size(): number;
}
//# sourceMappingURL=pendingCommandRegistry.d.ts.map