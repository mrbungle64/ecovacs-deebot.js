# API Command Reference for Ecovacs & Yeedi Devices

There are two primary paradigms to run actions on your robot: the legacy event-based model using `device.run(...)` and the modern Promise-based model using `device.runAsync(...)`.

## Transitioning from `run` to `runAsync`

For modern asynchronous code, it is recommended to use `runAsync()` which returns a Promise resolving with normalized, parsed command results.

| Command Type | Legacy Event Pattern (`run`) | Modern Promise Pattern (`runAsync`) |
| --- | --- | --- |
| **Get Commands** (Returns Data) | `device.run("GetBatteryState");`<br>`device.on("BatteryInfo", (res) => { ... });` | `const battery = await device.runAsync("GetBatteryState");`<br>`// => { level: 87, isLow: false }` |
| **Set/Action Commands** (Triggers Action) | `device.run("Stop");`<br>*No return value or event confirmation needed.* | `await device.runAsync("Stop");`<br>`// Resolves immediately on server acknowledgment` |

### Key Migration Example

**Legacy Event-driven code:**
```js
// Call command
device.run("GetCleanState");

// Wait for event to fire elsewhere
device.on("CleanReport", (data) => {
    console.log("Cleaning state is:", data.cleanState);
});
```

**Modern Async/Await code:**
```js
try {
    const cleanState = await device.runAsync("GetCleanState");
    console.log("Cleaning state is:", cleanState.cleanState);
} catch (error) {
    console.error("Failed to retrieve clean state:", error);
}
```

---

## 1. Robot Vacuum Cleaner

### Basic Cleaning Functions

These commands start or configure basic cleaning tasks. Direct JS helper methods are available as of version `0.6.2`.

```js
// Auto Cleaning
device.run("Clean");       // Standard Auto Clean
device.run("Clean_V2");    // Auto Clean for V2/newer models
device.clean();            // JS helper (defaults to "Clean")

// Spot Area Cleaning (cleaning specific mapped rooms)
const areas = "0,7";       // Comma-separated list of spot area IDs as a string
device.run("SpotArea", "start", areas);
device.spotArea(areas);    // JS helper

// Custom Area Cleaning (cleaning user-defined coordinates)
// Format: "x1,y1,x2,y2" forming the bounding box
let boundaryCoordinates = "-3975,2280,-1930,4575"; 
const numberOfCleanings = 1;
device.run("CustomArea", "start", boundaryCoordinates, numberOfCleanings);
device.customArea(boundaryCoordinates, numberOfCleanings); // JS helper
```

### Various Control Commands

```js
// Return to charging station
device.run("Charge");
device.charge();           // JS helper

// Stop current activity
device.run("Stop");
device.stop();             // JS helper

// Pause current activity
device.run("Pause");
device.pause();            // JS helper (accepts optional mode, e.g. "auto")

// Resume paused cleaning
device.run("Resume");
device.resume();           // JS helper
```

### Retrieve Basic States

```js
device.run("GetCleanState");   // Retrieve cleaning status
device.run("GetChargeState");  // Retrieve charging status
device.run("GetBatteryState"); // Retrieve battery percentage
device.run("GetSleepStatus");  // Retrieve sleep/standby mode status
```

### Position & Relocation

```js
device.run("GetPosition");     // Retrieve current coordinates of the vacuum
device.run("Relocate");        // Instruct the robot to perform active relocation/re-localization
```

---

## 2. Advanced Controls & Configurations

### Cleaning Speed (Vacuum Power)

```js
device.run("GetCleanSpeed");   // Retrieve suction power level
// Set suction level. Range: 1-4 (typically: 1=Quiet, 2=Standard, 3=Max, 4=Max+)
device.run("SetCleanSpeed", 2); 
```

### Mopping, Water Level & Border Spin

These control the water box and advanced mopping capabilities.

```js
device.run("GetWaterInfo");   // Retrieve water flow level and water box/mopping plate status
// Adjust water level. Range: 1-4 (1=Low, 2=Medium, 3=High, 4=Ultrahigh)
device.run("SetWaterLevel", 2); 

// Mop border spinning (for devices with rotating mopping pads, e.g. T20, X1, X2, T30)
device.run("GetBorderSpin");    // Get border spin status
device.run("EnableBorderSpin");  // Spin mopping pads closer to walls/edges
device.run("DisableBorderSpin"); // Disable border spin
```

### Cleaning Preferences (Smart Housekeeper / Habits)

```js
device.run("GetCleanPreference"); // Retrieve habit/preference status
device.run("EnableCleanPreference");
device.run("DisableCleanPreference");
```

### Carpet Handling & Pressure Boost

