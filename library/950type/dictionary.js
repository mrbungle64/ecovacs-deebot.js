// noinspection SpellCheckingInspection

// These dictionaries convert to and from this library's constants
// to and from what the Ecovacs API uses (which are sometimes very oddly named and have random capitalization)

exports.CLEAN_MODE_TO_ECOVACS = {
    'auto': 'auto',
    'edge': 'edge',
    'spot': 'spot',
    'spotArea': 'spotArea',
    'stop': 'stop',
    'customArea': 'customArea',
    'mapPoint': 'mapPoint',
    'singlePoint': 'singlePoint',
    'area': 'area',
    'move': 'move',
    'drying': 'drying',
    'washing': 'washing',
    'comeClean': 'comeClean',
    'entrust': 'entrust',
    'freeClean': 'freeClean'
};

exports.CLEAN_ACTION_TO_ECOVACS = {
    'start': 'start',
    'pause': 'pause',
    'resume': 'resume',
    'stop': 'stop'
};

exports.CLEAN_MODE_FROM_ECOVACS = {
    'auto': 'auto',
    'customArea': 'custom_area',
    'spot': 'spot',
    'spotArea': 'spot_area',
    'stop': 'stop',
    'pause': 'pause',
    'goCharging': 'returning',
    'idle': 'idle',
    'move': 'move',
    'singlePoint': 'singlePoint',
    'area': 'area',
    'drying': 'drying',
    'washing': 'washing',
    'comeClean': 'comeClean',
    'entrust': 'entrust',
    'freeClean': 'freeClean'
};

exports.GOCHARGING_REASONS = {
    'workComplete': 'workComplete',
    'cleaningCloth': 'cleaningCloth',
    'none': 'none'
};

exports.WORKMODE_TO_ECOVACS = {
    'vacuumAndMop': 0,  // Vacuum and mop
    'vacuum': 1,        // Vacuum only
    'mop': 2,           // Mop only
    'mopAfterVacuum': 3 // Mop after vacuum
};

exports.CLEAN_SPEED_TO_ECOVACS = {
    1: 1000,  // Silent, Quiet
    2: 0,     // Normal
    3: 1,     // High, Max
    4: 2      // Very High, Max Plus
};

exports.CLEAN_SPEED_FROM_ECOVACS = {
    1000: 1,
    0: 2,
    1: 3,
    2: 4
};

exports.CHARGE_MODE_FROM_ECOVACS = {
    'going': 'returning',
    'slot_charging': 'charging',
    'idle': 'idle'
};

exports.COMPONENT_TO_ECOVACS = {
    'main_brush': 'brush',
    'side_brush': 'sideBrush',
    'filter': 'heap',
    'unit_care': 'unitCare',
    'round_mop': 'roundMop',
    'air_freshener': 'dModule'
};

exports.COMPONENT_FROM_ECOVACS = {
    'brush': 'main_brush',
    'sideBrush': 'side_brush',
    'heap': 'filter',
    'unitCare': 'unit_care',
    'roundMop': 'round_mop',
    'dModule': 'air_freshener',
    'filter': 'filter',
    'uv': 'uv_sanitizer_module',
    'humidify': 'humidification_filter',
    'wbCare': 'humidification_maintenance'
};

exports.MOVE_ACTION = {
    'backward': 'backward',
    'forward': 'forward',
    'left': 'SpinLeft',
    'right': 'SpinRight',
    'turn_around': 'trunAround',
    'stop': 'stop'
};
