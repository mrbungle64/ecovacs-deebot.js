'use strict';

const EventEmitter = require('events');
const tools = require('./tools');
const constants = require('./ecovacsConstants');
const {errorCodes} = require('./errorCodes.json');

class Ecovacs extends EventEmitter {
    /**
     * @param {Object} vacBot - the VacBot object
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} country - the country where the Ecovacs account is registered
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} serverAddress - the address of the MQTT server
     * @param {number} [serverPort=8883] - the port that the MQTT server is listening on
     */
    constructor(vacBot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort) {
        super();

        this.bot = vacBot;
        this.dictionary = this.getEcovacsDictionary();
        this.user = user;
        this.hostname = hostname;
        this.resource = resource;
        this.secret = secret;
        this.country = country.toUpperCase();
        this.continent = continent;
        this.vacuum = vacuum;

        if (!serverAddress) {
            this.serverAddress = this.getEcovacsEndpoint();
        } else {
            this.serverAddress = serverAddress;
        }
        this.serverPort = serverPort;
    }

    /**
     * Get the server address of the Ecovacs endpoint.
     * Different schema for accounts registered in China
     * @returns {string} the endpoint
     */
    getEcovacsEndpoint() {
        const urlPrefix = this.bot.useMqttProtocol() ? 'mq' : 'msg';
        let serverAddress = `${urlPrefix}-${this.continent}.${constants.REALM}`;
        if (this.country === 'CN') {
            serverAddress = `${urlPrefix}.${constants.REALM}`;
        }
        return serverAddress;
    }