```js
device.run("GetCarpetInfo");       // Retrieve carpet detection status
device.run("GetCarpetPressure");   // Retrieve automatic carpet suction boost status
device.run("EnableCarpetPressure");
device.run("DisableCarpetPressure");
```

---

## 3. Station Commands (OMNI & Auto-Empty)

For models with auto-empty stations or fully automated OMNI wash-and-dry systems (e.g. T10 OMNI, T20 OMNI, X1 OMNI, X2 OMNI, T30 OMNI, X8 OMNI).

```js
// Retrieve station status
device.run("GetStationInfo");      // Station configuration details
device.run("GetStationState");     // Current active state of the station

// Auto-Empty (Dustbin) Controls
device.run("GetAutoEmpty");        // 0 = disabled, 1 = enabled
device.run("SetAutoEmpty", 1);
device.run("EmptyDustBin");        // Manually trigger dustbin suction
device.run("EmptySuctionStation"); // Equivalent alias for EmptyDustBin

// Mop Washing Controls
device.run("WashingStart");        // Start washing mopping pads at the station
device.run("WashingStop");         // Stop washing mopping pads
device.run("Washing", "start");    // Direct command option
device.run("GetWashInterval");     // Retrieve pad wash interval (in minutes or area)
device.run("SetWashInterval", 15); // Adjust wash interval
device.run("GetWashInfo");
device.run("SetWashInfo", 1);

// Mop Drying Controls
device.run("AirDryingStart");      // Start hot/cool air drying of mopping pads
device.run("AirDryingStop");       // Stop drying mopping pads
device.run("GetAirDrying");        // Retrieve current drying state
device.run("GetDryingDuration");   // Retrieve the drying duration configuration
device.run("SetDryingDuration", 4); // Set drying duration (e.g. 2, 3, or 4 hours)
```

---

## 4. Map Data & Virtual Boundaries

> [!WARNING]
> Some advanced map configuration commands are experimental. Always back up map data when executing these commands if your model supports it.

```js
const mapID = '1298761989'; // Example value

// Retrieve maps
device.run("GetCachedMapInfo");
device.run("GetMaps");                 // GetMaps and GetCachedMapInfo are functionally identical

// Retrieve spot areas (rooms) on a map
device.run("GetSpotAreas", mapID);
// Retrieve details of a specific spot area (e.g., room '0')
device.run("GetSpotAreaInfo", mapID, '0');

// Retrieve virtual boundaries (virtual walls / no-mop-zones)
device.run("GetVirtualBoundaries", mapID);
device.run("GetVirtualBoundaryInfo", mapID, '0', 'vw'); // 'vw' = virtual wall, 'mw' = no-mop-zone

// Add a virtual boundary
// boundaryCoordinates are a string representing list of coordinates (x, y pairs forming a polygon)
const coords = "[-1072,-3142,-1072,-4240,1349,-4240,1349,-3142]"; 
device.run("AddVirtualBoundary", mapID, coords, 'vw');

// Delete a virtual boundary
device.run("DeleteVirtualBoundary", mapID, '0', 'vw');

// Backup and Restore map configuration (if supported)
device.run("BackupMap", mapID);
device.run("RestoreMap", mapID, backupID);
```

#### Map Image Retrieval & Outlines

```js
// Retrieve map data combined with map images
device.run("GetMaps", true);          // Request combined map data including images
device.run("GetMaps", true, false);   // Request combined map data without the map image

// Retrieve map image only (e.g. outline or wifi Heat Map)
device.run("GetMapImage", mapID, "outline");
device.run("GetMapImage", mapID, "wifiHeatMap");
```

---

## 5. Voice, Sound & YIKO Assistant

### Voice Reports & Audio Playback

```js
// Play sounds
device.run("PlaySound");       // Plays default startup music chime (soundID = 0)
device.run("PlaySound", 30);   // Play specific sound ID
device.playSound(30);          // JS helper

// Speaker Volume
device.run("GetVolume");
device.run("SetVolume", 7);    // Range: 0-10

// Working Status Voice Report (Enable/Disable robot spoken reports)
device.run("GetVoiceSimple");  // Retrieve status of voice reports
device.run("SetVoiceSimple", 1); // 0 = off (silent), 1 = on
```

### YIKO Voice Assistant (Native AI Control)

For models with built-in YIKO AI voice control (e.g., DEEBOT X1, T10, T20, T30, X2, X8).

```js
device.run("GetVoiceAssistantState"); // Retrieve YIKO assistant status
device.run("EnableVoiceAssistant");   // Enable "Ok YIKO" wake-up detection
device.run("DisableVoiceAssistant");  // Disable "Ok YIKO" wake-up detection
```

---

## 6. Obstacle Detection (AIVI / TrueDetect 3D)

Allows configuring the robot's smart front sensory perception systems (cross-lasers or camera-based AI).

