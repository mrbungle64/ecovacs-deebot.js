const dictionary = require('./ecovacsConstants_950type');
const vacBotCommand = require('./vacBotCommand_950type');
const VacBot = require('./vacBot');
const errorCodes = require('./errorCodes');
const tools = require('./tools');
const map = require('./mapTemplate');

class VacBot_950type extends VacBot {
    constructor(user, hostname, resource, secret, vacuum, continent, country = 'DE', server_address = null) {
        super(user, hostname, resource, secret, vacuum, continent, country, server_address);

        this.autoEmpty = null;
        this.advancedMode = null;
        this.trueDetect = null;
        this.volume = 0;
        this.relocationState = null;
        this.firmwareVersion = null;
    }

    handle_lifespan(event) {
        for (let index in event['resultData']) {
            if (event['resultData'][index]) {
                const type = event['resultData'][index]["type"];
                const component = dictionary.COMPONENT_FROM_ECOVACS[type];
                const left = event['resultData'][index]["left"];
                const total = event['resultData'][index]["total"];
                const lifespan = parseInt(left) / parseInt(total) * 100;
                this.components[component] = Number(lifespan.toFixed(2));
                tools.envLog("[VacBot] lifespan %s: %s", component, this.components[component]);
            }
        }
        tools.envLog("[VacBot] lifespan components : %s", JSON.stringify(this.components));
    }

    handle_deebotPosition(event) {
        // as deebotPos and chargePos can also appear in other messages (CleanReport)
        // the handling should be extracted to a separate function
        const deebotPos = event['resultData']['deebotPos'];
        if (typeof deebotPos === 'object') {
            // check if position changed or currentSpotAreaID unknown
            let changed = (deebotPos['x'] !== this.deebotPosition.x
                || deebotPos['y'] !== this.deebotPosition.y
                || deebotPos['a'] !== this.deebotPosition.a
                || deebotPos['invalid'] !== this.deebotPosition.isInvalid
                || this.deebotPosition.currentSpotAreaID === 'unknown'
            );
            if (changed) {
                let currentSpotAreaID = map.isPositionInSpotArea([[deebotPos['x']], deebotPos['y']], this.mapSpotAreaInfos[this.currentMapMID]);
                let isInvalid = Number(deebotPos['invalid']) === 1 ? true : false;
                tools.envLog("[VacBot] *** currentSpotAreaID = " + currentSpotAreaID);
                this.deebotPosition = {
                    x: deebotPos['x'],
                    y: deebotPos['y'],
                    a: deebotPos['a'],
                    isInvalid: isInvalid,
                    currentSpotAreaID: currentSpotAreaID,
                    changeFlag: true
                };
                tools.envLog("[VacBot] *** deebotPosition = " + JSON.stringify(this.deebotPosition));
            }
        }
        // is only available in some DeebotPosition messages (e.g. on start cleaning)
        // there can be more than one charging station only handles first charging station
        const chargePos = event['resultData']['chargePos'];
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
    }

    handle_cleanSpeed(event) {
        const speed = event['resultData']['speed'];
        this.cleanSpeed = dictionary.CLEAN_SPEED_FROM_ECOVACS[speed];
        tools.envLog("[VacBot] *** cleanSpeed = %s", this.cleanSpeed);
    }

    handle_netInfo(event) {
        this.netInfoIP = event['resultData']['ip'];
        this.netInfoWifiSSID = event['resultData']['ssid'];
        this.netInfoWifiSignal = event['resultData']['rssi'];
        this.netInfoMAC = event['resultData']['mac'];

        tools.envLog("[VacBot] *** netInfoIP = %s", this.netInfoIP);
        tools.envLog("[VacBot] *** netInfoWifiSSID = %s", this.netInfoWifiSSID);
        tools.envLog("[VacBot] *** netInfoWifiSignal = %s", this.netInfoWifiSignal);
        tools.envLog("[VacBot] *** netInfoMAC = %s", this.netInfoMAC);
    }

