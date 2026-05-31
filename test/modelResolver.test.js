'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const modelResolver = require('../library/modelResolver');
const tools = require('../library/tools');

describe('modelResolver - unit tests', function () {

    describe('extractPlatformCodename()', function () {
        it('should extract scientist names correctly', function () {
            assert.strictEqual(modelResolver.extractPlatformCodename('KEPLER_SE_WHITE_INT'), 'KEPLER');
            assert.strictEqual(modelResolver.extractPlatformCodename('EINSTEIN_INT'), 'EINSTEIN');
            assert.strictEqual(modelResolver.extractPlatformCodename('TURING_ACS_INT'), 'TURING');
            assert.strictEqual(modelResolver.extractPlatformCodename('xyz_BOHR_123'), 'BOHR');
        });

        it('should identify modern platform codes like SS, FS and CARTESIAN', function () {
            assert.strictEqual(modelResolver.extractPlatformCodename('SS_INT'), 'SS');
            assert.strictEqual(modelResolver.extractPlatformCodename('SS_ANZ'), 'SS');
            assert.strictEqual(modelResolver.extractPlatformCodename('FS_OMNI_WHITE'), 'FS');
            assert.strictEqual(modelResolver.extractPlatformCodename('CARTESIAN-WHITE-INT'), 'CARTESIAN');
            assert.strictEqual(modelResolver.extractPlatformCodename('CARTESIANPLUS_WHITE_INT'), 'CARTESIANPLUS');
        });

        it('should fallback to first model segment if no known platform is found', function () {
            assert.strictEqual(modelResolver.extractPlatformCodename('DR930_SOME_SUFFIX'), 'DR930');
            assert.strictEqual(modelResolver.extractPlatformCodename('Slim2_Series'), 'SLIM2');
        });

        it('should return null for empty or generic strings', function () {
            assert.strictEqual(modelResolver.extractPlatformCodename('DEEBOT_X1'), null);
            assert.strictEqual(modelResolver.extractPlatformCodename(''), null);
        });
    });

    describe('extractUIBasePrefix()', function () {
        it('should extract prefix correctly', function () {
            assert.strictEqual(modelResolver.extractUIBasePrefix('t30pro_ww_h_t30h5'), 't30');
            assert.strictEqual(modelResolver.extractUIBasePrefix('keplerse_ww_h_keplerseh5'), 'kepler');
            assert.strictEqual(modelResolver.extractUIBasePrefix('goat_ww_h_goatx'), 'goat');
            assert.strictEqual(modelResolver.extractUIBasePrefix('D_OZMO_900'), 'd');
        });

        it('should return empty or null appropriately', function () {
            assert.strictEqual(modelResolver.extractUIBasePrefix(''), null);
        });
    });

    describe('getStationKeywords()', function () {
        it('should extract all existing station keywords', function () {
            const p = {
                name: 'DEEBOT T30S COMBO COMPLETE',
                model: 'T30_COMBO_INT_BLACK',
                UILogicId: 't30combo_ww_h_t30h5'
            };
            const kw = modelResolver.getStationKeywords(p);
            assert.ok(kw.includes('COMBO'));
        });

        it('should extract OMNI keyword', function () {
            const p = {
                name: 'DEEBOT T20 OMNI',
                model: 'T20_OMNI_INT',
                UILogicId: 't20omni_ww'
            };
            const kw = modelResolver.getStationKeywords(p);
            assert.ok(kw.includes('OMNI'));
        });
    });

    describe('extractIconId()', function () {
        it('should extract trailing path segment', function () {
            assert.strictEqual(modelResolver.extractIconId('https://portal-ww.ecouser.net/api/pim/file/get/678dbc5ceac3f5623d75eb79'), '678dbc5ceac3f5623d75eb79');
            assert.strictEqual(modelResolver.extractIconId('678dbc5ceac3f5623d75eb79'), '678dbc5ceac3f5623d75eb79');
        });
    });

    describe('calculateModelSimilarity()', function () {
        it('should return 100 for identical products', function () {
            const p = {
                model: 'KEPLER_SE_WHITE_INT',
                UILogicId: 'keplerse_ww_h_keplerseh5',
                smartType: 'BLAP2',
                iconUrl: 'https://portal-ww.ecouser.net/api/pim/file/get/678dbc5ceac3f5623d75eb79',
                name: 'DEEBOT T80 OMNI'
            };
            const score = modelResolver.calculateModelSimilarity(p, p);
            assert.strictEqual(score, 100);
        });

        it('should return a high score for close variants (e.g. KEPLER twins)', function () {
            const p1 = {
                model: 'KEPLER_SE_WHITE_INT',
                UILogicId: 'keplerse_ww_h_keplerseh5',
                smartType: 'BLAP2',
                iconUrl: 'https://portal-ww.ecouser.net/api/pim/file/get/678dbc5ceac3f5623d75eb79',
                name: 'DEEBOT T80 OMNI'
            };
            const p2 = {
                model: 'KEPLER_BLACK_INT',
                UILogicId: 'keplerse_ww_h_keplerseh5', // Same UI Logic ID
                smartType: 'BLAP2',
                iconUrl: 'https://portal-ww.ecouser.net/api/pim/file/get/678dbc5ceac3f5623d75eb79',
                name: 'DEEBOT T80 OMNI BLACK'
            };
            const score = modelResolver.calculateModelSimilarity(p1, p2);
            // Matches: Scientist (40), UILogicId (30), SmartType (10), UIBase Prefix (10), Keywords (5), Icon (5) = 100%
            assert.strictEqual(score, 100);
        });

        it('should calculate lower score for different platforms', function () {
            const p1 = {
                model: 'KEPLER_SE_WHITE_INT',
                UILogicId: 'keplerse_ww_h_keplerseh5',
                smartType: 'BLAP2',
                iconUrl: 'https://portal-ww.ecouser.net/api/pim/file/get/678dbc5ceac3f5623d75eb79',
                name: 'DEEBOT T80 OMNI'
            };
            const p2 = {
                model: 'DR930',
                UILogicId: 'DR_930G',
                smartType: 'HK_AP',
                iconUrl: 'https://portal-ww.ecouser.net/api/pim/file/get/5cf711aeb0acfc000179ff8a',
                name: 'DEEBOT OZMO/PRO 930 Series'
            };
            const score = modelResolver.calculateModelSimilarity(p1, p2);
            assert.ok(score < 50);
        });
    });

    describe('inferPropertiesHeuristically()', function () {
        it('should correctly infer T10 features from t10_ UILogicId', function () {
            const res = modelResolver.inferPropertiesHeuristically({
                UILogicId: 't10_ww_n_omni',
                model: 'EINSTEIN_INT',
                smartType: 'MQ_AP',
                name: 'DEEBOT X1 OMNI'
            });
            assert.strictEqual(res.type, 'T10');
            assert.ok(res.capabilities.includes('OMNI'));
            assert.ok(res.capabilities.includes('suctionMaxPlus'));
            assert.ok(res.capabilities.includes('moppingUltraHigh'));
        });

        it('should correctly infer V2 flag for h5 suffixed UILogicIds', function () {
            const res = modelResolver.inferPropertiesHeuristically({
                UILogicId: 'keplerse_ww_h_keplerseh5'
            });
            assert.strictEqual(res.V2, true);
        });

        it('should only infer V2 from the final h5 plugin segment', function () {
            const res = modelResolver.inferPropertiesHeuristically({
                UILogicId: 'demo_h5_middle_plugin'
            });
            assert.strictEqual(res.V2, false);
        });

        it('should infer PLUS from AES in the model string', function () {
            const res = modelResolver.inferPropertiesHeuristically({
                UILogicId: 'k960_ww_h_k960',
                model: 'K960_AES_INT'
            });
            assert.ok(res.capabilities.includes('PLUS'));
        });

        it('should prefer COMBO over generic station matches', function () {
            const res = modelResolver.inferPropertiesHeuristically({
                UILogicId: 't30combo_ww_h_t30h5',
                model: 'T30_COMBO_OMNI_INT'
            });
            assert.ok(res.capabilities.includes('COMBO'));
            assert.ok(!res.capabilities.includes('OMNI'));
        });

        it('should infer platform type from scientist codename when UI prefix is unknown', function () {
            const res = modelResolver.inferPropertiesHeuristically({
                UILogicId: 'kepler_ww_h_keplerh5',
                model: 'KEPLER_NEW_REGION'
            });
            assert.strictEqual(res.type, 'T20');
        });
    });

    describe('Real Data Validation', function () {
        it('should resolve "05uq5v" (WINBOT MINI) correctly via heuristics', function () {
            // 05uq5v is NOT in models.js
            const existsStatically = tools.getAllKnownDevices().hasOwnProperty('05uq5v');
            assert.strictEqual(existsStatically, false, '05uq5v should not be statically defined');

            const resolved = tools.getDynamicDevice('05uq5v');
            assert.ok(resolved, 'Should resolve 05uq5v');
            assert.strictEqual(resolved.type, 'WINBOT', 'Should infer WINBOT type');
            assert.strictEqual(resolved.smartType, 'BT', 'Should match smartType BT');
            assert.ok(resolved.resolvedViaHeuristics, 'Should be resolved via heuristics');
        });

        it('should resolve "0xyhhr" (DEEBOT OZMO 700) correctly via heuristics', function () {
            // 0xyhhr is NOT in models.js
            const existsStatically = tools.getAllKnownDevices().hasOwnProperty('0xyhhr');
            assert.strictEqual(existsStatically, false, '0xyhhr should not be statically defined');

            const resolved = tools.getDynamicDevice('0xyhhr');
            assert.ok(resolved, 'Should resolve 0xyhhr');
            assert.strictEqual(resolved.name, 'DEEBOT OZMO 700');
            assert.strictEqual(resolved.type, 'T10', 'Should fallback to T10 (default) as it does not match specific prefixes');
            assert.ok(resolved.resolvedViaHeuristics, 'Should be resolved via heuristics');
        });

        it('should resolve "8n0t5d" (T30S PRO OMNI) via similarity if it were missing', function () {
            // Even if 8n0t5d IS in models.js, we can test the resolver directly
            const productIotMapData = require('../library/productIotMap.json');
            const allKnownDevices = tools.getAllKnownDevices();
            
            const targetProduct = productIotMapData.find(item => item.classid === '8n0t5d').product;
            
            // We calculate similarity against all known devices
            // It should match itself (100%) or a very close relative
            const score = modelResolver.calculateModelSimilarity(targetProduct, targetProduct);
            assert.strictEqual(score, 100, 'Self-similarity should be 100%');
        });

        it('should not copy capabilities from a family-relative similarity score', function () {
            const productIotMapData = [
                {
                    classid: 'target1',
                    product: {
                        name: 'DEEBOT KEPLER BASIC',
                        model: 'KEPLER_BASIC_INT',
                        UILogicId: 'kepler_ww_h_basic',
                        smartType: 'BLAP2'
                    }
                },
                {
                    classid: 'known1',
                    product: {
                        name: 'DEEBOT KEPLER OMNI',
                        model: 'KEPLER_OMNI_INT',
                        UILogicId: 'kepler_ww_h_omni',
                        smartType: 'BLAP2'
                    }
                }
            ];
            const allKnownDevices = {
                known1: {
                    name: 'DEEBOT KEPLER OMNI',
                    smartType: 'BLAP2',
                    capabilities: ['vacuumBase', 'navigationBase', 'OMNI'],
                    type: 'T20'
                }
            };

            const match = modelResolver.resolveDeviceProperties('target1', productIotMapData, allKnownDevices);

            assert.ok(match, 'Should infer a device configuration');
            assert.ok(match.resolvedViaHeuristics, 'Should fall back to heuristics below clone threshold');
            assert.strictEqual(match.type, 'T20');
            assert.ok(!match.capabilities.includes('OMNI'), 'Should not copy OMNI from family-relative match');
        });

        it('should resolve a "MENDEL" variant via similarity to T30S', function () {
            // Let's simulate a MENDEL variant that shares the same UI Logic ID
            const fakeMendel = {
                name: 'DEEBOT T30S NEW VARIANT',
                model: 'MENDEL_NEW_REGION',
                UILogicId: 't30mixproblack_ww_h_t30mixproh5', // Same as 8n0t5d
                smartType: 'BLAP2',
                iconUrl: 'https://portal-ww.ecouser.net/api/pim/file/get/665057280e86033a15a33131' // Same as 8n0t5d
            };

            const productIotMapData = JSON.parse(JSON.stringify(require('../library/productIotMap.json')));
            productIotMapData.push({ classid: 'fake_mendel', product: fakeMendel });
            const allKnownDevices = tools.getAllKnownDevices();

            const match = modelResolver.resolveDeviceProperties('fake_mendel', productIotMapData, allKnownDevices);
            
            assert.ok(match, 'Should find a match');
            assert.ok(match.resolvedViaSimilarity, 'Should be resolved via similarity');
            assert.strictEqual(match.type, 'T20', 'Should inherit T20 type from T30S base');
            assert.ok(match.resolvedSimilarityScore >= 80, `Similarity should be high, got ${match.resolvedSimilarityScore}`);
        });

        it('should verify that all scientists from the list are correctly identified', function () {
            const scientists = [
                'EINSTEIN', 'TURING', 'CURIE', 'DARWIN', 'BOHR',
                'MENDEL', 'COPERNIC', 'KOPERNIK', 'FARADAY', 'EULER',
                'KEPLER', 'PLANCK', 'HALLEY'
            ];
            
            for (const s of scientists) {
                assert.strictEqual(modelResolver.extractScientist(`PREFIX_${s}_SUFFIX`), s, `Failed to identify ${s}`);
            }
        });
    });
});

