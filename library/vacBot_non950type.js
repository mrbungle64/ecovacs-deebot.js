const dictionary = require('./ecovacsConstants_non950type');
const vacBotCommand = require('./vacBotCommand_non950type');
const VacBot = require('./vacBot');
const errorCodes = require('./errorCodes');
const tools = require('./tools');
const map = require('./mapTemplate');

class VacBot_non950type extends VacBot {
  constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
    super(user, hostname, resource, secret, vacuum, continent, country, server_address);

    this.dustcaseInfo = null;
    this.mapPiecePacketsCrcArray = null;
  }

  handle_lifespan(event) {
    let type = null;
    if (event.hasOwnProperty('type')) {
      // type attribute must be trimmed because of Deebot M88
      // { td: 'LifeSpan', type: 'DustCaseHeap ', ... }
      type = event['type'].trim();
      type = dictionary.COMPONENT_FROM_ECOVACS[type];
    }

    if (!type) {
      tools.envLog("[VacBot] Unknown component type: ", event);
      return;
    }

    let lifespan = null;
    if (event.hasOwnProperty('val') && event.hasOwnProperty('total')) {
      if (this.isN79series()) {
        // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/80
        // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/58
        lifespan = parseInt(event['val']);
      } else {
        lifespan = parseInt(event['val']) / parseInt(event['total']) * 100;
      }
    } else if (event.hasOwnProperty('val')) {
      lifespan = parseInt(event['val']) / 100;
    } else if (event.hasOwnProperty('left') && (event.hasOwnProperty('total'))) {
      lifespan = parseInt(event['left']) / parseInt(event['total']) * 100; // This works e.g. for a Ozmo 930
    } else if (event.hasOwnProperty('left')) {
      lifespan = parseInt(event['left']) / 60; // This works e.g. for a Deebot 900/901
    }
    if (lifespan) {
      tools.envLog("[VacBot] lifeSpan %s: %s", type, lifespan);
      this.components[type] = Number(lifespan.toFixed(2));
    }
    tools.envLog("[VacBot] lifespan components: ", JSON.stringify(this.components));
  }

  handle_netInfo(event) {
    if (event.hasOwnProperty('wi')) {
      this.netInfoIP = event['wi'];
      tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
    }
    if (event.hasOwnProperty('s')) {
      this.netInfoWifiSSID = event['s'];
      tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
    }
  }

  handle_cleanReport(event) {
    if (event.attrs) {
      let type = event.attrs['type'];
      if (dictionary.CLEAN_MODE_FROM_ECOVACS[type]) {
        type = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
      }
      let action = '';
      if (event.attrs.hasOwnProperty('st')) {
        action = dictionary.CLEAN_ACTION_FROM_ECOVACS[event.attrs['st']];
      }
      else if (event.attrs.hasOwnProperty('act')) {
        action = dictionary.CLEAN_ACTION_FROM_ECOVACS[event.attrs['act']];
      }
      if (action === 'stop' || action === 'pause') {
        type = action
      }
      this.cleanReport = type;
      tools.envLog("[VacBot] *** cleanReport = " + this.cleanReport);

      if (event.attrs.hasOwnProperty('last')) {
        tools.envLog("[VacBot] *** clean last = %s seconds" + event.attrs["last"]);
      }

      if (event.attrs.hasOwnProperty('p')) {
        let pValues = event.attrs['p'];
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

  handle_cleanSpeed(event) {
    if (event.attrs.hasOwnProperty('speed')) {
      let speed = event.attrs['speed'];
      if (dictionary.CLEAN_SPEED_FROM_ECOVACS[speed]) {
        speed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        this.cleanSpeed = speed;
        tools.envLog("[VacBot] cleanSpeed: ", speed);
      } else {
        tools.envLog("[VacBot] Unknown clean speed: ", speed);
      }
    } else {
      tools.envLog("[VacBot] couldn't parse clean speed ", event);
    }
  }

  handle_batteryInfo(event) {
    let value;
    if (event.hasOwnProperty('ctl')) {
      value = event['ctl']['battery']['power'];
    } else {
      value = parseFloat(event.attrs['power']);
    }
    try {
      this.batteryInfo = value;
      tools.envLog("[VacBot] *** batteryInfo = %d\%", this.batteryInfo);
    } catch (e) {
      tools.envLog("[VacBot] couldn't parse battery info ", event);
    }
  }

  handle_waterLevel(event) {
    if (event.attrs && event.attrs.hasOwnProperty('v')) {
      this.waterLevel = Number(event.attrs['v']);
      tools.envLog("[VacBot] *** waterLevel = %s", this.waterLevel);
    }
  }

  handle_cachedMapInfo(event) {
    tools.envLog("[VacBot] *** handle_cachedMapInfo " + JSON.stringify(event));
    // Execute only if the GetMaps cmd was received
    if (!this.handleMapExecuted && event.attrs && event.attrs.hasOwnProperty('i')) {
      this.currentMapMID = event.attrs['i'];
      const ecovacsMap = new map.EcovacsMap(this.currentMapMID, 0, this.currentMapName, 1);
      this.maps = {
        "maps": [ecovacsMap]
      };
      this.run('GetMapSet');
      this.mapSpotAreaInfos[this.currentMapMID] = [];
      this.mapVirtualBoundaryInfos[this.currentMapMID] = [];
      this.handleMapExecuted = true;
      if (this.isMapImageSupported() && tools.isCanvasModuleAvailable()) {
        this.handle_mapInfo(event);
      }
      return this.maps;
    }
    return null;
  }

  handle_mapSet(event) {
    tools.envLog("[VacBot] *** handle_mapSet " + JSON.stringify(event));
    if (event.attrs && event.attrs.hasOwnProperty('tp')) {
      if (event.attrs['tp'] === 'sa') {
        const mapSetID = event.attrs['msid'];
        const mapSpotAreas = new map.EcovacsMapSpotAreas(this.currentMapMID, mapSetID);
        let spotAreas = [];
        for (let mapIndex in event.children) {
          if (event.children.hasOwnProperty(mapIndex)) {
            let mid = event.children[mapIndex].attrs['mid'];
            if (!spotAreas[mid]) {
              mapSpotAreas.push(new map.EcovacsMapSpotArea(mid));
              this.run('PullM', parseInt(mid), 'sa', this.currentMapMID, mid);
              spotAreas[mid] = true;
            }
          }
        }
        tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
        return {
          mapsetEvent: 'MapSpotAreas',
          mapsetData: mapSpotAreas
        };
      } else if (event.attrs['tp'] === 'vw') {
        const mapVirtualBoundaries = new map.EcovacsMapVirtualBoundaries(this.currentMapMID);
        let virtualBoundaries = [];
        for (let mapIndex in event.children) {
          if (event.children.hasOwnProperty(mapIndex)) {
            let mid = event.children[mapIndex].attrs['mid'];
            if (!virtualBoundaries[mid]) {
              mapVirtualBoundaries.push(new map.EcovacsMapVirtualBoundary(mid, 'vw'));
              this.run('PullM', parseInt(mid), 'vw', this.currentMapMID, mid);
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

    tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event.attrs['tp']));
    return {
      mapsetEvent: 'error'
    };
  }

  handle_mapSubset(event) {
    tools.envLog("[VacBot] *** handle_mapSubset " + JSON.stringify(event));
    if (event.attrs && event.attrs.hasOwnProperty('m')) {
      const value = event.attrs['m'];
      let mid = '';
      let type = '';
      if (event.attrs.hasOwnProperty('mid')) {
        // MQTT
        mid = event.attrs['mid'];
        type = event.attrs['tp'];
      } else {
        // XMPP
        const action = this.commandsSent[event.attrs.id];
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

  handle_mapInfo(event) {
    if (event.attrs) {
      const mapID = event.attrs.i;
      const type = 'ol'; // Only outline is supported for non 950 type models
      const columnGrid = event.attrs.w;
      const columnPiece = event.attrs.c;
      const rowGrid = event.attrs.h;
      const rowPiece = event.attrs.r;
      const pixelWidth = event.attrs.p;
      const crc = event.attrs.m;
      const totalWidth = columnGrid * columnPiece;
      const totalHeight = rowGrid * rowPiece;
      this.mapPiecePacketsCrcArray = crc.split(',');
      if (typeof this.mapImages[mapID] === 'undefined') {
        this.mapImages[mapID] = [];
      }
      if (typeof this.mapImages[mapID][type] === 'undefined') {
        this.mapImages[mapID][type] = new map.EcovacsMapImage(mapID, type, totalWidth, totalHeight, pixelWidth, this.mapPiecePacketsCrcArray.length);
      }
      this.mapPiecePacketCurrentNumber = null;
      this.mapPiecePacketsSent = [];
      for (let c = 0; c < this.mapPiecePacketsCrcArray.length; c++) {
        this.run('PullMP', c);
      }
    }
  }

  handle_mapPiecePacket(event) {
    if (event.attrs) {
      const mapID = event.attrs.i;
      const type = 'ol'; // Only outline is supported for non 950 type models
      if (this.mapImages[mapID][type]) {
        tools.envLog('[Ecovacs] MapPiecePacket: %s', JSON.stringify(event));
        let pid = this.mapPiecePacketsSent[event.attrs.id];
        if (event.attrs.pid) {
          pid = event.attrs.pid;
        }
        const crc = this.mapPiecePacketsCrcArray[pid];
        const mapTotalWidth = this.mapImages[mapID][type].mapTotalWidth;
        const mapTotalHeight = this.mapImages[mapID][type].mapTotalHeight;
        const startX = (pid % 8) * mapTotalWidth;
        const startY = Math.floor(pid / 8) * mapTotalHeight;
        const pieceValue = event.attrs.p;
        this.mapImages[this.currentMapMID][type].updateMapPiece(pid, startX, startY, mapTotalWidth, mapTotalHeight, crc, pieceValue, false);
        if (this.mapImages[this.currentMapMID][type].transferMapInfo) {
          let mapImage = this.mapImages[this.currentMapMID][type].getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
          tools.envLog('[Ecovacs] MapPiecePacket2: %s', JSON.stringify(mapImage));
        }
      }
    }
  }

  handle_deebotPosition(event) {
    tools.envLog("[VacBot] *** deebotPosition event: %s", JSON.stringify(event));
    if (event.attrs && event.attrs.hasOwnProperty('p')) {
        const posX = event.attrs['p'].split(",")[0];
        const posY = event.attrs['p'].split(",")[1];
        const angle = event.attrs['a'];
        let currentSpotAreaID = map.isPositionInSpotArea([posX, posY], this.mapSpotAreaInfos[this.currentMapMID]);
        this.deebotPosition = {
          x: posX,
          y: posY,
          a: angle,
          isInvalid: false,
          currentSpotAreaID: currentSpotAreaID,
          changeFlag: true
        };
        tools.envLog("[VacBot] *** deebotPosition = %s", JSON.stringify(this.deebotPosition));
      }
  }

  handle_chargePosition(event) {
    if (event.attrs && event.attrs.hasOwnProperty('p') && event.attrs.hasOwnProperty('a')) {
      this.chargePosition = {
        x: event.attrs['p'].split(",")[0],
        y: event.attrs['p'].split(",")[1],
        a: event.attrs['a']
      };
      tools.envLog("[VacBot] *** chargePosition = %s", JSON.stringify(this.chargePosition));
    }
  }

  handle_dustcaseInfo(event) {
    if (event.attrs && event.attrs.hasOwnProperty('st')) {
      this.dustcaseInfo = event.attrs['st'];
      tools.envLog("[VacBot] *** dustcaseInfo = " + this.dustcaseInfo);
    }
  }

  handle_waterboxInfo(event) {
    if (event.attrs && event.attrs.hasOwnProperty('on')) {
      this.waterboxInfo = event.attrs['on'];
      tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
    }
  }

  handle_sleepStatus(event) {
    if (event.attrs && event.attrs.hasOwnProperty('st')) {
      this.sleepStatus = event.attrs['st'];
      tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
    }
  }

  handle_chargeState(event) {
    if (event.attrs && event.attrs.hasOwnProperty('type')) {
      const chargeStatus = event.attrs['type'];
      if (dictionary.CHARGE_MODE_FROM_ECOVACS[chargeStatus]) {
        this.chargeStatus = dictionary.CHARGE_MODE_FROM_ECOVACS[chargeStatus];
        tools.envLog("[VacBot] *** chargeStatus = " + this.chargeStatus);
      } else {
        tools.envLog("[VacBot] Unknown charging status '%s'", chargeStatus);
      }
    } else {
      tools.envLog("[VacBot] couldn't parse charge status ", event);
    }
  }

  handle_cleanSum(event) {
    if (event.attrs && event.attrs.hasOwnProperty('a') && event.attrs.hasOwnProperty('l') && event.attrs.hasOwnProperty('c')) {
      this.cleanSum_totalSquareMeters = parseInt(event.attrs['a']);
      this.cleanSum_totalSeconds = parseInt(event.attrs['l']);
      this.cleanSum_totalNumber = parseInt(event.attrs['c']);
    }
  }

  handle_cleanLogs(event) {
    if (event.attrs) {
      const count = event.children.length;
      for (let c = 0; c < count; c++) {
        let childElement = event.children[c];
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

  handle_onOff(event) {
    tools.envLog("[VacBot] *** handleOnOff = " + JSON.stringify(event));
    if (event.attrs && event.attrs.hasOwnProperty('on')) {
      let type = null;
      const action = this.commandsSent[event.attrs.id];
      if (action.args && action.args.t) {
        type = dictionary.ON_OFF_FROM_ECOVACS[action.args.t];
      }
      if (type) {
        const on = event.attrs.on;
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

  handle_stats(event) {
    if (event.attrs) {
      const area = parseInt(event.attrs.a);
      const seconds = parseInt(event.attrs.l);
      const type = event.attrs.type;
      this.currentStats = {
        'cleanedArea': area,
        'cleanedSeconds': seconds,
        'cleanType': type
      }
    }
  }

  handle_error(event) {
    this.errorCode = '0';
    this.errorDescription = '';
    let attrs = ['new', 'code', 'errno', 'error', 'errs'];
    for (const attr of attrs) {
      if (event.hasOwnProperty(attr) && (event[attr] !== '')) {
        // 100 = "NoError: Robot is operational"
        this.errorCode = (event[attr] === '100') ? '0' : event[attr];
        if (errorCodes[this.errorCode]) {
          this.errorDescription = errorCodes[this.errorCode];
        } else {
          this.errorDescription = 'unknown errorCode: ' + this.errorCode;
        }
        return;
      }
    }
  }

  run(action) {
    tools.envLog("[VacBot] action: %s", action);
    switch (action.toLowerCase()) {
      case "Clean".toLowerCase():
        if (arguments.length === 1) {
          this.sendCommand(new vacBotCommand.Clean());
        } else if (arguments.length === 2) {
          this.sendCommand(new vacBotCommand.Clean(arguments[1]));
        } else {
          this.sendCommand(new vacBotCommand.Clean(arguments[1], arguments[2]));
        }
        break;
      case "Edge".toLowerCase():
        this.sendCommand(new vacBotCommand.Edge());
        break;
      case "Spot".toLowerCase():
        this.sendCommand(new vacBotCommand.Spot());
        break;
      case "SpotArea".toLowerCase():
        if (arguments.length >= 3) {
          this.sendCommand(new vacBotCommand.SpotArea(arguments[1], arguments[2]));
        }
        break;
      case "CustomArea".toLowerCase():
        if (arguments.length >= 4) {
          this.sendCommand(new vacBotCommand.CustomArea(arguments[1], arguments[2], arguments[3]));
        }
        break;
      case "Stop".toLowerCase():
        this.sendCommand(new vacBotCommand.Stop());
        break;
      case "Pause".toLowerCase():
        this.sendCommand(new vacBotCommand.Pause());
        break;
      case "Resume".toLowerCase():
        this.sendCommand(new vacBotCommand.Resume());
        break;
      case "Charge".toLowerCase():
        this.sendCommand(new vacBotCommand.Charge());
        break;
      case "PlaySound".toLowerCase():
        if (arguments.length === 1) {
          this.sendCommand(new vacBotCommand.PlaySound());
        } else {
          this.sendCommand(new vacBotCommand.PlaySound(arguments[1]));
        }
        break;
      case "GetCleanState".toLowerCase():
      case "CleanState".toLowerCase():
        this.sendCommand(new vacBotCommand.GetCleanState());
        break;
      case "GetCleanSpeed".toLowerCase():
      case "CleanSpeed".toLowerCase():
        this.sendCommand(new vacBotCommand.GetCleanSpeed());
        break;
      case "SetCleanSpeed".toLowerCase():
        if (arguments.length >= 2) {
          this.sendCommand(new vacBotCommand.SetCleanSpeed(arguments[1]));
        }
        break;
      case "GetChargeState".toLowerCase():
      case "ChargeState".toLowerCase():
        this.sendCommand(new vacBotCommand.GetChargeState());
        break;
      case "GetBatteryInfo".toLowerCase():
      case "GetBatteryState".toLowerCase():
      case "BatteryState".toLowerCase():
        this.sendCommand(new vacBotCommand.GetBatteryState());
        break;
      case "GetLifeSpan".toLowerCase():
      case "LifeSpan".toLowerCase():
        if (arguments.length < 2) {
          this.emitFullLifeSpanEvent = true;
          this.components = {};
          this.lastComponentValues = {};
          this.sendCommand(new vacBotCommand.GetLifeSpan('filter'));
          if (this.hasMainBrush()) {
            this.sendCommand(new vacBotCommand.GetLifeSpan('main_brush'));
          }
          this.sendCommand(new vacBotCommand.GetLifeSpan('side_brush'));
        } else {
          this.emitFullLifeSpanEvent = false;
          this.sendCommand(new vacBotCommand.GetLifeSpan(arguments[1]));
        }
        break;
      case "ResetLifeSpan".toLowerCase():
        // Tested von Deebot 901 and Ozmo 930
        if (arguments.length >= 2) {
          this.sendCommand(new vacBotCommand.ResetLifeSpan(arguments[1]));
        }
        break;
      case "SetLifeSpan".toLowerCase():
        // Untested - seems to be only for the N79 series
        if (arguments.length === 2) {
          this.sendCommand(new vacBotCommand.SetLifeSpan(arguments[1]));
        } else if (arguments.length === 3) {
          this.sendCommand(new vacBotCommand.SetLifeSpan(arguments[1], arguments[2]));
        }
        break;
      case "SetWaterLevel".toLowerCase():
        if (arguments.length >= 2) {
          this.sendCommand(new vacBotCommand.SetWaterLevel(arguments[1]));
        }
        break;
      case "GetWaterLevel".toLowerCase():
        this.sendCommand(new vacBotCommand.GetWaterLevel());
        break;
      case "GetWaterBoxInfo".toLowerCase():
        this.sendCommand(new vacBotCommand.GetWaterBoxInfo());
        break;
      case "GetNetInfo".toLowerCase():
        this.sendCommand(new vacBotCommand.GetNetInfo());
        break;
      case "GetPos".toLowerCase():
      case "GetPosition".toLowerCase():
        this.sendCommand(new vacBotCommand.GetPosition());
        break;
      case "GetChargerPos".toLowerCase():
      case "GetChargerPosition".toLowerCase():
        this.sendCommand(new vacBotCommand.GetChargerPos());
        break;
      case "GetSleepStatus".toLowerCase():
        this.sendCommand(new vacBotCommand.GetSleepStatus());
        break;
      case "GetCleanSum".toLowerCase():
        if (!this.isN79series()) {
          // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/67
          this.sendCommand(new vacBotCommand.GetCleanSum());
        }
        break;
      case "GetMapSet".toLowerCase():
        this.sendCommand(new vacBotCommand.GetMapSet('sa'));
        this.sendCommand(new vacBotCommand.GetMapSet('vw'));
        break;
      case "GetMaps".toLowerCase():
        this.createMapDataObject = !!arguments[1] || false;
        this.handleMapExecuted = false;
        this.sendCommand(new vacBotCommand.GetMapM());
        break;
      case "PullM".toLowerCase():
        if (arguments.length >= 5) {
          this.sendCommand(new vacBotCommand.PullM(arguments[1], arguments[2], arguments[3], arguments[4]));
        }
        break;
      case "PullMP".toLowerCase():
        if (arguments.length >= 2) {
          this.sendCommand(new vacBotCommand.PullMP(arguments[1]));
        }
        break;
      case "Move".toLowerCase():
        if (arguments.length >= 2) {
          this.sendCommand(new vacBotCommand.Move(arguments[1]));
        }
        break;
      case "MoveBackward".toLowerCase():
        this.sendCommand(new vacBotCommand.MoveBackward());
        break;
      case "MoveForward".toLowerCase():
        this.sendCommand(new vacBotCommand.MoveForward());
        break;
      case "MoveLeft".toLowerCase():
        this.sendCommand(new vacBotCommand.MoveLeft());
        break;
      case "MoveRight".toLowerCase():
        this.sendCommand(new vacBotCommand.MoveRight());
        break;
      case "MoveTurnAround".toLowerCase():
        this.sendCommand(new vacBotCommand.MoveTurnAround());
        break;
      case "GetOnOff".toLowerCase():
        if (arguments.length >= 2) {
          this.sendCommand(new vacBotCommand.GetOnOff(arguments[1]));
        }
        break;
      case "SetOnOff".toLowerCase():
        if (arguments.length >= 3) {
          this.sendCommand(new vacBotCommand.SetOnOff(arguments[1],arguments[2]));
        }
        break;
      case "EnableDoNotDisturb".toLowerCase():
        this.sendCommand(new vacBotCommand.EnableDoNotDisturb());
        break;
      case "DisableDoNotDisturb".toLowerCase():
        this.sendCommand(new vacBotCommand.DisableDoNotDisturb());
        break;
      case "GetLogs".toLowerCase():
      case "GetCleanLogs".toLowerCase():
      case "GetLogApiCleanLogs".toLowerCase():
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
      case "RenameSpotArea".toLowerCase():
        if (arguments.length >= 4) {
          this.sendCommand(new vacBotCommand.RenameSpotArea(arguments[1],arguments[2],arguments[3]));
        }
        break;
    }
  }
}

module.exports = VacBot_non950type;
