'use strict';

const ecovacsDeebot = require('./../index');
const tools = require('./tools');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;
const nodeMachineId = require('node-machine-id');

let settingsFile = tools.getSettingsFile();

const accountId = settingsFile.ACCOUNT_ID;
const password = settingsFile.PASSWORD;
const countryCode = settingsFile.COUNTRY_CODE;
const deviceNumber = settingsFile.DEVICE_NUMBER;
const domain = settingsFile.AUTH_DOMAIN ? settingsFile.AUTH_DOMAIN : '';

// The passwordHash is a md5 hash of your Ecovacs password.
const passwordHash = EcoVacsAPI.md5(password);
// You need to provide a device ID uniquely identifying the machine you're using to connect
const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceNumber);

const api = new EcoVacsAPI(deviceId, countryCode, '', domain);

// This logs you in through the HTTP API and retrieves the required
// access tokens from the server side. This allows you to requests
// the devices linked to your account to prepare connectivity to your vacuum.
api.connect(accountId, passwordHash).then(() => {

    api.devices().then((devices) => {

        console.log(`Devices: ${JSON.stringify(devices)}`);
        let vacuum = devices[deviceNumber];
        console.log(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum);

        // Once the session has started the airbot will fire a "ready" event.
        // At this point you can request information from your vacuum or send actions to it.
        vacbot.on('ready', () => {
            console.log('\nairbot ready\n');

            vacbot.on('AirQuality', (obj) => {
                console.log('AirQuality object: ' + JSON.stringify(obj));
                console.log('Particulate Matter 25 (PM25): ' + obj.particulateMatter25 + 'μg/m3');
                console.log('Particulate Matter 10 (PM10): ' + obj.particulateMatter10 + 'μg/m3');
                console.log('Air Quality Index: ' + obj.airQualityIndex);
                console.log('Volatile Organic Compounds Index: ' + obj.volatileOrganicCompounds);
                console.log('Temperature: ' + obj.temperature + '°C');
                console.log('Humidity: ' + obj.humidity + '%');
            });

            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');
            vacbot.run('GetSleepStatus');

            //vacbot.run('Clean_V2');

            vacbot.run('GetAirQuality');
            //vacbot.run('GetAirSpeed');
            //vacbot.run('GetHumidity');
            //vacbot.run('GetTemperature');
        });
        vacbot.connect();
    });
}).catch((e) => {
    console.error(`Failure in connecting: ${e.message}`);
});
