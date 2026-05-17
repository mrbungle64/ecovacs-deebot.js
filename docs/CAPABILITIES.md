# Capability System Architecture

The `ecovacs-deebot.js` library uses a modular capability system to manage the diverse feature sets of the many supported Ecovacs and yeedi models. This system allows the library to handle model-specific logic (like whether a robot supports hot-air drying or a specific mopping system) without hardcoding checks for hundreds of individual model IDs.

---

## 1. Architecture Overview

The system is built on a layered property resolution strategy. Every robot model is identified by its `deviceClass`, which serves as a lookup key for its metadata.

### Core Components

*   **`CapabilityManager` (`library/managers/capabilityManager.js`):** The primary high-level API. Every `VacBot` instance has a `capabilityManager` that provides semantic methods (e.g., `hasMoppingSystem()`, `hasAutoEmptyStation()`) for internal logic and library consumers.
*   **`CapabilityTypes` (`library/capabilityTypes.js`):** Defines reusable bundles of features. For example, the `OMNI` capability automatically includes auto-empty, mop washing, and air drying features.
*   **Model Definitions (`library/models.js`):** The database of all known models, mapping `deviceClass` values to their specific configurations and capability arrays.
*   **Model Types (`library/modelTypes.js`):** Defines broad hardware generations (e.g., `T8`, `X1`, `airbot`) that share common default properties.

---

## 2. Property Resolution Logic

When a capability is checked, the library uses a strict resolution order (Cascading Strategy). Properties are merged in the following sequence, where **later steps override earlier ones**:

1.  **ModelType Defaults:** Properties defined for the base model type (e.g., all `X1` series models start with certain defaults).
2.  **Capabilities Array:** Reusable groups from `capabilityTypes.js` are applied in the order they appear in the model's `capabilities` array.
3.  **Direct Model Properties:** Any property explicitly defined on the model in `models.js` (this acts as the final override for specific variations).
4.  **Backward Compatibility:** Final internal transformations for legacy property names.

### Example: Suction Power Resolution
If a model has `["PLUS", "moppingUltraHigh"]` in its capabilities:
- `PLUS` provides `water_amount: ["LOW", "MEDIUM", "HIGH"]`.
- `moppingUltraHigh` follows and overrides it with `water_amount: ["LOW", "MEDIUM", "HIGH", "ULTRAHIGH"]`.
- The resulting robot has `ULTRAHIGH` mopping support.

---

## 3. Key Capability Groups

| Capability | Description | Features Included |
| :--- | :--- | :--- |
| `vacuumBase` | Standard vacuum set | Main/side brushes, filter, voice reports. |
| `navigationBase` | Smart navigation | Spot area (rooms), custom areas, map images. |
| `suctionMaxPlus` | High-power suction | Adds the `MAX_PLUS` mode (4 levels total). |
| `moppingUltraHigh` | Advanced mopping | Adds the `ULTRAHIGH` water level. |
| `OMNI` | All-in-One station | Auto-empty, mop washing, air drying, rotating pads. |
| `PLUS` | Auto-empty bundle | Pure dustbin suction station (no mop maintenance). |
| `TURBO` | Rotating mop system | Rotating pads + drying, but NO auto-empty station. |

---

## 4. Usage in Code

The `CapabilityManager` makes it easy to check features without knowing the underlying implementation:

```javascript
const vacbot = api.getVacBotObj(device);

if (vacbot.capabilityManager.hasMoppingSystem()) {
    console.log("This robot can mop!");
}

if (vacbot.capabilityManager.hasAutoEmptyStation()) {
    vacbot.run("EmptyDustBin");
}
```

---

## 6. Possible Properties and Values

The following properties can be defined either in `ModelTypes` (defaults), `CapabilityTypes` (groups), or directly in the model definition.

### General & Protocol
| Property | Type | Values | Description |
| :--- | :--- | :--- | :--- |
| `type` | `string` | e.g., `"950"`, `"T8"`, `"X1"`, `"airbot"` | The hardware generation/platform. |
| `V2` | `boolean` | `true`, `false` | `true` uses the modern JSON/MQTT V2 protocol commands. |
| `deviceType` | `string` | `"Vacuum Cleaner"`, `"Air Purifier"`, `"Lawn Mower"` | Human-readable category. |

### Cleaning Features
| Property | Type | Values | Description |
| :--- | :--- | :--- | :--- |
| `clean_speed` | `array` | `["QUIET", "NORMAL", "MAX", "MAX_PLUS"]` | Supported suction levels. |
| `water_amount` | `array` | `["LOW", "MEDIUM", "HIGH", "ULTRAHIGH"]` | Supported mopping water levels. |
| `housekeeper_mode` | `boolean` | `true`, `false` | AI Smart Hosting (dynamic cleaning strategy). |
| `voice_report` | `boolean` | `true`, `false` | Robot can announce status via speaker. |
| `yiko` | `boolean` | `true`, `false` | Built-in YIKO AI voice assistant support. |

### Navigation & Mapping
| Property | Type | Values | Description |
| :--- | :--- | :--- | :--- |
| `spot_area` | `boolean` | `true`, `false` | Support for room-based cleaning. |
| `custom_area` | `boolean` | `true`, `false` | Support for coordinate-based cleaning. |
| `map_image_supported` | `boolean` | `true`, `false` | Robot can provide map images/overlays. |

### Maintenance & Station
| Property | Type | Values | Description |
| :--- | :--- | :--- | :--- |
| `auto_empty_station` | `boolean` | `true`, `false` | Integrated dustbin suction station. |
| `auto_empty_station_optional` | `boolean` | `true`, `false` | Support for separate auto-empty station. |
| `air_drying` | `boolean` | `true`, `false` | Station supports hot-air drying of mop pads. |
| `round_mop_info` | `boolean` | `true`, `false` | Uses rotating dual-mop pads (OZMO Turbo). |
| `unit_care_info` | `boolean` | `true`, `false` | Life-span data for brushes and filters. |
| `air_freshener_info` | `boolean` | `true`, `false` | Life-span data for the air freshener module. |
| `handheld_subsystem` | `boolean` | `true`, `false` | Station supports a second handheld device (COMBO). |
| `main_brush` | `boolean` | `true`, `false` | Robot has a main brush (tracked consumable). |
| `side_brush` | `boolean` | `true`, `false` | Robot has side brushes (tracked consumable). |
| `filter` | `boolean` | `true`, `false` | Robot has a filter (tracked consumable). |
