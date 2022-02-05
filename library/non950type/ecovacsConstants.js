// These dictionaries convert to and from Ozmo's consts (which closely match what the UI and manuals use)
// to and from what the Ecovacs API uses (which are sometimes very oddly named and have random capitalization.)
exports.CLEAN_MODE_TO_ECOVACS = {
    'auto': 'auto',
    'edge': 'border',
    'spot': 'spot',
    'spot_area': 'SpotArea',
    'single_room': 'singleroom',
    'stop': 'stop'
};

exports.CLEAN_ACTION_TO_ECOVACS = {
    'start': 's',
    'pause': 'p',
    'resume': 'r',
    'stop': 'h',
};

exports.CLEAN_ACTION_FROM_ECOVACS = {
    's': 'start',
    'p': 'pause',
    'r': 'resume',
    'h': 'stop',
};

exports.CLEAN_MODE_FROM_ECOVACS = {
    'auto': 'auto',
    'border': 'edge',
    'spot': 'spot',
    'SpotArea': 'spot_area',
    'singleroom': 'single_room',
    'stop': 'stop',
    'going': 'returning'
};

exports.CLEAN_SPEED_TO_ECOVACS = {
    1: 'standard', // normal
    2: 'standard', // normal
    3: 'strong', // high
    4: 'strong' // high
};

exports.CLEAN_SPEED_FROM_ECOVACS = {
    'standard': 2, // normal
    'strong': 3 // high
};

exports.CHARGE_MODE_FROM_ECOVACS = {
    'Going': 'returning',
    'going': 'returning',
    'SlotCharging': 'charging',
    'slot_charging': 'charging',
    'WireCharging': 'charging',
    'Idle': 'idle',
    'idle': 'idle'
};

exports.COMPONENT_TO_ECOVACS = {
    'main_brush': 'Brush',
    'side_brush': 'SideBrush',
    'filter': 'DustCaseHeap'
};

exports.COMPONENT_FROM_ECOVACS = {
    'brush': 'main_brush',
    'side_brush': 'side_brush',
    'dust_case_heap': 'filter',
    'Brush': 'main_brush',
    'SideBrush': 'side_brush',
    'sideBrush': 'side_brush',
    'DustCaseHeap': 'filter',
    'heap': 'filter'
};

exports.ON_OFF_TO_ECOVACS = {
    'do_not_disturb': 'b',
    'continuous_cleaning': 'g',
    'silence_voice_report': 's'
};

exports.ON_OFF_FROM_ECOVACS = {
    'b': 'do_not_disturb',
    'g': 'continuous_cleaning',
    's': 'silence_voice_report'
};

exports.ACTION = {
    'backward': 'backward',
    'forward': 'forward',
    'left': 'SpinLeft',
    'right': 'SpinRight',
    'turn_around': 'trunAround',
    'stop': 'stop'
};

exports.STOP_REASON = {
    's': 'clean_successful',
    'r': 'battery_low',
    'a': 'stopped_by_app',
    'i': 'stopped_by_remote_control',
    'b': 'stopped_by_button',
    'w': 'stopped_by_warning',
    'f': 'stopped_by_no_disturb',
    'm': 'stopped_by_clearmap',
    'n': 'stopped_by_no_path',
    'u': 'stopped_by_not_in_map',
    'v': 'stopped_by_virtual_wall'
};

exports.TRIGGER = {
    'a': 'app',
    'i': 'remote_control',
    'b': 'button',
    's': 'schedule',
    'p': 'schedule_from_app',
    'q': 'schedule_from_device',
    'bp': 'pause_from_break',
    'dnd': 'pause_from_disturb',
    'e': 'error'
};
