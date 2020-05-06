const   dictionary = require('./ecovacsConstants_950type.js');
const   constants = require('./ecovacsConstants.js');
const   vacBotCommand = require('./vacBotCommand_950type.js');
const   errorCodes = require('./errorCodes');
const   tools = require('./tools.js');
const   map = require('./mapTemplate.js');

class VacBot_950type {
  constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
    this.vacuum = vacuum;
    this.clean_status = null;
    this.is_ready = false;

    this.deebot_position = {
      x: null,
      y: null,
      a: null,
      isInvalid: false,
      currentSpotAreaID: 'unknown',
      changeFlag: false
    };
    this.charge_position = {
      x: null,
      y: null,
      a: null,
      changeFlag: false
    };
    this.fan_speed = null;
    this.lastUsedAreaValues = null;
    this.relocation_state = null;
    this.charge_status = null;
    this.battery_status = null;
    this.water_level = null;
    this.waterbox_info = null;
    this.sleep_status = null;
    this.components = {};
    this.ping_interval = null;
    this.errorCode = '0';
    this.errorDescription = errorCodes[this.errorCode];
    this.ecovacs = null;
    this.useMqtt = (vacuum['company'] === 'eco-ng') ? true : false;
    this.deviceClass = vacuum['class'];
    this.deviceModel = constants.EcoVacsHomeProducts[vacuum['class']]['product']['name'];
    this.deviceImageURL = constants.EcoVacsHomeProducts[vacuum['class']]['product']['iconUrl'];
    this.currentMapName = 'unknown';
    this.currentMapMID = null;
    this.currentMapIndex = null;

    this.maps = null;
    this.mapSpotAreaInfos = [];

    this.cleanLog = [];
    this.cleanLog_lastImageUrl = null;
    this.cleanLog_lastImageTimestamp = null;

    this.netInfoIP = null;
    this.netInfoWifiSSID = null;
    this.netInfoWifiSignal = null;
    this.netInfoMAC = null;
    
    this.cleanSum_totalSquareMeters = null;
    this.cleanSum_totalSeconds = null;
    this.cleanSum_totalNumber = null;

    tools.envLog("[VacBot] Using EcovacsIOTMQ_JSON");
    const EcovacsMQTT = require('./ecovacsMQTT_JSON.js');
    this.ecovacs = new EcovacsMQTT(this, user, hostname, resource, secret, continent, country, vacuum, server_address);


