'use strict';

/**
 * Data-driven command registry for trivial command mappings.
 *
 * Each key is the **lowercased** command name used in `vacBot.run()`.
 * Values:
 *   - `className` {string}   Name of the VacBotCommand class to instantiate
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
    'Area_V2': { className: 'Area_V2' },
    'Charge': { className: 'Charge' },
    'Clean': { className: 'Clean' },
    'Clean_V2': { specialLogic: true },
    'CustomArea': { specialLogic: true },
    'CustomArea_V2': { specialLogic: true },
    'DisableCleanPreference': { className: 'SetCleanPreference', fixedArgs: [0] },
    'Edge': { className: 'Edge' },
    'EnableCleanPreference': { className: 'SetCleanPreference', fixedArgs: [1] },
    'FreeClean': { specialLogic: true },
    'GoToPosition': { specialLogic: true },
    'HostedCleanMode': { className: 'HostedCleanMode' },
    'Pause': { specialLogic: true },
    'Resume': { specialLogic: true },
    'SetAutonomousClean': { className: 'SetAutonomousClean', minArgs: 1 },
    'SetCleanCount': { className: 'SetCleanCount', minArgs: 1 },
    'SetCleanPreference': { className: 'SetCleanPreference', minArgs: 1 },
    'SetCleanSpeed': { specialLogic: true },
    'Spot': { className: 'Spot' },
    'SpotArea': { specialLogic: true },
    'SpotArea_V2': { specialLogic: true },
    'Stop': { specialLogic: true },

    // ==================
    // Continuous Cleaning
    // ==================
    'DisableContinuousCleaning': { className: 'SetContinuousCleaning', fixedArgs: [0] },
    'EnableContinuousCleaning': { className: 'SetContinuousCleaning', fixedArgs: [1] },
    'GetBreakpoint': { className: 'GetContinuousCleaning' },
    'GetContinuousCleaning': { className: 'GetContinuousCleaning' },
    'SetContinuousCleaning': { className: 'SetContinuousCleaning', minArgs: 1 },

    // ==================
    // Info / Status
    // ==================
    'DisableAdvancedMode': { className: 'SetAdvancedMode', fixedArgs: [0] },
    'DisableAutoEmpty': { className: 'SetAutoEmpty', fixedArgs: [0] },
    'DisableCarpetPressure': { className: 'SetCarpetPressure', fixedArgs: [0] },
    'DisableDoNotDisturb': { specialLogic: true },
    'EnableAdvancedMode': { className: 'SetAdvancedMode', fixedArgs: [1] },
    'EnableAutoEmpty': { className: 'SetAutoEmpty', fixedArgs: [1] },
    'EnableCarpetPressure': { className: 'SetCarpetPressure', fixedArgs: [1] },
    'EnableDoNotDisturb': { specialLogic: true },
    'GetAdvancedMode': { className: 'GetAdvancedMode' },
    'GetAICleanItemState': { className: 'GetAICleanItemState' },
    'GetAutoEmpty': { className: 'GetAutoEmpty' },
    'GetAutonomousClean': { className: 'GetAutonomousClean' },
    'GetBatteryState': { className: 'GetBatteryState' },
    'GetBorderSwitch': { className: 'GetBorderSwitch' },
    'GetCarpetInfo': { className: 'GetCarpetInfo' },
    'GetCarpetPressure': { className: 'GetCarpetPressure' },
    'GetChargeState': { className: 'GetChargeState' },
    'GetCleanCount': { className: 'GetCleanCount' },
    'GetCleanInfo': { className: 'GetCleanState' },
    'GetCleanPreference': { className: 'GetCleanPreference' },
    'GetCleanSpeed': { className: 'GetCleanSpeed' },
    'GetCleanState': { className: 'GetCleanState' },
    'GetCleanState_V2': { className: 'GetCleanState_V2' },
    'GetCleanSum': { className: 'GetCleanSum' },
    'GetCrossMapBorderWarning': { className: 'GetCrossMapBorderWarning' },
    'GetCutDirection': { className: 'GetCutDirection' },
    'GetDoNotDisturb': { className: 'GetDoNotDisturb' },
    'GetDusterRemind': { className: 'GetDusterRemind' },
    'GetError': { className: 'GetError' },
    'GetFanSpeed': { className: 'GetFanSpeed' },
    'GetMoveUpWarning': { className: 'GetMoveUpWarning' },
    'GetNetInfo': { className: 'GetNetInfo' },
    'GetNetInfoLegacy': { className: 'GetNetInfoLegacy' },
    'GetOta': { className: 'GetOta' },
    'GetPosition': { className: 'GetPosition' },
    'GetQuickCommand': { className: 'GetQuickCommand', minArgs: 1 },
    'GetRecognization': { className: 'GetRecognization' },
    'GetRelocationState': { className: 'GetRelocationState' },
    'GetSafeProtect': { className: 'GetSafeProtect' },
    'GetSchedule': { className: 'GetSchedule' },
    'GetSchedule_V2': { className: 'GetSchedule_V2' },
    'GetSleepStatus': { className: 'GetSleepStatus' },
    'GetStats': { className: 'GetStats' },
    'GetTimeZone': { className: 'GetTimeZone' },
    'GetTotalStats': { className: 'GetTotalStats' },
    'GetVoiceLifeRemindState': { className: 'GetVoiceLifeRemindState' },
    'GetVolume': { className: 'GetVolume' },
    'GetWifiList': { className: 'GetWifiList' },
    'GetWorkState': { className: 'GetWorkState' },
    'Relocate': { className: 'Relocate' },
    'SetAutoEmpty': { className: 'SetAutoEmpty', minArgs: 1 },
    'SetBlock': { specialLogic: true },
    'SetCarpetInfo': { className: 'SetCarpetInfo', minArgs: 1 },
    'SetCarpetPressure': { className: 'SetCarpetPressure', minArgs: 1 },
    'SetDoNotDisturb': { specialLogic: true },
    'SetDusterRemind': { className: 'SetDusterRemind', minArgs: 1 },
    'SetRecognization': { className: 'SetRecognization', minArgs: 1 },
    'SetVolume': { className: 'SetVolume', minArgs: 1 },

    // ==================
    // Station
    // ==================
    'AirDryingStart': { specialLogic: true },
    'AirDryingStop': { specialLogic: true },
    'Drying': { specialLogic: true },
    'EmptyDustBin': { specialLogic: true },
    'EmptySuctionStation': { specialLogic: true },
    'GetAirDrying': { specialLogic: true },
    'GetDryingDuration': { className: 'GetDryingDuration' },
    'GetStationInfo': { className: 'GetStationInfo' },
    'GetStationState': { className: 'GetStationState' },
    'GetWashInfo': { className: 'GetWashInterval' },
    'GetWashInterval': { className: 'GetWashInterval' },
    'SetAirDrying': { specialLogic: true },
    'SetDryingDuration': { className: 'SetDryingDuration', minArgs: 1 },
    'SetWashInfo': { className: 'SetWashInfo', minArgs: 1 },
    'SetWashInterval': { specialLogic: true },
    'StationAction': { className: 'StationAction', minArgs: 1 },
    'Washing': { className: 'Washing', minArgs: 1 },
    'WashingStart': { className: 'Washing', fixedArgs: ['start'] },
    'WashingStop': { className: 'Washing', fixedArgs: ['stop'] },

    // ==================
    // Sweep / Mop Mode
    // ==================
    'DisableBorderSpin': { className: 'SetBorderSpin', fixedArgs: [0] },
    'DisableMopOnlyMode': { className: 'SetSweepMode', fixedArgs: [0] },
    'DisableSweepOnlyMode': { className: 'SetSweepMode', fixedArgs: [0] },
    'EnableBorderSpin': { className: 'SetBorderSpin', fixedArgs: [1] },
    'EnableMopOnlyMode': { className: 'SetSweepMode', fixedArgs: [1] },
    'EnableSweepOnlyMode': { className: 'SetSweepMode', fixedArgs: [1] },
    'GetBorderSpin': { className: 'GetBorderSpin' },
    'GetCustomAreaMode': { className: 'GetCustomAreaMode' },
    'GetMopOnlyMode': { className: 'GetSweepMode' },
    'GetSweepMode': { className: 'GetCustomAreaMode' },
    'GetSweepOnlyMode': { className: 'GetSweepMode' },
    'GetWorkMode': { className: 'GetWorkMode' },
    'SetBorderSpin': { className: 'SetBorderSpin', minArgs: 1 },
    'SetCustomAreaMode': { className: 'SetCustomAreaMode', minArgs: 1 },
    'SetMopOnlyMode': { className: 'SetSweepMode', minArgs: 1 },
    'SetSweepMode': { className: 'SetCustomAreaMode', minArgs: 1 },
    'SetSweepOnlyMode': { className: 'SetSweepMode', minArgs: 1 },

    // ==================
    // Voice Assistant
    // ==================
    'DisableVoiceAssistant': { className: 'SetVoiceAssistantState', fixedArgs: [0] },
    'EnableVoiceAssistant': { className: 'SetVoiceAssistantState', fixedArgs: [1] },
    'GetVoiceAssistantState': { className: 'GetVoiceAssistantState' },
    'SetVoiceAssistantState': { className: 'SetVoiceAssistantState', minArgs: 1 },

    // ==================
    // Map
    // ==================
    'AddVirtualBoundary': { specialLogic: true },
    'BackupMap': { specialLogic: true },
    'ClearMap': { className: 'ClearMap' },
    'DeleteVirtualBoundary': { specialLogic: true },
    'GetAIMap': { className: 'GetAIMap' },
    'GetCachedMapInfo': { specialLogic: true },
    'GetMajorMap': { className: 'GetMajorMap' },
    'GetMapImage': { specialLogic: true },
    'GetMapInfo': { specialLogic: true },
    'GetMapInfo_V2': { specialLogic: true },
    'GetMaps': { specialLogic: true },
    'GetMapSet': { className: 'GetMapSet', minArgs: 1 },
    'GetMapSet_V2': { specialLogic: true },
    'GetMapState': { className: 'GetMapState' },
    'GetMapSubSet': { className: 'GetMapSubSet', minArgs: 2 },
    'GetMapTrace': { className: 'GetMapTrace' },
    'GetMinorMap': { className: 'GetMinorMap', minArgs: 2 },
    'GetMultiMapState': { className: 'GetMultiMapState' },
    'GetSpotAreaInfo': { specialLogic: true },
    'GetSpotAreas': { specialLogic: true },
    'GetVirtualBoundaries': { specialLogic: true },
    'GetVirtualBoundaryInfo': { specialLogic: true },
    'MapPoint_V2': { specialLogic: true },
    'RestoreMap': { specialLogic: true },
    'SetMajorMap': { className: 'SetMajorMap', minArgs: 1 },
    'SetMapSet_V2': { specialLogic: true },
    'SetRelocationState': { className: 'SetRelocationState' },

    // ==================
    // Movement
    // ==================
    'Move': { specialLogic: true },
    'MoveBackward': { className: 'MoveBackward' },
    'MoveForward': { className: 'MoveForward' },
    'MoveLeft': { className: 'MoveLeft' },
    'MoveRight': { className: 'MoveRight' },
    'MoveTurnAround': { className: 'MoveTurnAround' },

    // ==================
    // Water
    // ==================
    'GetWaterBoxInfo': { className: 'GetWaterInfo' },
    'GetWaterInfo': { className: 'GetWaterInfo' },
    'GetWaterLevel': { className: 'GetWaterInfo' },
    'SetWaterInfo': { className: 'SetWaterInfo', minArgs: 3 },
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
    'GetChildLock': { className: 'GetChildLock' },
    'GetCleanLogs': { specialLogic: true },
    'GetDrivingWheel': { className: 'GetDrivingWheel' },
    'GetEfficiency': { specialLogic: true },
    'GetLifeSpan': { specialLogic: true },
    'GetLiveLaunchPwdState': { className: 'GetLiveLaunchPwdState' },
    'GetScene': { className: 'GetScene' },
    'GetTrueDetect': { specialLogic: true },
    'PlaySound': { specialLogic: true },
    'ResetLifeSpan': { specialLogic: true },
    'SetAdvancedMode': { className: 'SetAdvancedMode', minArgs: 1 },
    'SetAIVI': { specialLogic: true },
    'SetAIVI3D': { specialLogic: true },
    'SetBorderSwitch': { className: 'SetBorderSwitch', minArgs: 1 },
    'SetChildLock': { className: 'SetChildLock', minArgs: 1 },
    'SetCrossMapBorderWarning': { className: 'SetCrossMapBorderWarning', minArgs: 1 },
    'SetCutDirection': { className: 'SetCutDirection', minArgs: 1 },
    'SetEfficiencyMode': { className: 'SetEfficiencyMode', minArgs: 1 },
    'SetMoveUpWarning': { className: 'SetMoveUpWarning', minArgs: 1 },
    'SetMultimapState': { className: 'SetMultimapState', minArgs: 1 },
    'SetOta': { className: 'SetOta', minArgs: 1 },
    'SetSafeProtect': { className: 'SetSafeProtect', minArgs: 1 },
    'SetTrueDetect': { specialLogic: true },
    'SetVoice': { className: 'SetVoice', minArgs: 6 },
    'SetWorkMode': { specialLogic: true },

    // ==================
    // Purification (Airbot Z1)
    // ==================
    'BasicPurification': { className: 'BasicPurification' },
    'GetAirbotAutoModel': { className: 'GetAirbotAutoModel' },
    'GetAirQuality': { className: 'GetAirQuality' },
    'GetAngleFollow': { className: 'GetAngleFollow' },
    'GetAreaPoint': { className: 'GetAreaPoint', minArgs: 1 },
    'GetAtmoLight': { className: 'GetAtmoLight' },
    'GetAtmoVolume': { className: 'GetAtmoVolume' },
    'GetBlueSpeaker': { className: 'GetBlueSpeaker' },
    'GetHumanoidFollow': { className: 'GetHumanoidFollow' },
    'GetJCYAirQuality': { className: 'GetJCYAirQuality' },
    'GetMapTrace_V2': { className: 'GetMapTrace_V2', minArgs: 1 },
    'GetMic': { className: 'GetMic' },
    'GetMonitorAirState': { className: 'GetMonitorAirState' },
    'GetThreeModule': { className: 'GetThreeModule' },
    'GetThreeModuleStatus': { className: 'GetThreeModuleStatus' },
    'GetVoiceSimple': { className: 'GetVoiceSimple' },
    'MobilePurification': { className: 'MobilePurification' },
    'SetAirbotAutoModel': { className: 'SetAirbotAutoModel', minArgs: 3 },
    'SetAngleFollow': { className: 'SetAngleFollow', minArgs: 1 },
    'SetAtmoLight': { className: 'SetAtmoLight', minArgs: 1 },
    'SetAtmoVolume': { className: 'SetAtmoVolume', minArgs: 1 },
    'SetBlueSpeaker': { className: 'SetBlueSpeaker', minArgs: 1 },
    'SetFanSpeed': { className: 'SetFanSpeed', minArgs: 1 },
    'SetFreshenerLevel': { className: 'SetFreshenerLevel', minArgs: 2 },
    'SetHumidifierLevel': { className: 'SetHumidifierLevel', minArgs: 2 },
    'SetMic': { className: 'SetMic', minArgs: 1 },
    'SetMonitorAirState': { className: 'SetMonitorAirState', minArgs: 1 },
    'SetThreeModule': { className: 'SetThreeModule', minArgs: 3 },
    'SetUVCleaner': { className: 'SetUVCleaner', minArgs: 1 },
    'SetVoiceSimple': { className: 'SetVoiceSimple', minArgs: 1 },
    'SinglePoint_V2': { className: 'SinglePoint_V2', minArgs: 1 },
    'SpotPurification': { className: 'SpotPurification', minArgs: 1 },
};

// Build a combined object for export that includes both CamelCase and lowercased keys.
const EXPORTED_REGISTRY = {};
for (const key in COMMAND_REGISTRY) {
    EXPORTED_REGISTRY[key] = COMMAND_REGISTRY[key];
    EXPORTED_REGISTRY[key.toLowerCase()] = COMMAND_REGISTRY[key];
}

module.exports = EXPORTED_REGISTRY;
