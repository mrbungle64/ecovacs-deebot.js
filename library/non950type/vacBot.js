'use strict';

const VacBotCommand = require('./command');
const VacBot = require('../vacBot');
const tools = require('../tools');
const mapTools = require('../mapTools');
const map = require('../mapInfo');
const mapTemplate = require('../mapTemplate');
const dictionary = require('./dictionary');
const {errorCodes} = require('../errorCodes.json');
const constants = require("../constants");

/**
 * This class is relevant for non 950 type models
 * e.g. Deebot OZMO 930, (OZMO) 900 series (legacy models - some are MQTT based and the older ones are XMPP based)
 */
class VacBot_non950type extends VacBot {
    /**
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} [country] - the country where the Ecovacs account is registered
     * @param {string} [serverAddress=''] - the server address of the MQTT and XMPP server
     * @param {string} [authDomain=''] - the domain for authorization
     */
    constructor(user, hostname, resource, secret, vacuum, continent, country, serverAddress = '', authDomain = '') {
        super(user, hostname, resource, secret, vacuum, continent, country, serverAddress, authDomain);

        this.dustcaseInfo = null;
        this.mapPiecePacketsCrcArray = null;
    }

    /**
     * Handle the payload of the `CleanReport` response/message
     * e.g. charge status, clean status and the last area values
     * @param {Object} payload
     */
    handleCleanReport(payload) {
        if (payload.attrs) {
            const attrs = payload.attrs;
            let type = attrs['type'];
            tools.envLog("[VacBot] *** handleCleanReport type = " + type);
            if (dictionary.CLEAN_MODE_FROM_ECOVACS[type]) {
                type = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
            }
            const cleanType = type;
            let command = '';
            if (attrs.hasOwnProperty('st')) {
                command = dictionary.CLEAN_ACTION_FROM_ECOVACS[attrs['st']];
                tools.envLog("[VacBot] *** handleCleanReport st = " + command);
            } else if (attrs.hasOwnProperty('act')) {
                command = dictionary.CLEAN_ACTION_FROM_ECOVACS[attrs['act']];
                tools.envLog("[VacBot] *** handleCleanReport act = " + command);
            }
            if (command === 'stop' || command === 'pause') {
                type = command;
            }
            this.cleanReport = type;
            tools.envLog("[VacBot] *** cleanReport = " + this.cleanReport);

            if (attrs.hasOwnProperty('last')) {
                tools.envLog("[VacBot] *** clean last = %s seconds" + attrs["last"]);
            }

            if ((attrs.hasOwnProperty('a')) && (attrs.hasOwnProperty('t'))) {
                this.handleCurrentStatsValues(Number(attrs.a), Number(attrs.t), cleanType, type);
            }
            this.handleCurrentAreaValues(payload);
        }
    }

    /**
     * Handle the values for `currentStats`
     * @param {number} area - number of square meters
     * @param {number} seconds - number of seconds
     * @param {string} cleanType - the clean mode type
     * @param {string} [type=''] - the action type
     */
    handleCurrentStatsValues(area, seconds, cleanType, type = '') {
        // The OZMO 930 retains the stats values until the next cleaning start
        // The values should be reset if device is stopped
        if ((type !== 'stop') || (this.chargeStatus === 'returning')) {
            this.currentStats = {
                'cleanedArea': area,
                'cleanedSeconds': seconds,
                'cleanType': cleanType
            };
        } else {
            this.currentStats = {
                'cleanedArea': 0,
                'cleanedSeconds': 0,
                'cleanType': ''
            };
        }
    }

    /**
     * Handle the payload of the `CleanSt` response/message (Stats)
     * @param {Object} payload
     */
    handleCleanSt(payload) {
        if (payload.attrs) {
            const area = Number(payload.attrs.a);
            const seconds = Number(payload.attrs.l);
            const type = payload.attrs.type;
            this.handleCurrentStatsValues(area, seconds, type);
        }
    }

