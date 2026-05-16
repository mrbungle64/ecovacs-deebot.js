# Models and Capabilities

This document describes the strategy and properties used for identifying and configuring Ecovacs Deebot models within the library. The configuration is split across three main files:

*   **`models.js`**: Contains the specific Deebot models mapped by their 6-character device class (e.g., `vi829v`). Each model maps to a `type` and an array of `capabilities`.
*   **`modelTypes.js`**: Defines the base architectures or generations (e.g., `T20`, `950`). Types provide the foundation and common flags for all models sharing that architecture.
*   **`capabilityTypes.js`**: Defines reusable capability groups (e.g., `vacuumBase`, `OMNI`, `PLUS`). These apply specific features (like auto-empty stations or mopping types) to models independent of their base `type`.

## Model Identification Strategy

*   **Device Class ID**: Models are uniquely identified by their device class (a 6-character ID). This ID determines the device's base model type and its specific capabilities.
*   **Base Architecture vs. Specific Names**: Specific marketing names (e.g., "DEEBOT T20 OMNI") usually don't require entirely separate model types if they share the same base architecture. Instead, they refer to a common base type (like `T20`).
*   **Variants via Capabilities**: Product variants such as "OMNI", "PLUS", or "TURBO" are handled using capability arrays in `models.js` rather than creating separate types. For instance, the OMNI capability will set the appropriate flags for a station with auto-empty, mop washing, and hot air drying features.
*   **Protocol Versions**: The `V2` flag indicates the use of modern "V2" commands (e.g., `getMapInfo_V2`, `clean_V2`) rather than legacy commands (which are still used by the `950` generation).

## Possible Properties

The following properties can be defined in `modelTypes.js` or `capabilityTypes.js` to configure the supported features of a device:

### General
*   **`deviceType`** (string): The general category of the device (e.g., `Vacuum Cleaner`, `Air Purifier`, `Air Quality Monitor`, `Lawn Mower`).

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
