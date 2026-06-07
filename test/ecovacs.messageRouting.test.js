'use strict';

/**
 * Tests for MQTT message-name normalization and routing.
 *
 * The routing logic (getCommandPrefix / handleMessagePayload / handleV2commands
 * / the `_msg*` handlers) lives on EcovacsMessageDispatcher; the transport-level
 * helpers (_parseMqttMessage / handleMessage / _handleFirmwareVersion /
 * _dispatchPayload) live on EcovacsDeviceSession. Both are exercised here without
 * a real MQTT connection: a minimal fake `bot` is injected so that
 * `hasMappingCapabilities()` and the various `handle*()` / `emit*()` hooks can be
 * controlled per test, and a real dispatcher is bound to the fake session.
 */

const { describe, it } = require('node:test');
const assert = require('assert');
const EcovacsDeviceSession = require('../library/ecovacsDeviceSession');
const EcovacsMessageDispatcher = require('../library/ecovacsMessageDispatcher');

const MESSAGE_TYPE = Object.freeze({
    INCOMING: 'incoming',
    RESPONSE: 'response',
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the minimal `bot` stub that handleMessagePayload() needs.
 * @param {Object} overrides - Properties to override on the stub.
 * @returns {Object}
 */
function makeFakeBot(overrides = {}) {
    return {
        // Capability flags — default to a map-capable device
        hasMappingCapabilities: () => true,
        isPlatformTypeAirbot: () => false,
        genericCommand: null,
        // handle* stubs — no-ops unless overridden
        handleBattery: () => { },
        handleWaterInfo: () => { },
        handleChargeState: () => { },
        handleCleanInfo: () => { },
        handleNetInfo: () => { },
        handleTotalStats: () => { },
        handleSpeed: () => { },
        handleAdvancedMode: () => { },
        handleBreakPoint: () => { },
        handleTrueDetect: () => { },
        handleSweepMode: () => { },
        handleRelocationState: () => { },
        handleMapSet: () => ({ mapsetEvent: 'skip', mapsetData: null }),
        handleMapSubset: async () => ({ mapsubsetEvent: 'error', mapsubsetData: null }),
        handleMapTrace: () => { },
        handleMultiMapState: () => { },
        handleCachedMapInfo: () => { },
        // state properties
        batteryLevel: null,
        waterLevel: null,
        waterboxInfo: null,
        moppingType: null,
        scrubbingType: null,
        chargeStatus: null,
        chargeMode: null,
        currentCustomAreaValues: null,
        currentSpotAreas: null,
        cleanReport: null,
        errorCode: '0',
        errorDescription: '',
        multiMapState: null,
        maps: null,
        currentMapMID: null,
        currentMapName: null,
        currentMapIndex: null,
        relocationState: null,
        relocationStatus: null,
        ...overrides
    };
}

/**
 * Build a minimal EcovacsDeviceSession instance (no real MQTT connection) plus a
 * real EcovacsMessageDispatcher bound to it. We skip `connect()` entirely and
 * stub the EventEmitter infrastructure.
 * @param {Object} botOverrides
 * @returns {{ ecovacs: EcovacsDeviceSession, dispatcher: EcovacsMessageDispatcher, emitted: Object, bot: Object }}
 */
function makeEcovacs(botOverrides = {}) {
    const bot = makeFakeBot(botOverrides);
    const emitted = {};

    // EcovacsDeviceSession extends EventEmitter — instantiate it directly via
    // Object.create so we don't need a real MQTT client.
    const ecovacs = Object.create(EcovacsDeviceSession.prototype);
    // Wire the minimal EventEmitter surface
    require('events').EventEmitter.call(ecovacs);
    Object.assign(ecovacs, require('events').EventEmitter.prototype);

    ecovacs.bot = bot;
    ecovacs.dictionary = require('../library/dictionary');
    ecovacs.pendingCommands = { size: 0, resolveByEvent: () => { } };

    // Capture all emitted events for assertions
    ecovacs.emit = (name, ...args) => {
        emitted[name] = args[0];
    };
    ecovacs.emitMessage = (name, payload) => {
        emitted[name] = payload;
    };

    // The dispatcher delegates bot / emit / emitMessage back to the session, so
    // its handler bodies operate against the captures wired above.
    const dispatcher = new EcovacsMessageDispatcher(ecovacs);
    ecovacs.dispatcher = dispatcher;

    return { ecovacs, dispatcher, emitted, bot };
}

// ---------------------------------------------------------------------------
// getCommandPrefix()
// ---------------------------------------------------------------------------

describe('EcovacsMessageDispatcher.getCommandPrefix()', function () {
    const { dispatcher } = makeEcovacs();

    it('should return "on" for "on"-prefixed names', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('onWaterInfo'), 'on');
        assert.strictEqual(dispatcher.getCommandPrefix('onBattery'), 'on');
    });

    it('should return "off" for "off"-prefixed names', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('offMapSubSet'), 'off');
    });

    it('should return "report" for "report"-prefixed names', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('reportStats'), 'report');
        assert.strictEqual(dispatcher.getCommandPrefix('reportCleanInfo'), 'report');
    });

    it('should return "get" for lowercase "get"-prefixed names', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('getWaterInfo'), 'get');
    });

    it('should return "get" for capitalised "Get"-prefixed names', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('GetWaterInfo'), 'get');
    });

    it('should return "" for names with no known prefix', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('WaterInfo'), '');
        assert.strictEqual(dispatcher.getCommandPrefix('Battery'), '');
        assert.strictEqual(dispatcher.getCommandPrefix('SomeNewFeature'), '');
    });

    // Regression: "set" must NOT be treated as a normalisation prefix.
    // set-prefixed names are Command-Responses, not MQTT push messages.
    it('should return "" for "set"-prefixed names (not an MQTT push prefix)', function () {
        assert.strictEqual(dispatcher.getCommandPrefix('setWaterInfo'), '');
        assert.strictEqual(dispatcher.getCommandPrefix('SetWaterInfo'), '');
    });
});