    /**
     * @param {Object} payload
     */
    handleCurrentAreaValues(payload) {
        this.currentSpotAreas = '';
        if (this.cleanReport === 'spot_area') {
            if (payload.attrs.hasOwnProperty('mid')) {
                this.currentSpotAreas = payload.attrs.mid;
            }
        } else if (payload.attrs.hasOwnProperty('p')) {
            let pValues = payload.attrs['p'];
            const pattern = /^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$/;
            if (pattern.test(pValues)) {
                const x1 = parseFloat(pValues.split(",")[0]).toFixed(1);
                const y1 = parseFloat(pValues.split(",")[1]).toFixed(1);
                const x2 = parseFloat(pValues.split(",")[2]).toFixed(1);
                const y2 = parseFloat(pValues.split(",")[3]).toFixed(1);
                this.currentCustomAreaValues = x1 + ',' + y1 + ',' + x2 + ',' + y2;
                tools.envLog("[VacBot] *** lastUsedAreaValues = " + pValues);
            } else {
                tools.envLog("[VacBot] *** lastUsedAreaValues invalid pValues = " + pValues);
            }
        }
    }

    /**
     * Handle the payload of the `BatteryInfo` response/message (battery level)
     * @param {Object} payload
     */
    handleBatteryInfo(payload) {
        let batteryLevel;
        if (payload.hasOwnProperty('ctl')) {
            batteryLevel = payload['ctl']['battery']['power'];
        } else if (payload.attrs) {
            batteryLevel = parseFloat(payload.attrs['power']);
        }
        if (batteryLevel !== undefined) {
            this.batteryLevel = batteryLevel;
            tools.envLog(`[VacBot] *** batteryLevel = ${this.batteryLevel}%`,);
        }
    }

    /**
     * Handle the payload of the `LifeSpan` response/message
     * (information about accessories components)
     * @param {Object} payload
     */
    handleLifespan(payload) {
        let type = null;
        if (payload.hasOwnProperty('type')) {
            // type attribute must be trimmed because of Deebot M88
            // { td: 'LifeSpan', type: 'DustCaseHeap ', ... }
            type = payload['type'].trim();
            type = dictionary.COMPONENT_FROM_ECOVACS[type];
        }

        if (!type) {
            tools.envLog("[VacBot] Unknown component type: ", payload);
            return;
        }

        let lifespan = null;
        if (payload.hasOwnProperty('val') && payload.hasOwnProperty('total')) {
            if (this.isN79series()) {
                // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/80
                // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/58
                lifespan = parseInt(payload['val']);
            } else {
                lifespan = parseInt(payload['val']) / parseInt(payload['total']) * 100;
            }
        } else if (payload.hasOwnProperty('val')) {
            lifespan = parseInt(payload['val']) / 100;
        } else if (payload.hasOwnProperty('left') && (payload.hasOwnProperty('total'))) {
            lifespan = parseInt(payload['left']) / parseInt(payload['total']) * 100; // This works e.g. for OZMO 930
        } else if (payload.hasOwnProperty('left')) {
            lifespan = parseInt(payload['left']) / 60; // This works e.g. for a Deebot 900/901
        }
        if (lifespan) {
            tools.envLog("[VacBot] lifeSpan %s: %s", type, lifespan);
            this.components[type] = Number(lifespan.toFixed(2));
        }
        tools.envLog("[VacBot] lifespan components: ", JSON.stringify(this.components));
    }

