'use strict';

const tools = require('../tools');
const constants_type = require('./dictionary');
const constants = require('../constants');

const MAPINFOTYPE_TO_ECOVACS = {
    "outline": "ol",
    "wifiHeatMap": "st",
    "ai": "ai",
    "workarea": "wa"
};

class VacBotCommand {
    constructor(name, payload = {}, api = constants.IOT_DEVMANAGER_PATH) {
        this.name = name;
        if (!payload.hasOwnProperty('id')) {
            Object.assign(payload, {
                'id': tools.getReqID()
            });
        }
        this.args = payload;
        this.api = api;
    }

    getId() {
        return this.args.id;
    }
}

class Clean extends VacBotCommand {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let payload = {
            "act": constants_type.CLEAN_ACTION_TO_ECOVACS[action],
            "count": 1,
            "donotClean": 0,
            "router": "plan",
            "type": constants_type.CLEAN_MODE_TO_ECOVACS[mode]
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                payload[key] = kwargs[key];
            }
        }
        super('clean', payload);
    }
}

class Clean_V2 extends VacBotCommand {
    constructor(mode = 'auto', action = 'start', kwargs = {}) {
        let payload = {
            "act": constants_type.CLEAN_ACTION_TO_ECOVACS[action],
            "content": {
                "count": 1,
                "donotClean": "",
                'type': constants_type.CLEAN_MODE_TO_ECOVACS[mode]
            },
            "mode": "",
            "router": "plan"
        };
        for (let key in kwargs) {
            if (kwargs.hasOwnProperty(key)) {
                Object.assign(payload[key], kwargs[key]);
            }
        }
        super('clean_V2', payload);
    }
}

class Edge extends Clean {
    constructor() {
        super('edge', 'start');
    }
}

class Spot extends Clean {
    constructor() {
        super('spot', 'start', {
            'content': '0,0'
        });
    }
}

// "Hosted mode" Ecovacs Deebot X1 series
class HostedCleanMode extends Clean_V2 {
    constructor() {
        super('entrust', 'start');
    }
}

class SpotArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('spotArea', action, {
            'content': area,
            'count': cleaningAsNumber
        });
    }
}

class SpotArea_V2 extends Clean_V2 {
    constructor(area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('spotArea', 'start', {
            'content': {
                'count': cleaningAsNumber,
                'value': area
            }
        });
    }
}

class CustomArea extends Clean {
    constructor(action = 'start', area = '', cleanings = 1) {
        let cleaningAsNumber = Number(cleanings);
        super('customArea', action, {
            'content': area,
            'count': cleaningAsNumber
        });
    }
}

class CustomArea_V2 extends Clean_V2 {
    constructor(area = '', cleanings = 1, donotClean = 0) {
        let cleaningAsNumber = Number(cleanings);
        super('customArea', 'start', {
            'content': {
                'total': 0,
                'donotClean': donotClean,
                'count': cleaningAsNumber,
                'value': area
            }
        });
    }
}

class MapPoint_V2 extends Clean_V2 {
    constructor(area = '') {
        super('mapPoint', 'start', {
            'content': {
                'total': 0,
                'donotClean': 0,
                'count': 0,
                'value': area
            }
        });
    }
}

class Pause extends VacBotCommand {
    constructor() {
        super('clean', {
            'act': 'pause'
        });
    }
}

class Resume extends VacBotCommand {
    constructor() {
        super('clean', {
            'act': 'resume'
        });
    }
}

class Stop extends VacBotCommand {
    constructor() {
        super('clean', {
            'act': 'stop'
        });
    }
}

class Charge extends VacBotCommand {
    constructor() {
        super('charge', {
                'act': 'go'
            }
        );
    }
}

class Move extends VacBotCommand {
    constructor(action) {
        if (constants_type.MOVE_ACTION.hasOwnProperty(action)) {
            action = constants_type.MOVE_ACTION[action];
        }
        super('move', {
            'act': action
        });
    }
}

class MoveBackward extends Move {
    constructor() {
        super('backward');
    }
}

