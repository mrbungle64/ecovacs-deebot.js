const constants = require('./ecovacsConstants.js');
const tools = require('./tools');
const errorCodes = require('./errorCodes');
const i18n = require('./i18n');

class VacBot {
    constructor(user, hostname, resource, secret, vacuum, continent, country, server_address = null) {
        this.ecovacs = null;
        this.vacuum = vacuum;
        this.is_ready = false;

        this.pingInterval = null;
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
        this.currentMapIndex = null;
        this.lastUsedAreaValues = null;

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
        this.cleanLog_lastImageTimestamp = null;

        this.netInfoIP = null;
        this.netInfoWifiSSID = null;
        this.netInfoWifiSignal = null;
        this.netInfoMAC = null;

        // OnOff
        this.doNotDisturbEnabled = null;
        this.continuousCleaningEnabled = null;
        this.voiceReportDisabled = null;

        const LibraryForProtocol = this.getLibraryForProtocol();
        this.ecovacs = new LibraryForProtocol(this, user, hostname, resource, secret, continent, country, vacuum, server_address);

        this.ecovacs.on("ready", () => {
            tools.envLog("[VacBot] Ready event!");
            this.is_ready = true;
        });
    }

    connect_and_wait_until_ready() {
        this.ecovacs.connect_and_wait_until_ready();
        this.pingInterval = setInterval(() => {
            this.ecovacs.send_ping(this._vacuum_address());
        }, 30000);
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
            if (!this.ecovacs.send_ping()) {
                throw new Error("Ping did not reach VacBot");
            }
        } catch (e) {
            throw new Error("Ping did not reach VacBot");
        }
    }

    disconnect() {
        this.ecovacs.disconnect();
        this.is_ready = false;
        clearInterval(this.pingInterval)
    }

    getAreaName_i18n(name, languageCode = 'en') {
        return i18n.getSpotAreaName(name, languageCode);
    }
}

module.exports = VacBot;
