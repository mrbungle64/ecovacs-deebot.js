'use strict';

const VacBotCommand = require('./command');
const VacBot = require('../vacBot');
const tools = require('../tools');
const mapTools = require('../mapTools');
const map = require('../mapInfo');
const mapTemplate = require('../mapTemplate');
const dictionary = require('./dictionary');
const {errorCodes} = require('../errorCodes.json');
const {eventCodes} = require('../eventCodes.json');
const constants = require("../constants");

const HANDLE_LIVE_MAP = false;

/**
 * This class is relevant for 950 type models
 * e.g. Deebot OZMO 920/950, T8 series, T9 series (which are all MQTT based models)
 */
class VacBot_950type extends VacBot {
    /**
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} [country='DE'] - the country where the Ecovacs account is registered
     * @param {string} [serverAddress] - the server address of the MQTT server
     */
    constructor(user, hostname, resource, secret, vacuum, continent, country, serverAddress = '', authDomain = '') {
        super(user, hostname, resource, secret, vacuum, continent, country, serverAddress, authDomain);

        this.breakPoint = null;
        this.block = null;
        this.autoEmpty = null;
        this.autoEmptyStatus = null;
        this.advancedMode = null;
        this.trueDetect = null;
        this.cleanCount = 1;
        this.dusterRemind = {
            'enabled': null,
            'period': null
        };
        this.carpetPressure = null;
        this.cleanPreference = null;
        this.liveLaunchPwdState = {
            'state': null,
            'hasPwd': null
        };
        this.volume = 0;
        this.relocationStatus = {};
        this.relocationState = null;
        this.firmwareVersion = null;
        this.airDryingStatus = null;
        this.mopOnlyMode = null;
        this.sweepMode = null;
        this.borderSpin = null;

        // Air Purifier
        this.airQuality = {
            'particulateMatter25': null,
            'pm_10': null,
            'particulateMatter10': null,
            'airQualityIndex': null,
            'volatileOrganicCompounds': null,
            'temperature': null,
            'humidity': null
        };

        this.mic = null;
        this.angleFollow = null;
        this.aiBlockPlate = null;
        this.autonomousClean = null;
        this.bluetoothSpeaker = {
            'enable': null,
            'time': null,
            'name': null
        };
        this.childLock = null;
        this.drivingWheel = null;
        this.monitorAirState = null;
        this.angleWakeup = null;
        this.efficiency = null;
        this.atmoLightIntensity = null;
        this.atmoVolume = null;
        this.humanoidFollow = {
            'video': null,
            'yiko': null
        };
        this.sysinfo = {
            'load': null,
            'uptime': null,
            'signal': null,
            'meminfo': null,
            'pos': null
        };
        this.blockTime = {
            'from': null,
            'to': null
        };
        this.threeModule = [];
        this.threeModuleStatus = [];
        this.areaPoint = {
            'mapId': null,
            'locationPoints': null
        };
        this.airbotAutoModel = {
            'enable': null,
            'trigger': null,
            'aq': {
                'aqStart': null,
                'aqEnd': null
            }
        };
        this.currentTask = {
            'type': null,
            'triggerType': null,
            'failed': null
        };
        this.obstacleTypes = null;
        this.avoidedObstacles = null;
        this.OTA = {
            'status': null,
            'result': null,
            'isForce': null,
            'progress': null,
            'supportAuto': null,
            'ver': null
        };
        this.timezone = null;
        this.dmodule = {
            'enabled': null,
            'status': null
        };
        this.stationState = {
            'type': null,
            'state': null
        };
        this.washInterval = null;
        this.aiCleanItemState = {
            items: [],
            particleRemoval: null,
            petPoopPrevention: null
        };
        this.stationInfo = {
            state: null,
            name: null,
            model: null,
            sn: null,
            wkVer: null
        };
        this.workMode = null;
        this.mapState = null;
        this.mapSet_V2 = {};
        this.multiMapState = null;
        this.evt = {};
    }

    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload) {
        this.currentSpotAreas = '';
        this.currentCustomAreaValues = '';
        if (payload['state'] === 'clean') {
            let type = payload['cleanState']['type'];
            const content = payload['cleanState']['content'];
            if (typeof content === 'object') {
                type = content['type'];
            }
            if (payload['cleanState']['motionState'] === 'working') {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
            } else {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['cleanState']['motionState']];
            }
            if ((type === 'spotArea') || (type === 'customArea')) {
                let areaValues;
                if (typeof content === `object`) {
                    areaValues = content['value'];
                } else {
                    areaValues = content;
                }
                if (type === 'customArea') {
                    if (typeof content === 'object') {
                        const doNotClean = content['donotClean'];
                        if ((doNotClean === 1) || (areaValues.split(',').length === 2)) {
                            // Controlled via Video Manager
                            this.cleanReport = 'setLocation';
                        }
                    }
                    this.currentCustomAreaValues = areaValues;
                } else if (type === 'spotArea') {
                    this.currentSpotAreas = areaValues;
                }
            }
        } else if (payload['trigger'] === 'alert') {
            this.cleanReport = 'alert';
        } else {
            this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']];
            if (dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']] === 'returning') {
                // set charge state on returning to dock
                const chargeStatus = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']];
                if (chargeStatus) {
                    this.chargeStatus = chargeStatus;
                }
            } else if (dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']] === 'idle') {
                // when clean state = idle the bot can be charging on the dock or the return to dock has been canceled
                // if this is not run, the status when canceling the return stays on 'returning'
                this.run('GetChargeState');
            }
        }
    }

    /**
     * Handle the payload of the `StationState` response/message
     * @param {Object} payload
     */
    handleStationState(payload) {
        let type = 0;
        let state = 0;
        if (payload.hasOwnProperty('content')) {
            type = payload['content']['type'];
        }
        if (payload.hasOwnProperty('state')) {
            state = payload['state'];
        }
        this.stationState = {
            'type': type,
            'state': state,
            'isAirDrying': Boolean((type === 2) && state),
            'isSelfCleaning': Boolean((type === 3) && state),
            'isActive': Boolean(state)
        };
    }

    /**
     * Handle the payload of the `handleStationInfo` response/message
     * @param {Object} payload
     */
    handleStationInfo(payload) {
        this.stationInfo = {
            state: payload.state,
            name: payload.name,
            model: payload.model,
            sn: payload.sn,
            wkVer: payload.wkVer
        };
    }

    handleWashInterval(payload) {
        if (payload.hasOwnProperty('interval')) {
            this.washInterval = payload['interval'];
        }
    }

    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload) {
        this.batteryLevel = payload['value'];
        if (payload.hasOwnProperty('isLow')) {
            this.batteryIsLow = !!Number(payload['isLow']);
        } else {
            this.batteryIsLow = (this.batteryLevel >= 15);
        }
    }

    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload) {
        for (let index in payload) {
            if (payload[index]) {
                const type = payload[index][`type`];
                let component = type;
                if (dictionary.COMPONENT_FROM_ECOVACS[type]) {
                    component = dictionary.COMPONENT_FROM_ECOVACS[type];
                } else {
                    tools.envLogWarn(`unknown life span component type: ${type}`);
                    this.ecovacs.emit('Debug', `Unknown life span component type: ${type}`);
                }
                const left = payload[index]['left'];
                const total = payload[index]['total'];
                const lifespan = parseInt(left) / parseInt(total) * 100;
                this.components[component] = Number(lifespan.toFixed(2));
            }
        }
    }

    /**
     * Handle the payload of the `Pos` response/message
     * (vacuum position and charger resp. charge position)
     * @param {Object} payload
     */
    handlePos(payload) {
        // is only available in some DeebotPosition messages (e.g. on start cleaning)
        // there can be more than one charging station only handles first charging station
        const chargePos = payload['chargePos'];
        if (chargePos) {
            // check if position changed
            let changed = (
                chargePos[0]['x'] !== this.chargePosition.x ||
                chargePos[0]['y'] !== this.chargePosition.y ||
                chargePos[0]['a'] !== this.chargePosition.a
            );
            if (changed) {
                this.chargePosition = {
                    x: chargePos[0]['x'],
                    y: chargePos[0]['y'],
                    a: chargePos[0]['a'],
                    changeFlag: true
                };
            }
        }
        // as deebotPos and chargePos can also appear in other messages (CleanReport)
        // the handling should be extracted to a separate function
        const deebotPos = payload['deebotPos'];
        if (typeof deebotPos === 'object') {
            // check if position changed or currentSpotAreaID unknown
            let changed = (
                deebotPos['x'] !== this.deebotPosition.x ||
                deebotPos['y'] !== this.deebotPosition.y ||
                deebotPos['a'] !== this.deebotPosition.a ||
                deebotPos['invalid'] !== this.deebotPosition.isInvalid ||
                this.deebotPosition.currentSpotAreaID === 'unknown'
            );
            if (changed) {
                const posX = Number(deebotPos['x']);
                const posY = Number(deebotPos['y']);
                let currentSpotAreaID = mapTools.getCurrentSpotAreaID(
                    posX, posY, this.mapSpotAreaInfos[this.currentMapMID]
                );
                let isInvalid = Number(deebotPos['invalid']) === 1;
                let distanceToChargingStation = null;
                if (this.chargePosition) {
                    const pos = deebotPos['x'] + ',' + deebotPos['y'];
                    const chargePos = this.chargePosition.x + ',' + this.chargePosition.y;
                    distanceToChargingStation = mapTools.getDistanceToChargingStation(pos, chargePos);
                }
                this.deebotPosition = {
                    x: deebotPos['x'],
                    y: deebotPos['y'],
                    a: deebotPos['a'],
                    isInvalid: isInvalid,
                    currentSpotAreaID: currentSpotAreaID,
                    currentSpotAreaName: this.getSpotAreaName(currentSpotAreaID),
                    changeFlag: true,
                    distanceToChargingStation: distanceToChargingStation
                };
            }
        }
    }

    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload) {
        this.evt = {};
        const code = payload['code'];
        if (eventCodes.hasOwnProperty(code)) {
            tools.envLogWarn(`Evt code: '${eventCodes[code]}'`);
            this.evt = {
                code: code,
                event: eventCodes[code]
            };
        } else {
            tools.envLogWarn(`Unhandled Evt code: '${code}'`);
        }
    }

    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload) {
        const speed = payload['speed'];
        this.cleanSpeed = speed;
        if (this.getModelType() !== 'airbot') {
            this.cleanSpeed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        }
    }

    /**
     * Handle the payload of the `NetInfo` response/message
     * (network addresses and Wi-Fi status)
     * @param {Object} payload
     */
    handleNetInfo(payload) {
        this.netInfoIP = payload['ip'];
        this.netInfoWifiSSID = payload['ssid'];
        this.netInfoWifiSignal = payload['rssi'];
        this.netInfoMAC = payload['mac'];
    }

    /**
     * Handle the payload of the `WaterInfo` response/message
     * (water level and water box status)
     * @param {Object} payload
     */
    handleWaterInfo(payload) {
        this.waterLevel = payload['amount'];
        this.waterboxInfo = payload['enable'];
        if (payload.hasOwnProperty('type')) {
            // 1 = Regular
            // 2 = OZMO Pro
            this.moppingType = payload['type'];
        }
        if (payload.hasOwnProperty('sweepType')) {
            // Scrubbing pattern
            // 1 = Quick scrubbing
            // 2 = Deep scrubbing
            this.scrubbingType = payload['sweepType'];
        }
    }

    /**
     * Handle the payload of the `AICleanItemState` response/message
     * Particle Removal and Pet Poop Avoidance mode (e.g. X1)
     * @param {Object} payload
     */
    handleAICleanItemState(payload) {
        if (payload.hasOwnProperty('items')) {
            const items = payload.items;
            const particleRemoval = Boolean(items[0].state);
            const petPoopPrevention = Boolean(items[2].state);
            this.aiCleanItemState = {
                items: items,
                particleRemoval: particleRemoval,
                petPoopPrevention: petPoopPrevention
            };
        }
    }

    /**
     * Handle the payload of the `AirDring` (sic) response/message (air drying status)
     * Seems to work for yeedi only
     * See `StationState` for Deebot models
     * @param {Object} payload
     */
    handleAirDryingState(payload) {
        let airDryingStatus = null;
        const status = parseInt(payload['status']);
        if (status === 1) {
            airDryingStatus = 'airdrying';
        } else if (status === 2) {
            airDryingStatus = 'idle';
        }
        if (airDryingStatus) {
            this.airDryingStatus = airDryingStatus;
        }
    }

    /**
     * Handle the payload of the `BorderSpin` response/message
     * @param {Object} payload
     */
    handleBorderSpin(payload) {
        const enable = payload['enable'];
        const type = payload['type']; // The value of type seems to be always 1
        if (type) {
            this.borderSpin = enable;
        }
    }

    /**
     * Handle the payload of the `WorkMode` response/message
     * ('Work Mode', 'Cleaning Mode')
     * @param {Object} payload
     */
    handleWorkMode(payload) {
        this.workMode = payload['mode'];
    }

    /**
     * Handle the payload of the `CustomAreaMode` response/message
     * `Mopping Mode`/`Cleaning efficiency` is taken from the `CustomAreaMode` message
     * not from the `SweepMode` message
     * @param {Object} payload
     */
    handleCustomAreaMode(payload) {
        if (payload.hasOwnProperty('sweepMode')) {
            this.sweepMode = payload['sweepMode'];
        }
    }

    /**
     * Handle the payload of the `SweepMode` response/message
     * "Mop-Only" is taken from the SweepMode message
     * @param {Object} payload
     */
    handleSweepMode(payload) {
        if (payload.hasOwnProperty('type')) {
            this.mopOnlyMode = Boolean(payload['type']);
        }
    }

    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload) {
        this.chargeStatus = 'idle';
        if (parseInt(payload['isCharging']) === 1) {
            this.chargeStatus = 'charging';
        }
        this.chargeMode = 'slot';
        if (payload.hasOwnProperty('mode')) {
            this.chargeMode = payload['mode'];
        }
    }

    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload) {
        this.sleepStatus = payload['enable'];
    }

    /**
     * Handle the payload of the `MapState` response/message
     * @param {Object} payload
     */
    handleMapState(payload) {
        this.mapState = payload['state'];
    }

    /**
     * Handle the payload of the `MultiMapState` response/message
     * @param {Object} payload
     */
    handleMultiMapState(payload) {
        this.multiMapState = payload['enable'];
    }

    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload) {
        let logs = [];
        this.cleanLog = [];
        if (payload.hasOwnProperty('logs')) {
            logs = payload['logs'];
        } else if (payload.hasOwnProperty('log')) {
            logs = payload['log'];
        } else if (payload.hasOwnProperty('data')) {
            logs = payload['data'];
        }

        for (let logIndex in logs) {
            if (logs.hasOwnProperty(logIndex)) {
                const logEntry = logs[logIndex];
                if (!this.cleanLog[logEntry['id']]) { //log not yet existing
                    let squareMeters = parseInt(logEntry['area']);
                    let timestamp = Number(logEntry['ts']);
                    let date = new Date(timestamp * 1000);
                    let len = parseInt(logEntry['last']);
                    let totalTimeString = tools.getTimeStringFormatted(len);
                    let imageUrl = logEntry['imageUrl'];
                    if ((this.cleanLog_lastTimestamp < timestamp) || (!this.cleanLog_lastTimestamp)) {
                        this.cleanLog_lastImageUrl = imageUrl;
                        this.cleanLog_lastTimestamp = timestamp;
                        this.cleanLog_lastSquareMeters = squareMeters;
                        this.cleanLog_lastTotalTime = len;
                        this.cleanLog_lastTotalTimeString = totalTimeString;
                    }
                    this.cleanLog[logEntry['id']] = {
                        'squareMeters': squareMeters,
                        'timestamp': timestamp,
                        'date': date,
                        'lastTime': len,
                        'totalTime': len,
                        'totalTimeFormatted': totalTimeString,
                        'imageUrl': imageUrl,
                        'type': logEntry['type'],
                        'stopReason': logEntry['stopReason']
                    };
                }
            }
        }
    }

    /**
     * Handle the payload of the `TotalStats` response/message
     * @param {Object} payload
     */
    handleTotalStats(payload) {
        this.cleanSum_totalSquareMeters = parseInt(payload['area']);
        this.cleanSum_totalSeconds = parseInt(payload['time']);
        this.cleanSum_totalNumber = parseInt(payload['count']);
    }

    /**
     * Handle the payload of the `RelocationState` response/message
     * @param {Object} payload
     */
    handleRelocationState(payload) {
        this.relocationStatus = payload;
        this.relocationState = payload['state'];
    }

    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload) {
        this.volume = payload['volume'];
    }

    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload) {
        this.breakPoint = payload['enable'];
    }

    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload) {
        this.block = payload['enable'];
        if (payload.hasOwnProperty('start')) {
            this.blockTime = {
                'from': payload['start'],
                'to': payload['end']
            };
        }
    }

    /**
     * Handle the payload of the 'AutoEmpty' response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload) {
        this.autoEmpty = payload['enable'];
        if (payload.hasOwnProperty('status')) {
            // 0 disabled
            // 1 enabled
            // 2 dust bag not full
            // 5 dust bag need to be changed
            this.autoEmptyStatus = payload['status'];
        }
    }

    /**
     * Handle the payload of the 'AdvancedMode' response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload) {
        this.advancedMode = payload['enable'];
    }

    /**
     * Handle the payload of the 'TrueDetect' response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload) {
        this.trueDetect = payload['enable'];
    }

    handleRecognization(payload) {
        this.trueDetect = payload['state'];
        if (payload) {
            tools.envLogInfo(`payload for Recognization message: ${JSON.stringify(payload)}`);
        }
    }

    /**
     * Handle the payload of the 'CleanCount' response/message
     * @param {Object} payload
     */
    handleCleanCount(payload) {
        this.cleanCount = payload['count'];
    }

    /**
     * Handle the payload of the 'DusterRemind' response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload) {
        this.dusterRemind = {
            enabled: payload['enable'],
            period: payload['period']
        };
    }

    /**
     * Handle the payload of the 'CarpertPressure' (sic) response/message
     * @param {Object} payload
     */
    handleCarpetPressure(payload) {
        this.carpetPressure = payload['enable'];
    }

    handleCleanPreference(payload) {
        this.cleanPreference = payload['enable'];
    }

    handleLiveLaunchPwdState(payload) {
        this.liveLaunchPwdState = {
            state: payload.state,
            hasPwd: payload.hasPwd
        };
    }

    handleWiFiList(payload) {
        if (payload.list) {
            tools.envLogInfo('Configured networks:');
            payload.list.forEach((network) => {
                tools.envLogInfo('- ' + network);
            });
        }
        tools.envLogInfo(`mac address: ${payload.mac}`);
    }

    handleOverTheAirUpdate(payload) {
        this.OTA = payload;
        tools.envLogInfo(`ota status: ${JSON.stringify(payload)}`);
    }

    handleTimeZone(payload) {
        this.timezone = 'GMT' + (payload.tzm > 0 ? '+' : '-') + (payload.tzm / 60) + ':00';
    }

    /**
     * Handle the payload of the 'Stats' response/message
     * @param {Object} payload
     */
    handleStats(payload) {
        this.currentStats = {
            'cleanedArea': payload['area'],
            'cleanedSeconds': payload['time'],
            'cleanType': payload['type']
        };
        if (payload.hasOwnProperty('avoidCount')) {
            if (this.avoidedObstacles !== payload['avoidCount']) {
                tools.envLogNotice('whoops ... there might be something in the way');
            }
            this.avoidedObstacles = payload['avoidCount'];
        }
        if (payload.hasOwnProperty('aiopen') && Number(payload['aiopen']) === 1) {
            if (JSON.stringify(this.obstacleTypes) !== JSON.stringify(payload['aitypes'])) {
                tools.envLogNotice('whoops ... there might be something new blocking my way');
            }
            this.obstacleTypes = payload['aitypes'];
        }
    }

    /**
     * Handle the payload of the 'Sched' response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload) {
        this.schedule = [];
        for (let c = 0; c < payload.length; c++) {
            const resultData = payload[c];
            if (resultData.repeat !== undefined) {
                let cleanCtl = {
                    'type': 'auto'
                };
                if (resultData.hasOwnProperty('content') && resultData.content.hasOwnProperty('jsonStr')) {
                    const json = JSON.parse(resultData.content.jsonStr);
                    Object.assign(cleanCtl, {
                        'type': json.type
                    });
                    if (cleanCtl.type === 'spotArea') {
                        Object.assign(cleanCtl, {
                            'spotAreas': json.content
                        });
                    }
                }
                const onlyOnce = Number(resultData.repeat) === 0;
                const weekdays = resultData.repeat.split('');
                const weekdaysObj = {
                    'Mon': Boolean(Number(weekdays[1])),
                    'Tue': Boolean(Number(weekdays[2])),
                    'Wed': Boolean(Number(weekdays[3])),
                    'Thu': Boolean(Number(weekdays[4])),
                    'Fri': Boolean(Number(weekdays[5])),
                    'Sat': Boolean(Number(weekdays[6])),
                    'Sun': Boolean(Number(weekdays[0]))
                };
                const object = {
                    'sid': resultData.sid,
                    'cleanCmd': cleanCtl,
                    'content': resultData.content,
                    'enabled': Boolean(Number(resultData.enable)),
                    'onlyOnce': onlyOnce,
                    'weekdays': weekdaysObj,
                    'hour': resultData.hour,
                    'minute': resultData.minute,
                    'mapID': resultData.mid
                };
                this.schedule.push(object);
            }
        }
    }

    /**
     * Handle the payload of the 'CachedMapInfo' response/message
     * @param {Object} payload
     */
    handleCachedMapInfo(payload) {
        this.currentMapName = 'unknown';
        this.maps = {'maps': []};
        const info = payload['info'];
        for (let mapIndex in info) {
            if (info.hasOwnProperty(mapIndex)) {
                if (info[mapIndex]['mid'] !== '0') {
                    const data = info[mapIndex];
                    const ecovacsMap = new map.EcovacsMap(
                        data['mid'], data['index'], data['name'], data['status'], data['using'], data['built']
                    );
                    this.maps['maps'].push(ecovacsMap);
                    if (info[mapIndex]['using'] === 1) {
                        this.currentMapMID = data['mid'];
                        this.currentMapName = data['name'];
                        this.currentMapIndex = data['index'];
                    }
                }
            }
        }
    }

    /**
     * Handle the payload of the 'MapInfo_V2' response/message
     * @param {Object} payload
     */
    handleMapInfoV2(payload) {
        this.currentMapMID = payload['mid'];
        tools.envLogNotice(`mid: ${this.currentMapMID}`);
        tools.envLogNotice(`batid: ${payload['batid']}`);
        tools.envLogNotice(`serial: ${payload['serial']}`);
        tools.envLogNotice(`index: ${payload['index']}`);
        tools.envLogNotice(`type: ${payload['type']}`);
        tools.envLogNotice(`outlineVer: ${payload['outlineVer']}`);
        tools.envLogNotice(`info: ${payload['info']}`);
        tools.envLogNotice(`infoSize: ${payload['infoSize']}`);
        tools.envLogNotice(`using: ${payload['using']}`);
        tools.envLogNotice(`outlineCpmplete: ${payload['outlineCpmplete']}`); // The typo in 'Cpmplete' is intended
    }

    /**
     * Handle the payload of the 'MapInfo_V2' response/message (Yeedi)
     * @param {Object} payload
     */
    handleMapInfoV2_Yeedi(payload) {
        this.currentMapMID = payload['mid'];
        this.currentMapName = 'standard';
        this.currentMapIndex = 0;
        this.maps = {'maps': []};
        this.maps['maps'].push(
            new map.EcovacsMap(
                this.currentMapMID, this.currentMapIndex, this.currentMapName, 1, 1, 1
            )
        );
    }

    /**
     * Handle the payload of the 'MapSet' response/message
     * @param {Object} payload
     */
    handleMapSet(payload) {
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MapSet');
                return {mapsetEvent: 'skip'};
            }
        }
        if (payload['subsets'] && !payload['subsets'].length) {
            tools.envLogWarn('Skipping message: subsets empty');
            return {mapsetEvent: 'skip'};
        }
        if (payload['type'] === 'ar') {
            let mapSpotAreas = new map.EcovacsMapSpotAreas(mapID, payload['msid']);
            for (let mapIndex in payload['subsets']) {
                if (payload['subsets'].hasOwnProperty(mapIndex)) {
                    mapSpotAreas.push(
                        new map.EcovacsMapSpotArea(payload['subsets'][mapIndex]['mssid'])
                    );
                }
            }
            return {
                mapsetEvent: 'MapSpotAreas',
                mapsetData: mapSpotAreas
            };
        } else if ((payload['type'] === 'vw') || (payload['type'] === 'mw')) {
            if (typeof this.mapVirtualBoundaries[mapID] === 'undefined') {
                // initialize array for mapVirtualBoundaries if not existing
                this.mapVirtualBoundaries[mapID] = new map.EcovacsMapVirtualBoundaries(mapID);
                this.mapVirtualBoundariesResponses[mapID] = [false, false];
            }
            for (let mapIndex in payload['subsets']) {
                if (payload['subsets'].hasOwnProperty(mapIndex)) {
                    this.mapVirtualBoundaries[mapID].push(
                        new map.EcovacsMapVirtualBoundary(payload['subsets'][mapIndex]['mssid'], payload['type'])
                    );
                }
            }
            if (payload['type'] === 'vw') {
                this.mapVirtualBoundariesResponses[mapID][0] = true;
            } else if (payload['type'] === 'mw') {
                this.mapVirtualBoundariesResponses[mapID][1] = true;
            }
            if (this.mapVirtualBoundariesResponses[mapID][0] && this.mapVirtualBoundariesResponses[mapID][1]) {
                // only return if both responses were processed
                return {
                    mapsetEvent: 'MapVirtualBoundaries',
                    mapsetData: this.mapVirtualBoundaries[mapID]
                };
            } else {
                tools.envLogWarn(`Skipping mapVirtualBoundaries for map ` + mapID);
                return {mapsetEvent: 'skip'};
            }
        }

        tools.envLogWarn(`unknown mapset type: ${JSON.stringify(payload['type'])}`);
        return {mapsetEvent: 'error'};
    }

    /**
     * Handle the payload of the 'MapSubSet' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapSubset(payload) {
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MapSubset');
                return {mapsubsetEvent: 'error'};
            }
        }
        if (payload['type'] === 'ar') {
            let mapSpotAreaBoundaries = payload['value'];
            if (payload['compress']) {
                mapSpotAreaBoundaries = await mapTemplate.mapPieceToIntArray(payload['value']);
            }
            let customName = '';
            if (payload['name']) {
                customName = payload['name'];
            }
            //TODO: filter out reportMapSubSet events (missing data)
            //reportMapSubSet event comes without map reference, replace
            let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
                mapID,
                payload['mssid'],
                payload['connections'], //reportMapSubSet event comes without connections
                mapSpotAreaBoundaries,
                payload['subtype'],
                customName
            );
            // Cleaning preference
            if (payload.hasOwnProperty('cleanset') && (payload['cleanset'] !== '')) {
                mapSpotAreaInfo.setCleanSet(payload['cleanset']);
            }
            // Cleaning sequence
            if (payload.hasOwnProperty('index')) {
                mapSpotAreaInfo.setSequenceNumber(payload['index']);
            }
            if (typeof this.mapSpotAreaInfos[mapID] === 'undefined') {
                this.mapSpotAreaInfos[mapID] = []; //initialize array for mapSpotAreaInfos if not existing
            }
            this.mapSpotAreaInfos[mapID][payload['mssid']] = mapSpotAreaInfo;
            return {
                mapsubsetEvent: 'MapSpotAreaInfo',
                mapsubsetData: mapSpotAreaInfo
            };
        } else if ((payload['type'] === 'vw') || (payload['type'] === 'mw')) {
            let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(mapID, payload['mssid'], payload['type'], payload['value']);
            if (typeof this.mapVirtualBoundaryInfos[mapID] === 'undefined') {
                this.mapVirtualBoundaryInfos[mapID] = []; //initialize array for mapVirtualBoundaryInfos if not existing
            }
            this.mapVirtualBoundaryInfos[mapID][payload['mssid']] = mapVirtualBoundaryInfo;
            return {
                mapsubsetEvent: 'MapVirtualBoundaryInfo',
                mapsubsetData: mapVirtualBoundaryInfo
            };
        }

        tools.envLogWarn(`unknown mapset type: ${JSON.stringify(payload['type'])}`);
        return {mapsubsetEvent: 'error'};
    }

    /**
     * Handle the payload of the `MapSet_V2` response/message
     * @param {Object} payload
     */
    async handleMapSet_V2(payload) {
        let subsets = payload['subsets'];
        if (typeof subsets === 'string') {
            subsets = JSON.parse(await mapTemplate.mapPieceToIntArray(subsets));
        }
        const type = payload['type'];
        let subsetData = [];
        subsets.forEach((subset) => {
            const mssid = subset[0];
            const name = subset[1];
            const subtype = subset[2];
            const areaConnections = subset[3];
            const index = subset[4];
            const spotPosition = subset[5] + ',' + subset[6];
            const cleanCount = subset[7].split('-')[0];
            const cleanSpeed = subset[7].split('-')[1];
            const waterLevel = subset[7].split('-')[2];
            const singleSubsetData = {
                'index': index,
                'mssid': mssid,
                'name': name,
                'subtype': subtype,
                'type': type,
                'areaConnections': areaConnections.replace(/-/g, ','),
                'cleanCount': Number(cleanCount),
                'cleanSpeed': dictionary.CLEAN_SPEED_FROM_ECOVACS[cleanSpeed],
                'waterLevel': Number(waterLevel),
                'spotPosition': spotPosition
            };
            subsetData.push(singleSubsetData);
        });
        this.mapSet_V2 = {
            'mid': payload['mid'],
            'subsets': subsetData
        };
    }

    /**
     * Handle the payload of the 'MapInfo' response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapImage(payload) {
        let mapID = payload['mid'];
        const type = payload['type'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MapImage');
                throw new Error('mid is not a number');
            }
        }
        if (typeof this.mapImages[mapID] === 'undefined') {
            this.mapImages[mapID] = [];
        }
        if (typeof this.mapImages[mapID][type] === 'undefined') {
            this.mapImages[mapID][type] = new mapTemplate.EcovacsMapImage(
                mapID, type,
                payload['totalWidth'], payload['totalHeight'],
                payload['pixel'], payload['totalCount']
            );
        }
        if (payload['pieceValue'] !== '') {
            await this.mapImages[mapID][type].updateMapPiece(
                payload['index'],
                payload['startX'], payload['startY'],
                payload['width'], payload['height'],
                payload['crc'], payload['value']
            );
        }
        try {
            return await this.mapImages[mapID][type].getBase64PNG(
                this.deebotPosition, this.chargePosition, this.currentMapMID, this.mapDataObject
            );
        } catch (e) {
            tools.envLogError(`error calling getBase64PNG: ${e.message}`);
            throw new Error(`error calling getBase64PNG: ${e.message}`);
        }
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload) {
        tools.envLogPayload(payload);
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MajorMap');
                return null;
            }
        }
        const crcList = payload['value'];
        if (!this.liveMapImage || (this.liveMapImage.mapID !== mapID)) {
            const crcArray = crcList.split(',');
            for (let c = 0; c < crcArray.length; c++) {
                if (crcArray[c] !== constants.CRC_EMPTY_PIECE) { // skipping empty pieces
                    this.sendCommand(new VacBotCommand.GetMinorMap(mapID, c));
                }
            }
            // TODO: Implement liveMapImage
            this.sendCommand(new VacBotCommand.GetMapTrace());
            // TODO: handle liveMapImage
            if (HANDLE_LIVE_MAP) {
                const type = payload['type'];
                const pieceWidth = payload['pieceWidth'];
                const pieceHeight = payload['pieceHeight'];
                const cellWidth = payload['cellWidth'];
                const cellHeight = payload['cellHeight'];
                const pixel = payload['pixel'];
                this.liveMapImage = new mapTemplate.EcovacsLiveMapImage(
                    mapID, type, pieceWidth, pieceHeight, cellWidth, cellHeight, pixel, crcList);
            }
        } else {
            // TODO: handle liveMapImage
            if (HANDLE_LIVE_MAP) {
                this.liveMapImage.updateMapDataPiecesCrc(crcList);
            }
        }
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    async handleMinorMap(payload) {
        tools.envLogPayload(payload);
        let mapID = payload['mid'];
        if (isNaN(mapID)) {
            if (this.currentMapMID) {
                mapID = this.currentMapMID;
            } else {
                tools.envLogWarn('mid is not a number. Skipping message for MinorMap');
                return null;
            }
        }
        if (!this.liveMapImage || (this.liveMapImage.mapID !== mapID)) {
            return null;
        }
        if (HANDLE_LIVE_MAP) {
            await this.liveMapImage.updateMapPiece(payload['pieceIndex'], payload['pieceValue']);
            try {
                return this.liveMapImage.getBase64PNG(
                    this.deebotPosition, this.chargePosition, this.currentMapMID, this.mapDataObject
                );
            } catch (e) {
                tools.envLogError(`error calling getBase64PNG: ${e.message}`);
                throw new Error(e);
            }
        }
    }

    async handleMapTrace(payload) {
        tools.envLogPayload(payload);
        /*
        const totalCount = payload['totalCount'];
        const traceStart = payload['traceStart'];
        const traceValue = payload['traceValue'];
        const pointCount = payload['pointCount'];
        const tid = payload['tid'];*/
    }

    /**
     * Handle the payload of the 'Error' response/message
     * @param {Object} payload
     */
    handleResponseError(payload) {
        this.errorCode = payload['code'].toString();
        // known errorCode from library
        if (errorCodes[this.errorCode]) {
            this.errorDescription = errorCodes[this.errorCode];
            // Request error
            if (this.errorCode === '1') {
                this.errorDescription = this.errorDescription + ': ' + payload.error;
            }
        } else {
            this.errorDescription = `unknown errorCode: ${this.errorCode}`;
        }
        if (this.errorCode !== '0') {
            tools.envLogWarn(`errorCode: ${this.errorCode}`);
            tools.envLogWarn(`errorDescription: ${this.errorDescription}`);
        }
    }

    /**
     * Handles the air quality data received from the payload.
     * "Indoor" Air Quality
     * @param {object} payload - The air quality data payload.
     */
    handleAirQuality(payload) {
        if (!payload.pm25) {
            // Handle 'onJCYAirQuality' event for Z1 AirQuality Monitor
            const keys = Object.keys(payload);
            payload = payload[keys[0]];
        }
        this.airQuality = {
            'particulateMatter25': payload['pm25'],
            'particulateMatter10': payload['pm10'],
            'airQualityIndex': payload['aq'],
            'volatileOrganicCompounds': payload['voc'],
            'temperature': payload['tem'],
            'humidity': payload['hum'],
            'pm_10': payload['pm_10']
        };
    }

    /**
     * Handle the payload of the 'MonitorAirState' response/message
     * "Real-time Air Quality Display"
     * @param {Object} payload
     */
    handleMonitorAirState(payload) {
        this.monitorAirState = payload['on'];
    }

    /**
     * Handle the payload of the 'AngleFollow' response/message
     * "Face to Me"
     * @param {Object} payload
     */
    handleAngleFollow(payload) {
        this.angleFollow = payload['on'];
    }

    /**
     * Handle the payload of the 'AngleWakeup' response/message
     * @param {Object} payload
     */
    handleAngleWakeup(payload) {
        this.angleWakeup = payload['on'];
    }

    /**
     * Handle the payload of the 'Mic' response/message
     * "Microphone"
     * @param {Object} payload
     */
    handleMic(payload) {
        this.mic = payload['on'];
    }

    /**
     * Handle the payload of the 'VoiceSimple' response/message
     * "Working Status Voice Report"
     * @param {Object} payload
     */
    handleVoiceSimple(payload) {
        this.voiceSimple = payload['on'];
    }

    /**
     * Handle the payload of the 'DrivingWheel' response/message
     * @param {Object} payload
     */
    handleDrivingWheel(payload) {
        this.drivingWheel = payload['on'];
    }

    /**
     * Handle the payload of the 'ChildLock' response/message
     * "Child Lock"
     * @param {Object} payload
     */
    handleChildLock(payload) {
        this.childLock = payload['on'];
    }

    /**
     * Handle the payload of the 'VoiceAssistantState' response/message
     * "YIKO Voice Assistant"
     * @param {Object} payload
     */
    handleVoiceAssistantState(payload) {
        this.voiceAssistantState = payload['enable'];
    }

    /**
     * Handle the payload of the 'HumanoidFollow' response/message
     * "Lab Features" => "Follow Me"
     * @param {Object} payload
     */
    handleHumanoidFollow(payload) {
        this.humanoidFollow = {
            'yiko': payload['yiko'],
            'video': payload['video']
        };
    }

    /**
     * Handle the payload of the 'AutonomousClean' response/message
     * "Self-linked Purification"
     * @param {Object} payload
     */
    handleAutonomousClean(payload) {
        this.autonomousClean = payload['on'];
    }

    /**
     * Handle the payload of the 'AirbotAutoMode' response/message
     * "Linked Purification" (linked to Air Quality Monitor)
     * @param {Object} payload
     */
    handleAirbotAutoModel(payload) {
        if (payload['aq'] && payload['aq']['aqStart'] && payload['aq']['aqEnd']) {
            this.airbotAutoModel = {
                'enable': payload['enable'],
                'trigger': payload['trigger'],
                'aq': {
                    'aqStart': payload['aq']['aqStart'],
                    'aqEnd': payload['aq']['aqEnd']
                }
            };
        }
    }

    /**
     * Handle the payload of the 'BlueSpeaker' response/message
     * "Bluetooth Speaker"
     * @param {Object} payload
     */
    handleBlueSpeaker(payload) {
        this.bluetoothSpeaker = {
            'enable': payload['enable'],
            'time': payload['time'],
            'name': payload['name']
        };
    }

    /**
     * Handle the payload of the 'Efficiency' response/message
     * Always seems to return a value of 0
     * @param {Object} payload
     */
    handleEfficiency(payload) {
        this.efficiency = payload['efficiency'];
    }

    /**
     * Handle the payload of the 'AtmoLight' response/message
     * "Light Brightness"
     * @param {Object} payload
     */
    handleAtmoLight(payload) {
        this.atmoLightIntensity = payload['intensity'];
    }

    /**
     * Handle the payload of the 'AtmoVolume' response/message
     * "Volume"
     * @param {Object} payload
     */
    handleAtmoVolume(payload) {
        this.atmoVolume = payload['volume'];
    }

    /**
     * Handle the payload of the 'ThreeModule' (UV, Humidifier, AirFreshener) response/message
     * It contains the current level set for Air Freshening and Humidification
     * @param {Object} payload
     */
    handleThreeModule(payload) {
        this.threeModule = payload;
    }

    /**
     * Handle the payload of the 'ThreeModuleStatus' (UV, Humidifier, AirFreshener) response/message
     * It contains the working status of these modules
     * @param {Object} payload
     */
    handleThreeModuleStatus(payload) {
        this.threeModuleStatus = payload;
    }

    /**
     * Handle the payload of the 'AreaPoint' response/message
     * @param {Object} payload
     */
    handleAreaPoint(payload) {
        this.areaPoint = {
            'mapId': payload['mid'],
            'locationPoints': payload['items']
        };
    }

    /**
     * Handle the payload of the 'AiBlockPlate' response/message
     * @param {Object} payload
     */
    handleAiBlockPlate(payload) {
        this.aiBlockPlate = payload['on'];
    }

    /**
     * Handle the payload of the '(FwBuryPoint-)Sysinfo' response/message
     * @param {Object} payload
     */
    handleSysinfo(payload) {
        try {
            let event = payload[0];
            this.sysinfo = {
                'load': event['uptime'].substring(event['uptime'].indexOf('average') + 9),
                'uptime': event['uptime'].substring(event['uptime'].indexOf('up') + 3).substr(0, event['uptime'].substring(event['uptime'].indexOf('up') + 3).indexOf('users')).substr(0, event['uptime'].substring(event['uptime'].indexOf('up') + 3).substr(0, event['uptime'].substring(event['uptime'].indexOf('up') + 3).indexOf('users')).lastIndexOf(',')),
                'signal': event['signal'],
                'meminfo': event['meminfo'],
                'pos': event['pos']
            };
        } catch (e) {
            tools.envLogWarn(`error handling System information: ${e.toString()}`);
        }
    }

    handleTask(type, payload) {
        this.currentTask = {
            'type': type,
            'triggerType': payload.hasOwnProperty('triggerType') ? payload['triggerType'] : 'none',
            'failed': false
        };
        if (payload.hasOwnProperty('go_fail')) {
            this.currentTask.failed = true;
        }
        if (payload.hasOwnProperty('stopReason')) {
            // why has it stopped?
        }
    }

    handleAudioCallState(payload) {
        tools.envLogWarn(`Unhandled AudioCallState: ${JSON.stringify(payload)}`);
    }

    handleDModule(payload) {
        this.dmodule = payload;
    }

    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command, ...args) {
        super.run(command, ...args);
        switch (command.toLowerCase()) {
            case 'GetMapInfo'.toLowerCase():
            case 'GetMapImage'.toLowerCase(): {
                const mapID = args[0].toString(); // mapID has to be a string
                const mapType = args[1] || 'outline';
                this.createMapDataObject = true;
                this.createMapImage = true;
                this.createMapImageOnly = args[2] !== undefined ? args[2] : true;
                if (Number(mapID) > 0) {
                    this.sendCommand(new VacBotCommand.GetMapInfo(mapID, mapType));
                }
                break;
            }
            case 'GetMaps'.toLowerCase():
            case 'GetCachedMapInfo'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetMapState());
                this.sendCommand(new VacBotCommand.GetMajorMap());
                this.createMapImageOnly = false;
                this.createMapDataObject = !!args[0] || false;
                this.createMapImage = this.createMapDataObject && this.isMapImageSupported();
                if (args.length >= 2) {
                    this.createMapImage = !!args[1];
                }
                // Workaround for some yeedi models (e.g. yeedi mop station)
                // TODO: Find a better solution
                if ((this.deviceClass === 'p5nx9u') || (this.deviceClass === 'vthpeg')) {
                    this.sendCommand(new VacBotCommand.GetMapInfo_V2_Yeedi());
                } else {
                    this.sendCommand(new VacBotCommand.GetCachedMapInfo());
                }
                break;
            case 'GetSpotAreas'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    this.sendCommand(new VacBotCommand.GetMapSpotAreas(mapID));
                }
                break;
            }
            case 'GetMapInfo_V2'.toLowerCase():
                if (args.length === 1) {
                    this.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0]));
                } else if (args.length >= 2) {
                    this.sendCommand(new VacBotCommand.GetMapInfo_V2(args[0], args[1]));
                }
                break;
            case 'GetMapSet_V2'.toLowerCase():
                if (args.length === 1) {
                    this.sendCommand(new VacBotCommand.GetMapSet_V2(args[0]));
                } else if (args.length >= 2) {
                    this.sendCommand(new VacBotCommand.GetMapSet_V2(args[0], args[1]));
                }
                break;
            case 'SetMapSet_V2'.toLowerCase():
                if ((args.length >= 2) && (typeof args[1] === 'object')) {
                    this.sendCommand(new VacBotCommand.SetMapSet_V2(args[0], args[1]));
                }
                break;
            case 'GetSpotAreaInfo'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    this.sendCommand(new VacBotCommand.GetMapSpotAreaInfo(mapID, spotAreaID));
                }
                break;
            }
            case 'GetVirtualBoundaries'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    if (typeof this.mapVirtualBoundariesResponses[mapID] === 'undefined') {
                        this.mapVirtualBoundariesResponses[mapID] = [false, false];
                    } else {
                        this.mapVirtualBoundariesResponses[mapID][0] = false;
                        this.mapVirtualBoundariesResponses[mapID][1] = false;
                    }
                    this.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'vw'));
                    this.sendCommand(new VacBotCommand.GetMapVirtualBoundaries(mapID, 'mw'));
                }
                break;
            }
            case 'GetVirtualBoundaryInfo'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (spotAreaID !== '') && (spotAreaID !== undefined)) {
                    this.sendCommand(new VacBotCommand.GetMapVirtualBoundaryInfo(mapID, spotAreaID, type));
                }
                break;
            }
            case 'AddVirtualBoundary'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const coordinates = args[1];
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (coordinates !== '')) {
                    this.sendCommand(new VacBotCommand.AddMapVirtualBoundary(mapID, coordinates, type));
                }
                break;
            }
            case 'DeleteVirtualBoundary'.toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = args[2];
                if ((Number(mapID) > 0) && (Number(spotAreaID) >= 0) && (tools.isValidVirtualWallType(type))) {
                    this.sendCommand(new VacBotCommand.DeleteMapVirtualBoundary(mapID, spotAreaID, type));
                }
                break;
            }
            case 'GetMajorMap'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetMajorMap());
                break;
            case 'GetLifeSpan'.toLowerCase(): {
                if (!args.length) {
                    this.emitFullLifeSpanEvent = true;
                    this.components = {};
                    this.lastComponentValues = {};
                    if (this.getModelType() === 'airbot') {
                        this.sendCommand(new VacBotCommand.GetLifeSpan([]));
                    } else {
                        const componentsArray = [];
                        if (this.hasFilter()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['filter']);
                        }
                        if (this.hasSideBrush()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['side_brush']);
                        }
                        if (this.hasMainBrush()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['main_brush']);
                        }
                        if (this.hasUnitCareInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['unit_care']);
                        }
                        if (this.hasRoundMopInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['round_mop']);
                        }
                        if (this.hasAirFreshenerInfo()) {
                            componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['air_freshener']);
                        }
                        if (componentsArray.length) {
                            this.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
                        }
                    }
                } else {
                    this.emitFullLifeSpanEvent = false;
                    const component = args[0];
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS[component]
                    ];
                    this.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
                }
                break;
            }
            case 'EnableDoNotDisturb'.toLowerCase(): {
                const start = args[0];
                const end = args[1];
                if ((start !== '') && (end !== '')) {
                    this.run('SetDoNotDisturb', 1, start, end);
                } else {
                    this.run('SetDoNotDisturb', 1);
                }
                break;
            }
            case 'DisableDoNotDisturb'.toLowerCase(): {
                this.run('SetDoNotDisturb', 0);
                break;
            }
            case 'SetDoNotDisturb'.toLowerCase(): {
                const enable = Number(!!args[0]);
                const start = args[1];
                const end = args[2];
                if ((start !== '') && (end !== '')) {
                    this.sendCommand(new VacBotCommand.SetDoNotDisturb(enable, start, end));
                } else if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetDoNotDisturb(enable));
                }
                break;
            }
            case 'GetWaterLevel'.toLowerCase():
            case 'GetWaterBoxInfo'.toLowerCase():
            case 'GetWaterInfo'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetWaterInfo());
                break;
            case 'GetCleanLogs'.toLowerCase():
                if ((this.getModelType() === 'T9') || (this.getModelType() === 'X1')) {
                    this.callCleanResultsLogsApi().then((logData) => {
                        this.handleCleanLogs(logData);
                        let cleanLog = [];
                        for (let i in this.cleanLog) {
                            if (this.cleanLog.hasOwnProperty(i)) {
                                cleanLog.push(this.cleanLog[i]);
                            }
                        }
                        this.ecovacs.emitMessage('CleanLog', cleanLog);
                        this.ecovacs.emitMessage('CleanLog_lastImageUrl', this.cleanLog_lastImageUrl);
                        this.ecovacs.emitMessage('CleanLog_lastImageTimestamp', this.cleanLog_lastTimestamp); // Deprecated
                        this.ecovacs.emitMessage('CleanLog_lastTimestamp', this.cleanLog_lastTimestamp);
                        this.ecovacs.emitMessage('CleanLog_lastSquareMeters', this.cleanLog_lastSquareMeters);
                        this.ecovacs.emitMessage('CleanLog_lastTotalTimeString', this.cleanLog_lastTotalTimeString);
                        this.ecovacs.emitMessage('LastCleanLogs', {
                            'timestamp': this.cleanLog_lastTimestamp,
                            'squareMeters': this.cleanLog_lastSquareMeters,
                            'totalTime': this.cleanLog_lastTotalTime,
                            'totalTimeFormatted': this.cleanLog_lastTotalTimeString,
                            'imageUrl': this.cleanLog_lastImageUrl
                        });
                    });
                } else {
                    this.sendCommand(new VacBotCommand.GetCleanLogs());
                }
                break;
            case 'GetError'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetError());
                break;
            case 'Relocate'.toLowerCase():
                this.sendCommand(new VacBotCommand.Relocate());
                break;
            case 'GetVolume'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetVolume());
                break;
            case 'SetVolume'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetVolume(args[0]));
                }
                break;
            case 'EnableAdvancedMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetAdvancedMode(1));
                break;
            case 'DisableAdvancedMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetAdvancedMode(0));
                break;
            case 'GetAdvancedMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAdvancedMode());
                break;
            case 'GetRecognization'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetRecognization());
                break;
            case 'SetRecognization'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetRecognization(args[0]));
                break;
            case 'GetTrueDetect'.toLowerCase():
                if (tools.getCmdForObstacleDetection(this.getModelName()) === "Recognization") {
                    this.sendCommand(new VacBotCommand.GetRecognization());
                } else {
                    this.sendCommand(new VacBotCommand.GetTrueDetect());
                }
                break;
            case 'EnableAIVI'.toLowerCase():
            case 'EnableAIVI3D'.toLowerCase():
            case 'EnableTrueDetect'.toLowerCase():
                if (tools.getCmdForObstacleDetection(this.getModelName()) === "Recognization") {
                    this.sendCommand(new VacBotCommand.SetRecognization(1));
                } else {
                    this.sendCommand(new VacBotCommand.SetTrueDetect(1));
                }
                break;
            case 'DisableAIVI'.toLowerCase():
            case 'DisableAIVI3D'.toLowerCase():
            case 'DisableTrueDetect'.toLowerCase():
                if (tools.getCmdForObstacleDetection(this.getModelName()) === "Recognization") {
                    this.sendCommand(new VacBotCommand.SetRecognization(0));
                } else {
                    this.sendCommand(new VacBotCommand.SetTrueDetect(0));
                }
                break;
            case 'SetAIVI'.toLowerCase():
            case 'SetAIVI3D'.toLowerCase():
            case 'SetTrueDetect'.toLowerCase():
                if (tools.getCmdForObstacleDetection(this.getModelName()) === "Recognization") {
                    this.sendCommand(new VacBotCommand.SetRecognization(args[0]));
                } else {
                    this.sendCommand(new VacBotCommand.SetTrueDetect(args[0]));
                }
                break;
            case 'EmptyDustBin'.toLowerCase():
            case 'EmptySuctionStation'.toLowerCase():
                this.sendCommand(new VacBotCommand.EmptyDustBin());
                break;
            case 'GetAutoEmpty'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAutoEmpty());
                break;
            case 'SetAutoEmpty'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetAutoEmpty(args[0]));
                }
                break;
            case 'EnableAutoEmpty'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetAutoEmpty(1));
                break;
            case 'DisableAutoEmpty'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetAutoEmpty(0));
                break;
            case 'GetDusterRemind'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetDusterRemind());
                break;
            case 'SetDusterRemind'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetDusterRemind(args[0], args[1]));
                }
                break;
            case 'GetCarpetPressure'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetCarpetPressure());
                break;
            case 'SetCarpetPressure'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetCarpetPressure(args[0]));
                }
                break;
            case 'EnableCarpetPressure'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetCarpetPressure(1));
                break;
            case 'DisableCarpetPressure'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetCarpetPressure(0));
                break;
            case 'GetCleanState_V2'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanState_V2());
                break;
            case 'Clean_V2'.toLowerCase(): {
                if (tools.isAirPurifier(this.deviceClass)) {
                    this.sendCommand(new VacBotCommand.Clean_V2('move'));
                } else {
                    this.sendCommand(new VacBotCommand.Clean_V2());
                }
                break;
            }
            case 'SpotArea_V2'.toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 0;
                if (area !== '') {
                    this.sendCommand(new VacBotCommand.SpotArea_V2(area, cleanings));
                }
                break;
            }
            case 'CustomArea_V2'.toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 1;
                const doNotClean = args[2] || 0;
                if (area !== '') {
                    this.sendCommand(new VacBotCommand.CustomArea_V2(area, cleanings, doNotClean));
                }
                break;
            }
            case 'HostedCleanMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.HostedCleanMode());
                break;
            case 'GoToPosition'.toLowerCase(): {
                let area = args[0].toString();
                if (area !== '') {
                    if ((this.getModelType() === 'T9') || (this.getModelType() === 'X1')) {
                        this.run('MapPoint_V2', area);
                    } else if (this.getModelType() === 'T8') {
                        area = area + ',' + area;
                        this.run('CustomArea_V2', area, 1, 1);
                    }
                }
                break;
            }
            case 'MapPoint_V2'.toLowerCase(): {
                const area = args[0].toString();
                if (area !== '') {
                    this.sendCommand(new VacBotCommand.MapPoint_V2(area));
                }
                break;
            }
            case 'GetCleanCount'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanCount());
                break;
            case 'SetCleanCount'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetCleanCount(args[0]));
                }
                break;
            case 'GetCleanPreference'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanPreference());
                break;
            case 'GetStationState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetStationState());
                break;
            case 'GetStationInfo'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetStationInfo());
                break;
            case "GetSchedule_V2".toLowerCase():
                this.sendCommand(new VacBotCommand.GetSchedule_V2());
                break;
            case 'GetWashInterval'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetWashInterval());
                break;
            case 'SetWashInterval'.toLowerCase():
                if (args.length >= 1) {
                    const washInterval = Number(args[0]);
                    if ((washInterval === 10) || (washInterval === 15) || (washInterval === 25)) {
                        this.sendCommand(new VacBotCommand.SetWashInterval(washInterval));
                    }
                }
                break;
            case 'GetAirDrying'.toLowerCase():
                if (this.getModelType() === 'yeedi') {
                    this.sendCommand(new VacBotCommand.GetAirDrying());
                } else {
                    this.sendCommand(new VacBotCommand.GetStationState());
                }
                break;
            case 'SetAirDrying'.toLowerCase():
                if (args.length >= 1) {
                    if (this.getModelType() === 'yeedi') {
                        this.sendCommand(new VacBotCommand.SetAirDrying(args[0]));
                    } else {
                        this.sendCommand(new VacBotCommand.Drying(args[0]));
                    }
                }
                break;
            case 'AirDryingStart'.toLowerCase():
                if (this.getModelType() === 'yeedi') {
                    this.sendCommand(new VacBotCommand.SetAirDrying('start'));
                } else {
                    this.sendCommand(new VacBotCommand.Drying(1));
                }
                break;
            case 'AirDryingStop'.toLowerCase():
                if (this.getModelType() === 'yeedi') {
                    this.sendCommand(new VacBotCommand.SetAirDrying('stop'));
                } else {
                    this.sendCommand(new VacBotCommand.Drying(4));
                }
                break;
            case 'Drying'.toLowerCase():
                if (args.length >= 1) {
                    let value = args[0];
                    let act = Number(value);
                    if (isNaN(act)) {
                        // 'start' and 'stop' are also valid arguments
                        act = value === 'start' ? 1 : 4;
                    }
                    if ((act === 1) || (act === 4)) {
                        this.sendCommand(new VacBotCommand.Drying(act));
                    }
                }
                break;
            case 'Washing'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.Washing(args[0]));
                }
                break;
            case 'WashingStart'.toLowerCase():
                this.sendCommand(new VacBotCommand.Washing('start'));
                break;
            case 'WashingStop'.toLowerCase():
                this.sendCommand(new VacBotCommand.Washing('stop'));
                break;
            case 'SetCleanPreference'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetCleanPreference(args[0]));
                }
                break;
            case 'EnableCleanPreference'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetCleanPreference(1));
                break;
            case 'DisableCleanPreference'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetCleanPreference(0));
                break;
            case 'GetMapState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetMapState());
                break;
            case 'GetMultiMapState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetMultiMapState());
                break;
            case 'GetAICleanItemState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAICleanItemState());
                break;
            case 'GetAIMap'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAIMap());
                break;
            case 'GetMopOnlyMode'.toLowerCase():
            case 'GetSweepOnlyMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetSweepMode());
                break;
            case 'EnableMopOnlyMode'.toLowerCase():
            case 'EnableSweepOnlyMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetSweepMode(1));
                break;
            case 'DisableMopOnlyMode'.toLowerCase():
            case 'DisableSweepOnlyMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetSweepMode(0));
                break;
            case 'SetMopOnlyMode'.toLowerCase():
            case 'SetSweepOnlyMode'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetSweepMode(args[0]));
                }
                break;
            case 'GetSweepMode'.toLowerCase():
            case 'GetCustomAreaMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetCustomAreaMode());
                break;
            case 'SetSweepMode'.toLowerCase():
            case 'SetCustomAreaMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetCustomAreaMode(args[0]));
                break;
            case 'GetBorderSpin'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetBorderSpin());
                break;
            case 'GetWorkMode'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetWorkMode());
                break;
            case 'SetWorkMode'.toLowerCase():
                if (args.length >= 1) {
                    let workMode = args[0];
                    if (dictionary.WORKMODE_TO_ECOVACS(workMode)) {
                        workMode = dictionary.WORKMODE_TO_ECOVACS(workMode);
                    }
                    if ((workMode >= 0) && (workMode <= 3)) {
                        this.sendCommand(new VacBotCommand.SetWorkMode(workMode));
                    }
                }
                break;
            case 'EnableBorderSpin'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetBorderSpin(1));
                break;
            case 'DisableBorderSpin'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetBorderSpin(0));
                break;
            case 'SetBorderSpin'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetBorderSpin(args[0]));
                }
                break;
            case 'GetTimeZone'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetTimeZone());
                break;
            case 'GetOta'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetOta());
                break;
            case 'GetVoiceAssistantState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetVoiceAssistantState());
                break;
            case 'SetVoiceAssistantState'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetVoiceAssistantState(args[0]));
                }
                break;
            case 'EnableVoiceAssistant':
                this.sendCommand(new VacBotCommand.SetVoiceAssistantState(1));
                break;
            case 'DisableVoiceAssistant':
                this.sendCommand(new VacBotCommand.SetVoiceAssistantState(0));
                break;
            case 'SetBlock'.toLowerCase():
                if (args.length >= 3) {
                    this.sendCommand(new VacBotCommand.SetBlock(args[0], args[1], args[2]));
                }
                break;
            case 'GetRelocationState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetRelocationState());
                break;
            case 'GetLiveLaunchPwdState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetLiveLaunchPwdState());
                break;
            case 'GetDrivingWheel'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetDrivingWheel());
                break;
            case 'GetChildLock'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetChildLock());
                break;
            case 'SetChildLock'.toLowerCase():
                this.sendCommand(new VacBotCommand.SetChildLock(args[0]));
                break;
            case 'GetBlock'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetBlock());
                break;
            case 'GetTotalStats'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetTotalStats());
                break;
            case 'GetWifiList'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetWifiList());
                break;
            case 'GetScene'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetScene());
                break;
            case 'VideoOpened'.toLowerCase():
                this.sendCommand(new VacBotCommand.VideoOpened());
                break;
            case 'GetAudioCallState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAudioCallState());
                break;
            case 'SetVoice'.toLowerCase():
                if (args.length >= 6) {
                    this.sendCommand(new VacBotCommand.SetVoice(args[0], args[1], args[2], args[3], args[4], args[5]));
                }
                break;
            case 'GetVoiceLifeRemindState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetVoiceLifeRemindState());
                break;
            case 'GetAntiDrop'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAntiDrop());
                break;
            // ==================================
            // Airbot Z1 / Z1 Air Quality Monitor
            // ==================================
            case 'GetAirQuality'.toLowerCase(): // Airbot Z1
                this.sendCommand(new VacBotCommand.GetAirQuality());
                break;
            case 'GetJCYAirQuality'.toLowerCase(): // Z1 Air Quality Monitor
                this.sendCommand(new VacBotCommand.GetJCYAirQuality());
                break;
            case 'GetThreeModuleStatus'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetThreeModuleStatus());
                break;
            case 'GetThreeModule'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetThreeModule());
                break;
            case 'SetThreeModule'.toLowerCase():
                if (args.length >= 3) {
                    this.sendCommand(new VacBotCommand.SetThreeModule(args[0], args[1], args[2]));
                }
                break;
            case 'SetFreshenerLevel'.toLowerCase():
                if (args.length >= 2) {
                    this.sendCommand(new VacBotCommand.SetFreshenerLevel(args[0], args[1]));
                }
                break;
            case 'SetHumidifierLevel'.toLowerCase():
                if (args.length >= 2) {
                    this.sendCommand(new VacBotCommand.SetHumidifierLevel(args[0], args[1]));
                }
                break;
            case 'SetUVCleaner'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetUVCleaner(args[0]));
                }
                break;
            case 'SetFanSpeed'.toLowerCase(): // GetFanSpeed => GetCleanSpeed
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetFanSpeed(args[0]));
                }
                break;
            case 'GetBlueSpeaker'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetBlueSpeaker());
                break;
            case 'SetBlueSpeaker'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetBlueSpeaker(args[0]));
                }
                break;
            case 'GetVoiceSimple'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetVoiceSimple());
                break;
            case 'SetVoiceSimple'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetVoiceSimple(args[0]));
                }
                break;
            case 'GetMonitorAirState'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetMonitorAirState());
                break;
            case 'SetMonitorAirState'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetMonitorAirState(args[0]));
                }
                break;
            case 'GetAngleFollow'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAngleFollow());
                break;
            case 'SetAngleFollow'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetAngleFollow(args[0]));
                }
                break;
            case 'GetMic'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetMic());
                break;
            case 'SetMic'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetMic(args[0]));
                }
                break;
            case 'GetAirbotAutoModel'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAirbotAutoModel());
                break;
            case 'SetAirbotAutoModel'.toLowerCase():
                if (args.length >= 3) {
                    // on, aqEnd, aqStart
                    this.sendCommand(new VacBotCommand.SetAirbotAutoModel(args[0], args[1], args[2]));
                }
                break;
            case 'GetAutonomousClean'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAutonomousClean());
                break;
            case 'SetAutonomousClean'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetAutonomousClean(args[0]));
                }
                break;
            case 'GetAtmoVolume'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAtmoVolume());
                break;
            case 'SetAtmoVolume'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetAtmoVolume(args[0]));
                }
                break;
            case 'GetAtmoLight'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetAtmoLight());
                break;
            case 'SetAtmoLight'.toLowerCase():
                if (args.length >= 1) {
                    // intensity
                    this.sendCommand(new VacBotCommand.SetAtmoLight(args[0]));
                }
                break;
            case 'GetHumanoidFollow'.toLowerCase():
                this.sendCommand(new VacBotCommand.GetHumanoidFollow());
                break;
            case 'SinglePoint_V2'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SinglePoint_V2(args[0]));
                }
                break;
            case 'Area_V2'.toLowerCase():
                this.sendCommand(new VacBotCommand.Area_V2());
                break;
            case 'GetMapTrace_V2'.toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.GetMapTrace_V2(args[0]));
                }
                break;
            case 'GetEfficiency'.toLowerCase():
                this.sendCommand(new VacBotCommand.Generic('getEfficiency'));
                break;
        }
    }
}

module.exports = VacBot_950type;
