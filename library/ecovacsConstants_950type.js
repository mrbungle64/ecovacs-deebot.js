// These dictionaries convert to and from Ozmo's consts (which closely match what the UI and manuals use)
// to and from what the Ecovacs API uses (which are sometimes very oddly named and have random capitalization.)
exports.CLEAN_MODE_TO_ECOVACS = {
    'auto': 'auto',
    'edge': 'edge',
    'spot': 'spot',
    'spotArea': 'spotArea',
    //'single_room': 'singleroom', //REM
    'stop': 'stop',
    'customArea': 'customArea'
};

exports.CLEAN_ACTION_TO_ECOVACS = {
    'start': 'start',
    'pause': 'pause',
    'resume': 'resume',
    'stop': 'stop',
};

// exports.CLEAN_ACTION_FROM_ECOVACS = {
//     's': 'start',
//     'p': 'pause',
//     'r': 'resume',
//     'h': 'stop',
// };

// exports.CLEAN_MODE_FROM_ECOVACS = {
//     'auto': 'auto',
//     'border': 'edge',
//     'spot': 'spot',
//     'SpotArea': 'spot_area',
//     'singleroom': 'single_room',
//     'stop': 'stop',
//     'going': 'returning'
// };


exports.FAN_SPEED_TO_ECOVACS = {
    'normal': '0',
    'high': '1',
    'veryhigh': '2',
    'silent': '1000'
};

exports.WATER_LEVEL_TO_ECOVACS = {
    'low': '1',
    'medium': '2',
    'high': '3',
    'max': '4'
};

exports.WATER_LEVEL_FROM_ECOVACS = {
    '1': 'low',
    '2': 'medium',
    '3': 'high',
    '4': 'max'
};

exports.FAN_SPEED_FROM_ECOVACS = {
    '0': 'normal',
    '1': 'high',
    '2': 'veryhigh',
    '1000': 'silent'
};

exports.CHARGE_MODE_TO_ECOVACS = {
    'return': 'go',
    'returning': 'returning',
    'charging': 'charging',
    'idle': 'idle'
};

exports.CHARGE_MODE_FROM_ECOVACS = {
    'going': 'returning',
    'slot_charging': 'charging',
    'idle': 'idle'
};

exports.COMPONENT_TO_ECOVACS = {
    'main_brush': 'brush',
    'side_brush': 'sideBrush',
    'filter': 'heap'
};

exports.COMPONENT_FROM_ECOVACS = {
    'brush': 'main_brush',
    'sideBrush': 'side_brush',
    'heap': 'filter'
};

exports.COMMAND_TO_ECOVACS = {
    'Clean': 'clean',
    'Charge': 'charge',
    'SetTime': 'setTime',
    'PlaySound': 'playSound',
    'GetLifeSpan': 'getLifeSpan',
    'GetBatteryInfo': 'getBattery',
    'GetCleanState': 'getCleanInfo',
    'GetCleanSpeed': 'getCleanSpeed',
    'GetChargeState': 'getChargeState',
    'GetWaterBoxInfo': 'getWaterInfo',
    'GetWaterPermeability': 'getWaterInfo',
    'SetWaterPermeability': 'setWaterInfo'
};
