# Event Reference for Ecovacs & Yeedi Devices

This document describes the events exposed through the `VacBot` instance. `VacBot` forwards `on()` and `once()` listeners to the underlying `Ecovacs` `EventEmitter`.

Events can be emitted when the robot pushes MQTT state updates, when command responses are received, or when the library updates internal map and connection state.

## Usage

You can listen for events using the standard Node.js `EventEmitter` pattern:

```javascript
vacbot.on('BatteryInfo', (level) => {
    console.log(`Battery level: ${level}%`);
});
```

For Promise-based command calls, `runAsync()` resolves from the same event pipeline. Some `runAsync()` results use parsed response objects while EventEmitter listeners receive the event payloads documented below.

---

## 1. Core Status Events

These events report the fundamental operational state of the robot.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`BatteryInfo`** | `number` | Current battery level in percent (0-100). |
| **`BatteryIsLow`** | `boolean` | `true` if the battery is critically low. |
| **`ChargeState`** | `string` | Current charging status, such as `charging`, `returning`, `idle`, or `completed`. |
| **`ChargeMode`** | `string` | Internal charging mode identifier. |
| **`CleanReport`** | `string` | Current cleaning status, such as `auto`, `spot`, `stop`, `pause`, or `edge`. |
| **`WorkState`** | `object` | General work state with `robot`, `station`, and `paused` fields. |
| **`SleepStatus`** | `boolean` | Sleep or standby status. |
| **`RelocationState`** | `string` | Re-localization state, such as `ok`, `required`, or `relocating`. |
| **`RelocationStatus`** | `string` | Detailed relocation status. |

---

## 2. Cleaning Configuration Events

Events related to suction power, water flow, cleaning modes, and active cleaning targets.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`CleanSpeed`** | `number` | Current vacuum suction power level. |
| **`WaterInfo`** | `object` | Raw device payload from `WaterInfo` messages and `GetWaterInfo` responses. Use `WaterLevel`, `WaterBoxInfo`, `WaterBoxMoppingType`, and `WaterBoxScrubbingType` for the normalized values. |
| **`WaterLevel`** | `number` | Current water flow level for mopping. |
| **`WaterBoxInfo`** | `number` | Water box status, for example connected or disconnected. |
| **`WaterBoxMoppingType`** | `number` | Mopping plate or mopping type reported by the robot. |
| **`WaterBoxScrubbingType`** | `number` | Scrubbing or sweep type reported by the robot. |
| **`SweepMode`** | `boolean \| number \| null` | Custom-area cleaning mode, emitted from `CustomAreaMode` push messages. Note: the `SweepMode` MQTT push yields `MopOnlyMode`, not this event. |
| **`MopOnlyMode`** | `boolean \| null` | `true` if mop-only mode is enabled, or `null` if the source payload does not include the mode. |
| **`CarpetPressure`** | `boolean` | Automatic carpet suction boost setting. |
| **`LastUsedAreaValues`** | `string` | Coordinates of the last custom area cleaned. |
| **`CurrentCustomAreaValues`** | `string` | Coordinates of the current custom area. |
| **`CurrentSpotAreas`** | `string` | Comma-separated list of spot area IDs currently being cleaned. |
| **`MoppingSystemInfo`** | `object` | Combined mopping system status, including clean status and water-related details when available. |

---

## 3. Map & Navigation Events

