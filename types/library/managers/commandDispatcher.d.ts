export = CommandDispatcher;
/**
 * @class CommandDispatcher
 * Handles command dispatching for VacBot, especially for commands requiring special logic.
 */
declare class CommandDispatcher {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot: VacBot);
    bot: VacBot;
    /**
     * Dispatch a command with special logic.
     * @param {string} key - The command key.
     * @param {Array} args - Command arguments.
     * @returns {boolean} True if handled, false otherwise.
     */
    dispatch(key: string, ...args: any[]): boolean;
}
//# sourceMappingURL=commandDispatcher.d.ts.map