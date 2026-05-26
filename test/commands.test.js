'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');

const {
    CleanArea,
    CleanArea_V2,
    GetCleanInfoV2,
    GetCleanState,
    GetCleanState_V2
} = require('../library/commands/clean');

const {
    GetCarpetAutoFanBoost,
    GetEfficiencyMode,
    GetMopAutoWashFrequency,
    GetLifeSpan,
    GetError,
    GetTrueDetect,
    GetRecognization,
    GetStationState,
    GetStationInfo,
    GetWashInfo,
    GetAirDrying,
    GetDryingDuration,
    GetOta,
    GetSweepMode,
    GetWorkMode,
    GetCleanLogs
} = require('../library/commands/info');

const {
    SetCarpetAutoFanBoost,
    SetMopAutoWashFrequency
} = require('../library/commands/settings');

describe('Deebot Commands parseResponse Tests', function () {
    describe('CleanArea and CleanArea_V2', function () {
        it('CleanArea should format arguments correctly', function () {
            const cmd = new CleanArea('spotArea', '5,8', 2);
            assert.strictEqual(cmd.name, 'clean');
            assert.strictEqual(cmd.args.act, 'start');
            assert.strictEqual(cmd.args.type, 'spotArea');
            assert.strictEqual(cmd.args.content, '5,8');
            assert.strictEqual(cmd.args.count, 2);
        });

        it('CleanArea should handle array area input and default count', function () {
            const cmd = new CleanArea('customArea', [1, 2, 3, 4]);
            assert.strictEqual(cmd.name, 'clean');
            assert.strictEqual(cmd.args.act, 'start');
            assert.strictEqual(cmd.args.type, 'customArea');
            assert.strictEqual(cmd.args.content, '1,2,3,4');
            assert.strictEqual(cmd.args.count, 1);
        });

        it('CleanArea_V2 should format arguments correctly', function () {
            const cmd = new CleanArea_V2('spotArea', '3,4');
            assert.strictEqual(cmd.name, 'clean_V2');
            assert.strictEqual(cmd.args.act, 'start');
            assert.deepStrictEqual(cmd.args.content, {
                type: 'spotArea',
                value: '3,4'
            });
        });
    });

    describe('GetCleanInfoV2 and GetCleanState / GetCleanState_V2', function () {
        it('GetCleanInfoV2 should parse states correctly', function () {
            const cmd = new GetCleanInfoV2();
            assert.strictEqual(cmd.name, 'getCleanInfo_V2');
            assert.strictEqual(cmd.parseResponse({ trigger: 'alert', state: 'clean' }).state, 'error');
            assert.strictEqual(cmd.parseResponse({ trigger: 'none', state: 'idle' }).state, 'idle');
            assert.strictEqual(cmd.parseResponse({ trigger: 'none', state: 'goCharging' }).state, 'returning');
            assert.strictEqual(cmd.parseResponse({
                trigger: 'none',
                state: 'clean',
                cleanState: { motionState: 'working' }
            }).state, 'cleaning');
        });

        it('GetCleanState should parse response correctly', function () {
            const cmd = new GetCleanState();
            assert.strictEqual(cmd.name, 'getCleanInfo');
            const res = cmd.parseResponse({ state: 'clean', trigger: 'none' });
            assert.deepStrictEqual(res, { state: 'clean', trigger: 'none' });
        });

        it('GetCleanState_V2 should parse response correctly', function () {
            const cmd = new GetCleanState_V2();
            assert.strictEqual(cmd.name, 'getCleanInfo_V2');
            const res = cmd.parseResponse({
                trigger: 'none',
                state: 'clean',
                cleanState: { motionState: 'working' }
            });
            assert.strictEqual(res.state, 'cleaning');
        });
    });

    describe('Carpet Auto Fan Boost', function () {
        it('GetCarpetAutoFanBoost should initialize and parse response correctly', function () {
            const cmd = new GetCarpetAutoFanBoost();
            assert.strictEqual(cmd.name, 'getCarpertPressure');
            assert.strictEqual(cmd.parseResponse({ enable: 1 }), true);
            assert.strictEqual(cmd.parseResponse({ enable: 0 }), false);
        });

        it('SetCarpetAutoFanBoost should initialize and build payload correctly', function () {
            const cmdOn = new SetCarpetAutoFanBoost(true);
            assert.strictEqual(cmdOn.name, 'setCarpertPressure');
            assert.strictEqual(cmdOn.args.enable, 1);
        });
    });

    describe('Efficiency Mode', function () {
        it('GetEfficiencyMode should initialize and parse response correctly', function () {
            const cmd = new GetEfficiencyMode();
            assert.strictEqual(cmd.name, 'getEfficiency');
            assert.strictEqual(cmd.parseResponse({ efficiency: 1 }), 1);
        });
    });

    describe('Mop Auto Wash Frequency', function () {
        it('GetMopAutoWashFrequency should initialize and parse response correctly', function () {
            const cmd = new GetMopAutoWashFrequency();
            assert.strictEqual(cmd.name, 'getWashInfo');
            assert.strictEqual(cmd.parseResponse({ interval: 15 }), 15);
        });
    });

    describe('GetLifeSpan', function () {
        it('should parse lifespan components correctly', function () {
            const cmd = new GetLifeSpan();
            assert.strictEqual(cmd.name, 'getLifeSpan');
            const res = cmd.parseResponse([
                { type: 'heap', left: 40, total: 100 }
            ]);
            assert.deepStrictEqual(res, {
                filter: { left: 40, total: 100, percent: 40 }
            });
        });
    });

    describe('GetError', function () {
        it('should parse errors correctly', function () {
            const cmd = new GetError();
            assert.strictEqual(cmd.name, 'getError');
            const resNoErr = cmd.parseResponse({ code: 0 });
            assert.strictEqual(resNoErr.code, 0);
            assert.ok(resNoErr.description.includes('NoError') || resNoErr.description.includes('Kein Fehler'));
        });
    });

    describe('GetTrueDetect and GetRecognization', function () {
        it('should parse values correctly', function () {
            const cmdTD = new GetTrueDetect();
            assert.strictEqual(cmdTD.parseResponse({ enable: 1 }), true);
            assert.strictEqual(cmdTD.parseResponse({ enable: 0 }), false);

            const cmdRec = new GetRecognization();
            assert.strictEqual(cmdRec.parseResponse({ state: 1 }), true);
            assert.strictEqual(cmdRec.parseResponse({ state: 0 }), false);
        });
    });

    describe('GetStationState and GetStationInfo', function () {
        it('should parse station state and info correctly', function () {
            const cmdState = new GetStationState();
            const resState = cmdState.parseResponse({ state: 1, content: { type: 2 } });
            assert.deepStrictEqual(resState, {
                type: 2,
                state: 1,
                isAirDrying: true,
                isSelfCleaning: false,
                isActive: true
            });

            const cmdInfo = new GetStationInfo();
            const resInfo = cmdInfo.parseResponse({ state: 1, name: 'st', model: 'md', sn: '12', wkVer: '1' });
            assert.deepStrictEqual(resInfo, { state: 1, name: 'st', model: 'md', sn: '12', wkVer: '1' });
        });
    });

    describe('GetWashInfo, GetAirDrying and GetDryingDuration', function () {
        it('should parse responses correctly', function () {
            const cmdWash = new GetWashInfo();
            assert.strictEqual(cmdWash.parseResponse({ mode: 2 }), 2);

            const cmdDry = new GetAirDrying();
            assert.strictEqual(cmdDry.parseResponse({ status: 1 }), 'airdrying');
            assert.strictEqual(cmdDry.parseResponse({ status: 2 }), 'idle');

            const cmdDur = new GetDryingDuration();
            assert.strictEqual(cmdDur.parseResponse({ duration: 180 }), 180);
        });
    });

    describe('GetOta, GetSweepMode and GetWorkMode', function () {
        it('should parse responses correctly', function () {
            const cmdOta = new GetOta();
            const resOta = cmdOta.parseResponse({ supportAuto: 1, autoSwitch: 1, ver: '1.2.3', status: 'idle', progress: 50 });
            assert.deepStrictEqual(resOta, {
                supportAuto: true,
                autoSwitch: true,
                version: '1.2.3',
                status: 'idle',
                progress: 50
            });

            const cmdSweep = new GetSweepMode();
            assert.strictEqual(cmdSweep.parseResponse({ type: 1 }), true);

            const cmdWork = new GetWorkMode();
            assert.strictEqual(cmdWork.parseResponse({ mode: 1 }), 1);
        });
    });

    describe('GetCleanLogs', function () {
        it('should parse clean logs response correctly', function () {
            const cmd = new GetCleanLogs();
            const res = cmd.parseResponse({
                logs: [
                    { area: 15, ts: 1710000000, last: 600, imageUrl: 'http://foo', type: 'spot', stopReason: 1 }
                ]
            });
            assert.strictEqual(res.length, 1);
            assert.strictEqual(res[0].squareMeters, 15);
            assert.strictEqual(res[0].timestamp, 1710000000);
            assert.strictEqual(res[0].totalTimeFormatted, '0h 10m 00s');
        });
    });
});