// ---------------------------------------------------------------------------
// Stem normalisation: on/off/report/get all reach the same switch-case
// ---------------------------------------------------------------------------

describe('handleMessagePayload() – prefix normalisation', function () {
    it('"onWaterInfo" and "getWaterInfo" produce the same WaterInfo handler path', async function () {
        const emitted1 = {};
        const emitted2 = {};

        for (const [name, target] of [['onWaterInfo', emitted1], ['getWaterInfo', emitted2]]) {
            const { ecovacs, dispatcher } = makeEcovacs({
                handleWaterInfo: () => { },
                waterLevel: 2,
                waterboxInfo: 1,
                moppingType: null,
                scrubbingType: null,
            });
            ecovacs.emitMessage = (evtName, payload) => { target[evtName] = payload; };
            dispatcher.emitMoppingSystemReport = () => { };

            await dispatcher.handleMessagePayload(name, { amount: 2, enable: 1 });
        }

        // Both paths must have emitted WaterInfo and WaterLevel
        assert.ok('WaterInfo' in emitted1, '"onWaterInfo" should emit WaterInfo');
        assert.ok('WaterInfo' in emitted2, '"getWaterInfo" should emit WaterInfo');
        assert.ok('WaterLevel' in emitted1, '"onWaterInfo" should emit WaterLevel');
        assert.ok('WaterLevel' in emitted2, '"getWaterInfo" should emit WaterLevel');
    });

    it('"reportStats" reaches the Stats handler (emits Stats → CurrentStats)', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs({
            handleStats: () => { },
            currentStats: { cleanedArea: 10 },
        });
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

        await dispatcher.handleMessagePayload('reportStats', { area: 10, time: 300, type: 'auto' });

        assert.ok('CurrentStats' in emitted, '"reportStats" should emit CurrentStats');
    });

    it('"reportCleanInfo" reaches the CleanInfo handler (emits CleanReport)', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs({
            handleCleanInfo: () => { },
            cleanReport: 'idle',
            chargeStatus: null,
            currentCustomAreaValues: null,
            currentSpotAreas: null,
        });
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };
        dispatcher.emitMoppingSystemReport = () => { };

        await dispatcher.handleMessagePayload('reportCleanInfo', {});

        assert.ok('CleanReport' in emitted, '"reportCleanInfo" should emit CleanReport');
    });
});

