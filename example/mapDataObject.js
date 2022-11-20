'use strict';

const ecovacsDeebot = require('./../index');
const tools = require('./tools');
const nodeMachineId = require('node-machine-id');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;

let settingsFile = tools.getSettingsFile();

const accountId = settingsFile.ACCOUNT_ID;
const password = settingsFile.PASSWORD;
const countryCode = settingsFile.COUNTRY_CODE;
const deviceNumber = settingsFile.DEVICE_NUMBER;
const domain = settingsFile.AUTH_DOMAIN ? settingsFile.AUTH_DOMAIN : '';

const passwordHash = EcoVacsAPI.md5(password);
const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceNumber);

const api = new EcoVacsAPI(deviceId, countryCode, '', domain);

let mapData = null;
let mapSpotAreaName = [];

api.connect(accountId, passwordHash).then(() => {
    api.devices().then((devices) => {
        let vacuum = devices[deviceNumber];
        console.log(vacuum);
        let vacbot = api.getVacBotObj(vacuum);
        vacbot.on('ready', () => {

            console.log('\nvacbot ready\n');

            vacbot.on('MapDataObject', (mapDataObject) => {
                console.log('MapDataObject:' + JSON.stringify(mapDataObject));
                mapData = Object.assign(mapDataObject[0]);
                for (let i = 0; i < mapData.mapSpotAreas.length; i++) {
                    const mapSpotArea = mapData.mapSpotAreas[i];
                    mapSpotAreaName[mapSpotArea.mapSpotAreaID] = mapSpotArea.mapSpotAreaName;
                }
                initGetPosition();
            });

            vacbot.on('Error', (value) => {
                console.log('Error: ' + value);
            });
        });

        vacbot.connect();

        tools.dumpSomeVacbotData(vacbot, api);

        setTimeout(() => {
            vacbot.run('GetCleanState');
            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetChargerPos');
                vacbot.run('GetPosition');
                vacbot.run('GetMaps', true, true);
            }
        }, 3000);

        //
        // Catch ctrl-c to exit program
        //
        process.on('SIGINT', function () {
            console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
            disconnect();
        });

        function initGetPosition() {
            setInterval(() => {
                if (vacbot.getProtocol() === 'XMPP') {
                    vacbot.run('GetPosition');
                }
            }, 6000);
        }

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
    console.error(`Failure in connecting: ${e.message}`);
});