    /**
     * Handles the message command and the payload
     * and delegates the event object to the corresponding method
     * @param {string} command - the incoming message command
     * @param {Object} event - the event object received from the Ecovacs API
     * @returns {Promise<void>}
     */
    async handleMessagePayload(command, event) {
        let abbreviatedCmd = command.replace(/^_+|_+$/g, '').replace('Get','').replace('Server', '');
        // Incoming MQTT messages
        if (abbreviatedCmd.startsWith('On') && (abbreviatedCmd !== 'OnOff')) {
            abbreviatedCmd = abbreviatedCmd.substring(2);
        }
        this.emit('messageReceived', command + ' => ' + abbreviatedCmd);
        let payload = event;
        switch (abbreviatedCmd) {
            case 'CleanSt':
                this.bot.handle_stats(payload);
                if (this.bot.currentStats) {
                    this.emit('CurrentStats', this.bot.currentStats);
                    this.bot.currentStats = null;
                }
                break;
            case 'ChargeState':
                payload = event.children[0];
                this.bot.handle_chargeState(payload);
                this.emit('ChargeState', this.bot.chargeStatus);
                break;
            case 'BatteryInfo':
                payload = event.children[0];
                this.bot.handle_batteryInfo(payload);
                if (this.bot.batteryLevel !== undefined) {
                    this.emit('BatteryInfo', this.bot.batteryLevel);
                }
                break;
            case 'CleanState':
            case 'CleanReport':
                if (event.children && (event.children.length > 0)) {
                    payload = event.children[0];
                }
                this.bot.handle_cleanReport(payload);
                this.emit('CleanReport', this.bot.cleanReport);
                if (this.bot.lastUsedAreaValues) {
                    this.emit('LastUsedAreaValues', this.bot.lastUsedAreaValues);
                }
                this.emitMoppingSystemReport();
                break;
            case 'CleanSpeed':
                if (event.children && (event.children.length > 0)) {
                    payload = event.children[0];
                }
                this.bot.handle_cleanSpeed(payload);
                this.emit('CleanSpeed', this.bot.cleanSpeed);
                break;
            case 'RelocationState':
                this.bot.handle_relocationState(payload);
                this.emit('RelocationState', this.bot.relocationState);
                break;
            case 'LifeSpan':
                payload = event.attrs;
                this.bot.handle_lifespan(payload);
                if (!this.bot.emitFullLifeSpanEvent) {
                    const component = this.dictionary.COMPONENT_FROM_ECOVACS[payload.type];
                    if (component) {
                        if (this.bot.components[component]) {
                            this.emit('LifeSpan_' + component, this.bot.components[component]);
                            this.bot.lastComponentValues[component] = this.bot.components[component];
                        }
                    }
                } else {
                    this.handleLifeSpanCombined();
                }
                break;
            case 'Pos':
                // DeebotPosition
                this.bot.handle_deebotPosition(payload);
                if (this.bot.deebotPosition['x'] && this.bot.deebotPosition['y']) {
                    this.emit('DeebotPosition', this.bot.deebotPosition['x'] + ',' + this.bot.deebotPosition['y'] + ',' + this.bot.deebotPosition['a']);
                    this.emit('DeebotPositionCurrentSpotAreaID', this.bot.deebotPosition['currentSpotAreaID']);
                    this.emit("DeebotPositionCurrentSpotAreaName", this.bot.deebotPosition["currentSpotAreaName"]);
                    this.emit('Position', {
                        'coords': this.bot.deebotPosition['x'] + ',' + this.bot.deebotPosition['y'] + ',' + this.bot.deebotPosition['a'],
                        'x': this.bot.deebotPosition['x'],
                        'y': this.bot.deebotPosition['y'],
                        'a': this.bot.deebotPosition['a'],
                        'invalid': 0,
                        'spotAreaID': this.bot.deebotPosition['currentSpotAreaID'],
                        'spotAreaName': this.bot.deebotPosition["currentSpotAreaName"],
                        'distanceToChargingStation': this.bot.deebotPosition["distanceToChargingStation"]
                    });
                }
                break;
            case 'ChargerPos':
                this.bot.handle_chargePosition(payload);
                this.emit('ChargePosition', this.bot.chargePosition['x'] + ',' + this.bot.chargePosition['y'] + ',' + this.bot.chargePosition['a']);
                this.emit('ChargingPosition', {
                    'coords': this.bot.chargePosition['x'] + ',' + this.bot.chargePosition['y'] + ',' + this.bot.chargePosition['a'],
                    'x': this.bot.chargePosition['x'],
                    'y': this.bot.chargePosition['y'],
                    'a': this.bot.chargePosition['a']
                });
                break;
            case 'WaterPermeability':
                this.bot.handle_waterLevel(payload);
                this.emit('WaterLevel', this.bot.waterLevel);
                this.emitMoppingSystemReport();
                break;
            case 'WaterBoxInfo':
                this.bot.handle_waterboxInfo(payload);
                this.emit('WaterBoxInfo', this.bot.waterboxInfo);
                this.emitMoppingSystemReport();
                break;
            case 'NetInfo':
                payload = event.attrs;
                this.bot.handle_netInfo(payload);
                this.emit('NetInfoIP', this.bot.netInfoIP); // Deprecated
                this.emit('NetInfoWifiSSID', this.bot.netInfoWifiSSID); // Deprecated
                this.emit('NetworkInfo', {
                    'ip': this.bot.netInfoIP,
                    'mac': null,
                    'wifiSSID': this.bot.netInfoWifiSSID,
                    'wifiSignal': null,
                });
                break;
            case 'SleepStatus':
                this.bot.handle_sleepStatus(payload);
                this.emit('SleepStatus', this.bot.sleepStatus);
                break;
            case 'Error':
                payload = event.attrs;
                this.bot.handle_ResponseError(payload);
                this.emit('Error', this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
                this.emit('LastError', {
                    'error': this.bot.errorDescription,
                    'code': this.bot.errorCode
                });
                break;
            case 'CleanSum':
                this.bot.handle_cleanSum(payload);
                this.emit('CleanSum_totalSquareMeters', this.bot.cleanSum_totalSquareMeters); // Deprecated
                this.emit('CleanSum_totalSeconds', this.bot.cleanSum_totalSeconds); // Deprecated
                this.emit('CleanSum_totalNumber', this.bot.cleanSum_totalNumber); // Deprecated
                this.emit('CleanSum', {
                    'totalSquareMeters': this.bot.cleanSum_totalSquareMeters,
                    'totalSeconds': this.bot.cleanSum_totalSeconds,
                    'totalNumber': this.bot.cleanSum_totalNumber
                });
                break;
            case 'Logs':
            case 'CleanLogs':
            case 'LogApiCleanLogs':
                this.bot.handle_cleanLogs(payload);
                let cleanLog = [];
                for (let i in this.bot.cleanLog) {
                    if (this.bot.cleanLog.hasOwnProperty(i)) {
                        cleanLog.push(this.bot.cleanLog[i]);
                        tools.envLog('[Ecovacs] Logs: %s', JSON.stringify(this.bot.cleanLog[i]));
                    }
                }
                if (cleanLog.length) {
                    this.emit('CleanLog', cleanLog.reverse());
                    this.emit('CleanLog_lastTimestamp', this.bot.cleanLog_lastTimestamp);
                    this.emit('CleanLog_lastSquareMeters', this.bot.cleanLog_lastSquareMeters);
                    this.emit('CleanLog_lastTotalTimeString', this.bot.cleanLog_lastTotalTimeString);
                    this.emit('LastCleanLogs', {
                        'timestamp': this.bot.cleanLog_lastTimestamp,
                        'squareMeters': this.bot.cleanLog_lastSquareMeters,
                        'totalTime': this.bot.cleanLog_lastTotalTime,
                        'totalTimeFormatted': this.bot.cleanLog_lastTotalTimeString,
                        'imageUrl': this.bot.cleanLog_lastImageUrl
                    });
                }
                if (this.bot.cleanLog_lastImageUrl) {
                    this.emit('CleanLog_lastImageUrl', this.bot.cleanLog_lastImageUrl);
                    this.emit('CleanLog_lastImageTimestamp', this.bot.cleanLog_lastTimestamp); // Deprecated
                }
                break;
            case 'MapM':
                // Map Model
                // - runs "GetMapSet" to request spot areas and virtual walls
                // - and also runs indirectly "PullMP" to request map pieces of the map image
                try {
                    let mapinfo = this.bot.handle_cachedMapInfo(payload);
                    if (mapinfo) {
                        this.emit('CurrentMapName', this.bot.currentMapName);
                        this.emit('CurrentMapMID', this.bot.currentMapMID);
                        this.emit('CurrentMapIndex', this.bot.currentMapIndex);
                        this.emit('Maps', this.bot.maps);
                    }
                } catch(e) {
                    tools.envLog("[Ecovacs] Error on MapM: %s", e.message);
                }
                break;
            case 'PullMP':
                // Map Pieces of the map image
                try {
                    const mapImage = await this.bot.handle_mapPiecePacket(payload);
                    if (mapImage) {
                        this.emit("MapImageData", mapImage);
                    }
                } catch (e) {
                    this.emitError('-2', 'Error handling map image: %s' + e.message);
                }
                break;
            case 'MapSet':
                // Spot Areas and virtual walls
                // - runs "PullM" to request spot area and virtual wall data
                let mapset = this.bot.handle_mapSet(payload);
                if (mapset['mapsetEvent'] !== 'error') {
                    this.emit(mapset['mapsetEvent'], mapset['mapsetData']);
                }
                break;
            case 'PullM':
                // Spot area and virtual wall data
                let mapsubset = await this.bot.handle_mapSubset(payload);
                if (mapsubset && (mapsubset['mapsubsetEvent'] !== 'error')) {
                    this.emit(mapsubset['mapsubsetEvent'], mapsubset['mapsubsetData']);
                }
                break;
            case 'DustCaseST':
                this.bot.handle_dustcaseInfo(payload);
                this.emit('DustCaseInfo', this.bot.dustcaseInfo);
                break;
            case 'OnOff':
                this.bot.handle_onOff(payload);
                if (this.bot.doNotDisturbEnabled) {
                    this.emit('DoNotDisturbEnabled', this.bot.doNotDisturbEnabled);
                }
                if (this.bot.continuousCleaningEnabled) {
                    this.emit('ContinuousCleaningEnabled', this.bot.continuousCleaningEnabled);
                }
                if (this.bot.voiceReportDisabled) {
                    this.emit('VoiceReportDisabled', this.bot.voiceReportDisabled);
                }
                break;
            case 'Sched':
                // Cleaning schedule
                this.bot.handle_getSched(payload);
                if (this.bot.schedule) {
                    this.emit('Schedule', this.bot.schedule);
                }
                break;
            case 'MapP':
            case 'trace':
            case 'CleanedPos':
            case 'CleanedTrace':
            case 'CleanedMapSet':
            case 'CleanedMap':
            case 'BigDataCleanInfoReport':
                // TODO: implement these events
                break;
            default:
                tools.envLog('[Ecovacs] Unknown response type received: %s', JSON.stringify(event));
                break;
        }
    }

    /**
     * @returns the dictionary of Ecovacs related constants
     */
    getEcovacsDictionary() {
        if (this.bot.is950type()) {
            return require('./950type/ecovacsConstants');
        } else {
            return require('./non950type/ecovacsConstants');
        }
    }

    handleLifeSpanCombined() {
        const emitComponent = {};
        for (let component in this.dictionary.COMPONENT_TO_ECOVACS) {
            if (this.dictionary.COMPONENT_TO_ECOVACS.hasOwnProperty(component)) {
                if (this.bot.components[component]) {
                    emitComponent[component] = this.bot.components[component] && (this.bot.components[component] !== this.bot.lastComponentValues[component]);
                }
            }
        }
        if (emitComponent['filter'] && emitComponent['side_brush'] && (!this.bot.hasMainBrush() || emitComponent['main_brush'])) {
            this.emit('LifeSpan', {
                'filter': this.bot.components['filter'],
                'side_brush': this.bot.components['side_brush'],
                'main_brush': this.bot.components['main_brush']
            });
        }
    }

    emitError(code, message) {
        tools.envLog(`[EcovacsMQTT] Received error event with code '${code}' and message '${message}'`);
        this.bot.errorCode = code;
        this.bot.errorDescription = message;
        this.emitLastError();
    }

    /**
     * Emit a network related error message
     * @param {string} message - the error message
     */
    emitNetworkError(message) {
        this.emitError('-1', tools.createErrorDescription(message));
    }

    emitLastErrorByErrorCode(errorCode) {
        if (errorCode !== this.bot.errorCode) {
            this.bot.errorCode = errorCode;
            if (errorCodes[errorCode]) {
                this.bot.errorDescription = errorCodes[errorCode];
            } else {
                this.bot.errorDescription = 'Unknown error code';
            }
            this.emitLastError();
        }
    }

    /**
     * Emit the error.
     * Disconnect if 'RequestOAuthError: Authentication error' error
     */
    emitLastError() {
        this.emit("Error", this.bot.errorDescription);
        this.emit('ErrorCode', this.bot.errorCode);
        this.emit('LastError', {
            'error': this.bot.errorDescription,
            'code': this.bot.errorCode
        });
        // Error code 3 = 'RequestOAuthError: Authentication error'
        if (this.bot.errorCode === '3') {
            this.emit("disconnect", true);
            this.disconnect();
        }
    }

    /**
     * If the vacuum has power adjustment and also has a mopping system
     * then emit a `MoppingSystemInfo` event with the `cleanStatus` and `cleanInfo` properties
     */
    emitMoppingSystemReport() {
        const vacuumPowerAdjustmentOk = !this.bot.hasVacuumPowerAdjustment() || (this.bot.cleanSpeed !== null);
        const moppingSystemOk = !this.bot.hasMoppingSystem() || (this.bot.waterLevel !== null);
        if (vacuumPowerAdjustmentOk && moppingSystemOk) {
            let r = {
                'cleanStatus': this.bot.cleanReport
            };
            if (this.bot.hasVacuumPowerAdjustment() && (this.bot.cleanSpeed !== null)) {
                r['cleanInfo'] = {
                    'level': this.bot.cleanSpeed
                };
            }
            if (this.bot.hasMoppingSystem() && (this.bot.waterLevel !== null)) {
                r['waterInfo'] = {
                    'enabled': Boolean(Number(this.bot.waterboxInfo || 0)),
                    'level': this.bot.waterLevel
                };
            }
            this.emit("MoppingSystemInfo", r);
        }
    }

    /**
     * @abstract
     */
    disconnect() {}
}

module.exports = Ecovacs;
