const EventEmitter = require('events');
const tools = require('./tools');

exports = String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    let args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class Ecovacs extends EventEmitter {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port) {
        super();

        this.bot = bot;
        this.dictionary = this.getDictionary();
        this.user = user;
        this.hostname = hostname;
        this.resource = resource;
        this.secret = secret;
        this.continent = continent;
        this.country = country;
        this.vacuum = vacuum;

        if (!server_address) {
            let prefix = this.bot.useMqtt ? 'mq' : 'msg';
            let mainUrl = '{prefix}-{continent}.ecouser.net';
            if (this.country.toLowerCase() === 'cn') {
                mainUrl = '{prefix}.ecouser.net';
            }
            this.server_address = mainUrl.format({
                prefix: prefix,
                continent: continent
            });
        } else {
            this.server_address = server_address;
        }
        this.server_port = server_port;
    }

    session_start(event) {
        this.emit("ready", event);
    }

    getDictionary() {
        if (this.bot.is950type()) {
            return require('./ecovacsConstants_950type.js');
        } else {
            return require('./ecovacsConstants_non950type.js');
        }
    }

    handleCommand(command, event) {
        switch (tools.getEventNameForCommandString(command)) {
            case "CleanSt":
                this.bot.handle_stats(event);
                if (this.bot.currentStats) {
                    this.emit("CurrentStats", this.bot.currentStats);
                    this.bot.currentStats = null;
                }
                break;
            case 'ChargeState':
                this.bot.handle_chargeState(event.children[0]);
                this.emit('ChargeState', this.bot.chargeStatus);
                break;
            case 'BatteryInfo':
                this.bot.handle_batteryInfo(event.children[0]);
                this.emit('BatteryInfo', this.bot.batteryInfo);
                break;
            case 'CleanReport':
                if (event.children && (event.children.length > 0)) {
                    this.bot.handle_cleanReport(event.children[0]);
                } else {
                    this.bot.handle_cleanReport(event);
                }
                this.emit('CleanReport', this.bot.cleanReport);
                if (this.bot.lastUsedAreaValues) {
                    this.emit("LastUsedAreaValues", this.bot.lastUsedAreaValues);
                }
                break;
            case "CleanSpeed":
                if (event.children && (event.children.length > 0)) {
                    this.bot.handle_cleanSpeed(event.children[0]);
                } else {
                    this.bot.handle_cleanSpeed(event);
                }
                this.emit("CleanSpeed", this.bot.cleanSpeed);
                break;
            case "RelocationState":
                this.bot.handle_relocationState(event);
                this.emit("RelocationState", this.bot.relocationState);
                break;
            case 'LifeSpan':
                this.bot.handle_lifespan(event.attrs);
                const component = this.dictionary.COMPONENT_FROM_ECOVACS[event.attrs.type];
                if (component) {
                    if (this.bot.components[component]) {
                        this.emit('LifeSpan_' + component, this.bot.components[component]);
                    }
                }
                break;
            case 'DeebotPosition':
                this.bot.handle_deebotPosition(event);
                if (this.bot.deebotPosition["x"] && this.bot.deebotPosition["y"]) {
                    this.emit('DeebotPosition', this.bot.deebotPosition["x"] + "," + this.bot.deebotPosition["y"] + "," + this.bot.deebotPosition["a"]);
                    this.emit("DeebotPositionCurrentSpotAreaID", this.bot.deebotPosition["currentSpotAreaID"]);
                    this.emit('Position', {
                        'coords': this.bot.deebotPosition['x'] + "," + this.bot.deebotPosition['y'] + "," + this.bot.deebotPosition['a'],
                        'x': this.bot.deebotPosition['x'],
                        'y': this.bot.deebotPosition['y'],
                        'a': this.bot.deebotPosition['a'],
                        'invalid': 0,
                        'spotAreaID': this.bot.deebotPosition["currentSpotAreaID"]
                    });
                }
                break;
            case 'ChargePosition':
                this.bot.handle_chargePosition(event);
                this.emit('ChargePosition', this.bot.chargePosition["x"] + "," + this.bot.chargePosition["y"] + "," + this.bot.chargePosition["a"]);
                this.emit('ChargingPosition', {
                    'coords': this.bot.chargePosition['x'] + "," + this.bot.chargePosition['y'] + "," + this.bot.chargePosition['a'],
                    'x': this.bot.deebotPosition['x'],
                    'y': this.bot.deebotPosition['y'],
                    'a': this.bot.deebotPosition['a']
                });
                break;
            case 'WaterLevel':
                this.bot.handle_waterLevel(event);
                this.emit('WaterLevel', this.bot.waterLevel);
                break;
            case 'WaterBoxInfo':
                this.bot.handle_waterboxInfo(event);
                this.emit('WaterBoxInfo', this.bot.waterboxInfo);
                break;
            case 'NetInfo':
                this.bot.handle_netInfo(event.attrs);
                this.emit("NetInfoIP", this.bot.netInfoIP);
                this.emit("NetInfoWifiSSID", this.bot.netInfoWifiSSID);
                this.emit("NetworkInfo", {
                    'ip': this.bot.netInfoIP,
                    'mac': null,
                    'wifiSSID': this.bot.netInfoWifiSSID,
                    'wifiSignal': null,
                });
                break;
            case 'SleepStatus':
                this.bot.handle_sleepStatus(event);
                this.emit("SleepStatus", this.bot.sleepStatus);
                break;
            case 'Error':
                this.bot.handle_error(event.attrs);
                this.emit('Error', this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
                this.emit('LastError', {
                    'error': this.bot.errorDescription,
                    'code': this.bot.errorCode
                });
                break;
            case 'CleanSum':
                this.bot.handle_cleanSum(event);
                this.emit("CleanSum_totalSquareMeters", this.bot.cleanSum_totalSquareMeters);
                this.emit("CleanSum_totalSeconds", this.bot.cleanSum_totalSeconds);
                this.emit("CleanSum_totalNumber", this.bot.cleanSum_totalNumber);
                this.emit('CleanSum', {
                    'totalSquareMeters': this.bot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.bot.cleanSum_totalSeconds,
                    'totalNumber': this.bot.cleanSum_totalNumber,
                });
                break;
            case 'CleanLogs':
                this.bot.handle_cleanLogs(event);
                let cleanLog = [];
                for (let i in this.bot.cleanLog) {
                    if (this.bot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.bot.cleanLog[i]);
                        tools.envLog("[EcovacsXMPP] Logs: %s", JSON.stringify(this.bot.cleanLog[i]));
                    }
                }
                if (cleanLog.length) {
                    this.emit("CleanLog", cleanLog.reverse());
                    this.emit("CleanLog_lastTimestamp", this.bot.cleanLog_lastTimestamp);
                    this.emit("CleanLog_lastSquareMeters", this.bot.cleanLog_lastSquareMeters);
                    this.emit("CleanLog_lastTotalTimeString", this.bot.cleanLog_lastTotalTimeString);
                    this.emit('LastCleanLogs', {
                        'timestamp': this.bot.cleanLog_lastTimestamp,
                        'squareMeters': this.bot.cleanLog_lastSquareMeters,
                        'totalTimeString': this.bot.cleanLog_lastTotalTimeString,
                        'imageUrl': this.bot.cleanLog_lastImageUrl
                    });
                }
                if (this.bot.cleanLog_lastImageUrl) {
                    this.emit("CleanLog_lastImageUrl", this.bot.cleanLog_lastImageUrl);
                    this.emit("CleanLog_lastImageTimestamp", this.bot.cleanLog_lastTimestamp); // Deprecated
                }
                break;
            case "CachedMapInfo":
                let mapinfo = this.bot.handle_cachedMapInfo(event);
                if (mapinfo) {
                    this.emit("CurrentMapName", this.bot.currentMapName);
                    this.emit("CurrentMapMID", this.bot.currentMapMID);
                    this.emit("CurrentMapIndex", this.bot.currentMapIndex);
                    this.emit("Maps", this.bot.maps);
                }
                break;
            case "MapSet":
                let mapset = this.bot.handle_mapSet(event);
                if (mapset["mapsetEvent"] !== 'error') {
                    this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                }
                break;
            case "MapSubSet":
                let mapsubset = this.bot.handle_mapSubset(event);
                if (mapsubset && (mapsubset["mapsubsetEvent"] !== 'error')) {
                    this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                }
                break;
            case 'DustCaseST':
                this.bot.handle_dustcaseInfo(event);
                this.emit('DustCaseInfo', this.bot.dustcaseInfo);
                break;
            case 'OnOff':
                this.bot.handle_onOff(event);
                if (this.bot.doNotDisturbEnabled) {
                    this.emit("DoNotDisturbEnabled", this.bot.doNotDisturbEnabled);
                }
                if (this.bot.continuousCleaningEnabled) {
                    this.emit("ContinuousCleaningEnabled", this.bot.continuousCleaningEnabled);
                }
                if (this.bot.voiceReportDisabled) {
                    this.emit("VoiceReportDisabled", this.bot.voiceReportDisabled);
                }
                break;
            default:
                tools.envLog('[EcovacsXMPP] Unknown response type received: %s', JSON.stringify(event));
                break;
        }
    }
}

module.exports = Ecovacs;
