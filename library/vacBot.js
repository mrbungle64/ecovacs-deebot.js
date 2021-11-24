const tools = require('./tools');
const errorCodes = require('./errorCodes');
const i18n = require('./i18n');
const map = require('./mapTemplate');

class VacBot {
    constructor(user, hostname, resource, secret, vacuum, continent, country, server_address = null) {
        this.ecovacs = null;
        this.vacuum = vacuum;
        this.is_ready = false;

        this.useMqtt = this.useMqttProtocol();
        this.deviceClass = vacuum['class'];
        this.deviceModel = this.getProductName();
        this.deviceImageURL = this.getProductImageURL();
        this.components = {};
        this.lastComponentValues = {};
        this.emitFullLifeSpanEvent = false;

        this.errorCode = '0';
        this.errorDescription = errorCodes[this.errorCode];

        this.maps = null;
        this.mapImages = [];
        this.mapVirtualBoundaries = [];
        this.mapVirtualBoundariesResponses = []; // response from vw, mw per mapID
        this.mapSpotAreaInfos = [];
        this.mapVirtualBoundaryInfos = [];
        this.currentMapName = 'unknown';
        this.currentMapMID = null;
        this.currentMapIndex = 0;
        this.lastUsedAreaValues = null;

        this.batteryInfo = null;
        this.batteryIsLow = false;
        this.cleanReport = null;
        this.chargeStatus = null;
        this.cleanSpeed = null;
        this.waterLevel = null;
        this.waterboxInfo = null;
        this.sleepStatus = null;

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
        this.cleanLog_lastTimestamp = null;
        this.cleanLog_lastTotalTime = null;
        this.cleanLog_lastTotalTimeString = null;
        this.cleanLog_lastSquareMeters = null;

        this.currentStats = null;

        this.netInfoIP = null;
        this.netInfoWifiSSID = null;
        this.netInfoWifiSignal = null;
        this.netInfoMAC = null;

        // OnOff
        this.doNotDisturbEnabled = null;
        this.continuousCleaningEnabled = null;
        this.voiceReportDisabled = null;

        this.commandsSent = [];
        this.mapPiecePacketsSent = [];

        this.createMapDataObject = false;
        this.createMapImage = false;
        this.createMapImageOnly = false;
        this.mapDataObject = null;
        this.mapDataObjectQueue = [];

        this.schedule = [];

        this.vacBotCommand = this.getLibraryForCommands();

        const LibraryForProtocol = this.getLibraryForProtocol();
        this.ecovacs = new LibraryForProtocol(this, user, hostname, resource, secret, continent, country, vacuum, server_address);

        this.ecovacs.on("ready", () => {
            tools.envLog("[VacBot] Ready event!");
            this.is_ready = true;
        });

        this.on('MapDataReady', () => {
            if (this.mapDataObject) {
                if (this.createMapImageOnly) {
                    if (this.mapDataObject[0] && this.mapDataObject[0].mapImage) {
                        this.createMapDataObject = false;
                        this.ecovacs.emit('MapImage', this.mapDataObject[0].mapImage);
                        this.createMapImageOnly = false;
                    }
                } else {
                    this.ecovacs.emit('MapDataObject', this.mapDataObject);
                }
                map.mapDataObject = JSON.parse(JSON.stringify(this.mapDataObject)); //clone to mapTemplate
                this.mapDataObject = null;
            }
        });

        this.on('Maps', (mapData) => {
            if (this.createMapDataObject) {
                this.handleMapsEvent(mapData);
            }
        });
        this.on('MapSpotAreas', (spotAreas) => {
            if (this.createMapDataObject) {
                this.handleMapSpotAreasEvent(spotAreas);
            }
        });
        this.on('MapSpotAreaInfo', (spotAreaInfo) => {
            if (this.createMapDataObject) {
                this.handleMapSpotAreaInfo(spotAreaInfo);
            }
        });
        this.on('MapVirtualBoundaries', (virtualBoundaries) => {
            if (this.createMapDataObject) {
                this.handleMapVirtualBoundaries(virtualBoundaries);
            }
        });
        this.on('MapVirtualBoundaryInfo', (virtualBoundaryInfo) => {
            if (this.createMapDataObject) {
                this.handleMapVirtualBoundaryInfo(virtualBoundaryInfo);
            }
        });
        this.on('MapImageData', (mapImageInfo) => {
            if (this.createMapDataObject) {
                (async () => {
                    await this.handleMapImageInfo(mapImageInfo);
                })();
            }
        });
    }

    clean(mode = "Clean") {
        this.run(mode);
    }

    spotArea(areas) {
        this.run("SpotArea", "start", areas);
    }

    customArea(boundaryCoordinates, numberOfCleanings = 1) {
        this.run("CustomArea", "start", boundaryCoordinates, numberOfCleanings);
    }