class MoveForward extends Move {
    constructor() {
        super('forward');
    }
}

class MoveLeft extends Move {
    constructor() {
        super('left');
    }
}

class MoveRight extends Move {
    constructor() {
        super('right');
    }
}

class MoveTurnAround extends Move {
    constructor() {
        super('turn_around');
    }
}

class Relocate extends VacBotCommand {
    constructor() {
        super('setRelocationState', {
            'mode': 'manu'
        });
    }
}

class GetCleanState extends VacBotCommand {
    constructor() {
        super('getCleanInfo');
    }
}

class GetCleanState_V2 extends VacBotCommand {
    constructor() {
        super('getCleanInfo_V2');
    }
}

class GetChargeState extends VacBotCommand {
    constructor() {
        super('getChargeState');
    }
}

class GetBatteryState extends VacBotCommand {
    constructor() {
        super('getBattery');
    }
}

class GetLifeSpan extends VacBotCommand {
    constructor(componentsArray) {
        super('getLifeSpan', componentsArray);
    }
}

class ResetLifeSpan extends VacBotCommand {
    constructor(component) {
        super('resetLifeSpan', {
            'type': constants_type.COMPONENT_TO_ECOVACS[component]
        });
    }
}

class GetCleanSpeed extends VacBotCommand {
    constructor() {
        super('getSpeed');
    }
}

class GetError extends VacBotCommand {
    constructor() {
        super('getError');
    }
}

class SetCleanSpeed extends VacBotCommand {
    constructor(level) {
        if (constants_type.CLEAN_SPEED_TO_ECOVACS.hasOwnProperty(level)) {
            level = constants_type.CLEAN_SPEED_TO_ECOVACS[level];
        }
        super('setSpeed', {
            'speed': level
        });
    }
}

class SetWaterLevel extends VacBotCommand {
    constructor(level, sweepType = 0) {
        const payload = {
            'amount': level
        };
        if ((sweepType === 1) || (sweepType === 2)) {
            Object.assign(payload, {'sweepType': sweepType});
        }
        super('setWaterInfo', payload);
    }
}

/*
Sets the sweep mode for X1 series
 */
class SetCustomAreaMode extends VacBotCommand {
    constructor(sweepMode = 0) {
        super('setCustomAreaMode', {
            'sweepMode': sweepMode
        });
    }
}

class GetWaterInfo extends VacBotCommand {
    constructor() {
        super('getWaterInfo');
    }
}

class GetPosition extends VacBotCommand {
    constructor() {
        super('getPos', ['chargePos', 'deebotPos']);
    }
}

class PlaySound extends VacBotCommand {
    constructor(sid = 0) {
        let sidAsNumber = Number(sid);
        super('playSound', {
            'sid': sidAsNumber
        });
    }
}

class GetNetInfo extends VacBotCommand {
    constructor() {
        super('getNetInfo');
    }
}

class GetCleanSum extends VacBotCommand {
    constructor() {
        super('getTotalStats');
    }
}

class GetMajorMap extends VacBotCommand {
    constructor() {
        super('getMajorMap');
    }
}

class GetMinorMap extends VacBotCommand {
    constructor(mid, pieceIndex, type = 'ol') {
        super('getMinorMap', {
            'mid': mid,
            'pieceIndex': pieceIndex,
            'type': type
        });
    }
}

class GetMapTrace extends VacBotCommand {
    constructor(traceStart = 0, pointCount = 400) {
        super('getMapTrace', {
            'traceStart': traceStart,
            'pointCount': pointCount
        });
    }
}

class GetMapInfo extends VacBotCommand {
    constructor(mapID, mapType = 'outline') {
        if (MAPINFOTYPE_TO_ECOVACS.hasOwnProperty(mapType)) {
            mapType = MAPINFOTYPE_TO_ECOVACS[mapType];
        }
        super('getMapInfo', {
            'mid': mapID,
            'type': mapType
        });
    }
}

// yeedi Mop Station
class GetMapInfo_V2_Yeedi extends VacBotCommand {
    constructor(mapType = '0') {
        super('getMapInfo_V2', {
            'type': mapType
        });
    }
}

