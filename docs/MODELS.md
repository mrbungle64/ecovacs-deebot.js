# Models and Capabilities

This document describes the strategy and properties used for identifying and configuring Ecovacs Deebot models within the library. The configuration is split across three main files:

*   **`models.js`**: Contains the specific Deebot models mapped by their 6-character device class (e.g., `vi829v`). Each model maps to a `type` and an array of `capabilities`.
*   **`modelTypes.js`**: Defines the base architectures or generations (e.g., `T20`, `950`). Types provide the foundation and common flags for all models sharing that architecture.
*   **`capabilityTypes.js`**: Defines reusable capability groups (e.g., `vacuumBase`, `OMNI`, `PLUS`). These apply specific features (like auto-empty stations or mopping types) to models independent of their base `type`.

## Property Resolution Order

When the library checks a device's capabilities (e.g., via `CapabilityManager`), properties are merged using a strict cascading strategy. **Later steps override earlier ones**:

1.  **ModelType Defaults:** Base properties defined for the model's `type` in `modelTypes.js` (lowest priority).
2.  **Capabilities Array:** Reusable groups from `capabilityTypes.js`, applied from left to right in the order they appear in the model's `capabilities` array (e.g., `["PLUS", "moppingUltraHigh"]` means `moppingUltraHigh` wins over `PLUS`).
3.  **Direct Model Properties:** Any property explicitly set on the individual model object in `models.js` (highest priority).

## Model Identification Strategy

*   **Device Class ID**: Models are uniquely identified by their device class (a 6-character ID). This ID determines the device's base model type and its specific capabilities.
*   **Base Architecture vs. Specific Names**: Specific marketing names (e.g., "DEEBOT T20 OMNI") usually don't require entirely separate model types if they share the same base architecture. Instead, they refer to a common base type (like `T20`).
*   **Variants via Capabilities**: Product variants such as "OMNI", "PLUS", or "TURBO" are handled using capability arrays in `models.js` rather than creating separate types. For instance, the OMNI capability will set the appropriate flags for a station with auto-empty, mop washing, and hot air drying features.
*   **Protocol Versions**: The `V2` flag indicates the use of modern "V2" commands (e.g., `getMapInfo_V2`, `clean_V2`) rather than legacy commands (which are still used by the `950` generation).

## `getPlatformType()` API

The `getPlatformType()` method is available on the `VacBot` instance and returns the model's
base architecture type as a string. This value corresponds directly to the key used for the
model's entry in `modelTypes.js` (via the `type` property set in `models.js`).

> **`getModelType()` is deprecated** — it is kept as a backward-compatible wrapper that calls
> `getPlatformType()` internally. Prefer `getPlatformType()` in new code.

```javascript
const platformType = vacbot.getPlatformType();
// e.g. 'T20', 'X2', 'legacy', 'unknown'

// Still works, but deprecated:
const modelType = vacbot.getModelType();
```

### Possible Return Values

| Return Value | Description |
| :--- | :--- |
| `'950'` | OZMO 920/950 generation (first JSON/MQTT models, V1 commands) |
| `'U2'` | U-series entry-level models (e.g. U2, U2 Pro) |
| `'mini'` | DEEBOT MINI series |
| `'N8'` | N8 series |
| `'T8'` | T8 series |
| `'T9'` | T9 series |
| `'T10'` | T10 series |
| `'T20'` | T20, T30, T50, T80 series |
| `'X1'` | X1 series |
| `'X2'` | X2 series (2023, square body) |
| `'airbot'` | AIRBOT series (air purifiers, e.g. AIRBOT Z1) |
| `'aqMonitor'` | Air Quality Monitor series |
| `'lawnMower'` | GOAT series (lawn mowers, e.g. GOAT G1) |
| `'yeedi'` | Yeedi brand models |
| `'legacy'` | Pre-950 generation (XMPP/XML protocol, very limited support) |
| `'unknown'` | Device class not found in any known model list |

### Related Helper Methods

The `VacBot` instance exposes convenience boolean methods built on top of `getPlatformType()`:

| Method | Equivalent check |
| :--- | :--- |
| `isPlatformTypeLegacy()` | `getPlatformType() === 'legacy'` |
| `isPlatformTypeN8()` | `getPlatformType() === 'N8'` |
| `isPlatformTypeT8()` | `getPlatformType() === 'T8'` |
| `isPlatformTypeT9()` | `getPlatformType() === 'T9'` |
| `isPlatformTypeT10()` | `getPlatformType() === 'T10'` |
| `isPlatformTypeT20()` | `getPlatformType() === 'T20'` |
| `isPlatformTypeX1()` | `getPlatformType() === 'X1'` |
| `isPlatformTypeX2()` | `getPlatformType() === 'X2'` |
| `isPlatformTypeAirbot()` | `getPlatformType() === 'airbot'` |
| `isPlatformTypeAqMonitor()` | `getPlatformType() === 'aqMonitor'` |
| `isPlatformTypeLawnMower()` | `getPlatformType() === 'lawnMower'` |

> [!NOTE]
> All legacy `isModelType*()` methods (e.g. `isModelTypeT8()`) are deprecated but remain fully supported as backward-compatibility wrappers.

## `getDeviceCategory()` API

The `getDeviceCategory()` method returns the human-readable product category of the device.
This is completely separate from the platform/architecture type returned by `getPlatformType()`.

```javascript
const category = vacbot.getDeviceCategory();
// e.g. 'Vacuum Cleaner', 'Air Purifier', 'Air Quality Monitor', 'Lawn Mower'
```

## `getSmartType()` API

The `getSmartType()` method returns the internal IoT platform generation/protocol identifier of the device as a string.