describe('modelResolver - tools.js Integration', function () {
    it('should dynamically resolve an unknown device class from productIotMap', function () {
        // '6801mm' is in productIotMap (YEEDI M14 PLUS) but NOT in models.js
        const existsStatically = tools.getAllKnownDevices().hasOwnProperty('6801mm');
        assert.strictEqual(existsStatically, false, '6801mm should not be statically defined in models.js');

        // Check that it is NOT statically supported or known
        assert.strictEqual(tools.isKnownDevice('6801mm'), false, '6801mm should not be statically known');
        assert.strictEqual(tools.isSupportedDevice('6801mm'), false, '6801mm should not be statically supported');

        // Check platform type and capabilities
        assert.strictEqual(tools.getPlatformType('6801mm'), 'T20', 'Should resolve platform type to T20 (base architecture)');
        assert.strictEqual(tools.getSmartType('6801mm'), 'BLAP2', 'Should resolve smartType to BLAP2');
        assert.ok(tools.getDeviceProperty('6801mm', 'auto_empty_station'), 'Should have auto_empty_station capability inferred from model string');
    });

    it('should return null if class ID is completely unknown and not in productIotMap', function () {
        // Use a totally randomized fake class ID not in PIM or models
        const fakeClass = '999abc';
        
        const properties = tools.getDynamicDevice(fakeClass);
        assert.strictEqual(properties, null, 'Should return null for class ID not present in productIotMap');
    });
});
