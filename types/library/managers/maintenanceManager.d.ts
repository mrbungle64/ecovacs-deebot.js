export = MaintenanceManager;
/**
 * @class MaintenanceManager
 * Handles consumable components and their lifespans.
 */
declare class MaintenanceManager {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot: VacBot);
    bot: VacBot;
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