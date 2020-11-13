const constants = require('./ecovacsConstants.js');
const tools = require('./tools');

class VacBot {
    constructor(user, hostname, resource, secret, vacuum, continent, country, server_address = null) {
        this.ecovacs = null;
        this.vacuum = vacuum;

        this.pingInterval = null;
        this.useMqtt = this.useMqttProtocol();
        this.deviceClass = vacuum['class'];
        this.deviceModel = this.deviceClass;
        this.deviceImageURL = '';
        if (constants.EcoVacsHomeProducts[this.deviceClass]) {
            this.deviceModel = constants.EcoVacsHomeProducts[this.deviceClass]['product']['name'];
            this.deviceImageURL = constants.EcoVacsHomeProducts[this.deviceClass]['product']['iconUrl'];
        }
        this.errorCode = '0';
        this.components = {};

        this.maps = null;
        this.mapSpotAreaInfos = [];
        this.currentMapName = 'unknown';
        this.currentMapMID = null;
        this.currentMapIndex = null;
        this.lastUsedAreaValues = null;

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
    }

    getLibraryForProtocol() {
        if (this.is950type()) {
            tools.envLog("[VacBot] Using EcovacsIOTMQ");
            return require('./ecovacsMQTT_JSON.js');
        } else if (this.useMqtt) {
            tools.envLog("[VacBot] Using EcovacsIOTMQ");
            return require('./ecovacsMQTT.js');
        } else {
            tools.envLog("[VacBot] Using EcovacsXMPP");
            return require('./ecovacsXMPP.js');
        }
    }

    useMqttProtocol() {
        return (this.vacuum['company'] === 'eco-ng') ? true : false;
    }

    is950type() {
        return tools.is950type(this.deviceClass);
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
        return this.hasCustomAreaCleaningMode();
    }

    hasMoppingSystem() {
        return this.getDeviceProperty('mopping_system');
    }

    hasVoiceReports() {
        return this.getDeviceProperty('voice_report');
    }

    _vacuum_address() {
        if (!this.useMqtt) {
            return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
        } else {
            return this.vacuum['did'];
        }
    }

    send_ping() {
        try {
            if (!this.ecovacs.send_ping()) {
                throw new Error("Ping did not reach VacBot");
            }
        } catch (e) {
            throw new Error("Error while sending ping to VacBot: " + e.toString());
        }
    }

    disconnect() {
        this.ecovacs.disconnect();
        this.is_ready = false;
        clearInterval(this.pingInterval);
    }
}

module.exports = VacBot;