// Ecovacs Deebot X1
class GetMapInfo_V2 extends VacBotCommand {
    constructor(mapID, type = '0') {
        super('getMapInfo_V2', {
            'mid': mapID,
            'type': type
        });
    }
}

class GetCachedMapInfo extends VacBotCommand {
    constructor() {
        super('getCachedMapInfo');
    }
}

class GetMapSet extends VacBotCommand {
    constructor(mapID, type = 'ar') {
        super('getMapSet', {
            'mid': mapID,
            'type': type
        });
    }
}

class GetMapSet_V2 extends VacBotCommand {
    constructor(mapID, type = 'ar') {
        super('getMapSet_V2', {
            'mid': mapID,
            'type': type
        });
    }
}

// Not yet used and untested
class SetMapSet extends VacBotCommand {
    constructor(mapID, subsets, act = 'merge') {
        super('setMapSet', {
            'mid': mapID,
            'subsets': subsets,
            'act': act,
            'type': 'ar'
        });
    }
}

class GetMapSpotAreas extends GetMapSet {
    constructor(mapID) {
        super(mapID, 'ar');
    }
}

class GetMapSpotAreas_V2 extends GetMapSet_V2 {
    constructor(mapID) {
        super(mapID, 'ar');
    }
}

class GetMapVirtualBoundaries extends GetMapSet {
    constructor(mapID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapVirtualBoundaryType);
    }
}

class GetMapVirtualBoundaries_V2 extends GetMapSet_V2 {
    constructor(mapID, mapVirtualBoundaryType = 'vw') {
        super(mapID, mapVirtualBoundaryType);
    }
}

class GetMapSubSet extends VacBotCommand {
    constructor(mapID, mapSubSetID, type = 'ar') { //default type is spotAreas
        super('getMapSubSet', {
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type
        });
    }
}

class DeleteMapSubSet extends VacBotCommand {
    constructor(mapID, mapSubSetID, type = 'vw') { //default type is delete virtualWall
        super('setMapSubSet', {
            'act': 'del',
            'mid': mapID,
            'mssid': mapSubSetID,
            'type': type
        });
    }
}

class AddMapSubSet extends VacBotCommand {
    constructor(mapID, coordinates, mapSubSetType = 'vw') { //default type is virtualWall
        super('setMapSubSet', {
            'act': 'add',
            'mid': mapID,
            'type': mapSubSetType,
            'value': coordinates
        });
    }
}

class GetMapSpotAreaInfo extends GetMapSubSet {
    constructor(mapID, mapSubSetID) {
        super(mapID, mapSubSetID, 'ar');
    }
}

class GetMapVirtualBoundaryInfo extends GetMapSubSet {
    constructor(mapID, mapSubSetID, mapVirtualBoundaryType = 'vw') { //default type is virtualWall
        super(mapID, mapSubSetID, mapVirtualBoundaryType);
    }
}

class DeleteMapVirtualBoundary extends DeleteMapSubSet {
    constructor(mapID, mapSubSetID, mapVirtualBoundaryType = 'vw') { //default type is virtualWall
        super(mapID, mapSubSetID, mapVirtualBoundaryType);
    }
}

class AddMapVirtualBoundary extends AddMapSubSet {
    constructor(mapID, mapVirtualBoundaryCoordinates, mapVirtualBoundaryType = 'vw') { //default type is virtualWall
        super(mapID, mapVirtualBoundaryCoordinates, mapVirtualBoundaryType);
    }
}

class GetSleepStatus extends VacBotCommand {
    constructor() {
        super('getSleep');
    }
}

class GetCleanLogs extends VacBotCommand {
    constructor(count = 3) {
        super('GetCleanLogs', {'count': count}, constants.CLEANLOGS_PATH);
    }
}

class GetVolume extends VacBotCommand {
    constructor() {
        super('getVolume');
    }
}

class SetVolume extends VacBotCommand {
    constructor(volume = 1) {
        super('setVolume', {
            'volume': volume
        });
    }
}