// ---------------------------------------------------------------------------
// setWaterInfo must NOT route to WaterInfo handler
// ---------------------------------------------------------------------------

describe('handleMessagePayload() – set-prefix is NOT normalised', function () {
    it('"setWaterInfo" does NOT reach the WaterInfo switch-case', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs();
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

        // "setWaterInfo" → getCommandPrefix() returns '' → abbreviatedCommand = "setWaterInfo"
        // There is no switch-case "setWaterInfo", so it falls to default and only warns.
        await dispatcher.handleMessagePayload('setWaterInfo', { amount: 2, enable: 1 });

        assert.ok(!('WaterInfo' in emitted), '"setWaterInfo" must not emit WaterInfo');
        assert.ok(!('WaterLevel' in emitted), '"setWaterInfo" must not emit WaterLevel');
    });
});

// ---------------------------------------------------------------------------
// Unknown on... messages must land in default (no-op, no crash)
// ---------------------------------------------------------------------------

describe('handleMessagePayload() – unknown on... messages', function () {
    it('"onSomeNewFeature" does not throw and does not emit a known event', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs();
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

        // Must not throw
        await assert.doesNotReject(
            () => dispatcher.handleMessagePayload('onSomeNewFeature', { foo: 'bar' })
        );

        // Should not have emitted any domain event
        const domainEvents = Object.keys(emitted).filter(k => k !== 'messageReceived');
        assert.strictEqual(domainEvents.length, 0,
            `Expected no domain events, got: ${domainEvents.join(', ')}`);
    });
});

// ---------------------------------------------------------------------------
// _V2 suffix handling
// ---------------------------------------------------------------------------

describe('handleMessagePayload() – _V2 suffix stripping', function () {
    it('"onSpeed_V2" strips "_V2" and reaches the Speed (CleanSpeed) handler', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs({
            handleSpeed: () => { },
            cleanSpeed: 'MAX',
        });
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

        await dispatcher.handleMessagePayload('onSpeed_V2', { speed: 2 });

        assert.ok('CleanSpeed' in emitted, '"onSpeed_V2" should emit CleanSpeed');
    });

    it('"onMapSet_V2" does NOT strip "_V2" (explicit exception in handleV2commands)', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs({
            handleMapSet_V2: async () => { },
            mapSet_V2: null,
        });
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

        await dispatcher.handleMessagePayload('onMapSet_V2', {});

        // MapSet_V2 case should have been reached (even if mapSet_V2 is null)
        assert.ok('MapSet_V2' in emitted, '"onMapSet_V2" should emit MapSet_V2');
    });
});

// ---------------------------------------------------------------------------
// Map-capability guard
// ---------------------------------------------------------------------------

describe('handleMessagePayload() – map capability guard', function () {
    const MAP_STEMS = ['MapSet', 'MapSubSet', 'MultiMapState', 'MapTrace', 'MinorMap', 'CachedMapInfo'];

    for (const stem of MAP_STEMS) {
        it(`"on${stem}" is silently skipped for a device without mapping capabilities`, async function () {
            const emitted = {};
            const { ecovacs, dispatcher } = makeEcovacs({
                hasMappingCapabilities: () => false,
            });
            ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

            await assert.doesNotReject(
                () => dispatcher.handleMessagePayload(`on${stem}`, {})
            );

            // Only 'messageReceived' is allowed; no map event should be emitted
            const mapEvents = Object.keys(emitted);
            assert.strictEqual(mapEvents.length, 0,
                `Expected no events for "on${stem}" without map capability, got: ${mapEvents.join(', ')}`);
        });
    }

    it('"onMapSet" IS processed for a device WITH mapping capabilities', async function () {
        const emitted = {};
        const { ecovacs, dispatcher } = makeEcovacs({
            hasMappingCapabilities: () => true,
            handleMapSet: () => ({ mapsetEvent: 'SpotAreas', mapsetData: [] }),
        });
        ecovacs.emitMessage = (name, payload) => { emitted[name] = payload; };

        await dispatcher.handleMessagePayload('onMapSet', { mid: '123', type: 'sa' });

        assert.ok('SpotAreas' in emitted, '"onMapSet" should emit SpotAreas on map-capable device');
    });
});

