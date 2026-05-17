# API Command Reference for Ecovacs & Yeedi Devices

There are commands and functions available to run actions on your robot using the `vacbot.run("CommandName", ...args)` pattern or direct first-class helper methods on the `vacbot` instance.

> [!NOTE]
> Some commands may not work on all models. Availability depends on the feature set of the specific device, its support tier, and whether the command is implemented for that model.

---

## 1. Robot Vacuum Cleaner

### Basic Cleaning Functions

These commands start or configure basic cleaning tasks. Direct JS helper methods are available as of version `0.6.2`.

```js
// Auto Cleaning
vacbot.run("Clean");       // Standard Auto Clean
vacbot.run("Clean_V2");    // Auto Clean for V2/newer models
vacbot.clean();            // JS helper (defaults to "Clean")

// Spot Area Cleaning (cleaning specific mapped rooms)
const areas = "0,7";       // Comma-separated list of spot area IDs as a string
vacbot.run("SpotArea", "start", areas);
vacbot.spotArea(areas);    // JS helper

// Custom Area Cleaning (cleaning user-defined coordinates)
// Format: "x1,y1,x2,y2" forming the bounding box
let boundaryCoordinates = "-3975,2280,-1930,4575"; 
const numberOfCleanings = 1;
vacbot.run("CustomArea", "start", boundaryCoordinates, numberOfCleanings);
vacbot.customArea(boundaryCoordinates, numberOfCleanings); // JS helper
```

### Various Control Commands

```js
// Return to charging station
vacbot.run("Charge");
vacbot.charge();           // JS helper

// Stop current activity
vacbot.run("Stop");
vacbot.stop();             // JS helper

// Pause current activity
vacbot.run("Pause");
vacbot.pause();            // JS helper (accepts optional mode, e.g. "auto")

// Resume paused cleaning
vacbot.run("Resume");
vacbot.resume();           // JS helper
```

### Retrieve Basic States

```js
vacbot.run("GetCleanState");   // Retrieve cleaning status
vacbot.run("GetChargeState");  // Retrieve charging status
vacbot.run("GetBatteryState"); // Retrieve battery percentage
vacbot.run("GetSleepStatus");  // Retrieve sleep/standby mode status
```

### Position & Relocation

```js
vacbot.run("GetPosition");     // Retrieve current coordinates of the vacuum
vacbot.run("GetChargerPos");   // Retrieve coordinates of the charging station
vacbot.run("Relocate");        // Instruct the robot to perform active relocation/re-localization
```

---

## 2. Advanced Controls & Configurations

### Cleaning Speed (Vacuum Power)

```js
vacbot.run("GetCleanSpeed");   // Retrieve suction power level
// Set suction level. Range: 1-4 (typically: 1=Quiet, 2=Standard, 3=Max, 4=Max+)
vacbot.run("SetCleanSpeed", 2); 
```

### Mopping, Water Level & Border Spin

These control the water box and advanced mopping capabilities.

```js
vacbot.run("GetWaterLevel");   // Retrieve water flow level
// Adjust water level. Range: 1-4 (1=Low, 2=Medium, 3=High, 4=Ultrahigh)
vacbot.run("SetWaterLevel", 2); 
vacbot.run("GetWaterBoxInfo");  // Indicates if the water/mopping plate is physically installed

// Mop border spinning (for devices with rotating mopping pads, e.g. T20, X1, X2, T30)
vacbot.run("GetBorderSpin");    // Get border spin status
vacbot.run("EnableBorderSpin");  // Spin mopping pads closer to walls/edges
vacbot.run("DisableBorderSpin"); // Disable border spin
```

### Cleaning Preferences (Smart Housekeeper / Habits)

```js
vacbot.run("GetCleanPreference"); // Retrieve habit/preference status
vacbot.run("EnableCleanPreference");
vacbot.run("DisableCleanPreference");
```

### Carpet Handling & Pressure Boost

```js
vacbot.run("GetCarpetInfo");       // Retrieve carpet detection status
vacbot.run("GetCarpetPressure");   // Retrieve automatic carpet suction boost status
vacbot.run("EnableCarpetPressure");
vacbot.run("DisableCarpetPressure");
```

---

## 3. Station Commands (OMNI & Auto-Empty)

For models with auto-empty stations or fully automated OMNI wash-and-dry systems (e.g. T10 OMNI, T20 OMNI, X1 OMNI, X2 OMNI, T30 OMNI, X8 OMNI).

