'use strict';

/**
 * Data-driven command registry for trivial command mappings.
 *
 * Keys in `COMMAND_REGISTRY` are the command names. The exported object
 * includes both original and lowercased keys for lookup.
 * Values:
 *   - `className` {string}   Name of the VacBotCommand class to instantiate
 *   - `minArgs`   {number}   Minimum number of args required (optional, default 0)
 *   - `fixedArgs` {Array}    Fixed arguments to pass instead of user args (optional)
 *   - `aliases`   {string[]} Additional command names that map to the same entry
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
    'CleanArea': { className: 'CleanArea', minArgs: 2 },
    'CleanArea_V2': { className: 'CleanArea_V2', minArgs: 2 },
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
    'GetBreakpoint': { className: 'GetContinuousCleaning', expectedEvent: 'ContinuousCleaningEnabled' },
    'GetContinuousCleaning': { className: 'GetContinuousCleaning', expectedEvent: 'ContinuousCleaningEnabled' },
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
    'GetAdvancedMode': { className: 'GetAdvancedMode', expectedEvent: 'AdvancedMode' },
    'GetAICleanItemState': { className: 'GetAICleanItemState', expectedEvent: 'AICleanItemState' },
    'GetAutoEmpty': { className: 'GetAutoEmpty', expectedEvent: 'AutoEmpty' },
    'GetAutonomousClean': { className: 'GetAutonomousClean', expectedEvent: 'AutonomousClean' },
    'GetBatteryState': { className: 'GetBatteryState', expectedEvent: 'BatteryInfo' },
    'GetBorderSwitch': { className: 'GetBorderSwitch', expectedEvent: 'BorderSwitch' },
    'GetCarpetAutoFanBoost': { className: 'GetCarpetAutoFanBoost', expectedEvent: 'CarpetPressure' },
    'GetCarpetInfo': { className: 'GetCarpetInfo', expectedEvent: 'CarpetInfo' },
    'GetCarpetPressure': { className: 'GetCarpetPressure', expectedEvent: 'CarpetPressure' },
    'GetChargeState': { className: 'GetChargeState', expectedEvent: 'ChargeState' },
    'GetCleanCount': { className: 'GetCleanCount', expectedEvent: 'CleanCount' },
    'GetCleanInfo': { className: 'GetCleanState', expectedEvent: 'CleanReport' },
    'GetCleanInfoV2': { className: 'GetCleanInfoV2', expectedEvent: 'CleanReport' },
    'GetCleanPreference': { className: 'GetCleanPreference', expectedEvent: 'CleanPreference' },
    'GetCleanSpeed': { className: 'GetCleanSpeed', expectedEvent: 'CleanSpeed' },
    'GetCleanState': { className: 'GetCleanState', expectedEvent: 'CleanReport' },
    'GetCleanState_V2': { className: 'GetCleanState_V2', expectedEvent: 'CleanReport' },
    'GetCleanSum': { className: 'GetCleanSum', expectedEvent: 'CleanSum' },
    'GetCrossMapBorderWarning': { className: 'GetCrossMapBorderWarning', expectedEvent: 'CrossMapBorderWarning' },
    'GetCutDirection': { className: 'GetCutDirection', expectedEvent: 'CutDirection' },
    'GetDoNotDisturb': { className: 'GetDoNotDisturb', expectedEvent: 'DoNotDisturbEnabled' },
    'GetDusterRemind': { className: 'GetDusterRemind', expectedEvent: 'DusterRemind' },
    'GetError': { className: 'GetError', expectedEvent: 'Error' },
    'GetFanSpeed': { className: 'GetFanSpeed', expectedEvent: 'FanSpeed' },
    'GetMoveUpWarning': { className: 'GetMoveUpWarning', expectedEvent: 'MoveupWarning' },
    'GetNetInfo': { className: 'GetNetInfo', expectedEvent: 'NetworkInfo' },
    'GetNetInfoLegacy': { className: 'GetNetInfoLegacy', expectedEvent: 'NetworkInfo' },
    'GetOta': { className: 'GetOta', expectedEvent: 'Ota' },
    'GetPosition': { className: 'GetPosition', expectedEvent: 'Position' },
    'GetQuickCommand': { className: 'GetQuickCommand', minArgs: 1, expectedEvent: 'CustomizedScenarioCleaning' },
    'GetRecognization': { className: 'GetRecognization', expectedEvent: 'TrueDetect' },
    'GetRelocationState': { className: 'GetRelocationState', expectedEvent: 'RelocationState' },
    'GetSafeProtect': { className: 'GetSafeProtect', expectedEvent: 'SafeProtect' },
    'GetSchedule': { className: 'GetSchedule', expectedEvent: 'Schedule' },
    'GetSchedule_V2': { className: 'GetSchedule_V2', expectedEvent: 'Schedule' },
    'GetSleepStatus': { className: 'GetSleepStatus', expectedEvent: 'SleepStatus' },
    'GetStats': { className: 'GetStats', expectedEvent: 'Stats' },
    'GetTimeZone': { className: 'GetTimeZone', expectedEvent: 'TimeZone' },
    'GetTotalStats': { className: 'GetTotalStats', expectedEvent: 'TotalStats' },
    'GetVoiceLifeRemindState': { className: 'GetVoiceLifeRemindState', expectedEvent: 'VoiceLifeRemindState' },
    'GetVolume': { className: 'GetVolume', expectedEvent: 'Volume' },
    'GetWifiList': { className: 'GetWifiList', expectedEvent: 'WifiList' },
    'GetWorkState': { className: 'GetWorkState', expectedEvent: 'WorkState' },
    'Relocate': { className: 'Relocate' },
    'SetAutoEmpty': { className: 'SetAutoEmpty', minArgs: 1 },
    'SetBlock': { specialLogic: true },
    'SetCarpetAutoFanBoost': { className: 'SetCarpetAutoFanBoost', minArgs: 1 },
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
    'GetDryingDuration': { className: 'GetDryingDuration', expectedEvent: 'DryingDuration' },
    'GetStationInfo': { className: 'GetStationInfo', expectedEvent: 'StationInfo' },
    'GetMopAutoWashFrequency': { className: 'GetMopAutoWashFrequency', expectedEvent: 'WashInterval' },
    'GetStationState': { className: 'GetStationState', expectedEvent: 'StationState' },
    'GetWashInfo': { className: 'GetWashInterval', expectedEvent: 'WashInfo' },
    'GetWashInterval': { className: 'GetWashInterval', expectedEvent: 'WashInterval' },
    'SetAirDrying': { specialLogic: true },
    'SetDryingDuration': { className: 'SetDryingDuration', minArgs: 1 },
    'SetMopAutoWashFrequency': { className: 'SetMopAutoWashFrequency', minArgs: 1 },
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
    'GetBorderSpin': { className: 'GetBorderSpin', expectedEvent: 'BorderSpin' },
    'GetCustomAreaMode': { className: 'GetCustomAreaMode', expectedEvent: 'SweepMode' },
    'GetMopOnlyMode': { className: 'GetSweepMode', expectedEvent: 'SweepMode' },
    'GetSweepMode': { className: 'GetCustomAreaMode', expectedEvent: 'SweepMode' },
    'GetSweepOnlyMode': { className: 'GetSweepMode', expectedEvent: 'SweepMode' },
    'GetWorkMode': { className: 'GetWorkMode', expectedEvent: 'WorkMode' },
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
    'GetVoiceAssistantState': { className: 'GetVoiceAssistantState', expectedEvent: 'VoiceAssistantState' },
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

    // ==================
    // Water
    // ==================
    'GetWaterInfo': { className: 'GetWaterInfo', expectedEvent: 'WaterInfo' },
    'GetWaterBoxInfo': { className: 'GetWaterInfo', expectedEvent: 'WaterInfo' }, // deprecated
    'GetWaterLevel': { className: 'GetWaterInfo', expectedEvent: 'WaterInfo' }, // deprecated
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
    'GetChildLock': { className: 'GetChildLock', expectedEvent: 'ChildLock' },
    'GetCleanLogs': { specialLogic: true },
    'GetDrivingWheel': { className: 'GetDrivingWheel', expectedEvent: 'DrivingWheel' },
    'GetEfficiency': { specialLogic: true },
    'GetEfficiencyMode': { className: 'GetEfficiencyMode', expectedEvent: 'Efficiency' },
    'GetLifeSpan': { specialLogic: true },
    'GetLiveLaunchPwdState': { className: 'GetLiveLaunchPwdState', expectedEvent: 'LiveLaunchPwdState' },
    'GetScene': { className: 'GetScene', expectedEvent: 'Scene' },
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
    'GetAirbotAutoModel': { className: 'GetAirbotAutoModel', expectedEvent: 'AirbotAutoModel' },
    'GetAirQuality': { className: 'GetAirQuality', expectedEvent: 'AirQuality' },
    'GetAngleFollow': { className: 'GetAngleFollow', expectedEvent: 'AngleFollow' },
    'GetAreaPoint': { className: 'GetAreaPoint', minArgs: 1, expectedEvent: 'AreaPoint' },
    'GetAtmoLight': { className: 'GetAtmoLight', expectedEvent: 'AtmoLight' },
    'GetAtmoVolume': { className: 'GetAtmoVolume', expectedEvent: 'AtmoVolume' },
    'GetBlueSpeaker': { className: 'GetBlueSpeaker', expectedEvent: 'BlueSpeaker' },
    'GetHumanoidFollow': { className: 'GetHumanoidFollow', expectedEvent: 'HumanoidFollow' },
    'GetJCYAirQuality': { className: 'GetJCYAirQuality', expectedEvent: 'JCYAirQuality' },
    'GetMapTrace_V2': { className: 'GetMapTrace_V2', minArgs: 1 },
    'GetMic': { className: 'GetMic', expectedEvent: 'Mic' },
    'GetMonitorAirState': { className: 'GetMonitorAirState', expectedEvent: 'MonitorAirState' },
    'GetThreeModule': { className: 'GetThreeModule', expectedEvent: 'ThreeModule' },
    'GetThreeModuleStatus': { className: 'GetThreeModuleStatus', expectedEvent: 'ThreeModuleStatus' },
    'GetVoiceSimple': { className: 'GetVoiceSimple', expectedEvent: 'VoiceSimple' },
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
