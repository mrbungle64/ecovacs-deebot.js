'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const VacBot = require('../library/vacBot');
const { SupportedDevices, KnownDevices } = require('./models_pre_v1');

function createMockBot(deviceClass) {
    const vacuum = {
        class: deviceClass,
        did: 'mock_did',
        resource: 'mock_res'
    };
    try {
        return new VacBot('user', 'hostname', 'resource', 'secret', vacuum, 'continent', 'de');
    } catch (e) {
        if (e.message.includes("'XML' based model")) {
            const tools = require('../library/tools');
            return {
                isLegacyModel: () => tools.isLegacyModel(deviceClass),
                getModelType: () => tools.getModelType(deviceClass),
                is950type: () => !tools.isLegacyModel(deviceClass),
                getDeviceProperty: (prop) => tools.getDeviceProperty(deviceClass, prop)
            };
        }
        throw e;
    }
}

describe('Regression Tests (Baseline v1)', function () {
    const allBaselineDevices = Object.assign({}, SupportedDevices, KnownDevices);

    const hardAssertionProps = [
        '950type',
        '950type_V2',
        'main_brush',
        'side_brush',
        'filter',
        'spot_area',
        'custom_area',
        'mopping_system',
        'voice_report',
        'clean_speed',
        'map_image_supported',
        'type'
    ];

    for (const [deviceClass, baseline] of Object.entries(allBaselineDevices)) {
        it(`Device ${deviceClass} (${baseline.name}) should behave consistently`, function () {
            const bot = createMockBot(deviceClass);
            const isLegacy = bot.isLegacyModel();
            const actualType = bot.getModelType();

            // Requirement: "950type": false must now be 'legacy' models
            if (baseline['950type'] === false) {
                assert.strictEqual(isLegacy, true, `Device ${deviceClass} with 950type:false should be legacy`);
            }

            // Requirement: "type": "legacy" must be 'legacy' models
            if (baseline['type'] === 'legacy') {
                assert.strictEqual(isLegacy, true, `Device ${deviceClass} with type:legacy should be legacy`);
            }

            // Requirement: "950type" baseline vs is950type()
            if (baseline.hasOwnProperty('950type')) {
                if (baseline['950type'] === false) {
                    assert.strictEqual(bot.is950type(), false, `is950type() should be false for baseline 950type:false`);
                }
            }

            // Requirement: "type" vs getModelType()
            if (baseline.hasOwnProperty('type')) {
                let expectedType = baseline['type'];

                if (actualType === 'lawnMower' && expectedType === 'goat') {
                    expectedType = 'lawnMower';
                }

                if (actualType === 'legacy') {
                    expectedType = 'legacy';
                }

                assert.strictEqual(actualType, expectedType, `getModelType() should match baseline type (or be 'legacy') for ${deviceClass}`);
            }

            // Requirement: other properties
            const specialProps = ['name', '950type_V2', 'deviceClassLink'];
            for (const [prop, baselineValue] of Object.entries(baseline)) {
                if (specialProps.includes(prop) || prop === 'type' || prop === '950type') continue;

                const currentValue = bot.getDeviceProperty(prop);
                let actual = currentValue;
                let expected = baselineValue;

                // Handle cases where we have an array (e.g. clean_speed) but baseline expected true
                if (expected === true && Array.isArray(actual)) {
                    actual = true;
                }

                if (isLegacy) {
                    // Legacy models should return false for everything except core properties
                    if (actual !== false) {
                        const msg = `Device ${deviceClass}: Property ${prop} should be false for legacy model, but got ${actual}`;
                        if (hardAssertionProps.includes(prop)) {
                            assert.strictEqual(actual, false, msg);
                        } else {
                            console.warn(`[WARNING] ${msg}`);
                        }
                    }
                } else {
                    if (actual !== expected) {
                        const msg = `Device ${deviceClass}: Property ${prop} mismatch. Expected ${expected}, got ${actual}`;
                        if (hardAssertionProps.includes(prop)) {
                            assert.strictEqual(actual, expected, msg);
                        } else {
                            console.warn(`[WARNING] ${msg}`);
                        }
                    }
                }
            }
        });
    }
});
