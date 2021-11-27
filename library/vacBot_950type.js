const dictionary = require('./ecovacsConstants_950type');
const vacBotCommand = require('./vacBotCommand_950type');
const VacBot = require('./vacBot');
const errorCodes = require('./errorCodes');
const tools = require('./tools');
const mapTools = require('./mapTools');
const map = require('./mapTemplate');

class VacBot_950type extends VacBot {
    constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
        super(user, hostname, resource, secret, vacuum, continent, country, server_address);

        this.breakPoint = null;
        this.block = null;
        this.autoEmpty = null;
        this.advancedMode = null;
        this.trueDetect = null;
        this.dusterRemind = {
            enabled: null,
            period: null
        };
        this.carpetPressure = null;
        this.volume = 0;
        this.relocationState = null;
        this.firmwareVersion = null;
    }

    handle_lifespan(payload) {
        for (let index in payload) {
            if (payload[index]) {
                const type = payload[index]["type"];
                const component = dictionary.COMPONENT_FROM_ECOVACS[type];
                const left = payload[index]["left"];
                const total = payload[index]["total"];
                const lifespan = parseInt(left) / parseInt(total) * 100;
                this.components[component] = Number(lifespan.toFixed(2));
                tools.envLog("[VacBot] lifespan %s: %s", component, this.components[component]);
            }
        }
        tools.envLog("[VacBot] lifespan components : %s", JSON.stringify(this.components));
    }

    handle_deebotPosition(payload) {
        // is only available in some DeebotPosition messages (e.g. on start cleaning)
        // there can be more than one charging station only handles first charging station
        const chargePos = payload['chargePos'];
        if (chargePos) {
            // check if position changed
            let changed = (chargePos[0]['x'] !== this.chargePosition.x
                || chargePos[0]['y'] !== this.chargePosition.y
                || chargePos[0]['a'] !== this.chargePosition.a
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
            let changed = (deebotPos['x'] !== this.deebotPosition.x
                || deebotPos['y'] !== this.deebotPosition.y
                || deebotPos['a'] !== this.deebotPosition.a
                || deebotPos['invalid'] !== this.deebotPosition.isInvalid
                || this.deebotPosition.currentSpotAreaID === 'unknown'
            );
            if (changed) {
                let currentSpotAreaID = mapTools.isPositionInSpotArea([[deebotPos['x']], deebotPos['y']], this.mapSpotAreaInfos[this.currentMapMID]);
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
                    changeFlag: true,
                    distanceToChargingStation: distanceToChargingStation
                };
                tools.envLog("[VacBot] *** deebotPosition = " + JSON.stringify(this.deebotPosition));
            }
        }
    }

    handle_cleanSpeed(payload) {
        const speed = payload['speed'];
        this.cleanSpeed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        tools.envLog("[VacBot] *** cleanSpeed = %s", this.cleanSpeed);
    }

    handle_netInfo(payload) {
        this.netInfoIP = payload['ip'];
        this.netInfoWifiSSID = payload['ssid'];
        this.netInfoWifiSignal = payload['rssi'];
        this.netInfoMAC = payload['mac'];

        tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
        tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
        tools.envLog("[VacBot] *** netInfoWifiSignal = %s", this.netInfoWifiSignal);
        tools.envLog("[VacBot] *** netInfoMAC = %s", this.netInfoMAC);
    }

    handle_cleanReport(payload) {
        tools.envLog("[handle_cleanReport] payload: ", JSON.stringify(payload));
        if (payload['state'] === 'clean') {
            let type = payload['cleanState']['type'];
            if (typeof payload['cleanState']['content'] === 'object') {
                type = payload['cleanState']['content']['type'];
            }
            if (payload['cleanState']['motionState'] === 'working') {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
            } else {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[payload['cleanState']['motionState']];
            }
            if (type === 'customArea') {
                if (typeof payload['cleanState']['content'] === "object") {
                    this.lastUsedAreaValues = payload['cleanState']['content']['value'];
                } else {
                    this.lastUsedAreaValues = payload['cleanState']['content'];
                }
            } else {
                this.lastUsedAreaValues = null;
            }
        } else if (payload['trigger'] === 'alert') {
            this.cleanReport = 'alert';
            this.lastUsedAreaValues = null;
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
            this.lastUsedAreaValues = null;
        }
        tools.envLog("[VacBot] *** cleanReport = %s", this.cleanReport);
    }

    handle_cleanLogs(payload) {
        tools.envLog("[handle_cleanLogs] payload: ", this.removeFromLogs(JSON.stringify(payload)));
        let logs = [];
        if (payload.hasOwnProperty('logs')) {
            logs = payload['logs'];
        } else if (payload.hasOwnProperty('log')) {
            logs = payload['log'];
        }

        for (let logIndex in logs) {
            if (logs.hasOwnProperty(logIndex)) {
                if (!this.cleanLog[logs[logIndex]['id']]) { //log not yet existing
                    let squareMeters = parseInt(logs[logIndex]['area']);
                    let timestamp = parseInt(logs[logIndex]['ts']);
                    let date = new Date(timestamp * 1000);
                    let len = parseInt(logs[logIndex]['last']);
                    let totalTimeString = tools.getTimeString(len);
                    let imageUrl = logs[logIndex]['imageUrl'];
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
                    this.cleanLog[logs[logIndex]['id']] = {
                        'squareMeters': squareMeters,
                        'timestamp': timestamp,
                        'date': date,
                        'lastTime': len,
                        'totalTime': len,
                        'totalTimeFormatted': totalTimeString,
                        'imageUrl': imageUrl,
                        'type': logs[logIndex]['type'],
                        'stopReason': logs[logIndex]['stopReason']
                    };
                }
            }
        }
        tools.envLog("[VacBot] *** cleanLogs = " + this.cleanLog);
    }

    handle_cleanSum(payload) {
        this.cleanSum_totalSquareMeters = parseInt(payload['area']);
        this.cleanSum_totalSeconds = parseInt(payload['time']);
        this.cleanSum_totalNumber = parseInt(payload['count']);
    }

    handle_batteryInfo(payload) {
        this.batteryInfo = payload['value'];
        if (payload.hasOwnProperty('isLow')) {
            this.batteryIsLow = !!Number(payload['isLow']);
            tools.envLog("[VacBot] *** batteryIsLow = %s", this.batteryIsLow);
        }
        tools.envLog("[VacBot] *** batteryInfo = %d\%", this.batteryInfo);
    }

    handle_waterLevel(payload) {
        this.waterLevel = payload['amount'];
        tools.envLog("[VacBot] *** waterLevel = %s", this.waterLevel);
    }

    handle_relocationState(payload) {
        this.relocationState = payload['state'];
        tools.envLog("[VacBot] *** relocationState = " + this.relocationState);
    }

    handle_cachedMapInfo(payload) {
        this.currentMapName = 'unknown';
        this.maps = {"maps": []};
        const infoEvent = payload['info'];
        for (let mapIndex in infoEvent) {
            if (infoEvent.hasOwnProperty(mapIndex)) {
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
        tools.envLog("[VacBot] *** currentMapName = " + this.currentMapName);
        tools.envLog("[VacBot] *** currentMapMID = " + this.currentMapMID);
        tools.envLog("[VacBot] *** currentMapIndex = " + this.currentMapIndex);
        tools.envLog("[VacBot] *** maps = " + JSON.stringify(this.maps));
    }

    handle_mapSet(payload) {
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
                mapSpotAreas.push(new map.EcovacsMapSpotArea(payload['subsets'][mapIndex]['mssid']));
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
                tools.envLog("[VacBot] *** push mapVirtualBoundaries for mssid " + payload['subsets'][mapIndex]['mssid']);
                this.mapVirtualBoundaries[mapMID].push(new map.EcovacsMapVirtualBoundary(payload['subsets'][mapIndex]['mssid'], payload['type']));
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

    handle_mapSubset(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID)) {
            mapMID = this.currentMapMID;
        }
        if (payload['type'] === 'ar') {
            let mapSpotAreaBoundaries = payload['value'];
            if (payload['compress']) {
                mapSpotAreaBoundaries = map.mapPieceToIntArray(payload['value']);
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

    handle_mapInfo(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID)) {
            return;
        }
        if (typeof this.mapImages[mapMID] === 'undefined') {
            this.mapImages[mapMID] = [];
        }
        if (typeof this.mapImages[mapMID][payload['type']] === 'undefined') {
            this.mapImages[mapMID][payload['type']] = new map.EcovacsMapImage(mapMID, payload['type'], payload['totalWidth'], payload['totalHeight'], payload['pixel'], payload['totalCount']);
        }
        if (payload['pieceValue'] !== '') {
            this.mapImages[mapMID][payload['type']].updateMapPiece(payload['index'], payload['startX'], payload['startY'], payload['width'], payload['height'], payload['crc'], payload['value'])
        }
        return this.mapImages[mapMID][payload['type']].getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
    }

    handle_majorMap(payload) {
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
                mapMID, type, pieceWidth, pieceHeight, cellWidth, cellHeight, pixel, value)
        } else {
            this.liveMapImage.updateMapDataPiecesCrc(payload['value']);
        }
    }

    handle_minorMap(payload) {
        let mapMID = payload['mid'];
        if (isNaN(mapMID) || !this.liveMapImage || (this.liveMapImage.mapID !== mapMID)) {
            return;
        }
        this.liveMapImage.updateMapPiece(payload['pieceIndex'], payload['pieceValue']);
        return this.liveMapImage.getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
    }

    handle_waterInfo(payload) {
        this.waterLevel = payload['amount'];
        this.waterboxInfo = payload['enable'];
        tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
        tools.envLog("[VacBot] *** waterLevel = " + this.waterLevel);
    }

    handle_volume(payload) {
        this.volume = payload['volume'];
        tools.envLog("[VacBot] *** volume = " + this.volume);
    }

    handle_chargeState(payload) {
        tools.envLog("[handle_chargeState] payload: ", JSON.stringify(payload));
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

    handle_sleepStatus(payload) {
        this.sleepStatus = payload['enable']
        tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
    }

    handle_breakPoint(payload) {
        this.breakPoint = payload['enable']
        tools.envLog("[VacBot] *** breakPoint = " + this.breakPoint);
    }

    handle_block(payload) {
        this.block = payload['enable']
        tools.envLog("[VacBot] *** block = " + this.block);
    }

    handle_autoEmpty(payload) {
        this.autoEmpty = payload['enable']
        tools.envLog("[VacBot] *** autoEmpty = " + this.autoEmpty);
    }

    handle_advancedMode(payload) {
        this.advancedMode = payload['enable']
        tools.envLog("[VacBot] *** advancedMode = " + this.advancedMode);
    }

    handle_trueDetect(payload) {
        this.trueDetect = payload['enable']
        tools.envLog("[VacBot] *** trueDetect = " + this.trueDetect);
    }

    handle_dusterRemind(payload) {
        this.dusterRemind = {
            enabled: payload['enable'],
            period: payload['period']
        };
        tools.envLog("[VacBot] *** dusterRemind = " + JSON.stringify(this.dusterRemind));
    }

    handle_carpetPressure(payload) {
        this.carpetPressure = payload['enable']
        tools.envLog("[VacBot] *** carpetPressure = " + this.carpetPressure);
    }

    handle_stats(payload) {
        tools.envLog("[handle_stats] payload: " + JSON.stringify(payload));
        this.currentStats = {
            'cleanedArea': payload['area'],
            'cleanedSeconds': payload['time'],
            'cleanType': payload['type']
        }
    }

    handle_error(payload) {
        this.errorCode = payload['code'].toString();
        // known errorCode from library
        if (errorCodes[this.errorCode]) {
            this.errorDescription = errorCodes[this.errorCode];
        } else {
            this.errorDescription = 'unknown errorCode: ' + this.errorCode;
        }
        tools.envLog("[VacBot] *** errorCode = " + this.errorCode);
        tools.envLog("[VacBot] *** errorDescription = " + this.errorDescription);
    }

    handle_Schedule(payload) {
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
            }
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
            }
            this.schedule.push(object);
        }
    }

    run(action, ...args) {
        super.run(action, ...args);
        switch (action.toLowerCase()) {
            case "GetMapImage".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const mapType = args[1] || 'outline';
                this.createMapDataObject = true;
                this.createMapImage = true;
                this.createMapImageOnly = args[2] !== undefined ? args[2] : true;
                if (Number(mapID) > 0) {
                    this.sendCommand(new vacBotCommand.GetMapImage(mapID, mapType));
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
                this.sendCommand(new vacBotCommand.GetMaps());
                break;
            }
            case "GetSpotAreas".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                if (Number(mapID) > 0) {
                    this.sendCommand(new vacBotCommand.GetMapSpotAreas(mapID));
                }
                break;
            }
            case "GetSpotAreaInfo".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                if ((Number(mapID) > 0) && (spotAreaID !== '')) {
                    this.sendCommand(new vacBotCommand.GetMapSpotAreaInfo(mapID, spotAreaID));
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
                    this.sendCommand(new vacBotCommand.GetMapVirtualBoundaries(mapID, 'vw'));
                    this.sendCommand(new vacBotCommand.GetMapVirtualBoundaries(mapID, 'mw'));
                }
                break;
            }
            case "GetVirtualBoundaryInfo".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (spotAreaID !== '')) {
                    this.sendCommand(new vacBotCommand.GetMapVirtualBoundaryInfo(mapID, spotAreaID, type));
                }
                break;
            }
            case "AddVirtualBoundary".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const coordinates = args[1];
                const type = tools.isValidVirtualWallType(args[2]) ? args[2] : 'vw';
                if ((Number(mapID) > 0) && (coordinates !== '')) {
                    this.sendCommand(new vacBotCommand.AddMapVirtualBoundary(mapID, coordinates, type));
                }
                break;
            }
            case "DeleteVirtualBoundary".toLowerCase(): {
                const mapID = args[0]; // mapID is a string
                const spotAreaID = args[1]; // spotAreaID is a string
                const type = args[2];
                if ((Number(mapID) > 0) && (Number(spotAreaID) > 0) && (tools.isValidVirtualWallType(type))) {
                    this.sendCommand(new vacBotCommand.DeleteMapVirtualBoundary(mapID, spotAreaID, type));
                }
                break;
            }
            case "GetLifeSpan".toLowerCase(): {
                if (!args.length) {
                    this.emitFullLifeSpanEvent = true;
                    this.components = {};
                    this.lastComponentValues = {}
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS['filter'],
                        dictionary.COMPONENT_TO_ECOVACS['main_brush'],
                        dictionary.COMPONENT_TO_ECOVACS['side_brush']
                    ]
                    this.sendCommand(new vacBotCommand.GetLifeSpan(componentsArray));
                } else {
                    this.emitFullLifeSpanEvent = false;
                    const component = args[0];
                    const componentsArray = [
                        dictionary.COMPONENT_TO_ECOVACS[component]
                    ]
                    this.sendCommand(new vacBotCommand.GetLifeSpan(componentsArray));
                }
                break;
            }
            case "EnableDoNotDisturb".toLowerCase(): {
                const start = args[0];
                const end = args[1];
                if ((start !== '') && (end !== '')) {
                    this.sendCommand(new vacBotCommand.EnableDoNotDisturb(start, end));
                } else {
                    this.sendCommand(new vacBotCommand.EnableDoNotDisturb());
                }
                break;
            }
            case "SetDoNotDisturb".toLowerCase(): {
                const enable = !!args[0];
                const start = args[1];
                const end = args[2];
                if ((start !== '') && (end !== '')) {
                    this.sendCommand(new vacBotCommand.SetDoNotDisturb(enable, start, end));
                } else if (args.length >= 1) {
                    this.sendCommand(new vacBotCommand.SetDoNotDisturb(enable));
                }
                break;
            }
            case "GetWaterLevel".toLowerCase():
            case "GetWaterboxInfo".toLowerCase():
            case "GetWaterInfo".toLowerCase():
                this.sendCommand(new vacBotCommand.GetWaterInfo());
                break;
            case "GetCleanLogs".toLowerCase():
                this.sendCommand(new vacBotCommand.GetCleanLogs());
                break;
            case "GetError".toLowerCase():
                this.sendCommand(new vacBotCommand.GetError());
                break;
            case "Relocate".toLowerCase():
                this.sendCommand(new vacBotCommand.Relocate());
                break;
            case "GetVolume".toLowerCase():
                this.sendCommand(new vacBotCommand.GetVolume());
                break;
            case "SetVolume".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new vacBotCommand.SetVolume(args[0]));
                }
                break;
            case "EnableAdvancedMode".toLowerCase():
                this.sendCommand(new vacBotCommand.SetAdvancedMode(1));
                break;
            case "DisableAdvancedMode".toLowerCase():
                this.sendCommand(new vacBotCommand.SetAdvancedMode(0));
                break;
            case "GetAdvancedMode".toLowerCase():
                this.sendCommand(new vacBotCommand.GetAdvancedMode());
                break;
            case "GetTrueDetect".toLowerCase():
                this.sendCommand(new vacBotCommand.GetTrueDetect());
                break;
            case "EnableTrueDetect".toLowerCase():
                this.sendCommand(new vacBotCommand.SetTrueDetect(1));
                break;
            case "DisableTrueDetect".toLowerCase():
                this.sendCommand(new vacBotCommand.SetTrueDetect(0));
                break;
            case "EmptyDustBin".toLowerCase():
            case "EmptySuctionStation".toLowerCase():
                this.sendCommand(new vacBotCommand.EmptyDustBin());
                break;
            case "GetAutoEmpty".toLowerCase():
                this.sendCommand(new vacBotCommand.GetAutoEmpty());
                break;
            case "SetAutoEmpty".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new vacBotCommand.SetAutoEmpty(args[0]));
                }
                break;
            case "EnableAutoEmpty".toLowerCase():
                this.sendCommand(new vacBotCommand.SetAutoEmpty(1));
                break;
            case "DisableAutoEmpty".toLowerCase():
                this.sendCommand(new vacBotCommand.SetAutoEmpty(0));
                break;
            case "GetDusterRemind".toLowerCase():
                this.sendCommand(new vacBotCommand.GetDusterRemind());
                break;
            case "EnableDusterRemind".toLowerCase():
                this.sendCommand(new vacBotCommand.SetDusterRemind(1));
                break;
            case "DisableDusterRemind".toLowerCase():
                this.sendCommand(new vacBotCommand.SetDusterRemind(0));
                break;
            case "SetDusterRemindPeriod".toLowerCase():
                if (args.length >= 1) {
                    this.sendCommand(new vacBotCommand.SetDusterRemindPeriod(args[0]));
                }
                break;
            case "GetCarpetPressure".toLowerCase():
                this.sendCommand(new vacBotCommand.GetCarpetPressure());
                break;
            case "EnableCarpetPressure".toLowerCase():
                this.sendCommand(new vacBotCommand.SetCarpetPressure(1));
                break;
            case "DisableCarpetPressure".toLowerCase():
                this.sendCommand(new vacBotCommand.SetCarpetPressure(0));
                break;
            case "Clean_V2".toLowerCase(): {
                this.sendCommand(new vacBotCommand.Clean_V2());
                break;
            }
            case "SpotArea_V2".toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 0;
                if (area !== '') {
                    this.sendCommand(new vacBotCommand.SpotArea_V2(area, cleanings));
                }
                break;
            }
            case "CustomArea_V2".toLowerCase(): {
                const area = args[0].toString();
                const cleanings = args[1] || 0;
                if (area !== '') {
                    this.sendCommand(new vacBotCommand.CustomArea_V2(area, cleanings));
                }
                break;
            }
        }
    }
}

module.exports = VacBot_950type;