```js
device.run("GetTrueDetect");        // Retrieve the active sensory/obstacle mode status

// Enable obstacle detection
device.run("EnableTrueDetect");     // For standard Laser / Structured Light models
device.run("EnableAIVI");           // For AI camera-based models (e.g., T8 AIVI, X1, T10)
device.run("EnableAIVI3D");         // For 3D camera-based models

// Disable obstacle detection
device.run("DisableTrueDetect");
device.run("DisableAIVI");
device.run("DisableAIVI3D");

// Toggle with arguments (0 = Disabled, 1 = Enabled)
device.run("SetTrueDetect", 1);
device.run("SetAIVI", 1);
```

---

## 7. Continuous Cleaning, Schedule & DND

### Continuous Cleaning (Breakpoint Resume)

```js
device.run("GetContinuousCleaning");       // Retrieve status
device.run("GetBreakpoint");              // Retrieve coordinate breakpoint where cleaning paused
device.run("EnableContinuousCleaning");    // Resume cleaning after recharging if battery depleted
device.run("DisableContinuousCleaning");
```

### Do Not Disturb (DND)

```js
device.run("GetDoNotDisturb");            // Retrieve DND state
device.run("EnableDoNotDisturb", "22:00", "08:00"); // Standard start and end times
device.run("DisableDoNotDisturb");
```

---

## 8. Consumables & Life Span

Retrieve and reset wear percentages for brushes and filters.

```js
device.run("GetLifeSpan");                // Triggers full combined LifeSpan report event

// Reset consumable counters after replacement
device.run("ResetLifeSpan", "main_brush");
device.run("ResetLifeSpan", "side_brush");
device.run("ResetLifeSpan", "filter");
```

---

## 9. Air Purifier (AIRBOT Series)

For mobile Air Purifier models (e.g., AIRBOT Z1).

```js
device.run("GetAirQuality");             // Retrieve current PM2.5 / VOC air readings
device.run("SetUVCleaner", 1);           // 0 = disabled, 1 = enabled UV sterilization
device.run("SetHumidifierLevel", 3, 1);   // Level (1-3) and Enable (0/1)
device.run("SetFreshenerLevel", 2, 1);    // Level (1-3) and Enable (0/1)
device.run("SetAtmoLight", 80);          // Adjust atmospheric light intensity (0-100)
device.run("SetBlueSpeaker", 1);         // Enable/disable Bluetooth speaker
device.run("SetThreeModule", 2, 1, 1);   // Set mobile filtration modules
device.run("Area_V2");                   // Perform room purification
device.run("SinglePoint_V2", coords);    // Perform purification at specific spot coordinates
device.run("GetMapSet_V2");
```

---

## 10. Manual Navigation Control

```js
// Manual movements. Note: On some models, sequential repeat commands require
// executing an alternate command first before repeating the same directional movement.
device.run("MoveForward");
device.run("MoveBackward");
```

---

## Deprecated & Legacy Helpers

```js
device.run("Edge");                       // Deprecated edge cleaning
device.edge();                            // JS helper (calls Edge)

device.run("Spot");                       // Deprecated spot cleaning
device.spot();                            // JS helper (calls Spot)

device.run("GetLifeSpan", "main_brush");   // Deprecated individual lifespan call

device.run("GetWaterBoxInfo");            // Deprecated (use GetWaterInfo)
device.run("GetWaterLevel");              // Deprecated (use GetWaterInfo)
```

---

## Comprehensive List of Supported Commands

A complete structured reference of all registered command strings matching the `commandRegistry` schema:

### Clean
* Area_V2
* Charge
* Clean
* CleanArea
* CleanArea_V2
* Clean_V2
* CustomArea
* CustomArea_V2
* DisableCleanPreference
* Edge
* EnableCleanPreference
* FreeClean
* GoToPosition
* HostedCleanMode
* Pause
* Resume
* SetAutonomousClean
* SetCleanCount
* SetCleanPreference
* SetCleanSpeed
* Spot
* SpotArea
* SpotArea_V2
* Stop

### Continuous Cleaning
* DisableContinuousCleaning
* EnableContinuousCleaning
* GetBreakpoint
* GetContinuousCleaning
* SetContinuousCleaning

