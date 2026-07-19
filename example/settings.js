'use strict';
module.exports = {
    ACCOUNT_ID: process.env.ECOVACS_ACCOUNT_ID,
    PASSWORD: process.env.ECOVACS_PASSWORD,
    COUNTRY_CODE: process.env.ECOVACS_COUNTRY_CODE || 'DE',
    DEVICE_NUMBER: process.env.ECOVACS_DEVICE_NUMBER || '0',
    // Optional stable machine identity for this client — replaces the
    // auto-detected host machine id in the device-id derivation. Still combined
    // with DEVICE_NUMBER via getDeviceId() so that multiple instances sharing
    // the same value but addressing different robots get distinct MQTT client
    // identities. Set it so Ecovacs does not treat every start as a new device
    // (which re-triggers verification) — important in ephemeral/Docker containers
    // where the auto-detected machine id changes each run.
    // `ECOVACS_DEVICE_ID` is a deprecated alias kept for backward compatibility.
    CLIENT_DEVICE_ID: process.env.ECOVACS_CLIENT_DEVICE_ID || process.env.ECOVACS_DEVICE_ID || ''
};
