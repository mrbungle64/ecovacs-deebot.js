export = CommandDispatcher;
/**
 * @class CommandDispatcher
 * Handles command dispatching for VacBot, especially for commands requiring special logic.
 */
declare class CommandDispatcher {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot: import("../vacBot"));
    bot: import("../vacBot");
    /**
     * Dispatch a command with special logic.
     * @param {string} key - The command key.
     * @param {Object} options - Command options (e.g. returnPromise)
     * @param {...*} args - Command arguments.
     * @returns {Promise<any>|boolean} Promise if returnPromise is true, otherwise boolean indicating if handled.
     */
    dispatch(key: string, options: Object, ...args: any[]): Promise<any> | boolean;
}
//# sourceMappingURL=commandDispatcher.d.ts.map