class GetAutoEmpty extends VacBotCommand {
    constructor() {
        super('getAutoEmpty');
    }
}

class SetAutoEmpty extends VacBotCommand {
    constructor(enable = 0) {
        super('setAutoEmpty', {
            'enable': enable
        });
    }
}

class EmptyDustBin extends VacBotCommand {
    constructor() {
        super('setAutoEmpty', {
            'act': 'start'
        });
    }
}

class GetContinuousCleaning extends VacBotCommand {
    constructor() {
        super('getBreakPoint');
    }
}

class EnableContinuousCleaning extends VacBotCommand {
    constructor() {
        super('setBreakPoint', {
            'enable': 1
        });
    }
}

class DisableContinuousCleaning extends VacBotCommand {
    constructor() {
        super('setBreakPoint', {
            'enable': 0
        });
    }
}

class SetDoNotDisturb extends VacBotCommand {
    constructor(enable = 0, start = '22:00', end = '21:59') {
        super('setBlock', {
            'enable': enable,
            'start': start,
            'end': end
        });
    }
}

class GetDoNotDisturb extends VacBotCommand {
    constructor() {
        super('getBlock');
    }
}

class EnableDoNotDisturb extends SetDoNotDisturb {
    constructor(start = '22:00', end = '21:59') {
        super(1, start, end);
    }
}

class DisableDoNotDisturb extends VacBotCommand {
    constructor() {
        super('setBlock', {
            'enable': 0
        });
    }
}

class SetAdvancedMode extends VacBotCommand {
    constructor(enable = 0) {
        super('setAdvancedMode', {
            'enable': enable
        });
    }
}

class GetAdvancedMode extends VacBotCommand {
    constructor() {
        super('getAdvancedMode');
    }
}

class SetTrueDetect extends VacBotCommand {
    constructor(enable = 0) {
        super('setTrueDetect', {
            'enable': enable
        });
    }
}

class GetTrueDetect extends VacBotCommand {
    constructor() {
        super('getTrueDetect');
    }
}

class GetSchedule extends VacBotCommand {
    constructor() {
        super('getSched');
    }
}

class GetSchedule_V2 extends VacBotCommand {
    constructor() {
        super('getSched_V2', {
            type: 1
        });
    }
}

class GetDusterRemind extends VacBotCommand {
    constructor() {
        super('getDusterRemind');
    }
}

class SetDusterRemind extends VacBotCommand {
    constructor(enable = 0, period = 30) {
        super('setDusterRemind', {
            'enable': enable,
            'period': period
        });
    }
}

class GetCarpetPressure extends VacBotCommand {
    constructor() {
        super('getCarpertPressure');
    }
}

class SetCarpetPressure extends VacBotCommand {
    constructor(enable = 0) {
        super('setCarpertPressure', {
            'enable': enable
        });
    }
}

class SetCleanCount extends VacBotCommand {
    constructor(count = 1) {
        super('setCleanCount', {
            'count': count
        });
    }
}

class GetCleanCount extends VacBotCommand {
    constructor() {
        super('getCleanCount');
    }
}

class SetCleanPreference extends VacBotCommand {
    constructor(enable = 0) {
        super('setCleanPreference', {
            'enable': enable
        });
    }
}

class GetCleanPreference extends VacBotCommand {
    constructor() {
        super('getCleanPreference');
    }
}

class GetAICleanItemState extends VacBotCommand {
    constructor() {
        super('getAICleanItemState');
    }
}

class GetAirDrying extends VacBotCommand {
    constructor() {
        super('getAirDring');
    }
}

class GetStationState extends VacBotCommand {
    constructor() {
        super('getStationState');
    }
}

class GetStationInfo extends VacBotCommand {
    constructor() {
        super('getStationInfo');
    }
}

class GetWashInterval extends VacBotCommand {
    constructor() {
        super('getWashInterval');
    }
}

class SetWashInterval extends VacBotCommand {
    constructor(interval = 10) {
        super('setWashInterval', {
            interval: interval
        });
    }
}

