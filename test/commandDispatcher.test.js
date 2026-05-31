'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const VacBotCommand = require('../library/command');

// Mock the missing Generic command class on VacBotCommand
VacBotCommand.Generic = class Generic extends VacBotCommand {
  constructor(action, params = {}) {
    super(action, typeof params === 'object' ? params : { value: params });
  }
};

const CommandDispatcher = require('../library/managers/commandDispatcher');

describe('CommandDispatcher', function () {
  let mockBot;
  let dispatcher;
  let sentCommands;
  let runCalls;

  beforeEach(() => {
    sentCommands = [];
    runCalls = [];

    mockBot = {
      deviceClass: 'yna5xi',
      genericCommand: null,
      createMapDataObject: false,
      createMapImage: false,
      createMapImageOnly: false,
      emitFullLifeSpanEvent: false,
      components: {},
      lastComponentValues: {},
      mapVirtualBoundariesResponses: {},
      
      isPlatformTypeAirbot: () => false,
      isPlatformTypeX2: () => false,
      isPlatformTypeT9Based: () => false,
      isPlatformTypeT8Based: () => false,
      isPlatformTypeT20: () => false,
      getCmdForObstacleDetection: () => 'ObstacleDetection',
      getPlatformType: () => 'deebot',
      isMapImageSupported: () => true,
      hasUnitCareInfo: () => true,
      hasRoundMopInfo: () => true,
      hasAirFreshenerInfo: () => true,
      
      ecovacs: {
        sendCommand: (cmd, options) => {
          sentCommands.push({ cmd, options });
          return Promise.resolve({ cmd, options });
        }
      },
      vacBotCommand: VacBotCommand,
      run: function (cmdName, ...args) {
        runCalls.push({ cmdName, args });
        return Promise.resolve({ cmdName, args });
      },
      callCleanResultsLogsApi: () => Promise.resolve({ logs: [] }),
      handleCleanLogs: () => {},
      emitCleanLogEvents: () => {}
    };

    dispatcher = new CommandDispatcher(mockBot);
  });

  describe('Basic Commands', function () {
    it('should dispatch generic command', async function () {
      const res = await dispatcher.dispatch('generic', { returnPromise: true }, 'action', 'params');
      assert.ok(res);
      assert.strictEqual(sentCommands.length, 1);
      assert.strictEqual(sentCommands[0].cmd.name, 'action');
      assert.strictEqual(mockBot.genericCommand, 'action');
    });

    it('should dispatch spotarea and customarea start', async function () {
      await dispatcher.dispatch('spotarea', null, 'start', '1', 2);
      assert.strictEqual(sentCommands.length, 1);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean');
      assert.strictEqual(sentCommands[0].cmd.args.content, '1');
      assert.strictEqual(sentCommands[0].cmd.args.count, 2);

      await dispatcher.dispatch('customarea', null, 'start', '2,3', 1);
      assert.strictEqual(sentCommands.length, 2);
      assert.strictEqual(sentCommands[1].cmd.name, 'clean');
      assert.strictEqual(sentCommands[1].cmd.args.content, '2,3');
    });

    it('should dispatch standard pause with clean act:pause', async function () {
      await dispatcher.dispatch('pause', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'pause');
    });

    it('should dispatch pause with a custom legacyMode command name', async function () {
      await dispatcher.dispatch('pause', null, 'legacyMode');
      assert.strictEqual(sentCommands[0].cmd.name, 'legacyMode');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'pause');
    });

    it('should dispatch pause using clean_V2 for Airbot platform', async function () {
      mockBot.isPlatformTypeAirbot = () => true;
      await dispatcher.dispatch('pause', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'pause');
    });

    it('should dispatch stop using clean act:stop for standard platform', async function () {
      await dispatcher.dispatch('stop', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'stop');
    });

    it('should dispatch stop using clean_V2 for X2 platform', async function () {
      mockBot.isPlatformTypeX2 = () => true;
      await dispatcher.dispatch('stop', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'stop');
    });

    it('should dispatch resume using clean act:resume for standard platform', async function () {
      await dispatcher.dispatch('resume', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'resume');
    });

    it('should dispatch resume using clean_V2 for X2 platform', async function () {
      mockBot.isPlatformTypeX2 = () => true;
      await dispatcher.dispatch('resume', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'resume');
    });

    it('should dispatch playsound', async function () {
      await dispatcher.dispatch('playsound', null, 3);
      assert.strictEqual(sentCommands[0].cmd.name, 'playSound');
      assert.strictEqual(sentCommands[0].cmd.args.sid, 3);
    });

    it('should dispatch resetlifespan', async function () {
      await dispatcher.dispatch('resetlifespan', null, 'filter');
      assert.strictEqual(sentCommands[0].cmd.name, 'resetLifeSpan');
      assert.strictEqual(sentCommands[0].cmd.args.type, 'heap');
    });

    it('should dispatch setwaterlevel and check bounds', async function () {
      await dispatcher.dispatch('setwaterlevel', null, 2, 1);
      assert.strictEqual(sentCommands[0].cmd.name, 'setWaterInfo');
      assert.strictEqual(sentCommands[0].cmd.args.amount, 2);

      // Out of bounds water level should not dispatch
      await dispatcher.dispatch('setwaterlevel', null, 5, 1);
      assert.strictEqual(sentCommands.length, 1);
    });

    it('should dispatch setcleanspeed and check bounds', async function () {
      await dispatcher.dispatch('setcleanspeed', null, 3);
      assert.strictEqual(sentCommands[0].cmd.name, 'setSpeed');
      assert.strictEqual(sentCommands[0].cmd.args.speed, 1); // maps from 3 to 1

      await dispatcher.dispatch('setcleanspeed', null, 6);
      assert.strictEqual(sentCommands.length, 1);
    });

    it('should dispatch move', async function () {
      await dispatcher.dispatch('move', null, 'forward');
      assert.strictEqual(sentCommands[0].cmd.name, 'move');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'forward');
    });
  });

  describe('Map Commands', function () {
    it('should dispatch getmapinfo and getmapimage', async function () {
      await dispatcher.dispatch('getmapinfo', null, '12345', 'outline', false);
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapInfo');
      assert.strictEqual(sentCommands[0].cmd.args.mid, '12345');
      assert.strictEqual(mockBot.createMapImageOnly, false);
    });

    it('should dispatch getmaps and handles yeedi model differences', async function () {
      await dispatcher.dispatch('getmaps', { returnPromise: true }, true, true);
      assert.strictEqual(sentCommands.length, 3);
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapState');
      assert.strictEqual(sentCommands[1].cmd.name, 'getMajorMap');
      assert.strictEqual(sentCommands[2].cmd.name, 'getCachedMapInfo');

      // Test yeedi model override
      sentCommands = [];
      mockBot.deviceClass = 'vthpeg';
      await dispatcher.dispatch('getmaps', { returnPromise: true }, true, true);
      assert.strictEqual(sentCommands[2].cmd.name, 'getMapInfo_V2');
    });

    it('should dispatch backupmap and restoremap with and without args', async function () {
      await dispatcher.dispatch('backupmap', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'setCachedMapInfo');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'backup');

      await dispatcher.dispatch('backupmap', null, 'mid123');
      assert.strictEqual(sentCommands[1].cmd.args.mid, 'mid123');

      await dispatcher.dispatch('restoremap', null);
      assert.strictEqual(sentCommands[2].cmd.args.act, 'restore');

      await dispatcher.dispatch('restoremap', null, 'mid123', 'backup456');
      assert.strictEqual(sentCommands[3].cmd.args.mid, 'mid123');
      assert.strictEqual(sentCommands[3].cmd.args.reMid, 'backup456');
    });

    it('should dispatch getspotareas', async function () {
      await dispatcher.dispatch('getspotareas', null, '12345');
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapSet');
    });

    it('should dispatch getmapinfo_v2', async function () {
      await dispatcher.dispatch('getmapinfo_v2', null, '123', 'outline');
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapInfo_V2');
    });

    it('should dispatch getmapset_v2', async function () {
      await dispatcher.dispatch('getmapset_v2', null, '123', 'params');
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapSet_V2');
    });

    it('should dispatch setmapset_v2', async function () {
      await dispatcher.dispatch('setmapset_v2', null, '123', { data: {} });
      assert.strictEqual(sentCommands[0].cmd.name, 'setMapSet_V2');
    });

    it('should dispatch getspotareainfo', async function () {
      await dispatcher.dispatch('getspotareainfo', null, '123', 'spotA');
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapSubSet');
    });

    it('should dispatch getvirtualboundaries', async function () {
      await dispatcher.dispatch('getvirtualboundaries', { returnPromise: true }, '123');
      assert.strictEqual(sentCommands.length, 2);
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapSet');
      assert.strictEqual(sentCommands[0].cmd.args.type, 'vw');
      assert.strictEqual(sentCommands[1].cmd.args.type, 'mw');
    });

    it('should dispatch getvirtualboundaryinfo', async function () {
      await dispatcher.dispatch('getvirtualboundaryinfo', null, '123', 'boundaryA', 'mw');
      assert.strictEqual(sentCommands[0].cmd.name, 'getMapSubSet');
      assert.strictEqual(sentCommands[0].cmd.args.type, 'mw');
    });

    it('should dispatch addvirtualboundary', async function () {
      await dispatcher.dispatch('addvirtualboundary', null, '123', 'coords', 'vw');
      assert.strictEqual(sentCommands[0].cmd.name, 'setMapSubSet');
    });

    it('should dispatch deletevirtualboundary', async function () {
      await dispatcher.dispatch('deletevirtualboundary', null, '123', '1', 'vw');
      assert.strictEqual(sentCommands[0].cmd.name, 'setMapSubSet');
    });
  });

  describe('Info & Settings Commands', function () {
    it('should dispatch getlifespan and handle sub-components', async function () {
      // Full lifespan request
      await dispatcher.dispatch('getlifespan', null);
      assert.ok(mockBot.emitFullLifeSpanEvent);
      assert.strictEqual(sentCommands[0].cmd.name, 'getLifeSpan');
      assert.ok(sentCommands[0].cmd.args.includes('heap'));

      // Airbot Z1 full lifespan
      sentCommands = [];
      mockBot.isPlatformTypeAirbot = () => true;
      await dispatcher.dispatch('getlifespan', null);
      assert.strictEqual(sentCommands[0].cmd.args.length, 0);

      // Specific component lifespan request
      await dispatcher.dispatch('getlifespan', null, 'filter');
      assert.strictEqual(mockBot.emitFullLifeSpanEvent, false);
    });

    it('should dispatch enable/disable DND', async function () {
      await dispatcher.dispatch('enabledonotdisturb', null, '22:00', '08:00');
      assert.strictEqual(runCalls[0].cmdName, 'SetDoNotDisturb');
      assert.deepStrictEqual(runCalls[0].args, [1, '22:00', '08:00', null]);

      await dispatcher.dispatch('disabledonotdisturb', null);
      assert.deepStrictEqual(runCalls[1].args, [0, null]);
    });

    it('should dispatch setblock and setdonotdisturb', async function () {
      await dispatcher.dispatch('setdonotdisturb', null, true, '22:00', '08:00');
      assert.strictEqual(sentCommands[0].cmd.name, 'setBlock');
      assert.strictEqual(sentCommands[0].cmd.args.enable, 1);
    });

    it('should dispatch getcleanlogs and handle platform T9 differences', async function () {
      await dispatcher.dispatch('getcleanlogs', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'GetCleanLogs');

      mockBot.isPlatformTypeT9Based = () => true;
      const res = await dispatcher.dispatch('getcleanlogs', { returnPromise: true });
      assert.ok(res);
    });

    it('should dispatch gettruedetect with Recognization/ObstacleDetection', async function () {
      await dispatcher.dispatch('gettruedetect', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'getTrueDetect');

      sentCommands = [];
      mockBot.getCmdForObstacleDetection = () => 'Recognization';
      await dispatcher.dispatch('gettruedetect', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'getRecognization');
    });

    it('should dispatch enable/disable/set AIVI/TrueDetect', async function () {
      mockBot.getCmdForObstacleDetection = () => 'Recognization';
      await dispatcher.dispatch('enableaivi', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'setRecognization');
      assert.strictEqual(sentCommands[0].cmd.args.state, 1);

      await dispatcher.dispatch('disableaivi', null);
      assert.strictEqual(sentCommands[1].cmd.args.state, 0);

      mockBot.getCmdForObstacleDetection = () => 'ObstacleDetection';
      await dispatcher.dispatch('setaivi', null, 1);
      assert.strictEqual(sentCommands[2].cmd.name, 'setTrueDetect');
      assert.strictEqual(sentCommands[2].cmd.args.enable, 1);
    });

    it('should dispatch emptydustbin with platform differences', async function () {
      await dispatcher.dispatch('emptydustbin', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'setAutoEmpty');

      mockBot.isPlatformTypeT20 = () => true;
      await dispatcher.dispatch('emptydustbin', null);
      assert.strictEqual(sentCommands[1].cmd.name, 'stationAction');
    });
  });

  describe('Advanced Cleaning & Drying Commands', function () {
    it('should dispatch clean_v2 with platform differences', async function () {
      await dispatcher.dispatch('clean_v2', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.deepStrictEqual(sentCommands[0].cmd.args.content, {
        count: 1,
        donotClean: '',
        type: 'auto'
      });

      mockBot.isPlatformTypeAirbot = () => true;
      await dispatcher.dispatch('clean_v2', null);
      assert.strictEqual(sentCommands[1].cmd.args.content.type, 'move');
    });

    it('should dispatch spotarea_v2 with platform differences', async function () {
      await dispatcher.dispatch('spotarea_v2', null, '1,2');
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.content.value, '1,2');

      mockBot.isPlatformTypeX2 = () => true;
      await dispatcher.dispatch('spotarea_v2', null, '1,2');
      assert.strictEqual(runCalls[0].cmdName, 'FreeClean');
    });

    it('should dispatch freeclean', async function () {
      await dispatcher.dispatch('freeclean', null, '1,1;1,2;');
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.content.type, 'freeClean');
      assert.strictEqual(sentCommands[0].cmd.args.content.value, '1,1;1,2;');
    });

    it('should dispatch customarea_v2', async function () {
      await dispatcher.dispatch('customarea_v2', null, '1,2,3,4', 2, 1);
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.content.value, '1,2,3,4');
    });

    it('should dispatch gotoposition with platform differences', async function () {
      mockBot.isPlatformTypeT9Based = () => true;
      await dispatcher.dispatch('gotoposition', null, '1,2');
      assert.strictEqual(runCalls[0].cmdName, 'MapPoint_V2');

      mockBot.isPlatformTypeT9Based = () => false;
      mockBot.isPlatformTypeT8Based = () => true;
      await dispatcher.dispatch('gotoposition', null, '1,2');
      assert.strictEqual(runCalls[1].cmdName, 'CustomArea_V2');
    });

    it('should dispatch mappoint_v2', async function () {
      await dispatcher.dispatch('mappoint_v2', null, '1,2');
      assert.strictEqual(sentCommands[0].cmd.name, 'clean_V2');
      assert.strictEqual(sentCommands[0].cmd.args.content.value, '1,2');
    });

    it('should dispatch setworkmode', async function () {
      await dispatcher.dispatch('setworkmode', null, 'mop');
      assert.strictEqual(sentCommands[0].cmd.name, 'setWorkMode');
      assert.strictEqual(sentCommands[0].cmd.args.mode, 2);
    });

    it('should dispatch setwashinterval', async function () {
      await dispatcher.dispatch('setwashinterval', null, 15);
      assert.strictEqual(sentCommands[0].cmd.name, 'setWashInterval');
      assert.strictEqual(sentCommands[0].cmd.args.interval, 15);
    });

    it('should dispatch setwashinfo', async function () {
      await dispatcher.dispatch('setwashinfo', null, 2);
      assert.strictEqual(sentCommands[0].cmd.name, 'setWashInfo');
      assert.strictEqual(sentCommands[0].cmd.args.mode, 2);
    });

    it('should dispatch getairdrying with platform differences', async function () {
      await dispatcher.dispatch('getairdrying', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'getStationState');

      mockBot.getPlatformType = () => 'yeedi';
      await dispatcher.dispatch('getairdrying', null);
      assert.strictEqual(sentCommands[1].cmd.name, 'getAirDring');
    });

    it('should dispatch setairdrying with platform differences', async function () {
      await dispatcher.dispatch('setairdrying', null, 1);
      assert.strictEqual(sentCommands[0].cmd.name, 'stationAction');

      mockBot.getPlatformType = () => 'yeedi';
      await dispatcher.dispatch('setairdrying', null, 'start');
      assert.strictEqual(sentCommands[1].cmd.name, 'setAirDring');
    });

    it('should dispatch airdryingstart as stationAction for non-yeedi platform', async function () {
      await dispatcher.dispatch('airdryingstart', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'stationAction');
      assert.strictEqual(sentCommands[0].cmd.args.act, 1);
    });

    it('should dispatch airdryingstop as stationAction for non-yeedi platform', async function () {
      await dispatcher.dispatch('airdryingstop', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'stationAction');
      assert.strictEqual(sentCommands[0].cmd.args.act, 4);
    });

    it('should dispatch airdryingstart as setAirDring for yeedi platform', async function () {
      mockBot.getPlatformType = () => 'yeedi';
      await dispatcher.dispatch('airdryingstart', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'setAirDring');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'start');
    });

    it('should dispatch airdryingstop as setAirDring for yeedi platform', async function () {
      mockBot.getPlatformType = () => 'yeedi';
      await dispatcher.dispatch('airdryingstop', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'setAirDring');
      assert.strictEqual(sentCommands[0].cmd.args.act, 'stop');
    });

    it('should dispatch drying', async function () {
      await dispatcher.dispatch('drying', null, 'start');
      assert.strictEqual(sentCommands[0].cmd.name, 'stationAction');
      assert.strictEqual(sentCommands[0].cmd.args.act, 1);

      await dispatcher.dispatch('drying', null, 4);
      assert.strictEqual(sentCommands[1].cmd.args.act, 4);
    });

    it('should dispatch getefficiency', async function () {
      await dispatcher.dispatch('getefficiency', null);
      assert.strictEqual(sentCommands[0].cmd.name, 'getEfficiency');
    });

    it('should return false for unrecognized commands', async function () {
      const res = await dispatcher.dispatch('unrecognized_command', null);
      assert.strictEqual(res, false);
    });
  });
});
