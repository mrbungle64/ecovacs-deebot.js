'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
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

describe('PendingCommandRegistry & sendCommand Lifecycle', function () {
    const PendingCommandRegistry = require('../library/managers/pendingCommandRegistry');
    const Ecovacs = require('../library/ecovacs');
    const axios = require('axios');

    describe('PendingCommandRegistry', function () {
        it('should register and resolve commands by event name', function () {
            const registry = new PendingCommandRegistry();
            let resolvedVal = null;
            registry.register(
                'req123',
                'getBattery',
                'BatteryInfo',
                { parseResponse: (val) => ({ parsed: val }) },
                (val) => { resolvedVal = val; },
                () => { }
            );
            assert.strictEqual(registry.size, 1);
            const found = registry.resolveByEvent('BatteryInfo', { percentage: 90 });
            assert.strictEqual(found, true);
            assert.strictEqual(registry.size, 0);
            assert.deepStrictEqual(resolvedVal, { parsed: { percentage: 90 } });
        });

        it('should resolve commands by id', function () {
            const registry = new PendingCommandRegistry();
            let resolvedVal = null;
            registry.register(
                'req123',
                'getBattery',
                'BatteryInfo',
                { parseResponse: (val) => ({ parsed: val }) },
                (val) => { resolvedVal = val; },
                () => { }
            );
            assert.strictEqual(registry.size, 1);
            const found = registry.resolveById('req123', { percentage: 80 });
            assert.strictEqual(found, true);
            assert.strictEqual(registry.size, 0);
            assert.deepStrictEqual(resolvedVal, { parsed: { percentage: 80 } });
        });

        it('should reject commands by id', function () {
            const registry = new PendingCommandRegistry();
            let rejectedError = null;
            registry.register(
                'req123',
                'getBattery',
                'BatteryInfo',
                null,
                () => { },
                (err) => { rejectedError = err; }
            );
            assert.strictEqual(registry.size, 1);
            const found = registry.rejectById('req123', new Error('HTTP Error'));
            assert.strictEqual(found, true);
            assert.strictEqual(registry.size, 0);
            assert.strictEqual(rejectedError.message, 'HTTP Error');
        });

        it('should reject all commands on rejectAll', function () {
            const registry = new PendingCommandRegistry();
            let rejectedCount = 0;
            registry.register('req1', 'cmd1', 'evt1', null, () => { }, () => { rejectedCount++; });
            registry.register('req2', 'cmd2', 'evt2', null, () => { }, () => { rejectedCount++; });
            assert.strictEqual(registry.size, 2);
            registry.rejectAll(new Error('Closed'));
            assert.strictEqual(registry.size, 0);
            assert.strictEqual(rejectedCount, 2);
        });
    });

    describe('Ecovacs sendCommand/runAsync flow', function () {
        let originalPost;
        let mockPostResponse = { result: 'ok' };
        let mockPostError = null;

        const mockBot = {
            genericCommand: null,
            errorCode: '0',
            handleResponseError: () => { },
            emitLastError: () => { },
            emitLastErrorByErrorCode: () => { },
            is950type: () => true,
            authDomain: 'ecovacs',
            firmwareVersion: null,
            handleBattery: function (payload) {
                this.batteryLevel = payload.value;
                this.batteryIsLow = payload.hasOwnProperty('isLow') ? !!Number(payload.isLow) : this.batteryLevel <= 15;
            },
            handleWaterInfo: function (payload) {
                this.waterLevel = payload.amount;
                this.waterboxInfo = payload.enable;
                this.moppingType = payload.hasOwnProperty('type') ? payload.type : null;
                this.scrubbingType = payload.hasOwnProperty('sweepType') ? payload.sweepType : null;
            },
            handleWashInfo: function (payload) {
                this.washInfo = payload.mode;
            }
        };
        const mockVacuum = {
            did: 'mock_did',
            class: 'mock_class',
            resource: 'mock_res'
        };

        beforeEach(() => {
            originalPost = axios.post;
            mockPostResponse = { result: 'ok' };
            mockPostError = null;
            mockBot.firmwareVersion = null;
            mockBot.batteryLevel = null;
            mockBot.batteryIsLow = null;
            mockBot.waterLevel = null;
            mockBot.waterboxInfo = null;
            mockBot.moppingType = null;
            mockBot.scrubbingType = null;
            mockBot.washInfo = null;
            axios.post = async () => {
                if (mockPostError) {
                    throw mockPostError;
                }
                return { data: mockPostResponse };
            };
        });

        afterEach(() => {
            axios.post = originalPost;
        });

        it('should resolve immediately for action/set commands (expectedEvent = null)', async function () {
            const ecovacs = new Ecovacs(mockBot, 'user', 'hostname', 'resource', 'secret', 'continent', 'US', mockVacuum);
            const cmd = {
                name: 'Stop',
                args: { id: 'test_id' },
                getId: () => 'test_id'
            };
            const promise = ecovacs.sendCommand(cmd, { returnPromise: true });
            const result = await promise;
            assert.deepStrictEqual(result, { result: 'ok' });
            assert.strictEqual(ecovacs.pendingCommands.size, 0);
        });

        it('should wait for expectedEvent and parse raw response data from the real response flow', async function () {
            const ecovacs = new Ecovacs(mockBot, 'user', 'hostname', 'resource', 'secret', 'continent', 'US', mockVacuum);
            const { GetBatteryState } = require('../library/commands/info');
            const cmd = new GetBatteryState();
            cmd.args.id = 'battery_test_id';
            cmd.getId = () => 'battery_test_id';
            mockPostResponse = {
                result: 'ok',
                resp: {
                    header: { fwVer: 'fw1', hwVer: 'hw1' },
                    body: { code: 0, msg: 'ok', data: { value: 85, isLow: 0 } }
                }
            };

            const promise = ecovacs.sendCommand(cmd, { returnPromise: true });
            assert.strictEqual(ecovacs.pendingCommands.size, 1);

            const result = await promise;
            assert.deepStrictEqual(result, { level: 85, isLow: false });
            assert.strictEqual(ecovacs.pendingCommands.size, 0);
        });

        it('should resolve GetWaterInfo from the real response flow', async function () {
            const ecovacs = new Ecovacs(mockBot, 'user', 'hostname', 'resource', 'secret', 'continent', 'US', mockVacuum);
            const { GetWaterInfo } = require('../library/commands/info');
            const cmd = new GetWaterInfo();
            cmd.args.id = 'water_test_id';
            cmd.getId = () => 'water_test_id';
            mockPostResponse = {
                result: 'ok',
                resp: {
                    body: { code: 0, msg: 'ok', data: { amount: 2, enable: 1, type: 3, sweepType: 4 } }
                }
            };

            const result = await ecovacs.sendCommand(cmd, { returnPromise: true });
            assert.deepStrictEqual(result, { waterLevel: 2, waterboxInfo: 1, moppingType: 3, scrubbingType: 4 });
            assert.strictEqual(ecovacs.pendingCommands.size, 0);
        });

        it('should preserve the registry key for alias-specific command metadata', function () {
            const VacBot = require('../library/vacBot');
            const result = VacBot.prototype.run.call({
                is950type_V2: () => false,
                ecovacs: {
                    sendCommand: (cmd, options) => ({ cmd, options })
                },
                dispatcher: {
                    dispatch: () => assert.fail('should use registry lookup')
                }
            }, 'GetWashInfo');

            assert.strictEqual(result.cmd.constructor.name, 'GetWashInfo');
            assert.strictEqual(result.cmd._registryKey, 'GetWashInfo');
        });

        it('should pass user timeout options through runAsync', function () {
            const VacBot = require('../library/vacBot');
            const result = VacBot.prototype.runAsync.call({
                run: (command, ...args) => ({ command, args })
            }, 'GetBatteryState', { timeoutMs: 250 });

            assert.strictEqual(result.command, 'GetBatteryState');
            assert.strictEqual(result.args.length, 1);
            assert.strictEqual(result.args[0].timeoutMs, 250);
            assert.strictEqual(result.args[0].returnPromise, true);
            assert.strictEqual(result.args[0].__isRunOptions, true);
        });

        it('should reject immediately and clean up on network error', async function () {
            const ecovacs = new Ecovacs(mockBot, 'user', 'hostname', 'resource', 'secret', 'continent', 'US', mockVacuum);
            const { GetBatteryState } = require('../library/commands/info');
            const cmd = new GetBatteryState();
            cmd.args.id = 'battery_test_id';
            cmd.getId = () => 'battery_test_id';

            mockPostError = new Error('Connection refused');

            try {
                await ecovacs.sendCommand(cmd, { returnPromise: true });
                assert.fail('Should have rejected');
            } catch (e) {
                assert.ok(e.message.includes('Connection refused'));
            }
            assert.strictEqual(ecovacs.pendingCommands.size, 0);
        });

        it('should reject immediately and clean up on gateway error response', async function () {
            const ecovacs = new Ecovacs(mockBot, 'user', 'hostname', 'resource', 'secret', 'continent', 'US', mockVacuum);
            const { GetBatteryState } = require('../library/commands/info');
            const cmd = new GetBatteryState();
            cmd.args.id = 'battery_test_id';
            cmd.getId = () => 'battery_test_id';

            mockPostResponse = { result: 'fail', errno: 123, error: 'Internal failure' };

            try {
                await ecovacs.sendCommand(cmd, { returnPromise: true });
                assert.fail('Should have rejected');
            } catch (e) {
                assert.ok(e.message.includes('Failure code 123'));
            }
            assert.strictEqual(ecovacs.pendingCommands.size, 0);
        });
    });
});