These events provide data about the robot position, charging station, maps, rooms, virtual boundaries, and generated map images.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`Position`** | `object` | Current robot coordinates. Fields include `x`, `y`, `a`, `coords`, `invalid`, `spotAreaID`, `spotAreaName`, and `distanceToChargingStation`. |
| **`DeebotPositionCurrentSpotAreaID`** | `string \| number` | Current spot area ID from position updates. |
| **`DeebotPositionCurrentSpotAreaName`** | `string` | Current spot area name from position updates. |
| **`ChargingPosition`** | `object` | Normalized coordinates of the charging station. Fields include `coords`, `x`, `y`, and `a`. |
| **`ChargePosition`** | `string` | Raw comma-separated charging station coordinates (`x,y,a`). |
| **`Maps`** | `array` | List of available or saved maps on the device. |
| **`CurrentMapMID`** | `string` | ID (`mid`) of the currently active map. |
| **`CurrentMapName`** | `string` | User-defined name of the current map. |
| **`CurrentMapIndex`** | `number` | Index of the currently active map. |
| **`MapState`** | `number` | Current map state. |
| **`MultiMapState`** | `number` | Multi-map feature state. |
| **`MapSet_V2`** | `object` | Parsed V2 map set data. |
| **`MapImageData`** | `object` | Generated map image object with `mapID`, `mapType`, and `mapBase64PNG`. Requires the optional `canvas` dependency. |
| **`MapImage`** | `object` | Generated map image object with `mapID`, `mapType`, and `mapBase64PNG`, emitted for map-image-only workflows. Requires the optional `canvas` dependency. |
| **`MapSpotAreas`** | `object` | List of all rooms or spot areas identified on the map. |
| **`MapVirtualBoundaries`** | `object` | Combined list of virtual walls and no-mop zones. |
| **`MapSpotAreaInfo`** | `object` | Detailed geometry and settings for a specific room. |
| **`MapVirtualBoundaryInfo`** | `object` | Detailed geometry for a specific virtual boundary. |
| **`MapDataReady`** | `void` | Internal map aggregation event emitted when all required map data pieces have been collected. |
| **`MapDataObject`** | `array` | Aggregated map data object emitted after `MapDataReady` when map object creation was requested. |

---

## 4. Station & Accessory Events

Events for models with auto-empty stations, OMNI stations, drying or washing support, and consumable life tracking.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`AutoEmptyStatus`** | `object` | Auto-empty status object with `autoEmptyEnabled`, `stationStatus`, `stationActive`, and `dustBagFull`. |
| **`AutoEmpty`** | `number` | Raw auto-empty configuration status. |
| **`LifeSpan`** | `object` | Combined consumable wear levels as percentages. Common keys include `filter`, `side_brush`, `main_brush`, and `unit_care`. |
| **`LifeSpan_filter`** | `number` | Remaining life of the high-efficiency filter. |
| **`LifeSpan_side_brush`** | `number` | Remaining life of the side brush. |
| **`LifeSpan_main_brush`** | `number` | Remaining life of the main brush. |
| **`LifeSpan_round_mop`** | `number` | Remaining life of round mop pads on supported models. |
| **`LifeSpan_air_freshener`** | `number` | Remaining life of the air freshener component on supported models. |
| **`LifeSpan_unit_care`** | `number` | Remaining life of the unit-care component on supported models. |
| **`StationInfo`** | `object` | Static information about the station configuration. |
| **`StationState`** | `object` | Current dynamic station state, such as washing or drying state. |
| **`AirDryingState`** | `string` | Mop drying status, such as `airdrying` or `idle`. |
| **`DustCaseInfo`** | `number` | Dustbin or dust case installation status. |
| **`AromaMode`** | `number` | Air freshener or aroma module mode. |
| **`DModuleEnabled`** | `number` | `1` if the air freshener module is enabled, `0` if disabled. |
| **`DModuleStatus`** | `number` | Air freshener module status. |

---

## 5. Error, System & Connection Events

These events help with troubleshooting, connection state, network details, firmware information, and raw message monitoring.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`Error`** | `string` | Human-readable description of the last error reported by the robot. |
| **`ErrorCode`** | `string` | Error code as a string (e.g. `"104"`). Refer to `library/errorCodes.json`. |
| **`LastError`** | `object` | Combined error object with `error` and `code`. |
| **`NetworkInfo`** | `object` | Wi-Fi details: `ip`, `mac`, `wifiSSID`, and `wifiSignal`. |
| **`WifiList`** | `object` | Raw configured or discovered Wi-Fi list payload. The payload may contain a `list` array. |
| **`Ota`** | `object` | Firmware update status and availability payload. |
| **`TimeZone`** | `string \| object` | Configured time-zone value or raw time-zone payload, depending on the command or push path. |
| **`HeaderInfo`** | `object` | Hardware and firmware version information with `fwVer` and `hwVer`. |
| **`Sysinfo`** | `object` | Detailed internal system information. |
| **`ready`** | `string` | Fired after the MQTT ATR channel was subscribed successfully. |
| **`disconnect`** | `boolean` | Fired when the library disconnects after an error or disconnect path. |
| **`messageReceived`** | `string` | Fired for every raw message received from the MQTT broker after command normalization. |
| **`genericCommandPayload`** | `object` | Fired when a generic command response is received. |
| **`Debug`** | `string` | Debug event for selected internal warnings, such as unknown life span component types. |

