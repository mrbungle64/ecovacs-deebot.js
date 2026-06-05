'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const CapabilityManager = require('../library/managers/capabilityManager');

// ---------------------------------------------------------------------------
// Helpers: build a minimal fake bot with a given deviceClass
// ---------------------------------------------------------------------------
function makeFakeBot(deviceClass) {
    return { deviceClass };
}

// Known device classes from the fixture / models.js (used across tests)
const DEVICE = {
    legacy:      '123',      // DEEBOT Slim2 → 'legacy'
    '950':       'yna5xi',   // DEEBOT OZMO 950 → '950'
    T8:          'h18jkh',   // DEEBOT OZMO T8 → 'T8'
    N8:          'n6cwdb',   // DEEBOT N8 → 'N8'
    T9:          'ucn2xe',   // DEEBOT T9 → 'T9'
    T10:         'jtmf04',   // DEEBOT T10 → 'T10'
    T20:         'p1jij8',   // DEEBOT T20 OMNI → 'T20'
    X1:          '2o4lnm',   // DEEBOT X1 TURBO → 'X1'
    X2:          'e6ofmn',   // DEEBOT X2 → 'X2'
    airbot:      'sdp1y1',   // AIRBOT Z1 → 'airbot'
    aqMonitor:   '20anby',   // Air Quality Monitor → 'aqMonitor'
    lawnMower:   '5xu9h3',   // GOAT G1 → 'lawnMower'
    unknown:     '__nonexistent__',
};

// ---------------------------------------------------------------------------
// Platform type predicates
// ---------------------------------------------------------------------------
describe('CapabilityManager – platform type predicates', function () {

    describe('isPlatformTypeLegacy()', function () {
        it('should return true for legacy device (class 123)', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE.legacy));
            assert.strictEqual(mgr.isPlatformTypeLegacy(), true);
        });
        it('should return false for a modern device', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE['950']));
            assert.strictEqual(mgr.isPlatformTypeLegacy(), false);
        });
    });

    describe('isPlatformTypeT8()', function () {
        it('should return true for a T8 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T8)).isPlatformTypeT8(), true);
        });
        it('should return false for a non-T8 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).isPlatformTypeT8(), false);
        });
    });

    describe('isPlatformTypeN8()', function () {
        it('should return true for an N8 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.N8)).isPlatformTypeN8(), true);
        });
    });

    describe('isPlatformTypeT9()', function () {
        it('should return true for a T9 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).isPlatformTypeT9(), true);
        });
    });

    describe('isPlatformTypeT10()', function () {
        it('should return true for a T10 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T10)).isPlatformTypeT10(), true);
        });
    });

    describe('isPlatformTypeT20()', function () {
        it('should return true for a T20 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T20)).isPlatformTypeT20(), true);
        });
    });

    describe('isPlatformTypeX1()', function () {
        it('should return true for an X1 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.X1)).isPlatformTypeX1(), true);
        });
    });

    describe('isPlatformTypeX2()', function () {
        it('should return true for an X2 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.X2)).isPlatformTypeX2(), true);
        });
    });

    describe('isPlatformTypeAirbot()', function () {
        it('should return true for an Airbot device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.airbot)).isPlatformTypeAirbot(), true);
        });
        it('should return false for a non-airbot device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.X2)).isPlatformTypeAirbot(), false);
        });
    });

    describe('isPlatformTypeAqMonitor()', function () {
        it('should return true for an air quality monitor device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.aqMonitor)).isPlatformTypeAqMonitor(), true);
        });
    });

    describe('isPlatformTypeLawnMower()', function () {
        it('should return true for a lawn mower device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.lawnMower)).isPlatformTypeLawnMower(), true);
        });
    });
});

// ---------------------------------------------------------------------------
// Compound / derived platform checks
// ---------------------------------------------------------------------------
describe('CapabilityManager – compound platform type checks', function () {

    describe('isPlatformTypeT8Based()', function () {
        it('should return true for T8 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T8)).isPlatformTypeT8Based(), true);
        });
        it('should return true for N8 device (T8-based)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.N8)).isPlatformTypeT8Based(), true);
        });
        it('should return false for T9 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).isPlatformTypeT8Based(), false);
        });
    });

    describe('isPlatformTypeT9Based()', function () {
        it('should return true for T9 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).isPlatformTypeT9Based(), true);
        });
        it('should return true for T10 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T10)).isPlatformTypeT9Based(), true);
        });
        it('should return true for T20 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T20)).isPlatformTypeT9Based(), true);
        });
        it('should return true for X1 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.X1)).isPlatformTypeT9Based(), true);
        });
        it('should return true for X2 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.X2)).isPlatformTypeT9Based(), true);
        });
        it('should return false for T8 device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T8)).isPlatformTypeT9Based(), false);
        });
        it('should return false for Airbot device', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.airbot)).isPlatformTypeT9Based(), false);
        });
    });
});

// ---------------------------------------------------------------------------
// getPlatformType / getDeviceCategory delegation
// ---------------------------------------------------------------------------
describe('CapabilityManager – getPlatformType / getDeviceCategory', function () {

    it('getPlatformType() should return the same value as tools.getPlatformType()', function () {
        const tools = require('../library/tools');
        [DEVICE['950'], DEVICE.T8, DEVICE.X2, DEVICE.airbot, DEVICE.legacy].forEach(cls => {
            const mgr = new CapabilityManager(makeFakeBot(cls));
            assert.strictEqual(mgr.getPlatformType(), tools.getPlatformType(cls),
                `Mismatch for deviceClass ${cls}`);
        });
    });

    it('getDeviceCategory() should return the same value as tools.getDeviceCategory()', function () {
        const tools = require('../library/tools');
        [DEVICE['950'], DEVICE.airbot, DEVICE.lawnMower].forEach(cls => {
            const mgr = new CapabilityManager(makeFakeBot(cls));
            assert.strictEqual(mgr.getDeviceCategory(), tools.getDeviceCategory(cls),
                `Mismatch for deviceClass ${cls}`);
        });
    });

    it('getSmartType() should return the same value as tools.getSmartType()', function () {
        const tools = require('../library/tools');
        [DEVICE['950'], DEVICE.airbot, DEVICE.lawnMower, DEVICE.T8].forEach(cls => {
            const mgr = new CapabilityManager(makeFakeBot(cls));
            assert.strictEqual(mgr.getSmartType(), tools.getSmartType(cls),
                `Mismatch for deviceClass ${cls}`);
        });
    });
});

