'use strict';

const DEFAULT_TIMEOUT_MS = 10000;

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
class PendingCommandRegistry {
    constructor() {
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
        this._pending = new Map();
    }

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
    register(requestId, commandName, expectedEvent, commandInstance, resolve, reject, timeoutMs = DEFAULT_TIMEOUT_MS) {
        // Guard against an id collision (a random getReqID() clash, or the same
        // command instance re-sent while still pending). Without this the previous
        // entry's timer would leak, and that stale timer could later delete/reject
        // the *new* entry — leaving the newer Promise to hang forever. Settle the
        // old entry deterministically and clear its timer before replacing it.
        const existing = this._pending.get(requestId);
        if (existing) {
            clearTimeout(existing.timer);
            this._pending.delete(requestId);
            existing.reject(new Error(`Command '${existing.commandName}' superseded by a new request with id '${requestId}'`));
        }

        const timer = setTimeout(() => {
            if (this._pending.has(requestId)) {
                this._pending.delete(requestId);
                reject(new Error(`Command '${commandName}' timed out after ${timeoutMs}ms`));
            }
        }, timeoutMs);

        this._pending.set(requestId, {
            resolve,
            reject,
            timer,
            commandName,
            expectedEvent,
            commandInstance
        });
    }

    /**
     * Resolve a pending command by its request ID.
     * Used when an ID can be extracted from the response.
     * @param {string} requestId
     * @param {any} rawPayload - The raw response body data
     * @returns {boolean} true if a matching pending entry was found and resolved
     */
    resolveById(requestId, rawPayload) {
        const entry = this._pending.get(requestId);
        if (entry) {
            return this._resolveEntry(requestId, entry, rawPayload);
        }
        return false;
    }

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
    _resolveEntry(requestId, entry, rawPayload) {
        clearTimeout(entry.timer);
        this._pending.delete(requestId);
        try {
            const result = (entry.commandInstance && typeof entry.commandInstance.parseResponse === 'function')
                ? entry.commandInstance.parseResponse(rawPayload)
                : rawPayload;
            entry.resolve(result);
        } catch (e) {
            entry.reject(e);
        }
        return true;
    }

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
    resolveByEvent(eventName, rawPayload, preferredId = null) {
        if (preferredId !== null && preferredId !== undefined) {
            const preferred = this._pending.get(preferredId);
            if (preferred && preferred.expectedEvent === eventName) {
                return this._resolveEntry(preferredId, preferred, rawPayload);
            }
        }
        for (const [requestId, entry] of this._pending.entries()) {
            if (entry.expectedEvent === eventName) {
                return this._resolveEntry(requestId, entry, rawPayload);
            }
        }
        return false;
    }

    /**
     * Reject a pending command by its request ID.
     * Used when the command fails immediately (e.g. network or gateway error).
     * @param {string} requestId
     * @param {Error} error
     * @returns {boolean} true if a matching pending entry was found and rejected
     */
    rejectById(requestId, error) {
        const entry = this._pending.get(requestId);
        if (entry) {
            clearTimeout(entry.timer);
            this._pending.delete(requestId);
            entry.reject(error);
            return true;
        }
        return false;
    }

    /**
     * Reject all pending commands.
     * Should be called on disconnect to avoid hanging Promises.
     * @param {Error} error
     */
    rejectAll(error) {
        for (const [, entry] of this._pending.entries()) {
            clearTimeout(entry.timer);
            entry.reject(error);
        }
        this._pending.clear();
    }

    /**
     * @returns {number} number of currently pending commands
     */
    get size() {
        return this._pending.size;
    }
}

module.exports = PendingCommandRegistry;