```js
// Retrieve station status
vacbot.run("GetStationInfo");      // Station configuration details
vacbot.run("GetStationState");     // Current active state of the station

// Auto-Empty (Dustbin) Controls
vacbot.run("GetAutoEmpty");        // 0 = disabled, 1 = enabled
vacbot.run("SetAutoEmpty", 1);
vacbot.run("EmptyDustBin");        // Manually trigger dustbin suction
vacbot.run("EmptySuctionStation"); // Equivalent alias for EmptyDustBin

// Mop Washing Controls
vacbot.run("WashingStart");        // Start washing mopping pads at the station
vacbot.run("WashingStop");         // Stop washing mopping pads
vacbot.run("Washing", "start");    // Direct command option
vacbot.run("GetWashInterval");     // Retrieve pad wash interval (in minutes or area)
vacbot.run("SetWashInterval", 15); // Adjust wash interval
vacbot.run("GetWashInfo");
vacbot.run("SetWashInfo", 1);

// Mop Drying Controls
vacbot.run("AirDryingStart");      // Start hot/cool air drying of mopping pads
vacbot.run("AirDryingStop");       // Stop drying mopping pads
vacbot.run("GetAirDrying");        // Retrieve current drying state
vacbot.run("GetDryingDuration");   // Retrieve the drying duration configuration
vacbot.run("SetDryingDuration", 4); // Set drying duration (e.g. 2, 3, or 4 hours)
```

---

## 4. Map Data & Virtual Boundaries

> [!WARNING]
> Some advanced map configuration commands are experimental. Always back up map data when executing these commands if your model supports it.

```js
const mapID = '1298761989'; // Example value

// Retrieve maps
vacbot.run("GetCachedMapInfo");
vacbot.run("GetMaps");                 // GetMaps and GetCachedMapInfo are functionally identical

// Retrieve spot areas (rooms) on a map
vacbot.run("GetSpotAreas", mapID);
// Retrieve details of a specific spot area (e.g., room '0')
vacbot.run("GetSpotAreaInfo", mapID, '0');

// Retrieve virtual boundaries (virtual walls / no-mop-zones)
vacbot.run("GetVirtualBoundaries", mapID);
vacbot.run("GetVirtualBoundaryInfo", mapID, '0', 'vw'); // 'vw' = virtual wall, 'mw' = no-mop-zone

// Add a virtual boundary
// boundaryCoordinates are a string representing list of coordinates (x, y pairs forming a polygon)
const coords = "[-1072,-3142,-1072,-4240,1349,-4240,1349,-3142]"; 
vacbot.run("AddVirtualBoundary", mapID, coords, 'vw');

// Delete a virtual boundary
vacbot.run("DeleteVirtualBoundary", mapID, '0', 'vw');

// Backup and Restore map configuration (if supported)
vacbot.run("BackupMap", mapID);
vacbot.run("RestoreMap", mapID, backupID);
```

#### Map Image Retrieval & Outlines

```js
// Retrieve map data combined with map images
vacbot.run("GetMaps", true);          // Request combined map data including images
vacbot.run("GetMaps", true, false);   // Request combined map data without the map image

// Retrieve map image only (e.g. outline or wifi Heat Map)
vacbot.run("GetMapImage", mapID, "outline");
vacbot.run("GetMapImage", mapID, "wifiHeatMap");
```

---

## 5. Voice, Sound & YIKO Assistant

### Voice Reports & Audio Playback

```js
// Play sounds
vacbot.run("PlaySound");       // Plays default startup music chime (soundID = 0)
vacbot.run("PlaySound", 30);   // Play specific sound ID
vacbot.playSound(30);          // JS helper

// Speaker Volume
vacbot.run("GetVolume");
vacbot.run("SetVolume", 7);    // Range: 0-10

// Working Status Voice Report (Enable/Disable robot spoken reports)
vacbot.run("GetVoiceSimple");  // Retrieve status of voice reports
vacbot.run("SetVoiceSimple", 1); // 0 = off (silent), 1 = on
```

### YIKO Voice Assistant (Native AI Control)

For models with built-in YIKO AI voice control (e.g., DEEBOT X1, T10, T20, T30, X2, X8).

```js
vacbot.run("GetVoiceAssistantState"); // Retrieve YIKO assistant status
vacbot.run("EnableVoiceAssistant");   // Enable "Ok YIKO" wake-up detection
vacbot.run("DisableVoiceAssistant");  // Disable "Ok YIKO" wake-up detection
```

