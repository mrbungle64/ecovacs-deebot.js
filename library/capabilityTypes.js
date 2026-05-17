/**
 * @file This file defines groups of capabilities that can be applied to models.
 * For a detailed explanation of properties and model identification strategy,
 * please refer to the `docs/MODELS.md` file.
 *
 * ## Resolution Order (important!)
 * Properties are resolved in this order (later steps override earlier ones):
 *   1. ModelType defaults  (modelTypes.js)
 *   2. Capabilities in array order  ← later entries override earlier ones!
 *   3. Direct model properties  (models.js)
 *
 * This means that capability order within a model's `capabilities` array matters.
 * Example: `["PLUS", "moppingUltraHigh"]` → ULTRAHIGH wins over PLUS's HIGH.
 *          `["moppingUltraHigh", "PLUS"]` → PLUS wins, ULTRAHIGH is lost!
 */

exports.CapabilityTypes = {
    // Base capability for vacuum/mop robots.
    // Includes the standard brush set, filter, voice reporting, and 3-speed suction.
    "vacuumBase": {
        main_brush: true,
        side_brush: true,
        filter: true,
        voice_report: true,
        clean_speed: ["QUIET", "NORMAL", "MAX"]
    },
    // Persistent map navigation with room/zone cleaning and map image display.
    // Keep this separate from vacuumBase because random/basic-navigation models
    // can vacuum and mop without supporting map-based operations.
    "navigationBase": {
        spot_area: true,
        custom_area: true,
        map_image_supported: true
    },
    // Standard 3-speed suction (QUIET / NORMAL / MAX).
    // Used for models that already inherit vacuumBase but need an explicit override.
    "suctionMax": {
        clean_speed: ["QUIET", "NORMAL", "MAX"]
    },
    // Extended 4-speed suction adding the MAX_PLUS boost mode.
    // MAX_PLUS is a high-power suction level typically found on T9+ / X1+ platforms.
    "suctionMaxPlus": {
        clean_speed: ["QUIET", "NORMAL", "MAX", "MAX_PLUS"]
    },
    // Generic mopping capability with 3 discrete water level steps.
    // Used for models with a standard flat-pad or basic mop system without OZMO branding
    // (e.g. N-series, U-series, yeedi). Does NOT imply a specific mop hardware type.
    "moppingHigh": {
        water_amount: ["LOW", "MEDIUM", "HIGH"]
    },
    // Extended mopping capability with 4 discrete water level steps.
    // The additional ULTRAHIGH level is available on models with a more advanced mop system
    // (e.g. OZMO Turbo, or higher-end N/T-series robots). Must be placed AFTER "PLUS" in the
    // capabilities array if combined, so ULTRAHIGH is not overridden by PLUS's water_amount.
    "moppingUltraHigh": {
        water_amount: ["LOW", "MEDIUM", "HIGH", "ULTRAHIGH"]
    },
    // Station with automatic dust-bin emptying only (beutelbasiert / bagless PureCyclone).
    // Used for models where the station is always included (not optional).
    // No mop washing, no air drying. Typical for: yeedi cube, yeedi vac station.
    "stationBase": {
        auto_empty_station: true
    },
    // Optionally available auto-empty station (robot sold separately, station sold separately
    // or as a bundle). The robot hardware supports the station, but it is not bundled by default.
    // Historically used for T8, N8, T9, T10, N10, N20 series (the "Robot-only + PLUS bundle" model).
    "stationBaseOptional": {
        auto_empty_station_optional: true
    },
    // Mop-drying station without auto-empty functionality.
    // Provides hot-air drying for rotating mop pads (round_mop_info) but does not vacuum the dustbin.
    // Used for: yeedi Floor 3 Station, yeedi mop station series.
    "stationMoppingBase": {
        air_drying: true,
        round_mop_info: true
    },
    // OZMO Roller models use a mop roller rather than rotating round pads.
    // This must be placed after "OMNI" for roller-based OMNI models.
    "rollerMop": {
        round_mop_info: false
    },
    // Reserved: combined station with auto-empty + mop drying, but without the full OMNI feature set
    // (e.g. no unit_care_info or water_amount override).
    // NOTE: Currently not assigned to any model in models.js. Do not remove
    // until confirmed unnecessary – may be needed for future models.
    "stationFull": {
        auto_empty_station: true,
        air_drying: true,
        round_mop_info: true
    },
    // OZMO is the product-name marker for the classic flat-pad, water-pump mopping system
    // (stationary pad, electronically controlled pump, 3 discrete water levels LOW/MEDIUM/HIGH).
    // Produces the same water_amount property as moppingHigh, but signals the specific
    // OZMO hardware variant (as opposed to a generic mop level).
    // Used on: OZMO 920/950, T8 family, OZMO T8/T8 AIVI.
    // NOT used for OZMO Pro (oscillating), OZMO Turbo (rotating), or OZMO Roller.
    "OZMO": {
        water_amount: ["LOW", "MEDIUM", "HIGH"]
    },
    // COMBO: bundle of a Deebot robot and a cordless handheld vacuum sharing one station.
    // The robot's capabilities are identical to the underlying OMNI platform (auto-empty,
    // mop washing, hot-air drying, rotating mop pads). The additional handheld_subsystem
    // flag signals that the station also serves a second handheld device.
    // Hardware example: T30S COMBO, X2 COMBO.
    "COMBO": {
        unit_care_info: true,
        water_amount: ["LOW", "MEDIUM", "HIGH"],
        round_mop_info: true,
        air_drying: true,
        auto_empty_station: true,
        handheld_subsystem: true  // Station also charges/empties a cordless handheld vacuum.
    },
    // OMNI: All-in-One station combining four automated maintenance functions:
    //   1. Auto-Empty   – suction of dustbin contents into a station bag or bagless cyclone.
    //   2. Mop Washing  – automatic cleaning of the mop system with water.
    //   3. Hot-Air Drying – drying mop pads with warm air (~63 °C) to prevent bacteria/odour.
    //   4. Water Refill – automatic refill of the robot's internal water tank (model-dependent).
    // round_mop_info signals that the robot uses rotating dual-mop pads (OZMO Turbo system).
    // Roller-based OMNI models must override this with "rollerMop".
    // Introduced with the X1 OMNI; hot-water mop washing (55 °C) added from T20 OMNI onwards.
    "OMNI": {
        unit_care_info: true,
        water_amount: ["LOW", "MEDIUM", "HIGH"],
        round_mop_info: true,   // Rotating dual mop pads (OZMO Turbo); roller models override this.
        air_drying: true,       // Station dries mop pads with hot air after washing.
        auto_empty_station: true
    },
    // TURBO: models equipped with the OZMO Turbo rotating dual-mop system, but WITHOUT
    // an auto-empty station. The robot has two rotating mop pads (~180 rpm, ~6 N pressure)
    // and a drying capability (air_drying via a simpler dock), but no station for dust collection.
    // auto_empty_station: false explicitly overrides any modelType default that might be true.
    // Example: DEEBOT T10 TURBO, DEEBOT T9 TURBO.
    "TURBO": {
        unit_care_info: true,
        water_amount: ["LOW", "MEDIUM", "HIGH"],
        round_mop_info: true,   // Rotating dual mop pads (OZMO Turbo system).
        air_drying: true,       // Dock can dry mop pads with hot air.
        auto_empty_station: false   // No auto-empty station (overrides modelType default).
    },
    // PLUS: models bundled with a pure auto-empty station (dust-bag or bagless PureCyclone).
    // The station ONLY vacuums the dustbin – it does NOT wash or dry mop pads.
    // round_mop_info: false and air_drying: false explicitly override modelType defaults
    // to prevent false station-action flags from being inherited.
    // Note: PLUS does not change the robot's mopping capability – the water_amount here reflects
    // the robot's mop level (inherited from the base model). If the robot supports ULTRAHIGH,
    // place "moppingUltraHigh" AFTER "PLUS" in the capabilities array to preserve it.
    // Example: N8+, T9+, T10 PLUS, N10 PLUS, N20 PLUS, X1 PLUS.
    "PLUS": {
        unit_care_info: true,
        water_amount: ["LOW", "MEDIUM", "HIGH"],
        round_mop_info: false,  // No rotating mop pads for station washing (overrides default).
        air_drying: false,      // No hot-air drying at station (overrides default).
        auto_empty_station: true
    }
};