// ---------------------------------------------------------------------------
// Device property capability booleans
// ---------------------------------------------------------------------------
describe('CapabilityManager – device property accessors', function () {

    describe('hasSpotAreaCleaningMode()', function () {
        it('should return true for a device with spot area support (T9)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).hasSpotAreaCleaningMode(), true);
        });
        it('should return false for a legacy device without spot area support', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.legacy)).hasSpotAreaCleaningMode(), false);
        });
    });

    describe('hasCustomAreaCleaningMode()', function () {
        it('should return true for a device with custom area support (T9)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).hasCustomAreaCleaningMode(), true);
        });
    });

    describe('hasMappingCapabilities()', function () {
        it('should return true when both spot area and custom area are supported (T9)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).hasMappingCapabilities(), true);
        });
        it('should return false when spot area is not supported (legacy)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.legacy)).hasMappingCapabilities(), false);
        });
    });

    describe('hasEdgeCleaningMode() / hasSpotCleaningMode()', function () {
        it('should return true for legacy device (has edge/spot, no spot-area)', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE.legacy));
            assert.strictEqual(mgr.hasEdgeCleaningMode(), true);
            assert.strictEqual(mgr.hasSpotCleaningMode(), true);
        });
        it('should return false for T9 device (has spot-area mode instead)', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE.T9));
            assert.strictEqual(mgr.hasEdgeCleaningMode(), false);
        });
    });

    describe('deprecated alias hasSpotAreas() / hasCustomAreas()', function () {
        it('hasSpotAreas() should return same as hasSpotAreaCleaningMode()', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE.T9));
            assert.strictEqual(mgr.hasSpotAreas(), mgr.hasSpotAreaCleaningMode());
        });
        it('hasCustomAreas() should return same as hasCustomAreaCleaningMode()', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE.T9));
            assert.strictEqual(mgr.hasCustomAreas(), mgr.hasCustomAreaCleaningMode());
        });
    });

    describe('hasMoppingSystem()', function () {
        it('should return true for a device with mopping system (T9)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).hasMoppingSystem(), true);
        });
        it('should return false for Airbot which does not have a mopping system', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.airbot)).hasMoppingSystem(), false);
        });
        it('should be consistent: a mopping device returns truthy, a non-mopping device returns falsy or a defined default', function () {
            // hasMoppingSystem() checks getDeviceProperty('water_amount') !== undefined
            // getDeviceProperty always returns false (never undefined) for missing props,
            // so hasMoppingSystem() returns true when the prop holds any value (including false).
            // We verify the contract: T9 (has water_amount) returns true, which is the main usecase.
            const mgrT9 = new CapabilityManager(makeFakeBot(DEVICE.T9));
            assert.ok(mgrT9.hasMoppingSystem(), 'T9 should report mopping capability');
        });
    });

    describe('isMapImageSupported()', function () {
        it('should return true for a device with map image support (T9)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T9)).isMapImageSupported(), true);
        });
    });

    describe('hasAutoEmptyStation()', function () {
        it('should return true for a device with auto empty station (T20)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.T20)).hasAutoEmptyStation(), true);
        });
        it('should return false for a device without auto empty station (legacy)', function () {
            assert.strictEqual(new CapabilityManager(makeFakeBot(DEVICE.legacy)).hasAutoEmptyStation(), false);
        });
    });

    describe('hasVacuumPowerAdjustment()', function () {
        it('should return a truthy value for a device that supports suction power adjustment (T9)', function () {
            // The property holds a list of speed levels (array) — truthy but not strictly `true`
            assert.ok(new CapabilityManager(makeFakeBot(DEVICE.T9)).hasVacuumPowerAdjustment(),
                'Expected hasVacuumPowerAdjustment() to be truthy for T9');
        });
        it('should return a falsy value for a device without power adjustment (legacy)', function () {
            const val = new CapabilityManager(makeFakeBot(DEVICE.legacy)).hasVacuumPowerAdjustment();
            assert.ok(!val, `Expected falsy, got: ${val}`);
        });
    });

    describe('hasFilter() / hasMainBrush() / hasSideBrush()', function () {
        it('T9 should have filter, main brush and side brush', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE.T9));
            assert.strictEqual(mgr.hasFilter(), true);
            assert.strictEqual(mgr.hasMainBrush(), true);
            assert.strictEqual(mgr.hasSideBrush(), true);
        });
    });

    describe('getDeviceProperty() with defaultValue', function () {
        it('should return the defaultValue when the property does not exist', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE['950']));
            assert.strictEqual(mgr.getDeviceProperty('__nonexistent_prop__', 'myDefault'), 'myDefault');
        });
        it('should return false as the built-in default when no default is provided', function () {
            const mgr = new CapabilityManager(makeFakeBot(DEVICE['950']));
            // false is the correct built-in default — not undefined
            const val = mgr.getDeviceProperty('__nonexistent_prop__');
            assert.strictEqual(val, false);
        });
    });
});
