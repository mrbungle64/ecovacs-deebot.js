const dictionary = require('./ecovacsConstants_non950type');
const constants = require('./ecovacsConstants.js');
const vacBotCommand = require('./vacBotCommand_non950type');
const errorCodes = require('./errorCodes');
const tools = require('./tools');
const map = require('./mapTemplate.js');

class VacBot_non950type {
  constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
    this.vacuum = vacuum;
    this.cleanReport = null;
    this.is_ready = false;
    this.deebotPosition = {
      x: null,
      y: null,
      a: null,
      isInvalid: false,
      currentSpotAreaID: 'unknown',
      changeFlag: false
    };
    this.chargePosition = {
      x: null,
      y: null,
      a: null
    };
    this.lastUsedAreaValues = null;
    this.cleanSpeed = null;
    this.chargeStatus = null;
    this.batteryInfo = null;
    this.waterLevel = null;
    this.dustcaseInfo = null;
    this.waterboxInfo = null;
    this.sleepStatus = null;
    this.components = {};
    this.ping_interval = null;
    this.errorCode = '0';
    this.errorDescription = errorCodes[this.errorCode];
    this.netInfoIP = null;
    this.netInfoWifiSSID = null;
    this.cleanSum_totalSquareMeters = null;
    this.cleanSum_totalSeconds = null;
    this.cleanSum_totalNumber = null;
    // OnOff
    this.doNotDisturbEnabled = null;
    this.continuousCleaningEnabled = null;
    this.voiceReportDisabled = null;

    this.ecovacs = null;
    this.useMqtt = (vacuum['company'] === 'eco-ng') ? true : false;
    this.deviceClass = vacuum['class'];
    this.deviceModel = this.deviceClass;
    this.deviceImageURL = '';
    if (constants.EcoVacsHomeProducts[this.deviceClass]) {
      this.deviceModel = constants.EcoVacsHomeProducts[this.deviceClass]['product']['name'];
      this.deviceImageURL = constants.EcoVacsHomeProducts[this.deviceClass]['product']['iconUrl'];
    }

    this.currentMapName = 'standard';
    this.currentMapMID = null;
    this.currentMapIndex = 0;

    this.maps = null;
    this.mapSpotAreaInfos = [];
    this.getMapSetExecuted = false;

    this.cleanLog = [];
    this.cleanLog_lastImageUrl = null;
    this.cleanLog_lastImageTimestamp = null;

    if (!this.useMqtt) {
      tools.envLog("[VacBot] Using EcovacsXMPP");
      const EcovacsXMPP = require('./ecovacsXMPP.js');
      this.ecovacs = new EcovacsXMPP(this, user, hostname, resource, secret, continent, country, vacuum, server_address);
    } else {
      tools.envLog("[VacBot] Using EcovacsIOTMQ");
      const EcovacsMQTT = require('./ecovacsMQTT.js');
      this.ecovacs = new EcovacsMQTT(this, user, hostname, resource, secret, continent, country, vacuum, server_address);
    }

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

  hasEdgeCleaningMode() {
    return (!this.hasSpotAreaCleaningMode());
  }

  hasSpotCleaningMode() {
    return (!this.hasSpotAreaCleaningMode());
  }

  hasSpotAreaCleaningMode() {
    return this.getDeviceProperty('spot_area');
  }

  // Deprecated
  hasSpotAreas() {
    return this.hasSpotAreaCleaningMode();
  }

  hasCustomAreaCleaningMode() {
    return this.getDeviceProperty('custom_area');
  }

