declare const _exports: {
    new (name: string, payload?: object, api?: string): import("./commands/base").VacBotCommand;
    getRequestUrl: (ecovacs: any, command: any, params: any) => string;
    getRequestHeaders: (ecovacs: any, params: any) => {
        'Content-Type': string;
        'Content-Length': number;
    };
    /**
     * Builds the request body for a command (device-manager envelope, or the flatter
     * CleanLogs envelope for `GetCleanLogs`).
     * @param {*} ecovacs - the Ecovacs transport instance
     * @param {*} command - the command instance
     * @returns {import('./typedefs').CommandRequestObject|import('./typedefs').CleanLogsCommandObject}
     */
    getRequestObject: (ecovacs: any, command: any) => import("./typedefs").CommandRequestObject | import("./typedefs").CleanLogsCommandObject;
    /**
     * @param {*} command - the command instance (its `args` become `body.data`)
     * @returns {import('./typedefs').CommandPayload}
     */
    getCommandPayload: (command: any) => import("./typedefs").CommandPayload;
    /**
     * Returns the API path for a command: the device-manager path by default, or the
     * command's own `api` when set (e.g. `lg/log.do` for CleanLogs).
     * @param {*} command - the command instance
     * @returns {string} the API path
     */
    getApiPath: (command: any) => string;
    /**
     * @param {*} ecovacs - the Ecovacs transport instance
     * @param {*} command - the command instance
     * @param {import('./typedefs').CommandPayload} payload
     * @returns {import('./typedefs').CommandRequestObject}
     */
    getCommandRequestObject: (ecovacs: any, command: any, payload: import("./typedefs").CommandPayload) => import("./typedefs").CommandRequestObject;
    /**
     * @param {*} ecovacs - the Ecovacs transport instance
     * @param {*} command - the command instance
     * @returns {import('./typedefs').CleanLogsCommandObject}
     */
    getCleanLogsCommandObject: (ecovacs: any, command: any) => import("./typedefs").CleanLogsCommandObject;
    /**
     * @param {*} ecovacs - the Ecovacs transport instance
     * @returns {import('./typedefs').AuthObject}
     */
    getAuthObject: (ecovacs: any) => import("./typedefs").AuthObject;
};
export = _exports;
//# sourceMappingURL=command.d.ts.map