    edge() {
        this.clean('Edge');
    }

    spot() {
        this.clean('Spot');
    }

    charge() {
        this.run('Charge');
    }

    stop() {
        this.run('Stop');
    }

    pause(mode = 'auto') {
        this.run('Pause', mode);
    }

    resume() {
        this.run('Resume');
    }

    playSound(soundID = 0) {
        this.run("PlaySound", soundID);
    }

    run(action, ...args) {
        switch (action.toLowerCase()) {
            case "Clean".toLowerCase(): {
                this.sendCommand(new this.vacBotCommand.Clean());
                break;
            }
            case "SpotArea".toLowerCase(): {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.sendCommand(new this.vacBotCommand.SpotArea('start', area, cleanings));
                }
                break;
            }
            case "CustomArea".toLowerCase(): {
                const area = args[1].toString();
                const cleanings = args[2] || 1;
                if (area !== '') {
                    this.sendCommand(new this.vacBotCommand.CustomArea('start', area, cleanings));
                }
                break;
            }
            case "Edge".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Edge());
                break;
            case "Spot".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Spot());
                break;
            case "Pause".toLowerCase(): {
                const mode = args[0] || 'auto';
                this.sendCommand(new this.vacBotCommand.Pause(mode));
                break;
            }
            case "Stop".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Stop());
                break;
            case "Resume".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Resume());
                break;
            case "Charge".toLowerCase():
                this.sendCommand(new this.vacBotCommand.Charge());
                break;
            case "GetChargeState".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetChargeState());
                break;
            case "GetBatteryState".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetBatteryState());
                break;
            case "GetCleanState".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetCleanState());
                break;
            case "GetCleanSpeed".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetCleanSpeed());
                break;
            case "GetNetInfo".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetNetInfo());
                break;
            case "GetSleepStatus".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetSleepStatus());
                break;
            case "GetPosition".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetPosition());
                break;
            case "GetSchedule".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetSchedule());
                break;
            case "PlaySound".toLowerCase(): {
                let sid = args[0] || 0;
                this.sendCommand(new this.vacBotCommand.PlaySound(Number(sid)));
                break;
            }
            case "GetCleanSum".toLowerCase(): {
                if (!this.isN79series()) {
                    // https://github.com/mrbungle64/ioBroker.ecovacs-deebot/issues/67
                    this.sendCommand(new this.vacBotCommand.GetCleanSum());
                }
                break;
            }
            case "ResetLifeSpan".toLowerCase(): {
                const component = args[0];
                if (component !== '') {
                    this.sendCommand(new this.vacBotCommand.ResetLifeSpan(component));
                }
                break;
            }
            case "SetWaterLevel".toLowerCase(): {
                const level = Number(args[0]);
                if ((level >= 1) && (level <= 4)) {
                    this.sendCommand(new this.vacBotCommand.SetWaterLevel(level));
                }
                break;
            }
            case "SetCleanSpeed".toLowerCase(): {
                const level = Number(args[0]);
                if ((level >= 1) && (level <= 4)) {
                    this.sendCommand(new this.vacBotCommand.SetCleanSpeed(level));
                }
                break;
            }
            case "GetDoNotDisturb".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetDoNotDisturb());
                break;
            case "DisableDoNotDisturb".toLowerCase():
                this.sendCommand(new this.vacBotCommand.DisableDoNotDisturb());
                break;
            case "GetContinuousCleaning".toLowerCase():
                this.sendCommand(new this.vacBotCommand.GetContinuousCleaning());
                break;
            case "EnableContinuousCleaning".toLowerCase():
                this.sendCommand(new this.vacBotCommand.EnableContinuousCleaning());
                break;
            case "DisableContinuousCleaning".toLowerCase():
                this.sendCommand(new this.vacBotCommand.DisableContinuousCleaning());
                break;
            case "Move".toLowerCase(): {
                const action = args[0];
                if (action !== '') {
                    this.sendCommand(new this.vacBotCommand.Move(action));
                }
                break;
            }
            case "MoveBackward".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveBackward());
                break;
            case "MoveForward".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveForward());
                break;
            case "MoveLeft".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveLeft());
                break;
            case "MoveRight".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveRight());
                break;
            case "MoveTurnAround".toLowerCase():
                this.sendCommand(new this.vacBotCommand.MoveTurnAround());
                break;
        }
    }

    handleMapsEvent(mapData) {
        if (!this.mapDataObject) {
            this.mapDataObject = [];
            for (const i in mapData['maps']) {
                if (Object.prototype.hasOwnProperty.call(mapData['maps'], i)) {
                    const mapID = mapData['maps'][i]['mapID'];
                    this.mapDataObject.push(mapData['maps'][i].toJSON());
                    this.run('GetSpotAreas', mapID);
                    this.mapDataObjectQueue.push({
                        'type': 'GetSpotAreas',
                        'mapID': mapID
                    });
                    this.run('GetVirtualBoundaries', mapID);
                    this.mapDataObjectQueue.push({
                        'type': 'GetVirtualBoundaries',
                        'mapID': mapID
                    });
                    // 950 type models
                    if (this.createMapImage && tools.isCanvasModuleAvailable() && this.is950type()) {
                        this.run('GetMapImage', mapID, 'outline', false);
                        this.mapDataObjectQueue.push({
                            'type': 'GetMapImage',
                            'mapID': mapID
                        });
                    }
                }
            }
        }
    }

    handleMapSpotAreasEvent(spotAreas) {
        const mapID = spotAreas['mapID'];
        const mapObject = map.getMapObject(this.mapDataObject, mapID);
        if (mapObject) {
            mapObject['mapSpotAreas'] = [];
            for (const i in spotAreas['mapSpotAreas']) {
                if (Object.prototype.hasOwnProperty.call(spotAreas['mapSpotAreas'], i)) {
                    const mapSpotAreaID = spotAreas['mapSpotAreas'][i]['mapSpotAreaID'];
                    mapObject['mapSpotAreas'].push(spotAreas['mapSpotAreas'][i].toJSON());
                    this.run('GetSpotAreaInfo', spotAreas['mapID'], mapSpotAreaID);
                    this.mapDataObjectQueue.push({
                        'type': 'GetSpotAreaInfo',
                        'mapID': spotAreas['mapID'],
                        'mapSpotAreaID': mapSpotAreaID
                    });
                }
            }
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetSpotAreas')) {
                return false;
            }
            return true;
        });
    }

    handleMapVirtualBoundaries(virtualBoundaries) {
        const mapID = virtualBoundaries['mapID'];
        const mapObject = map.getMapObject(this.mapDataObject, mapID);
        if (mapObject) {
            mapObject['mapVirtualBoundaries'] = [];
            const virtualBoundariesCombined = [...virtualBoundaries['mapVirtualWalls'], ...virtualBoundaries['mapNoMopZones']];
            const virtualBoundaryArray = [];
            for (const i in virtualBoundariesCombined) {
                virtualBoundaryArray[virtualBoundariesCombined[i]['mapVirtualBoundaryID']] = virtualBoundariesCombined[i];
            }
            for (const i in virtualBoundaryArray) {
                const mapVirtualBoundaryID = virtualBoundaryArray[i]['mapVirtualBoundaryID'];
                const mapVirtualBoundaryType = virtualBoundaryArray[i]['mapVirtualBoundaryType'];
                mapObject['mapVirtualBoundaries'].push(virtualBoundaryArray[i].toJSON());
                this.run('GetVirtualBoundaryInfo', mapID, mapVirtualBoundaryID, mapVirtualBoundaryType);
                this.mapDataObjectQueue.push({
                    'type': 'GetVirtualBoundaryInfo',
                    'mapID': mapID,
                    'mapVirtualBoundaryID': mapVirtualBoundaryID,
                    'mapVirtualBoundaryType': mapVirtualBoundaryType
                });
            }
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetVirtualBoundaries')) {
                return false;
            }
            return true;
        });
    }

    handleMapSpotAreaInfo(spotAreaInfo) {
        const mapID = spotAreaInfo['mapID'];
        const mapSpotAreaID = spotAreaInfo['mapSpotAreaID'];
        const mapSpotAreasObject = map.getSpotAreaObject(this.mapDataObject, mapID, mapSpotAreaID);
        if (mapSpotAreasObject) {
            Object.assign(mapSpotAreasObject, spotAreaInfo.toJSON());
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetSpotAreaInfo')) {
                if (item.mapSpotAreaID === mapSpotAreaID) {
                    return false;
                }
            }
            return true;
        })
        if (this.mapDataObjectQueue.length === 0) {
            this.ecovacs.emit('MapDataReady');
        }
    }

    handleMapVirtualBoundaryInfo(virtualBoundaryInfo) {
        const mapID = virtualBoundaryInfo['mapID'];
        const virtualBoundaryID = virtualBoundaryInfo['mapVirtualBoundaryID'];
        const mapVirtualBoundaryObject = map.getVirtualBoundaryObject(this.mapDataObject, mapID, virtualBoundaryID);
        if (mapVirtualBoundaryObject) {
            Object.assign(mapVirtualBoundaryObject, virtualBoundaryInfo.toJSON());
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetVirtualBoundaryInfo')) {
                if (item.mapVirtualBoundaryType === virtualBoundaryInfo.mapVirtualBoundaryType) {
                    if (item.mapVirtualBoundaryID === virtualBoundaryID) {
                        return false;
                    }
                }
            }
            return true;
        })
        if (this.mapDataObjectQueue.length === 0) {
            this.ecovacs.emit('MapDataReady');
        }
    }

    async handleMapImageInfo(mapImageInfo) {
        const mapID = mapImageInfo['mapID'];
        const mapObject = map.getMapObject(this.mapDataObject, mapID);
        if (mapObject) {
            mapObject['mapImage']= mapImageInfo;
        }
        this.mapDataObjectQueue = this.mapDataObjectQueue.filter(item => {
            if ((item.mapID === mapID) && (item.type === 'GetMapImage')) {
                return false;
            }
            return true;
        })
        if (this.mapDataObjectQueue.length === 0) {
            this.ecovacs.emit('MapDataReady');
        }
    }

    // Deprecated but keep this method for now
    connect_and_wait_until_ready() {
        this.connect();
    }

    connect() {
        this.ecovacs.connect();
    }

    on(name, func) {
        this.ecovacs.on(name, func);
    }

    getLibraryForCommands() {
        if (this.is950type()) {
            return require('./vacBotCommand_950type');
        } else {
            return require('./vacBotCommand_non950type');
        }
    }

    getLibraryForProtocol() {
        if (this.is950type()) {
            return require('./ecovacsMQTT_JSON.js');
        } else if (this.useMqtt) {
            return require('./ecovacsMQTT_XML.js');
        } else {
            return require('./ecovacsXMPP.js');
        }
    }

    useMqttProtocol() {
        return (this.vacuum['company'] === 'eco-ng');
    }

    getProtocol() {
        return this.useMqttProtocol() ? 'MQTT' : 'XMPP';
    }

    is950type() {
        const defaultValue = this.useMqttProtocol();
        return this.getDeviceProperty('950type', defaultValue);
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

    getDeviceProperty(property, defaultValue = false) {
        return tools.getDeviceProperty(this.deviceClass, property, defaultValue);
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

    // Deprecated
    hasSpotAreas() {
        return this.hasSpotAreaCleaningMode();
    }

    hasSpotAreaCleaningMode() {
        return this.getDeviceProperty('spot_area');
    }

    // Deprecated
    hasCustomAreas() {
        return this.hasCustomAreaCleaningMode();
    }

    hasCustomAreaCleaningMode() {
        return this.getDeviceProperty('custom_area');
    }

    hasMappingCapabilities() {
        return this.hasSpotAreaCleaningMode() && this.hasCustomAreaCleaningMode()
    }

    hasMoppingSystem() {
        return this.getDeviceProperty('mopping_system');
    }

    hasVacuumPowerAdjustment() {
        return this.getDeviceProperty('clean_speed');
    }

    hasVoiceReports() {
        return this.getDeviceProperty('voice_report');
    }

    hasAutoEmptyStation() {
        return this.getDeviceProperty('auto_empty_station');
    }

    isMapImageSupported() {
        return this.getDeviceProperty('map_image_supported');
    }

    getVacBotDeviceId() {
        if (!this.useMqtt) {
            return this.vacuum['did'] + '@' + this.vacuum['class'] + '.ecorobot.net/atom';
        } else {
            return this.vacuum['did'];
        }
    }

    getProductName() {
        return this.vacuum['deviceName'];
    }

    getProductImageURL() {
        return this.vacuum['icon'];
    }

    getModelName() {
        return this.getDeviceProperty('name', '');
    }

    getName() {
        if (this.getNickname()) {
            return this.getNickname();
        }
        return '';
    }

    getNickname() {
        if (this.vacuum['nick']) {
            return this.vacuum['nick'];
        }
        return this.getProductName();
    }

    sendCommand(action) {
        if (!this.is950type()) {
            this.commandsSent[action.getId()] = action;
            if ((action.name === 'PullMP') && (action.args)) {
                this.mapPiecePacketsSent[action.getId()] = action.args.pid;
            }
        }
        tools.envLog("[VacBot] Sending command `%s` with id %s", action.name, action.getId());
        let actionPayload = this.useMqtt ? action : action.to_xml();
        (async () => {
            await this.ecovacs.sendCommand(actionPayload, this.getVacBotDeviceId());
        })();
    }

    // Deprecated
    sendPing() {
        this.ecovacs.sendPing();
    }

    disconnect() {
        this.ecovacs.disconnect();
        this.is_ready = false;
    }

    getAreaName_i18n(name, languageCode = 'en') {
        return i18n.getSpotAreaName(name, languageCode);
    }

    removeFromLogs(logData) {
        let output = logData;
        output = output.replace(new RegExp("(" + this.vacuum.did + ")", "g"), "[REMOVED]");
        output = output.replace(new RegExp("(" + this.ecovacs.secret + ")", "g"), "[REMOVED]");
        return output;
    }
}

module.exports = VacBot;
