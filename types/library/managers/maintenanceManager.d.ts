export = MaintenanceManager;
/**
 * @class MaintenanceManager
 * Handles consumable components and their lifespans.
 */
declare class MaintenanceManager {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot: import("../vacBot"));
    bot: import("../vacBot");
    components: {};
    lastComponentValues: {};
    emitFullLifeSpanEvent: boolean;
    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload: Object): void;
}
//# sourceMappingURL=maintenanceManager.d.ts.map