```javascript
const smartType = vacbot.getSmartType();
// e.g. 'MQ_AP', 'BLAP2', 'QRP', 'SPA', 'BT', 'unknown'
```

## `smartType` Property

The `smartType` property (defined in `models.js` for each device class) is a metadata field derived from the Ecovacs PIM (Product Information Management) IoT database (`productIotMap.json`). The JSON database was sourced from the public [bumper repository by MVladislav](https://github.com/MVladislav/bumper/tree/main).

> [!NOTE]
> **No Official Documentation:** The term `smartType` and its values are strictly proprietary, internal identifiers used by the manufacturer. They are not defined or documented in any public Ecovacs APIs, patent logs, or FCC filings. The mapping and naming conventions are reconstructed entirely via community reverse-engineering.

### Platform and Protocol Correlation

Although undocumented by the manufacturer, the `smartType` correlates consistently with the device's hardware platform, brand, and communication protocol generation.

> [!WARNING]
> **Speculative Terminology:** The expanded meanings of the acronyms below (e.g., *Message Queue Appliance*, *Simple Protocol Appliance*, *Bot Tablet*) are **speculative reconstructions** (educated guesses) based on technical clues and device behavior. They are **not** officially confirmed by the manufacturer.

| `smartType` | Device Category / Series | Reconstructed Protocol / Platform Meaning (Speculative) |
| :--- | :--- | :--- |
| **`MQ_AP`** | Standard/Mid-Range DEEBOTs (T8, T9, T10, T20, X1, U2, N8, 950), Air Purifiers, Air Quality Monitors | Mainstream MQTT-based connection platform (Message Queue Appliance). |
| **`MQ_APM`** | Modern mid-range DEEBOTs (T50, N50) | Modified/modernized MQTT connection platform. |
| **`BLAP2`** | Modern Flagship DEEBOTs (T30, T80, X5, X8, X2, T30S) | Newer generation IoT connection platform (often Bluetooth/Wi-Fi hybrids). |
| **`BLAP`** / **`BLAPG`** | GOAT Lawn Mowers (G1, GX-600, A3000, A2500, etc.) | Mähroboter platform (BLAPG is used for RTK/LiDAR-based newer generations). |
| **`QRP`** / **`BL_QRP`** | **yeedi**-branded vacuum robots (yeedi vac, mop station, cube) and selected Ecovacs devices (e.g. AIRBOT Z1) | Speculative internal platform/protocol identifier. (Previously hypothesized to mean "Qirui Robot Platform", which corporate and regulatory filings have disproven). |
| **`BT`** | WINBOT window cleaning robots | Bot Tablet / Winbot-specific platform. |
| **`SPA`** / **`HK_AP`** | Legacy DEEBOTs (Slim2, N79, OZMO 610/930) | Legacy connection protocols (REST/XMPP) (SPA: Simple Protocol Appliance). |

## Key Capability Groups

These are some of the reusable bundles defined in `capabilityTypes.js`:

| Capability | Features Included |
| :--- | :--- |
| `vacuumBase` | Main/side brushes, filter, voice reports. |
| `navigationBase` | Spot area (rooms), custom areas, map images. |
| `suctionMaxPlus` | Adds the high-power `MAX_PLUS` mode (4 levels total). |
| `moppingUltraHigh` | Adds the `ULTRAHIGH` water level. |
| `OMNI` | All-in-One station: auto-empty, mop washing, air drying, rotating pads. |
| `PLUS` | Pure dustbin suction station (no mop maintenance). |
| `TURBO` | Rotating mop system + drying dock, but NO auto-empty station. |

## Possible Properties

The following properties can be defined in `modelTypes.js` or `capabilityTypes.js` to configure the supported features of a device:

### General
*   **`deviceCategory`** (string): The general category of the device (e.g., `Vacuum Cleaner`, `Air Purifier`, `Air Quality Monitor`, `Lawn Mower`).

### Protocol
*   **`V2`** (boolean): Indicates the use of "V2" commands (e.g., `getMapInfo_V2`, `clean_V2`) instead of legacy commands.

### Navigation
*   **`map_image_supported`** (boolean): Whether map image rendering and map interactions are supported.

### Cleaning Capabilities
*   **`clean_speed`** (boolean or array): Adjustable cleaning/suction speed. Array specifies exact levels (e.g., `["QUIET", "NORMAL", "MAX"]`).
*   **`water_amount`** (array): Adjustable water flow levels for mopping (e.g., `["LOW", "MEDIUM", "HIGH", "ULTRAHIGH"]`).
*   **`spot_area`** (boolean): Spot area (room) cleaning support.
*   **`custom_area`** (boolean): Custom area (zone) cleaning support.

### Hardware and Accessories
*   **`main_brush`** (boolean): Has a main brush.
*   **`side_brush`** (boolean): Has side brushes.
*   **`filter`** (boolean): Has a filter.
*   **`unit_care_info`** (boolean): Reports accessory life and maintenance info (brushes, filters).
*   **`round_mop_info`** (boolean): Provides information about rotating mops (e.g., OZMO Turbo).
*   **`air_freshener_info`** (boolean): Air freshener module status (e.g., T9).

### Station Capabilities
*   **`auto_empty_station`** (boolean): Device has an auto-empty station.
*   **`auto_empty_station_optional`** (boolean): Device optionally supports an auto-empty station (sold separately).
*   **`air_drying`** (boolean): Station supports hot air drying for mops.

### Advanced Features
*   **`voice_report`** (boolean): Voice reporting/announcement support.
*   **`housekeeper_mode`** (boolean): AI-based dynamic cleaning strategy (AI Smart Hosting) that automatically adjusts cleaning parameters.
*   **`yiko`** (boolean): YIKO voice assistant support.
