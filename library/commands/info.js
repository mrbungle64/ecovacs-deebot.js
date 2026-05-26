'use strict';

const tools = require('../tools');
const constants = require('../constants');
const constants_type = require('../dictionary');
const { VacBotCommand } = require('./base');

/**
 * Requests information about the battery level
 * @extends VacBotCommand
 */
class GetBatteryState extends VacBotCommand {
    constructor() {
        super('getBattery');
    }

    /**
     * @param {{ value: number, isLow?: number }} payload
     * @returns {{ level: number, isLow: boolean }}
     */
    parseResponse(payload) {
        const level = payload['value'];
        const isLow = payload.hasOwnProperty('isLow')
            ? !!Number(payload['isLow'])
            : level <= 15;
        return { level, isLow };
    }
}

/**
 * Requests information about the consumable components
 * You can specify the components or
 * send an empty array to request information for all components
 * (not sure if the empty array works for all models)
 * @extends VacBotCommand
 */
class GetLifeSpan extends VacBotCommand {
    /**
     * @param {Array} componentsArray - An optional array of components
     */
    constructor(componentsArray = []) {
        super('getLifeSpan', componentsArray);
    }

    /**
     * @param {Array} payload
     * @returns {Object}
     */
    parseResponse(payload) {
        const dictionary = require('../dictionary');
        const components = {};
        for (const entry of payload) {
            if (entry) {
                const type = entry['type'];
                const component = dictionary.COMPONENT_FROM_ECOVACS[type] || type;
                const left = Number(entry['left']);
                const total = Number(entry['total']) || 1;
                const percent = Number(((left / total) * 100).toFixed(2));
                components[component] = {
                    left: left,
                    total: total,
                    percent: percent
                };
            }
        }
        return components;
    }
}

/**
 * Requests the 'Error' messages
 * In most cases it doesn't respond (if there's no error)
 * @extends VacBotCommand
 */
class GetError extends VacBotCommand {
    constructor() {
        super('getError');
    }

    /**
     * @param {Object} payload
     * @returns {{ code: number, description: string }}
     */
    parseResponse(payload) {
        const errorCodes = require('../errorCodes.json').errorCodes;
        let code = payload['code'];
        if (Array.isArray(code)) {
            code = code.length > 0 ? code[code.length - 1] : 0;
        }
        const codeStr = String(code || 0);
        let description = errorCodes[codeStr];
        if (!description) {
            description = `unknown errorCode: ${codeStr}`;
        }
        if (codeStr === '1' && payload['error']) {
            description = `${description}: ${payload['error']}`;
        }
        return {
            code: Number(codeStr),
            description: description
        };
    }
}

/**
 * Requests the 'Water Flow Level'
 * @extends VacBotCommand
 */
class GetWaterInfo extends VacBotCommand {
    constructor() {
        super('getWaterInfo');
    }

    /**
     * @param {{ amount: number, enable: number, type?: number, sweepType?: number }} payload
     * @returns {{ waterLevel: number, waterboxInfo: number, moppingType?: number, scrubbingType?: number }}
     */
    parseResponse(payload) {
        const result = {
            waterLevel: payload['amount'],
            waterboxInfo: payload['enable']
        };
        if (payload.hasOwnProperty('type')) {
            result.moppingType = payload['type'];
        }
        if (payload.hasOwnProperty('sweepType')) {
            result.scrubbingType = payload['sweepType'];
        }
        return result;
    }
}

/**
 * Requests information about the connected network and Wi-Fi
 * @extends VacBotCommand
 */
class GetNetInfo extends VacBotCommand {
    constructor() {
        super('getNetInfo');
    }

    /**
     * @param {{ ip?: string, wi?: string, ssid?: string, s?: string, rssi?: number, st?: number, mac?: string, wm?: string }} payload
     * @returns {{ ip: string, wifiSSID: string, wifiSignal: number, mac: string }}
     */
    parseResponse(payload) {
        return {
            ip: payload['ip'] || payload['wi'],
            wifiSSID: payload['ssid'] || payload['s'],
            wifiSignal: payload['rssi'] || payload['st'],
            mac: payload['mac'] || payload['wm']
        };
    }
}

