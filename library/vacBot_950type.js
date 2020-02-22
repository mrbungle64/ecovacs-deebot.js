const   constants_type = require('./ecovacsConstants_950type.js');
const   vacBotCommand = require('./vacBotCommand_950type.js');

const   tools = require('./tools.js');

class VacBot_950type {
  constructor(user, hostname, resource, secret, vacuum, continent, server_address = null) {
    this.vacuum = vacuum;
    this.vacuum_status = null;
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
    this.components = {};
    this.ping_interval = null;
    this.error_event = null;
    this.ecovacs = null;
    this.useMqtt = (vacuum['company'] === 'eco-ng') ? true : false;
    this.deviceClass = vacuum['class'];

    
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
      //this.run('relocate');
      if (this.hasMoppingSystem()) {
        this.run('GetWaterInfo');
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
          type = constants_type.COMPONENT_FROM_ECOVACS[type];
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
          if(event['resultData']['deebotPos'] && event['resultData']['deebotPos']['invalid']===0) {
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
  _handle_clean_speed(event) {
    this.fan_speed = constants_type.FAN_SPEED_FROM_ECOVACS[event['resultData']['speed']];
    tools.envLog("[VacBot] *** fan_speed = %s", this.fan_speed);
  }

  _handle_clean_info(event) {
    this.vacuum_status = 'unknown';
    tools.envLog("[VacBot] _handle_clean_info");

    if (event['resultCode'] == '0') {
      if (event['resultData']['state'] === 'clean') {
        if (event['resultData']['trigger'] === 'app') {
          if (event['resultData']['cleanState']['motionState'] === 'working') {
            this.vacuum_status = 'cleaning';
          } else if (event['resultData']['cleanState']['motionState'] === 'pause') {
            this.vacuum_status = 'paused';
          } else {
            this.vacuum_status = 'returning';
          }
        } else if (event['resultData']['trigger'] === 'alert') {
          this.vacuum_status = 'alert';
        }
      } else if (event['resultData']['state'] === 'idle') {
        this.vacuum_status = 'idle';
      }
    } else {
      this.vacuum_status = 'error';
    }
    this.clean_status = this.vacuum_status;
    return;

  }

  _handle_battery_info(event) {
    this.battery_status = event['resultData']['value'];
    tools.envLog("[VacBot] *** battery_status = %d\%", this.battery_status);
  }

  _handle_water_level(event) {
    this.water_level = event['resultData']['amount'];
    tools.envLog("[VacBot] *** water_level = " + constants_type.WATER_LEVEL_FROM_ECOVACS[this.water_level] + " (" + this.water_level + ")");
  }
  _handle_relocationState(event) {
    this.relocation_state = event['resultData']['state'];
    tools.envLog("[VacBot] *** relocation_state = " + this.relocation_state);
  }

  _handle_water_info(event) {
    this.water_level = event['resultData']['amount'];
    this.waterbox_info = event['resultData']['enable'];
    tools.envLog("[VacBot] *** waterbox_info = " + this.waterbox_info);
    tools.envLog("[VacBot] *** water_level = " + constants_type.WATER_LEVEL_FROM_ECOVACS[this.water_level] + " (" + this.water_level + ")");
  }

  _handle_charge_state(event) { //has to be checked
    if (event.hasOwnProperty('resultData')) {
      let status = null;
      if (event['resultCode'] == '0') {
        if (event['resultData']['isCharging'] == '1') {
          status = 'docked';
        } else if (event['resultData']['isCharging'] == '0') {
          status = 'not charging';
        }
      } else {
        if ((event['resultCodeMessage'] === 'fail') && (event['resultCode'] == '30007')) {
          // Already charging
          status = 'docked';
        } else if ((event['resultCodeMessage'] === 'fail') && (event['resultCode'] == '5')) {
          // Busy with another command
          status = 'error';
        } else if ((event['resultCodeMessage'] === 'fail') && (event['resultCode'] == '3')) {
          // Bot in stuck state, example dust bin out
          status = 'error';
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

  _handle_error(event) {
    if (event.hasOwnProperty('error')) {
      this.error_event = event['error'];
    } else if (event.hasOwnProperty('errs')) {
      this.error_event = event['errs'];
    }
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
        }
        this.send_command(new vacBotCommand.SpotArea(arguments[1], arguments[2]));
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
        this.send_command(new vacBotCommand.PlaySound());
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
      case "getchargestate":
        this.send_command(new vacBotCommand.GetChargeState());
        break;
      case "getbatterystate":
        this.send_command(new vacBotCommand.GetBatteryState());
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
      case "setwaterlevel":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.SetWaterLevel(arguments[1]));
        break;
    }
  
  }

  disconnect() {
    this.ecovacs.disconnect();
  }
}

module.exports = VacBot_950type;