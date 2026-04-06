'use strict';
module.exports = {
    ACCOUNT_ID: process.env.ECOVACS_ACCOUNT_ID,
    PASSWORD: process.env.ECOVACS_PASSWORD,
    COUNTRY_CODE: process.env.ECOVACS_COUNTRY_CODE || 'DE',
    DEVICE_NUMBER: process.env.ECOVACS_DEVICE_NUMBER || '0'
};
