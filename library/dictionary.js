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
    'freeClean': 'freeClean',
    'qcClean': 'qcClean'
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
    'freeClean': 'freeClean',
    'qcClean': 'qcClean'
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

// Ecovacs uses a very inconsistent and non-sequential numbering scheme for suction power (clean speed) in their API.
// Historically, earlier devices likely only had "Normal" (0), and later introduced "Max" (1) and "Max Plus" (2).
// When "Silent/Quiet" was added below "Normal", they couldn't easily shift the scale, so it was awkwardly assigned the value 1000.
// This mapping translates these arbitrary Ecovacs API values into a logical, sequential order (1, 2, 3, 4) 
// so that integrations can easily work with a linear scale.
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
