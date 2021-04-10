const constants = require('./ecovacsConstants.js');
const tools = require('./tools');
const errorCodes = require('./errorCodes');
const i18n = require('./i18n');

class VacBot {
    constructor(user, hostname, resource, secret, vacuum, continent, country, server_address = null) {
        this.ecovacs = null;
        this.vacuum = vacuum;
        this.is_ready = false;

        this.useMqtt = this.useMqttProtocol();
        this.deviceClass = vacuum['class'];
        this.deviceModel = this.deviceClass;
        this.deviceImageURL = '';
        if (constants.EcoVacsHomeProducts[this.deviceClass]) {
            this.deviceModel = constants.EcoVacsHomeProducts[this.deviceClass]['product']['name'];
            this.deviceImageURL = constants.EcoVacsHomeProducts[this.deviceClass]['product']['iconUrl'];
        }
        this.components = {};
        this.errorCode = '0';
        this.errorDescription = errorCodes[this.errorCode];

        this.maps = null;
        this.mapVirtualBoundaries = [];
        this.mapVirtualBoundariesResponses = []; // response from vw, mw per mapID
        this.mapSpotAreaInfos = [];
        this.mapVirtualBoundaryInfos = [];
        this.currentMapName = 'unknown';
        this.currentMapMID = null;
        this.currentMapIndex = 0;
        this.lastUsedAreaValues = null;

        this.batteryInfo = null;
        this.batteryIsLow = null;
        this.cleanReport = null;
        this.chargeStatus = null;
        this.cleanSpeed = null;
        this.waterLevel = null;
        this.waterboxInfo = null;
        this.sleepStatus = null;

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
            a: null,
            changeFlag: false
        };

        this.cleanSum_totalSquareMeters = null;
        this.cleanSum_totalSeconds = null;
        this.cleanSum_totalNumber = null;

        this.cleanLog = [];
        this.cleanLog_lastImageUrl = null;
        this.cleanLog_lastTimestamp = null;
        this.cleanLog_lastTotalTime = null;
        this.cleanLog_lastTotalTimeString = null;
        this.cleanLog_lastSquareMeters = null;

        this.currentStats = null;

        this.netInfoIP = null;
        this.netInfoWifiSSID = null;
        this.netInfoWifiSignal = null;
        this.netInfoMAC = null;

        // OnOff
        this.doNotDisturbEnabled = null;
        this.continuousCleaningEnabled = null;
        this.voiceReportDisabled = null;

        this.commandsSent = [];

        const LibraryForProtocol = this.getLibraryForProtocol();
        this.ecovacs = new LibraryForProtocol(this, user, hostname, resource, secret, continent, country, vacuum, server_address);

        this.ecovacs.on("ready", () => {
            tools.envLog("[VacBot] Ready event!");
            this.is_ready = true;
        });
    }

    // Deprecated but keep this method for now
    connect_and_wait_until_ready() {
        this.connect();
    }

    connect() {
        this.ecovacs.connect();
    }

    on(name, func) {
        this.ecovacs.on(name, func);
    }

    getLibraryForProtocol() {
        if (this.is950type()) {
            tools.envLog("[VacBot] Using ecovacsMQTT_JSON");
            return require('./ecovacsMQTT_JSON.js');
        } else if (this.useMqtt) {
            tools.envLog("[VacBot] Using EcovacsMQTT_XML");
            return require('./ecovacsMQTT_XML.js');
        } else {
            tools.envLog("[VacBot] Using ecovacsXMPP");
            return require('./ecovacsXMPP.js');
        }
    }

    useMqttProtocol() {
        return (this.vacuum['company'] === 'eco-ng') ? true : false;
    }

    is950type() {
        return this.getDeviceProperty('950type');
    }

    isNot950type() {
        return (!this.is950type());
    }

    isN79series() {
        return tools.isN79series(this.deviceClass);
    }

    isSupportedDevice() {
        return tools.isSupportedDevice(this.deviceClass);
    }

    isKnownDevice() {
        return tools.isKnownDevice(this.deviceClass);
    }

    getDeviceProperty(property) {
        return tools.getDeviceProperty(this.deviceClass, property);
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
        return this.hasCustomAreaCleaningMode();
    }

    hasMoppingSystem() {
        return this.getDeviceProperty('mopping_system');
    }

    hasVoiceReports() {
        return this.getDeviceProperty('voice_report');
    }

    hasAutoEmptyStation() {
        return this.getDeviceProperty('auto_empty_station');
    }

    getVacBotDeviceId() {
        if (!this.useMqtt) {
            return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
        } else {
            return this.vacuum['did'];
        }
    }

    sendCommand(action) {
        if (!this.is950type()) {
            this.commandsSent[action.getId()] = action;
        }
        if (!this.useMqtt) {
            tools.envLog("[VacBot] Sending command `%s` with id %s", action.name, action.getId());
            this.ecovacs.sendCommand(action.to_xml(), this.getVacBotDeviceId());
        } else {
            tools.envLog("[VacBot] Sending command `%s`", action.name);
            // IOTMQ issues commands via RestAPI, and listens on MQTT for status updates
            // IOTMQ devices need the full action for additional parsing
            this.ecovacs.sendCommand(action, this.getVacBotDeviceId());
        }
    }

    // Deprecated
    sendPing() {
        this.ecovacs.sendPing();
    }

    disconnect() {
        this.ecovacs.disconnect();
        this.is_ready = false;
    }

    getAreaName_i18n(name, languageCode = 'en') {
        return i18n.getSpotAreaName(name, languageCode);
    }
}

module.exports = VacBot;
