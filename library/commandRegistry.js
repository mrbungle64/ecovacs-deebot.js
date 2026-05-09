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
    'Clean': { cmd: 'Clean' },
    'Edge': { cmd: 'Edge' },
    'Spot': { cmd: 'Spot' },
    'Charge': { cmd: 'Charge' },
    'HostedCleanMode': { cmd: 'HostedCleanMode' },
    'SetCleanCount': { cmd: 'SetCleanCount', minArgs: 1 },
    'SetCleanPreference': { cmd: 'SetCleanPreference', minArgs: 1 },
    'EnableCleanPreference': { cmd: 'SetCleanPreference', fixedArgs: [1] },
    'DisableCleanPreference': { cmd: 'SetCleanPreference', fixedArgs: [0] },
    'Area_V2': { cmd: 'Area_V2' },
    'SetAutonomousClean': { cmd: 'SetAutonomousClean', minArgs: 1 },

    // ==================
    // Continuous Cleaning
    // ==================
    'GetBreakpoint': { cmd: 'GetContinuousCleaning' },
    'GetContinuousCleaning': { cmd: 'GetContinuousCleaning' },
    'EnableContinuousCleaning': { cmd: 'SetContinuousCleaning', fixedArgs: [1] },
    'DisableContinuousCleaning': { cmd: 'SetContinuousCleaning', fixedArgs: [0] },

    // ==================
    // Info / Status
    // ==================
    'GetAICleanItemState': { cmd: 'GetAICleanItemState' },
    'GetAutonomousClean': { cmd: 'GetAutonomousClean' },
    'GetCleanSum': { cmd: 'GetCleanSum' },
    'GetCleanPreference': { cmd: 'GetCleanPreference' },
    'GetCleanCount': { cmd: 'GetCleanCount' },
    'GetChargeState': { cmd: 'GetChargeState' },
    'GetCleanState': { cmd: 'GetCleanState' },
    'GetCleanInfo': { cmd: 'GetCleanState' },
    'GetCleanSpeed': { cmd: 'GetCleanSpeed' },
    'GetCleanState_V2': { cmd: 'GetCleanState_V2' },
    'GetBatteryState': { cmd: 'GetBatteryState' },
    'GetNetInfo': { cmd: 'GetNetInfo' },
    'GetSleepStatus': { cmd: 'GetSleepStatus' },
    'GetPosition': { cmd: 'GetPosition' },
    'GetSchedule': { cmd: 'GetSchedule' },
    'GetSchedule_V2': { cmd: 'GetSchedule_V2' },
    'GetError': { cmd: 'GetError' },
    'GetVolume': { cmd: 'GetVolume' },
    'SetVolume': { cmd: 'SetVolume', minArgs: 1 },
    'GetAdvancedMode': { cmd: 'GetAdvancedMode' },
    'EnableAdvancedMode': { cmd: 'SetAdvancedMode', fixedArgs: [1] },
    'DisableAdvancedMode': { cmd: 'SetAdvancedMode', fixedArgs: [0] },
    'GetRecognization': { cmd: 'GetRecognization' },
    'SetRecognization': { cmd: 'SetRecognization', minArgs: 1 },
    'GetDoNotDisturb': { cmd: 'GetDoNotDisturb' },
    'GetAutoEmpty': { cmd: 'GetAutoEmpty' },
    'SetAutoEmpty': { cmd: 'SetAutoEmpty', minArgs: 1 },
    'EnableAutoEmpty': { cmd: 'SetAutoEmpty', fixedArgs: [1] },
    'DisableAutoEmpty': { cmd: 'SetAutoEmpty', fixedArgs: [0] },
    'GetDusterRemind': { cmd: 'GetDusterRemind' },
    'SetDusterRemind': { cmd: 'SetDusterRemind', minArgs: 1 },
    'GetCarpetPressure': { cmd: 'GetCarpetPressure' },
    'SetCarpetPressure': { cmd: 'SetCarpetPressure', minArgs: 1 },
    'EnableCarpetPressure': { cmd: 'SetCarpetPressure', fixedArgs: [1] },
    'DisableCarpetPressure': { cmd: 'SetCarpetPressure', fixedArgs: [0] },
    'GetCarpetInfo': { cmd: 'GetCarpetInfo' },
    'SetCarpetInfo': { cmd: 'SetCarpetInfo', minArgs: 1 },
    'Relocate': { cmd: 'Relocate' },
    'GetTimeZone': { cmd: 'GetTimeZone' },
    'GetOta': { cmd: 'GetOta' },
    'GetRelocationState': { cmd: 'GetRelocationState' },
    'GetTotalStats': { cmd: 'GetTotalStats' },
    'GetWifiList': { cmd: 'GetWifiList' },
    'GetVoiceLifeRemindState': { cmd: 'GetVoiceLifeRemindState' },
    'GetQuickCommand': { cmd: 'GetQuickCommand', minArgs: 1 },

    // ==================
    // Station
    // ==================
    'GetStationState': { cmd: 'GetStationState' },
    'GetStationInfo': { cmd: 'GetStationInfo' },
    'GetWashInfo': { cmd: 'GetWashInterval' },
    'GetWashInterval': { cmd: 'GetWashInterval' },
    'SetWashInfo': { cmd: 'SetWashInfo', minArgs: 1 },
    'GetDryingDuration': { cmd: 'GetDryingDuration' },
    'SetDryingDuration': { cmd: 'SetDryingDuration', minArgs: 1 },
    'WashingStart': { cmd: 'Washing', fixedArgs: ['start'] },
    'WashingStop': { cmd: 'Washing', fixedArgs: ['stop'] },
    'Washing': { cmd: 'Washing', minArgs: 1 },

    // ==================
    // Sweep / Mop Mode
    // ==================
    'GetMopOnlyMode': { cmd: 'GetSweepMode' },
    'GetSweepOnlyMode': { cmd: 'GetSweepMode' },
    'EnableMopOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [1] },
    'EnableSweepOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [1] },
    'DisableMopOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [0] },
    'DisableSweepOnlyMode': { cmd: 'SetSweepMode', fixedArgs: [0] },
    'SetMopOnlyMode': { cmd: 'SetSweepMode', minArgs: 1 },
    'SetSweepOnlyMode': { cmd: 'SetSweepMode', minArgs: 1 },
    'GetSweepMode': { cmd: 'GetCustomAreaMode' },
    'GetCustomAreaMode': { cmd: 'GetCustomAreaMode' },
    'SetSweepMode': { cmd: 'SetCustomAreaMode', minArgs: 1 },
    'SetCustomAreaMode': { cmd: 'SetCustomAreaMode', minArgs: 1 },
    'GetBorderSpin': { cmd: 'GetBorderSpin' },
    'SetBorderSpin': { cmd: 'SetBorderSpin', minArgs: 1 },
    'EnableBorderSpin': { cmd: 'SetBorderSpin', fixedArgs: [1] },
    'DisableBorderSpin': { cmd: 'SetBorderSpin', fixedArgs: [0] },
    'GetWorkMode': { cmd: 'GetWorkMode' },

    // ==================
    // Voice Assistant
    // ==================
    'GetVoiceAssistantState': { cmd: 'GetVoiceAssistantState' },
    'SetVoiceAssistantState': { cmd: 'SetVoiceAssistantState', minArgs: 1 },
    'EnableVoiceAssistant': { cmd: 'SetVoiceAssistantState', fixedArgs: [1] },
    'DisableVoiceAssistant': { cmd: 'SetVoiceAssistantState', fixedArgs: [0] },

    // ==================
    // Map
    // ==================
    'GetMapState': { cmd: 'GetMapState' },
    'GetMultiMapState': { cmd: 'GetMultiMapState' },
    'GetMajorMap': { cmd: 'GetMajorMap' },
    'GetAIMap': { cmd: 'GetAIMap' },

    // ==================
    // Movement
    // ==================
    'MoveBackward': { cmd: 'MoveBackward' },
    'MoveForward': { cmd: 'MoveForward' },
    'MoveLeft': { cmd: 'MoveLeft' },
    'MoveRight': { cmd: 'MoveRight' },
    'MoveTurnAround': { cmd: 'MoveTurnAround' },

    // ==================
    // Water
    // ==================
    'GetWaterLevel': { cmd: 'GetWaterInfo' },
    'GetWaterBoxInfo': { cmd: 'GetWaterInfo' },
    'GetWaterInfo': { cmd: 'GetWaterInfo' },

    // ==================
    // Misc info
    // ==================
    'GetLiveLaunchPwdState': { cmd: 'GetLiveLaunchPwdState' },
    'GetDrivingWheel': { cmd: 'GetDrivingWheel' },
    'GetChildLock': { cmd: 'GetChildLock' },
    'SetChildLock': { cmd: 'SetChildLock', minArgs: 1 },
    'GetScene': { cmd: 'GetScene' },
    'SetVoice': { cmd: 'SetVoice', minArgs: 6 },

    // ==================
    // Purification (Airbot Z1)
    // ==================
    'BasicPurification': { cmd: 'BasicPurification' },
    'MobilePurification': { cmd: 'MobilePurification' },
    'SpotPurification': { cmd: 'SpotPurification', minArgs: 1 },
    'GetAirQuality': { cmd: 'GetAirQuality' },
    'GetJCYAirQuality': { cmd: 'GetJCYAirQuality' },
    'GetThreeModuleStatus': { cmd: 'GetThreeModuleStatus' },
    'GetThreeModule': { cmd: 'GetThreeModule' },
    'SetThreeModule': { cmd: 'SetThreeModule', minArgs: 3 },
    'SetFreshenerLevel': { cmd: 'SetFreshenerLevel', minArgs: 2 },
    'SetHumidifierLevel': { cmd: 'SetHumidifierLevel', minArgs: 2 },
    'SetUVCleaner': { cmd: 'SetUVCleaner', minArgs: 1 },
    'SetFanspeed': { cmd: 'SetFanSpeed', minArgs: 1 },
    'GetBlueSpeaker': { cmd: 'GetBlueSpeaker' },
    'SetBluespeaker': { cmd: 'SetBlueSpeaker', minArgs: 1 },
    'GetVoiceSimple': { cmd: 'GetVoiceSimple' },
    'SetVoicesimple': { cmd: 'SetVoiceSimple', minArgs: 1 },
    'GetMonitorAirState': { cmd: 'GetMonitorAirState' },
    'SetMonitorAirState': { cmd: 'SetMonitorAirState', minArgs: 1 },
    'GetAngleFollow': { cmd: 'GetAngleFollow' },
    'SetAngleFollow': { cmd: 'SetAngleFollow', minArgs: 1 },
    'GetMic': { cmd: 'GetMic' },
    'SetMic': { cmd: 'SetMic', minArgs: 1 },
    'GetAirbotAutoModel': { cmd: 'GetAirbotAutoModel' },
    'SetAirbotAutoModel': { cmd: 'SetAirbotAutoModel', minArgs: 3 },
    'GetAtmoVolume': { cmd: 'GetAtmoVolume' },
    'SetAtmovolume': { cmd: 'SetAtmoVolume', minArgs: 1 },
    'GetAtmoLight': { cmd: 'GetAtmoLight' },
    'SetAtmolight': { cmd: 'SetAtmoLight', minArgs: 1 },
    'GetHumanoidFollow': { cmd: 'GetHumanoidFollow' },
    'SinglePoint_V2': { cmd: 'SinglePoint_V2', minArgs: 1 },
    'GetMapTrace_V2': { cmd: 'GetMapTrace_V2', minArgs: 1 },
    'GetAreaPoint': { cmd: 'GetAreaPoint', minArgs: 1 },
};

// Build a combined object for export that includes both CamelCase and lowercased keys.
const EXPORTED_REGISTRY = {};
for (const key in COMMAND_REGISTRY) {
    EXPORTED_REGISTRY[key] = COMMAND_REGISTRY[key];
    EXPORTED_REGISTRY[key.toLowerCase()] = COMMAND_REGISTRY[key];
}

module.exports = EXPORTED_REGISTRY;