/**
 * Request information about if the bot is
 * in (energy saving) sleeping mode
 * @extends VacBotCommand
 */
class GetSleepStatus extends VacBotCommand {
    constructor() {
        super('getSleep');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Request the volume value
 * @extends VacBotCommand
 */
class GetVolume extends VacBotCommand {
    constructor() {
        super('getVolume');
    }

    /** @param {{ volume: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['volume'];
    }
}

/**
 * Request information if the 'Auto Empty' option is enabled
 * Used by models with Auto Empty Station
 * @extends VacBotCommand
 */
class GetAutoEmpty extends VacBotCommand {
    constructor() {
        super('getAutoEmpty');
    }

    /**
     * @param {{ enable: number, status?: number }} payload
     * @returns {{ enabled: boolean, status?: number }}
     */
    parseResponse(payload) {
        const result = { enabled: Boolean(payload['enable']) };
        if (payload.hasOwnProperty('status')) {
            result.status = payload['status'];
        }
        return result;
    }
}

/**
 * Represents a command to empty the dust bin
 * of the Auto Empty Station
 * @extends VacBotCommand
 * TODO: potential duplicate of SetAutoEmpty (settings.js)
 */
class EmptyDustBin extends VacBotCommand {
    constructor() {
        super('setAutoEmpty', {
            'act': 'start'
        });
    }
}

/**
 * Empty dust bin (e.g. T20 series)
 * `EmptyDustBinSA` = 'EmptyDustBinStationAction'
 * @extends VacBotCommand
 * TODO: potential duplicate of StationAction (settings.js)
 */
class EmptyDustBinSA extends VacBotCommand {
    constructor() {
        super('stationAction', {
            'act': 1,
            'type': 1
        });
    }
}

/**
 * Request information if the 'Do Not Disturb' option is enabled
 * @extends VacBotCommand
 */
class GetDoNotDisturb extends VacBotCommand {
    constructor() {
        super('getBlock');
    }

    /**
     * @param {{ enable: number, start?: string, end?: string }} payload
     * @returns {{ enabled: boolean, blockTime?: { from: string, to: string } }}
     */
    parseResponse(payload) {
        const result = { enabled: Boolean(payload['enable']) };
        if (payload.hasOwnProperty('start')) {
            result.blockTime = { from: payload['start'], to: payload['end'] };
        }
        return result;
    }
}

/**
 * Request information if the 'Advanced Mode' option is enabled
 * @extends VacBotCommand
 */
class GetAdvancedMode extends VacBotCommand {
    constructor() {
        super('getAdvancedMode');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (T8 and T9 series, e.g. T8 AIVI)
 * @extends VacBotCommand
 */
class GetRecognization extends VacBotCommand {
    constructor() {
        super('getRecognization');
    }

    /**
     * @param {{ state: number|boolean }} payload
     * @returns {boolean}
     */
    parseResponse(payload) {
        return !!payload['state'];
    }
}

/**
 * Request information if (depending on model)
 * 'True Detect' or 'AIVI 3D'/'AIVI Smart Recognition' is enabled
 * (newer models e.g. X1 series)
 * @extends VacBotCommand
 */
class GetTrueDetect extends VacBotCommand {
    constructor() {
        super('getTrueDetect');
    }

    /**
     * @param {{ enable: number }} payload
     * @returns {boolean}
     */
    parseResponse(payload) {
        return !!payload['enable'];
    }
}

/**
 * Request information about if 'Cleaning Cloth Reminder' is enabled
 * @extends VacBotCommand
 */
class GetDusterRemind extends VacBotCommand {
    constructor() {
        super('getDusterRemind');
    }

    /**
     * @param {{ enable: number, period: number }} payload
     * @returns {{ enabled: boolean, period: number }}
     */
    parseResponse(payload) {
        return {
            enabled: Boolean(payload['enable']),
            period: payload['period']
        };
    }
}

/**
 * Request the value whether the 'Auto-Boost Suction' is enabled
 * @extends VacBotCommand
 */
class GetCarpetPressure extends VacBotCommand {
    constructor() {
        super('getCarpertPressure');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Request the value of the 'Carpet cleaning strategy' option
 * @extends VacBotCommand
 */
class GetCarpetInfo extends VacBotCommand {
    constructor() {
        super('getCarpetInfo');
    }

    /** @param {{ mode: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['mode'];
    }
}

/**
 * Receive information about the station (e.g. X1 series)
 * e.g. the state of 'Air Drying', 'Mopping Pads Cleaning' etc.
 * @extends VacBotCommand
 */
class GetStationState extends VacBotCommand {
    constructor() {
        super('getStationState');
    }

    /**
     * @param {Object} payload
     * @returns {{ type: number, state: number, isAirDrying: boolean, isSelfCleaning: boolean, isActive: boolean }}
     */
    parseResponse(payload) {
        let type = 0;
        let state = 0;
        if (payload.hasOwnProperty('content')) {
            type = payload['content']['type'];
        }
        if (payload.hasOwnProperty('state')) {
            state = payload['state'];
        }
        return {
            'type': type,
            'state': state,
            'isAirDrying': Boolean((type === 2) && state),
            'isSelfCleaning': Boolean((type === 3) && state),
            'isActive': Boolean(state)
        };
    }
}

/**
 * Receive information about the station (e.g. X1 series)
 * e.g. model, firmware etc.
 * @extends VacBotCommand
 */
class GetStationInfo extends VacBotCommand {
    constructor() {
        super('getStationInfo');
    }

    /**
     * @param {Object} payload
     * @returns {{ state: number|string, name: string, model: string, sn: string, wkVer: string }}
     */
    parseResponse(payload) {
        return {
            state: payload.state,
            name: payload.name,
            model: payload.model,
            sn: payload.sn,
            wkVer: payload.wkVer
        };
    }
}

/**
 * Receive the value of the 'Cleaning Interval' (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetWashInterval extends VacBotCommand {
    constructor() {
        super('getWashInterval');
    }

    /** @param {{ interval: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['interval'];
    }
}

/**
 * Request the value whether hot water
 * is used for cleaning the mopping pads (e.g. T20 series)
 * @extends VacBotCommand
 */
class GetWashInfo extends VacBotCommand {
    constructor() {
        super('getWashInfo');
    }

    /**
     * @param {{ mode: number }} payload
     * @returns {number}
     */
    parseResponse(payload) {
        return payload['mode'];
    }
}

/**
 * Receive the value if 'Air Drying' is active (Yeedi Mop Station)
 * The typo in 'AirDring' is intended
 * @extends VacBotCommand
 */
class GetAirDrying extends VacBotCommand {
    constructor() {
        super('getAirDring');
    }

    /**
     * @param {{ status: number|string }} payload
     * @returns {string|null}
     */
    parseResponse(payload) {
        const status = parseInt(payload['status']);
        if (status === 1) {
            return 'airdrying';
        } else if (status === 2) {
            return 'idle';
        }
        return null;
    }
}

/**
 * Start und Stop 'Air Drying' (e.g. X1 series)
 * 1 = start
 * 4 = stop
 * @extends VacBotCommand
 */
class Drying extends VacBotCommand {
    constructor(act) {
        super('stationAction', {
            'act': act,
            'type': 2
        });
    }
}

class GetDryingDuration extends VacBotCommand {
    constructor() {
        super('getDryingDuration');
    }

    /**
     * @param {{ duration: number }} payload
     * @returns {number}
     */
    parseResponse(payload) {
        return payload['duration'];
    }
}

/**
 * Requests the value whether the 'Edge Deep Cleaning' option is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetBorderSpin extends VacBotCommand {
    constructor() {
        super('getBorderSpin');
    }

    /** @param {{ enable: number, type: number }} payload @returns {boolean|null} */
    parseResponse(payload) {
        return payload['type'] ? Boolean(payload['enable']) : null;
    }
}

/**
 * Requests the value whether the 'Border Switch' is enabled
 * @extends VacBotCommand
 */
class GetBorderSwitch extends VacBotCommand {
    constructor() {
        super('getBorderSwitch');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Requests information about the Firmware
 * and 'Over The Air' updates (e.g. X1 series, Airbot Z1)
 * (e.g. version, status, progress)
 * @extends VacBotCommand
 */
class GetOta extends VacBotCommand {
    constructor() {
        super('getOta');
    }

    /**
     * @param {Object} payload
     * @returns {{ supportAuto: boolean, autoSwitch: boolean, version: string, status: string, progress: string|number }}
     */
    parseResponse(payload) {
        return {
            supportAuto: !!payload['supportAuto'],
            autoSwitch: !!payload['autoSwitch'],
            version: payload['ver'],
            status: payload['status'],
            progress: payload['progress']
        };
    }
}

/**
 * Request the current relocation state
 * @extends VacBotCommand
 */
class GetRelocationState extends VacBotCommand {
    constructor() {
        super('getRelocationState');
    }

    /**
     * @param {{ state: string }} payload
     * @returns {{ status: Object, state: string }}
     */
    parseResponse(payload) {
        return {
            status: payload,
            state: payload['state']
        };
    }
}

/**
 * Requests the value whether the 'Mop-Only' mode is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetSweepMode extends VacBotCommand {
    constructor() {
        super('getSweepMode');
    }

    /**
     * @param {{ type: number }} payload
     * @returns {boolean}
     */
    parseResponse(payload) {
        return Boolean(payload['type']);
    }
}

/**
 * Requests the value whether 'YIKO' is enabled (e.g. X1 series)
 * @extends VacBotCommand
 */
class GetVoiceAssistantState extends VacBotCommand {
    constructor() {
        super('getVoiceAssistantState');
    }

    /** @param {{ enable?: number, state?: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable'] ?? payload['state']);
    }
}

/**
 * Requests the 'Cleaning Mode' (e.g. T20 series)
 * @extends VacBotCommand
 */
class GetWorkMode extends VacBotCommand {
    constructor() {
        super('getWorkMode');
    }

    /**
     * @param {{ mode: number }} payload
     * @returns {number}
     */
    parseResponse(payload) {
        return payload['mode'];
    }
}

/**
 * Request information about the work status
 * @extends VacBotCommand
 */
class GetWorkState extends VacBotCommand {
    constructor() {
        super('getWorkState');
    }

    /** @param {{ state: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['state'];
    }
}

/**
 * Request information about the 'Scheduled Cleaning' tasks
 * @extends VacBotCommand
 */
class GetSchedule extends VacBotCommand {
    constructor() {
        super('getSched');
    }

    /** @param {Object} payload @returns {Array} */
    parseResponse(payload) {
        return payload['schedules'] || payload['list'] || [];
    }
}

/**
 * Request information about the 'Scheduled Cleaning' tasks
 * Used by newer models
 * @extends VacBotCommand
 */
class GetSchedule_V2 extends VacBotCommand {
    constructor() {
        super('getSched_V2', {
            type: 1
        });
    }
}

/**
 * Request information about the total stats
 * total square meters ('area'), total seconds ('time'), total number ('count')
 * @extends VacBotCommand
 * TODO: potential duplicate of GetCleanSum (clean.js)
 */
class GetTotalStats extends VacBotCommand {
    constructor() {
        super('getTotalStats');
    }

    /**
     * @param {{ area: number, time: number, count: number }} payload
     * @returns {{ totalSquareMeters: number, totalSeconds: number, totalNumber: number }}
     */
    parseResponse(payload) {
        return {
            totalSquareMeters: parseInt(payload['area']),
            totalSeconds: parseInt(payload['time']),
            totalNumber: parseInt(payload['count'])
        };
    }
}

/**
 * Request information about the stats
 * @extends VacBotCommand
 */
class GetStats extends VacBotCommand {
    constructor() {
        super('getStats');
    }

    /**
     * @param {{ area: number, time: number, type: string }} payload
     * @returns {{ cleanedArea: number, cleanedSeconds: number, cleanType: string }}
     */
    parseResponse(payload) {
        return {
            cleanedArea: payload['area'],
            cleanedSeconds: payload['time'],
            cleanType: payload['type']
        };
    }
}

/**
 * Request information about the
 * 'Customized Scenario Cleaning' scenarios (T20, X2 series)
 *
 * @extends VacBotCommand
 */
class GetQuickCommand extends VacBotCommand {
    constructor(type = '1,2') {
        super('getQuickCommand', {
            'type': type
        });
    }
}

/**
 * Request the 'WiFi List'
 * @extends VacBotCommand
 */
class GetWifiList extends VacBotCommand {
    constructor() {
        super('getWifiList');
    }

    /** @param {{ list: Array }} payload @returns {Array} */
    parseResponse(payload) {
        return payload['list'] || [];
    }
}

/**
 * Air quality (Z1 Air Quality Monitor)
 * @extends VacBotCommand
 */
class GetJCYAirQuality extends VacBotCommand {
    constructor() {
        super('getJCYAirQuality');
    }

    /**
     * Same structure as GetAirQuality — normalized into the same shape.
     * @param {Object} payload
     * @returns {{ particulateMatter25: number, particulateMatter10: number, airQualityIndex: number, volatileOrganicCompounds: number, temperature: number, humidity: number }}
     */
    parseResponse(payload) {
        const keys = Object.keys(payload);
        const data = payload['pm25'] ? payload : payload[keys[0]];
        const result = {
            particulateMatter25: data['pm25'],
            particulateMatter10: data['pm10'],
            airQualityIndex: data['aq'],
            volatileOrganicCompounds: data['voc'],
            temperature: data['tem'],
            humidity: data['hum']
        };
        if (data['voc_num'] !== undefined) {
            result.volatileOrganicCompounds_parts = data['voc_num'];
        }
        return result;
    }
}

/**
 * Air quality (Airbot Z1)
 * @extends VacBotCommand
 */
class GetAirQuality extends VacBotCommand {
    constructor() {
        super('getAirQuality');
    }

    /**
     * @param {Object} payload
     * @returns {{ particulateMatter25: number, particulateMatter10: number, airQualityIndex: number, volatileOrganicCompounds: number, temperature: number, humidity: number }}
     */
    parseResponse(payload) {
        const keys = Object.keys(payload);
        const data = payload['pm25'] ? payload : payload[keys[0]];
        const result = {
            particulateMatter25: data['pm25'],
            particulateMatter10: data['pm10'],
            airQualityIndex: data['aq'],
            volatileOrganicCompounds: data['voc'],
            temperature: data['tem'],
            humidity: data['hum']
        };
        if (data['voc_num'] !== undefined) {
            result.volatileOrganicCompounds_parts = data['voc_num'];
        }
        return result;
    }
}

/**
 * Requests an object with data
 * for the 'Linked Purification' function
 * (linked to Air Quality Monitor)
 * @extends VacBotCommand
 */
class GetAirbotAutoModel extends VacBotCommand {
    constructor() {
        super('getAirbotAutoModel');
    }

    /**
     * @param {{ enable: number, trigger: string, aq?: { aqStart: number, aqEnd: number } }} payload
     * @returns {{ enable: number, trigger: string, aq?: { aqStart: number, aqEnd: number } }|null}
     */
    parseResponse(payload) {
        if (payload['aq'] && payload['aq']['aqStart'] && payload['aq']['aqEnd']) {
            return {
                enable: payload['enable'],
                trigger: payload['trigger'],
                aq: {
                    aqStart: payload['aq']['aqStart'],
                    aqEnd: payload['aq']['aqEnd']
                }
            };
        }
        return null;
    }
}

/**
 * Requests the enabled state of the 'Face to Me' option
 * @extends VacBotCommand
 */
class GetAngleFollow extends VacBotCommand {
    constructor() {
        super('getAngleFollow');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Requests the intensity of the 'Real-time Air Quality Display'
 * @extends VacBotCommand
 */
class GetAtmoLight extends VacBotCommand {
    constructor() {
        super('getAtmoLight');
    }

    /** @param {{ intensity: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['intensity'];
    }
}

/**
 * Requests the 'Volume' (0-16)
 * @extends VacBotCommand
 */
class GetAtmoVolume extends VacBotCommand {
    constructor() {
        super('getAtmoVolume');
    }

    /** @param {{ volume: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['volume'];
    }
}

/**
 * Request the enabled state of the 'Bluetooth Speaker'
 * @extends VacBotCommand
 */
class GetBlueSpeaker extends VacBotCommand {
    constructor() {
        super('getBlueSpeaker');
    }

    /**
     * @param {{ enable: number, time: number, name: string }} payload
     * @returns {{ enabled: boolean, time: number, name: string }}
     */
    parseResponse(payload) {
        return {
            enabled: Boolean(payload['enable']),
            time: payload['time'],
            name: payload['name']
        };
    }
}

/**
 * Request the enabled state of the 'Child Lock' option
 * @extends VacBotCommand
 */
class GetChildLock extends VacBotCommand {
    constructor() {
        super('getChildLock');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Request the enabled state for 'DrivingWheel'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
class GetDrivingWheel extends VacBotCommand {
    constructor() {
        super('getDrivingWheel');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Request the enabled state of the
 * 'Lab Features' => 'Follow Me'
 * @extends VacBotCommand
 */
class GetHumanoidFollow extends VacBotCommand {
    constructor() {
        super('getHumanoidFollow');
    }

    /**
     * @param {{ video: number, yiko: number }} payload
     * @returns {{ video: boolean, yiko: boolean }}
     */
    parseResponse(payload) {
        return {
            video: Boolean(payload['video']),
            yiko: Boolean(payload['yiko'])
        };
    }
}

/**
 * Request the Live Launch password state
 * Used by the Video Manager
 * @extends VacBotCommand
 */
class GetLiveLaunchPwdState extends VacBotCommand {
    constructor() {
        super('getLiveLaunchPwdState');
    }

    /**
     * @param {{ state: string, hasPwd: boolean }} payload
     * @returns {{ state: string, hasPwd: boolean }}
     */
    parseResponse(payload) {
        return {
            state: payload.state,
            hasPwd: payload.hasPwd
        };
    }
}

/**
 * Request the enabled state of the microphone
 * @extends VacBotCommand
 */
class GetMic extends VacBotCommand {
    constructor() {
        super('getMic');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Request the enabled state of the 'MonitorAirState'
 * TODO: improve documentation
 * @extends VacBotCommand
 */
class GetMonitorAirState extends VacBotCommand {
    constructor() {
        super('getMonitorAirState');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Request various information about the 'Purification Scenario'
 * @extends VacBotCommand
 */
class GetScene extends VacBotCommand {
    constructor() {
        super('getScene');
    }
}

/**
 * Request data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
class GetThreeModule extends VacBotCommand {
    constructor() {
        super('getThreeModule', []);
    }

    /**
     * Returns the raw payload (UV, Humidifier, AirFreshener levels).
     * Structure varies by module configuration.
     * @param {Object} payload
     * @returns {Object}
     */
    parseResponse(payload) {
        return payload;
    }
}

/**
 * Request status data for the 'Air freshener', 'Humidifier'
 * and the 'UV Sanitizer' modules
 * @extends VacBotCommand
 */
class GetThreeModuleStatus extends VacBotCommand {
    constructor() {
        super('getThreeModuleStatus');
    }

    /**
     * Returns the raw working status payload (UV, Humidifier, AirFreshener).
     * @param {Object} payload
     * @returns {Object}
     */
    parseResponse(payload) {
        return payload;
    }
}

/**
 * Request the 'Time Zone' value
 * @extends VacBotCommand
 */
class GetTimeZone extends VacBotCommand {
    constructor() {
        super('getTimeZone');
    }

    /** @param {{ tz: string }} payload @returns {string} */
    parseResponse(payload) {
        return payload['tz'];
    }
}

/**
 * Request enabled state for the 'VoiceLifeRemindState'
 * (No idea what function this refers to)
 * @extends VacBotCommand
 */
class GetVoiceLifeRemindState extends VacBotCommand {
    constructor() {
        super('getVoiceLifeRemindState');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Request enabled state for the 'Working Status Voice Report'
 * @extends VacBotCommand
 */
class GetVoiceSimple extends VacBotCommand {
    constructor() {
        super('getVoiceSimple');
    }

    /** @param {{ on: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['on']);
    }
}

/**
 * Request whether the robot mops across map borders (e.g. X1)
 * @extends VacBotCommand
 */
class GetCrossMapBorderWarning extends VacBotCommand {
    constructor() {
        super('getCrossMapBorderWarning');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Request the cut direction value (Lawn Mower)
 * @extends VacBotCommand
 */
class GetCutDirection extends VacBotCommand {
    constructor() {
        super('getCutDirection');
    }

    /** @param {{ angle: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['angle'];
    }
}

/**
 * Request information about the 'Fan Speed'
 * @extends VacBotCommand
 */
class GetFanSpeed extends VacBotCommand {
    constructor() {
        super('getSpeed');
    }

    /** @param {{ speed: number }} payload @returns {number} */
    parseResponse(payload) {
        return payload['speed'];
    }
}

/**
 * Request whether the 'Move Up Warning' is enabled
 * @extends VacBotCommand
 */
class GetMoveUpWarning extends VacBotCommand {
    constructor() {
        super('getMoveupWarning');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Requests information about the connected network and Wi-Fi (Legacy)
 * @extends VacBotCommand
 */
class GetNetInfoLegacy extends VacBotCommand {
    constructor() {
        super('GetNetInfo');
    }

    /**
     * Same payload shape as GetNetInfo — reuses the same normalization.
     * @param {{ ip?: string, wi?: string, ssid?: string, s?: string, rssi?: number, st?: number, mac?: string, wm?: string }} payload
     * @returns {{ ip: string, wifiSSID: string, wifiSignal: number, mac: string }}
     */
    parseResponse(payload) {
        return {
            ip: payload['ip'] || payload['wi'],
            wifiSSID: payload['ssid'] || payload['s'],
            wifiSignal: payload['rssi'] || payload['st'],
            mac: payload['mac'] || payload['wm']
        };
    }
}

/**
 * Request the safety protection status
 * @extends VacBotCommand
 */
class GetSafeProtect extends VacBotCommand {
    constructor() {
        super('getSafeProtect');
    }

    /** @param {{ enable: number }} payload @returns {boolean} */
    parseResponse(payload) {
        return Boolean(payload['enable']);
    }
}

/**
 * Request an array of cleaning log information
 * The `count` attribute seems to have no affect,
 * but it has to be set anyway
 * @extends VacBotCommand
 */
class GetCleanLogs extends VacBotCommand {
    constructor(count = 0) {
        super('GetCleanLogs',
            {
                'count': count
            },
            constants.CLEANLOGS_PATH);
    }

    /**
     * @param {Object} payload
     * @returns {Array<Object>}
     */
    parseResponse(payload) {
        const tools = require('../tools');
        let logs = [];
        if (payload.hasOwnProperty('logs')) {
            logs = payload['logs'];
        } else if (payload.hasOwnProperty('log')) {
            logs = payload['log'];
        } else if (payload.hasOwnProperty('data')) {
            logs = payload['data'];
        }
        const parsedLogs = [];
        for (const logEntry of logs) {
            if (logEntry) {
                const squareMeters = parseInt(logEntry['area']);
                const timestamp = Number(logEntry['ts']);
                const date = new Date(timestamp * 1000);
                const len = parseInt(logEntry['last']);
                const totalTimeString = tools.getTimeStringFormatted(len);
                const imageUrl = logEntry['imageUrl'];
                parsedLogs.push({
                    id: logEntry['id'],
                    squareMeters: squareMeters,
                    timestamp: timestamp,
                    date: date,
                    lastTime: len,
                    totalTime: len,
                    totalTimeFormatted: totalTimeString,
                    imageUrl: imageUrl,
                    type: logEntry['type'],
                    stopReason: logEntry['stopReason']
                });
            }
        }
        return parsedLogs;
    }
}

/**
 * Requests the 'Carpet Auto Fan Boost' state
 * @extends VacBotCommand
 */
class GetCarpetAutoFanBoost extends VacBotCommand {
    constructor() {
        super('getCarpertPressure');
    }

    /**
     * @param {{ enable: number }} payload
     * @returns {boolean}
     */
    parseResponse(payload) {
        return !!payload['enable'];
    }
}

/**
 * Requests the 'Efficiency Mode'
 * @extends VacBotCommand
 */
class GetEfficiencyMode extends VacBotCommand {
    constructor() {
        super('getEfficiency');
    }

    /**
     * @param {{ efficiency: number }} payload
     * @returns {number}
     */
    parseResponse(payload) {
        return payload['efficiency'];
    }
}

/**
 * Requests the 'Mop Auto Wash Frequency' (cleaning interval)
 * @extends VacBotCommand
 */
class GetMopAutoWashFrequency extends VacBotCommand {
    constructor() {
        super('getWashInfo');
    }

    /**
     * @param {{ interval: number }} payload
     * @returns {number}
     */
    parseResponse(payload) {
        return payload['interval'];
    }
}

module.exports = {
    GetBatteryState,
    GetLifeSpan,
    GetError,
    GetWaterInfo,
    GetNetInfo,
    GetSleepStatus,
    GetVolume,
    GetAutoEmpty,
    EmptyDustBin,
    EmptyDustBinSA,
    GetDoNotDisturb,
    GetAdvancedMode,
    GetRecognization,
    GetTrueDetect,
    GetDusterRemind,
    GetCarpetPressure,
    GetCarpetInfo,
    GetStationState,
    GetStationInfo,
    GetWashInterval,
    GetWashInfo,
    GetAirDrying,
    Drying,
    GetDryingDuration,
    GetBorderSpin,
    GetBorderSwitch,
    GetOta,
    GetRelocationState,
    GetSweepMode,
    GetVoiceAssistantState,
    GetWorkMode,
    GetWorkState,
    GetSchedule,
    GetSchedule_V2,
    GetTotalStats,
    GetStats,
    GetQuickCommand,
    GetWifiList,
    GetJCYAirQuality,
    GetAirQuality,
    GetAirbotAutoModel,
    GetAngleFollow,
    GetAtmoLight,
    GetAtmoVolume,
    GetBlueSpeaker,
    GetChildLock,
    GetDrivingWheel,
    GetHumanoidFollow,
    GetLiveLaunchPwdState,
    GetMic,
    GetMonitorAirState,
    GetScene,
    GetThreeModule,
    GetThreeModuleStatus,
    GetTimeZone,
    GetVoiceLifeRemindState,
    GetVoiceSimple,
    GetCrossMapBorderWarning,
    GetCutDirection,
    GetFanSpeed,
    GetMoveUpWarning,
    GetNetInfoLegacy,
    GetSafeProtect,
    GetCleanLogs,
    GetCarpetAutoFanBoost,
    GetEfficiencyMode,
    GetMopAutoWashFrequency,
};