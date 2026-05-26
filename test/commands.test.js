'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');

const {
    CleanArea,
    CleanArea_V2,
    GetCleanInfoV2
} = require('../library/commands/clean');

const {
    GetCarpetAutoFanBoost,
    GetEfficiencyMode,
    GetMopAutoWashFrequency
} = require('../library/commands/info');

const {
    SetCarpetAutoFanBoost,
    SetMopAutoWashFrequency
} = require('../library/commands/settings');

describe('New Deebot Commands', function () {
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

    describe('GetCleanInfoV2', function () {
        it('should initialize with correct command name', function () {
            const cmd = new GetCleanInfoV2();
            assert.strictEqual(cmd.name, 'getCleanInfo_V2');
        });

        it('should parse trigger alert as error state', function () {
            const cmd = new GetCleanInfoV2();
            const res = cmd.parseResponse({ trigger: 'alert', state: 'clean' });
            assert.strictEqual(res.state, 'error');
        });

        it('should parse idle state correctly', function () {
            const cmd = new GetCleanInfoV2();
            const res = cmd.parseResponse({ trigger: 'none', state: 'idle' });
            assert.strictEqual(res.state, 'idle');
        });

        it('should parse goCharging state correctly', function () {
            const cmd = new GetCleanInfoV2();
            const res = cmd.parseResponse({ trigger: 'none', state: 'goCharging' });
            assert.strictEqual(res.state, 'returning');
        });

        it('should parse clean and working motionState as cleaning', function () {
            const cmd = new GetCleanInfoV2();
            const res = cmd.parseResponse({
                trigger: 'none',
                state: 'clean',
                cleanState: { motionState: 'working' }
            });
            assert.strictEqual(res.state, 'cleaning');
        });

        it('should parse washing and pause motionState as paused', function () {
            const cmd = new GetCleanInfoV2();
            const res = cmd.parseResponse({
                trigger: 'none',
                state: 'washing',
                cleanState: { motionState: 'pause' }
            });
            assert.strictEqual(res.state, 'paused');
        });

        it('should parse washing and goCharging motionState as returning', function () {
            const cmd = new GetCleanInfoV2();
            const res = cmd.parseResponse({
                trigger: 'none',
                state: 'washing',
                cleanState: { motionState: 'goCharging' }
            });
            assert.strictEqual(res.state, 'returning');
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

            const cmdOff = new SetCarpetAutoFanBoost(0);
            assert.strictEqual(cmdOff.name, 'setCarpertPressure');
            assert.strictEqual(cmdOff.args.enable, 0);
        });
    });

    describe('Efficiency Mode', function () {
        it('GetEfficiencyMode should initialize and parse response correctly', function () {
            const cmd = new GetEfficiencyMode();
            assert.strictEqual(cmd.name, 'getEfficiency');
            assert.strictEqual(cmd.parseResponse({ efficiency: 1 }), 1);
            assert.strictEqual(cmd.parseResponse({ efficiency: 0 }), 0);
        });
    });

    describe('Mop Auto Wash Frequency', function () {
        it('GetMopAutoWashFrequency should initialize and parse response correctly', function () {
            const cmd = new GetMopAutoWashFrequency();
            assert.strictEqual(cmd.name, 'getWashInfo');
            assert.strictEqual(cmd.parseResponse({ interval: 15 }), 15);
        });

        it('SetMopAutoWashFrequency should initialize and build payload correctly', function () {
            const cmd = new SetMopAutoWashFrequency(25);
            assert.strictEqual(cmd.name, 'setWashInfo');
            assert.strictEqual(cmd.args.interval, 25);

            const cmdDefault = new SetMopAutoWashFrequency();
            assert.strictEqual(cmdDefault.args.interval, 15);
        });
    });
});
