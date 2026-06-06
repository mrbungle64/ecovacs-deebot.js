'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const BotState = require('../library/managers/botState');

// ---------------------------------------------------------------------------
// Minimal bot stub — only what BotState actually calls
// ---------------------------------------------------------------------------
function makeFakeBot(overrides = {}) {
    return {
        deviceClass: 'ucn2xe', // T9 as a sensible default
        currentSpotAreas: '',
        currentCustomAreaValues: '',
        currentMapMID: '100',
        mapSpotAreaInfos: { '100': [] },
        isPlatformTypeAirbot: () => false,
        getSpotAreaName: () => 'unknown',
        run: () => {},
        ecovacs: {
            emit: () => {},
            emitMessage: () => {}
        },
        ...overrides
    };
}

// ---------------------------------------------------------------------------
// Constructor – initial state
// ---------------------------------------------------------------------------
describe('BotState – constructor / initial state', function () {
    it('should initialise batteryLevel to null and batteryIsLow to false', function () {
        const state = new BotState(makeFakeBot());
        assert.strictEqual(state.batteryLevel, null);
        assert.strictEqual(state.batteryIsLow, false);
    });

    it('should initialise deebotPosition with sensible defaults', function () {
        const state = new BotState(makeFakeBot());
        assert.strictEqual(state.deebotPosition.isInvalid, false);
        assert.strictEqual(state.deebotPosition.currentSpotAreaID, 'unknown');
        assert.strictEqual(state.deebotPosition.changeFlag, false);
    });

    it('should initialise errorCode to "0" and errorDescription to ""', function () {
        const state = new BotState(makeFakeBot());
        assert.strictEqual(state.errorCode, '0');
        assert.strictEqual(state.errorDescription, '');
    });

    it('should initialise currentTask with type and triggerType "none"', function () {
        const state = new BotState(makeFakeBot());
        assert.strictEqual(state.currentTask.type, 'none');
        assert.strictEqual(state.currentTask.triggerType, 'none');
        assert.strictEqual(state.currentTask.failed, false);
    });
});

// ---------------------------------------------------------------------------
// handleBattery
// ---------------------------------------------------------------------------
describe('BotState – handleBattery()', function () {
    it('should set batteryLevel and batteryIsLow from a normal payload', function () {
        const state = new BotState(makeFakeBot());
        state.handleBattery({ value: 80, isLow: 0 });
        assert.strictEqual(state.batteryLevel, 80);
        assert.strictEqual(state.batteryIsLow, false);
    });

    it('should mark batteryIsLow=true when isLow flag is set', function () {
        const state = new BotState(makeFakeBot());
        state.handleBattery({ value: 10, isLow: 1 });
        assert.strictEqual(state.batteryLevel, 10);
        assert.strictEqual(state.batteryIsLow, true);
    });

    it('should derive isLow from level when isLow field is absent (≤15 → low)', function () {
        const state = new BotState(makeFakeBot());
        state.handleBattery({ value: 15 });
        assert.strictEqual(state.batteryIsLow, true);
    });

    it('should derive isLow=false from level when level is 16 (above threshold)', function () {
        const state = new BotState(makeFakeBot());
        state.handleBattery({ value: 16 });
        assert.strictEqual(state.batteryIsLow, false);
    });
});

// ---------------------------------------------------------------------------
// handleChargeState
// ---------------------------------------------------------------------------
describe('BotState – handleChargeState()', function () {
    it('should set chargeStatus to "charging" when isCharging=1', function () {
        const state = new BotState(makeFakeBot());
        state.handleChargeState({ isCharging: 1 });
        assert.strictEqual(state.chargeStatus, 'charging');
        assert.strictEqual(state.chargeMode, 'slot'); // default
    });

    it('should set chargeStatus to "idle" when isCharging=0', function () {
        const state = new BotState(makeFakeBot());
        state.handleChargeState({ isCharging: 0 });
        assert.strictEqual(state.chargeStatus, 'idle');
    });

    it('should use the provided mode when present', function () {
        const state = new BotState(makeFakeBot());
        state.handleChargeState({ isCharging: 0, mode: 'wireless' });
        assert.strictEqual(state.chargeMode, 'wireless');
    });
});