    this.ecovacs.on("ready", () => {
      tools.envLog("[VacBot] Ready event!");
      this.is_ready = true;
    });
  }

  isSupportedDevice() {
    const devices = JSON.parse(JSON.stringify(tools.getSupportedDevices()));
    return devices.hasOwnProperty(this.deviceClass);
  }

  isKnownDevice() {
    const devices = JSON.parse(JSON.stringify(tools.getKnownDevices()));
    return devices.hasOwnProperty(this.deviceClass) || this.isSupportedDevice();
  }

  getDeviceProperty(property) {
    const devices = JSON.parse(JSON.stringify(tools.getAllKnownDevices()));
    if (devices.hasOwnProperty(this.deviceClass)) {
      const device = devices[this.deviceClass];
      if (device.hasOwnProperty(property)) {
        return device[property];
      }
    }
    return false;
  }

  hasMainBrush() {
    return this.getDeviceProperty('main_brush');
  }

  hasSpotAreas() {
    return this.getDeviceProperty('spot_area');
  }

  hasCustomAreas() {
    return this.getDeviceProperty('custom_area');
  }

  hasMoppingSystem() {
    return this.getDeviceProperty('mopping_system');
  }

  hasVoiceReports() {
    return this.getDeviceProperty('voice_report');
  }

  connect_and_wait_until_ready() {
    this.ecovacs.connect_and_wait_until_ready();
    this.ping_interval = setInterval(() => {
      this.ecovacs.send_ping(this._vacuum_address());
    }, 30000);
  }

  on(name, func) {
    this.ecovacs.on(name, func);
  }

  _handle_life_span(event) {
    if (event['resultCode'] == '0') {
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
    return;

  }

  _handle_position(event) {
        // Deebot Ozmo 950
        if (event['resultCode'] == '0') {

          //as deebotPos and chargePos can also appear in other messages (CleanReport)
          //the handling should be extracted to a seperate function
          if(event['resultData']['deebotPos']) {
            // check if position changed or currentSpotAreaID unknown
            if(event['resultData']['deebotPos']['x'] != this.deebot_position.x
              || event['resultData']['deebotPos']['y'] != this.deebot_position.y
              || event['resultData']['deebotPos']['a'] != this.deebot_position.a
              || event['resultData']['deebotPos']['invalid'] != this.deebot_position.isInvalid
              || this.deebot_position.currentSpotAreaID == 'unknown'
              )
            {
              let currentSpotAreaID = map.isPositionInSpotArea([[event['resultData']['deebotPos']['x']], event['resultData']['deebotPos']['y']], this.mapSpotAreaInfos[this.currentMapMID]);
              tools.envLog("[VacBot] *** currentSpotAreaID = " + currentSpotAreaID);
              this.deebot_position = {
                x:event['resultData']['deebotPos']['x'], 
                y:event['resultData']['deebotPos']['y'], 
                a:event['resultData']['deebotPos']['a'], 
                isInvalid:event['resultData']['deebotPos']['invalid']==1?true:false,
                currentSpotAreaID: currentSpotAreaID,
                changeFlag: true
              };
              tools.envLog("[VacBot] *** Deebot Position = "
                + 'x=' + this.deebot_position.x
                + ' y=' + this.deebot_position.y
                + ' a=' + this.deebot_position.a
                + ' currentSpotAreaID=' + this.deebot_position.currentSpotAreaID
                + ' isInvalid=' + this.deebot_position.isInvalid
              );
            }
          }
          
          if(event['resultData']['chargePos']) { //is only available in some DeebotPosition messages (e.g. on start cleaning)
            //there can be more than one charging station only handles first charging station
            // check if position changed
            if(event['resultData']['chargePos'][0]['x'] != this.charge_position.x
              || event['resultData']['chargePos'][0]['y'] != this.charge_position.y
              || event['resultData']['chargePos'][0]['a'] != this.charge_position.a
              )
            {
              this.charge_position = { 
                x:event['resultData']['chargePos'][0]['x'], 
                y:event['resultData']['chargePos'][0]['y'], 
                a:event['resultData']['chargePos'][0]['a'],
                changeFlag: true
              };
              tools.envLog("[VacBot] *** Charge Position = "
                + 'x=' + this.charge_position.x
                + ' y=' + this.charge_position.y
                + ' a=' + this.charge_position.a
              );
            }
          }
          return;
        }
        if (!event) {
          tools.envLog("[VacBot] _handle_deebot_position event undefined");
        }
  }
  _handle_fan_speed(event) {
    this.fan_speed = dictionary.FAN_SPEED_FROM_ECOVACS[event['resultData']['speed']];
    //this.fan_speed = event['resultData']['speed'];
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
    if (event['resultCode'] == '0') {
      if (event['resultData']['state'] === 'clean') {
        if (event['resultData']['cleanState']['motionState'] === 'working') {
          this.clean_status = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['cleanState']['type']];
        } else {
          this.clean_status = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['cleanState']['motionState']];
        }
        if (event['resultData']['cleanState']['type'] == 'customArea') {
          this.lastUsedAreaValues = event['resultData']['cleanState']['content'];
        } else {
          this.lastUsedAreaValues = null;
        }
      } else if (event['resultData']['trigger'] === 'alert') {
        this.clean_status = 'alert';
        this.lastUsedAreaValues = null;
      } else {
        this.clean_status = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']];
        if(dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']] == 'returning') { //set charge state on returning to dock
          this.charge_status = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']];
          tools.envLog("[VacBot] *** charge_status = %s", this.charge_status);
        } else if(dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']] == 'idle') {
          //when clean state = idle the bot can be charging on the dock or the return to dock has been canceled
          //if this is not run, the status when canceling the return stays on 'returning'
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
    if (event['resultCode'] == '0') {
      let logs = [];
      if(event['resultData'].hasOwnProperty('logs')) {
        logs = event['resultData']['logs'];
      } else if(event['resultData'].hasOwnProperty('log')) {
        logs = event['resultData']['log'];
      }

      this.cleanLog_lastImageUrl = null;
      this.cleanLog_lastImageTimestamp = null;
      for ( let logIndex in logs) {
        if(!this.cleanLog[logs[logIndex]['id']] ) { //log not yet existing
          let squareMeters = parseInt(logs[logIndex]['area']);
          tools.envLog("[VacBot] cleanLogs %s: %s m2", logIndex, squareMeters);
          let timestamp = parseInt(logs[logIndex]['ts']);
          let date = new Date(timestamp*1000);
          tools.envLog("[VacBot] cleanLogs %s: %s", logIndex, date.toString());
          let len = parseInt(logs[logIndex]['last']);
          let hours = Math.floor(len / 3600);
          let minutes = Math.floor((len % 3600) / 60);
          let seconds = Math.floor(len % 60);
          let totalTimeString = hours.toString() + 'h ' + ((minutes < 10) ? '0' : '') + minutes.toString() + 'm ' + ((seconds < 10) ? '0' : '') + seconds.toString() + 's';
          tools.envLog("[VacBot] cleanLogs %s: %s", logIndex, totalTimeString);
          let imageUrl = logs[logIndex]['imageUrl'];

          if ((!this.cleanLog_lastImageUrl) && (imageUrl)) {
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
    tools.envLog("[VacBot] *** cleanLogs = " + this.cleanLog);
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
    if (event['resultCode'] == '0') {
      
      this.maps = {"maps": []};
      for ( let mapIndex in event['resultData']['info']) {
        this.maps["maps"].push(
          new map.EcovacsMap(
            event['resultData']['info'][mapIndex]['mid'],
            event['resultData']['info'][mapIndex]['index'],
            event['resultData']['info'][mapIndex]['name'],
            event['resultData']['info'][mapIndex]['status'],
            event['resultData']['info'][mapIndex]['using'],
            event['resultData']['info'][mapIndex]['built']
          )
        );
        if (event['resultData']['info'][mapIndex]['using'] == 1) {
          this.currentMapName = event['resultData']['info'][mapIndex]['name'];
          this.currentMapMID = event['resultData']['info'][mapIndex]['mid'];
          this.currentMapIndex = event['resultData']['info'][mapIndex]['index'];
        }
      }
    }
    tools.envLog("[VacBot] *** currentMapName = " + this.currentMapName);
    tools.envLog("[VacBot] *** currentMapMID = " + this.currentMapMID);
    tools.envLog("[VacBot] *** currentMapIndex = " + this.currentMapIndex);
    tools.envLog("[VacBot] *** maps = " + JSON.stringify(this.maps));
  }

  _handle_mapset(event) {
    if (event['resultCode'] == '0') {
      if (event['resultData']['type'] == 'ar') { 
        let mapSpotAreas = new map.EcovacsMapSpotAreas(event['resultData']['mid'], event['resultData']['msid']);
        for ( let mapIndex in event['resultData']['subsets']) {
          mapSpotAreas.push(new map.EcovacsMapSpotArea(event['resultData']['subsets'][mapIndex]['mssid']));
        }
        tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
        return {mapsetEvent: 'MapSpotAreas', mapsetData: mapSpotAreas};
      } else if (event['resultData']['type'] == 'vw') { 
        let mapVirtualWalls = new map.EcovacsMapVirtualWalls(event['resultData']['mid']);
        for ( let mapIndex in event['resultData']['subsets']) {
          mapVirtualWalls.push(new map.EcovacsMapVirtualWalls(event['resultData']['subsets'][mapIndex]['mssid']));
        }
        tools.envLog("[VacBot] *** MapVirtualWalls = " + JSON.stringify(mapVirtualWalls));
        return {mapsetEvent: 'MapVirtualWalls', mapsetData: mapVirtualWalls};
      } else if (event['resultData']['type'] == 'mw') { 
        let mapNoMopZones = new map.EcovacsMapNoMopZones(event['resultData']['mid']);
        for ( let mapIndex in event['resultData']['subsets']) {
          mapNoMopZones.push(new map.EcovacsMapNoMopZones(event['resultData']['subsets'][mapIndex]['mssid']));
        }
        tools.envLog("[VacBot] *** MapNoMopZones = " + JSON.stringify(mapNoMopZones));
        return {mapsetEvent: 'MapNoMopZones', mapsetData: mapNoMopZones};
      }

      tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event['resultData']['type']));
      return {mapsetEvent: 'error'};
    }
  }

  _handle_mapsubset(event) {
    if (event['resultCode'] == '0') {
      if (event['resultData']['type'] == 'ar') { 
        let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
          //TODO: filter out reportMapSubSet events (missing data)
          //reportMapSubSet event comes without map reference, replace
          event['resultData']['mid']==undefined ? this.currentMapMID : event['resultData']['mid'],  
          event['resultData']['mssid'], 
          event['resultData']['connections'], //reportMapSubSet event comes without connections
          event['resultData']['value'], 
          event['resultData']['subtype']
        );
        if(typeof this.mapSpotAreaInfos[event['resultData']['mid']] === 'undefined') {
          tools.envLog("[VacBot] *** initialize mapSpotAreaInfos for map " + event['resultData']['mid']);
          this.mapSpotAreaInfos[event['resultData']['mid']] = []; //initialize array for mapSpotAreaInfos if not existing
        }
        this.mapSpotAreaInfos[event['resultData']['mid']][event['resultData']['mssid']] = mapSpotAreaInfo;
        tools.envLog("[VacBot] *** MapSpotAreaInfosArray for map " + event['resultData']['mid'] + " = " + JSON.stringify(this.mapSpotAreaInfos[event['resultData']['mid']]));
        tools.envLog("[VacBot] *** MapSpotAreaInfo = " + JSON.stringify(this.mapSpotAreaInfos[event['resultData']['mid']][event['resultData']['mssid']]));
        return {mapsubsetEvent: 'MapSpotAreaInfo', mapsubsetData: mapSpotAreaInfo};
      } else if (event['resultData']['type'] == 'vw') { 
        let mapVirtualWallInfo = new map.EcovacsMapVirtualWallInfo(event['resultData']['mid'], event['resultData']['mssid'], event['resultData']['value']);
        tools.envLog("[VacBot] *** MapVirtualWallInfo = " + JSON.stringify(mapVirtualWallInfo));
        return {mapsubsetEvent: 'MapVirtualWallInfo', mapsubsetData: mapVirtualWallInfo};
      } else if (event['resultData']['type'] == 'mw') { 
        let mapNoMopZoneInfo = new map.EcovacsMapNoMopZoneInfo(event['resultData']['mid'], event['resultData']['mssid'], event['resultData']['value']);
        tools.envLog("[VacBot] *** MapNoMopZoneInfo = " + JSON.stringify(mapNoMopZoneInfo));
        return {mapsubsetEvent: 'MapNoMopZoneInfo', mapsubsetData: mapNoMopZoneInfo};
      }

      tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event['resultData']['type']));
      return {mapsubsetEvent: 'error'};
    }
  }

  _handle_water_info(event) {
    this.water_level = event['resultData']['amount'];
    this.waterbox_info = event['resultData']['enable'];
    tools.envLog("[VacBot] *** waterbox_info = " + this.waterbox_info);
    tools.envLog("[VacBot] *** water_level = " + this.water_level);
  }

  _handle_charge_state(event) {
    if (event.hasOwnProperty('resultData')) {
      let status = null;
      if (event['resultCode'] == '0') {
        if (event['resultData']['isCharging'] == '1') {
          status = 'charging';
        } else if (event['resultData']['isCharging'] == '0') {
          status = 'idle';
        }
      }
      if (status) {
        this.charge_status = status;
      }
      return;
    } else {
      tools.envLog("[VacBot] couldn't parse charge status ", event);
    }
  }

  _handle_sleep_status(event) {
    this.sleep_status = event['resultData']['enable']
    tools.envLog("[VacBot] *** sleep_status = " + this.sleep_status);
  }

  _handle_error(event) {
    
    this.errorCode = event['resultData']['code'].toString();

    if (errorCodes[this.errorCode]) { // known errorCode from library
      this.errorDescription = errorCodes[this.errorCode];
    } else {
      this.errorDescription = 'unknown errorCode: ' + this.errorCode;
    }
    tools.envLog("[VacBot] *** errorCode = " + this.errorCode);
    tools.envLog("[VacBot] *** errorDescription = " + this.errorDescription);
  }

  _vacuum_address() {
    if (!this.useMqtt) {
      return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
    } else {
      return this.vacuum['did'];
    }
  }

  send_command(action) {
    tools.envLog("[VacBot] Sending command `%s`", action.name);
    // IOTMQ issues commands via RestAPI, and listens on MQTT for status updates
    // IOTMQ devices need the full action for additional parsing
    this.ecovacs.send_command(action, this._vacuum_address());
  }

  send_ping() {
    try {
      if (!this.ecovacs.send_ping()) {
        throw new Error("Ping did not reach VacBot");
      }
    } catch (e) {
      throw new Error("Ping did not reach VacBot");
    }
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
        } else if (arguments.length == 3) {
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
        if (arguments.length < 2) {
          this.send_command(new vacBotCommand.GetCleanLogs());
        } else {
          this.send_command(new vacBotCommand.GetCleanLogs(arguments[1]));
        }
        break;
    }
  
  }

  disconnect() {
    this.ecovacs.disconnect();
    this.is_ready = false;
  }
}

module.exports = VacBot_950type;