// ---------------------------------------------------------------------------
// GetNetInfoLegacy payload compatibility
// ---------------------------------------------------------------------------

describe('GetNetInfoLegacy – payload field compatibility', function () {
    it('BotState.handleNetInfo() normalises modern keys (ip, ssid, rssi, mac)', function () {
        const BotState = require('../library/managers/botState');
        const state = new BotState({
            deviceClass: 'ucn2xe',
            isPlatformTypeAirbot: () => false,
            run: () => { },
            ecovacs: { emit: () => { }, emitMessage: () => { } },
            currentMapMID: '100',
            mapSpotAreaInfos: { '100': [] },
            currentSpotAreas: '',
            currentCustomAreaValues: '',
            getSpotAreaName: () => 'unknown',
        });

        state.handleNetInfo({ ip: '192.168.1.10', ssid: 'HomeWifi', rssi: -60, mac: 'AA:BB:CC:DD:EE:FF' });

        assert.strictEqual(state.netInfoIP, '192.168.1.10');
        assert.strictEqual(state.netInfoWifiSSID, 'HomeWifi');
        assert.strictEqual(state.netInfoWifiSignal, -60);
        assert.strictEqual(state.netInfoMAC, 'AA:BB:CC:DD:EE:FF');
    });

    it('BotState.handleNetInfo() normalises legacy keys (wi, s, st, wm)', function () {
        const BotState = require('../library/managers/botState');
        const state = new BotState({
            deviceClass: 'ucn2xe',
            isPlatformTypeAirbot: () => false,
            run: () => { },
            ecovacs: { emit: () => { }, emitMessage: () => { } },
            currentMapMID: '100',
            mapSpotAreaInfos: { '100': [] },
            currentSpotAreas: '',
            currentCustomAreaValues: '',
            getSpotAreaName: () => 'unknown',
        });

        state.handleNetInfo({ wi: '10.0.0.1', s: 'Office', st: -75, wm: '11:22:33:44:55:66' });

        assert.strictEqual(state.netInfoIP, '10.0.0.1');
        assert.strictEqual(state.netInfoWifiSSID, 'Office');
        assert.strictEqual(state.netInfoWifiSignal, -75);
        assert.strictEqual(state.netInfoMAC, '11:22:33:44:55:66');
    });
});

// ---------------------------------------------------------------------------
// Private Helpers & Routing Methods
// ---------------------------------------------------------------------------

describe('EcovacsDeviceSession._parseMqttMessage()', function () {
    const { ecovacs } = makeEcovacs();

    it('should return null for malformed JSON', function () {
        const result = ecovacs._parseMqttMessage('onBattery', '{invalid-json}');
        assert.strictEqual(result, null);
    });

    it('should parse and return valid JSON object', function () {
        const payloadStr = JSON.stringify({ body: { data: { value: 100 } } });
        const result = ecovacs._parseMqttMessage('onCustomEventName', payloadStr);
        assert.deepStrictEqual(result, {
            body: { data: { value: 100 } }
        });
    });
});