    handle_cleanReport(event) {
        if (event['resultData']['state'] === 'clean') {
            let type = event['resultData']['cleanState']['type'];
            if (typeof event['resultData']['cleanState']['content'] === 'object') {
                type = event['resultData']['cleanState']['content']['type'];
            }
            if (event['resultData']['cleanState']['motionState'] === 'working') {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[type];
            } else {
                this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['cleanState']['motionState']];
            }
            if (type === 'customArea') {
                if (typeof event['resultData']['cleanState']['content'] === "object") {
                    this.lastUsedAreaValues = event['resultData']['cleanState']['content']['value'];
                } else {
                    this.lastUsedAreaValues = event['resultData']['cleanState']['content'];
                }
            } else {
                this.lastUsedAreaValues = null;
            }
        } else if (event['resultData']['trigger'] === 'alert') {
            this.cleanReport = 'alert';
            this.lastUsedAreaValues = null;
        } else {
            this.cleanReport = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']];
            if (dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']] === 'returning') {
                // set charge state on returning to dock
                const chargeStatus = dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']];
                if (chargeStatus) {
                    this.chargeStatus = chargeStatus;
                    tools.envLog("[VacBot] *** chargeStatus = %s", this.chargeStatus);
                }
            } else if (dictionary.CLEAN_MODE_FROM_ECOVACS[event['resultData']['state']] === 'idle') {
                // when clean state = idle the bot can be charging on the dock or the return to dock has been canceled
                // if this is not run, the status when canceling the return stays on 'returning'
                this.run('GetChargeState');
            }
            this.lastUsedAreaValues = null;
        }
        tools.envLog("[VacBot] *** cleanReport = %s", this.cleanReport);
    }

    handle_cleanLogs(event) {
        // Unlike the others, resultCode seems to be a string
        const resultCode = parseInt(event['resultCode']);
        if (resultCode === 0) {
            let logs = [];
            if (event['resultData'].hasOwnProperty('logs')) {
                logs = event['resultData']['logs'];
            } else if (event['resultData'].hasOwnProperty('log')) {
                logs = event['resultData']['log'];
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
        }
        tools.envLog("[VacBot] *** cleanLogs = " + this.cleanLog);
    }

    handle_cleanSum(event) {
        this.cleanSum_totalSquareMeters = parseInt(event['resultData']['area']);
        this.cleanSum_totalSeconds = parseInt(event['resultData']['time']);
        this.cleanSum_totalNumber = parseInt(event['resultData']['count']);
    }

    handle_batteryInfo(event) {
        this.batteryInfo = event['resultData']['value'];
        if (event['resultData'].hasOwnProperty('isLow')) {
            this.batteryIsLow = !!Number(event['resultData']['isLow']);
            tools.envLog("[VacBot] *** batteryIsLow = %s", this.batteryIsLow);
        }
        tools.envLog("[VacBot] *** batteryInfo = %d\%", this.batteryInfo);
    }

    handle_waterLevel(event) {
        this.waterLevel = event['resultData']['amount'];
        tools.envLog("[VacBot] *** waterLevel = %s", this.waterLevel);
    }

    handle_relocationState(event) {
        this.relocationState = event['resultData']['state'];
        tools.envLog("[VacBot] *** relocationState = " + this.relocationState);
    }

    handle_cachedMapInfo(event) {
        this.currentMapName = 'unknown';
        this.maps = {"maps": []};
        const infoEvent = event['resultData']['info'];
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

    handle_mapSet(event) {
        let mapMID = event['resultData']['mid'];
        if (isNaN(mapMID)) {
            if (this.currentMapMID) {
                mapMID = this.currentMapMID;
            } else {
                tools.envLog("[VacBot] *** mid is not a number. Skipping message for map");
                return {mapsetEvent: 'skip'};
            }
        }
        if (event['resultData']['type'] === 'ar') {
            let mapSpotAreas = new map.EcovacsMapSpotAreas(mapMID, event['resultData']['msid']);
            for (let mapIndex in event['resultData']['subsets']) {
                mapSpotAreas.push(new map.EcovacsMapSpotArea(event['resultData']['subsets'][mapIndex]['mssid']));
            }
            tools.envLog("[VacBot] *** MapSpotAreas = " + JSON.stringify(mapSpotAreas));
            return {
                mapsetEvent: 'MapSpotAreas',
                mapsetData: mapSpotAreas
            };
        } else if ((event['resultData']['type'] === 'vw') || (event['resultData']['type'] === 'mw')) {
            if (typeof this.mapVirtualBoundaries[mapMID] === 'undefined') {
                tools.envLog("[VacBot] *** initialize mapVirtualBoundaries for map " + mapMID);
                this.mapVirtualBoundaries[mapMID] = new map.EcovacsMapVirtualBoundaries(mapMID);  //initialize array for mapVirtualBoundaries if not existing
                this.mapVirtualBoundariesResponses[mapMID] = [false, false];
            }
            for (let mapIndex in event['resultData']['subsets']) {
                tools.envLog("[VacBot] *** push mapVirtualBoundaries for mssid " + event['resultData']['subsets'][mapIndex]['mssid']);
                this.mapVirtualBoundaries[mapMID].push(new map.EcovacsMapVirtualBoundary(event['resultData']['subsets'][mapIndex]['mssid'], event['resultData']['type']));
            }
            if (event['resultData']['type'] === 'vw') {
                this.mapVirtualBoundariesResponses[mapMID][0] = true;
            } else if (event['resultData']['type'] === 'mw') {
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

        tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event['resultData']['type']));
        return {mapsetEvent: 'error'};
    }

    handle_mapSubset(event) {
        let mapMID = event['resultData']['mid'];
        if (isNaN(mapMID)) {
            mapMID = this.currentMapMID;
        }
        if (event['resultData']['type'] === 'ar') {
            let mapSpotAreaBoundaries = event['resultData']['value'];
            if (event['resultData']['compress']) {
                mapSpotAreaBoundaries = map.mapPieceToIntArray(event['resultData']['value']);
            }
            let customName = '';
            if (event['resultData']['name']) {
                customName = event['resultData']['name'];
            }
            //TODO: filter out reportMapSubSet events (missing data)
            //reportMapSubSet event comes without map reference, replace
            let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
                mapMID,
                event['resultData']['mssid'],
                event['resultData']['connections'], //reportMapSubSet event comes without connections
                mapSpotAreaBoundaries,
                event['resultData']['subtype'],
                customName
            );
            if (typeof this.mapSpotAreaInfos[mapMID] === 'undefined') {
                this.mapSpotAreaInfos[mapMID] = []; //initialize array for mapSpotAreaInfos if not existing
            }
            this.mapSpotAreaInfos[mapMID][event['resultData']['mssid']] = mapSpotAreaInfo;
            return {
                mapsubsetEvent: 'MapSpotAreaInfo',
                mapsubsetData: mapSpotAreaInfo
            };
        } else if ((event['resultData']['type'] === 'vw') || (event['resultData']['type'] === 'mw')) {
            let mapVirtualBoundaryInfo = new map.EcovacsMapVirtualBoundaryInfo(mapMID, event['resultData']['mssid'], event['resultData']['type'], event['resultData']['value']);
            if (typeof this.mapVirtualBoundaryInfos[mapMID] === 'undefined') {
                this.mapVirtualBoundaryInfos[mapMID] = []; //initialize array for mapVirtualBoundaryInfos if not existing
            }
            this.mapVirtualBoundaryInfos[mapMID][event['resultData']['mssid']] = mapVirtualBoundaryInfo;
            tools.envLog("[VacBot] *** MapVirtualBoundaryInfo = " + JSON.stringify(mapVirtualBoundaryInfo));
            return {
                mapsubsetEvent: 'MapVirtualBoundaryInfo',
                mapsubsetData: mapVirtualBoundaryInfo
            };
        }

        tools.envLog("[VacBot] *** unknown mapset type = " + JSON.stringify(event['resultData']['type']));
        return {
            mapsubsetEvent: 'error'
        };
    }

    handle_mapInfo(event) {
        let mapMID = event['resultData']['mid'];
        if (isNaN(mapMID)) {
            //error
            return;
        }
        if (typeof this.mapImages[mapMID] === 'undefined') {
            this.mapImages[mapMID] = [];
        }
        if (typeof this.mapImages[mapMID][event['resultData']['type']] === 'undefined') {
            this.mapImages[mapMID][event['resultData']['type']] = new map.EcovacsMapImage(mapMID, event['resultData']['type'], event['resultData']['totalWidth'], event['resultData']['totalHeight'], event['resultData']['pixel'], event['resultData']['totalCount']);
        }
        if(event['resultData']['pieceValue']!='') {
            this.mapImages[mapMID][event['resultData']['type']].updateMapPiece(event['resultData']['index'], event['resultData']['startX'], event['resultData']['startY'], event['resultData']['width'], event['resultData']['height'], event['resultData']['crc'], event['resultData']['value'])
        }
        let mapImage = this.mapImages[mapMID][event['resultData']['type']].getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
        //tools.envLog("[VacBot] *** mapImage mapID = " + mapMID + " PNG = " + JSON.stringify(mapImage));
        return mapImage;
    }

    handle_majormap(event) {
        let mapMID = event['resultData']['mid'];
        if (isNaN(mapMID)) {
            //error
            return;
        }
        if(this.liveMapImage == null || this.liveMapImage.mapID != mapMID){
            console.log('DEBUG reset livemap'); //TODO:
            this.liveMapImage = new map.EcovacsLiveMapImage(mapMID, event['resultData']['type']
                , event['resultData']['pieceWidth'], event['resultData']['pieceHeight']
                , event['resultData']['cellWidth'], event['resultData']['cellHeight']
                , event['resultData']['pixel'], event['resultData']['value'])
        } else {
            this.liveMapImage.updateMapDataPiecesCrc(event['resultData']['value']);
        }

    }

    handle_minormap(event) {
        let mapMID = event['resultData']['mid'];
        if (isNaN(mapMID) || this.liveMapImage == null || this.liveMapImage.mapID != mapMID) {
            //error
            return;
        }

        this.liveMapImage.updateMapPiece(event['resultData']['pieceIndex'], event['resultData']['pieceValue']);

        let mapImage = this.liveMapImage.getBase64PNG(this.deebotPosition, this.chargePosition, this.currentMapMID);
        //tools.envLog("[VacBot] *** mapImage mapID = " + mapMID + " PNG = " + JSON.stringify(mapImage));
        return mapImage;
    }

    handle_waterInfo(event) {
        this.waterLevel = event['resultData']['amount'];
        this.waterboxInfo = event['resultData']['enable'];
        tools.envLog("[VacBot] *** waterboxInfo = " + this.waterboxInfo);
        tools.envLog("[VacBot] *** waterLevel = " + this.waterLevel);
    }

    handle_volume(event) {
        if (event.hasOwnProperty('resultData')) {
            this.volume = event['resultData']['volume'];
            tools.envLog("[VacBot] *** volume = " + this.volume);
        }
    }

    handle_chargeState(event) {
        let status = null;
        const isCharging = parseInt(event['resultData']['isCharging']);
        if (isCharging === 1) {
            status = 'charging';
        } else if (isCharging === 0) {
            status = 'idle';
        }
        if (status) {
            this.chargeStatus = status;
        }
    }

    handle_sleepStatus(event) {
        this.sleepStatus = event['resultData']['enable']
        tools.envLog("[VacBot] *** sleepStatus = " + this.sleepStatus);
    }

    handle_autoEmpty(event) {
        this.autoEmpty = event['resultData']['enable']
        tools.envLog("[VacBot] *** autoEmpty = " + this.autoEmpty);
    }

    handle_advancedMode(event) {
        this.advancedMode = event['resultData']['enable']
        tools.envLog("[VacBot] *** advancedMode = " + this.advancedMode);
    }

    handle_trueDetect(event) {
        this.trueDetect = event['resultData']['enable']
        tools.envLog("[VacBot] *** trueDetect = " + this.trueDetect);
    }

    handle_stats(event) {
        this.currentStats = {
            'cleanedArea': event['resultData']['area'],
            'cleanedSeconds': event['resultData']['time'],
            'cleanType': event['resultData']['type']
        }
    }

    handle_error(event) {
        this.errorCode = event['resultData']['code'].toString();
        // known errorCode from library
        if (errorCodes[this.errorCode]) {
            this.errorDescription = errorCodes[this.errorCode];
        } else {
            this.errorDescription = 'unknown errorCode: ' + this.errorCode;
        }
        tools.envLog("[VacBot] *** errorCode = " + this.errorCode);
        tools.envLog("[VacBot] *** errorDescription = " + this.errorDescription);
    }

    handle_getSched(event) {
        tools.envLog("[VacBot] getSched: %s", JSON.stringify(event));
        this.schedules = [];
        for (let c = 0; c < event.resultData.length; c++) {
            const resultData = event.resultData[c];
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
                'enabled': Boolean(Number(resultData.enable)),
                'weekdays': weekdaysObj,
                'hour': resultData.hour,
                'minute': resultData.minute,
                'mapID': resultData.mid
            }
            this.schedules.push(object);
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
                this.createMapDataObject = !!args[0] || false;
                this.createMapImage = this.createMapDataObject && this.isMapImageSupported();
                this.createMapImageOnly = false;
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
            case "DisableDoNotDisturb".toLowerCase(): {
                this.sendCommand(new vacBotCommand.DisableDoNotDisturb());
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
        }
    }
}

module.exports = VacBot_950type;
