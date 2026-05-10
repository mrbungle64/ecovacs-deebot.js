'use strict';

/**
 * Data-driven command registry for trivial command mappings.
 *
 * Each key is the **lowercased** command name used in `vacBot.run()`.
 * Values:
 *   - `cmd`       {string}   Name of the VacBotCommand class to instantiate
 *   - `minArgs`   {number}   Minimum number of args required (optional, default 0)
 *   - `fixedArgs` {Array}    Fixed arguments to pass instead of user args (optional)
 *   - `aliases`   {string[]} Additional lowercased command names that map to the same entry
 *
 * Commands with model-specific branching, validation logic, or side-effects
 * are NOT included here — they remain in the switch-case in vacBot.run().
 */
const COMMAND_REGISTRY = {
    // ==================
    // Clean
    // ==================
    'Area_V2': { cmd: 'Area_V2' },
    'Charge': { cmd: 'Charge' },
    'Clean': { cmd: 'Clean' },
    'Clean_V2': { specialLogic: true },
    'CustomArea': { specialLogic: true },
    'CustomArea_V2': { specialLogic: true },
    'DisableCleanPreference': { cmd: 'SetCleanPreference', fixedArgs: [0] },
    'Edge': { cmd: 'Edge' },
    'EnableCleanPreference': { cmd: 'SetCleanPreference', fixedArgs: [1] },
    'FreeClean': { specialLogic: true },
    'GoToPosition': { specialLogic: true },
    'HostedCleanMode': { cmd: 'HostedCleanMode' },
    'SetAutonomousClean': { cmd: 'SetAutonomousClean', minArgs: 1 },
    'SetCleanCount': { cmd: 'SetCleanCount', minArgs: 1 },
    'SetCleanPreference': { cmd: 'SetCleanPreference', minArgs: 1 },
    'Spot': { cmd: 'Spot' },
    'SpotArea': { specialLogic: true },
    'SpotArea_V2': { specialLogic: true },

    // ==================
    // Continuous Cleaning
    // ==================
    'DisableContinuousCleaning': { cmd: 'SetContinuousCleaning', fixedArgs: [0] },
    'EnableContinuousCleaning': { cmd: 'SetContinuousCleaning', fixedArgs: [1] },
    'GetBreakpoint': { cmd: 'GetContinuousCleaning' },
    'GetContinuousCleaning': { cmd: 'GetContinuousCleaning' },
    'SetContinuousCleaning': { cmd: 'SetContinuousCleaning', minArgs: 1 },

    // ==================
    // Info / Status
    // ==================
    'DisableAdvancedMode': { cmd: 'SetAdvancedMode', fixedArgs: [0] },
    'DisableAutoEmpty': { cmd: 'SetAutoEmpty', fixedArgs: [0] },
    'DisableCarpetPressure': { cmd: 'SetCarpetPressure', fixedArgs: [0] },
    'EnableAdvancedMode': { cmd: 'SetAdvancedMode', fixedArgs: [1] },
    'EnableAutoEmpty': { cmd: 'SetAutoEmpty', fixedArgs: [1] },
    'EnableCarpetPressure': { cmd: 'SetCarpetPressure', fixedArgs: [1] },
    'GetAdvancedMode': { cmd: 'GetAdvancedMode' },
    'GetAICleanItemState': { cmd: 'GetAICleanItemState' },
    'GetAutoEmpty': { cmd: 'GetAutoEmpty' },
    'GetAutonomousClean': { cmd: 'GetAutonomousClean' },
    'GetBatteryState': { cmd: 'GetBatteryState' },
    'GetBorderSwitch': { cmd: 'GetBorderSwitch' },
    'GetCarpetInfo': { cmd: 'GetCarpetInfo' },
    'GetCarpetPressure': { cmd: 'GetCarpetPressure' },
    'GetChargeState': { cmd: 'GetChargeState' },
    'GetCleanCount': { cmd: 'GetCleanCount' },
    'GetCleanInfo': { cmd: 'GetCleanState' },
    'GetCleanPreference': { cmd: 'GetCleanPreference' },
    'GetCleanSpeed': { cmd: 'GetCleanSpeed' },
    'GetCleanState': { cmd: 'GetCleanState' },
    'GetCleanState_V2': { cmd: 'GetCleanState_V2' },
    'GetCleanSum': { cmd: 'GetCleanSum' },
    'GetCrossMapBorderWarning': { cmd: 'GetCrossMapBorderWarning' },
    'GetCutDirection': { cmd: 'GetCutDirection' },
    'GetDoNotDisturb': { cmd: 'GetDoNotDisturb' },
    'GetDusterRemind': { cmd: 'GetDusterRemind' },
    'GetError': { cmd: 'GetError' },
    'GetFanSpeed': { cmd: 'GetFanSpeed' },
    'GetMoveUpWarning': { cmd: 'GetMoveUpWarning' },
    'GetNetInfo': { cmd: 'GetNetInfo' },
    'GetNetInfoLegacy': { cmd: 'GetNetInfoLegacy' },
    'GetOta': { cmd: 'GetOta' },
    'GetPosition': { cmd: 'GetPosition' },
    'GetQuickCommand': { cmd: 'GetQuickCommand', minArgs: 1 },
    'GetRecognization': { cmd: 'GetRecognization' },
    'GetRelocationState': { cmd: 'GetRelocationState' },
    'GetSafeProtect': { cmd: 'GetSafeProtect' },
    'GetSchedule': { cmd: 'GetSchedule' },
    'GetSchedule_V2': { cmd: 'GetSchedule_V2' },
    'GetSleepStatus': { cmd: 'GetSleepStatus' },
    'GetStats': { cmd: 'GetStats' },
    'GetTimeZone': { cmd: 'GetTimeZone' },
    'GetTotalStats': { cmd: 'GetTotalStats' },
    'GetVoiceLifeRemindState': { cmd: 'GetVoiceLifeRemindState' },
    'GetVolume': { cmd: 'GetVolume' },
    'GetWifiList': { cmd: 'GetWifiList' },
    'GetWorkState': { cmd: 'GetWorkState' },
    'Relocate': { cmd: 'Relocate' },
    'SetAutoEmpty': { cmd: 'SetAutoEmpty', minArgs: 1 },
    'SetCarpetInfo': { cmd: 'SetCarpetInfo', minArgs: 1 },
    'SetCarpetPressure': { cmd: 'SetCarpetPressure', minArgs: 1 },
    'SetDusterRemind': { cmd: 'SetDusterRemind', minArgs: 1 },
    'SetRecognization': { cmd: 'SetRecognization', minArgs: 1 },
    'SetVolume': { cmd: 'SetVolume', minArgs: 1 },

    // ==================
    // Station
    // ==================
    'AirDryingStart': { specialLogic: true },
    'AirDryingStop': { specialLogic: true },
    'Drying': { specialLogic: true },
    'EmptyDustBin': { specialLogic: true },
    'EmptySuctionStation': { specialLogic: true },
    'GetAirDrying': { specialLogic: true },
    'GetDryingDuration': { cmd: 'GetDryingDuration' },
    'GetStationInfo': { cmd: 'GetStationInfo' },
    'GetStationState': { cmd: 'GetStationState' },
    'GetWashInfo': { cmd: 'GetWashInterval' },
    'GetWashInterval': { cmd: 'GetWashInterval' },
    'SetAirDrying': { specialLogic: true },
    'SetDryingDuration': { cmd: 'SetDryingDuration', minArgs: 1 },
    'SetWashInfo': { cmd: 'SetWashInfo', minArgs: 1 },
    'SetWashInterval': { specialLogic: true },
    'StationAction': { cmd: 'StationAction', minArgs: 1 },
    'Washing': { cmd: 'Washing', minArgs: 1 },
    'WashingStart': { cmd: 'Washing', fixedArgs: ['start'] },
    'WashingStop': { cmd: 'Washing', fixedArgs: ['stop'] },

    // ==================
    // Sweep / Mop Mode
    // ==================
    'DisableBorderSpin': { cmd: 'SetBorderSpin', fixedArgs: [0] },
    'DisableMopOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [0] },
    'DisableSweepOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [0] },
    'EnableBorderSpin': { cmd: 'SetBorderSpin', fixedArgs: [1] },
    'EnableMopOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [1] },
    'EnableSweepOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [1] },
    'GetBorderSpin': { cmd: 'GetBorderSpin' },
    'GetCustomAreaMode': { cmd: 'GetCustomAreaMode' },
    'GetMopOnlyMode': { cmd: 'GetSweepMode' },
    'GetSweepMode': { cmd: 'GetCustomAreaMode' },
    'GetSweepOnlyMode': { cmd: 'GetSweepMode' },
    'GetWorkMode': { cmd: 'GetWorkMode' },
    'SetBorderSpin': { cmd: 'SetBorderSpin', minArgs: 1 },
    'SetCustomAreaMode': { cmd: 'SetCustomAreaMode', minArgs: 1 },
    'SetMopOnlyMode': { cmd: 'SetSweepMode', minArgs: 1 },
    'SetSweepMode': { cmd: 'SetCustomAreaMode', minArgs: 1 },
    'SetSweepOnlyMode': { cmd: 'SetSweepMode', minArgs: 1 },

    // ==================
    // Voice Assistant
    // ==================
    'DisableVoiceAssistant': { cmd: 'SetVoiceAssistantState', fixedArgs: [0] },
    'EnableVoiceAssistant': { cmd: 'SetVoiceAssistantState', fixedArgs: [1] },
    'GetVoiceAssistantState': { cmd: 'GetVoiceAssistantState' },
    'SetVoiceAssistantState': { cmd: 'SetVoiceAssistantState', minArgs: 1 },

    // ==================
    // Map
    // ==================
    'AddVirtualBoundary': { specialLogic: true },
    'BackupMap': { specialLogic: true },
    'ClearMap': { cmd: 'ClearMap' },
    'DeleteVirtualBoundary': { specialLogic: true },
    'GetAIMap': { cmd: 'GetAIMap' },
    'GetCachedMapInfo': { cmd: 'GetCachedMapInfo' },
    'GetMajorMap': { cmd: 'GetMajorMap' },
    'getmapimage': { specialLogic: true },
    'GetMapInfo': { specialLogic: true },
    'GetMapInfo_V2': { specialLogic: true },
    'GetMaps': { specialLogic: true },
    'GetMapSet': { cmd: 'GetMapSet', minArgs: 1 },
    'GetMapSet_V2': { specialLogic: true },
    'GetMapState': { cmd: 'GetMapState' },
    'GetMapSubSet': { cmd: 'GetMapSubSet', minArgs: 2 },
    'GetMapTrace': { cmd: 'GetMapTrace' },
    'GetMinorMap': { cmd: 'GetMinorMap', minArgs: 2 },
    'GetMultiMapState': { cmd: 'GetMultiMapState' },
    'GetSpotAreaInfo': { specialLogic: true },
    'GetSpotAreas': { specialLogic: true },
    'GetVirtualBoundaries': { specialLogic: true },
    'GetVirtualBoundaryInfo': { specialLogic: true },
    'MapPoint_V2': { specialLogic: true },
    'RestoreMap': { specialLogic: true },
    'SetMajorMap': { cmd: 'SetMajorMap', minArgs: 1 },
    'SetMapSet_V2': { specialLogic: true },
    'SetRelocationState': { cmd: 'SetRelocationState' },

    // ==================
    // Movement
    // ==================
    'move': { specialLogic: true },
    'MoveBackward': { cmd: 'MoveBackward' },
    'MoveForward': { cmd: 'MoveForward' },
    'MoveLeft': { cmd: 'MoveLeft' },
    'MoveRight': { cmd: 'MoveRight' },
    'MoveTurnAround': { cmd: 'MoveTurnAround' },

    // ==================
    // Water
    // ==================
    'GetWaterBoxInfo': { cmd: 'GetWaterInfo' },
    'GetWaterInfo': { cmd: 'GetWaterInfo' },
    'GetWaterLevel': { cmd: 'GetWaterInfo' },
    'SetWaterInfo': { cmd: 'SetWaterInfo', minArgs: 3 },
    'SetWaterLevel': { specialLogic: true },

    // ==================
    // Misc info
    // ==================
    'DisableAIVI': { specialLogic: true },
    'DisableAIVI3D': { specialLogic: true },
    'DisableTrueDetect': { specialLogic: true },
    'EnableAIVI': { specialLogic: true },
    'EnableAIVI3D': { specialLogic: true },
    'EnableTrueDetect': { specialLogic: true },
    'Generic': { specialLogic: true },
    'GetChildLock': { cmd: 'GetChildLock' },
    'GetCleanLogs': { specialLogic: true },
    'GetDrivingWheel': { cmd: 'GetDrivingWheel' },
    'GetEfficiency': { specialLogic: true },
    'GetLifeSpan': { specialLogic: true },
    'GetLiveLaunchPwdState': { cmd: 'GetLiveLaunchPwdState' },
    'GetScene': { cmd: 'GetScene' },
    'GetTrueDetect': { specialLogic: true },
    'PlaySound': { specialLogic: true },
    'ResetLifeSpan': { specialLogic: true },
    'SetAdvancedMode': { cmd: 'SetAdvancedMode', minArgs: 1 },
    'SetAIVI': { specialLogic: true },
    'SetAIVI3D': { specialLogic: true },
    'SetBorderSwitch': { cmd: 'SetBorderSwitch', minArgs: 1 },
    'SetChildLock': { cmd: 'SetChildLock', minArgs: 1 },
    'SetCrossMapBorderWarning': { cmd: 'SetCrossMapBorderWarning', minArgs: 1 },
    'SetCutDirection': { cmd: 'SetCutDirection', minArgs: 1 },
    'SetEfficiencyMode': { cmd: 'SetEfficiencyMode', minArgs: 1 },
    'SetMoveUpWarning': { cmd: 'SetMoveUpWarning', minArgs: 1 },
    'SetMultimapState': { cmd: 'SetMultimapState', minArgs: 1 },
    'SetOta': { cmd: 'SetOta', minArgs: 1 },
    'SetSafeProtect': { cmd: 'SetSafeProtect', minArgs: 1 },
    'SetTrueDetect': { specialLogic: true },
    'SetVoice': { cmd: 'SetVoice', minArgs: 6 },
    'SetWorkMode': { specialLogic: true },

    // ==================
    // Purification (Airbot Z1)
    // ==================
    'BasicPurification': { cmd: 'BasicPurification' },
    'GetAirbotAutoModel': { cmd: 'GetAirbotAutoModel' },
    'GetAirQuality': { cmd: 'GetAirQuality' },
    'GetAngleFollow': { cmd: 'GetAngleFollow' },
    'GetAreaPoint': { cmd: 'GetAreaPoint', minArgs: 1 },
    'GetAtmoLight': { cmd: 'GetAtmoLight' },
    'GetAtmoVolume': { cmd: 'GetAtmoVolume' },
    'GetBlueSpeaker': { cmd: 'GetBlueSpeaker' },
    'GetHumanoidFollow': { cmd: 'GetHumanoidFollow' },
    'GetJCYAirQuality': { cmd: 'GetJCYAirQuality' },
    'GetMapTrace_V2': { cmd: 'GetMapTrace_V2', minArgs: 1 },
    'GetMic': { cmd: 'GetMic' },
    'GetMonitorAirState': { cmd: 'GetMonitorAirState' },
    'GetThreeModule': { cmd: 'GetThreeModule' },
    'GetThreeModuleStatus': { cmd: 'GetThreeModuleStatus' },
    'GetVoiceSimple': { cmd: 'GetVoiceSimple' },
    'MobilePurification': { cmd: 'MobilePurification' },
    'SetAirbotAutoModel': { cmd: 'SetAirbotAutoModel', minArgs: 3 },
    'SetAngleFollow': { cmd: 'SetAngleFollow', minArgs: 1 },
    'SetAtmolight': { cmd: 'SetAtmoLight', minArgs: 1 },
    'SetAtmovolume': { cmd: 'SetAtmoVolume', minArgs: 1 },
    'SetBluespeaker': { cmd: 'SetBlueSpeaker', minArgs: 1 },
    'SetFanspeed': { cmd: 'SetFanSpeed', minArgs: 1 },
    'SetFreshenerLevel': { cmd: 'SetFreshenerLevel', minArgs: 2 },
    'SetHumidifierLevel': { cmd: 'SetHumidifierLevel', minArgs: 2 },
    'SetMic': { cmd: 'SetMic', minArgs: 1 },
    'SetMonitorAirState': { cmd: 'SetMonitorAirState', minArgs: 1 },
    'SetThreeModule': { cmd: 'SetThreeModule', minArgs: 3 },
    'SetUVCleaner': { cmd: 'SetUVCleaner', minArgs: 1 },
    'SetVoicesimple': { cmd: 'SetVoiceSimple', minArgs: 1 },
    'SinglePoint_V2': { cmd: 'SinglePoint_V2', minArgs: 1 },
    'SpotPurification': { cmd: 'SpotPurification', minArgs: 1 },
};

// Build a combined object for export that includes both CamelCase and lowercased keys.
const EXPORTED_REGISTRY = {};
for (const key in COMMAND_REGISTRY) {
    EXPORTED_REGISTRY[key] = COMMAND_REGISTRY[key];
    EXPORTED_REGISTRY[key.toLowerCase()] = COMMAND_REGISTRY[key];
}

module.exports = EXPORTED_REGISTRY;