// Air Drying
// Yeedi Mop Station
class SetAirDrying extends VacBotCommand {
    constructor(act = 'stop') {
        super('setAirDring', {
            'act': act
        });
    }
}

class Washing extends Clean_V2 {
    constructor(action = 'stop') {
        super('washing', action);
    }
}

// Air Drying
// Ecovacs Deebot X1 series
class Drying extends VacBotCommand {
    constructor(act) {
        super('stationAction', {
            "act": act,
            "type": 2
        });
    }
}

class GetRecognization extends VacBotCommand {
    constructor() {
        super('getRecognization');
    }
}

class SetRecognization extends VacBotCommand {
    constructor(state = 0) {
        super('setRecognization', {
            'state': state
        });
    }
}

// TODO: Handle response data
class GetMapState extends VacBotCommand {
    constructor() {
        super('getMapState');
    }
}

class GetMultiMapState extends VacBotCommand {
    constructor() {
        super('getMultiMapState');
    }
}

// TODO: Handle response data
class GetAIMap extends VacBotCommand {
    constructor() {
        super('getAIMap', {
            'pointCount': 1,
            'pointStart': 0
        });
    }
}

class GetBorderSpin extends VacBotCommand {
    constructor() {
        super('getBorderSpin');
    }
}

class SetBorderSpin extends VacBotCommand {
    constructor(enable = 0) {
        super('setBorderSpin', {
            'enable': enable,
            'type': 1
        });
    }
}

class GetSweepMode extends VacBotCommand {
    constructor() {
        super('getSweepMode');
    }
}

class GetCustomAreaMode extends VacBotCommand {
    constructor() {
        super('getCustomAreaMode');
    }
}

/*
Sets the sweep only mode for e.g. X1 series
 */
class SetSweepMode extends VacBotCommand {
    constructor(type = 0) {
        super('setSweepMode', {
            'type': type
        });
    }
}

// Air Purifier (e.g. AIRBOT Z1)

class GetAirQuality extends VacBotCommand {
    constructor() {
        super('getAirQuality');
    }
}

class SinglePoint_V2 extends Clean_V2 {
    constructor(spotCoordinates = '') {
        super('singlePoint', 'start', {
            'content': {
                'value': spotCoordinates
            }
        });
    }
}

class Area_V2 extends Clean_V2 {
    constructor() {
        super('area', 'start');
    }
}

class SetThreeModule extends VacBotCommand {
    constructor(level = 0, type = '', enable = 0) {
        super('setThreeModule', {
            'level': level,
            'type': type,
            'enable': enable,
            'state': 0,
            'err': 0,
            'work': 0
        });
    }
}

class SetFreshenerLevel extends SetThreeModule {
    constructor(level = 0, enable = 0) {
        super(level, 'smell', enable);
    }
}

class SetHumidifierLevel extends SetThreeModule {
    constructor(level = 0, enable = 0) {
        super(level, 'humidify', enable);
    }
}

class SetUVCleaner extends SetThreeModule {
    constructor(enable = 0) {
        super(0, 'uvLight', enable);
    }
}

class SetAtmoLight extends VacBotCommand {
    constructor(intensity = 0) {
        super('setAtmoLight', {
            'intensity': intensity,
            'type': 'system',
            'total': 4
        });
    }
}

class SetBlueSpeaker extends VacBotCommand {
    constructor(enable = 0) {
        super('setBlueSpeaker', {
            'enable': enable,
            'name': 'ECOVACS Z1',
            'resetTime': 1
        });
    }
}

class SetMapSet_V2 extends VacBotCommand {
    constructor(mapID, mapArray) {
        super('setMapSet_V2', {
            mid: mapID,
            subsets: mapArray
        });
    }
}

class SetVoiceSimple extends VacBotCommand {
    constructor(on = 0) {
        super('setVoiceSimple', {
            'on': on
        });
    }
}

class SetMonitorAirState extends VacBotCommand {
    constructor(on = 0) {
        super('setMonitorAirState', {
            'on': on
        });
    }
}

