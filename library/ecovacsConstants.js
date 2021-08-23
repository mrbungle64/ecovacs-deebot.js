exports.CLIENT_KEY = "1520391301804";
exports.SECRET = "6c319b2a5cd3e66e39159c2e28f2fce9";
exports.AUTH_CLIENT_KEY = '1520391491841';
exports.AUTH_CLIENT_SECRET = '77ef58ce3afbe337da74aa8c5ab963a9';

exports.MAIN_URL_FORMAT = 'https://gl-{country}-api.ecovacs.com/v1/private/{country}/{lang}/{deviceId}/{appCode}/{appVersion}/{channel}/{deviceType}';
exports.PORTAL_URL_FORMAT = 'https://portal-{continent}.ecouser.net/api';
exports.PORTAL_URL_FORMAT_CN = 'https://portal.ecouser.net/api/';
exports.PORTAL_GLOBAL_AUTHCODE = 'https://gl-{country}-openapi.ecovacs.com/v1/global/auth/getAuthCode';

exports.USERSAPI = 'users/user.do';
// IOT Device Manager - This provides control of "IOT" products via RestAPI
exports.IOTDEVMANAGERAPI = 'iot/devmanager.do';
exports.LGLOGAPI = 'lg/log.do';
// Leaving this open, the only endpoint known currently is "Product IOT Map"
// pim/product/getProductIotMap - This provides a list of "IOT" products.  Not sure what this provides the app.
exports.PRODUCTAPI = 'pim/product';
exports.REALM = 'ecouser.net';
exports.APPAPI = 'appsvr/app.do';

exports.MAPINFOTYPE_TO_ECOVACS = {
    "outline": "ol",
    "wifiHeatMap": "st",
    "ai": "ai",
    "workarea": "wa"
};

exports.MAPINFOTYPE_FROM_ECOVACS = {
    "ol": "outline",
    "st": "wifiHeatMap",
    "ai": "ai",
    "wa": "workarea"
};