---

## 6. Advanced AI & Sensor Events

Events from AIVI cameras, TrueDetect 3D sensors, and related settings.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`TrueDetect`** | `boolean \| number` | Obstacle detection or AIVI 3D setting. `Recognization` push messages emit the raw `state`; `TrueDetect` command responses emit a boolean. |
| **`AICleanItemState`** | `object` | Information about objects identified and avoided by AIVI. |
| **`AiBlockPlate`** | `number` | AI-based mopping plate detection status. |
| **`DoNotDisturbEnabled`** | `number` | Do-not-disturb mode setting. |
| **`DoNotDisturbBlockTime`** | `object` | Configured start and end time for do-not-disturb mode. |
| **`ContinuousCleaningEnabled`** | `boolean` | Breakpoint resume or continuous cleaning setting. |
| **`SettingInfoAIVI`** | `number` | AIVI configuration status. |
| **`SettingInfoMultiMap`** | `number` | Multi-map management setting. |

---

## 7. AIRBOT Specific Events

For AIRBOT mobile air purifiers and AIRBOT-related sensors.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`AirQuality`** | `object` | PM2.5 and VOC sensor readings. `JCYAirQuality` messages are normalized to this event. |
| **`AirbotAutoModel`** | `object` | Current air purification mode. |
| **`AngleWakeup`** | `number` | Angle where the robot detected a voice or sound trigger. |
| **`Efficiency`** | `number` | Purification efficiency statistics. |
| **`HumanoidFollowYiko`** | `boolean \| number` | YIKO follow status from `HumanoidFollow` push messages. |
| **`HumanoidFollowVideo`** | `boolean \| number` | Video AI follow status from `HumanoidFollow` push messages. |

---

## 8. Voice & Audio Events

Events related to voice packs and audio settings.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`SetVoice`** | `object` | Details of the currently active voice or language pack. |
| **`VoiceDownloadProgress`** | `object` | Progress of a voice pack download. Fields include `type` and `progress`. |
| **`VoiceDownloadComplete`** | `object` | Fired when a voice pack download has successfully finished. |

---

## 9. Maintenance, Logs & Statistics Events

Historical logs, current statistics, cumulative statistics, schedules, and miscellaneous hardware reports.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`CleanLog`** | `array` | Historical cleaning log entries. |
| **`LastCleanLogs`** | `object` | Summary of the latest cleaning task, including timestamp, image URL, area, and duration when available. |
| **`CleanSum`** | `object` | Cumulative cleaning statistics with total area, total time, and total count. |
| **`CurrentStats`** | `object` | Real-time statistics for the current cleaning task. |
| **`TaskStarted`** | `object` | Fired when a FwBuryPoint task event starts. Contains `type`, `triggerType`, `failed`, and `stopReason`. |
| **`Schedule`** | `array` | Cleaning schedule data. |
| **`CustomizedScenarioCleaning`** | `object` | Custom cleaning scenario status and configuration. |
| **`Evt`** | `object` | Generic event container for miscellaneous system reports. |

---

## 10. Additional Command Response Events