class SetAngleFollow extends VacBotCommand {
    constructor(on = 0) {
        super('setAngleFollow', {
            'on': on
        });
    }
}

class SetMic extends VacBotCommand {
    constructor(on = 0) {
        super('setMic', {
            'on': on
        });
    }
}

class SetBlock extends VacBotCommand {
    constructor(enable = 0, start = '00:00', end = '00:00') {
        super('setBlock', {
            'enable': enable,
            'start': start,
            'end': end
        });
    }
}

class GetLiveLaunchPwdState extends VacBotCommand {
    constructor() {
        super('getLiveLaunchPwdState');
    }
}

class GetHumanoidFollow extends VacBotCommand {
    constructor() {
        super('getHumanoidFollow');
    }
}

class GetMonitorAirState extends VacBotCommand {
    constructor() {
        super('getMonitorAirState');
    }
}

class GetVoiceSimple extends VacBotCommand {
    constructor() {
        super('getVoiceSimple');
    }
}

class GetDrivingWheel extends VacBotCommand {
    constructor() {
        super('getDrivingWheel');
    }
}

class GetChildLock extends VacBotCommand {
    constructor() {
        super('getChildLock');
    }
}

class GetBlock extends VacBotCommand {
    constructor() {
        super('getBlock');
    }
}

class GetTimeZone extends VacBotCommand {
    constructor() {
        super('getTimeZone');
    }
}

class GetTotalStats extends VacBotCommand {
    constructor() {
        super('getTotalStats');
    }
}

class GetWifiList extends VacBotCommand {
    constructor() {
        super('getWifiList');
    }
}

class GetOta extends VacBotCommand {
    constructor() {
        super('getOta');
    }
}

class GetThreeModuleStatus extends VacBotCommand {
    constructor() {
        super('getThreeModuleStatus');
    }
}

class GetScene extends VacBotCommand {
    constructor() {
        super('getScene');
    }
}

class GetListenMusic extends VacBotCommand {
    constructor() {
        super('getListenMusic');
    }
}

class VideoOpened extends VacBotCommand {
    constructor() {
        super('videoOpened');
    }
}

class GetAudioCallState extends VacBotCommand {
    constructor() {
        super('getAudioCallState');
    }
}

class GetVoice extends VacBotCommand {
    constructor() {
        super('getVoice');
    }
}

class GetVoiceLifeRemindState extends VacBotCommand {
    constructor() {
        super('getVoiceLifeRemindState');
    }
}

class GetVoiceAssistantState extends VacBotCommand {
    constructor() {
        super('getVoiceAssistantState');
    }
}

class SetVoiceAssistantState extends VacBotCommand {
    constructor(enable = 0) {
        super('setVoiceAssistantState', {
            'enable': enable
        });
    }
}

class SetVoice extends VacBotCommand {
    constructor(enable = 0, md5sum = '', size = 0, type = '', url = '', vid = 'default') {
        super('setVoice', {
            'enable': enable,
            'md5': md5sum,
            'size': '' + size,
            'type': type,
            'url': url,
            'vid': vid
        });
    }
}

class GetBreakPoint extends VacBotCommand {
    constructor() {
        super('getBreakPoint');
    }
}

class GetRelocationState extends VacBotCommand {
    constructor() {
        super('getRelocationState');
    }
}

class GetAntiDrop extends VacBotCommand {
    constructor() {
        super('getAntiDrop');
    }
}

class GetMapTrace_V2 extends VacBotCommand {
    constructor(type = 0) {
        super('getMapTrace_V2', {
            'type': type
        });
    }
}

module.exports.Generic = VacBotCommand;