    /**
     * Handle the payload of the `Pos` response/message
     * (position of the vacuum and the charging station)
     * @param {Object} payload
     */
    handlePos(payload) {
        tools.envLog("[VacBot] *** deebotPosition payload: %s", JSON.stringify(payload));
        if (payload.attrs && payload.attrs.hasOwnProperty('p')) {
            const posX = Number(payload.attrs['p'].split(",")[0]);
            const posY = Number(payload.attrs['p'].split(",")[1]);
            const angle = payload.attrs['a'];
            let currentSpotAreaID = mapTools.getCurrentSpotAreaID(posX, posY, this.mapSpotAreaInfos[this.currentMapMID]);
            let distanceToChargingStation = null;
            if (this.chargePosition) {
                const pos = posX + ',' + posY;
                const chargePos = this.chargePosition.x + ',' + this.chargePosition.y;
                distanceToChargingStation = mapTools.getDistanceToChargingStation(pos, chargePos);
            }
            this.deebotPosition = {
                x: posX,
                y: posY,
                a: angle,
                isInvalid: false,
                currentSpotAreaID: currentSpotAreaID,
                currentSpotAreaName: this.getSpotAreaName(currentSpotAreaID),
                changeFlag: true,
                distanceToChargingStation: distanceToChargingStation
            };
            tools.envLog("[VacBot] *** deebotPosition = %s", JSON.stringify(this.deebotPosition));
        }
    }

    /**
     * Handle the payload of the `CleanSpeed` response/message
     * (vacuum power resp. suction power)
     * @param {Object} payload
     */
    handleCleanSpeed(payload) {
        if (payload.attrs.hasOwnProperty('speed')) {
            let speed = payload.attrs['speed'];
            if (dictionary.CLEAN_SPEED_FROM_ECOVACS[speed]) {
                speed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
                this.cleanSpeed = speed;
                tools.envLog("[VacBot] cleanSpeed: ", speed);
            } else {
                tools.envLog("[VacBot] Unknown clean speed: ", speed);
            }
        } else {
            tools.envLog("[VacBot] couldn't parse clean speed ", payload);
        }
    }

    /**
     * Handle the payload of the `NetInfo` response/message
     * (ip address and Wi-Fi ssid)
     * @param {Object} payload
     */
    handleNetInfo(payload) {
        if (payload.hasOwnProperty('wi')) {
            this.netInfoIP = payload['wi'];
            tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
        }
        if (payload.hasOwnProperty('s')) {
            this.netInfoWifiSSID = payload['s'];
            tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
        }
    }