  // Deprecated
  hasCustomAreas() {
    return this.hasCustomAreaFeature();
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

  _handle_lifeSpan(event) {
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
    if ((event.hasOwnProperty('val')) && (event.hasOwnProperty('total'))) {
      // DEEBOT N79S/SE (deviceClass 155)
      // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/80
      // DEEBOT N79T/W (deviceClass 165)
      // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/58
      if ((this.deviceClass === '155') || (this.deviceClass === '165')) {
        lifespan = parseInt(event['val']);
      } else {
        lifespan = parseInt(event['val']) / parseInt(event['total']) * 100;
      }
    } else if (event.hasOwnProperty('val')) {
      lifespan = parseInt(event['val']) / 100;
    } else if (event.hasOwnProperty('left') && (event.hasOwnProperty('total'))) {
      lifespan = parseInt(event['left']) / parseInt(event['total']) * 100; // This works e.g. for a Ozmo 930
    } else if (event.hasOwnProperty('left')) {
      lifespan = parseInt(event['left']) / 60; // This works e.g. for a D901
    }
    if (lifespan) {
      tools.envLog("[VacBot] lifeSpan %s: %s", type, lifespan);
      this.components[type] = lifespan;
    }
    tools.envLog("[VacBot] lifespan components: ", JSON.stringify(this.components));
  }

  _handle_netInfo(event) {
    if (event.hasOwnProperty('wi')) {
      this.netInfoIP = event['wi'];
      tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
    }
    if (event.hasOwnProperty('s')) {
      this.netInfoWifiSSID = event['s'];
      tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
    }
  }

  _handle_cleanReport(event) {
    if (event.attrs) {
      let type = event.attrs['type'];
      if (dictionary.CLEAN_MODE_FROM_ECOVACS[type]) {
        type = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
      }
      let statustype = null;
      if (event.attrs['st']) {
        statustype = dictionary.CLEAN_ACTION_FROM_ECOVACS[event.attrs['st']];
      }
      else if (event.attrs['act']) {
        statustype = dictionary.CLEAN_ACTION_FROM_ECOVACS[event.attrs['act']];
      }
      if (statustype === 'stop' || statustype === 'pause') {
        type = statustype
      }
      this.cleanReport = type;
      tools.envLog("[VacBot] *** cleanStatus = " + this.cleanReport);

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

  _handle_cleanSpeed(event) {
    if (event.attrs.hasOwnProperty('speed')) {
      let fan = event.attrs['speed'];
      if (dictionary.FAN_SPEED_FROM_ECOVACS[fan]) {
        fan = dictionary.FAN_SPEED_FROM_ECOVACS[fan];
        this.cleanSpeed = fan;
        tools.envLog("[VacBot] cleanSpeed: ", fan);
      } else {
        tools.envLog("[VacBot] Unknown clean speed: ", fan);
      }
    } else {
      tools.envLog("[VacBot] couldn't parse clean speed ", event);
    }
  }

  _handle_batteryInfo(event) {
    let value = null;
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

  _handle_waterLevel(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('v'))) {
      this.waterLevel = event.attrs['v'];
      tools.envLog("[VacBot] *** waterLevel = %s", this.waterLevel);
    }
  }

  _handle_mapP(event) {
    if (this.getMapSetExecuted) {
      return;
    }
    this.currentMapMID = event.attrs['i'];
    this.maps = {
      "maps": [
        new map.EcovacsMap(
            event.attrs['i'], 0, this.currentMapName, true, true, true)
      ]
    };
    this.run('GetMapSet');
    this.getMapSetExecuted = true;
    return this.maps;
  }

  _handle_mapSet(event) {
    if (event.attrs['tp'] === 'sa') {
      let mapSpotAreas = new map.EcovacsMapSpotAreas(this.currentMapMID, event.attrs['msid']);
      for (let mapIndex in event.children) {
        if (event.children.hasOwnProperty(mapIndex)) {
          let mid = event.children[mapIndex].attrs['mid'];
          mapSpotAreas.push(new map.EcovacsMapSpotArea(mid));
          this.run('PullM', parseInt(mid), 'sa', this.currentMapMID, mid);
        }
      }
      tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
      return {
        mapsetEvent: 'MapSpotAreas',
        mapsetData: mapSpotAreas
      };
    } else if (event.attrs['tp'] === 'vw') {
      let mapVirtualWalls = new map.EcovacsMapVirtualWalls(this.currentMapMID);
      for (let mapIndex in event.children) {
        if (event.children.hasOwnProperty(mapIndex)) {
          let mid = event.children[mapIndex].attrs['mid'];
          mapVirtualWalls.push(new map.EcovacsMapVirtualWalls(mid));
          this.run('PullM', parseInt(mid), 'vw', this.currentMapMID, mid);
        }
      }
      tools.envLog("[VacBot] *** MapVirtualWalls = " + JSON.stringify(mapVirtualWalls));
      return {
        mapsetEvent: 'MapVirtualWalls',
        mapsetData: mapVirtualWalls
      };
    }

    tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event.attrs['tp']));
    return {
      mapsetEvent: 'error'
    };
  }