// ---------------------------------------------------------------------------
// handleStationState
// ---------------------------------------------------------------------------
describe('BotState – handleStationState()', function () {
    it('should set isAirDrying=true for type=2, state=1', function () {
        const state = new BotState(makeFakeBot());
        state.handleStationState({ content: { type: 2 }, state: 1 });
        assert.strictEqual(state.stationState.isAirDrying, true);
        assert.strictEqual(state.stationState.isSelfCleaning, false);
        assert.strictEqual(state.stationState.isActive, true);
    });

    it('should set isSelfCleaning=true for type=3, state=1', function () {
        const state = new BotState(makeFakeBot());
        state.handleStationState({ content: { type: 3 }, state: 1 });
        assert.strictEqual(state.stationState.isSelfCleaning, true);
        assert.strictEqual(state.stationState.isAirDrying, false);
    });

    it('should set isActive=false when state=0', function () {
        const state = new BotState(makeFakeBot());
        state.handleStationState({ content: { type: 2 }, state: 0 });
        assert.strictEqual(state.stationState.isActive, false);
    });

    it('should default type and state to 0 when missing', function () {
        const state = new BotState(makeFakeBot());
        state.handleStationState({});
        assert.strictEqual(state.stationState.type, 0);
        assert.strictEqual(state.stationState.state, 0);
        assert.strictEqual(state.stationState.isActive, false);
    });
});

// ---------------------------------------------------------------------------
// handleStationInfo
// ---------------------------------------------------------------------------
describe('BotState – handleStationInfo()', function () {
    it('should store all station info fields', function () {
        const state = new BotState(makeFakeBot());
        const payload = { state: 1, name: 'Base', model: 'B01', sn: 'SN123', wkVer: 'v1.0' };
        state.handleStationInfo(payload);
        assert.deepStrictEqual(state.stationInfo, payload);
    });
});

// ---------------------------------------------------------------------------
// handleWashInterval / handleWashInfo
// ---------------------------------------------------------------------------
describe('BotState – handleWashInterval() / handleWashInfo()', function () {
    it('should set washInterval when interval key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleWashInterval({ interval: 15 });
        assert.strictEqual(state.washInterval, 15);
    });

    it('should not change washInterval when interval key is absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleWashInterval({});
        assert.strictEqual(state.washInterval, undefined);
    });

    it('should set washInfo when mode key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleWashInfo({ mode: 2 });
        assert.strictEqual(state.washInfo, 2);
    });

    it('should not change washInfo when mode key is absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleWashInfo({});
        assert.strictEqual(state.washInfo, undefined);
    });
});

// ---------------------------------------------------------------------------
// handleWaterInfo
// ---------------------------------------------------------------------------
describe('BotState – handleWaterInfo()', function () {
    it('should set waterLevel and waterboxInfo', function () {
        const state = new BotState(makeFakeBot());
        state.handleWaterInfo({ amount: 2, enable: 1 });
        assert.strictEqual(state.waterLevel, 2);
        assert.strictEqual(state.waterboxInfo, 1);
        assert.strictEqual(state.moppingType, null);   // not set
        assert.strictEqual(state.scrubbingType, null); // not set
    });

    it('should set moppingType when type key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleWaterInfo({ amount: 2, enable: 1, type: 2 });
        assert.strictEqual(state.moppingType, 2);
    });

    it('should set scrubbingType when sweepType key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleWaterInfo({ amount: 2, enable: 1, sweepType: 1 });
        assert.strictEqual(state.scrubbingType, 1);
    });
});

// ---------------------------------------------------------------------------
// handleNetInfo
// ---------------------------------------------------------------------------
describe('BotState – handleNetInfo()', function () {
    it('should read primary keys (ip, ssid, rssi, mac)', function () {
        const state = new BotState(makeFakeBot());
        state.handleNetInfo({ ip: '192.168.1.1', ssid: 'Home', rssi: -55, mac: 'AA:BB:CC:DD:EE:FF' });
        assert.strictEqual(state.netInfoIP, '192.168.1.1');
        assert.strictEqual(state.netInfoWifiSSID, 'Home');
        assert.strictEqual(state.netInfoWifiSignal, -55);
        assert.strictEqual(state.netInfoMAC, 'AA:BB:CC:DD:EE:FF');
    });

    it('should fall back to legacy keys (wi, s, st, wm) when primary keys are absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleNetInfo({ wi: '10.0.0.1', s: 'Office', st: -70, wm: '11:22:33:44:55:66' });
        assert.strictEqual(state.netInfoIP, '10.0.0.1');
        assert.strictEqual(state.netInfoWifiSSID, 'Office');
        assert.strictEqual(state.netInfoWifiSignal, -70);
        assert.strictEqual(state.netInfoMAC, '11:22:33:44:55:66');
    });
});