    /**
     * Handle the payload of the `WaterPermeability` response/message (water level)
     * @param {Object} payload
     */
    handleWaterPermeability(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('v')) {
            this.waterLevel = Number(payload.attrs['v']);
            tools.envLog("[VacBot] *** waterLevel = %s", this.waterLevel);
        }
    }

    /**
     * Handle the payload of the `WaterBoxInfo` response/message (water tank status)
     * @param {Object} payload
     */
    handleWaterboxInfo(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('on')) {
            this.waterboxInfo = payload.attrs['on'];
            tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
        }
    }

    /**
     * Handle the payload of the `ChargeState` response/message (charge status)
     * @param {Object} payload
     */
    handleChargeState(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('type')) {
            const chargeStatus = payload.attrs['type'];
            if (dictionary.CHARGE_MODE_FROM_ECOVACS[chargeStatus]) {
                this.chargeStatus = dictionary.CHARGE_MODE_FROM_ECOVACS[chargeStatus];
                tools.envLog("[VacBot] *** chargeStatus = " + this.chargeStatus);
                if ((!this.useMqttProtocol()) && (this.chargeStatus === 'returning')) {
                    this.run('GetCleanState');
                }
            } else {
                tools.envLog("[VacBot] Unknown charging status '%s'", chargeStatus);
            }
        } else {
            tools.envLog("[VacBot] couldn't parse charge status ", payload);
        }
    }

    /**
     * Handle the payload of the `ChargerPos` response/message
     * (charger resp. charge position)
     * @param {Object} payload
     */
    handleChargePos(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('p') && payload.attrs.hasOwnProperty('a')) {
            this.chargePosition = {
                x: payload.attrs['p'].split(",")[0],
                y: payload.attrs['p'].split(",")[1],
                a: payload.attrs['a'],
                changeFlag: true
            };
            tools.envLog("[VacBot] *** chargePosition = %s", JSON.stringify(this.chargePosition));
        }
    }

    /**
     * Handle the payload of the `DustCaseST` response/message (dust case status)
     * @param {Object} payload
     */
    handleDustCaseST(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('st')) {
            this.dustcaseInfo = payload.attrs['st'];
            tools.envLog("[VacBot] *** dustcaseInfo = " + this.dustcaseInfo);
        }
    }

    /**
     * Handle the payload of the `SleepStatus` response/message (sleep status)
     * @param {Object} payload
     */
    handleSleepStatus(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('st')) {
            this.sleepStatus = payload.attrs['st'];
            tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
        }
    }

    /**
     * Handle the payload of the `CleanLogs` response/message
     * @param {Object} payload
     */
    handleCleanLogs(payload) {
        if (payload.attrs) {
            const count = payload.children.length;
            for (let c = 0; c < count; c++) {
                let childElement = payload.children[c];
                if (childElement) {
                    let timestamp;
                    let id;
                    let squareMeters;
                    let lastTime;
                    let type;
                    let imageUrl;
                    let stopReason;
                    let trigger;
                    if (childElement.attrs) {
                        timestamp = parseInt(childElement.attrs['s']);
                    } else {
                        timestamp = parseInt(childElement['ts']);
                    }
                    if (childElement.attrs) {
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
                        squareMeters = parseInt(childElement['area']);
                        lastTime = parseInt(childElement['last']);
                        type = childElement['type'];
                        imageUrl = childElement['imageUrl'];
                    }
                    let date = new Date(timestamp * 1000);
                    let totalTimeString = tools.getTimeStringFormatted(lastTime);

                    if (c === 0) {
                        if (imageUrl) {
                            this.cleanLog_lastImageUrl = imageUrl;
                            tools.envLog("[VacBot] *** cleanLog_lastImageUrl = " + this.cleanLog_lastImageUrl);
                        }
                        this.cleanLog_lastTimestamp = timestamp;
                        this.cleanLog_lastSquareMeters = squareMeters;
                        this.cleanLog_lastTotalTimeString = totalTimeString;
                        tools.envLog("[VacBot] *** cleanLog_lastTimestamp = " + this.cleanLog_lastTimestamp);
                        tools.envLog("[VacBot] *** cleanLog_lastSquareMeters = " + this.cleanLog_lastSquareMeters);
                        tools.envLog("[VacBot] *** cleanLog_lastTotalTimeString = " + this.cleanLog_lastTotalTimeString);
                    }

                    this.cleanLog[timestamp] = {
                        'id': id,
                        'timestamp': timestamp,
                        'date': date,
                        'lastTime': lastTime,
                        'totalTime': lastTime,
                        'totalTimeString': totalTimeString,
                        'totalTimeFormatted': totalTimeString,
                        'squareMeters': squareMeters,
                        'imageUrl': imageUrl,
                        'stopReason': stopReason,
                        'type': type,
                        'trigger': trigger
                    };
                }
            }
        }
    }

    /**
     * Handle the payload of the `CleanSum` response/message
     * @param {Object} payload
     */
    handleCleanSum(payload) {
        if (payload.attrs && payload.attrs.hasOwnProperty('a') && payload.attrs.hasOwnProperty('l') && payload.attrs.hasOwnProperty('c')) {
            this.cleanSum_totalSquareMeters = parseInt(payload.attrs['a']);
            this.cleanSum_totalSeconds = parseInt(payload.attrs['l']);
            this.cleanSum_totalNumber = parseInt(payload.attrs['c']);
        }
    }

    /**
     * Handle the payload of the `OnOff` response/message
     * (do not disturb, continuous cleaning, voice report)
     * @param {Object} payload
     */
    handleOnOff(payload) {
        tools.envLog("[VacBot] *** handleOnOff = " + JSON.stringify(payload));
        if (payload.attrs && payload.attrs.hasOwnProperty('on')) {
            let type = null;
            const command = this.commandsSent[payload.attrs.id];
            if (command.args && command.args.t) {
                type = dictionary.ON_OFF_FROM_ECOVACS[command.args.t];
            }
            if (type) {
                const on = payload.attrs.on;
                tools.envLog("[VacBot] *** " + type + " = " + on);
                switch (type) {
                    case 'do_not_disturb':
                        this.doNotDisturbEnabled = on;
                        break;
                    case 'continuous_cleaning':
                        this.continuousCleaningEnabled = on;
                        break;
                    case 'silence_voice_report':
                        this.voiceReportDisabled = on;
                        break;
                }
            }
        }
    }

    /**
     * Handle the payload of the `Sched` response/message
     * @param {Object} payload
     */
    handleSched(payload) {
        this.schedule = [];
        for (let c = 0; c < payload.children.length; c++) {
            const resultData = payload.children[c];
            if ((resultData.name === 's') || (resultData.payload === 's')) {
                let cleanCtl = {
                    'type': 'auto'
                };
                if (resultData.hasOwnProperty('children') && resultData.children[0] && resultData.children[0].hasOwnProperty('children')) {
                    if (resultData.children[0].children[0] && resultData.children[0].children[0].hasOwnProperty('attrs')) {
                        const attrs = resultData.children[0].children[0].attrs;
                        Object.assign(cleanCtl, {
                            'type': attrs.type
                        });
                        if (cleanCtl.type === 'SpotArea') {
                            Object.assign(cleanCtl, {
                                'spotAreas': attrs.mid
                            });
                        }
                    }
                }
                const attrs = resultData.attrs;
                let hour;
                let minute;
                if (attrs.hasOwnProperty('t')) {
                    // Deebot Slim 2
                    hour = attrs.t.split(':')[0];
                    minute = attrs.t.split(':')[1];
                } else {
                    hour = attrs.h;
                    minute = attrs.m;
                }
                const onlyOnce = Number(attrs.r) === 0;
                const weekdays = attrs.r.split('');
                const weekdaysObj = {
                    'Mon': Boolean(Number(weekdays[1])),
                    'Tue': Boolean(Number(weekdays[2])),
                    'Wed': Boolean(Number(weekdays[3])),
                    'Thu': Boolean(Number(weekdays[4])),
                    'Fri': Boolean(Number(weekdays[5])),
                    'Sat': Boolean(Number(weekdays[6])),
                    'Sun': Boolean(Number(weekdays[0])),
                };
                let enabled = false;
                if (attrs.hasOwnProperty('o')) {
                    enabled = Boolean(Number(attrs.o));
                }
                const object = {
                    'sid': attrs.n,
                    'cleanCtl': cleanCtl,
                    'enabled': enabled,
                    'onlyOnce': onlyOnce,
                    'weekdays': weekdaysObj,
                    'hour': hour,
                    'minute': minute
                };
                this.schedule.push(object);
            }
        }
    }

    /**
     * Handle the payload for `MapM` response/message
     * (see also `CachedMapInfo` for non 950 type)
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handleMapM(payload) {
        tools.envLog("[VacBot] *** handleMapM " + JSON.stringify(payload));
        // Execute only if the GetMaps cmd was received
        if (!this.handleMapExecuted && payload.attrs && payload.attrs.hasOwnProperty('i')) {
            this.currentMapMID = payload.attrs['i'];
            const ecovacsMap = new map.EcovacsMap(this.currentMapMID, 0, this.currentMapName, 1);
            this.maps = {
                "maps": [ecovacsMap]
            };
            this.run('GetMapSet');
            this.mapSpotAreaInfos[this.currentMapMID] = [];
            this.mapVirtualBoundaryInfos[this.currentMapMID] = [];
            this.handleMapExecuted = true;
            if (this.createMapImage && tools.isCanvasModuleAvailable()) {
                try {
                    await this.handleMapInfo(payload);
                } catch (e) {
                    throw new Error(e);
                }
            }
            return this.maps;
        }
        return null;
    }

    /**
     * Handle the payload of the `MapSet` response/message
     * @param {Object} payload
     */
    handleMapSet(payload) {
        tools.envLog("[VacBot] *** handleMapSet " + JSON.stringify(payload));
        if (payload.attrs && payload.attrs.hasOwnProperty('tp')) {
            if (payload.attrs['tp'] === 'sa') {
                const mapSetID = payload.attrs['msid'];
                const mapSpotAreas = new map.EcovacsMapSpotAreas(this.currentMapMID, mapSetID);
                let spotAreas = [];
                for (let mapIndex in payload.children) {
                    if (payload.children.hasOwnProperty(mapIndex)) {
                        let mid = payload.children[mapIndex].attrs['mid'];
                        if (!spotAreas[mid]) {
                            mapSpotAreas.push(new map.EcovacsMapSpotArea(mid));
                            this.run('PullM', 'sa', this.currentMapMID, mid);
                            spotAreas[mid] = true;
                        }
                    }
                }
                tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
                return {
                    mapsetEvent: 'MapSpotAreas',
                    mapsetData: mapSpotAreas
                };
            } else if (payload.attrs['tp'] === 'vw') {
                const mapVirtualBoundaries = new map.EcovacsMapVirtualBoundaries(this.currentMapMID);
                let virtualBoundaries = [];
                for (let mapIndex in payload.children) {
                    if (payload.children.hasOwnProperty(mapIndex)) {
                        let mid = payload.children[mapIndex].attrs['mid'];
                        if (!virtualBoundaries[mid]) {
                            mapVirtualBoundaries.push(new map.EcovacsMapVirtualBoundary(mid, 'vw'));
                            this.run('PullM', 'vw', this.currentMapMID, mid);
                            virtualBoundaries[mid] = true;
                        }
                    }
                }
                tools.envLog("[VacBot] *** MapVirtualBoundaries = " + JSON.stringify(mapVirtualBoundaries));
                return {
                    mapsetEvent: 'MapVirtualBoundaries',
                    mapsetData: mapVirtualBoundaries
                };
            }
        }

        tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(payload.attrs['tp']));
        return {
            mapsetEvent: 'error'
        };
    }

    /**
     * Handle the payload of the `PullM` response/message
     * (see also `MapSubset` for non 950 type)
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handlePullM(payload) {
        tools.envLog("[VacBot] *** handlePullM " + JSON.stringify(payload));
        if (payload.attrs && payload.attrs.hasOwnProperty('m')) {
            const value = payload.attrs['m'];
            let mid = '';
            let type = '';
            if (payload.attrs.hasOwnProperty('mid')) {
                // MQTT
                mid = payload.attrs['mid'];
                type = payload.attrs['tp'];
            } else {
                // XMPP
                const command = this.commandsSent[payload.attrs.id];
                if (command.args && command.args.mid && command.args.tp) {
                    mid = command.args.mid;
                    type = command.args.tp;
                }
            }
            if (mid && type) {
                if (type === 'sa') {
                    let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(this.currentMapMID, mid, '', value);
                    this.mapSpotAreaInfos[this.currentMapMID][mid] = mapSpotAreaInfo;
                    tools.envLog("[VacBot] *** MapSpotAreaInfo = " + JSON.stringify(mapSpotAreaInfo));
                    return {
                        mapsubsetEvent: 'MapSpotAreaInfo',
                        mapsubsetData: mapSpotAreaInfo
                    };
                } else if (type === 'vw') {
                    let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(this.currentMapMID, mid, 'vw', value);
                    this.mapVirtualBoundaryInfos[this.currentMapMID][mid] = mapVirtualBoundaryInfo;
                    tools.envLog("[VacBot] *** MapVirtualBoundaryInfo = " + JSON.stringify(mapVirtualBoundaryInfo));
                    return {
                        mapsubsetEvent: 'MapVirtualBoundaryInfo',
                        mapsubsetData: mapVirtualBoundaryInfo
                    };
                }
            } else {
                tools.envLog("[VacBot] *** handlePullM Missing mid or type");
            }
        }
        return {
            mapsubsetEvent: 'error'
        };
    }

    /**
     * Handle the payload for the map image
     * triggered by the `handleMapM` response/message
     * (see also `MapInfo` for non 950 type)
     * @param {Object} payload
     * @returns {Promise<void>}
     */
    async handleMapInfo(payload) {
        if (payload.attrs) {
            const mapID = payload.attrs.i;
            const type = 'ol'; // Only outline is supported for non 950 type models
            const columnGrid = payload.attrs.w;
            const columnPiece = payload.attrs.c;
            const rowGrid = payload.attrs.h;
            const rowPiece = payload.attrs.r;
            const pixelWidth = payload.attrs.p;
            const crc = payload.attrs.m;
            this.mapPiecePacketsCrcArray = crc.split(',');
            if (typeof this.mapImages[mapID] === 'undefined') {
                this.mapImages[mapID] = [];
            }
            if (typeof this.mapImages[mapID][type] === 'undefined') {
                this.mapImages[mapID][type] = new mapTemplate.EcovacsLiveMapImage(
                    mapID, type, columnGrid, rowGrid, columnPiece, rowPiece, pixelWidth, crc
                );
            }
            this.mapPiecePacketsSent = [];
            for (let c = 0; c < this.mapPiecePacketsCrcArray.length; c++) {
                if (this.mapPiecePacketsCrcArray[c] !== constants.CRC_EMPTY_PIECE) { // skip empty pieces
                    this.run('PullMP', c);
                }
            }
        }
    }

    /**
     * Handle the payload of the `PullMP` response/message (map piece packet)
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async handlePullMP(payload) {
        if (payload.attrs) {
            const mapID = payload.attrs.i;
            const type = 'ol'; // Only outline is supported for non 950 type models
            if (this.mapImages[mapID][type]) {
                let pid = this.mapPiecePacketsSent[payload.attrs.id];
                if (payload.attrs.pid) {
                    pid = payload.attrs.pid;
                }
                const pieceValue = payload.attrs.p;
                await this.mapImages[this.currentMapMID][type].updateMapPiece(pid, pieceValue);
                if (this.mapImages[this.currentMapMID][type].transferMapInfo) {
                    try {
                        return await this.mapImages[this.currentMapMID][type].getBase64PNG(
                            this.deebotPosition, this.chargePosition, this.currentMapMID, this.mapDataObject
                        );
                    } catch (e) {
                        tools.envLog('[VacBot] Error calling getBase64PNG: %s', e.message);
                        throw new Error(e);
                    }
                }
            }
            return null;
        }
    }

    /**
     * Handle the payload of the `Error` response/message
     * @param {Object} payload
     */
    handleResponseError(payload) {
        this.errorCode = '0';
        this.errorDescription = '';
        let attrs = ['new', 'code', 'errno', 'error', 'errs'];
        for (const attr of attrs) {
            if (payload.hasOwnProperty(attr) && (payload[attr] !== '')) {
                // 100 = "NoError: Robot is operational"
                this.errorCode = (payload[attr] === '100') ? '0' : payload[attr].toString();
                if (errorCodes[this.errorCode]) {
                    this.errorDescription = errorCodes[this.errorCode];
                    // Request error
                    if (this.errorCode === '1') {
                        this.errorDescription = this.errorDescription + ': ' + payload.error;
                    }
                } else {
                    this.errorDescription = 'unknown errorCode: ' + this.errorCode;
                }
                return;
            }
        }
    }

    /**
     * Run a specific command
     * @param {string} command - The {@link https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions|command}
     * @param args - zero or more arguments to perform the command
     */
    run(command, ...args) {
        super.run(command, ...args);
        switch (command.toLowerCase()) {
            case "GetMaps".toLowerCase(): {
                this.createMapDataObject = !!args[0] || false;
                this.createMapImage = this.createMapDataObject && this.isMapImageSupported();
                if (args.length >= 2) {
                    this.createMapImage = !!args[1];
                }
                this.handleMapExecuted = false;
                this.sendCommand(new VacBotCommand.GetMapM());
                break;
            }
            case "GetMapSet".toLowerCase(): {
                this.sendCommand(new VacBotCommand.GetMapSet('sa'));
                this.sendCommand(new VacBotCommand.GetMapSet('vw'));
                break;
            }
            case "GetMapInfo".toLowerCase():
            case "GetMapImage".toLowerCase(): {
                this.createMapDataObject = true;
                this.createMapImage = true;
                this.createMapImageOnly = true;
                this.handleMapExecuted = false;
                this.sendCommand(new VacBotCommand.GetMapM());
                break;
            }
            case "PullM".toLowerCase(): {
                const mapSetType = args[0];
                const mapSetId = args[1];
                const mapDetailId = args[2];
                if (args.length >= 3) {
                    this.sendCommand(new VacBotCommand.PullM(mapSetType, mapSetId, mapDetailId));
                }
                break;
            }
            case "PullMP".toLowerCase(): {
                const pid = args[0];
                if (args.length >= 1) {
                    this.sendCommand(new VacBotCommand.PullMP(pid));
                }
                break;
            }
            case "GetLifeSpan".toLowerCase(): {
                if (args.length >= 1) {
                    this.emitFullLifeSpanEvent = false;
                    this.sendCommand(new VacBotCommand.GetLifeSpan(args[0]));
                } else {
                    this.emitFullLifeSpanEvent = true;
                    this.components = {};
                    this.lastComponentValues = {};
                    this.sendCommand(new VacBotCommand.GetLifeSpan('filter'));
                    if (this.hasMainBrush()) {
                        this.sendCommand(new VacBotCommand.GetLifeSpan('main_brush'));
                    }
                    this.sendCommand(new VacBotCommand.GetLifeSpan('side_brush'));
                }
                break;
            }
            case "GetWaterLevel".toLowerCase():
                this.sendCommand(new VacBotCommand.GetWaterLevel());
                break;
            case "GetWaterBoxInfo".toLowerCase():
                this.sendCommand(new VacBotCommand.GetWaterBoxInfo());
                break;
            case "GetChargerPos".toLowerCase():
            case "GetChargerPosition".toLowerCase():
                this.sendCommand(new VacBotCommand.GetChargerPos());
                break;
            case "GetOnOff".toLowerCase(): {
                const type = args[0];
                if (type !== '') {
                    this.sendCommand(new VacBotCommand.GetOnOff(type));
                }
                break;
            }
            case "SetOnOff".toLowerCase(): {
                const type = args[0];
                const on = Number(args[1]) || 0;
                if ((type !== '') && (on >= 0) && (on <= 1)) {
                    this.sendCommand(new VacBotCommand.SetOnOff(type, on));
                }
                break;
            }
            case "EnableDoNotDisturb".toLowerCase():
                this.sendCommand(new VacBotCommand.EnableDoNotDisturb());
                break;
            case "GetCleanLogs".toLowerCase(): {
                if (this.isN79series()) {
                    // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/67
                    this.sendCommand(new VacBotCommand.GetLogs());
                } else {
                    this.sendCommand(new VacBotCommand.GetCleanLogs());
                }
                break;
            }
            case "RenameSpotArea".toLowerCase(): {
                // Tested with OZMO 930 - maybe only working with OZMO 930
                if (args.length >= 3) {
                    this.sendCommand(new VacBotCommand.RenameSpotArea(args[0], args[1], args[2]));
                }
                break;
            }
            case "SetLifeSpan".toLowerCase(): {
                // Untested - maybe only working with N79 series
                if (args.length === 1) {
                    this.sendCommand(new VacBotCommand.SetLifeSpan(args[0]));
                } else if (args.length === 2) {
                    this.sendCommand(new VacBotCommand.SetLifeSpan(args[0], args[1]));
                }
                break;
            }
        }
    }
}

module.exports = VacBot_non950type;
