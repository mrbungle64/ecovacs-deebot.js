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

For Promise-based command calls, `runAsync()` resolves from the same event pipeline. For example, `GetBatteryState` resolves when `BatteryInfo` is emitted.

---

## 1. Core Status Events

These events report the fundamental operational state of the robot.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`BatteryInfo`** | `number \| object` | Current battery level in percent (0-100). |
| **`BatteryIsLow`** | `boolean` | `true` if the battery is critically low. |
| **`ChargeState`** | `string \| object` | Current charging status, such as `charging`, `returning`, `idle`, or `completed`. |
| **`ChargeMode`** | `string` | Internal charging mode identifier. |
| **`CleanReport`** | `string \| object` | Current cleaning status, such as `auto`, `spot`, `stop`, `pause`, or `edge`. |
| **`WorkState`** | `string \| number` | General work state reported by the robot. |
| **`SleepStatus`** | `number` | Sleep or standby status. |
| **`RelocationState`** | `string` | Re-localization state, such as `ok`, `required`, or `relocating`. |
| **`RelocationStatus`** | `string` | Detailed relocation status. |

---

## 2. Cleaning Configuration Events

Events related to suction power, water flow, cleaning modes, and active cleaning targets.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`CleanSpeed`** | `string \| number` | Current vacuum suction power level. |
| **`WaterInfo`** | `object \| number` | Raw water information payload from `WaterInfo` messages and `GetWaterInfo` responses. |
| **`WaterLevel`** | `string \| number` | Current water flow level for mopping. |
| **`WaterBoxInfo`** | `number` | Water box status, for example connected or disconnected. |
| **`WaterBoxMoppingType`** | `string \| number` | Mopping plate or mopping type reported by the robot. |
| **`WaterBoxScrubbingType`** | `string \| number` | Scrubbing or sweep type reported by the robot. |
| **`SweepMode`** | `boolean \| number \| string` | Current sweep or custom-area mode. |
| **`MopOnlyMode`** | `boolean` | `true` if mop-only mode is enabled. |
| **`CarpetPressure`** | `number` | Automatic carpet suction boost setting. |
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
| **`ChargingPosition`** | `object` | Normalized coordinates of the charging station. |
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
| **`LifeSpan`** | `object` | Combined consumable wear levels. Common keys include `filter`, `side_brush`, `main_brush`, and `unit_care`. |
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
| **`DModuleEnabled`** | `boolean` | `true` if the air freshener module is enabled. |
| **`DModuleStatus`** | `number` | Air freshener module status. |

---

## 5. Error, System & Connection Events

These events help with troubleshooting, connection state, network details, firmware information, and raw message monitoring.

| Event Name | Payload Type | Description |
| :--- | :--- | :--- |
| **`Error`** | `string` | Human-readable description of the last error reported by the robot. |
| **`ErrorCode`** | `number` | Numerical error code. Refer to `library/errorCodes.json`. |
| **`LastError`** | `object` | Combined error object with `error` and `code`. |
| **`NetworkInfo`** | `object` | Wi-Fi details: `ip`, `mac`, `wifiSSID`, and `wifiSignal`. |
| **`WifiList`** | `object` | Raw configured or discovered Wi-Fi list payload. |
| **`Ota`** | `object` | Firmware update status and availability payload. |
| **`TimeZone`** | `string \| object` | Configured time zone payload from the robot. |
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
| **`TrueDetect`** | `boolean \| number` | Obstacle detection or AIVI 3D setting. |
| **`AICleanItemState`** | `object` | Information about objects identified and avoided by AIVI. |
| **`AiBlockPlate`** | `number` | AI-based mopping plate detection status. |
| **`DoNotDisturbEnabled`** | `number \| object` | Do-not-disturb mode setting. |
| **`DoNotDisturbBlockTime`** | `string` | Configured start and end time for do-not-disturb mode. |
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
| **`HumanoidFollowYiko`** | `boolean` | `true` if the robot is following a person via YIKO. |
| **`HumanoidFollowVideo`** | `boolean` | `true` if the robot is following a person via Video AI. |

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
| **`LastCleanLogs`** | `object` | Summary of the latest cleaning task, including timestamp, image URL, type, area, and duration when available. |
| **`CleanSum`** | `object` | Cumulative cleaning statistics with total area, total time, and total count. |
| **`CurrentStats`** | `object` | Real-time statistics for the current cleaning task. |
| **`TaskStarted`** | `string` | Fired when a specific task starts. |
| **`Schedule`** | `object` | Cleaning schedule data. |
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
| **`BorderSpin`** | `boolean` | Border spin setting. |
| **`BorderSwitch`** | `boolean` | Border switch setting. |
| **`CarpetInfo`** | `object` | Carpet-related configuration or status. |
| **`ChildLock`** | `boolean` | Child lock setting. |
| **`CleanCount`** | `number` | Cleaning count setting or report. |
| **`CleanPreference`** | `boolean` | Clean preference setting. |
| **`CrossMapBorderWarning`** | `boolean` | Cross-map border warning setting. |
| **`CutDirection`** | `number` | Cleaning cut direction setting. |
| **`DrivingWheel`** | `object` | Driving wheel state. |
| **`DryingDuration`** | `number` | Station drying duration setting. |
| **`DusterRemind`** | `object` | Dust reminder setting. |
| **`FanSpeed`** | `number` | Fan speed setting. |
| **`HumanoidFollow`** | `object` | AIRBOT humanoid follow setting returned by command responses. Push updates may emit `HumanoidFollowYiko` and `HumanoidFollowVideo` instead. |
| **`LiveLaunchPwdState`** | `object` | Live launch password state. |
| **`Mic`** | `boolean` | AIRBOT microphone setting. |
| **`MonitorAirState`** | `boolean` | AIRBOT monitor air state. |
| **`MoveupWarning`** | `boolean` | Wheel-up warning status setting. |
| **`SafeProtect`** | `boolean` | Safe-protect setting. |
| **`Scene`** | `object` | Scene configuration or state. |
| **`Stats`** | `object` | Raw statistics response for `GetStats`. MQTT `Stats` push messages are normalized to `CurrentStats`. |
| **`ThreeModule`** | `object` | AIRBOT three-module setting. |
| **`ThreeModuleStatus`** | `object` | AIRBOT three-module status. |
| **`TotalStats`** | `object` | Raw total statistics response for `GetTotalStats`. MQTT `TotalStats` push messages are normalized to `CleanSum`. |
| **`VoiceAssistantState`** | `boolean` | Voice assistant setting. |
| **`VoiceLifeRemindState`** | `boolean` | Voice life reminder setting. |
| **`VoiceSimple`** | `number` | AIRBOT simple voice setting. |
| **`Volume`** | `number` | Robot voice volume setting. |
| **`WashInfo`** | `number` | Station mop wash information. |
| **`WashInterval`** | `number` | Station mop auto-wash interval. |
| **`WorkMode`** | `number` | Work mode setting. |