// ---------------------------------------------------------------------------
// handleWorkMode / handleWorkState / handleSweepMode / handleCustomAreaMode
// ---------------------------------------------------------------------------
describe('BotState – work mode handlers', function () {
    it('handleWorkMode() should store the mode value', function () {
        const state = new BotState(makeFakeBot());
        state.handleWorkMode({ mode: 2 });
        assert.strictEqual(state.workMode, 2);
    });

    it('handleWorkState() should parse robot and station states and paused flag', function () {
        const state = new BotState(makeFakeBot());
        state.handleWorkState({
            robotState: { state: 'cleaning' },
            stationState: { state: 'idle' },
            paused: 0
        });
        assert.strictEqual(state.workState.robot, 'cleaning');
        assert.strictEqual(state.workState.station, 'idle');
        assert.strictEqual(state.workState.paused, false);
    });

    it('handleWorkState() should handle missing robotState/stationState gracefully', function () {
        const state = new BotState(makeFakeBot());
        state.handleWorkState({ paused: 1 });
        assert.strictEqual(state.workState.robot, null);
        assert.strictEqual(state.workState.station, null);
        assert.strictEqual(state.workState.paused, true);
    });

    it('handleSweepMode() should set mopOnlyMode=true when type=1', function () {
        const state = new BotState(makeFakeBot());
        state.handleSweepMode({ type: 1 });
        assert.strictEqual(state.mopOnlyMode, true);
    });

    it('handleSweepMode() should set mopOnlyMode=false when type=0', function () {
        const state = new BotState(makeFakeBot());
        state.handleSweepMode({ type: 0 });
        assert.strictEqual(state.mopOnlyMode, false);
    });

    it('handleSweepMode() should not change mopOnlyMode when type key is absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleSweepMode({});
        assert.strictEqual(state.mopOnlyMode, null);
    });

    it('handleCustomAreaMode() should set sweepMode when sweepMode key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleCustomAreaMode({ sweepMode: 1 });
        assert.strictEqual(state.sweepMode, 1);
    });

    it('handleCustomAreaMode() should not change sweepMode when key is absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleCustomAreaMode({});
        assert.strictEqual(state.sweepMode, null);
    });
});

// ---------------------------------------------------------------------------
// Simple payload-mapping handlers
// ---------------------------------------------------------------------------
describe('BotState – simple payload-mapping handlers', function () {
    const cases = [
        { fn: 'handleVolume',           payload: { volume: 7 },         prop: 'volume',           expected: 7 },
        { fn: 'handleBreakPoint',       payload: { enable: 1 },         prop: 'breakPoint',       expected: true },
        { fn: 'handleAdvancedMode',     payload: { enable: 1 },         prop: 'advancedMode',     expected: true },
        { fn: 'handleTrueDetect',       payload: { enable: 1 },         prop: 'trueDetect',       expected: true },
        { fn: 'handleCleanCount',       payload: { count: 3 },          prop: 'cleanCount',       expected: 3 },
        { fn: 'handleCarpetPressure',   payload: { enable: 1 },         prop: 'carpetPressure',   expected: true },
        { fn: 'handleCarpetInfo',       payload: { mode: 1 },           prop: 'carpetInfo',       expected: 1 },
        { fn: 'handleSleepStatus',      payload: { enable: 1 },         prop: 'sleepStatus',      expected: true },
        { fn: 'handleAutoEmpty',        payload: { enable: 1 },         prop: 'autoEmpty',        expected: 1 },
        { fn: 'handleBorderSwitch',     payload: { enable: 1 },         prop: 'borderSwitch',     expected: true },
        { fn: 'handleCleanPreference',  payload: { enable: 1 },         prop: 'cleanPreference',  expected: true },
        { fn: 'handleWorkMode',         payload: { mode: 3 },           prop: 'workMode',         expected: 3 },
        { fn: 'handleSafeProtect',      payload: { enable: 0 },         prop: 'safeProtect',      expected: false },
        { fn: 'handleMoveupWarning',    payload: { enable: 1 },         prop: 'moveupWarning',    expected: true },
        { fn: 'handleCutDirection',     payload: { angle: 45 },         prop: 'cutDirection',     expected: 45 },
        { fn: 'handleCrossMapBorderWarning', payload: { enable: 1 },    prop: 'crossMapBorderWarning', expected: true },
    ];

    cases.forEach(({ fn, payload, prop, expected }) => {
        it(`${fn}() should set ${prop} to ${JSON.stringify(expected)}`, function () {
            const state = new BotState(makeFakeBot());
            state[fn](payload);
            assert.strictEqual(state[prop], expected);
        });
    });
});

