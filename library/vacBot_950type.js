const   dictionary = require('./ecovacsConstants_950type.js');
const   vacBotCommand = require('./vacBotCommand_950type.js');
const   errorCodes = require('./errorCodes');
const   tools = require('./tools.js');
const   map = require('./mapTemplate.js');

class VacBot_950type {
  constructor(user, hostname, resource, secret, vacuum, continent, server_address = null) {
    this.vacuum = vacuum;
    this.clean_status = null;
    this.deebot_position = {
      x: null,
      y: null,
      a: null,
      invalid: 0
    };
    this.charge_position = {
      x: null,
      y: null,
      a: null
    };
    this.fan_speed = null;
    this.relocation_state = null;
    this.charge_status = null;
    this.battery_status = null;
    this.water_level = null;
    this.waterbox_info = null;
    this.sleep_status = null;
    this.components = {};
    this.ping_interval = null;
    this.error_event = null;
    this.ecovacs = null;
    this.useMqtt = (vacuum['company'] === 'eco-ng') ? true : false;
    this.deviceClass = vacuum['class'];
    this.currentMapName = 'unknown';
    this.currentMapMID = null;
    this.currentMapIndex = null;

    this.maps = null;
    this.mapSpotAreas = null;
    
    this.netInfoIP = null;
    this.netInfoWifiSSID = null;
    this.netInfoWifiSignal = null;
    this.netInfoMAC = null;
    
    this.cleanSum_totalSquareMeters = null;
    this.cleanSum_totalSeconds = null;
    this.cleanSum_totalNumber = null;

    tools.envLog("[VacBot] Using EcovacsIOTMQ_JSON");
    const EcovacsMQTT = require('./ecovacsMQTT_JSON.js');
    this.ecovacs = new EcovacsMQTT(this, user, hostname, resource, secret, continent, vacuum, server_address);


    this.ecovacs.on("ready", () => {
      tools.envLog("[VacBot] Ready event!");
      this.run('GetBatteryState');
      this.run('GetCleanState');
      this.run('GetChargeState');
      if (this.hasMainBrush()) {
        this.run('GetLifeSpan', 'main_brush');
      }
      this.run('GetLifeSpan', 'side_brush');
      this.run('GetLifeSpan', 'filter');
      this.run('GetPosition');
      this.run('GetCleanSpeed');
      this.run('GetNetInfo');
      //this.run('GetCurrentMapName'); //deprecated, processed with GetMapInfo
      this.run('GetMapInfo');
      this.run('GetError');
      this.run('GetSleepStatus');
      
      this.run('GetCleanSum');
      
      if (this.hasMoppingSystem()) {
        this.run('GetWaterLevel');
      }
      
    });
  }

  // isOzmo950() {
  //   tools.envLog("[VacBot] deviceClass: %s", this.deviceClass);
  //   if (this.deviceClass === 'yna5xi') {
  //     tools.envLog("[VacBot] Ozmo 950 detected");
  //     return true;
  //   }
  //   return false;
  // }

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
          console.error("[VacBot] Unknown component type: ", event);
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
            this.deebot_position = {
              x:event['resultData']['deebotPos']['x'], 
              y:event['resultData']['deebotPos']['y'], 
              a:event['resultData']['deebotPos']['a'], 
              invalid:event['resultData']['deebotPos']['invalid']
            };
            tools.envLog("[VacBot] *** Deebot Position = "
              + 'x=' + this.deebot_position.x
              + ' y=' + this.deebot_position.y
              + ' a=' + this.deebot_position.a
              + ' invalid=' + this.deebot_position.invalid
            );
          }
          
          if(event['resultData']['chargePos']) { //is only available in some DeebotPosition messages (e.g. on start cleaning)
            //there can be more than one charging station only handles first charging station
            this.charge_position = { 
              x:event['resultData']['chargePos'][0]['x'], 
              y:event['resultData']['chargePos'][0]['y'], 
              a:event['resultData']['chargePos'][0]['a']
            };
            tools.envLog("[VacBot] *** Charge Position = "
              + 'x=' + this.charge_position.x
              + ' y=' + this.charge_position.y
              + ' a=' + this.charge_position.a
            );
          }
          return;
        }
        if (!event) {
          console.error("[VacBot] _handle_deebot_position event undefined");
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
      } else if (event['resultData']['trigger'] === 'alert') {
        this.clean_status = 'alert';
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
      }
    } else {
      this.clean_status = 'error';
    }
    tools.envLog("[VacBot] *** clean_status = %s", this.clean_status);
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
      
      this.maps = [];
      for ( let mapIndex in event['resultData']['info']) {
        this.maps.push(
          new map.EcovacsMap(
            event['resultData']['info'][mapIndex]['mid'],
            event['resultData']['info'][mapIndex]['index'],
            event['resultData']['info'][mapIndex]['name'],
            event['resultData']['info'][mapIndex]['status'],
            event['resultData']['info'][mapIndex]['using'],
            event['resultData']['info'][mapIndex]['built']
          )
        );

        this.send_command(new vacBotCommand.GetMapSpotAreas(event['resultData']['info'][mapIndex]['mid']));

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
          
          //this.send_command(new vacBotCommand.GetMapSpotAreaInfo(event['resultData']['subsets'][mapIndex]['mssid']));

        }
        tools.envLog("[VacBot] *** mapSpotAreas = " + JSON.stringify(mapSpotAreas));
        return mapSpotAreas;
      }
      tools.envLog("[VacBot] *** mapset type = " + JSON.stringify(event['resultData']['type']));
      return event['resultData']['type'];
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
      console.error("[VacBot] couldn't parse charge status ", event);
    }
  }

  _handle_sleep_status(event) {
    this.sleep_status = event['resultData']['enable']
    tools.envLog("[VacBot] *** sleep_status = " + this.sleep_status);
  }

  _handle_error(event) {
    
    let errorCode = event['resultData']['code'];

    // NoError: Robot is operational
    if (errorCode == '0') {
      this.error_event = '';
      return;
    } else if (errorCodes[errorCode]) { // known errorCode from library
      this.error_event = errorCodes[errorCode];
    } else {
      this.error_event = 'unknown errorCode: ' + errorCode;
    }
    tools.envLog("[VacBot] *** error_event = " + this.error_event);
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
      case "getcurrentmapname":
      case "getmapinfo":
        this.send_command(new vacBotCommand.GetMapInfo());
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
    }
  
  }

  disconnect() {
    this.ecovacs.disconnect();
  }
}

module.exports = VacBot_950type;