//const sucks = require('sucks');
const sucks = require('./../index');
const nodeMachineId = require('node-machine-id');
const EcoVacsAPI = sucks.EcoVacsAPI;
const VacBot = sucks.VacBot;

const account_id = "email@domain.com";
const password = "a1b2c3d4";
const countrycode = 'DE';

const password_hash = EcoVacsAPI.md5(password);
const device_id = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync());
const countries = sucks.countries;
const continent = countries[countrycode].continent.toLowerCase();
console.log(continent);

const api = new EcoVacsAPI(device_id, countrycode, continent);
api.connect(account_id, password_hash).then(() => {
    api.devices().then((devices) => {
        let vacuum = devices[0];
        console.log(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
        vacbot.on('ready', (event) => {
            console.log('vacbot ready');

            vacbot.on('ChargeState', (state) => {
                console.log('[app2.js] ChargeState: ' + state);
            });
            vacbot.on('FanSpeed', (speed) => {
                console.log('[app2.js] FanSpeed: ' + speed);
            });
            vacbot.on('CleanReport', (state) => {
                console.log('[app2.js] CleanReport: ' + state);
            });
            vacbot.on('BatteryInfo', (batterystatus) => {
                let battery = Math.round(batterystatus);
                console.log('[app2.js] BatteryInfo: ' + battery);
            });
            vacbot.on('LifeSpan_filter', (level) => {
                console.log('[app2.js] filter: ' + Math.round(level));
            });
            vacbot.on('LifeSpan_main_brush', (level) => {
                console.log('[app2.js] main_brush: ' + Math.round(level));
            });
            vacbot.on('LifeSpan_side_brush', (level) => {
                console.log('[app2.js] side_brush: ' + Math.round(level));
            });
            vacbot.on('WaterLevel', (level) => {
                console.log('[app2.js] water level: ' + level);
            });
            vacbot.on('WaterBoxInfo', (level) => {
                console.log('[app2.js] waterBoxInfo: ' + level);
            });
            vacbot.on('DustCaseInfo', (value) => {
                console.log('[app2.js] DustCaseInfo: ' + value);
            });
            vacbot.on('Error', (value) => {
                console.log('[app2.js] Error: ' + value);
            });
        });
        vacbot.connect_and_wait_until_ready();

        console.log('[app2.js] isKnownDevice: ' + vacbot.isKnownDevice());
        console.log('[app2.js] isSupportedDevice: ' + vacbot.isSupportedDevice());
        console.log('[app2.js] name: ' + vacbot.getDeviceProperty('name'));
        console.log('[app2.js] hasMainBrush: ' + vacbot.hasMainBrush());
        console.log('[app2.js] hasSpotAreas: ' + vacbot.hasSpotAreas());
        console.log('[app2.js] hasCustomAreas: ' + vacbot.hasCustomAreas());
        console.log('[app2.js] hasMoppingSystem: ' + vacbot.hasMoppingSystem());
        console.log('[app2.js] hasVoiceReports: ' + vacbot.hasVoiceReports());

        setTimeout(() => {
            vacbot.run('Clean');
            if (vacbot.hasMainBrush()) {
                vacbot.run('GetLifeSpan', 'main_brush');
            }
            vacbot.run('GetLifeSpan', 'side_brush');
            vacbot.run('GetLifeSpan', 'filter');
            vacbot.run('GetCleanLogs');
        }, 6000);

        setInterval(() => {
            vacbot.run('GetCleanState');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');
            if (vacbot.hasMoppingSystem()) {
                vacbot.run('GetWaterLevel');
            }
        }, 60000);

            //
            // Catch ctrl-c to exit program
            //
            process.on('SIGINT', function() {
                console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
                disconnect();
            });

            function disconnect() {
                try {
                    vacbot.disconnect();
                } catch (e) {
                    console.log('Failure in disconnecting: ', e.message);
                }
                console.log("Exiting...");
                process.exit();
            }
    });
}).catch((e) => {
    console.log('Failure in connecting: ', e.message);
});
