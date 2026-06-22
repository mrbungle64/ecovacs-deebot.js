export = CapabilityManager;
/**
 * @class CapabilityManager
 * Handles all device capability checks for VacBot.
 */
declare class CapabilityManager {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot: typeof import("../ecovacsDevice"));
    bot: typeof import("../ecovacsDevice");
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
     * Returns the smartType (internal IoT platform generation/protocol) of the model
     * (e.g. 'MQ_AP', 'BLAP2', 'QRP', 'SPA', 'BT').
     * @returns {string}
     */
    getSmartType(): string;
    /**
     * Check if the device is a legacy platform type.
     * @returns {boolean}
     */
    isPlatformTypeLegacy(): boolean;
    /**
     * Check if the device is an N8 platform type.
     * @returns {boolean}
     */
    isPlatformTypeN8(): boolean;
    /**
     * Check if the device is a T8 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT8(): boolean;
    /**
     * Check if the device is a T9 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT9(): boolean;
    /**
     * Check if the device is a T10 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT10(): boolean;
    /**
     * Check if the device is a T20 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT20(): boolean;
    /**
     * Check if the device is an X1 platform type.
     * @returns {boolean}
     */
    isPlatformTypeX1(): boolean;
    /**
     * Check if the device is an X2 platform type.
     * @returns {boolean}
     */
    isPlatformTypeX2(): boolean;
    /**
     * Check if the device is an Airbot platform type.
     * @returns {boolean}
     */
    isPlatformTypeAirbot(): boolean;
    /**
     * Check if the device is an Air Quality Monitor platform type.
     * @returns {boolean}
     */
    isPlatformTypeAqMonitor(): boolean;
    /**
     * Check if the device is a Lawn Mower platform type.
     * @returns {boolean}
     */
    isPlatformTypeLawnMower(): boolean;
    /**
     * Check if the device platform type is T8-based (T8 or N8).
     * @returns {boolean}
     */
    isPlatformTypeT8Based(): boolean;
    /**
     * Check if the device platform type is T9-based (T9, T10, T20, X1, or X2).
     * @returns {boolean}
     */
    isPlatformTypeT9Based(): boolean;
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
     * Returns true if the model has indoor air quality sensors
     * (PM2.5, PM10, AQI, VOC, temperature, humidity)
     * @returns {boolean}
     */
    hasAirQualitySensors(): boolean;
    /**
     * Returns true if the model has the AIRBOT "three module" bay
     * (UV sanitizer, humidifier, and air-freshener modules)
     * @returns {boolean}
     */
    hasThreeModule(): boolean;
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
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasMappingCapabilities(): boolean;
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
     * Returns true if the station supports hot-water mop washing (55 °C).
     * Introduced with the T20 OMNI; not available on X1 or older platforms.
     * @returns {boolean}
     */
    hasHotWaterWashing(): boolean;
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