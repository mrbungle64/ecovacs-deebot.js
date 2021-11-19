const dictionary = require('./ecovacsConstants_non950type');
const vacBotCommand = require('./vacBotCommand_non950type');
const VacBot = require('./vacBot');
const errorCodes = require('./errorCodes');
const tools = require('./tools');
const mapTools = require('./mapTools');
const map = require('./mapTemplate');

class VacBot_non950type extends VacBot {
  constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
    super(user, hostname, resource, secret, vacuum, continent, country, server_address);

    this.dustcaseInfo = null;
    this.mapPiecePacketsCrcArray = null;
  }

  handle_lifespan(payload) {
    let type = null;
    if (payload.hasOwnProperty('type')) {
      // type attribute must be trimmed because of Deebot M88
      // { td: 'LifeSpan', type: 'DustCaseHeap ', ... }
      type = payload['type'].trim();
      type = dictionary.COMPONENT_FROM_ECOVACS[type];
    }

    if (!type) {
      tools.envLog("[VacBot] Unknown component type: ", payload);
      return;
    }

    let lifespan = null;
    if (payload.hasOwnProperty('val') && payload.hasOwnProperty('total')) {
      if (this.isN79series()) {
        // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/80
        // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/58
        lifespan = parseInt(payload['val']);
      } else {
        lifespan = parseInt(payload['val']) / parseInt(payload['total']) * 100;
      }
    } else if (payload.hasOwnProperty('val')) {
      lifespan = parseInt(payload['val']) / 100;
    } else if (payload.hasOwnProperty('left') && (payload.hasOwnProperty('total'))) {
      lifespan = parseInt(payload['left']) / parseInt(payload['total']) * 100; // This works e.g. for a Ozmo 930
    } else if (payload.hasOwnProperty('left')) {
      lifespan = parseInt(payload['left']) / 60; // This works e.g. for a Deebot 900/901
    }
    if (lifespan) {
      tools.envLog("[VacBot] lifeSpan %s: %s", type, lifespan);
      this.components[type] = Number(lifespan.toFixed(2));
    }
    tools.envLog("[VacBot] lifespan components: ", JSON.stringify(this.components));
  }

  handle_netInfo(payload) {
    if (payload.hasOwnProperty('wi')) {
      this.netInfoIP = payload['wi'];
      tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
    }
    if (payload.hasOwnProperty('s')) {
      this.netInfoWifiSSID = payload['s'];
      tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
    }
  }

  handle_cleanReport(payload) {
    if (payload.attrs) {
      let type = payload.attrs['type'];
      if (dictionary.CLEAN_MODE_FROM_ECOVACS[type]) {
        type = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
      }
      let action = '';
      if (payload.attrs.hasOwnProperty('st')) {
        action = dictionary.CLEAN_ACTION_FROM_ECOVACS[payload.attrs['st']];
      }
      else if (payload.attrs.hasOwnProperty('act')) {
        action = dictionary.CLEAN_ACTION_FROM_ECOVACS[payload.attrs['act']];
      }
      if (action === 'stop' || action === 'pause') {
        type = action
      }
      this.cleanReport = type;
      tools.envLog("[VacBot] *** cleanReport = " + this.cleanReport);

      if (payload.attrs.hasOwnProperty('last')) {
        tools.envLog("[VacBot] *** clean last = %s seconds" + payload.attrs["last"]);
      }

      if (payload.attrs.hasOwnProperty('p')) {
        let pValues = payload.attrs['p'];
        const pattern = /^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$/;
        if (pattern.test(pValues)) {
          const x1 = parseFloat(pValues.split(",")[0]).toFixed(1);
          const y1 = parseFloat(pValues.split(",")[1]).toFixed(1);
          const x2 = parseFloat(pValues.split(",")[2]).toFixed(1);
          const y2 = parseFloat(pValues.split(",")[3]).toFixed(1);
          this.lastUsedAreaValues = x1 + ',' + y1 + ',' + x2 + ',' + y2;
          tools.envLog("[VacBot] *** lastAreaValues = " + pValues);
        } else {
          tools.envLog("[VacBot] *** lastAreaValues invalid pValues = " + pValues);
        }
      }
    }
  }

  handle_cleanSpeed(payload) {
    if (payload.attrs.hasOwnProperty('speed')) {
      let speed = payload.attrs['speed'];
      if (dictionary.CLEAN_SPEED_FROM_ECOVACS[speed]) {
        speed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        this.cleanSpeed = speed;
        tools.envLog("[VacBot] cleanSpeed: ", speed);
      } else {
        tools.envLog("[VacBot] Unknown clean speed: ", speed);
      }
    } else {
      tools.envLog("[VacBot] couldn't parse clean speed ", payload);
    }
  }

  handle_batteryInfo(payload) {
    let value;
    if (payload.hasOwnProperty('ctl')) {
      value = payload['ctl']['battery']['power'];
    } else {
      value = parseFloat(payload.attrs['power']);
    }
    try {
      this.batteryInfo = value;
      tools.envLog("[VacBot] *** batteryInfo = %d\%", this.batteryInfo);
    } catch (e) {
      tools.envLog("[VacBot] couldn't parse battery info ", payload);
    }
  }

  handle_waterLevel(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('v')) {
      this.waterLevel = Number(payload.attrs['v']);
      tools.envLog("[VacBot] *** waterLevel = %s", this.waterLevel);
    }
  }

  handle_cachedMapInfo(payload) {
    tools.envLog("[VacBot] *** handle_cachedMapInfo " + JSON.stringify(payload));
    // Execute only if the GetMaps cmd was received
    if (!this.handleMapExecuted && payload.attrs && payload.attrs.hasOwnProperty('i')) {
      this.currentMapMID = payload.attrs['i'];
      const ecovacsMap = new map.EcovacsMap(this.currentMapMID, 0, this.currentMapName, 1);
      this.maps = {
        "maps": [ecovacsMap]
      };
      this.run('GetMapSet');
      this.mapSpotAreaInfos[this.currentMapMID] = [];
      this.mapVirtualBoundaryInfos[this.currentMapMID] = [];
      this.handleMapExecuted = true;
      if (this.createMapImage && tools.isCanvasModuleAvailable()) {
        this.handle_mapInfo(payload);
      }
      return this.maps;
    }
    return null;
  }

  handle_mapSet(payload) {
    tools.envLog("[VacBot] *** handle_mapSet " + JSON.stringify(payload));
    if (payload.attrs && payload.attrs.hasOwnProperty('tp')) {
      if (payload.attrs['tp'] === 'sa') {
        const mapSetID = payload.attrs['msid'];
        const mapSpotAreas = new map.EcovacsMapSpotAreas(this.currentMapMID, mapSetID);
        let spotAreas = [];
        for (let mapIndex in payload.children) {
          if (payload.children.hasOwnProperty(mapIndex)) {
            let mid = payload.children[mapIndex].attrs['mid'];
            if (!spotAreas[mid]) {
              mapSpotAreas.push(new map.EcovacsMapSpotArea(mid));
              this.run('PullM', 'sa', this.currentMapMID, mid);
              spotAreas[mid] = true;
            }
          }
        }
        tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
        return {
          mapsetEvent: 'MapSpotAreas',
          mapsetData: mapSpotAreas
        };
      } else if (payload.attrs['tp'] === 'vw') {
        const mapVirtualBoundaries = new map.EcovacsMapVirtualBoundaries(this.currentMapMID);
        let virtualBoundaries = [];
        for (let mapIndex in payload.children) {
          if (payload.children.hasOwnProperty(mapIndex)) {
            let mid = payload.children[mapIndex].attrs['mid'];
            if (!virtualBoundaries[mid]) {
              mapVirtualBoundaries.push(new map.EcovacsMapVirtualBoundary(mid, 'vw'));
              this.run('PullM', 'vw', this.currentMapMID, mid);
              virtualBoundaries[mid] = true;
            }
          }
        }
        tools.envLog("[VacBot] *** MapVirtualBoundaries = " + JSON.stringify(mapVirtualBoundaries));
        return {
          mapsetEvent: 'MapVirtualBoundaries',
          mapsetData: mapVirtualBoundaries
        };
      }
    }

    tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(payload.attrs['tp']));
    return {
      mapsetEvent: 'error'
    };
  }

  handle_mapSubset(payload) {
    tools.envLog("[VacBot] *** handle_mapSubset " + JSON.stringify(payload));
    if (payload.attrs && payload.attrs.hasOwnProperty('m')) {
      const value = payload.attrs['m'];
      let mid = '';
      let type = '';
      if (payload.attrs.hasOwnProperty('mid')) {
        // MQTT
        mid = payload.attrs['mid'];
        type = payload.attrs['tp'];
      } else {
        // XMPP
        const action = this.commandsSent[payload.attrs.id];
        if (action.args && action.args.mid && action.args.tp) {
          mid = action.args.mid;
          type = action.args.tp;
        }
      }
      if (mid && type) {
        if (type === 'sa') {
          let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(this.currentMapMID, mid, '', value);
          this.mapSpotAreaInfos[this.currentMapMID][mid] = mapSpotAreaInfo;
          tools.envLog("[VacBot] *** MapSpotAreaInfo = " + JSON.stringify(mapSpotAreaInfo));
          return {
            mapsubsetEvent: 'MapSpotAreaInfo',
            mapsubsetData: mapSpotAreaInfo
          };
        } else if (type === 'vw') {
          let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(this.currentMapMID, mid, 'vw', value);
          this.mapVirtualBoundaryInfos[this.currentMapMID][mid] = mapVirtualBoundaryInfo;
          tools.envLog("[VacBot] *** MapVirtualBoundaryInfo = " + JSON.stringify(mapVirtualBoundaryInfo));
          return {
            mapsubsetEvent: 'MapVirtualBoundaryInfo',
            mapsubsetData: mapVirtualBoundaryInfo
          };
        }
      } else {
        tools.envLog("[VacBot] *** handle_mapSubset Missing mid or type");
      }
    }
    return {
      mapsubsetEvent: 'error'
    };
  }

  handle_mapInfo(payload) {
    if (payload.attrs) {
      const mapID = payload.attrs.i;
      const type = 'ol'; // Only outline is supported for non 950 type models
      const columnGrid = payload.attrs.w;
      const columnPiece = payload.attrs.c;
      const rowGrid = payload.attrs.h;
      const rowPiece = payload.attrs.r;
      const pixelWidth = payload.attrs.p;
      const crc = payload.attrs.m;
      this.mapPiecePacketsCrcArray = crc.split(',');
      if (typeof this.mapImages[mapID] === 'undefined') {
        this.mapImages[mapID] = [];
      }
      if (typeof this.mapImages[mapID][type] === 'undefined') {
        this.mapImages[mapID][type] = new map.EcovacsLiveMapImage(mapID, type, columnGrid, rowGrid, columnPiece, rowPiece, pixelWidth, crc);
      }
      this.mapPiecePacketsSent = [];
      for (let c = 0; c < this.mapPiecePacketsCrcArray.length; c++) {
        if(this.mapPiecePacketsCrcArray[c] !== '1295764014') { //skip empty pieces
          this.run('PullMP', c);
        }
      }
    }
  }

  handle_mapPiecePacket(payload) {
    if (payload.attrs) {
      const mapID = payload.attrs.i;
      const type = 'ol'; // Only outline is supported for non 950 type models
      if (this.mapImages[mapID][type]) {
        tools.envLog('[Ecovacs] MapPiecePacket: %s', JSON.stringify(payload));
        let pid = this.mapPiecePacketsSent[payload.attrs.id];
        if (payload.attrs.pid) {
          pid = payload.attrs.pid;
        }
        const pieceValue = payload.attrs.p;
        this.mapImages[this.currentMapMID][type].updateMapPiece(pid, pieceValue);
        if (this.mapImages[this.currentMapMID][type].transferMapInfo) {
          let mapImage = this.mapImages[this.currentMapMID][type].getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
          tools.envLog('[Ecovacs] MapPiecePacket2: %s', JSON.stringify(mapImage));
          return mapImage;
        }
      }
    }
  }

  handle_deebotPosition(payload) {
    tools.envLog("[VacBot] *** deebotPosition payload: %s", JSON.stringify(payload));
    if (payload.attrs && payload.attrs.hasOwnProperty('p')) {
        const posX = payload.attrs['p'].split(",")[0];
        const posY = payload.attrs['p'].split(",")[1];
        const angle = payload.attrs['a'];
        let currentSpotAreaID = mapTools.isPositionInSpotArea([posX, posY], this.mapSpotAreaInfos[this.currentMapMID]);
        let distanceToChargingStation = null;
        if (this.chargePosition) {
          const pos = posX + ',' + posY;
          const chargePos = this.chargePosition.x + ',' + this.chargePosition.y;
          distanceToChargingStation = mapTools.getDistanceToChargingStation(pos, chargePos);
        }
        this.deebotPosition = {
          x: posX,
          y: posY,
          a: angle,
          isInvalid: false,
          currentSpotAreaID: currentSpotAreaID,
          changeFlag: true,
          distanceToChargingStation: distanceToChargingStation
        };
        tools.envLog("[VacBot] *** deebotPosition = %s", JSON.stringify(this.deebotPosition));
      }
  }

  handle_chargePosition(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('p') && payload.attrs.hasOwnProperty('a')) {
      this.chargePosition = {
        x: payload.attrs['p'].split(",")[0],
        y: payload.attrs['p'].split(",")[1],
        a: payload.attrs['a']
      };
      tools.envLog("[VacBot] *** chargePosition = %s", JSON.stringify(this.chargePosition));
    }
  }

  handle_dustcaseInfo(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('st')) {
      this.dustcaseInfo = payload.attrs['st'];
      tools.envLog("[VacBot] *** dustcaseInfo = " + this.dustcaseInfo);
    }
  }

  handle_waterboxInfo(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('on')) {
      this.waterboxInfo = payload.attrs['on'];
      tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
    }
  }

  handle_sleepStatus(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('st')) {
      this.sleepStatus = payload.attrs['st'];
      tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
    }
  }

  handle_chargeState(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('type')) {
      const chargeStatus = payload.attrs['type'];
      if (dictionary.CHARGE_MODE_FROM_ECOVACS[chargeStatus]) {
        this.chargeStatus = dictionary.CHARGE_MODE_FROM_ECOVACS[chargeStatus];
        tools.envLog("[VacBot] *** chargeStatus = " + this.chargeStatus);
      } else {
        tools.envLog("[VacBot] Unknown charging status '%s'", chargeStatus);
      }
    } else {
      tools.envLog("[VacBot] couldn't parse charge status ", payload);
    }
  }

  handle_cleanSum(payload) {
    if (payload.attrs && payload.attrs.hasOwnProperty('a') && payload.attrs.hasOwnProperty('l') && payload.attrs.hasOwnProperty('c')) {
      this.cleanSum_totalSquareMeters = parseInt(payload.attrs['a']);
      this.cleanSum_totalSeconds = parseInt(payload.attrs['l']);
      this.cleanSum_totalNumber = parseInt(payload.attrs['c']);
    }
  }

  handle_cleanLogs(payload) {
    if (payload.attrs) {
      const count = payload.children.length;
      for (let c = 0; c < count; c++) {
        let childElement = payload.children[c];
        if (childElement) {
          let timestamp;
          let id;
          let squareMeters;
          let lastTime;
          let type;
          let imageUrl;
          let stopReason;
          let trigger;
          if (childElement.attrs) {
            timestamp = parseInt(childElement.attrs['s']);
          } else {
            timestamp = parseInt(childElement['ts']);
          }
          if (childElement.attrs) {
            squareMeters = parseInt(childElement.attrs['a']);
            lastTime = parseInt(childElement.attrs['l']);
            if (dictionary.STOP_REASON[childElement.attrs['f']]) {
              stopReason = dictionary.STOP_REASON[childElement.attrs['f']];
            }
            if (dictionary.TRIGGER[childElement.attrs['t']]) {
              trigger = dictionary.TRIGGER[childElement.attrs['t']];
            }
          } else {
            id = childElement['id'];
            squareMeters = parseInt(childElement['area']);
            lastTime = parseInt(childElement['last']);
            type = childElement['type'];
            imageUrl = childElement['imageUrl'];
          }
          let date = new Date(timestamp * 1000);
          let totalTimeString = tools.getTimeString(lastTime);

          if (c === 0) {
            if (imageUrl) {
              this.cleanLog_lastImageUrl = imageUrl;
              tools.envLog("[VacBot] *** cleanLog_lastImageUrl = " + this.cleanLog_lastImageUrl);
            }
            this.cleanLog_lastTimestamp = timestamp;
            this.cleanLog_lastSquareMeters = squareMeters;
            this.cleanLog_lastTotalTimeString = totalTimeString;
            tools.envLog("[VacBot] *** cleanLog_lastTimestamp = " + this.cleanLog_lastTimestamp);
            tools.envLog("[VacBot] *** cleanLog_lastSquareMeters = " + this.cleanLog_lastSquareMeters);
            tools.envLog("[VacBot] *** cleanLog_lastTotalTimeString = " + this.cleanLog_lastTotalTimeString);
          }

          this.cleanLog[timestamp] = {
            'id': id,
            'timestamp': timestamp,
            'date': date,
            'lastTime': lastTime,
            'totalTime': lastTime,
            'totalTimeString': totalTimeString,
            'totalTimeFormatted': totalTimeString,
            'squareMeters': squareMeters,
            'imageUrl': imageUrl,
            'stopReason': stopReason,
            'type': type,
            'trigger': trigger
          };
        }
      }
    }
  }

  handle_onOff(payload) {
    tools.envLog("[VacBot] *** handleOnOff = " + JSON.stringify(payload));
    if (payload.attrs && payload.attrs.hasOwnProperty('on')) {
      let type = null;
      const action = this.commandsSent[payload.attrs.id];
      if (action.args && action.args.t) {
        type = dictionary.ON_OFF_FROM_ECOVACS[action.args.t];
      }
      if (type) {
        const on = payload.attrs.on;
        tools.envLog("[VacBot] *** " + type + " = " + on);
        switch (type) {
          case 'do_not_disturb':
            this.doNotDisturbEnabled = on;
            break;
          case 'continuous_cleaning':
            this.continuousCleaningEnabled = on;
            break;
          case 'silence_voice_report':
            this.voiceReportDisabled = on;
            break;
        }
      }
    }
  }

  handle_stats(payload) {
    if (payload.attrs) {
      const area = parseInt(payload.attrs.a);
      const seconds = parseInt(payload.attrs.l);
      const type = payload.attrs.type;
      this.currentStats = {
        'cleanedArea': area,
        'cleanedSeconds': seconds,
        'cleanType': type
      }
    }
  }

  handle_error(payload) {
    this.errorCode = '0';
    this.errorDescription = '';
    let attrs = ['new', 'code', 'errno', 'error', 'errs'];
    for (const attr of attrs) {
      if (payload.hasOwnProperty(attr) && (payload[attr] !== '')) {
        // 100 = "NoError: Robot is operational"
        this.errorCode = (payload[attr] === '100') ? '0' : payload[attr];
        if (errorCodes[this.errorCode]) {
          this.errorDescription = errorCodes[this.errorCode];
        } else {
          this.errorDescription = 'unknown errorCode: ' + this.errorCode;
        }
        return;
      }
    }
  }

  handle_getSched(payload) {
    this.schedule = [];
    for (let c = 0; c < payload.children.length; c++) {
      const resultData = payload.children[c];
      if ((resultData.name === 's') || (resultData.payload === 's')) {
        let cleanCtl = {
          'type': 'auto'
        };
        if (resultData.hasOwnProperty('children') && resultData.children[0] && resultData.children[0].hasOwnProperty('children')) {
          if (resultData.children[0].children[0] && resultData.children[0].children[0].hasOwnProperty('attrs')) {
            const attrs = resultData.children[0].children[0].attrs;
            Object.assign(cleanCtl, {
              'type': attrs.type
            });
            if (cleanCtl.type === 'SpotArea') {
              Object.assign(cleanCtl, {
                'spotAreas': attrs.mid
              });
            }
          }
        }
        const attrs = resultData.attrs;
        let hour;
        let minute;
        if (attrs.hasOwnProperty('t')) {
          // Deebot Slim 2
          hour = attrs.t.split(':')[0];
          minute = attrs.t.split(':')[1];
        } else {
          hour = attrs.h;
          minute = attrs.m;
        }
        const onlyOnce = Number(attrs.r) === 0;
        const weekdays = attrs.r.split('');
        const weekdaysObj = {
          'Mon': Boolean(Number(weekdays[1])),
          'Tue': Boolean(Number(weekdays[2])),
          'Wed': Boolean(Number(weekdays[3])),
          'Thu': Boolean(Number(weekdays[4])),
          'Fri': Boolean(Number(weekdays[5])),
          'Sat': Boolean(Number(weekdays[6])),
          'Sun': Boolean(Number(weekdays[0])),
        }
        let enabled = false;
        if (attrs.hasOwnProperty('o')) {
          enabled = Boolean(Number(attrs.o))
        }
        const object = {
          'sid': attrs.n,
          'cleanCtl': cleanCtl,
          'enabled': enabled,
          'onlyOnce': onlyOnce,
          'weekdays': weekdaysObj,
          'hour': hour,
          'minute': minute
        }
        this.schedule.push(object);
      }
    }
  }

  run(action, ...args) {
    super.run(action, ...args);
    switch (action.toLowerCase()) {
      case "GetMaps".toLowerCase(): {
        this.createMapDataObject = !!args[0] || false;
        this.createMapImage = this.createMapDataObject && this.isMapImageSupported();
        if (args.length >= 2) {
          this.createMapImage = !!args[1];
        }
        this.handleMapExecuted = false;
        this.sendCommand(new vacBotCommand.GetMapM());
        break;
      }
      case "GetMapSet".toLowerCase(): {
        this.sendCommand(new vacBotCommand.GetMapSet('sa'));
        this.sendCommand(new vacBotCommand.GetMapSet('vw'));
        break;
      }
      case "GetMapImage".toLowerCase(): {
        this.createMapDataObject = true;
        this.createMapImage = true;
        this.createMapImageOnly = true;
        this.handleMapExecuted = false;
        this.sendCommand(new vacBotCommand.GetMapM());
        break;
      }
      case "PullM".toLowerCase(): {
        const mapSetType = args[0];
        const mapSetId = args[1];
        const mapDetailId = args[2];
        if (args.length >= 3) {
          this.sendCommand(new vacBotCommand.PullM(mapSetType, mapSetId, mapDetailId));
        }
        break;
      }
      case "PullMP".toLowerCase(): {
        const pid = args[0];
        if (args.length >= 1) {
          this.sendCommand(new vacBotCommand.PullMP(pid));
        }
        break;
      }
      case "GetLifeSpan".toLowerCase(): {
        if (args.length >= 1) {
          this.emitFullLifeSpanEvent = false;
          this.sendCommand(new vacBotCommand.GetLifeSpan(args[0]));
        } else {
          this.emitFullLifeSpanEvent = true;
          this.components = {};
          this.lastComponentValues = {};
          this.sendCommand(new vacBotCommand.GetLifeSpan('filter'));
          if (this.hasMainBrush()) {
            this.sendCommand(new vacBotCommand.GetLifeSpan('main_brush'));
          }
          this.sendCommand(new vacBotCommand.GetLifeSpan('side_brush'));
        }
        break;
      }
      case "GetWaterLevel".toLowerCase():
        this.sendCommand(new vacBotCommand.GetWaterLevel());
        break;
      case "GetWaterBoxInfo".toLowerCase():
        this.sendCommand(new vacBotCommand.GetWaterBoxInfo());
        break;
      case "GetChargerPos".toLowerCase():
      case "GetChargerPosition".toLowerCase():
        this.sendCommand(new vacBotCommand.GetChargerPos());
        break;
      case "GetOnOff".toLowerCase(): {
        const type = args[0];
        if (type !== '') {
          this.sendCommand(new vacBotCommand.GetOnOff(type));
        }
        break;
      }
      case "SetOnOff".toLowerCase(): {
        const type = args[0];
        const on = Number(args[1]) || 0;
        if ((type !== '') && (on >= 0) && (on <= 1)) {
          this.sendCommand(new vacBotCommand.SetOnOff(type, on));
        }
        break;
      }
      case "EnableDoNotDisturb".toLowerCase():
        this.sendCommand(new vacBotCommand.EnableDoNotDisturb());
        break;
      case "GetCleanLogs".toLowerCase(): {
        if (this.useMqtt) {
          this.sendCommand(new vacBotCommand.GetLogApiCleanLogs());
        } else {
          if (this.isN79series()) {
            // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/67
            this.sendCommand(new vacBotCommand.GetLogs());
          } else {
            this.sendCommand(new vacBotCommand.GetCleanLogs());
          }
        }
        break;
      }
      case "RenameSpotArea".toLowerCase(): {
        // Tested with OZMO 930 - maybe only working with OZMO 930
        if (args.length >= 3) {
          this.sendCommand(new vacBotCommand.RenameSpotArea(args[0], args[1], args[2]));
        }
        break;
      }
      case "SetLifeSpan".toLowerCase(): {
        // Untested - maybe only working with N79 series
        if (args.length === 1) {
          this.sendCommand(new vacBotCommand.SetLifeSpan(args[0]));
        } else if (args.length === 2) {
          this.sendCommand(new vacBotCommand.SetLifeSpan(args[0], args[1]));
        }
        break;
      }
    }
  }
}

module.exports = VacBot_non950type;