Most frequently used command responses are already listed in the sections above. The command registry also defines additional response events that can be emitted by the generic command-response path.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`AdvancedMode`** | `boolean` | Advanced cleaning mode setting. |
| **`AngleFollow`** | `boolean` | AIRBOT angle-follow setting. |
| **`AreaPoint`** | `object` | AIRBOT area point data. |
| **`AtmoLight`** | `number` | AIRBOT atmosphere light setting. |
| **`AtmoVolume`** | `number` | AIRBOT atmosphere volume setting. |
| **`AutonomousClean`** | `boolean` | Autonomous cleaning setting. |
| **`BlueSpeaker`** | `object` | AIRBOT Bluetooth speaker setting. |
| **`BorderSpin`** | `boolean \| null` | Border spin setting. |
| **`BorderSwitch`** | `boolean` | Border switch setting. |
| **`CarpetInfo`** | `number` | Carpet-related configuration or status. |
| **`ChildLock`** | `boolean` | Child lock setting. |
| **`CleanCount`** | `number` | Cleaning count setting or report. |
| **`CleanPreference`** | `boolean` | Clean preference setting. |
| **`CrossMapBorderWarning`** | `boolean` | Cross-map border warning setting. |
| **`CutDirection`** | `number` | Cleaning cut direction setting. |
| **`DrivingWheel`** | `boolean` | Driving wheel state. |
| **`DryingDuration`** | `number` | Station drying duration setting. |
| **`DusterRemind`** | `object` | Dust reminder setting. |
| **`FanSpeed`** | `number` | Fan speed setting. |
| **`HumanoidFollow`** | `object` | AIRBOT humanoid follow setting returned by command responses. Push updates may emit `HumanoidFollowYiko` and `HumanoidFollowVideo` instead. |
| **`JCYAirQuality`** | `object` | Z1 Air Quality Monitor command response. Push messages are normalized to `AirQuality`. |
| **`LiveLaunchPwdState`** | `object` | Live launch password state. |
| **`Mic`** | `boolean` | AIRBOT microphone setting. |
| **`MonitorAirState`** | `boolean` | AIRBOT monitor air state. |
| **`MoveupWarning`** | `boolean` | Wheel-up warning status setting. |
| **`SafeProtect`** | `boolean` | Safe-protect setting. |
| **`Scene`** | `object` | Scene configuration or state. |
| **`Stats`** | `object` | Raw statistics payload resolved via `runAsync('GetStats')`. Both MQTT push messages and command responses are normalized and emitted as `CurrentStats` to EventEmitter listeners. |
| **`ThreeModule`** | `object` | AIRBOT three-module setting. |
| **`ThreeModuleStatus`** | `object` | AIRBOT three-module status. |
| **`TotalStats`** | `object` | Raw total-statistics payload resolved via `runAsync('GetTotalStats')`. Both MQTT push messages and command responses are normalized and emitted as `CleanSum` to EventEmitter listeners. |
| **`VoiceAssistantState`** | `boolean` | Voice assistant setting. |
| **`VoiceLifeRemindState`** | `boolean` | Voice life reminder setting. |
| **`VoiceSimple`** | `boolean` | AIRBOT simple voice setting. |
| **`Volume`** | `number` | Robot voice volume setting. |
| **`WashInfo`** | `number` | Station mop wash information. |
| **`WashInterval`** | `number` | Station mop auto-wash interval. |
| **`WorkMode`** | `number` | Work mode setting. |

---

## 11. Event Payload Structures

This section details object and array payloads emitted by the EventEmitter. Scalar events are documented in the tables above.

### `WorkState` (Object)
General work state of the robot and station.
```javascript
{
  "robot": "idle", // Robot state, or null if not present
  "station": "idle", // Station state, or null if not present
  "paused": false // true if the robot is paused
}
```

### `MoppingSystemInfo` (Object)
Aggregated status for vacuums with power adjustment and mopping capabilities.
```javascript
{
  "cleanStatus": "auto", // Current CleanReport value
  "cleanInfo": {
    "level": 2 // Current CleanSpeed value
  },
  "waterInfo": {
    "enabled": true, // true if the water box is installed or active
    "level": 2, // Current WaterLevel value
    "moppingType": 1, // Mopping plate type, when available
    "scrubbingType": 2 // Scrubbing type, when available
  }
}
```

### `Position` (Object)
Coordinates and metadata of the robot's real-time position.
```javascript
{
  "coords": "-1200,450,90", // Coordinates formatted as "x,y,a"
  "x": -1200,
  "y": 450,
  "a": 90,
  "invalid": false,
  "spotAreaID": "0",
  "spotAreaName": "Living room",
  "distanceToChargingStation": 1500
}
```

