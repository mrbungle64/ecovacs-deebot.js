export = HistoryManager;
/**
 * @class HistoryManager
 * Handles REST API interactions for cleaning logs and secured content.
 */
declare class HistoryManager {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot: VacBot);
    bot: VacBot;
    /**
     * Call the REST API to fetch cleaning results logs.
     * @returns {Promise<Object>}
     */
    callCleanResultsLogsApi(): Promise<Object>;
    /**
     * Get the crypto hash string for secured content.
     * @returns {string}
     */
    getCryptoHashStringForSecuredContent(): string;
    /**
     * Download secured content (e.g. map images from logs).
     * @param {string} url
     * @param {string} targetFilename
     * @returns {Promise<void>}
     */
    downloadSecuredContent(url: string, targetFilename: string): Promise<void>;
}
//# sourceMappingURL=historyManager.d.ts.map