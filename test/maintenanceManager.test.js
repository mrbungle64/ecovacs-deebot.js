'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const MaintenanceManager = require('../library/managers/maintenanceManager');
const dictionary = require('../library/dictionary');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFakeBot() {
    return {
        ecovacs: {
            emit: () => {}
        }
    };
}

// ---------------------------------------------------------------------------
// handleLifespan
// ---------------------------------------------------------------------------
describe('MaintenanceManager – handleLifespan()', function () {

    it('should translate a known component type and calculate lifespan percentage', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        // Find a valid ecovacs component type from the dictionary
        const ecovacsType = Object.keys(dictionary.COMPONENT_FROM_ECOVACS)[0];
        const humanName = dictionary.COMPONENT_FROM_ECOVACS[ecovacsType];

        mgr.handleLifespan([{ type: ecovacsType, left: 80, total: 100 }]);

        assert.ok(
            Object.prototype.hasOwnProperty.call(mgr.components, humanName),
            `Expected component "${humanName}" to be stored`
        );
        assert.strictEqual(mgr.components[humanName], 80.00);
    });

    it('should correctly round to 2 decimal places', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        const ecovacsType = Object.keys(dictionary.COMPONENT_FROM_ECOVACS)[0];
        const humanName = dictionary.COMPONENT_FROM_ECOVACS[ecovacsType];

        mgr.handleLifespan([{ type: ecovacsType, left: 1, total: 3 }]);
        // 1/3 * 100 = 33.33...
        assert.strictEqual(mgr.components[humanName], 33.33);
    });

    it('should use the raw type as key when the type is unknown in the dictionary', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        mgr.handleLifespan([{ type: '__unknown_type__', left: 50, total: 100 }]);
        assert.strictEqual(mgr.components['__unknown_type__'], 50.00);
    });

    it('should handle multiple components in a single payload', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        const types = Object.keys(dictionary.COMPONENT_FROM_ECOVACS);
        assert.ok(types.length >= 2, 'Need at least 2 known component types for this test');

        const [type1, type2] = types;
        mgr.handleLifespan([
            { type: type1, left: 100, total: 100 },
            { type: type2, left: 50, total: 100 }
        ]);

        assert.strictEqual(mgr.components[dictionary.COMPONENT_FROM_ECOVACS[type1]], 100.00);
        assert.strictEqual(mgr.components[dictionary.COMPONENT_FROM_ECOVACS[type2]], 50.00);
    });

    it('should update an existing component when called again', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        const ecovacsType = Object.keys(dictionary.COMPONENT_FROM_ECOVACS)[0];
        const humanName = dictionary.COMPONENT_FROM_ECOVACS[ecovacsType];

        mgr.handleLifespan([{ type: ecovacsType, left: 80, total: 100 }]);
        assert.strictEqual(mgr.components[humanName], 80.00);

        mgr.handleLifespan([{ type: ecovacsType, left: 60, total: 100 }]);
        assert.strictEqual(mgr.components[humanName], 60.00); // updated
    });

    it('should store 100% when left equals total', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        const ecovacsType = Object.keys(dictionary.COMPONENT_FROM_ECOVACS)[0];
        const humanName = dictionary.COMPONENT_FROM_ECOVACS[ecovacsType];

        mgr.handleLifespan([{ type: ecovacsType, left: 100, total: 100 }]);
        assert.strictEqual(mgr.components[humanName], 100.00);
    });

    it('should store 0% when left is 0', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        const ecovacsType = Object.keys(dictionary.COMPONENT_FROM_ECOVACS)[0];
        const humanName = dictionary.COMPONENT_FROM_ECOVACS[ecovacsType];

        mgr.handleLifespan([{ type: ecovacsType, left: 0, total: 100 }]);
        assert.strictEqual(mgr.components[humanName], 0.00);
    });

    it('should accept string numbers (left/total as strings)', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        const ecovacsType = Object.keys(dictionary.COMPONENT_FROM_ECOVACS)[0];
        const humanName = dictionary.COMPONENT_FROM_ECOVACS[ecovacsType];

        mgr.handleLifespan([{ type: ecovacsType, left: '75', total: '100' }]);
        assert.strictEqual(mgr.components[humanName], 75.00);
    });
});

// ---------------------------------------------------------------------------
// Constructor initial state
// ---------------------------------------------------------------------------
describe('MaintenanceManager – constructor / initial state', function () {
    it('should initialise components and lastComponentValues as empty objects', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        assert.deepStrictEqual(mgr.components, {});
        assert.deepStrictEqual(mgr.lastComponentValues, {});
    });

    it('should initialise emitFullLifeSpanEvent as false', function () {
        const mgr = new MaintenanceManager(makeFakeBot());
        assert.strictEqual(mgr.emitFullLifeSpanEvent, false);
    });
});
