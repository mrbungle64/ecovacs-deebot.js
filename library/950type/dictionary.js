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
    'entrust': 'entrust'
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
    'entrust': 'entrust'
};

exports.GOCHARGING_REASONS = {
    'workComplete': 'workComplete',
    'cleaningCloth': 'cleaningCloth',
    'none': 'none'
};

exports.CLEAN_SPEED_TO_ECOVACS = {
    1: 1000,  //silent
    2: 0,     //normal
    3: 1,     //high
    4: 2      //very high
};

exports.CLEAN_SPEED_FROM_ECOVACS = {
    1000: 1, //silent
    0: 2,    //normal
    1: 3,    //high
    2: 4     //very high
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
    'dModule': 'air_freshener'
};

exports.MOVE_ACTION = {
    'backward': 'backward',
    'forward': 'forward',
    'left': 'SpinLeft',
    'right': 'SpinRight',
    'turn_around': 'trunAround',
    'stop': 'stop'
};