### Info / Status
* DisableAdvancedMode
* DisableAutoEmpty
* DisableCarpetPressure
* DisableDoNotDisturb
* EnableAdvancedMode
* EnableAutoEmpty
* EnableCarpetPressure
* EnableDoNotDisturb
* GetAICleanItemState
* GetAdvancedMode
* GetAutoEmpty
* GetAutonomousClean
* GetBatteryState
* GetBorderSwitch
* GetCarpetAutoFanBoost
* GetCarpetInfo
* GetCarpetPressure
* GetChargeState
* GetCleanCount
* GetCleanInfo
* GetCleanInfoV2
* GetCleanPreference
* GetCleanSpeed
* GetCleanState
* GetCleanState_V2
* GetCleanSum
* GetCrossMapBorderWarning
* GetCutDirection
* GetDoNotDisturb
* GetDusterRemind
* GetError
* GetFanSpeed
* GetMoveUpWarning
* GetNetInfo
* GetNetInfoLegacy
* GetOta
* GetPosition
* GetQuickCommand
* GetRecognization
* GetRelocationState
* GetSafeProtect
* GetSchedule
* GetSchedule_V2
* GetSleepStatus
* GetStats
* GetTimeZone
* GetTotalStats
* GetVoiceLifeRemindState
* GetVolume
* GetWifiList
* GetWorkState
* Relocate
* SetAutoEmpty
* SetBlock
* SetCarpetAutoFanBoost
* SetCarpetInfo
* SetCarpetPressure
* SetDoNotDisturb
* SetDusterRemind
* SetRecognization
* SetVolume

### Station
* AirDryingStart
* AirDryingStop
* Drying
* EmptyDustBin
* EmptySuctionStation
* GetAirDrying
* GetDryingDuration
* GetMopAutoWashFrequency
* GetStationInfo
* GetStationState
* GetWashInfo
* GetWashInterval
* SetAirDrying
* SetDryingDuration
* SetMopAutoWashFrequency
* SetWashInfo
* SetWashInterval
* StationAction
* Washing
* WashingStart
* WashingStop

### Sweep / Mop Mode
* DisableBorderSpin
* DisableMopOnlyMode
* DisableSweepOnlyMode
* EnableBorderSpin
* EnableMopOnlyMode
* EnableSweepOnlyMode
* GetBorderSpin
* GetCustomAreaMode
* GetMopOnlyMode
* GetSweepMode
* GetSweepOnlyMode
* GetWorkMode
* SetBorderSpin
* SetCustomAreaMode
* SetMopOnlyMode
* SetSweepMode
* SetSweepOnlyMode

### Voice Assistant
* DisableVoiceAssistant
* EnableVoiceAssistant
* GetVoiceAssistantState
* SetVoiceAssistantState

### Map
* AddVirtualBoundary
* BackupMap
* ClearMap
* DeleteVirtualBoundary
* GetAIMap
* GetCachedMapInfo
* GetMajorMap
* GetMapImage
* GetMapInfo
* GetMapInfo_V2
* GetMaps
* GetMapSet
* GetMapSet_V2
* GetMapState
* GetMapSubSet
* GetMapTrace
* GetMinorMap
* GetMultiMapState
* GetSpotAreaInfo
* GetSpotAreas
* GetVirtualBoundaries
* GetVirtualBoundaryInfo
* MapPoint_V2
* RestoreMap
* SetMajorMap
* SetMapSet_V2
* SetRelocationState

### Movement
* Move
* MoveBackward
* MoveForward

### Water
* GetWaterBoxInfo
* GetWaterInfo
* GetWaterLevel
* SetWaterInfo
* SetWaterLevel

### Misc info
* DisableAIVI
* DisableAIVI3D
* DisableTrueDetect
* EnableAIVI
* EnableAIVI3D
* EnableTrueDetect
* Generic
* GetChildLock
* GetCleanLogs
* GetDrivingWheel
* GetEfficiency
* GetEfficiencyMode
* GetLifeSpan
* GetLiveLaunchPwdState
* GetScene
* GetTrueDetect
* PlaySound
* ResetLifeSpan
* SetAdvancedMode
* SetAIVI
* SetAIVI3D
* SetBorderSwitch
* SetChildLock
* SetCrossMapBorderWarning
* SetCutDirection
* SetEfficiencyMode
* SetMoveUpWarning
* SetMultimapState
* SetOta
* SetSafeProtect
* SetTrueDetect
* SetVoice
* SetWorkMode

### Purification (Airbot Z1)
* BasicPurification
* GetAirQuality
* GetAirbotAutoModel
* GetAngleFollow
* GetAreaPoint
* GetAtmoLight
* GetAtmoVolume
* GetBlueSpeaker
* GetHumanoidFollow
* GetJCYAirQuality
* GetMapTrace_V2
* GetMic
* GetMonitorAirState
* GetThreeModule
* GetThreeModuleStatus
* GetVoiceSimple
* MobilePurification
* SetAirbotAutoModel
* SetAngleFollow
* SetAtmoLight
* SetAtmoVolume
* SetBlueSpeaker
* SetFanSpeed
* SetFreshenerLevel
* SetHumidifierLevel
* SetMic
* SetMonitorAirState
* SetThreeModule
* SetUVCleaner
* SetVoiceSimple
* SinglePoint_V2
* SpotPurification