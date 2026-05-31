'use strict';

const tools = require('../tools');

/**
 * @class CapabilityManager
 * Handles all device capability checks for VacBot.
 */
class CapabilityManager {
    /**
     * @param {VacBot} bot - The VacBot instance.
     */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Get the value of the given property for the device class
     * @param {string} property - The property to get
     * @param {any} [defaultValue=false] - The default value to return if the property is not found
     * @returns {any} The value of the property
     */
    getDeviceProperty(property, defaultValue = false) {
        return tools.getDeviceProperty(this.bot.deviceClass, property, defaultValue);
    }

    /**
     * Returns the platform/architecture type of the model
     * (e.g. '950', 'T8', 'T20', 'airbot').
     * @returns {string}
     */
    getPlatformType() {
        return tools.getPlatformType(this.bot.deviceClass);
    }

    /**
     * Returns the human-readable product category of the device
     * (e.g. 'Vacuum Cleaner', 'Air Purifier', 'Lawn Mower').
     * @returns {string}
     */
    getDeviceCategory() {
        return tools.getDeviceCategory(this.bot.deviceClass);
    }



    /**
     * Check if the device is a legacy platform type.
     * @returns {boolean}
     */
    isPlatformTypeLegacy() {
        return this.getPlatformType() === 'legacy';
    }

    /**
     * Check if the device is an N8 platform type.
     * @returns {boolean}
     */
    isPlatformTypeN8() {
        return this.getPlatformType() === 'N8';
    }

    /**
     * Check if the device is a T8 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT8() {
        return this.getPlatformType() === 'T8';
    }

    /**
     * Check if the device is a T9 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT9() {
        return this.getPlatformType() === 'T9';
    }

    /**
     * Check if the device is a T10 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT10() {
        return this.getPlatformType() === 'T10';
    }

    /**
     * Check if the device is a T20 platform type.
     * @returns {boolean}
     */
    isPlatformTypeT20() {
        return this.getPlatformType() === 'T20';
    }

    /**
     * Check if the device is an X1 platform type.
     * @returns {boolean}
     */
    isPlatformTypeX1() {
        return this.getPlatformType() === 'X1';
    }

    /**
     * Check if the device is an X2 platform type.
     * @returns {boolean}
     */
    isPlatformTypeX2() {
        return this.getPlatformType() === 'X2';
    }

    /**
     * Check if the device is an Airbot platform type.
     * @returns {boolean}
     */
    isPlatformTypeAirbot() {
        return this.getPlatformType() === 'airbot';
    }

    /**
     * Check if the device is an Air Quality Monitor platform type.
     * @returns {boolean}
     */
    isPlatformTypeAqMonitor() {
        return this.getPlatformType() === 'aqMonitor';
    }

    /**
     * Check if the device is a Lawn Mower platform type.
     * @returns {boolean}
     */
    isPlatformTypeLawnMower() {
        return this.getPlatformType() === 'lawnMower';
    }

    /**
     * Check if the device platform type is T8-based (T8 or N8).
     * @returns {boolean}
     */
    isPlatformTypeT8Based() {
        return this.isPlatformTypeT8() || this.isPlatformTypeN8();
    }

    /**
     * Check if the device platform type is T9-based (T9, T10, T20, X1, or X2).
     * @returns {boolean}
     */
    isPlatformTypeT9Based() {
        return this.isPlatformTypeT9() || this.isPlatformTypeT10() || this.isPlatformTypeT20() || this.isPlatformTypeX1() || this.isPlatformTypeX2();
    }



    /**
     * Returns true if the model has a filter
     * @returns {boolean}
     */
    hasFilter() {
        return this.getDeviceProperty('filter');
    }

    /**
     * Returns true if the model has a main brush
     * @returns {boolean}
     */
    hasMainBrush() {
        return this.getDeviceProperty('main_brush');
    }

    /**
     * Returns true if the model has a side brush
     * @returns {boolean}
     */
    hasSideBrush() {
        return this.getDeviceProperty('side_brush');
    }

    /**
     * Returns true if you can retrieve information about "unit care" (life span)
     * @returns {boolean}
     */
    hasUnitCareInfo() {
        return this.getDeviceProperty('unit_care_info');
    }

    /**
     * Returns true if you can retrieve information about "round mop" (life span)
     * @returns {boolean}
     */
    hasRoundMopInfo() {
        return this.getDeviceProperty('round_mop_info');
    }

    /**
     * Returns true if you can retrieve information about "air freshener" (life span)
     * @returns {boolean}
     */
    hasAirFreshenerInfo() {
        return this.getDeviceProperty('air_freshener_info');
    }

    /**
     * Returns true if the model has Edge cleaning mode
     * It is assumed that a model can have either an Edge or Spot Area mode
     * @returns {boolean}
     */
    hasEdgeCleaningMode() {
        return (!this.hasSpotAreaCleaningMode());
    }

    /**
     * Returns true if the model has Spot cleaning mode
     * It is assumed that a model can have either a Spot or Spot Area mode
     * @returns {boolean}
     */
    hasSpotCleaningMode() {
        return (!this.hasSpotAreaCleaningMode());
    }

    /**
     * @deprecated - please use `hasSpotAreaCleaningMode()` instead
     */
    hasSpotAreas() {
        return this.hasSpotAreaCleaningMode();
    }

    /**
     * Returns true if the model has Spot Area cleaning mode
     * @returns {boolean}
     */
    hasSpotAreaCleaningMode() {
        return this.getDeviceProperty('spot_area');
    }

    /**
     * @deprecated - please use `hasCustomAreaCleaningMode()` instead
     */
    hasCustomAreas() {
        return this.hasCustomAreaCleaningMode();
    }

    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasCustomAreaCleaningMode() {
        return this.getDeviceProperty('custom_area');
    }

    /**
     * Returns true if the model has mapping capabilities
     * @returns {boolean}
     */
    hasMappingCapabilities() {
        return this.hasSpotAreaCleaningMode() && this.hasCustomAreaCleaningMode();
    }

    /**
     * Returns true if the model has mopping functionality
     * @returns {boolean}
     */
    hasMoppingSystem() {
        return this.getDeviceProperty('water_amount') !== undefined;
    }

    /**
     * Returns true if the model has air drying functionality
     * @returns {boolean}
     */
    hasAirDrying() {
        return this.getDeviceProperty('air_drying');
    }

    /**
     * Returns true if the model has power adjustment functionality
     * @returns {boolean}
     */
    hasVacuumPowerAdjustment() {
        return this.getDeviceProperty('clean_speed');
    }

    /**
     * Returns true if the model has voice report functionality
     * @returns {boolean}
     */
    hasVoiceReports() {
        return this.getDeviceProperty('voice_report');
    }

    /**
     * Returns true if the model has an auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStation() {
        return this.getDeviceProperty('auto_empty_station');
    }

    /**
     * Returns true if the model has an optional auto empty station
     * @returns {boolean}
     */
    hasAutoEmptyStationOptional() {
        return this.getDeviceProperty('auto_empty_station_optional');
    }

    /**
     * Returns true if the model supports map images
     * @returns {boolean}
     */
    isMapImageSupported() {
        return this.getDeviceProperty('map_image_supported');
    }
}

module.exports = CapabilityManager;
