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

        api.logInfo(`Devices: ${JSON.stringify(devices)}`);
        let vacuum = devices[deviceNumber];
        api.logInfo(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum);

        // Once the session has started the airbot will fire a "ready" event.
        // At this point you can request information from your vacuum or send actions to it.
        vacbot.on('ready', () => {
            api.logInfo('airbot ready');

            vacbot.on('AirQuality', (obj) => {
                api.logInfo('AirQuality object: ' + JSON.stringify(obj));
                api.logInfo('Particulate Matter 25 (PM25): ' + obj.particulateMatter25 + 'μg/m3');
                api.logInfo('Particulate Matter 10 (PM10): ' + obj.particulateMatter10 + 'μg/m3');
                api.logInfo('Air Quality Index: ' + obj.airQualityIndex);
                api.logInfo('Volatile Organic Compounds Index: ' + obj.volatileOrganicCompounds);
                api.logInfo('Temperature: ' + obj.temperature + '°C');
                api.logInfo('Humidity: ' + obj.humidity + '%');
            });

            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');
            vacbot.run('GetSleepStatus');

            //vacbot.run('Clean_V2');

            // Clean air at position 0,0 (position of charge dock)
            //vacbot.run('SinglePoint_V2', '0,0');

            // Enable UV-Cleaner
            // vacbot.run('SetUVCleaner', 0);

            // Set target humidity to 55 (and enable himidification)
            // vacbot.run('SetHumidifierLevel', 55, 1);

            // Enable freshener and set itensity to medium
            // vacbot.run('SetFreshenerLevel', 2, 1);

            vacbot.run('GetAirQuality');
            //vacbot.run('GetAirSpeed');
            //vacbot.run('GetHumidity');
            //vacbot.run('GetTemperature');
        });
        vacbot.connect();

        //
        // Catch ctrl-c to exit program
        //
        process.on('SIGINT', function () {
            api.logInfo('\nGracefully shutting down from SIGINT (Ctrl+C)');
            disconnect();
        });

        function disconnect() {
            (async () => {
                try {
                    await vacbot.disconnectAsync();
                    api.logEvent("Exiting...");
                    process.exit();
                } catch (e) {
                    api.logError('Failure in disconnecting: ', e.message);
                }
            })();
        }
    });
}).catch((e) => {
    api.logError(`Failure in connecting: ${e.message}`);
});
