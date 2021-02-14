const dictionary = require('./ecovacsConstants_950type');
const vacBotCommand = require('./vacBotCommand_950type');
const VacBot = require('./vacBot');
const errorCodes = require('./errorCodes');
const tools = require('./tools');
const map = require('./mapTemplate');

class VacBot_950type extends VacBot {
  constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
    super(user, hostname, resource, secret, vacuum, continent, country, server_address);

    this.clean_status = null;
    this.fan_speed = null;
    this.charge_status = null;
    this.battery_status = null;
    this.water_level = null;
    this.waterbox_info = null;
    this.sleep_status = null;
    this.autoEmpty = null;
    this.volume = 0;
    this.relocation_state = null;
    this.lastCleanLogUseAlternativeAPICall = false;
  }

  _handle_life_span(event) {
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      for ( let component in event['resultData']) {
        let type = event['resultData'][component]["type"];
        let left = event['resultData'][component]["left"];
        let total = event['resultData'][component]["total"];
        let lifespan =  parseInt(left) / parseInt(total) * 100;
        try {
          type = dictionary.COMPONENT_FROM_ECOVACS[type];
        } catch (e) {
          tools.envLog("[VacBot] Unknown component type: ", event);
        }
        tools.envLog("[VacBot] lifespan %s: %s", type, lifespan);

        this.components[type] = lifespan;
        tools.envLog("[VacBot] lifespan components : %s", JSON.stringify(this.components));
      }
    }
  }

  _handle_position(event) {
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      //as deebotPos and chargePos can also appear in other messages (CleanReport)
      //the handling should be extracted to a seperate function
      if (event['resultData']['deebotPos']) {
        // check if position changed or currentSpotAreaID unknown
        if (event['resultData']['deebotPos']['x'] != this.deebotPosition.x
            || event['resultData']['deebotPos']['y'] != this.deebotPosition.y
            || event['resultData']['deebotPos']['a'] != this.deebotPosition.a
            || event['resultData']['deebotPos']['invalid'] != this.deebotPosition.isInvalid
            || this.deebotPosition.currentSpotAreaID === 'unknown'
        ) {
          let currentSpotAreaID = map.isPositionInSpotArea([[event['resultData']['deebotPos']['x']], event['resultData']['deebotPos']['y']], this.mapSpotAreaInfos[this.currentMapMID]);
          tools.envLog("[VacBot] *** currentSpotAreaID = " + currentSpotAreaID);
          this.deebotPosition = {
            x: event['resultData']['deebotPos']['x'],
            y: event['resultData']['deebotPos']['y'],
            a: event['resultData']['deebotPos']['a'],
            isInvalid: event['resultData']['deebotPos']['invalid'] == 1 ? true : false,
            currentSpotAreaID: currentSpotAreaID,
            changeFlag: true
          };
          tools.envLog("[VacBot] *** Deebot Position = "
              + 'x=' + this.deebotPosition.x
              + ' y=' + this.deebotPosition.y
              + ' a=' + this.deebotPosition.a
              + ' currentSpotAreaID=' + this.deebotPosition.currentSpotAreaID
              + ' isInvalid=' + this.deebotPosition.isInvalid
          );
        }
      }

      if (event['resultData']['chargePos']) { //is only available in some DeebotPosition messages (e.g. on start cleaning)
        //there can be more than one charging station only handles first charging station
        // check if position changed
        if (event['resultData']['chargePos'][0]['x'] != this.chargePosition.x
            || event['resultData']['chargePos'][0]['y'] != this.chargePosition.y
            || event['resultData']['chargePos'][0]['a'] != this.chargePosition.a
        ) {
          this.chargePosition = {
            x: event['resultData']['chargePos'][0]['x'],
            y: event['resultData']['chargePos'][0]['y'],
            a: event['resultData']['chargePos'][0]['a'],
            changeFlag: true
          };
          tools.envLog("[VacBot] *** Charge Position = "
              + 'x=' + this.chargePosition.x
              + ' y=' + this.chargePosition.y
              + ' a=' + this.chargePosition.a
          );
        }
      }
    }
    if (!event) {
      tools.envLog("[VacBot] _handle_deebot_position event undefined");
    }
  }

  _handle_fan_speed(event) {
    this.fan_speed = dictionary.FAN_SPEED_FROM_ECOVACS[event['resultData']['speed']];
    tools.envLog("[VacBot] *** fan_speed = %s", this.fan_speed);
  }

  _handle_net_info(event) {
    this.netInfoIP = event['resultData']['ip'];
    this.netInfoWifiSSID = event['resultData']['ssid'];
    this.netInfoWifiSignal = event['resultData']['rssi'];
    this.netInfoMAC = event['resultData']['mac'];

    tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
    tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
    tools.envLog("[VacBot] *** netInfoWifiSignal = %s", this.netInfoWifiSignal);
    tools.envLog("[VacBot] *** netInfoMAC = %s", this.netInfoMAC);
  }

  _handle_clean_info(event) {
    tools.envLog("[VacBot] _handle_clean_info");
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      if (event['resultData']['state'] === 'clean') {
        let type = event['resultData']['cleanState']['type'];
        if (typeof event['resultData']['cleanState']['content'] === "object") {
          type = event['resultData']['cleanState']['content']['type'];
        }
        if (event['resultData']['cleanState']['motionState'] === 'working') {
          this.clean_status = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
        } else {
          this.clean_status = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['cleanState']['motionState']];
        }
        if (type === 'customArea') {
          if (typeof event['resultData']['cleanState']['content'] === "object") {
            this.lastUsedAreaValues = event['resultData']['cleanState']['content']['value'];
          } else {
            this.lastUsedAreaValues = event['resultData']['cleanState']['content'];
          }
        } else {
          this.lastUsedAreaValues = null;
        }
      } else if (event['resultData']['trigger'] === 'alert') {
        this.clean_status = 'alert';
        this.lastUsedAreaValues = null;
      } else {
        this.clean_status = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']];
        if (dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']] === 'returning') {
          // set charge state on returning to dock
          const chargeStatus = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']];
          if (chargeStatus) {
            this.charge_status = chargeStatus;
            tools.envLog("[VacBot] *** charge_status = %s", this.charge_status);
          }
        } else if (dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']] === 'idle') {
          // when clean state = idle the bot can be charging on the dock or the return to dock has been canceled
          // if this is not run, the status when canceling the return stays on 'returning'
          this.run('GetChargeState');
        }
        this.lastUsedAreaValues = null;
      }
    } else {
      this.clean_status = 'error';
    }
    tools.envLog("[VacBot] *** clean_status = %s", this.clean_status);
  }

  _handle_cleanLogs(event) {
    tools.envLog("[VacBot] _handle_cleanLogs");
    // Unlike the others, resultCode seems to be a string
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      let logs = [];
      if (event['resultData'].hasOwnProperty('logs')) {
        logs = event['resultData']['logs'];
      } else if (event['resultData'].hasOwnProperty('log')) {
        logs = event['resultData']['log'];
      }

      for (let logIndex in logs) {
        if (logs.hasOwnProperty(logIndex)) {
          if (!this.cleanLog[logs[logIndex]['id']]) { //log not yet existing
            let squareMeters = parseInt(logs[logIndex]['area']);
            tools.envLog("[VacBot] cleanLogs %s: %s m2", logIndex, squareMeters);
            let timestamp = parseInt(logs[logIndex]['ts']);
            let date = new Date(timestamp * 1000);
            tools.envLog("[VacBot] cleanLogs %s: %s", logIndex, date.toString());
            let len = parseInt(logs[logIndex]['last']);
            let hours = Math.floor(len / 3600);
            let minutes = Math.floor((len % 3600) / 60);
            let seconds = Math.floor(len % 60);
            let totalTimeString = hours.toString() + 'h ' + ((minutes < 10) ? '0' : '') + minutes.toString() + 'm ' + ((seconds < 10) ? '0' : '') + seconds.toString() + 's';
            tools.envLog("[VacBot] cleanLogs %s: %s", logIndex, totalTimeString);
            let imageUrl = logs[logIndex]['imageUrl'];
            if ((!this.lastCleanLogUseAlternativeAPICall)
                && (this.cleanLog_lastImageTimestamp < timestamp || (!this.cleanLog_lastImageTimestamp))) {
              this.cleanLog_lastImageUrl = imageUrl;
              this.cleanLog_lastImageTimestamp = timestamp;
              tools.envLog("[VacBot] *** cleanLog_lastImageUrl = " + this.cleanLog_lastImageUrl);
              tools.envLog("[VacBot] *** cleanLog_lastImageTimestamp = " + this.cleanLog_lastImageTimestamp);
            }
            this.cleanLog[logs[logIndex]['id']] = {
              'squareMeters': squareMeters,
              'timestamp': timestamp,
              'lastTime': len,
              'imageUrl': imageUrl,
              'type': logs[logIndex]['type'],
              'stopReason': logs[logIndex]['stopReason']
            };
          }
        }
      }
    }
    tools.envLog("[VacBot] *** cleanLogs = " + this.cleanLog);
  }

  _handle_lastCleanLog(event) {
    tools.envLog("[VacBot] _handle_lastCleanLog");
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      if (event['resultData'].hasOwnProperty('log')) {
        this.cleanLog_lastImageTimestamp = parseInt(event['resultData']['log']['ts']);
        this.cleanLog_lastImageUrl = event['resultData']['log']['imageUrl'];
        tools.envLog("[VacBot] *** cleanLog_lastImageUrl = " + this.cleanLog_lastImageUrl);
        tools.envLog("[VacBot] *** cleanLog_lastImageTimestamp = " + this.cleanLog_lastImageTimestamp);
      }
    }
  }

  _handle_cleanSum(event) {
    this.cleanSum_totalSquareMeters = parseInt(event['resultData']['area']);
    this.cleanSum_totalSeconds = parseInt(event['resultData']['time']);
    this.cleanSum_totalNumber = parseInt(event['resultData']['count']);
  }

  _handle_battery_info(event) {
    this.battery_status = event['resultData']['value'];
    tools.envLog("[VacBot] *** battery_status = %d\%", this.battery_status);
  }

  _handle_water_level(event) {
    this.water_level = event['resultData']['amount'];
    tools.envLog("[VacBot] *** water_level = %s", this.water_level);
  }

  _handle_relocation_state(event) {
    this.relocation_state = event['resultData']['state'];
    tools.envLog("[VacBot] *** relocation_state = " + this.relocation_state);
  }

  _handle_cachedmapinfo(event) {
    this.currentMapName = 'unknown';
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      this.maps = {"maps": []};
      const infoEvent = event['resultData']['info'];
      for (let mapIndex in infoEvent) {
        if (infoEvent.hasOwnProperty(mapIndex)) {
          this.maps["maps"].push(
              new map.EcovacsMap(
                  infoEvent[mapIndex]['mid'],
                  infoEvent[mapIndex]['index'],
                  infoEvent[mapIndex]['name'],
                  infoEvent[mapIndex]['status'],
                  infoEvent[mapIndex]['using'],
                  infoEvent[mapIndex]['built']
              )
          );
          if (infoEvent[mapIndex]['using'] === 1) {
            tools.envLog("[VacBot] *** YEAH");
            this.currentMapName = infoEvent[mapIndex]['name'];
            this.currentMapMID = infoEvent[mapIndex]['mid'];
            this.currentMapIndex = infoEvent[mapIndex]['index'];
          }
        }
      }
    }
    tools.envLog("[VacBot] *** currentMapName = " + this.currentMapName);
    tools.envLog("[VacBot] *** currentMapMID = " + this.currentMapMID);
    tools.envLog("[VacBot] *** currentMapIndex = " + this.currentMapIndex);
    tools.envLog("[VacBot] *** maps = " + JSON.stringify(this.maps));
  }

  _handle_mapset(event) {
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      let mapMID = event['resultData']['mid'];
      if (isNaN(mapMID)) {
        if (this.currentMapMID) {
          mapMID = this.currentMapMID;
        } else {
          tools.envLog("[VacBot] *** mid is not a number. Skipping message for map");
          return {mapsetEvent: 'skip'};
        }
      }
      if (event['resultData']['type'] === 'ar') {
        let mapSpotAreas = new map.EcovacsMapSpotAreas(mapMID, event['resultData']['msid']);
        for (let mapIndex in event['resultData']['subsets']) {
          mapSpotAreas.push(new map.EcovacsMapSpotArea(event['resultData']['subsets'][mapIndex]['mssid']));
        }
        tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
        return {
          mapsetEvent: 'MapSpotAreas',
          mapsetData: mapSpotAreas
        };
      } else if (event['resultData']['type'] === 'vw' || event['resultData']['type'] === 'mw') {
        if (typeof this.mapVirtualBoundaries[mapMID] === 'undefined') {
          tools.envLog("[VacBot] *** initialize mapVirtualBoundaries for map " + mapMID);
          this.mapVirtualBoundaries[mapMID] = new map.EcovacsMapVirtualBoundaries(mapMID);  //initialize array for mapVirtualBoundaries if not existing
          this.mapVirtualBoundariesResponses[mapMID][0] = false;
          this.mapVirtualBoundariesResponses[mapMID][1] = false;
        }
        for (let mapIndex in event['resultData']['subsets']) {
          tools.envLog("[VacBot] *** push mapVirtualBoundaries for mssid " + event['resultData']['subsets'][mapIndex]['mssid']);
          this.mapVirtualBoundaries[mapMID].push(new map.EcovacsMapVirtualBoundary(event['resultData']['subsets'][mapIndex]['mssid'], event['resultData']['type']));
        }
        if (event['resultData']['type'] === 'vw') {
          this.mapVirtualBoundariesResponses[mapMID][0] = true;
        } else if (event['resultData']['type'] === 'mw') {
          this.mapVirtualBoundariesResponses[mapMID][1] = true;
        }
        tools.envLog("[VacBot] *** mapVirtualBoundaries = " + JSON.stringify(this.mapVirtualBoundaries[mapMID]));
        if (this.mapVirtualBoundariesResponses[mapMID][0] && this.mapVirtualBoundariesResponses[mapMID][1]) { //only return if both responses were processed
          return {
            mapsetEvent: 'MapVirtualBoundaries',
            mapsetData: this.mapVirtualBoundaries[mapMID]
          };
        } else {
          tools.envLog("[VacBot] *** skip message for map  " + mapMID);
          return {
            mapsetEvent: 'skip'
          };
        }
      }

      tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event['resultData']['type']));
      return {mapsetEvent: 'error'};
    }
  }

  _handle_mapsubset(event) {
    const resultCode = parseInt(event['resultCode']);
    if (resultCode === 0) {
      let mapMID = event['resultData']['mid'];
      if (isNaN(mapMID)) {
        mapMID = this.currentMapMID;
      }
      if (event['resultData']['type'] === 'ar') {
        //TODO: filter out reportMapSubSet events (missing data)
        //reportMapSubSet event comes without map reference, replace
        let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
            mapMID,
          event['resultData']['mssid'],
          event['resultData']['connections'], //reportMapSubSet event comes without connections
          event['resultData']['value'],
          event['resultData']['subtype']
        );
        if (typeof this.mapSpotAreaInfos[mapMID] === 'undefined') {
          this.mapSpotAreaInfos[mapMID] = []; //initialize array for mapSpotAreaInfos if not existing
        }
        this.mapSpotAreaInfos[mapMID][event['resultData']['mssid']] = mapSpotAreaInfo;
        return {
          mapsubsetEvent: 'MapSpotAreaInfo',
          mapsubsetData: mapSpotAreaInfo
        };
      } else if (event['resultData']['type'] === 'vw' || event['resultData']['type'] === 'mw') {
        let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(mapMID, event['resultData']['mssid'], event['resultData']['type'], event['resultData']['value']);
        if (typeof this.mapVirtualBoundaryInfos[mapMID] === 'undefined') {
          this.mapVirtualBoundaryInfos[mapMID] = []; //initialize array for mapVirtualBoundaryInfos if not existing
        }
        this.mapVirtualBoundaryInfos[mapMID][event['resultData']['mssid']] = mapVirtualBoundaryInfo;
        tools.envLog("[VacBot] *** MapVirtualBoundaryInfo = " + JSON.stringify(mapVirtualBoundaryInfo));
        return {
          mapsubsetEvent: 'MapVirtualBoundaryInfo',
          mapsubsetData: mapVirtualBoundaryInfo
        };
      }

      tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event['resultData']['type']));
      return {
        mapsubsetEvent: 'error'
      };
    }
  }

  _handle_water_info(event) {
    this.water_level = event['resultData']['amount'];
    this.waterbox_info = event['resultData']['enable'];
    tools.envLog("[VacBot] *** waterbox_info = " + this.waterbox_info);
    tools.envLog("[VacBot] *** water_level = " + this.water_level);
  }

  _handle_volume(event) {
    if (event.hasOwnProperty('resultData')) {
      this.volume = event['resultData']['volume'];
      tools.envLog("[VacBot] *** volume = " + this.volume);
    }
  }

  _handle_charge_state(event) {
    if (event.hasOwnProperty('resultData')) {
      let status = null;
      const resultCode = parseInt(event['resultCode']);
      if (resultCode === 0) {
        const isCharging = parseInt(event['resultData']['isCharging']);
        if (isCharging === 1) {
          status = 'charging';
        } else if (isCharging === 0) {
          status = 'idle';
        }
      }
      if (status) {
        this.charge_status = status;
      }
    } else {
      tools.envLog("[VacBot] couldn't parse charge status ", event);
    }
  }

  _handle_sleep_status(event) {
    this.sleep_status = event['resultData']['enable']
    tools.envLog("[VacBot] *** sleep_status = " + this.sleep_status);
  }

  _handle_autoEmpty(event) {
    this.autoEmpty = event['resultData']['enable']
    tools.envLog("[VacBot] *** autoEmpty = " + this.autoEmpty);
  }

  _handle_error(event) {
    this.errorCode = event['resultData']['code'].toString();
    // known errorCode from library
    if (errorCodes[this.errorCode]) {
      this.errorDescription = errorCodes[this.errorCode];
    } else {
      this.errorDescription = 'unknown errorCode: ' + this.errorCode;
    }
    tools.envLog("[VacBot] *** errorCode = " + this.errorCode);
    tools.envLog("[VacBot] *** errorDescription = " + this.errorDescription);
  }

  run(action) {
    tools.envLog("[VacBot] action: %s", action);
    switch (action.toLowerCase()) {
      case "clean":
        if (arguments.length <= 1) {
          this.send_command(new vacBotCommand.Clean());
        } else if (arguments.length === 2) {
          this.send_command(new vacBotCommand.Clean(arguments[1]));
        } else {
          this.send_command(new vacBotCommand.Clean(arguments[1], arguments[2]));
        }
        break;
      case "edge":
        this.send_command(new vacBotCommand.Edge());
        break;
      case "spot":
        this.send_command(new vacBotCommand.Spot());
        break;
      case "spotarea":
        if (arguments.length < 3) {
          return;
        } else if (arguments.length === 3) {
          this.send_command(new vacBotCommand.SpotArea(arguments[1], arguments[2]));
        } else { // including number of cleanings
          this.send_command(new vacBotCommand.SpotArea(arguments[1], arguments[2], arguments[3]));
        }
        break;
      case "customarea":
        if (arguments.length < 4) {
          return;
        }
        this.send_command(new vacBotCommand.CustomArea(arguments[1], arguments[2], arguments[3]));
        break;
      case "stop":
        this.send_command(new vacBotCommand.Stop());
        break;
      case "pause":
        this.send_command(new vacBotCommand.Pause());
        break;
      case "resume":
        this.send_command(new vacBotCommand.Resume());
        break;
      case "charge":
        this.send_command(new vacBotCommand.Charge());
        break;
      case "move":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.Move(arguments[1]));
        break;
      case "movebackward":
        this.send_command(new vacBotCommand.MoveBackward());
        break;
      case "moveforward":
        this.send_command(new vacBotCommand.MoveForward());
        break;
      case "moveleft":
        this.send_command(new vacBotCommand.MoveLeft());
        break;
      case "moveright":
        this.send_command(new vacBotCommand.MoveRight());
        break;
      case "moveturnaround":
        this.send_command(new vacBotCommand.MoveTurnAround());
        break;
      case "relocate":
        this.send_command(new vacBotCommand.Relocate());
        break;
      case "playsound":
        if (arguments.length <= 1) {
          this.send_command(new vacBotCommand.PlaySound());
        } else if (arguments.length === 2) {
          this.send_command(new vacBotCommand.PlaySound(arguments[1]));
        }
        break;
      case "getdeviceinfo":
        this.send_command(new vacBotCommand.GetDeviceInfo());
        break;
      case "getcleanstate":
        this.send_command(new vacBotCommand.GetCleanState());
        break;
      case "getcleanspeed":
        this.send_command(new vacBotCommand.GetCleanSpeed());
        break;
      case "getcleansum":
        this.send_command(new vacBotCommand.GetCleanSum());
        break;
      case "getchargestate":
        this.send_command(new vacBotCommand.GetChargeState());
        break;
      case "getmaps":
        this.send_command(new vacBotCommand.GetMaps());
        break;
      case "getspotareas":
        if (arguments.length <= 1) {
          return;
        } else if (arguments.length === 2) {
          this.send_command(new vacBotCommand.GetMapSpotAreas(arguments[1]));
        }
        break;
      case "getspotareainfo":
        if (arguments.length <= 2) {
          return;
        } else if (arguments.length === 3) {
          this.send_command(new vacBotCommand.GetMapSpotAreaInfo(arguments[1], arguments[2]));
        }
        break;
      case "getvirtualboundaries":
        if (arguments.length <= 1) {
          return;
        } else if (arguments.length === 2) {
          if (typeof this.mapVirtualBoundariesResponses[arguments[1]] === 'undefined') {
            tools.envLog("[VacBot] *** initialize mapVirtualBoundariesResponses for map " + arguments[1]);
            this.mapVirtualBoundariesResponses[arguments[1]] = [false, false];
          } else {
            this.mapVirtualBoundariesResponses[arguments[1]][0] = false;
            this.mapVirtualBoundariesResponses[arguments[1]][1] = false;
          }

          this.send_command(new vacBotCommand.GetMapVirtualBoundaries(arguments[1], 'vw'));
          this.send_command(new vacBotCommand.GetMapVirtualBoundaries(arguments[1], 'mw'));
        }
        break;
      case "getvirtualboundaryinfo":
        if (arguments.length <= 3) {
          return;
        } else if (arguments.length === 4) {
          this.send_command(new vacBotCommand.GetMapVirtualBoundaryInfo(arguments[1], arguments[2], arguments[3]));
        }
        break;
      case "deletevirtualboundary":
        if (arguments.length <= 3) {
          return;
        } else if (arguments.length === 4) {
          this.send_command(new vacBotCommand.DeleteMapVirtualBoundary(arguments[1], arguments[2], arguments[3]));
        }
        break;
      case "addvirtualboundary":
        if (arguments.length <= 2) {
          return;
        } else if (arguments.length === 3) {
          this.send_command(new vacBotCommand.AddMapVirtualBoundary(arguments[1], arguments[2], 'vw'));
        } else if (arguments.length === 4) {
          this.send_command(new vacBotCommand.AddMapVirtualBoundary(arguments[1], arguments[2], arguments[3]));
        }
        break;
      case "geterror":
        this.send_command(new vacBotCommand.GetError());
        break;
      case "getbatterystate":
        this.send_command(new vacBotCommand.GetBatteryState());
        break;
      case "getnetinfo":
        this.send_command(new vacBotCommand.GetNetInfo());
        break;
      case "getlifespan":
        if (arguments.length < 2) {
          return;
        }
        let component = arguments[1];
        this.send_command(new vacBotCommand.GetLifeSpan(component));
        break;
      case "resetlifespan":
        if (arguments.length >= 2) {
          this.send_command(new vacBotCommand.ResetLifeSpan(arguments[1]));
        }
        break;
      case "getwaterlevel":
      case "getwaterboxinfo":
      case "getwaterinfo":
        this.send_command(new vacBotCommand.GetWaterInfo());
        break;
      case "getposition":
        this.send_command(new vacBotCommand.GetPosition());
        break;
      case "getsleepstatus":
        this.send_command(new vacBotCommand.GetSleepStatus());
        break;
      case "setwaterlevel":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.SetWaterLevel(arguments[1]));
        break;
      case "setcleanspeed":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.SetCleanSpeed(arguments[1]));
        break;
      case "getcleanlogs":
        this.lastCleanLogUseAlternativeAPICall = false;
        this.send_command(new vacBotCommand.GetCleanLogs());
        break;
      case "getcleanlogswithoutlastinfo":
        this.lastCleanLogUseAlternativeAPICall = true;
        this.send_command(new vacBotCommand.GetCleanLogs());
        break;
      case "getlastcleanloginfo":
        this.lastCleanLogUseAlternativeAPICall = true;
        this.send_command(new vacBotCommand.GetLastCleanLog());
        break;
      case "getcleanlogspullcleanf":
        this.lastCleanLogUseAlternativeAPICall = true;
        this.send_command(new vacBotCommand.GetCleanLogsPullCleanF());
        break;
      case "getvolume":
        this.send_command(new vacBotCommand.GetVolume());
        break;
      case "setvolume":
        if (arguments.length >= 2) {
          this.send_command(new vacBotCommand.SetVolume(arguments[1]));
        }
      case "getautoempty":
        this.send_command(new vacBotCommand.GetAutoEmpty());
        break;
      case "setautoempty":
        if (arguments.length >= 2) {
          this.send_command(new vacBotCommand.SetAutoEmpty(arguments[1]));
        }
        break;
    }
  }
}

module.exports = VacBot_950type;