module.exports.AddMapVirtualBoundary = AddMapVirtualBoundary;
module.exports.Charge = Charge;
module.exports.Clean = Clean;
module.exports.Clean_V2 = Clean_V2;
module.exports.CustomArea = CustomArea;
module.exports.CustomArea_V2 = CustomArea_V2;
module.exports.DeleteMapVirtualBoundary = DeleteMapVirtualBoundary;
module.exports.DisableContinuousCleaning = DisableContinuousCleaning;
module.exports.DisableDoNotDisturb = DisableDoNotDisturb;
module.exports.Drying = Drying;
module.exports.Edge = Edge;
module.exports.EmptyDustBin = EmptyDustBin;
module.exports.EnableContinuousCleaning = EnableContinuousCleaning;
module.exports.EnableDoNotDisturb = EnableDoNotDisturb;
module.exports.GetAICleanItemState = GetAICleanItemState;
module.exports.GetAIMap = GetAIMap;
module.exports.GetAdvancedMode = GetAdvancedMode;
module.exports.GetAirDrying = GetAirDrying;
module.exports.GetAutoEmpty = GetAutoEmpty;
module.exports.GetBatteryState = GetBatteryState;
module.exports.GetBorderSpin = GetBorderSpin;
module.exports.GetCachedMapInfo = GetCachedMapInfo;
module.exports.GetCarpetPressure = GetCarpetPressure;
module.exports.GetChargeState = GetChargeState;
module.exports.GetCleanCount = GetCleanCount;
module.exports.GetCleanLogs = GetCleanLogs;
module.exports.GetCleanPreference = GetCleanPreference;
module.exports.GetCleanSpeed = GetCleanSpeed;
module.exports.GetCleanState = GetCleanState;
module.exports.GetCleanState_V2 = GetCleanState_V2;
module.exports.GetCleanSum = GetCleanSum;
module.exports.GetContinuousCleaning = GetContinuousCleaning;
module.exports.GetCustomAreaMode = GetCustomAreaMode;
module.exports.GetDoNotDisturb = GetDoNotDisturb;
module.exports.GetDusterRemind = GetDusterRemind;
module.exports.GetError = GetError;
module.exports.GetLifeSpan = GetLifeSpan;
module.exports.GetMajorMap = GetMajorMap;
module.exports.GetMapInfo = GetMapInfo;
module.exports.GetMapInfo_V2 = GetMapInfo_V2;
module.exports.GetMapInfo_V2_Yeedi = GetMapInfo_V2_Yeedi;
module.exports.GetMapSet = GetMapSet;
module.exports.GetMapSet_V2 = GetMapSet_V2;
module.exports.GetMapSpotAreaInfo = GetMapSpotAreaInfo;
module.exports.GetMapSpotAreas = GetMapSpotAreas;
module.exports.GetMapSpotAreas_V2 = GetMapSpotAreas_V2;
module.exports.GetMapState = GetMapState;
module.exports.GetMapTrace_V2 = GetMapTrace_V2;
module.exports.GetMapVirtualBoundaries = GetMapVirtualBoundaries;
module.exports.GetMapVirtualBoundaries_V2 = GetMapVirtualBoundaries_V2;
module.exports.GetMapVirtualBoundaryInfo = GetMapVirtualBoundaryInfo;
module.exports.GetMapTrace = GetMapTrace;
module.exports.GetMinorMap = GetMinorMap;
module.exports.GetMultiMapState = GetMultiMapState;
module.exports.GetNetInfo = GetNetInfo;
module.exports.GetPosition = GetPosition;
module.exports.GetRecognization = GetRecognization;
module.exports.GetSchedule = GetSchedule;
module.exports.GetSchedule_V2 = GetSchedule_V2;
module.exports.GetSleepStatus = GetSleepStatus;
module.exports.GetStationState = GetStationState;
module.exports.GetStationInfo = GetStationInfo;
module.exports.GetSweepMode = GetSweepMode;
module.exports.GetTrueDetect = GetTrueDetect;
module.exports.GetVolume = GetVolume;
module.exports.GetWashInterval = GetWashInterval;
module.exports.GetWaterInfo = GetWaterInfo;
module.exports.GetVoiceAssistantState = GetVoiceAssistantState;
module.exports.HostedCleanMode = HostedCleanMode;
module.exports.MapPoint_V2 = MapPoint_V2;
module.exports.Move = Move;
module.exports.MoveBackward = MoveBackward;
module.exports.MoveForward = MoveForward;
module.exports.MoveLeft = MoveLeft;
module.exports.MoveRight = MoveRight;
module.exports.MoveTurnAround = MoveTurnAround;
module.exports.Pause = Pause;
module.exports.PlaySound = PlaySound;
module.exports.Relocate = Relocate;
module.exports.ResetLifeSpan = ResetLifeSpan;
module.exports.Resume = Resume;
module.exports.SetAdvancedMode = SetAdvancedMode;
module.exports.SetAirDrying = SetAirDrying;
module.exports.SetAutoEmpty = SetAutoEmpty;
module.exports.SetBorderSpin = SetBorderSpin;
module.exports.SetCarpetPressure = SetCarpetPressure;
module.exports.SetCleanCount = SetCleanCount;
module.exports.SetCleanPreference = SetCleanPreference;
module.exports.SetCleanSpeed = SetCleanSpeed;
module.exports.SetCustomAreaMode = SetCustomAreaMode;
module.exports.SetDoNotDisturb = SetDoNotDisturb;
module.exports.SetDusterRemind = SetDusterRemind;
module.exports.SetMapSet = SetMapSet;
module.exports.SetMapSet_V2 = SetMapSet_V2;
module.exports.SetRecognization = SetRecognization;
module.exports.SetSweepMode = SetSweepMode;
module.exports.SetTrueDetect = SetTrueDetect;
module.exports.SetVoiceAssistantState = SetVoiceAssistantState;
module.exports.SetVolume = SetVolume;
module.exports.SetWashInterval = SetWashInterval;
module.exports.SetWaterLevel = SetWaterLevel;
module.exports.Spot = Spot;
module.exports.SpotArea = SpotArea;
module.exports.SpotArea_V2 = SpotArea_V2;
module.exports.Stop = Stop;
module.exports.Washing = Washing;

