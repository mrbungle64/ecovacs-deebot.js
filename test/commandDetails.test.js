'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');

const cleanCmds = require('../library/commands/clean');
const infoCmds = require('../library/commands/info');
const settingsCmds = require('../library/commands/settings');
const mapCmds = require('../library/commands/map');
const movementCmds = require('../library/commands/movement');

describe('Command Constructors and Parsers Details', function () {
  describe('Clean Commands', function () {
    it('Clean constructor with explicit mode and action', function () {
      const cmd = new cleanCmds.Clean('auto', 'start', { extra: 1 });
      assert.strictEqual(cmd.name, 'clean');
      assert.strictEqual(cmd.args.act, 'start');
      assert.strictEqual(cmd.args.extra, 1);
    });

    it('Clean constructor uses "auto" mode and "start" action as defaults', function () {
      const cmd = new cleanCmds.Clean();
      assert.strictEqual(cmd.args.act, 'start');
      assert.strictEqual(cmd.args.router, 'plan');
    });

    it('Clean_V2 constructor', function () {
      const cmd = new cleanCmds.Clean_V2('auto', 'start', { content: { extra: 2 } });
      assert.strictEqual(cmd.name, 'clean_V2');
      assert.strictEqual(cmd.args.content.extra, 2);
    });

    it('CustomArea_V2 constructor', function () {
      const cmd = new cleanCmds.CustomArea_V2('area_val', 2, 1);
      assert.strictEqual(cmd.args.content.value, 'area_val');
      assert.strictEqual(cmd.args.content.count, 2);
      assert.strictEqual(cmd.args.content.donotClean, 1);
    });

    it('SpotArea_V2 constructor', function () {
      const cmd = new cleanCmds.SpotArea_V2('spot_val', 3);
      assert.strictEqual(cmd.args.content.value, 'spot_val');
      assert.strictEqual(cmd.args.content.count, 3);
    });

    it('FreeClean constructor', function () {
      const cmd = new cleanCmds.FreeClean('free_val');
      assert.strictEqual(cmd.args.content.value, 'free_val');
    });

    it('HostedCleanMode constructor', function () {
      const cmd = new cleanCmds.HostedCleanMode();
      assert.strictEqual(cmd.args.content.type, 'entrust');
    });

    it('MapPoint_V2 constructor', function () {
      const cmd = new cleanCmds.MapPoint_V2('point_val');
      assert.strictEqual(cmd.args.content.value, 'point_val');
    });

    it('GetCleanState_V2 parseResponse branches', function () {
      const cmd = new cleanCmds.GetCleanState_V2();
      
      // trigger = alert
      assert.strictEqual(cmd.parseResponse({ trigger: 'alert' }).state, 'error');
      
      // state = idle
      assert.strictEqual(cmd.parseResponse({ state: 'idle' }).state, 'idle');
      
      // state = goCharging
      assert.strictEqual(cmd.parseResponse({ state: 'goCharging' }).state, 'returning');
      
      // state = clean, motionState = working
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'working' } }).state, 'cleaning');
      
      // state = clean, motionState = pause
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'pause' } }).state, 'paused');
      
      // state = clean, motionState = goCharging
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'goCharging' } }).state, 'returning');
      
      // state = clean, motionState = other
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'some_motion' } }).state, 'some_motion');
      
      // state = other
      assert.strictEqual(cmd.parseResponse({ state: 'otherState' }).state, 'otherState');
      
      // state = empty/unknown
      assert.strictEqual(cmd.parseResponse({}).state, 'unknown');
    });

    it('GetCleanSpeed parseResponse', function () {
      const cmd = new cleanCmds.GetCleanSpeed();
      assert.strictEqual(cmd.parseResponse({ speed: 3 }), 3);
    });

    it('GetCustomAreaMode parseResponse', function () {
      const cmd = new cleanCmds.GetCustomAreaMode();
      assert.strictEqual(cmd.parseResponse({ sweepMode: 1 }), 1);
      assert.strictEqual(cmd.parseResponse({}), null);
    });

    it('GetContinuousCleaning parseResponse', function () {
      const cmd = new cleanCmds.GetContinuousCleaning();
      assert.strictEqual(cmd.parseResponse({ enable: 1 }), true);
      assert.strictEqual(cmd.parseResponse({ enable: 0 }), false);
    });

    it('GetCleanCount parseResponse', function () {
      const cmd = new cleanCmds.GetCleanCount();
      assert.strictEqual(cmd.parseResponse({ count: 2 }), 2);
    });

    it('GetCleanPreference parseResponse', function () {
      const cmd = new cleanCmds.GetCleanPreference();
      assert.strictEqual(cmd.parseResponse({ enable: 1 }), true);
    });

    it('GetAICleanItemState parseResponse', function () {
      const cmd = new cleanCmds.GetAICleanItemState();
      assert.strictEqual(cmd.parseResponse({}), null);
      
      const payload = {
        items: [
          { state: 1 },
          { state: 0 },
          { state: 1 }
        ]
      };
      const res = cmd.parseResponse(payload);
      assert.strictEqual(res.particleRemoval, true);
      assert.strictEqual(res.petPoopPrevention, true);
    });

    it('Washing constructor', function () {
      const cmd = new cleanCmds.Washing('start');
      assert.strictEqual(cmd.args.content.type, 'washing');
      assert.strictEqual(cmd.args.act, 'start');
    });

    it('SinglePoint_V2 constructor', function () {
      const cmd = new cleanCmds.SinglePoint_V2('coords');
      assert.strictEqual(cmd.args.content.value, 'coords');
    });

    it('GetAutonomousClean parseResponse', function () {
      const cmd = new cleanCmds.GetAutonomousClean();
      assert.strictEqual(cmd.parseResponse({ on: 1 }), true);
    });

    it('Edge constructor sets type to "edge"', function () {
      const edge = new cleanCmds.Edge();
      assert.strictEqual(edge.args.type, 'edge');
    });

    it('Spot constructor sets type to "spot" and default content', function () {
      const spot = new cleanCmds.Spot();
      assert.strictEqual(spot.args.type, 'spot');
      assert.strictEqual(spot.args.content, '0,0');
    });

    it('GetCleanInfoV2 parseResponse branches', function () {
      const cmd = new cleanCmds.GetCleanInfoV2();
      assert.strictEqual(cmd.parseResponse({ trigger: 'alert' }).state, 'error');
      assert.strictEqual(cmd.parseResponse({ state: 'idle' }).state, 'idle');
      assert.strictEqual(cmd.parseResponse({ state: 'goCharging' }).state, 'returning');
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'working' } }).state, 'cleaning');
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'pause' } }).state, 'paused');
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'goCharging' } }).state, 'returning');
      assert.strictEqual(cmd.parseResponse({ state: 'clean', cleanState: { motionState: 'foo' } }).state, 'foo');
      assert.strictEqual(cmd.parseResponse({ state: 'bar' }).state, 'bar');
    });

    it('BasicPurification and MobilePurification constructors', function () {
      const basic = new cleanCmds.BasicPurification();
      assert.strictEqual(basic.args.content.type, 'spot');
      
      const mobile = new cleanCmds.MobilePurification();
      assert.strictEqual(mobile.args.content.type, 'move');
    });
  });

  describe('Info Commands', function () {
    it('GetError parseResponse branches', function () {
      const cmd = new infoCmds.GetError();
      
      // array code length > 0
      const res1 = cmd.parseResponse({ code: [100, 101] });
      assert.strictEqual(res1.code, 101);
      
      // array code length = 0
      const res2 = cmd.parseResponse({ code: [] });
      assert.strictEqual(res2.code, 0);
      
      // unknown errorCode
      const res3 = cmd.parseResponse({ code: 99999 });
      assert.strictEqual(res3.description, 'unknown errorCode: 99999');
      
      // code = 1 and error msg
      const res4 = cmd.parseResponse({ code: 1, error: 'Custom details' });
      assert.ok(res4.description.includes('Custom details'));
    });

    it('GetTrueDetect parseResponse', function () {
      const cmd = new infoCmds.GetTrueDetect();
      assert.strictEqual(cmd.parseResponse({ enable: 1 }), true);
      assert.strictEqual(cmd.parseResponse({ enable: 0 }), false);
    });

    it('GetStationState parseResponse', function () {
      const cmd = new infoCmds.GetStationState();
      const res = cmd.parseResponse({ content: { type: 2 }, state: 1 });
      assert.deepStrictEqual(res, {
        type: 2,
        state: 1,
        isAirDrying: true,
        isSelfCleaning: false,
        isActive: true
      });
    });

    it('GetStationInfo parseResponse', function () {
      const cmd = new infoCmds.GetStationInfo();
      const payload = { state: 1, name: 'st', model: 'md', sn: 'sn123', wkVer: 'v1' };
      const res = cmd.parseResponse(payload);
      assert.deepStrictEqual(res, payload);
    });

    it('GetDryingDuration parseResponse', function () {
      const cmd = new infoCmds.GetDryingDuration();
      assert.strictEqual(cmd.parseResponse({ duration: 120 }), 120);
    });

    it('GetOta parseResponse', function () {
      const cmd = new infoCmds.GetOta();
      const payload = { supportAuto: 1, autoSwitch: 1, ver: '1.2.3', status: 'updated', progress: 100 };
      const res = cmd.parseResponse(payload);
      assert.deepStrictEqual(res, {
        supportAuto: true,
        autoSwitch: true,
        version: '1.2.3',
        status: 'updated',
        progress: 100
      });
    });

    it('GetSweepMode parseResponse', function () {
      const cmd = new infoCmds.GetSweepMode();
      assert.strictEqual(cmd.parseResponse({ type: 1 }), true);
    });

    it('GetWorkMode parseResponse', function () {
      const cmd = new infoCmds.GetWorkMode();
      assert.strictEqual(cmd.parseResponse({ mode: 1 }), 1);
    });

    it('GetCleanLogs parseResponse', function () {
      const cmd = new infoCmds.GetCleanLogs();
      const payload = {
        logs: [
          { area: 10, ts: 1717142400, last: 60, id: '1', type: 'auto', stopReason: 'normal', imageUrl: 'url' }
        ]
      };
      const res = cmd.parseResponse(payload);
      assert.strictEqual(res[0].squareMeters, 10);
      assert.strictEqual(res[0].timestamp, 1717142400);
      assert.strictEqual(res[0].totalTime, 60);
      assert.strictEqual(res[0].id, '1');
      
      // missing logs
      assert.deepStrictEqual(cmd.parseResponse({}), []);
    });

    it('GetCarpetInfo parseResponse', function () {
      const cmd = new infoCmds.GetCarpetInfo();
      assert.strictEqual(cmd.parseResponse({ mode: 2 }), 2);
    });

    it('GetWashInterval parseResponse', function () {
      const cmd = new infoCmds.GetWashInterval();
      assert.strictEqual(cmd.parseResponse({ interval: 15 }), 15);
    });

    it('GetWashInfo parseResponse', function () {
      const cmd = new infoCmds.GetWashInfo();
      assert.strictEqual(cmd.parseResponse({ mode: 2 }), 2);
    });

    it('GetCarpetAutoFanBoost parseResponse', function () {
      const cmd = new infoCmds.GetCarpetAutoFanBoost();
      assert.strictEqual(cmd.parseResponse({ enable: 1 }), true);
    });

    it('GetEfficiencyMode parseResponse', function () {
      const cmd = new infoCmds.GetEfficiencyMode();
      assert.strictEqual(cmd.parseResponse({ efficiency: 1 }), 1);
    });

    it('GetMopAutoWashFrequency parseResponse', function () {
      const cmd = new infoCmds.GetMopAutoWashFrequency();
      assert.strictEqual(cmd.parseResponse({ interval: 15 }), 15);
    });

    it('GetFanSpeed parseResponse', function () {
      const cmd = new infoCmds.GetFanSpeed();
      assert.strictEqual(cmd.parseResponse({ speed: 2 }), 2);
    });
  });

  describe('Settings Commands', function () {
    it('SetFanSpeed boundaries', function () {
      // Below range → clamp to 4 (smart)
      const cmd0 = new settingsCmds.SetFanSpeed(0);
      assert.strictEqual(cmd0.args.speed, 4);

      // Above range → clamp to 4 (smart)
      const cmd5 = new settingsCmds.SetFanSpeed(5);
      assert.strictEqual(cmd5.args.speed, 4);

      // Valid middle value
      const cmd2 = new settingsCmds.SetFanSpeed(2);
      assert.strictEqual(cmd2.args.speed, 2);
    });

    it('SetFanSpeed should accept 1 as the valid minimum ("quiet" mode)', function () {
      const cmd = new settingsCmds.SetFanSpeed(1);
      assert.strictEqual(cmd.args.speed, 1);
    });

    it('SetFanSpeed should accept 4 as the valid maximum ("smart" mode)', function () {
      const cmd = new settingsCmds.SetFanSpeed(4);
      assert.strictEqual(cmd.args.speed, 4);
    });

    it('SetWaterLevel constructor with level only', function () {
      const cmd = new settingsCmds.SetWaterLevel(2);
      assert.strictEqual(cmd.args.amount, 2);
      assert.strictEqual(cmd.args.sweepType, undefined, 'sweepType should not be set when not provided');
    });

    it('SetWaterLevel constructor with valid sweepType sets sweepType in payload', function () {
      const cmd = new settingsCmds.SetWaterLevel(2, 1);
      assert.strictEqual(cmd.args.amount, 2);
      assert.strictEqual(cmd.args.sweepType, 1);
    });

    it('SetWaterLevel constructor with invalid sweepType ignores it', function () {
      const cmd = new settingsCmds.SetWaterLevel(2, 9);
      assert.strictEqual(cmd.args.amount, 2);
      assert.strictEqual(cmd.args.sweepType, undefined, 'Invalid sweepType should be ignored');
    });

    it('SetVolume constructor uses 1 as the default volume', function () {
      const cmd = new settingsCmds.SetVolume();
      assert.strictEqual(cmd.args.volume, 1);
    });

    it('SetVolume constructor stores the provided volume value', function () {
      const cmd = new settingsCmds.SetVolume(7);
      assert.strictEqual(cmd.args.volume, 7);
    });

    it('SetAutoEmpty constructor default', function () {
      const cmd = new settingsCmds.SetAutoEmpty();
      assert.strictEqual(cmd.args.enable, 0);
    });

    it('SetCarpetInfo constructor', function () {
      const cmd = new settingsCmds.SetCarpetInfo(1);
      assert.strictEqual(cmd.args.mode, 1);
    });

    it('SetVoice constructor', function () {
      const cmd = new settingsCmds.SetVoice(1, 'md5', 100, 'type', 'url', 'vid');
      assert.strictEqual(cmd.args.enable, 1);
      assert.strictEqual(cmd.args.md5, 'md5');
      assert.strictEqual(cmd.args.size, '100');
      assert.strictEqual(cmd.args.type, 'type');
      assert.strictEqual(cmd.args.url, 'url');
      assert.strictEqual(cmd.args.vid, 'vid');
    });

    it('SetAirbotAutoModel constructor', function () {
      const cmd = new settingsCmds.SetAirbotAutoModel(1, 2, 3);
      assert.strictEqual(cmd.args.enable, 1);
      assert.strictEqual(cmd.args.aq.aqEnd, 2);
      assert.strictEqual(cmd.args.aq.aqStart, 3);
    });

    it('SetCarpetAutoFanBoost constructor with truthy enable', function () {
      const cmd = new settingsCmds.SetCarpetAutoFanBoost(true);
      assert.strictEqual(cmd.args.enable, 1);
    });

    it('SetCarpetAutoFanBoost constructor with falsy enable maps to 0', function () {
      const cmdFalse = new settingsCmds.SetCarpetAutoFanBoost(false);
      assert.strictEqual(cmdFalse.args.enable, 0);

      const cmdZero = new settingsCmds.SetCarpetAutoFanBoost(0);
      assert.strictEqual(cmdZero.args.enable, 0);
    });

    it('SetMopAutoWashFrequency constructor', function () {
      const cmd = new settingsCmds.SetMopAutoWashFrequency(15);
      assert.strictEqual(cmd.args.interval, 15);
    });

    it('SetWashInterval constructor', function () {
      const cmd = new settingsCmds.SetWashInterval(10);
      assert.strictEqual(cmd.args.interval, 10);
    });

    it('SetWashInfo constructor', function () {
      const cmd = new settingsCmds.SetWashInfo(2);
      assert.strictEqual(cmd.args.mode, 2);
    });

    it('SetAirDrying constructor', function () {
      const cmd = new settingsCmds.SetAirDrying('start');
      assert.strictEqual(cmd.args.act, 'start');
    });

    it('SetDryingDuration constructor', function () {
      const cmd = new settingsCmds.SetDryingDuration(180);
      assert.strictEqual(cmd.args.duration, 180);
    });

    it('SetWaterInfo constructor', function () {
      const cmd = new settingsCmds.SetWaterInfo(1, 2, 3);
      assert.strictEqual(cmd.args.amount, 1);
      assert.strictEqual(cmd.args.customAmount, 2);
      assert.strictEqual(cmd.args.sweepType, 3);
    });

    it('StationAction constructor', function () {
      const cmd = new settingsCmds.StationAction(1, 2);
      assert.strictEqual(cmd.args.act, 2);
      assert.strictEqual(cmd.args.type, 1);
    });
  });

  describe('Map Commands', function () {
    it('GetMinorMap constructor defaults', function () {
      const cmd = new mapCmds.GetMinorMap('mid123', 0);
      assert.strictEqual(cmd.args.type, 'ol');
    });

    it('GetMapTrace constructor defaults', function () {
      const cmd = new mapCmds.GetMapTrace();
      assert.strictEqual(cmd.args.traceStart, 0);
      assert.strictEqual(cmd.args.pointCount, 400);
    });

    it('GetMapInfo constructor default type', function () {
      const cmd = new mapCmds.GetMapInfo('mid123');
      assert.strictEqual(cmd.args.type, 'ol');
    });

    it('GetMapInfo_V2 constructor default type', function () {
      const cmd = new mapCmds.GetMapInfo_V2('mid123');
      assert.strictEqual(cmd.args.type, '0');
    });

    it('GetMapInfo_V2_Yeedi constructor default type', function () {
      const cmd = new mapCmds.GetMapInfo_V2_Yeedi();
      assert.strictEqual(cmd.args.type, '0');
    });

    it('GetMapVirtualBoundaries constructor default type', function () {
      const cmd = new mapCmds.GetMapVirtualBoundaries('mid123');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('GetMapVirtualBoundaries_V2 constructor default type', function () {
      const cmd = new mapCmds.GetMapVirtualBoundaries_V2('mid123');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('GetMapSubSet constructor defaults', function () {
      const cmd = new mapCmds.GetMapSubSet('mid123', 'sub123');
      assert.strictEqual(cmd.args.type, 'ar');
      assert.strictEqual(cmd.args.msid, null);
    });

    it('DeleteMapSubSet constructor default type', function () {
      const cmd = new mapCmds.DeleteMapSubSet('mid123', 'sub123');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('AddMapSubSet constructor default type', function () {
      const cmd = new mapCmds.AddMapSubSet('mid123', 'coords');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('GetMapVirtualBoundaryInfo constructor default type', function () {
      const cmd = new mapCmds.GetMapVirtualBoundaryInfo('mid123', 'sub123');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('DeleteMapVirtualBoundary constructor default type', function () {
      const cmd = new mapCmds.DeleteMapVirtualBoundary('mid123', 'sub123');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('AddMapVirtualBoundary constructor default type', function () {
      const cmd = new mapCmds.AddMapVirtualBoundary('mid123', 'coords');
      assert.strictEqual(cmd.args.type, 'vw');
    });

    it('GetMapTrace_V2 constructor default type', function () {
      const cmd = new mapCmds.GetMapTrace_V2();
      assert.strictEqual(cmd.args.type, 0);
    });
  });

  describe('Movement Commands', function () {
    it('Charge constructor', function () {
      const cmd = new movementCmds.Charge();
      assert.strictEqual(cmd.args.act, 'go');
    });

    it('Move constructor defaults', function () {
      const cmd = new movementCmds.Move('forward');
      assert.strictEqual(cmd.args.act, 'forward');
    });

    it('MoveBackward constructor', function () {
      const cmd = new movementCmds.MoveBackward();
      assert.strictEqual(cmd.args.act, 'backward');
    });

    it('MoveForward constructor', function () {
      const cmd = new movementCmds.MoveForward();
      assert.strictEqual(cmd.args.act, 'forward');
    });

    it('GetChargeState parseResponse - isCharging:1 defaults chargeMode to "slot"', function () {
      const cmd = new movementCmds.GetChargeState();
      const res = cmd.parseResponse({ isCharging: 1 });
      assert.strictEqual(res.chargeStatus, 'charging');
      assert.strictEqual(res.chargeMode, 'slot');
    });

    it('GetChargeState parseResponse - isCharging:0 with custom mode', function () {
      const cmd = new movementCmds.GetChargeState();
      const res = cmd.parseResponse({ isCharging: 0, mode: 'custom' });
      assert.strictEqual(res.chargeStatus, 'idle');
      assert.strictEqual(res.chargeMode, 'custom');
    });

    it('GetChargeState parseResponse - missing mode key defaults to "slot"', function () {
      const cmd = new movementCmds.GetChargeState();
      // No "mode" key in payload → should default to 'slot'
      const res = cmd.parseResponse({ isCharging: 0 });
      assert.strictEqual(res.chargeStatus, 'idle');
      assert.strictEqual(res.chargeMode, 'slot');
    });
  });
});
