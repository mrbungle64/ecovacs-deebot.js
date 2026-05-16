/**
 * @file This file contains base types for Deebot models.
 * For a detailed explanation of properties and model identification strategy,
 * please refer to the `MODELS.md` file in this directory.
 */

exports.ModelTypes = {
  // OZMO 920/950 generation. Protocol breakpoint from legacy XML to modern JSON/MQTT.
  "950": {
    "deviceType": "Vacuum Cleaner",
    "V2": false
  },
  // U-series. No app-generated LiDAR map model and no persistent room segmentation.
  "U2": {
    "deviceType": "Vacuum Cleaner",
    "V2": false
  },
  // MINI series. Compact form factor but retains full API capabilities (TrueMapping, OMNI logic).
  "mini": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "round_mop_info": true,
    "hosted_mode": true
  },
  // T8 series (TrueMapping devices with LiDAR).
  "T8": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true
  },
  // T9 series. Includes air freshener support.
  "T9": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "air_freshener_info": true,
    "unit_care_info": true
  },
  // T10, N10, N20, N30, N50 series (TrueMapping devices).
  "T10": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "hosted_mode": true,
    "yiko": true
  },
  // N8 series (TrueMapping devices).
  "N8": {
    "deviceType": "Vacuum Cleaner",
    "V2": true
  },
  // T20 series and currently also used for T30, T50, T80 series (Modern TrueMapping devices).
  "T20": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "hosted_mode": true,
    "yiko": true
  },
  // X1 series (Flagship TrueMapping devices).
  "X1": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "hosted_mode": true,
    "yiko": true
  },
  // X2 series (Flagship TrueMapping devices).
  "X2": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true,
    "hosted_mode": true,
    "yiko": true
  },
  // AIRBOT series (air purifiers). Focuses on air quality without floor cleaning.
  "airbot": {
    "deviceType": "Air Purifier",
    "V2": true,
    "clean_speed": true,
    "spot_area": true,
    "yiko": true
  },
  // Air quality monitors.
  "aqMonitor": {
    "deviceType": "Air Quality Monitor",
    "V2": true
  },
  // GOAT series (lawn mowers). Lacks vacuum/mop flags, has mowing-specific flags.
  "lawnMower": {
    "deviceType": "Lawn Mower",
    "V2": true
  },
  // Yeedi brand models. Often derived from Ecovacs platforms.
  "yeedi": {
    "deviceType": "Vacuum Cleaner",
    "spot_area": true,
    "custom_area": true,
    "voice_report": true
  },
  // Legacy models (XML based).
  "legacy": {
    "deviceType": "Vacuum Cleaner"
  }
};
