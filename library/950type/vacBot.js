'use strict';

const VacBotCommand = require('./command');
const VacBot = require('../vacBot');
const tools = require('../tools');
const mapTools = require('../mapTools');
const map = require('../mapTemplate');
const dictionary = require('./dictionary');
const {errorCodes} = require('../errorCodes.json');

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
        this.relocationState = null;
        this.firmwareVersion = null;
    }

    /**
     * Handle the payload of the `CleanInfo` response/message
     * (e.g. charge status, clean status and the last area values)
     * @param {Object} payload
     */
    handleCleanInfo(payload) {
        tools.envLog("[handleCleanInfo] payload: ", JSON.stringify(payload));
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
                if (typeof content === "object") {
                    areaValues = content['value'];
                } else {
                    areaValues = content;
                }
                if (type === 'customArea') {
                    if (typeof content === 'object') {
                        const doNotClean = content['donotClean'];
                        if (doNotClean === 1) {
                            // Controlled via Video Manager
                            this.cleanReport = 'setLocation';
                        }
                    }
                    this.currentCustomAreaValues = areaValues;
                }
                else if (type === 'spotArea') {
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
                    tools.envLog("[VacBot] *** chargeStatus = %s", this.chargeStatus);
                }
            } else if (dictionary.CLEAN_MODE_FROM_ECOVACS[payload['state']] === 'idle') {
                // when clean state = idle the bot can be charging on the dock or the return to dock has been canceled
                // if this is not run, the status when canceling the return stays on 'returning'
                this.run('GetChargeState');
            }
        }
        tools.envLog("[VacBot] *** cleanReport = %s", this.cleanReport);
    }

    /**
     * Handle the payload of the `Battery` response/message (battery level)
     * @param {Object} payload
     */
    handleBattery(payload) {
        this.batteryLevel = payload['value'];
        if (payload.hasOwnProperty('isLow')) {
            this.batteryIsLow = !!Number(payload['isLow']);
            tools.envLog(`[VacBot] *** batteryIsLow = ${this.batteryIsLow}`);
        }
        tools.envLog(`[VacBot] *** batteryLevel = ${this.batteryLevel}%`, );
    }

    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload) {
        for (let index in payload) {
            if (payload[index]) {
                const type = payload[index]["type"];
                let component = type;
                if (dictionary.COMPONENT_FROM_ECOVACS[type]) {
                    component = dictionary.COMPONENT_FROM_ECOVACS[type];
                } else {
                    tools.envLog('[VacBot] Unknown life span component type: %s', type);
                    this.ecovacs.emit('Debug', `Unknown life span component type: ${type}`);
                }
                const left = payload[index]["left"];
                const total = payload[index]["total"];
                const lifespan = parseInt(left) / parseInt(total) * 100;
                this.components[component] = Number(lifespan.toFixed(2));
                tools.envLog("[VacBot] lifespan %s: %s", component, this.components[component]);
            }
        }
        tools.envLog("[VacBot] lifespan components : %s", JSON.stringify(this.components));
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
                tools.envLog("[VacBot] *** chargePosition = " + JSON.stringify(this.chargePosition));
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
                let currentSpotAreaID = mapTools.isPositionInSpotArea(posX, posY, this.mapSpotAreaInfos[this.currentMapMID]);
                let isInvalid = Number(deebotPos['invalid']) === 1;
                let distanceToChargingStation = null;
                if (this.chargePosition) {
                    const pos = deebotPos['x'] + ',' + deebotPos['y'];
                    const chargePos = this.chargePosition.x + ',' + this.chargePosition.y;
                    distanceToChargingStation = mapTools.getDistanceToChargingStation(pos, chargePos);
                }
                tools.envLog("[VacBot] *** currentSpotAreaID = " + currentSpotAreaID);
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
                tools.envLog("[VacBot] *** deebotPosition = " + JSON.stringify(this.deebotPosition));
            }
        }
    }

    /**
     * TODO: Find out the value of the 'Evt' message
     * @param {Object} payload - The payload of the event.
     */
    handleEvt(payload) {
        tools.envLog("[VacBot] *** handleEvt payload = %s", JSON.stringify(payload));
        const code = payload['code'];
        tools.envLog("[VacBot] *** handleEvt code = %s", code);
    }

    /**
     * Handle the payload of the `Speed` response/message (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleSpeed(payload) {
        const speed = payload['speed'];
        this.cleanSpeed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        tools.envLog("[VacBot] *** cleanSpeed = %s", this.cleanSpeed);
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

        tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
        tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
        tools.envLog("[VacBot] *** netInfoWifiSignal = %s", this.netInfoWifiSignal);
        tools.envLog("[VacBot] *** netInfoMAC = %s", this.netInfoMAC);
    }

    /**
     * Handle the payload of the `WaterInfo` response/message
     * (water level and water box status)
     * @param {Object} payload
     */
    handleWaterInfo(payload) {
        this.waterLevel = payload['amount'];
        tools.envLog("[VacBot] *** waterLevel = " + this.waterLevel);
        if (this.sleepStatus === 0) {
            this.waterboxInfo = payload['enable'];
            tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
            if (payload.hasOwnProperty('type')) {
                // 1 = Regular
                // 2 = OZMO Pro
                this.moppingType = payload['type'];
                tools.envLog("[VacBot] *** WaterInfo type = " + payload['type']);
            }
            if (payload.hasOwnProperty('sweepType')) {
                // Scrubbing pattern
                // 1 = Quick scrubbing
                // 2 = Deep scrubbing
                this.scrubbingType = payload['sweepType'];
                tools.envLog("[VacBot] *** WaterInfo sweepType = " + payload['sweepType']);
            }
        }
    }

    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload) {
        tools.envLog("[handleChargeState] payload: ", JSON.stringify(payload));
        let status = null;
        const isCharging = parseInt(payload['isCharging']);
        if (isCharging === 1) {
            status = 'charging';
        } else if (isCharging === 0) {
            status = 'idle';
        }
        if (status) {
            this.chargeStatus = status;
        }
    }

    /**
     * Handle the payload of the `Sleep` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload) {
        this.sleepStatus = payload['enable'];
        tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
    }

    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload) {
        tools.envLog("[handleCleanLogs] payload: ", this.removeFromLogs(JSON.stringify(payload)));
        let logs = [];
        if (payload.hasOwnProperty('logs')) {
            logs = payload['logs'];
        } else if (payload.hasOwnProperty('log')) {
            logs = payload['log'];
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
                        tools.envLog("[VacBot] *** cleanLog_lastImageUrl = " + this.cleanLog_lastImageUrl);
                        tools.envLog("[VacBot] *** cleanLog_lastTimestamp = " + this.cleanLog_lastTimestamp);
                        tools.envLog("[VacBot] *** cleanLog_lastSquareMeters = " + this.cleanLog_lastSquareMeters);
                        tools.envLog("[VacBot] *** cleanLog_lastTotalTime = " + this.cleanLog_lastTotalTime);
                        tools.envLog("[VacBot] *** cleanLog_lastTotalTimeString = " + this.cleanLog_lastTotalTimeString);
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
        tools.envLog("[VacBot] *** cleanLogs = " + this.cleanLog);
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
        this.relocationState = payload['state'];
        tools.envLog("[VacBot] *** relocationState = " + this.relocationState);
    }

    /**
     * Handle the payload of the `Volume` response/message
     * @param {Object} payload
     */
    handleVolume(payload) {
        this.volume = payload['volume'];
        tools.envLog("[VacBot] *** volume = " + this.volume);
    }

    /**
     * Handle the payload of the `BreakPoint` response/message
     * @param {Object} payload
     */
    handleBreakPoint(payload) {
        this.breakPoint = payload['enable'];
        tools.envLog("[VacBot] *** breakPoint = " + this.breakPoint);
    }

    /**
     * Handle the payload of the `Block` response/message
     * @param {Object} payload
     */
    handleBlock(payload) {
        this.block = payload['enable'];
        tools.envLog("[VacBot] *** block = " + this.block);
    }

    /**
     * Handle the payload of the `AutoEmpty` response/message
     * @param {Object} payload
     */
    handleAutoEmpty(payload) {
        this.autoEmpty = payload['enable'];
        tools.envLog("[VacBot] *** autoEmpty = " + this.autoEmpty);
    }

    /**
     * Handle the payload of the `AdvancedMode` response/message
     * @param {Object} payload
     */
    handleAdvancedMode(payload) {
        this.advancedMode = payload['enable'];
        tools.envLog("[VacBot] *** advancedMode = " + this.advancedMode);
    }

    /**
     * Handle the payload of the `TrueDetect` response/message
     * @param {Object} payload
     */
    handleTrueDetect(payload) {
        this.trueDetect = payload['enable'];
        tools.envLog("[VacBot] *** trueDetect = " + this.trueDetect);
    }

    /**
     * Handle the payload of the `CleanCount` response/message
     * @param {Object} payload
     */
    handleCleanCount(payload) {
        this.cleanCount = payload['count'];
        tools.envLog("[VacBot] *** cleanCount = " + this.cleanCount);
    }

    /**
     * Handle the payload of the `DusterRemind` response/message
     * @param {Object} payload
     */
    handleDusterRemind(payload) {
        this.dusterRemind = {
            enabled: payload['enable'],
            period: payload['period']
        };
        tools.envLog("[VacBot] *** dusterRemind = " + JSON.stringify(this.dusterRemind));
    }

    /**
     * Handle the payload of the `CarpertPressure` (sic) response/message
     * @param {Object} payload
     */
    handleCarpetPressure(payload) {
        this.carpetPressure = payload['enable'];
        tools.envLog("[VacBot] *** carpetPressure = " + this.carpetPressure);
    }

    handleCleanPreference(payload) {
        this.cleanPreference = payload['enable'];
        tools.envLog("[VacBot] *** cleanPreference = " + this.cleanPreference);
    }

    handleLiveLaunchPwdState(payload) {
        this.liveLaunchPwdState = {
            state: payload.state,
            hasPwd: payload.hasPwd
        };
        tools.envLog("[VacBot] *** cleanPreference = " + JSON.stringify(this.cleanPreference));
    }

    /**
     * Handle the payload of the `Stats` response/message
     * @param {Object} payload
     */
    handleStats(payload) {
        tools.envLog("[handleStats] payload: " + JSON.stringify(payload));
        this.currentStats = {
            'cleanedArea': payload['area'],
            'cleanedSeconds': payload['time'],
            'cleanType': payload['type']
        };
    }

    /**
     * Handle the payload of the `Sched` response/message (Schedule)
     * @param {Object} payload
     */
    handleSched(payload) {
        this.schedule = [];
        for (let c = 0; c < payload.length; c++) {
            const resultData = payload[c];
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

    /**
     * Handle the payload of the `CachedMapInfo` response/message
     * @param {Object} payload
     */
    handleCachedMapInfo(payload) {
        this.currentMapName = 'unknown';
        this.maps = {"maps": []};
        const infoEvent = payload['info'];
        for (let mapIndex in infoEvent) {
            if (infoEvent.hasOwnProperty(mapIndex)) {
                if (infoEvent[mapIndex]['mid'] !== '0') {
                    this.maps["maps"].push(
                        new map.EcovacsMap(
                            infoEvent[mapIndex]['mid'],
                            infoEvent[mapIndex]['index'],
                            infoEvent[mapIndex]['name'],
                            infoEvent[mapIndex]['status'],
                            infoEvent[mapIndex]['using'],
                            infoEvent[mapIndex]['built']
                        )
                    );
                    if (infoEvent[mapIndex]['using'] === 1) {
                        this.currentMapName = infoEvent[mapIndex]['name'];
                        this.currentMapMID = infoEvent[mapIndex]['mid'];
                        this.currentMapIndex = infoEvent[mapIndex]['index'];
                    }
                }
            }
        }
        tools.envLog("[VacBot] *** currentMapName = " + this.currentMapName);
        tools.envLog("[VacBot] *** currentMapMID = " + this.currentMapMID);
        tools.envLog("[VacBot] *** currentMapIndex = " + this.currentMapIndex);
        tools.envLog("[VacBot] *** maps = " + JSON.stringify(this.maps));
    }

    /**
     * Handle the payload of the `MapSet` response/message
     * @param {Object} payload
     */
    handleMapSet(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID)) {
            if (this.currentMapMID) {
                mapMID = this.currentMapMID;
            } else {
                tools.envLog("[VacBot] *** mid is not a number. Skipping message for map");
                return {mapsetEvent: 'skip'};
            }
        }
        if (payload['type'] === 'ar') {
            let mapSpotAreas = new map.EcovacsMapSpotAreas(mapMID, payload['msid']);
            for (let mapIndex in payload['subsets']) {
                if (payload['subsets'].hasOwnProperty(mapIndex)) {
                    mapSpotAreas.push(new map.EcovacsMapSpotArea(payload['subsets'][mapIndex]['mssid']));
                }
            }
            tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
            return {
                mapsetEvent: 'MapSpotAreas',
                mapsetData: mapSpotAreas
            };
        } else if ((payload['type'] === 'vw') || (payload['type'] === 'mw')) {
            if (typeof this.mapVirtualBoundaries[mapMID] === 'undefined') {
                tools.envLog("[VacBot] *** initialize mapVirtualBoundaries for map " + mapMID);
                this.mapVirtualBoundaries[mapMID] = new map.EcovacsMapVirtualBoundaries(mapMID);  //initialize array for mapVirtualBoundaries if not existing
                this.mapVirtualBoundariesResponses[mapMID] = [false, false];
            }
            for (let mapIndex in payload['subsets']) {
                if (payload['subsets'].hasOwnProperty(mapIndex)) {
                    tools.envLog("[VacBot] *** push mapVirtualBoundaries for mssid " + payload['subsets'][mapIndex]['mssid']);
                    this.mapVirtualBoundaries[mapMID].push(new map.EcovacsMapVirtualBoundary(payload['subsets'][mapIndex]['mssid'], payload['type']));
                }
            }
            if (payload['type'] === 'vw') {
                this.mapVirtualBoundariesResponses[mapMID][0] = true;
            } else if (payload['type'] === 'mw') {
                this.mapVirtualBoundariesResponses[mapMID][1] = true;
            }
            tools.envLog("[VacBot] *** mapVirtualBoundaries = " + JSON.stringify(this.mapVirtualBoundaries[mapMID]));
            if (this.mapVirtualBoundariesResponses[mapMID][0] && this.mapVirtualBoundariesResponses[mapMID][1]) { //only return if both responses were processed
                return {
                    mapsetEvent: 'MapVirtualBoundaries',
                    mapsetData: this.mapVirtualBoundaries[mapMID]
                };
            } else {
                tools.envLog("[VacBot] *** skip message for map  " + mapMID);
                return {
                    mapsetEvent: 'skip'
                };
            }
        }

        tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(payload['type']));
        return {mapsetEvent: 'error'};
    }

    /**
     * Handle the payload of the `MapSubSet` response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapSubset(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID)) {
            mapMID = this.currentMapMID;
        }
        if (payload['type'] === 'ar') {
            let mapSpotAreaBoundaries = payload['value'];
            if (payload['compress']) {
                mapSpotAreaBoundaries = await map.mapPieceToIntArray(payload['value']);
            }
            let customName = '';
            if (payload['name']) {
                customName = payload['name'];
            }
            //TODO: filter out reportMapSubSet events (missing data)
            //reportMapSubSet event comes without map reference, replace
            let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
                mapMID,
                payload['mssid'],
                payload['connections'], //reportMapSubSet event comes without connections
                mapSpotAreaBoundaries,
                payload['subtype'],
                customName
            );
            if (typeof this.mapSpotAreaInfos[mapMID] === 'undefined') {
                this.mapSpotAreaInfos[mapMID] = []; //initialize array for mapSpotAreaInfos if not existing
            }
            this.mapSpotAreaInfos[mapMID][payload['mssid']] = mapSpotAreaInfo;
            return {
                mapsubsetEvent: 'MapSpotAreaInfo',
                mapsubsetData: mapSpotAreaInfo
            };
        } else if ((payload['type'] === 'vw') || (payload['type'] === 'mw')) {
            let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(mapMID, payload['mssid'], payload['type'], payload['value']);
            if (typeof this.mapVirtualBoundaryInfos[mapMID] === 'undefined') {
                this.mapVirtualBoundaryInfos[mapMID] = []; //initialize array for mapVirtualBoundaryInfos if not existing
            }
            this.mapVirtualBoundaryInfos[mapMID][payload['mssid']] = mapVirtualBoundaryInfo;
            tools.envLog("[VacBot] *** MapVirtualBoundaryInfo = " + JSON.stringify(mapVirtualBoundaryInfo));
            return {
                mapsubsetEvent: 'MapVirtualBoundaryInfo',
                mapsubsetData: mapVirtualBoundaryInfo
            };
        }

        tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(payload['type']));
        return {
            mapsubsetEvent: 'error'
        };
    }

    /**
     * Handle the payload of the `MapInfo` response/message
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapInfo(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID)) {
            return null;
        }
        if (typeof this.mapImages[mapMID] === 'undefined') {
            this.mapImages[mapMID] = [];
        }
        if (typeof this.mapImages[mapMID][payload['type']] === 'undefined') {
            this.mapImages[mapMID][payload['type']] = new map.EcovacsMapImage(mapMID, payload['type'], payload['totalWidth'], payload['totalHeight'], payload['pixel'], payload['totalCount']);
        }
        if (payload['pieceValue'] !== '') {
            await this.mapImages[mapMID][payload['type']].updateMapPiece(payload['index'], payload['startX'], payload['startY'], payload['width'], payload['height'], payload['crc'], payload['value']);
        }
        try {
            return await this.mapImages[mapMID][payload['type']].getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
        } catch (e) {
            tools.envLog('[VacBot] Error calling getBase64PNG: %s', e.message);
            throw new Error(e);
        }
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     */
    handleMajorMap(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID)) {
            return;
        }
        if (!this.liveMapImage || (this.liveMapImage.mapID !== mapMID)) {
            console.log('DEBUG reset livemap');
            const type = payload['type'];
            const pieceWidth = payload['pieceWidth'];
            const pieceHeight = payload['pieceHeight'];
            const cellWidth = payload['cellWidth'];
            const cellHeight = payload['cellHeight'];
            const pixel = payload['pixel'];
            const value = payload['value'];
            this.liveMapImage = new map.EcovacsLiveMapImage(
                mapMID, type, pieceWidth, pieceHeight, cellWidth, cellHeight, pixel, value);
        } else {
            this.liveMapImage.updateMapDataPiecesCrc(payload['value']);
        }
    }

    /**
     * @todo: finish the implementation
     * @param {Object} payload
     * @returns {Promise<null|{mapID: any, mapType: any, mapBase64PNG: string}>}
     */
    async handleMinorMap(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID) || !this.liveMapImage || (this.liveMapImage.mapID !== mapMID)) {
            return null;
        }
        await this.liveMapImage.updateMapPiece(payload['pieceIndex'], payload['pieceValue']);
        try {
            return this.liveMapImage.getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
        } catch (e) {
            tools.envLog('[VacBot] Error calling getBase64PNG: %s', e.message);
            throw new Error(e);
        }
    }

    /**
     * Handle the payload of the `Error` response/message
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
            this.errorDescription = 'unknown errorCode: ' + this.errorCode;
        }
        tools.envLog("[VacBot] *** errorCode = " + this.errorCode);
        tools.envLog("[VacBot] *** errorDescription = " + this.errorDescription);
    }

    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command, ...args) {
        super.run(command, ...args);
        switch (command.toLowerCase()) {
            case "GetMapImage".toLowerCase(): {
                const mapID = args[0].toString(); // mapID is a string
                const mapType = args[1] || 'outline';
                this.createMapDataObject = true;
                this.createMapImage = true;
                this.createMapImageOnly = args[2] !== undefined ? args[2] : true;
                if (Number(mapID) > 0) {
                    this.sendCommand(new VacBotCommand.GetMapImage(mapID, mapType));
                }
                break;
            }
            case "GetMaps".toLowerCase(): {
                this.createMapImageOnly = false;
                this.createMapDataObject = !!args[0] || false;
                this.createMapImage = this.createMapDataObject && this.isMapImageSupported();
                if (args.length >= 2) {
                    this.createMapImage = !!args[1];
                }
                this.sendCommand(new VacBotCommand.GetMaps());
                break;
            }
            case "GetSpotAreas".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    this.sendCommand(new VacBotCommand.GetMapSpotAreas(mapID));
                }
                break;
            }
            case "GetSpotAreaInfo".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                if ((Number(mapID) > 0) && (spotAreaID !== '')) {
                    this.sendCommand(new VacBotCommand.GetMapSpotAreaInfo(mapID, spotAreaID));
                }
                break;
            }
            case "GetVirtualBoundaries".toLowerCase(): {
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
            case "GetVirtualBoundaryInfo".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (spotAreaID !== '')) {
                    this.sendCommand(new VacBotCommand.GetMapVirtualBoundaryInfo(mapID, spotAreaID, type));
                }
                break;
            }
            case "AddVirtualBoundary".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const coordinates = args[1];
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (coordinates !== '')) {
                    this.sendCommand(new VacBotCommand.AddMapVirtualBoundary(mapID, coordinates, type));
                }
                break;
            }
            case "DeleteVirtualBoundary".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = args[2];
                if ((Number(mapID) > 0) && (Number(spotAreaID) >= 0) && (tools.isValidVirtualWallType(type))) {
                    this.sendCommand(new VacBotCommand.DeleteMapVirtualBoundary(mapID, spotAreaID, type));
                }
                break;
            }
            case "GetLifeSpan".toLowerCase(): {
                if (!args.length) {
                    this.emitFullLifeSpanEvent = true;
                    this.components = {};
                    this.lastComponentValues = {};
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS['filter'],
                        dictionary.COMPONENT_TO_ECOVACS['side_brush']
                    ];
                    if (this.hasMainBrush()) {
                        componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['main_brush']);
                    }
                    if (this.hasUnitCareInfo()) {
                        componentsArray.push(dictionary.COMPONENT_TO_ECOVACS['unit_care']);
                    }
                    this.sendCommand(new VacBotCommand.GetLifeSpan(componentsArray));
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
            case "EnableDoNotDisturb".toLowerCase(): {
                const start = args[0];
                const end = args[1];
                if ((start !== '') && (end !== '')) {
                    this.sendCommand(new VacBotCommand.EnableDoNotDisturb(start, end));
                } else {
                    this.sendCommand(new VacBotCommand.EnableDoNotDisturb());
                }
                break;
            }
            case "SetDoNotDisturb".toLowerCase(): {
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
            case "GetWaterLevel".toLowerCase():
            case "GetWaterBoxInfo".toLowerCase():
            case "GetWaterInfo".toLowerCase():
                this.sendCommand(new VacBotCommand.GetWaterInfo());
                break;
            case "GetCleanLogs".toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanLogs());
                break;
            case "GetError".toLowerCase():
                this.sendCommand(new VacBotCommand.GetError());
                break;
            case "Relocate".toLowerCase():
                this.sendCommand(new VacBotCommand.Relocate());
                break;
            case "GetVolume".toLowerCase():
                this.sendCommand(new VacBotCommand.GetVolume());
                break;
            case "SetVolume".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetVolume(args[0]));
                }
                break;
            case "EnableAdvancedMode".toLowerCase():
                this.sendCommand(new VacBotCommand.SetAdvancedMode(1));
                break;
            case "DisableAdvancedMode".toLowerCase():
                this.sendCommand(new VacBotCommand.SetAdvancedMode(0));
                break;
            case "GetAdvancedMode".toLowerCase():
                this.sendCommand(new VacBotCommand.GetAdvancedMode());
                break;
            case "GetTrueDetect".toLowerCase():
                this.sendCommand(new VacBotCommand.GetTrueDetect());
                break;
            case "EnableTrueDetect".toLowerCase():
                this.sendCommand(new VacBotCommand.SetTrueDetect(1));
                break;
            case "DisableTrueDetect".toLowerCase():
                this.sendCommand(new VacBotCommand.SetTrueDetect(0));
                break;
            case "EmptyDustBin".toLowerCase():
            case "EmptySuctionStation".toLowerCase():
                this.sendCommand(new VacBotCommand.EmptyDustBin());
                break;
            case "GetAutoEmpty".toLowerCase():
                this.sendCommand(new VacBotCommand.GetAutoEmpty());
                break;
            case "SetAutoEmpty".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetAutoEmpty(args[0]));
                }
                break;
            case "EnableAutoEmpty".toLowerCase():
                this.sendCommand(new VacBotCommand.SetAutoEmpty(1));
                break;
            case "DisableAutoEmpty".toLowerCase():
                this.sendCommand(new VacBotCommand.SetAutoEmpty(0));
                break;
            case "GetDusterRemind".toLowerCase():
                this.sendCommand(new VacBotCommand.GetDusterRemind());
                break;
            case "SetDusterRemind".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetDusterRemind(args[0], args[1]));
                }
                break;
            case "GetCarpetPressure".toLowerCase():
                this.sendCommand(new VacBotCommand.GetCarpetPressure());
                break;
            case "SetCarpetPressure".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetCarpetPressure(args[0]));
                }
                break;
            case "EnableCarpetPressure".toLowerCase():
                this.sendCommand(new VacBotCommand.SetCarpetPressure(1));
                break;
            case "DisableCarpetPressure".toLowerCase():
                this.sendCommand(new VacBotCommand.SetCarpetPressure(0));
                break;
            case "GetCleanState_V2".toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanState_V2());
                break;
            case "Clean_V2".toLowerCase(): {
                this.sendCommand(new VacBotCommand.Clean_V2());
                break;
            }
            case "SpotArea_V2".toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 0;
                if (area !== '') {
                    this.sendCommand(new VacBotCommand.SpotArea_V2(area, cleanings));
                }
                break;
            }
            case "CustomArea_V2".toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 1;
                if (area !== '') {
                    this.sendCommand(new VacBotCommand.CustomArea_V2(area, cleanings));
                }
                break;
            }
            // TODO: this should be consolidated (and also the other V2 commands)
            case "GetMapInfo_V2".toLowerCase(): {
                this.sendCommand(new VacBotCommand.GetMapInfo_V2());
                break;
            }
            case "GetCleanCount".toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanCount());
                break;
            case "SetCleanCount".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetCleanCount(args[0]));
                }
                break;
            case "GetCleanPreference".toLowerCase():
                this.sendCommand(new VacBotCommand.GetCleanPreference());
                break;
            case "GetAirDrying".toLowerCase():
                this.sendCommand(new VacBotCommand.GetAirDrying());
                break;
            case "SetAirDrying".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetAirDrying(args[0]));
                }
                break;
            case "AirDryingStart".toLowerCase():
                this.sendCommand(new VacBotCommand.SetAirDrying('start'));
                break;
            case "AirDryingStop".toLowerCase():
                this.sendCommand(new VacBotCommand.SetAirDrying('stop'));
                break;
            case "SetCleanPreference".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.SetCleanPreference(args[0]));
                }
                break;
            case "EnableCleanPreference".toLowerCase():
                this.sendCommand(new VacBotCommand.SetCleanPreference(1));
                break;
            case "DisableCleanPreference".toLowerCase():
                this.sendCommand(new VacBotCommand.SetCleanPreference(0));
                break;
            case "GetRecognization".toLowerCase():
                this.sendCommand(new VacBotCommand.GetRecognization());
                break;
            case "GetMapState".toLowerCase():
                this.sendCommand(new VacBotCommand.GetMapState());
                break;
            case "GetAIMap".toLowerCase():
                this.sendCommand(new VacBotCommand.GetAIMap());
                break;
        }
    }
}

module.exports = VacBot_950type;