  _handle_pullM(event) {
    const id = parseInt(event.attrs['id']) - 999999900;
    const mData = event.attrs['m'];

    tools.envLog("[VacBot] *** _handle_mapsubset " + JSON.stringify(event));
    if (id <= 39) {
      // spot areas ('sa')
      let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
          this.currentMapMID,
          id,
          '', //reportMapSubSet event comes without connections
          mData,
          '0'
      );
      if (typeof this.mapSpotAreaInfos[this.currentMapMID] === 'undefined') {
        tools.envLog("[VacBot] *** initialize mapSpotAreaInfos for map " + this.currentMapMID);
        this.mapSpotAreaInfos[this.currentMapMID] = []; //initialize array for mapSpotAreaInfos if not existing
      }
      this.mapSpotAreaInfos[this.currentMapMID][id] = mapSpotAreaInfo;
      //tools.envLog("[VacBot] *** MapSpotAreaInfosArray for map " + this.currentMapMID + " = " + JSON.stringify(this.mapSpotAreaInfos[this.currentMapMID]));
      tools.envLog("[VacBot] *** MapSpotAreaInfo = " + JSON.stringify(mapSpotAreaInfo));
      return {
        mapsubsetEvent: 'MapSpotAreaInfo',
        mapsubsetData: mapSpotAreaInfo
      };
    } else if (id <= 79) {
      // virtual walls ('vw')
      let mapVirtualWallInfo = new map.EcovacsMapVirtualWallInfo(this.currentMapMID, id, mData);
      tools.envLog("[VacBot] *** MapVirtualWallInfo = " + JSON.stringify(mapVirtualWallInfo));
      return {
        mapsubsetEvent: 'MapVirtualWallInfo',
        mapsubsetData: mapVirtualWallInfo
      };
    }

    tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event.attrs['tp']));
    return {mapsubsetEvent: 'error'};
  }

  _handle_deebotPosition(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('p')) && (event.attrs.hasOwnProperty('a'))) {
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

  _handle_chargePosition(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('p')) && (event.attrs.hasOwnProperty('a'))) {
      this.chargePosition = {
        x: event.attrs['p'].split(",")[0],
        y: event.attrs['p'].split(",")[1],
        a: event.attrs['a']
      };
      tools.envLog("[VacBot] *** chargePosition = %s", JSON.stringify(this.chargePosition));
    }
  }

  _handle_dustcaseInfo(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('st'))) {
      this.dustcaseInfo = event.attrs['st'];
      tools.envLog("[VacBot] *** dustcaseInfo = " + this.dustcaseInfo);
    }
  }

  _handle_waterboxInfo(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('on'))) {
      this.waterboxInfo = event.attrs['on'];
      tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
    }
  }

  _handle_sleepStatus(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('st'))) {
      this.sleepStatus = event.attrs['st'];
      tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
    }
  }

  _handle_chargeState(event) {
    if ((event.attrs) && (event.attrs['type'])) {
      let chargemode = event.attrs['type'];
      if (dictionary.CHARGE_MODE_FROM_ECOVACS[chargemode]) {
        this.chargeStatus = dictionary.CHARGE_MODE_FROM_ECOVACS[chargemode];
        tools.envLog("[VacBot] *** chargeStatus = " + this.chargeStatus);
      } else {
        tools.envLog("[VacBot] Unknown charging status '%s'", chargemode);
      }
    } else {
      tools.envLog("[VacBot] couldn't parse charge status ", event);
    }
  }

  _handle_cleanSum(event) {
    if ((event.attrs) && (event.attrs.hasOwnProperty('a')) && (event.attrs.hasOwnProperty('l')) && (event.attrs.hasOwnProperty('c'))) {
      this.cleanSum_totalSquareMeters = parseInt(event.attrs['a']);
      this.cleanSum_totalSeconds = parseInt(event.attrs['l']);
      this.cleanSum_totalNumber = parseInt(event.attrs['c']);
    }
  }

  _handle_cleanLogs(event) {
    if (event.attrs) {
      let count = event.children.length;
      if (event.attrs.hasOwnProperty('count')) {
        count = parseInt(event.attrs['count']);
      }
      for (let c = 0; c < count; c++) {
        let childElement = event.children[c];
        let timestamp;
        if (childElement.attrs) {
          timestamp = parseInt(childElement.attrs['s']);
        } else {
          timestamp = parseInt(childElement['ts']);
        }
        let key = timestamp + '@' + this.vacuum['resource'];
        if (!this.cleanLog[key]) {
          this.cleanLog[key] = {};
        }
        let id = this.cleanLog[key]['id'];
        let squareMeters = this.cleanLog[key]['squareMeters'];
        let lastTime = this.cleanLog[key]['last'];
        let type = this.cleanLog[key]['type'];
        let imageUrl = this.cleanLog[key]['imageUrl'];
        let stopReason = this.cleanLog[key]['stopReason'];
        let trigger = this.cleanLog[key]['trigger'];
        if (childElement.attrs) {
          timestamp = parseInt(childElement.attrs['s']);
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
          timestamp = parseInt(childElement['ts']);
          squareMeters = parseInt(childElement['area']);
          lastTime = parseInt(childElement['last']);
          type = childElement['type'];
          imageUrl = childElement['imageUrl'];
        }
        let date = new Date(timestamp * 1000);
        let totalTimeString = tools.getTimeString(lastTime);

        if ((c === 0) && (imageUrl)) {
          this.cleanLog_lastImageUrl = imageUrl;
          this.cleanLog_lastImageTimestamp = timestamp;
          tools.envLog("[VacBot] *** cleanLog_lastImageUrl = " + this.cleanLog_lastImageUrl);
          tools.envLog("[VacBot] *** cleanLog_lastImageTimestamp = " + this.cleanLog_lastImageTimestamp);
        }

        this.cleanLog[key] = {
          'id': id,
          'timestamp': timestamp,
          'date': date,
          'lastTime': lastTime,
          'totalTimeString': totalTimeString,
          'squareMeters': squareMeters,
          'imageUrl': imageUrl,
          'stopReason': stopReason,
          'type': type,
          'trigger': trigger
        };
      }
    }
  }

  _handle_onOff(event) {
    tools.envLog("[VacBot] *** _handleOnOff = " + JSON.stringify(event));
    if ((event.attrs.hasOwnProperty('on'))) {
      let id = parseInt(event.attrs.id);
      switch (id) {
        case 999999990:
          this.doNotDisturbEnabled = event.attrs.on;
          tools.envLog("[VacBot] *** doNotDisturbEnabled = " + this.doNotDisturbEnabled);
          break;
        case 999999991:
          this.continuousCleaningEnabled = event.attrs.on;
          tools.envLog("[VacBot] *** continuousCleaningEnabled = " + this.continuousCleaningEnabled);
          break;
        case 999999992:
          this.voiceReportDisabled = event.attrs.on;
          tools.envLog("[VacBot] *** voiceReportDisabled = " + this.voiceReportDisabled);
          break;
      }
    }
  }

  _handle_error(event) {
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

  _vacuum_address() {
    if (!this.useMqtt) {
      return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
    } else {
      return this.vacuum['did'];
    }
  }

  send_command(action) {
    tools.envLog("[VacBot] Sending command `%s`", action.name);
    if (!this.useMqtt) {
      this.ecovacs.send_command(action.to_xml(), this._vacuum_address());
    } else {
      // IOTMQ issues commands via RestAPI, and listens on MQTT for status updates
      // IOTMQ devices need the full action for additional parsing
      this.ecovacs.send_command(action, this._vacuum_address());
    }
  }

  send_ping() {
    try {
      if (!this.useMqtt) {
        this.ecovacs.send_ping(this._vacuum_address());
      } else if (this.useMqtt) {
        if (!this.ecovacs.send_ping()) {
          throw new Error("Ping did not reach VacBot");
        }
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
      case "playsound":
        if (arguments.length <= 1) {
          this.send_command(new vacBotCommand.PlaySound());
        } else if (arguments.length === 2) {
          this.send_command(new vacBotCommand.PlaySound(arguments[1]));
        }
        break;
      case "getdeviceinfo":
      case "deviceinfo":
        this.send_command(new vacBotCommand.GetDeviceInfo());
        break;
      case "getcleanstate":
      case "cleanstate":
        this.send_command(new vacBotCommand.GetCleanState());
        break;
      case "getcleanspeed":
      case "cleanspeed":
        this.send_command(new vacBotCommand.GetCleanSpeed());
        break;
      case "setcleanspeed":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.SetCleanSpeed(arguments[1]));
        break;
      case "getchargestate":
      case "chargestate":
        this.send_command(new vacBotCommand.GetChargeState());
        break;
      case "getbatterystate":
      case "batterystate":
        this.send_command(new vacBotCommand.GetBatteryState());
        break;
      case "getlifespan":
      case "lifespan":
        if (arguments.length < 2) {
          return;
        }
        let component = arguments[1];
        this.send_command(new vacBotCommand.GetLifeSpan(component));
        break;
      case "getwaterlevel":
        this.send_command(new vacBotCommand.GetWaterLevel());
        break;
      case "setwaterlevel":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.SetWaterLevel(arguments[1]));
        break;
      case "getwaterboxinfo":
        this.send_command(new vacBotCommand.GetWaterBoxInfo());
        break;
      case "getfirmwareversion":
        this.send_command(new vacBotCommand.GetFirmwareVersion());
        break;
      case "getnetinfo":
        this.send_command(new vacBotCommand.GetNetInfo());
        break;
      case "getpos":
      case "getposition":
        this.send_command(new vacBotCommand.GetPos());
        break;
      case "getchargepos":
      case "getchargeposition":
      case "getchargerpos":
      case "getchargerposition":
        this.send_command(new vacBotCommand.GetChargerPos());
        break;
      case "getsleepstatus":
        this.send_command(new vacBotCommand.GetSleepStatus());
        break;
      case "getcleansum":
        this.send_command(new vacBotCommand.GetCleanSum());
        break;
      case "getmapset":
        this.send_command(new vacBotCommand.GetMapSet('sa'));
        this.send_command(new vacBotCommand.GetMapSet('vw'));
        break;
      case "getmaps":
        this.send_command(new vacBotCommand.GetMapM());
        break;
      case "pullmp":
        if (arguments.length < 2) {
          return;
        }
        this.send_command(new vacBotCommand.PullMP(arguments[1]));
        break;
      case "pullm":
        if (arguments.length < 5) {
          return;
        }
        this.send_command(new vacBotCommand.PullM(arguments[1], arguments[2], arguments[3], arguments[4]));
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
      case "getlogapicleanlogs":
        this.send_command(new vacBotCommand.GetLogApiCleanLogs());
        break;
      case "getonoff":
        if (arguments.length < 2) {
          this.send_command(new vacBotCommand.GetOnOff());
        } else {
          this.send_command(new vacBotCommand.GetOnOff(arguments[1]));
        }
        break;
      case "setonoff":
        if (arguments.length < 2) {
          this.send_command(new vacBotCommand.SetOnOff());
        } else if (arguments.length < 3) {
          this.send_command(new vacBotCommand.SetOnOff(arguments[1]));
        } else {
          this.send_command(new vacBotCommand.SetOnOff(arguments[1],arguments[2]));
        }
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
    clearInterval(this.ping_interval);
  }
}

module.exports = VacBot_non950type;
