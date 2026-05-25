export = CapabilityManager;
/**
 * @class CapabilityManager
 * Handles all device capability checks for VacBot.
 */
declare class CapabilityManager {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot: VacBot);
    bot: VacBot;
    /**
     * Get the value of the given property for the device class
     * @param {string} property - The property to get
     * @param {any} [defaultValue=false] - The default value to return if the property is not found
     * @returns {any} The value of the property
     */
    getDeviceProperty(property: string, defaultValue?: any): any;
    /**
     * Returns the platform/architecture type of the model
     * (e.g. '950', 'T8', 'T20', 'airbot').
     * @returns {string}
     */
    getPlatformType(): string;
    /**
     * Returns the human-readable product category of the device
     * (e.g. 'Vacuum Cleaner', 'Air Purifier', 'Lawn Mower').
     * @returns {string}
     */
    getDeviceCategory(): string;
    /**
     * @deprecated use getPlatformType()
     * Returns the type of the model
     * @returns {string}
     */
    getModelType(): string;
    /**
     * @deprecated use getDeviceCategory()
     * Returns the device type
     * @returns {string}
     */
    getDeviceType(): string;
    isModelTypeLegacy(): boolean;
    isModelTypeN8(): boolean;
    isModelTypeT8(): boolean;
    isModelTypeT9(): boolean;
    isModelTypeT10(): boolean;
    isModelTypeT20(): boolean;
    isModelTypeX1(): boolean;
    isModelTypeX2(): boolean;
    isModelTypeAirbot(): boolean;
    isModelTypeAqMonitor(): boolean;
    isModelTypeLawnMower(): boolean;
    isModelTypeT8Based(): boolean;
    isModelTypeT9Based(): boolean;
    /**
     * Returns true if the model has a filter
     * @returns {boolean}
     */
    hasFilter(): boolean;
    /**
     * Returns true if the model has a main brush
     * @returns {boolean}
     */
    hasMainBrush(): boolean;
    /**
     * Returns true if the model has a side brush
     * @returns {boolean}
     */
    hasSideBrush(): boolean;
    /**
     * Returns true if you can retrieve information about "unit care" (life span)
     * @returns {boolean}
     */
    hasUnitCareInfo(): boolean;
    /**
     * Returns true if you can retrieve information about "round mop" (life span)
     * @returns {boolean}
     */
    hasRoundMopInfo(): boolean;
    /**
     * Returns true if you can retrieve information about "air freshener" (life span)
     * @returns {boolean}
     */
    hasAirFreshenerInfo(): boolean;
    /**
     * Returns true if the model has Edge cleaning mode
     * It is assumed that a model can have either an Edge or Spot Area mode
     * @returns {boolean}
     */
    hasEdgeCleaningMode(): boolean;
    /**
     * Returns true if the model has Spot cleaning mode
     * It is assumed that a model can have either a Spot or Spot Area mode
     * @returns {boolean}
     */
    hasSpotCleaningMode(): boolean;
    /**
     * @deprecated - please use `hasSpotAreaCleaningMode()` instead
     */
    hasSpotAreas(): boolean;
    /**
     * Returns true if the model has Spot Area cleaning mode
     * @returns {boolean}
     */
    hasSpotAreaCleaningMode(): boolean;
    /**
     * @deprecated - please use `hasCustomAreaCleaningMode()` instead
     */
    hasCustomAreas(): boolean;
    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasCustomAreaCleaningMode(): boolean;
    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasMappingCapabilities(): boolean;
    /**
     * Returns true if the model has mopping functionality
     * @returns {boolean}
     */
    hasMoppingSystem(): boolean;
    /**
     * Returns true if the model has air drying functionality
     * @returns {boolean}
     */
    hasAirDrying(): boolean;
    /**
     * Returns true if the model has power adjustment functionality
     * @returns {boolean}
     */
    hasVacuumPowerAdjustment(): boolean;
    /**
     * Returns true if the model has voice report functionality
     * @returns {boolean}
     */
    hasVoiceReports(): boolean;
    /**
     * Returns true if the model has an auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStation(): boolean;
    /**
     * Returns true if the model has an optional auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStationOptional(): boolean;
    /**
     * Returns true if the model supports map images
     * @returns {boolean}
     */
    isMapImageSupported(): boolean;
}
//# sourceMappingURL=capabilityManager.d.ts.map