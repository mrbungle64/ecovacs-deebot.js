export namespace CapabilityTypes {
    namespace base {
        let main_brush: boolean;
        let side_brush: boolean;
        let filter: boolean;
        let voice_report: boolean;
        let clean_speed: string[];
    }
    namespace mapBase {
        let spot_area: boolean;
        let custom_area: boolean;
        let map_image_supported: boolean;
    }
    namespace moppingBase {
        let water_amount: string[];
    }
    namespace stationBase {
        let auto_empty_station: boolean;
    }
    namespace stationMoppingBase {
        let air_drying: boolean;
        let round_mop_info: boolean;
    }
    namespace stationFull {
        let auto_empty_station_1: boolean;
        export { auto_empty_station_1 as auto_empty_station };
        let air_drying_1: boolean;
        export { air_drying_1 as air_drying };
        let round_mop_info_1: boolean;
        export { round_mop_info_1 as round_mop_info };
    }
    namespace OZMO {
        let water_amount_1: string[];
        export { water_amount_1 as water_amount };
    }
    namespace COMBO {
        export let unit_care_info: boolean;
        let water_amount_2: string[];
        export { water_amount_2 as water_amount };
        let round_mop_info_2: boolean;
        export { round_mop_info_2 as round_mop_info };
        let air_drying_2: boolean;
        export { air_drying_2 as air_drying };
        let auto_empty_station_2: boolean;
        export { auto_empty_station_2 as auto_empty_station };
    }
    namespace OMNI {
        let unit_care_info_1: boolean;
        export { unit_care_info_1 as unit_care_info };
        let water_amount_3: string[];
        export { water_amount_3 as water_amount };
        let round_mop_info_3: boolean;
        export { round_mop_info_3 as round_mop_info };
        let air_drying_3: boolean;
        export { air_drying_3 as air_drying };
        let auto_empty_station_3: boolean;
        export { auto_empty_station_3 as auto_empty_station };
    }
    namespace TURBO {
        let unit_care_info_2: boolean;
        export { unit_care_info_2 as unit_care_info };
        let water_amount_4: string[];
        export { water_amount_4 as water_amount };
        let round_mop_info_4: boolean;
        export { round_mop_info_4 as round_mop_info };
        let air_drying_4: boolean;
        export { air_drying_4 as air_drying };
        let auto_empty_station_4: boolean;
        export { auto_empty_station_4 as auto_empty_station };
    }
    namespace PLUS {
        let unit_care_info_3: boolean;
        export { unit_care_info_3 as unit_care_info };
        let water_amount_5: string[];
        export { water_amount_5 as water_amount };
        let round_mop_info_5: boolean;
        export { round_mop_info_5 as round_mop_info };
        let air_drying_5: boolean;
        export { air_drying_5 as air_drying };
        let auto_empty_station_5: boolean;
        export { auto_empty_station_5 as auto_empty_station };
    }
}
//# sourceMappingURL=capabilityTypes.d.ts.map