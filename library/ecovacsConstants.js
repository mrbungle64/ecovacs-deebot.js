// noinspection SpellCheckingInspection

exports.CLIENT_KEY = "1520391301804";
exports.SECRET = "6c319b2a5cd3e66e39159c2e28f2fce9";
exports.AUTH_CLIENT_KEY = '1520391491841';
exports.AUTH_CLIENT_SECRET = '77ef58ce3afbe337da74aa8c5ab963a9';

exports.AUTH_DOMAIN = 'ecovacs.com';
exports.AUTH_DOMAIN_YD = 'yeedi.com';

exports.AUTH_GL_API = 'https://gl-{country}-api.{domain}/v1/private/{country}/{lang}/{deviceId}/{appCode}/{appVersion}/{channel}/{deviceType}';
exports.AUTH_GL_OPENAPI = 'https://gl-{country}-openapi.{domain}/v1';

exports.GLOBAL_GETAUTHCODE_PATH = 'global/auth/getAuthCode';
exports.GLOBAL_GETAUTHCODE_PATH_YD = 'agreement/getUserAcceptInfo';

exports.PORTAL_ECOUSER_API = 'https://portal-{continent}.ecouser.net/api';
exports.PORTAL_ECOUSER_API_CN = 'https://portal.ecouser.net/api/';

exports.USER_API_PATH = 'users/user.do';
exports.USER_LOGIN_PATH = 'user/login';
exports.USER_GETAUTHCODE_PATH = 'user/getAuthCode';
// IOT Device Manager - This provides control of "IOT" products via RestAPI
exports.IOT_DEVMANAGER_PATH = 'iot/devmanager.do';
exports.LG_LOG_PATH = 'lg/log.do';
// Leaving this open, the only endpoint known currently is "Product IOT Map"
// pim/product/getProductIotMap - This provides a list of "IOT" products.  Not sure what this provides the app.
exports.PIM_PRODUCT_PATH = 'pim/product';
exports.REALM = 'ecouser.net';
exports.APPSVR_APP_PATH = 'appsvr/app.do';