---

## 6. Obstacle Detection (AIVI / TrueDetect 3D)

Allows configuring the robot's smart front sensory perception systems (cross-lasers or camera-based AI).

```js
vacbot.run("GetTrueDetect");        // Retrieve the active sensory/obstacle mode status

// Enable obstacle detection
vacbot.run("EnableTrueDetect");     // For standard Laser / Structured Light models
vacbot.run("EnableAIVI");           // For AI camera-based models (e.g., T8 AIVI, X1, T10)
vacbot.run("EnableAIVI3D");         // For 3D camera-based models

// Disable obstacle detection
vacbot.run("DisableTrueDetect");
vacbot.run("DisableAIVI");
vacbot.run("DisableAIVI3D");

// Toggle with arguments (0 = Disabled, 1 = Enabled)
vacbot.run("SetTrueDetect", 1);
vacbot.run("SetAIVI", 1);
```

---

## 7. Continuous Cleaning, Schedule & DND

### Continuous Cleaning (Breakpoint Resume)

```js
vacbot.run("GetContinuousCleaning");       // Retrieve status
vacbot.run("GetBreakpoint");              // Retrieve coordinate breakpoint where cleaning paused
vacbot.run("EnableContinuousCleaning");    // Resume cleaning after recharging if battery depleted
vacbot.run("DisableContinuousCleaning");
```

### Do Not Disturb (DND)

```js
vacbot.run("GetDoNotDisturb");            // Retrieve DND state
vacbot.run("EnableDoNotDisturb", "22:00", "08:00"); // Standard start and end times
vacbot.run("DisableDoNotDisturb");
```

---

## 8. Consumables & Life Span

Retrieve and reset wear percentages for brushes and filters.

```js
vacbot.run("GetLifeSpan");                // Triggers full combined LifeSpan report event

// Reset consumable counters after replacement
vacbot.run("ResetLifeSpan", "main_brush");
vacbot.run("ResetLifeSpan", "side_brush");
vacbot.run("ResetLifeSpan", "filter");
```

---

## 9. Air Purifier (AIRBOT Series)

For mobile Air Purifier models (e.g., AIRBOT Z1).

```js
vacbot.run("GetAirQuality");             // Retrieve current PM2.5 / VOC air readings
vacbot.run("SetUVCleaner", 1);           // 0 = disabled, 1 = enabled UV sterilization
vacbot.run("SetHumidifierLevel", 3, 1);   // Level (1-3) and Enable (0/1)
vacbot.run("SetFreshenerLevel", 2, 1);    // Level (1-3) and Enable (0/1)
vacbot.run("SetAtmoLight", 80);          // Adjust atmospheric light intensity (0-100)
vacbot.run("SetBlueSpeaker", 1);         // Enable/disable Bluetooth speaker
vacbot.run("SetThreeModule", 2, 1, 1);   // Set mobile filtration modules
vacbot.run("Area_V2");                   // Perform room purification
vacbot.run("SinglePoint_V2", coords);    // Perform purification at specific spot coordinates
vacbot.run("GetMapSet_V2");
```

---

## 10. Manual Navigation Control

```js
// Manual movements. Note: On some models, sequential repeat commands require
// executing an alternate command first before repeating the same directional movement.
vacbot.run("MoveForward");
vacbot.run("MoveBackward");
```

---

## Deprecated & Legacy Helpers

```js
vacbot.run("Edge");                       // Deprecated edge cleaning
vacbot.edge();                            // JS helper (calls Edge)

vacbot.run("Spot");                       // Deprecated spot cleaning
vacbot.spot();                            // JS helper (calls Spot)

vacbot.run("GetLifeSpan", "main_brush");   // Deprecated individual lifespan call
```

---

## Comprehensive List of Supported Commands

A complete structured reference of all registered command strings matching the `commandRegistry` schema:

### Clean
* Area_V2
* Charge
* Clean
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
* GetCarpetInfo
* GetCarpetPressure
* GetChargeState
* GetCleanCount
* GetCleanInfo
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
* GetStationInfo
* GetStationState
* GetWashInfo
* GetWashInterval
* SetAirDrying
* SetDryingDuration
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
* GetLifeSpan
* GetLiveLaunchPwdState
* GetScene
* GetTrueDetect
* PlaySound
* ResetLifeSpan
* SetAIVI
* SetAIVI3D
* SetAdvancedMode
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