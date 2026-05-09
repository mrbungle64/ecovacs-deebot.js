'use strict';

module.exports = require('./commands');


const tools = require('./tools');
const constants = require('./constants');

module.exports.getRequestUrl = function(ecovacs, command, params) {
    const apiPath = module.exports.getApiPath(command);
    let portalUrlFormat = constants.PORTAL_ECOUSER_API;
    if (ecovacs.country === 'CN') {
        portalUrlFormat = constants.PORTAL_ECOUSER_API_CN;
    } else if ((ecovacs.country === 'WW') || (ecovacs.continent.toUpperCase() === 'WW')) {
        portalUrlFormat = constants.PORTAL_ECOUSER_API_LEGACY;
    }
    let portalUrl = tools.formatString(portalUrlFormat + '/' + apiPath, { continent: ecovacs.continent });
    if (ecovacs.bot.is950type()) {
        if (ecovacs.bot.authDomain === constants.AUTH_DOMAIN_YD) {
            portalUrl = portalUrl + "?cv=1.94.76&t=a&av=1.3.0"; // yeedi
        } else {
            portalUrl = portalUrl + "?cv=1.94.78&t=a&av=2.2.4"; // Ecovacs
        }
        if (apiPath === constants.IOT_DEVMANAGER_PATH) {
            portalUrl = portalUrl + "&mid=" + params['toType'] + "&did=" + params['toId'] + "&td=" + params['td'] + "&u=" + params['auth']['userid'];
        }
    }
    return portalUrl;
};

module.exports.getRequestHeaders = function(ecovacs, params) {
    let headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(params))
    };
    if (ecovacs.bot.is950type()) {
        Object.assign(headers, {
            'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)'
        });
    }
    return headers;
};

module.exports.getRequestObject = function(ecovacs, command) {
    if (command.name === 'GetCleanLogs') {
        return module.exports.getCleanLogsCommandObject(ecovacs, command);
    }
    else {
        const payload = module.exports.getCommandPayload(command);
        return module.exports.getCommandRequestObject(ecovacs, command, payload);
    }
};

module.exports.getCommandPayload = function(command) {
    return {
        'header': {
            'pri': '1',
            'ts': Math.floor(Date.now()),
            'tzm': 480,
            'ver': '0.0.50'
        },
        'body': {
            'data': command.args
        }
    };
};

module.exports.getApiPath = function(command) {
    let api = constants.IOT_DEVMANAGER_PATH; // non 950 type models
    if (command.api) {
        api = command.api; // 950 type models or special paths (e.g. CleanLogs)
    }
    return api;
};

module.exports.getCommandRequestObject = function(ecovacs, command, payload) {
    return {
        'cmdName': command.name,
        'payload': payload,
        'payloadType': ecovacs.payloadType,
        'auth': module.exports.getAuthObject(ecovacs),
        'td': 'q',
        'toId': ecovacs.vacuum['did'],
        'toRes': ecovacs.vacuum['resource'],
        'toType': ecovacs.vacuum['class']
    };
};

module.exports.getCleanLogsCommandObject = function(ecovacs, command) {
    return {
        'auth': module.exports.getAuthObject(ecovacs),
        'did': ecovacs.vacuum['did'],
        'country': ecovacs.country,
        'td': command.name,
        'resource': ecovacs.vacuum['resource']
    };
};

module.exports.getAuthObject = function(ecovacs) {
    return {
        'realm': constants.REALM,
        'resource': ecovacs.resource,
        'token': ecovacs.secret,
        'userid': ecovacs.user,
        'with': 'users',
    };
};
