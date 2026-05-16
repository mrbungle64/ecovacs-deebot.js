/**
 * @file This file contains base types for Deebot models.
 * For a detailed explanation of properties and model identification strategy,
 * please refer to the `MODELS.md` file in this directory.
 */

exports.ModelTypes = {
  // OZMO 920/950 generation. Protocol breakpoint from legacy XML to modern JSON/MQTT.
  "950": {
    "V2": false
  },
  // U-series. No app-generated LiDAR map model and no persistent room segmentation.
  "U2": {
    "V2": false
  },
  // MINI series. Compact form factor but retains full API capabilities (TrueMapping, OMNI logic).
  "mini": {
    "V2": true,
    "unit_care_info": true,
    "round_mop_info": true
  },
  // T8 series (TrueMapping devices with LiDAR).
  "T8": {
    "V2": true,
    "unit_care_info": true
  },
  // T9 series. Includes air freshener support.
  "T9": {
    "V2": true,
    "air_freshener_info": true,
    "unit_care_info": true
  },
  // T10, N10, N20, N30, N50 series (TrueMapping devices).
  "T10": {
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "yiko": true
  },
  // N8 series (TrueMapping devices).
  "N8": {
    "V2": true
  },
  // T20 series and currently also used for T30, T50, T80 series (Modern TrueMapping devices).
  "T20": {
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "yiko": true
  },
  // X1 series (Flagship TrueMapping devices).
  "X1": {
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "yiko": true
  },
  // X2 series (Flagship TrueMapping devices).
  "X2": {
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "yiko": true
  },
  // AIRBOT series (air purifiers). Focuses on air quality without floor cleaning.
  "airbot": {
    "V2": true,
    "clean_speed": true,
    "spot_area": true,
    "yiko": true
  },
  // Air quality monitors.
  "aqMonitor": {
    "V2": true
  },
  // GOAT series (lawn mowers). Lacks vacuum/mop flags, has mowing-specific flags.
  "lawnMower": {
    "V2": true
  },
  // Yeedi brand models. Often derived from Ecovacs platforms.
  "yeedi": {
    "spot_area": true,
    "custom_area": true,
    "voice_report": true,
    "clean_speed": true,
    "map_image_supported": true
  },
  // Legacy models (XML based).
  "legacy": {}
};
