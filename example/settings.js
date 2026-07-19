'use strict';
module.exports = {
    ACCOUNT_ID: process.env.ECOVACS_ACCOUNT_ID,
    PASSWORD: process.env.ECOVACS_PASSWORD,
    COUNTRY_CODE: process.env.ECOVACS_COUNTRY_CODE || 'DE',
    DEVICE_NUMBER: process.env.ECOVACS_DEVICE_NUMBER || '0',
    // Optional fixed client device id — the identity of THIS client (app/library
    // instance) that Ecovacs binds device verification to (the `{deviceId}` in the
    // API path), NOT the robot's `did`. It is account-level: one stable value
    // covers all vacuums of the account. Set it so Ecovacs does not treat every
    // start as a new device (which re-triggers verification) — important in
    // ephemeral/Docker containers where the derived machine id changes each run.
    // When empty, the id is derived from the host machine id (stable on a real
    // host, but not across fresh containers).
    // `ECOVACS_DEVICE_ID` is a deprecated alias kept for backward compatibility.
    CLIENT_DEVICE_ID: process.env.ECOVACS_CLIENT_DEVICE_ID || process.env.ECOVACS_DEVICE_ID || ''
};
