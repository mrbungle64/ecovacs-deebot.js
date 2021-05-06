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
        this.volume = 0;
        this.relocationState = null;
    }

    handle_lifespan(event) {
        for (let component in event['resultData']) {
            if (event['resultData'].hasOwnProperty(component)) {
                let type = event['resultData'][component]["type"];
                let left = event['resultData'][component]["left"];
                let total = event['resultData'][component]["total"];
                let lifespan = parseInt(left) / parseInt(total) * 100;
                try {
                    type = dictionary.COMPONENT_FROM_ECOVACS[type];
                } catch (e) {
                    tools.envLog("[VacBot] Unknown component type: ", event);
                }
                tools.envLog("[VacBot] lifespan %s: %s", type, lifespan);

                this.components[type] = lifespan;
                tools.envLog("[VacBot] lifespan components : %s", JSON.stringify(this.components));
            }
        }
    }

    handle_deebotPosition(event) {
        // as deebotPos and chargePos can also appear in other messages (CleanReport)
        // the handling should be extracted to a seperate function
        const deebotPos = event['resultData']['deebotPos'];
        if (deebotPos) {
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
        this.cleanSpeed = dictionary.CLEAN_SPEED_FROM_ECOVACS[event['resultData']['speed']];
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
        tools.envLog("[VacBot] handle_cleanReport");
        if (event['resultData']['state'] === 'clean') {
            let type = event['resultData']['cleanState']['type'];
            if (typeof event['resultData']['cleanState']['content'] === "object") {
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
        tools.envLog("[VacBot] handle_cleanLogs");
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
                        tools.envLog("[VacBot] cleanLogs %s: %s m2", logIndex, squareMeters);
                        let timestamp = parseInt(logs[logIndex]['ts']);
                        let date = new Date(timestamp * 1000);
                        tools.envLog("[VacBot] cleanLogs %s: %s", logIndex, date.toString());
                        let len = parseInt(logs[logIndex]['last']);
                        let hours = Math.floor(len / 3600);
                        let minutes = Math.floor((len % 3600) / 60);
                        let seconds = Math.floor(len % 60);
                        let totalTimeString = hours.toString() + 'h ' + ((minutes < 10) ? '0' : '') + minutes.toString() + 'm ' + ((seconds < 10) ? '0' : '') + seconds.toString() + 's';
                        tools.envLog("[VacBot] cleanLogs %s: %s", logIndex, totalTimeString);
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
            this.batteryIsLow = (Number(event['resultData']['isLow']) === 1) ? true : false;
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
            //TODO: filter out reportMapSubSet events (missing data)
            //reportMapSubSet event comes without map reference, replace
            let mapSpotAreaInfo = new map.EcovacsMapSpotAreaInfo(
                mapMID,
                event['resultData']['mssid'],
                event['resultData']['connections'], //reportMapSubSet event comes without connections
                event['resultData']['value'],
                event['resultData']['subtype']
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

    run(action) {
        tools.envLog("[VacBot] action: %s", action);
        switch (action.toLowerCase()) {
            case "Clean".toLowerCase():
                if (arguments.length === 1) {
                    this.sendCommand(new vacBotCommand.Clean());
                } else if (arguments.length === 2) {
                    this.sendCommand(new vacBotCommand.Clean(arguments[1]));
                } else {
                    this.sendCommand(new vacBotCommand.Clean(arguments[1], arguments[2]));
                }
                break;
            case "Edge".toLowerCase():
                this.sendCommand(new vacBotCommand.Edge());
                break;
            case "Spot".toLowerCase():
                this.sendCommand(new vacBotCommand.Spot());
                break;
            case "SpotArea".toLowerCase():
                if (arguments.length === 3) {
                    this.sendCommand(new vacBotCommand.SpotArea(arguments[1], arguments[2]));
                } else if (arguments.length >= 4) {
                    // including number of cleanings
                    this.sendCommand(new vacBotCommand.SpotArea(arguments[1], arguments[2], arguments[3]));
                }
                break;
            case "CustomArea".toLowerCase():
                if (arguments.length >= 4) {
                    this.sendCommand(new vacBotCommand.CustomArea(arguments[1], arguments[2], arguments[3]));
                }
                break;
            case "Stop".toLowerCase():
                this.sendCommand(new vacBotCommand.Stop());
                break;
            case "Pause".toLowerCase():
                this.sendCommand(new vacBotCommand.Pause());
                break;
            case "Resume".toLowerCase():
                this.sendCommand(new vacBotCommand.Resume());
                break;
            case "Charge".toLowerCase():
                this.sendCommand(new vacBotCommand.Charge());
                break;
            case "Move".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.Move(arguments[1]));
                }
                break;
            case "MoveBackward".toLowerCase():
                this.sendCommand(new vacBotCommand.MoveBackward());
                break;
            case "MoveForward".toLowerCase():
                this.sendCommand(new vacBotCommand.MoveForward());
                break;
            case "MoveLeft".toLowerCase():
                this.sendCommand(new vacBotCommand.MoveLeft());
                break;
            case "MoveRight".toLowerCase():
                this.sendCommand(new vacBotCommand.MoveRight());
                break;
            case "MoveTurnAround".toLowerCase():
                this.sendCommand(new vacBotCommand.MoveTurnAround());
                break;
            case "Relocate".toLowerCase():
                this.sendCommand(new vacBotCommand.Relocate());
                break;
            case "PlaySound".toLowerCase():
                if (arguments.length <= 1) {
                    this.sendCommand(new vacBotCommand.PlaySound());
                } else if (arguments.length === 2) {
                    this.sendCommand(new vacBotCommand.PlaySound(arguments[1]));
                }
                break;
            case "GetDeviceInfo".toLowerCase():
                this.sendCommand(new vacBotCommand.GetDeviceInfo());
                break;
            case "GetCleanState".toLowerCase():
                this.sendCommand(new vacBotCommand.GetCleanState());
                break;
            case "GetCleanSpeed".toLowerCase():
                this.sendCommand(new vacBotCommand.GetCleanSpeed());
                break;
            case "GetCleanSum".toLowerCase():
                this.sendCommand(new vacBotCommand.GetCleanSum());
                break;
            case "GetChargeState".toLowerCase():
                this.sendCommand(new vacBotCommand.GetChargeState());
                break;
            case "GetMapImage".toLowerCase():
                if (arguments.length === 2) {
                    this.sendCommand(new vacBotCommand.GetMapImage(arguments[1]));
                }else if (arguments.length === 3) {
                    this.sendCommand(new vacBotCommand.GetMapImage(arguments[1],arguments[2]));
                }
                break;
            case "GetMaps".toLowerCase():
                this.createMapDataObject = !!arguments[1] || false;
                this.sendCommand(new vacBotCommand.GetMaps());
                break;
            case "GetSpotAreas".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.GetMapSpotAreas(arguments[1]));
                }
                break;
            case "GetSpotAreaInfo".toLowerCase():
                if (arguments.length >= 3) {
                    this.sendCommand(new vacBotCommand.GetMapSpotAreaInfo(arguments[1], arguments[2]));
                }
                break;
            case "GetVirtualBoundaries".toLowerCase():
                if (arguments.length === 2) {
                    if (typeof this.mapVirtualBoundariesResponses[arguments[1]] === 'undefined') {
                        tools.envLog("[VacBot] *** initialize mapVirtualBoundariesResponses for map " + arguments[1]);
                        this.mapVirtualBoundariesResponses[arguments[1]] = [false, false];
                    } else {
                        this.mapVirtualBoundariesResponses[arguments[1]][0] = false;
                        this.mapVirtualBoundariesResponses[arguments[1]][1] = false;
                    }
                    this.sendCommand(new vacBotCommand.GetMapVirtualBoundaries(arguments[1], 'vw'));
                    this.sendCommand(new vacBotCommand.GetMapVirtualBoundaries(arguments[1], 'mw'));
                }
                break;
            case "GetVirtualBoundaryInfo".toLowerCase():
                if (arguments.length >= 4) {
                    this.sendCommand(new vacBotCommand.GetMapVirtualBoundaryInfo(arguments[1], arguments[2], arguments[3]));
                }
                break;
            case "DeleteVirtualBoundary".toLowerCase():
                if (arguments.length >= 4) {
                    this.sendCommand(new vacBotCommand.DeleteMapVirtualBoundary(arguments[1], arguments[2], arguments[3]));
                }
                break;
            case "AddVirtualBoundary".toLowerCase():
                if (arguments.length === 3) {
                    this.sendCommand(new vacBotCommand.AddMapVirtualBoundary(arguments[1], arguments[2], 'vw'));
                } else if (arguments.length >= 4) {
                    this.sendCommand(new vacBotCommand.AddMapVirtualBoundary(arguments[1], arguments[2], arguments[3]));
                }
                break;
            case "GetError".toLowerCase():
                this.sendCommand(new vacBotCommand.GetError());
                break;
            case "GetBatteryState".toLowerCase():
                this.sendCommand(new vacBotCommand.GetBatteryState());
                break;
            case "GetNetInfo".toLowerCase():
                this.sendCommand(new vacBotCommand.GetNetInfo());
                break;
            case "GetLifeSpan".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.GetLifeSpan(arguments[1]));
                }
                break;
            case "ResetLifeSpan".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.ResetLifeSpan(arguments[1]));
                }
                break;
            case "GetWaterlevel".toLowerCase():
            case "GetWaterboxInfo".toLowerCase():
            case "GetWaterInfo".toLowerCase():
                this.sendCommand(new vacBotCommand.GetWaterInfo());
                break;
            case "GetPosition".toLowerCase():
                this.sendCommand(new vacBotCommand.GetPosition());
                break;
            case "GetSleepStatus".toLowerCase():
                this.sendCommand(new vacBotCommand.GetSleepStatus());
                break;
            case "SetWaterLevel".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.SetWaterLevel(arguments[1]));
                }
                break;
            case "SetCleanSpeed".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.SetCleanSpeed(arguments[1]));
                }
                break;
            case "GetCleanLogs".toLowerCase():
                this.sendCommand(new vacBotCommand.GetCleanLogs());
                break;
            case "GetVolume".toLowerCase():
                this.sendCommand(new vacBotCommand.GetVolume());
                break;
            case "SetVolume".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.SetVolume(arguments[1]));
                }
                break;
            case "GetAutoEmpty".toLowerCase():
                this.sendCommand(new vacBotCommand.GetAutoEmpty());
                break;
            case "SetAutoEmpty".toLowerCase():
                if (arguments.length >= 2) {
                    this.sendCommand(new vacBotCommand.SetAutoEmpty(arguments[1]));
                }
                break;
        }
    }
}

module.exports = VacBot_950type;