### `ChargingPosition` (Object)
Coordinates of the charging station.
```javascript
{
  "coords": "-1500,600,180",
  "x": -1500,
  "y": 600,
  "a": 180
}
```

### `Maps` (Array)
List of cached maps on the device.
```javascript
[
  {
    "mapID": "1234567890",
    "mapIndex": 0,
    "mapName": "Ground Floor",
    "mapStatus": 1,
    "mapIsCurrentMap": true,
    "mapIsBuilt": true
  }
]
```

### `MapSet_V2` (Object)
Parsed V2 room data for a map.
```javascript
{
  "mid": "1234567890",
  "subsets": [
    {
      "index": 1,
      "mssid": "0",
      "name": "Living room",
      "subtype": 1,
      "type": "ar",
      "areaConnections": "1,2",
      "cleanCount": 1,
      "cleanSpeed": "normal",
      "waterLevel": 2,
      "spotPosition": "120,240"
    }
  ]
}
```

### `MapImageData` / `MapImage` (Object)
Generated map image details. Requires the optional `canvas` dependency.
```javascript
{
  "mapID": "1234567890",
  "mapType": "outline",
  "mapBase64PNG": "data:image/png;base64,iVBORw0KGgoAAAANSU..."
}
```

### `MapSpotAreas` (Object)
List of room IDs associated with a map.
```javascript
{
  "mapID": "1234567890",
  "mapSetID": "1",
  "mapSpotAreas": [
    {
      "mapSpotAreaID": "0"
    }
  ]
}
```

### `MapVirtualBoundaries` (Object)
List of virtual walls and no-mop zones on a map.
```javascript
{
  "mapID": "1234567890",
  "mapVirtualWalls": [
    {
      "mapVirtualBoundaryID": "1",
      "mapVirtualBoundaryType": "vw"
    }
  ],
  "mapNoMopZones": [
    {
      "mapVirtualBoundaryID": "2",
      "mapVirtualBoundaryType": "mw"
    }
  ]
}
```

### `MapSpotAreaInfo` (Object)
Detailed geometry, custom names, and settings for a specific room.
```javascript
{
  "mapID": "1234567890",
  "mapSpotAreaID": "0",
  "mapSpotAreaName": "Living room",
  "mapSpotAreaConnections": "1,2",
  "mapSpotAreaBoundaries": "-1000,-1000;1000,-1000;1000,1000;-1000,1000",
  "mapSpotAreaSubType": "1",
  "mapSpotAreaSequenceNumber": 1,
  "mapSpotAreaCleanSet": {
    "cleanCount": 1,
    "cleanSpeed": "normal",
    "waterLevel": 2
  }
}
```

### `MapVirtualBoundaryInfo` (Object)
Detailed coordinates for a virtual wall or no-mop zone.
```javascript
{
  "mapID": "1234567890",
  "mapVirtualBoundaryID": "1",
  "mapVirtualBoundaryType": "vw",
  "mapVirtualBoundaryCoordinates": "-500,-500;500,-500;500,-600;-500,-600"
}
```

### `MapDataObject` (Array)
Full hierarchical map details emitted on `MapDataReady` if requested.
```javascript
[
  {
    "mapID": "1234567890",
    "mapIndex": 0,
    "mapName": "Ground Floor",
    "mapStatus": 1,
    "mapIsCurrentMap": true,
    "mapIsBuilt": true,
    "mapSpotAreas": [
      {
        "mapSpotAreaID": "0",
        "mapSpotAreaName": "Living room",
        "mapSpotAreaConnections": "1",
        "mapSpotAreaBoundaries": "...",
        "mapSpotAreaSubType": "1",
        "mapSpotAreaSequenceNumber": 1,
        "mapSpotAreaCleanSet": {}
      }
    ],
    "mapVirtualBoundaries": [
      {
        "mapVirtualBoundaryID": "1",
        "mapVirtualBoundaryType": "vw",
        "mapVirtualBoundaryCoordinates": "..."
      }
    ],
    "mapImage": {
      "mapID": "1234567890",
      "mapType": "outline",
      "mapBase64PNG": "data:image/png;base64,..."
    }
  }
]
```