describe('EcovacsDeviceSession.handleMessage()', function () {
    it('should handle INCOMING type with parsed envelope object', async function () {
        const { ecovacs } = makeEcovacs();
        let dispatched = null;
        ecovacs._dispatchPayload = (eventName, payload) => {
            dispatched = { eventName, payload };
        };

        const envelope = { body: { data: { value: 123 } } };
        ecovacs.handleMessage('onBattery', envelope, MESSAGE_TYPE.INCOMING);

        assert.deepStrictEqual(dispatched, { eventName: 'onBattery', payload: { value: 123 } });
    });

    it('should handle RESPONSE type', async function () {
        const { ecovacs } = makeEcovacs();
        let dispatched = null;
        ecovacs._dispatchPayload = (eventName, payload) => {
            dispatched = { eventName, payload };
        };

        const envelope = { body: { code: 0, msg: 'ok', data: { status: 'done' } } };
        ecovacs.handleMessage('Clean', envelope, MESSAGE_TYPE.RESPONSE);

        assert.deepStrictEqual(dispatched, { eventName: 'Clean', payload: { status: 'done' } });
    });

    it('should emit firmware version if header is present in RESPONSE', function () {
        const { ecovacs, bot, emitted } = makeEcovacs();
        bot.firmwareVersion = '1.0.0';

        const envelope = {
            header: { fwVer: '2.0.0', hwVer: '1.0.1' },
            body: { code: 0, msg: 'ok', data: { status: 'done' } }
        };
        ecovacs.handleMessage('Clean', envelope, MESSAGE_TYPE.RESPONSE);

        assert.strictEqual(bot.firmwareVersion, '2.0.0');
        assert.deepStrictEqual(emitted['HeaderInfo'], { fwVer: '2.0.0', hwVer: '1.0.1' });
    });
});

describe('EcovacsDeviceSession._handleFirmwareVersion()', function () {
    it('should update firmwareVersion and emit HeaderInfo if firmware version changed', function () {
        const { ecovacs, emitted, bot } = makeEcovacs();
        bot.firmwareVersion = '1.0.0';

        ecovacs._handleFirmwareVersion({ fwVer: '2.0.0', hwVer: '1.0.1' });

        assert.strictEqual(bot.firmwareVersion, '2.0.0');
        assert.deepStrictEqual(emitted['HeaderInfo'], {
            fwVer: '2.0.0',
            hwVer: '1.0.1'
        });
    });

    it('should not update firmwareVersion or emit HeaderInfo if firmware version did not change', function () {
        const { ecovacs, emitted, bot } = makeEcovacs();
        bot.firmwareVersion = '1.0.0';

        ecovacs._handleFirmwareVersion({ fwVer: '1.0.0', hwVer: '1.0.1' });

        assert.strictEqual(bot.firmwareVersion, '1.0.0');
        assert.ok(!('HeaderInfo' in emitted));
    });
});

describe('EcovacsDeviceSession._dispatchPayload()', function () {
    it('should dispatch payload via dispatcher.handleMessagePayload', async function () {
        const { ecovacs } = makeEcovacs();
        let dispatched = null;
        ecovacs.dispatcher.handleMessagePayload = async (eventName, payload) => {
            dispatched = { eventName, payload };
        };
        ecovacs._dispatchPayload('TestEvent', { value: 1 });

        // Wait for the async task queue to flush
        await new Promise(resolve => setTimeout(resolve, 10));
        assert.deepStrictEqual(dispatched, { eventName: 'TestEvent', payload: { value: 1 } });
    });

    it('should emit error code -2 if handleMessagePayload throws', async function () {
        const { ecovacs } = makeEcovacs();
        let emittedError = null;
        ecovacs.dispatcher.handleMessagePayload = async () => {
            throw new Error('Test error');
        };
        ecovacs.emitError = (code, message) => {
            emittedError = { code, message };
        };
        ecovacs._dispatchPayload('TestEvent', { value: 1 });

        // Wait for the async task queue to flush
        await new Promise(resolve => setTimeout(resolve, 10));
        assert.deepStrictEqual(emittedError, { code: '-2', message: 'Test error' });
    });
});