// Air Purifier (e.g. AIRBOT Z1)
module.exports.Area_V2 = Area_V2;
module.exports.GetAirQuality = GetAirQuality;
module.exports.GetAntiDrop = GetAntiDrop;
module.exports.GetAudioCallState = GetAudioCallState;
module.exports.GetBlock = GetBlock;
module.exports.GetBreakPoint = GetBreakPoint;
module.exports.GetChildLock = GetChildLock;
module.exports.GetDrivingWheel = GetDrivingWheel;
module.exports.GetHumanoidFollow = GetHumanoidFollow;
module.exports.GetListenMusic = GetListenMusic;
module.exports.GetLiveLaunchPwdState = GetLiveLaunchPwdState;
module.exports.GetMonitorAirState = GetMonitorAirState;
module.exports.GetOta = GetOta;
module.exports.GetRelocationState = GetRelocationState;
module.exports.GetScene = GetScene;
module.exports.GetThreeModuleStatus = GetThreeModuleStatus;
module.exports.GetTimeZone = GetTimeZone;
module.exports.GetTotalStats = GetTotalStats;
module.exports.GetVoice = GetVoice;
module.exports.GetVoiceLifeRemindState = GetVoiceLifeRemindState;
module.exports.GetVoiceSimple = GetVoiceSimple;
module.exports.GetWifiList = GetWifiList;
module.exports.SetAngleFollow = SetAngleFollow;
module.exports.SetAtmoLight = SetAtmoLight;
module.exports.SetBlock = SetBlock;
module.exports.SetBlueSpeaker = SetBlueSpeaker;
module.exports.SetFreshenerLevel = SetFreshenerLevel;
module.exports.SetHumidifierLevel = SetHumidifierLevel;
module.exports.SetMic = SetMic;
module.exports.SetMonitorAirState = SetMonitorAirState;
module.exports.SetThreeModule = SetThreeModule;
module.exports.SetUVCleaner = SetUVCleaner;
module.exports.SetVoice = SetVoice;
module.exports.SetVoiceSimple = SetVoiceSimple;
module.exports.SinglePoint_V2 = SinglePoint_V2;
module.exports.VideoOpened = VideoOpened;