### `AutoEmptyStatus` (Object)
Auto-empty status tracking.
```javascript
{
  "autoEmptyEnabled": true,
  "stationStatus": 1,
  "stationActive": true,
  "dustBagFull": false
}
```

### `LifeSpan` (Object)
Wear status of consumable components in percent.
```javascript
{
  "filter": 85.5,
  "side_brush": 92,
  "main_brush": 64.25,
  "unit_care": 100
}
```

### `StationInfo` (Object)
Configuration properties of the base station.
```javascript
{
  "state": 1,
  "name": "Omni Station",
  "model": "CH2128",
  "sn": "123456789",
  "wkVer": "1.0.4"
}
```

### `StationState` (Object)
Dynamic status of the station.
```javascript
{
  "type": 2,
  "state": 1,
  "isAirDrying": true,
  "isSelfCleaning": false,
  "isActive": true
}
```

### `LastError` (Object)
Aggregated last error.
```javascript
{
  "error": "Drop sensor trigger",
  "code": "104"
}
```

### `NetworkInfo` (Object)
Wi-Fi connection properties.
```javascript
{
  "ip": "192.168.1.123",
  "mac": "AA:BB:CC:DD:EE:FF",
  "wifiSSID": "HomeNetwork",
  "wifiSignal": -55
}
```

### `DoNotDisturbBlockTime` (Object)
Configured time window for do-not-disturb mode. Only emitted when `DoNotDisturbEnabled` is truthy.
```javascript
{
  "from": "22:00", // Start time as reported by the device
  "to": "08:00"   // End time as reported by the device
}
```

### `TaskStarted` (Object)
Current task state emitted on FwBuryPoint task events (e.g. T8/T9 series).
```javascript
{
  "type": "bd_task-clean-move-start", // FwBuryPoint event suffix
  "triggerType": "none",              // Trigger type, or 'none'
  "failed": false,                    // true if the task failed
  "stopReason": "none"               // Stop reason when available
}
```

### `AirQuality` (Object)
Purifier sensor readings for AIRBOT models and Z1 Air Quality Monitor messages.
```javascript
{
  "particulateMatter25": 10,
  "particulateMatter10": 15,
  "airQualityIndex": 20,
  "volatileOrganicCompounds": 0.05,
  "volatileOrganicCompounds_parts": 120,
  "temperature": 21.8,
  "humidity": 45
}
```

### `VoiceDownloadProgress` / `VoiceDownloadComplete` (Object)
Voice pack download state.
```javascript
{
  "type": "de",
  "status": "dl",
  "progress": 45
}
```

### `CleanLog` (Array)
History list of cleaning runs.
```javascript
[
  {
    "squareMeters": 42,
    "timestamp": 1635497684,
    "date": "2021-10-29T08:54:44.000Z",
    "lastTime": 2520,
    "totalTime": 2520,
    "totalTimeFormatted": "42:00",
    "imageUrl": "http://...",
    "type": "auto",
    "stopReason": "finished"
  }
]
```

### `LastCleanLogs` (Object)
Telemetry summary of the most recent cleaning run.
```javascript
{
  "timestamp": 1635497684,
  "squareMeters": 42,
  "totalTime": 2520,
  "totalTimeFormatted": "42:00",
  "imageUrl": "http://..."
}
```

### `CleanSum` (Object)
Total accumulated device usage stats.
```javascript
{
  "totalSquareMeters": 15300,
  "totalSeconds": 918000,
  "totalNumber": 340
}
```

### `CurrentStats` (Object)
Telemetry for the active cleaning run.
```javascript
{
  "cleanedArea": 12,
  "cleanedSeconds": 720,
  "cleanType": "auto"
}
```

### `Schedule` (Array)
Timer schedule configurations.
```javascript
[
  {
    "sid": "1",
    "cleanCmd": {
      "type": "auto"
    },
    "content": {},
    "enabled": true,
    "onlyOnce": false,
    "weekdays": {
      "Mon": true,
      "Tue": true,
      "Wed": true,
      "Thu": true,
      "Fri": true,
      "Sat": false,
      "Sun": false
    },
    "hour": 9,
    "minute": 0,
    "mapID": "1234567890"
  }
]
```
