/**
 * @file This file contains base types for Deebot models.
 * For a detailed explanation of properties and model identification strategy,
 * please refer to the `MODELS.md` file in this directory.
 *
 * ## Purpose
 * Each type defines the *default* properties shared by an entire generation or platform.
 * Individual models can override or extend these defaults via their `capabilities` array
 * in `models.js` (see `capabilityTypes.js` for available capability groups).
 *
 * ## Resolution Order
 * Properties are resolved in this order (later steps win):
 *   1. ModelType defaults  (this file)
 *   2. Capabilities in array order  (capabilityTypes.js, later entries override earlier)
 *   3. Direct model properties  (models.js)
 *
 * ## Key Properties
 * - `deviceType`       Human-readable product category (e.g. "Vacuum Cleaner", "Lawn Mower").
 * - `V2`              true = model uses V2 JSON/MQTT commands (e.g. getMapInfo_V2, clean_V2).
 *                     false = model uses original JSON/MQTT commands.
 * - `unit_care_info`  true = model supports retrieval of "unit care" life-span data
 *                     (i.e. remaining life span of consumables such as brushes and filters).
 *                     Source: capabilityManager.js `hasUnitCareInfo()`.
 * - `round_mop_info`  true = model uses rotating dual mop pads (OZMO Turbo system).
 * - `housekeeper_mode` true = model supports AI Smart Hosting (dynamic, room-by-room cleaning
 *                      strategy that automatically adapts suction and water level per zone).
 *                      Requires a completed persistent map. Available from T10 / X1 generation.
 * - `yiko`            true = model has the built-in YIKO voice assistant (native Ecovacs AI
 *                      voice control, activated by saying "Ok YIKO"). Available from T10 / X1.
 * - `air_freshener_info` true = model supports retrieval of air-freshener module life-span data.
 *                      Introduced with the T9 series.
 * - `voice_report`    true = model can announce cleaning status via speaker.
 * - `spot_area`       true = model supports room/zone-based cleaning from a stored map.
 * - `custom_area`     true = model supports custom-drawn rectangular cleaning areas.
 * - `clean_speed`     Array of supported suction levels (overrides default from capabilityTypes).
 */

exports.ModelTypes = {
  // OZMO 920/950 generation. Introduced the OZMO flat-pad mopping system.
  // First Ecovacs models to use the JSON/MQTT protocol
  // (replacing legacy XMPP/XML). V2: false → uses original (V1) JSON/MQTT commands.
  "950": {
    "deviceType": "Vacuum Cleaner",
    "V2": false
  },

  // U-series (e.g. U2, U2 Pro). Entry-level random/basic navigation models.
  // V2: false → uses original (V1) JSON/MQTT commands.
  // U2 devices do not provide a persistent app-generated room map; concrete
  // U2 model entries therefore do not include navigationBase.
  "U2": {
    "deviceType": "Vacuum Cleaner",
    "V2": false
  },

  // MINI series. Currently only used by the DEEBOT MINI (55uoqe).
  "mini": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "round_mop_info": true
  },

  // T8 series. Supports optional auto-empty station (PLUS bundle).
  // Introduced the V2 commands.
  "T8": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true
  },

  // T9 series. Introduced the air-freshener module (air_freshener_info).
  // Note: air_freshener_info also appears on select T10/X1 variants (individual models).
  "T9": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "air_freshener_info": true,
    "unit_care_info": true
  },

  // T10 series.
  //
  // Note: T10, T20, X1 and X2 share identical modelType properties because they all run
  // on the same modern V2 JSON/MQTT platform.
  // Differences in sensorics, suction power, or mop-wash temperature are captured in the
  // model's capabilities array in models.js, not here.
  "T10": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true, // AI Smart Hosting: dynamic room-by-room cleaning strategy.
    "yiko": true              // YIKO voice assistant (native Ecovacs AI voice control).
  },

  // N8 series.
  "N8": {
    "deviceType": "Vacuum Cleaner",
    "V2": true
  },

  // T20 series. Also used for T30, T50, T80 series. See note on T10.
  "T20": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true, // AI Smart Hosting: dynamic room-by-room cleaning strategy.
    "yiko": true              // YIKO voice assistant (native Ecovacs AI voice control).
  },

  // X1 series. See note on T10.
  "X1": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true, // AI Smart Hosting: dynamic room-by-room cleaning strategy.
    "yiko": true              // YIKO voice assistant (native Ecovacs AI voice control).
  },

  // X2 series (2023). Updated flagship with a square body design for better corner coverage,
  // upgraded AIVI 3D+ sensors, and higher suction. Also offers the COMBO bundle variant
  // (robot + handheld vacuum sharing one station). See note on T10: shares identical properties.
  "X2": {
    "deviceType": "Vacuum Cleaner",
    "V2": true,
    "unit_care_info": true,
    "housekeeper_mode": true, // AI Smart Hosting: dynamic room-by-room cleaning strategy.
    "yiko": true              // YIKO voice assistant (native Ecovacs AI voice control).
  },

  // AIRBOT series (air purifiers, e.g. AIRBOT Z1). Focuses on air quality
  // monitoring and purification; no floor cleaning. Uses V2 protocol for API communication.
  // spot_area/custom_area refer to the purifier's patrol zones, not vacuum cleaning areas.
  "airbot": {
    "deviceType": "Air Purifier",
    "V2": true,
    "clean_speed": true,
    "spot_area": true,
    "yiko": true
  },

  // Air quality monitors (e.g. Z1 Air Quality Monitor). Passive monitoring devices without
  // motors or navigation. V2 protocol for data reporting only.
  "aqMonitor": {
    "deviceType": "Air Quality Monitor",
    "V2": true
  },

  // GOAT series (lawn mowers, e.g. GOAT G1, G1 PLUS). Outdoor devices with RTK/vision
  // navigation for grass cutting. No vacuum, no mop, no indoor-map features.
  // V2 protocol; mowing-specific commands differ from vacuum command set.
  "lawnMower": {
    "deviceType": "Lawn Mower",
    "V2": true
  },

  // Yeedi brand models listed in models.js (e.g. yeedi vac, yeedi 2 hybrid, yeedi cube).
  // Yeedi is an Ecovacs sub-brand; models are often derived from Ecovacs platforms 
  // but may use different API subsets.
  // V2 is intentionally not set as a type default here because KnownYeediModels contains
  // both entries with explicit V2:true and entries without an explicit V2 override.
  "yeedi": {
    "deviceType": "Vacuum Cleaner",
    "spot_area": true,
    "custom_area": true,
    "voice_report": true
  },

  // Legacy models (pre-950 generation, XMPP/XML protocol). These are robots sold before
  // the JSON/MQTT transition (roughly pre-2019). They have no LiDAR map, no V2 commands,
  // and very limited remote control capabilities via this library.
  "legacy": {
    "deviceType": "Vacuum Cleaner"
  }
};