// ---------------------------------------------------------------------------
// handleBlock (complex payload with optional time window)
// ---------------------------------------------------------------------------
describe('BotState – handleBlock()', function () {
    it('should set block enable flag', function () {
        const state = new BotState(makeFakeBot());
        state.handleBlock({ enable: 1 });
        assert.strictEqual(state.block, 1);
        assert.strictEqual(state.blockTime, null); // no time window provided
    });

    it('should set blockTime when start/end keys are present', function () {
        const state = new BotState(makeFakeBot());
        state.handleBlock({ enable: 1, start: '22:00', end: '07:00' });
        assert.deepStrictEqual(state.blockTime, { from: '22:00', to: '07:00' });
    });
});

// ---------------------------------------------------------------------------
// handleAutoEmpty with optional status
// ---------------------------------------------------------------------------
describe('BotState – handleAutoEmpty()', function () {
    it('should set autoEmpty and not set autoEmptyStatus when absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleAutoEmpty({ enable: 1 });
        assert.strictEqual(state.autoEmpty, 1);
        assert.strictEqual(state.autoEmptyStatus, null);
    });

    it('should set autoEmptyStatus when status key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleAutoEmpty({ enable: 1, status: 2 });
        assert.strictEqual(state.autoEmptyStatus, 2);
    });
});

// ---------------------------------------------------------------------------
// handleTotalStats
// ---------------------------------------------------------------------------
describe('BotState – handleTotalStats()', function () {
    it('should parse area, time and count as integers', function () {
        const state = new BotState(makeFakeBot());
        state.handleTotalStats({ area: '120', time: '3600', count: '5' });
        assert.strictEqual(state.cleanSum_totalSquareMeters, 120);
        assert.strictEqual(state.cleanSum_totalSeconds, 3600);
        assert.strictEqual(state.cleanSum_totalNumber, 5);
    });
});

// ---------------------------------------------------------------------------
// handleDusterRemind
// ---------------------------------------------------------------------------
describe('BotState – handleDusterRemind()', function () {
    it('should store enabled flag and period', function () {
        const state = new BotState(makeFakeBot());
        state.handleDusterRemind({ enable: 1, period: 30 });
        assert.deepStrictEqual(state.dusterRemind, { enabled: 1, period: 30 });
    });
});

// ---------------------------------------------------------------------------
// handleBorderSpin
// ---------------------------------------------------------------------------
describe('BotState – handleBorderSpin()', function () {
    it('should set borderSpin when type is truthy', function () {
        const state = new BotState(makeFakeBot());
        state.handleBorderSpin({ enable: 1, type: 1 });
        assert.strictEqual(state.borderSpin, true);
    });

    it('should not set borderSpin when type is falsy', function () {
        const state = new BotState(makeFakeBot());
        state.handleBorderSpin({ enable: 1, type: 0 });
        assert.strictEqual(state.borderSpin, null); // unchanged
    });
});

// ---------------------------------------------------------------------------
// handleAirDryingState
// ---------------------------------------------------------------------------
describe('BotState – handleAirDryingState()', function () {
    it('should set airDryingStatus to "airdrying" for status=1', function () {
        const state = new BotState(makeFakeBot());
        state.handleAirDryingState({ status: 1 });
        assert.strictEqual(state.airDryingStatus, 'airdrying');
    });

    it('should set airDryingStatus to "idle" for status=2', function () {
        const state = new BotState(makeFakeBot());
        state.handleAirDryingState({ status: 2 });
        assert.strictEqual(state.airDryingStatus, 'idle');
    });

    it('should not update airDryingStatus for unknown status codes', function () {
        const state = new BotState(makeFakeBot());
        state.handleAirDryingState({ status: 99 });
        assert.strictEqual(state.airDryingStatus, null); // unchanged
    });
});

// ---------------------------------------------------------------------------
// handleDryingDuration
// ---------------------------------------------------------------------------
describe('BotState – handleDryingDuration()', function () {
    it('should set dryingDuration when duration key is present', function () {
        const state = new BotState(makeFakeBot());
        state.handleDryingDuration({ duration: 180 });
        assert.strictEqual(state.dryingDuration, 180);
    });

    it('should not change dryingDuration when duration key is absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleDryingDuration({});
        assert.strictEqual(state.dryingDuration, undefined);
    });
});

