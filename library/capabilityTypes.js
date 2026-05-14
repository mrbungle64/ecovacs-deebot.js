exports.CapabilityTypes = {
    "base": {
        main_brush: true,
        side_brush: true,
        filter: true,
        voice_report: true,
        clean_speed: true
    },
    "mapBase": {
        spot_area: true,
        custom_area: true,
        map_image_supported: true
    },
    "moppingBase": {
        mopping_system: true
    },
    "stationBase": {
        auto_empty_station: true
    },
    "stationMoppingBase": {
        air_drying: true,
        round_mop_info: true
    },
    "stationFull": {
        auto_empty_station: true,
        air_drying: true,
        round_mop_info: true
    },
    "OZMO": {
        mopping_system: true
    },
    "COMBO": {
        unit_care_info: true,
        round_mop_info: true,
        air_drying: true,
        auto_empty_station: true
    },
    "OMNI": {
        unit_care_info: true,
        round_mop_info: true,
        air_drying: true,
        auto_empty_station: true
    },
    "TURBO": {
        unit_care_info: true,
        round_mop_info: true,
        air_drying: true,
        auto_empty_station: false
    },
    "PLUS": {
        unit_care_info: true,
        round_mop_info: false,
        air_drying: false,
        auto_empty_station: true
    },
};
