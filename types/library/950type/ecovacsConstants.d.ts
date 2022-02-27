export namespace CLEAN_MODE_TO_ECOVACS {
    const auto: string;
    const edge: string;
    const spot: string;
    const spotArea: string;
    const stop: string;
    const customArea: string;
}
export namespace CLEAN_ACTION_TO_ECOVACS {
    export const start: string;
    export const pause: string;
    export const resume: string;
    const stop_1: string;
    export { stop_1 as stop };
}
export namespace CLEAN_MODE_FROM_ECOVACS {
    const auto_1: string;
    export { auto_1 as auto };
    const customArea_1: string;
    export { customArea_1 as customArea };
    const spot_1: string;
    export { spot_1 as spot };
    const spotArea_1: string;
    export { spotArea_1 as spotArea };
    const stop_2: string;
    export { stop_2 as stop };
    const pause_1: string;
    export { pause_1 as pause };
    export const goCharging: string;
    export const idle: string;
}
export var WATER_LEVEL_TO_ECOVACS: {
    1: number;
    2: number;
    3: number;
    4: number;
};
export var CLEAN_SPEED_TO_ECOVACS: {
    1: number;
    2: number;
    3: number;
    4: number;
};
export var CLEAN_SPEED_FROM_ECOVACS: {
    1000: number;
    0: number;
    1: number;
    2: number;
};
export namespace CHARGE_MODE_FROM_ECOVACS {
    export const going: string;
    export const slot_charging: string;
    const idle_1: string;
    export { idle_1 as idle };
}
export namespace COMPONENT_TO_ECOVACS {
    const main_brush: string;
    const side_brush: string;
    const filter: string;
}
export namespace COMPONENT_FROM_ECOVACS {
    const brush: string;
    const sideBrush: string;
    const heap: string;
}
export namespace MOVE_ACTION {
    export const backward: string;
    export const forward: string;
    export const left: string;
    export const right: string;
    export const turn_around: string;
    const stop_3: string;
    export { stop_3 as stop };
}
//# sourceMappingURL=ecovacsConstants.d.ts.map