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
    GetCleanLogs,
    GetBatteryState
} = require('../library/commands/info');

const {
    SetCarpetAutoFanBoost
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

    describe('GetBatteryState', function () {
        it('static parse() should return { level, isLow } when isLow is present', function () {
            const result = GetBatteryState.parse({ value: 85, isLow: 0 });
            assert.deepStrictEqual(result, { level: 85, isLow: false });

            const resultLow = GetBatteryState.parse({ value: 10, isLow: 1 });
            assert.deepStrictEqual(resultLow, { level: 10, isLow: true });
        });

        it('static parse() should derive isLow from level when isLow field is absent', function () {
            // level > 15 → not low
            assert.deepStrictEqual(GetBatteryState.parse({ value: 50 }), { level: 50, isLow: false });
            // level === 15 → low (boundary: exactly at threshold)
            assert.deepStrictEqual(GetBatteryState.parse({ value: 15 }), { level: 15, isLow: true });
            // level === 16 → not low (one above threshold)
            assert.deepStrictEqual(GetBatteryState.parse({ value: 16 }), { level: 16, isLow: false });
            // level < 15 → low
            assert.deepStrictEqual(GetBatteryState.parse({ value: 8 }), { level: 8, isLow: true });
        });

        it('parseResponse() should delegate to static parse() and return the same result', function () {
            const cmd = new GetBatteryState();
            const payload = { value: 72, isLow: 0 };
            assert.deepStrictEqual(cmd.parseResponse(payload), GetBatteryState.parse(payload));
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

    describe('GetTrueDetect', function () {
        it('should parse enable:1 as true and enable:0 as false', function () {
            const cmd = new GetTrueDetect();
            assert.strictEqual(cmd.parseResponse({ enable: 1 }), true);
            assert.strictEqual(cmd.parseResponse({ enable: 0 }), false);
        });
    });

    describe('GetRecognization', function () {
        it('should parse state:1 as true and state:0 as false', function () {
            const cmd = new GetRecognization();
            assert.strictEqual(cmd.parseResponse({ state: 1 }), true);
            assert.strictEqual(cmd.parseResponse({ state: 0 }), false);
        });
    });

    describe('GetStationState', function () {
        it('should parse station state correctly', function () {
            const cmd = new GetStationState();
            const res = cmd.parseResponse({ state: 1, content: { type: 2 } });
            assert.deepStrictEqual(res, {
                type: 2,
                state: 1,
                isAirDrying: true,
                isSelfCleaning: false,
                isActive: true
            });
        });
    });

    describe('GetStationInfo', function () {
        it('should pass through station info fields unchanged', function () {
            const cmd = new GetStationInfo();
            const res = cmd.parseResponse({ state: 1, name: 'st', model: 'md', sn: '12', wkVer: '1' });
            assert.deepStrictEqual(res, { state: 1, name: 'st', model: 'md', sn: '12', wkVer: '1' });
        });
    });

    describe('GetWashInfo', function () {
        it('should return the raw mode value', function () {
            const cmd = new GetWashInfo();
            assert.strictEqual(cmd.parseResponse({ mode: 2 }), 2);
        });
    });

    describe('GetAirDrying', function () {
        it('should map status codes to descriptive strings', function () {
            const cmd = new GetAirDrying();
            assert.strictEqual(cmd.parseResponse({ status: 1 }), 'airdrying');
            assert.strictEqual(cmd.parseResponse({ status: 2 }), 'idle');
        });
    });

    describe('GetDryingDuration', function () {
        it('should return the raw duration value', function () {
            const cmd = new GetDryingDuration();
            assert.strictEqual(cmd.parseResponse({ duration: 180 }), 180);
        });
    });

    describe('GetOta', function () {
        it('should map fields and convert boolean-integers correctly', function () {
            const cmd = new GetOta();
            const res = cmd.parseResponse({ supportAuto: 1, autoSwitch: 1, ver: '1.2.3', status: 'idle', progress: 50 });
            assert.deepStrictEqual(res, {
                supportAuto: true,
                autoSwitch: true,
                version: '1.2.3',
                status: 'idle',
                progress: 50
            });
        });
    });

    describe('GetSweepMode', function () {
        it('should map type:1 to true', function () {
            const cmd = new GetSweepMode();
            assert.strictEqual(cmd.parseResponse({ type: 1 }), true);
        });
    });

    describe('GetWorkMode', function () {
        it('should return the raw mode value', function () {
            const cmd = new GetWorkMode();
            assert.strictEqual(cmd.parseResponse({ mode: 1 }), 1);
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

        it('should return false when resolving by event with no match', function () {
            const registry = new PendingCommandRegistry();
            const found = registry.resolveByEvent('NonExistentEvent', {});
            assert.strictEqual(found, false);
            assert.strictEqual(registry.size, 0); // nothing registered, nothing changed
        });

        it('should return false when resolving by id with no match', function () {
            const registry = new PendingCommandRegistry();
            const found = registry.resolveById('unknown_id', {});
            assert.strictEqual(found, false);
        });

        it('should return false when rejecting by id with no match', function () {
            const registry = new PendingCommandRegistry();
            const found = registry.rejectById('unknown_id', new Error('noop'));
            assert.strictEqual(found, false);
        });

        it('should reject a command via reject callback when parseResponse throws', function () {
            const registry = new PendingCommandRegistry();
            let rejectedError = null;
            const throwingInstance = {
                parseResponse: () => { throw new Error('Parse error'); }
            };
            registry.register(
                'req_throw',
                'getBattery',
                'BatteryInfo',
                throwingInstance,
                () => { assert.fail('should not resolve'); },
                (err) => { rejectedError = err; }
            );
            registry.resolveByEvent('BatteryInfo', { value: 50 });
            assert.ok(rejectedError, 'Should have rejected');
            assert.ok(rejectedError.message.includes('Parse error'));
            assert.strictEqual(registry.size, 0);
        });

        it('should reject the command after the specified timeout elapses', async function () {
            const registry = new PendingCommandRegistry();
            let rejectedError = null;
            await new Promise((resolve) => {
                registry.register(
                    'req_timeout',
                    'getBattery',
                    'BatteryInfo',
                    null,
                    () => { assert.fail('should not resolve'); },
                    (err) => {
                        rejectedError = err;
                        resolve();
                    },
                    50 // 50 ms timeout for fast test
                );
            });
            assert.ok(rejectedError, 'Should have timed out');
            assert.ok(rejectedError.message.includes('timed out'), `Expected "timed out" in: ${rejectedError.message}`);
            assert.strictEqual(registry.size, 0);
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

        it('should pass user timeout options through runAsync', async function () {
            const VacBot = require('../library/vacBot');
            // Mock run() must return a Promise — runAsync() now guards non-Promise returns
            const result = await VacBot.prototype.runAsync.call({
                run: (command, ...args) => Promise.resolve({ command, args })
            }, 'GetBatteryState', { timeoutMs: 250 });

            assert.strictEqual(result.command, 'GetBatteryState');
            assert.strictEqual(result.args.length, 1);
            // The last argument must be the merged options object
            const opts = result.args[0];
            assert.strictEqual(typeof opts, 'object');
            assert.strictEqual(opts.timeoutMs, 250);
            assert.strictEqual(opts.returnPromise, true);
            // __isRunOptions is now a private Symbol and must NOT appear as an enumerable string key
            assert.strictEqual(Object.keys(opts).includes('__isRunOptions'), false);
        });

        it('should reject with a clear error for unknown commands via runAsync', async function () {
            const VacBot = require('../library/vacBot');
            const mockContext = {
                is950type_V2: () => false,
                ecovacs: { sendCommand: () => assert.fail('should not reach sendCommand') },
                dispatcher: { dispatch: () => assert.fail('should not reach dispatcher') }
            };
            // run() must be reachable as this.run() inside runAsync()
            mockContext.run = VacBot.prototype.run.bind(mockContext);
            try {
                await VacBot.prototype.runAsync.call(mockContext, 'NonExistentCommand');
                assert.fail('Should have rejected');
            } catch (e) {
                assert.ok(e.message.includes('Unknown command'), `Expected "Unknown command" in: ${e.message}`);
                assert.ok(e.message.includes('NonExistentCommand'));
            }
        });

        it('should reject with a clear error when minArgs are not met via runAsync', async function () {
            const VacBot = require('../library/vacBot');
            const COMMAND_REGISTRY = require('../library/commandRegistry');
            const cmdWithMinArgs = Object.keys(COMMAND_REGISTRY).find(
                k => COMMAND_REGISTRY[k].minArgs > 0 && !COMMAND_REGISTRY[k].specialLogic
            );
            if (!cmdWithMinArgs) {
                return; // No command with minArgs found — skip gracefully
            }
            const mockContext = {
                is950type_V2: () => false,
                ecovacs: { sendCommand: () => assert.fail('should not reach sendCommand') },
                dispatcher: { dispatch: () => assert.fail('should not reach dispatcher') }
            };
            // run() must be reachable as this.run() inside runAsync()
            mockContext.run = VacBot.prototype.run.bind(mockContext);
            try {
                await VacBot.prototype.runAsync.call(mockContext, cmdWithMinArgs);
                assert.fail('Should have rejected');
            } catch (e) {
                assert.ok(e.message.includes('requires at least'), `Expected "requires at least" in: ${e.message}`);
            }
        });

        it('should reject when run() returns a non-Promise (unsupported async command)', async function () {
            const VacBot = require('../library/vacBot');
            const mockContext = {
                // Simulate a run() that returns a non-Promise (e.g. dispatcher void return)
                run: () => undefined
            };
            try {
                await VacBot.prototype.runAsync.call(mockContext, 'SomeDispatcherCommand');
                assert.fail('Should have rejected');
            } catch (e) {
                assert.ok(e.message.includes('is not supported via runAsync'), `Expected "not supported" in: ${e.message}`);
            }
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

        it('should resolve case-insensitively for V2 commands on V2-capable devices', async function () {
            const VacBot = require('../library/vacBot');
            const mockContext = {
                is950type_V2: () => true,
                ecovacs: {
                    sendCommand: (commandInstance) => {
                        return commandInstance;
                    }
                }
            };
            mockContext.run = VacBot.prototype.run.bind(mockContext);

            const result = mockContext.run('getcleanstate');
            // resolveKey() always returns the canonical CamelCase key
            assert.strictEqual(result._registryKey, 'GetCleanState_V2');
        });

        it('should return a Promise when calling a specialLogic command via runAsync', async function () {
            const VacBot = require('../library/vacBot');
            const mockContext = {
                is950type_V2: () => false,
                isPlatformTypeAirbot: () => false,
                isPlatformTypeX2: () => false,
                ecovacs: {
                    sendCommand: (commandInstance, options) => {
                        return Promise.resolve({ commandInstance, options });
                    }
                },
                vacBotCommand: {
                    Pause: class Pause {
                        constructor(mode) {
                            this.mode = mode;
                        }
                    }
                }
            };
            const CommandDispatcher = require('../library/managers/commandDispatcher');
            mockContext.dispatcher = new CommandDispatcher(mockContext);
            mockContext.run = VacBot.prototype.run.bind(mockContext);

            const result = await VacBot.prototype.runAsync.call(mockContext, 'Pause');
            assert.strictEqual(result.commandInstance.constructor.name, 'Pause');
            assert.strictEqual(result.options.returnPromise, true);
        });

        it('should catch synchronous exceptions in run() and return a rejected Promise from runAsync', async function () {
            const VacBot = require('../library/vacBot');
            const mockContext = {
                run: () => {
                    throw new Error('Instantiation failed');
                }
            };
            try {
                await VacBot.prototype.runAsync.call(mockContext, 'GetBatteryState');
                assert.fail('Should have rejected');
            } catch (e) {
                assert.strictEqual(e.message, 'Instantiation failed');
            }
        });
    });
});