// ---------------------------------------------------------------------------
// handleRelocationState
// ---------------------------------------------------------------------------
describe('BotState – handleRelocationState()', function () {
    it('should store the full payload and extract the state string', function () {
        const state = new BotState(makeFakeBot());
        const payload = { state: 'located', extra: 'data' };
        state.handleRelocationState(payload);
        assert.deepStrictEqual(state.relocationStatus, payload);
        assert.strictEqual(state.relocationState, 'located');
    });
});

// ---------------------------------------------------------------------------
// handleTimeZone
// ---------------------------------------------------------------------------
describe('BotState – handleTimeZone()', function () {
    it('should format positive UTC offset correctly', function () {
        const state = new BotState(makeFakeBot());
        state.handleTimeZone({ tzm: 60 });
        assert.strictEqual(state.timezone, 'GMT+1:00');
    });

    it('should format negative UTC offset correctly', function () {
        const state = new BotState(makeFakeBot());
        state.handleTimeZone({ tzm: -300 });
        assert.strictEqual(state.timezone, 'GMT--5:00');
    });
});

// ---------------------------------------------------------------------------
// handleEvt
// ---------------------------------------------------------------------------
describe('BotState – handleEvt()', function () {
    it('should store a known event code with its description', function () {
        const { eventCodes } = require('../library/eventCodes.json');
        const knownCode = Object.keys(eventCodes)[0];
        if (!knownCode) return; // skip if no events defined

        const state = new BotState(makeFakeBot());
        state.handleEvt({ code: knownCode });
        assert.strictEqual(state.evt.code, knownCode);
        assert.strictEqual(state.evt.event, eventCodes[knownCode]);
    });

    it('should store an "Unhandled" message for unknown event codes', function () {
        const state = new BotState(makeFakeBot());
        state.handleEvt({ code: '__unknown_evt_code__' });
        assert.ok(state.evt.event.includes('Unhandled'), `Expected "Unhandled" in: ${state.evt.event}`);
    });
});

// ---------------------------------------------------------------------------
// handleRecognization
// ---------------------------------------------------------------------------
describe('BotState – handleRecognization()', function () {
    it('should set trueDetect from the state field', function () {
        const state = new BotState(makeFakeBot());
        state.handleRecognization({ state: 1 });
        assert.strictEqual(state.trueDetect, 1);
    });
});

// ---------------------------------------------------------------------------
// handleLiveLaunchPwdState
// ---------------------------------------------------------------------------
describe('BotState – handleLiveLaunchPwdState()', function () {
    it('should store state and hasPwd', function () {
        const state = new BotState(makeFakeBot());
        state.handleLiveLaunchPwdState({ state: 'active', hasPwd: true });
        assert.deepStrictEqual(state.liveLaunchPwdState, { state: 'active', hasPwd: true });
    });
});

// ---------------------------------------------------------------------------
// handleAICleanItemState
// ---------------------------------------------------------------------------
describe('BotState – handleAICleanItemState()', function () {
    it('should set particleRemoval and petPoopPrevention from items array', function () {
        const state = new BotState(makeFakeBot());
        state.handleAICleanItemState({ items: [{ state: 1 }, { state: 0 }, { state: 1 }] });
        assert.strictEqual(state.aiCleanItemState.particleRemoval, true);
        assert.strictEqual(state.aiCleanItemState.petPoopPrevention, true);
    });

    it('should not modify aiCleanItemState when items key is absent', function () {
        const state = new BotState(makeFakeBot());
        state.handleAICleanItemState({});
        assert.strictEqual(state.aiCleanItemState, null);
    });
});

// ---------------------------------------------------------------------------
// handleSpeed – platform differences
// ---------------------------------------------------------------------------
describe('BotState – handleSpeed()', function () {
    it('should translate speed code via dictionary for non-Airbot devices', function () {
        const state = new BotState(makeFakeBot({ isPlatformTypeAirbot: () => false }));
        const dictionary = require('../library/dictionary');
        const validCode = Object.keys(dictionary.CLEAN_SPEED_FROM_ECOVACS)[0];
        state.handleSpeed({ speed: parseInt(validCode) });
        assert.strictEqual(state.cleanSpeed, dictionary.CLEAN_SPEED_FROM_ECOVACS[validCode]);
    });

    it('should store the raw speed value for Airbot devices', function () {
        const state = new BotState(makeFakeBot({ isPlatformTypeAirbot: () => true }));
        state.handleSpeed({ speed: 3 });
        assert.strictEqual(state.cleanSpeed, 3);
    });
});
