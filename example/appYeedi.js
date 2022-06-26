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

        // Once the session has started the bot will fire a 'ready' event.
        // At this point you can request information from your vacuum or send actions to it.
        vacbot.on('ready', () => {

            console.log('\nvacbot ready\n');

            vacbot.on('ChargeState', (state) => {
                console.log('ChargeState: ' + state);
            });
            vacbot.on('CleanSpeed', (speed) => {
                console.log('CleanSpeed: ' + speed);
            });
            vacbot.on('CleanReport', (state) => {
                console.log('CleanReport: ' + state);
            });
            vacbot.on('BatteryInfo', (value) => {
                let battery = Math.round(value);
                console.log('BatteryInfo: ' + battery);
            });
            vacbot.on('LifeSpan_filter', (level) => {
                console.log('filter: ' + Math.round(level));
            });
            vacbot.on('LifeSpan_main_brush', (level) => {
                console.log('main_brush: ' + Math.round(level));
            });
            vacbot.on('LifeSpan_side_brush', (level) => {
                console.log('side_brush: ' + Math.round(level));
            });
            vacbot.on('WaterLevel', (level) => {
                console.log('water level: ' + level);
            });
            vacbot.on('WaterBoxInfo', (level) => {
                console.log('waterBoxInfo: ' + level);
            });
            vacbot.on('DustCaseInfo', (value) => {
                console.log('DustCaseInfo: ' + value);
            });
            vacbot.on('Error', (value) => {
                console.log('Error: ' + value);
            });
            vacbot.on('DoNotDisturbEnabled', (value) => {
                const doNotDisturb = (parseInt(value) === 1);
                console.log('DoNotDisturbEnabled: ' + doNotDisturb);
            });
            vacbot.on('ContinuousCleaningEnabled', (value) => {
                const continuousCleaning = (parseInt(value) === 1);
                console.log('ContinuousCleaningEnabled: ' + continuousCleaning);
            });
            vacbot.on('Volume', (value) => {
                console.log('Volume: ' + value);
            });
            vacbot.on('ChargePosition', (chargePosition) => {
                console.log('ChargePosition: ' + chargePosition);
            });
            vacbot.on('DeebotPosition', (deebotPosition) => {
                console.log('DeebotPosition: ' + deebotPosition);
            });

            vacbot.on('LastUsedAreaValues', (values) => {
                console.log('LastUsedAreaValues: ' + values);
            });
            vacbot.on('CurrentSpotAreas', (values) => {
                console.log('CurrentSpotAreas: ' + values);
            });
            vacbot.on('CurrentCustomAreaValues', (values) => {
                console.log('CurrentCustomAreaValues: ' + values);
            });

            vacbot.on('MapSpotAreas', (spotAreas) => {
                console.log('MapSpotAreas: ' + JSON.stringify(spotAreas));
                for (const i in spotAreas['mapSpotAreas']) {
                    const spotAreaID = spotAreas['mapSpotAreas'][i]['mapSpotAreaID'];
                    vacbot.run('GetSpotAreaInfo', spotAreas['mapID'], spotAreaID);
                }
            });
            vacbot.on('MapSpotAreaInfo', (area) => {
                console.log('MapSpotAreaInfo: ' + JSON.stringify(area));
            });
            vacbot.on('MapVirtualBoundaries', (virtualBoundaries) => {
                console.log('MapVirtualBoundaries: ' + JSON.stringify(virtualBoundaries));
                const mapID = virtualBoundaries['mapID'];
                const virtualBoundariesCombined = [...virtualBoundaries['mapVirtualWalls'], ...virtualBoundaries['mapNoMopZones']];
                const virtualBoundaryArray = [];
                for (const i in virtualBoundariesCombined) {
                    virtualBoundaryArray[virtualBoundariesCombined[i]['mapVirtualBoundaryID']] = virtualBoundariesCombined[i];
                }
                for (const i in virtualBoundaryArray) {
                    const mapVirtualBoundaryID = virtualBoundaryArray[i]['mapVirtualBoundaryID'];
                    const mapVirtualBoundaryType = virtualBoundaryArray[i]['mapVirtualBoundaryType'];
                    vacbot.run('GetVirtualBoundaryInfo', mapID, mapVirtualBoundaryID, mapVirtualBoundaryType);
                }
            });
            vacbot.on('MapVirtualBoundaryInfo', (virtualBoundary) => {
                console.log('MapVirtualBoundaryInfo: ' + JSON.stringify(virtualBoundary));
            });

            // Please comment out 'MapDataObject' and 'MapImage' if you want to use the code block above
            /*
            vacbot.on('MapDataObject', (mapDataObject) => {
                console.log('MapDataObject:' + JSON.stringify(mapDataObject));
            });
            vacbot.on('MapImage', (value) => {
                console.log('MapImage: ' + JSON.stringify(value));
                console.log('<img src="' + value.mapBase64PNG + '" />');
            });

            vacbot.on('CurrentMapName', (value) => {
                console.log('CurrentMapName: ' + value);
            });
            vacbot.on('CurrentMapIndex', (value) => {
                console.log('CurrentMapIndex: ' + value);
            });
            */

            vacbot.on('CurrentMapMID', (mapID) => {
                console.log('CurrentMapMID: ' + mapID);
                vacbot.run('GetSpotAreas', mapID);
            });
            vacbot.on('DeebotPositionCurrentSpotAreaID', (spotAreaID) => {
                console.log('CurrentSpotAreaID: ' + spotAreaID);
            });
            vacbot.on('CleanLog', (object) => {
                console.log('CleanLog: ' + JSON.stringify(object));
            });
            vacbot.on('Schedule', (object) => {
                console.log('Schedule: ' + JSON.stringify(object));
            });

            vacbot.on('messageReceived', (value) => {
                console.log('messageReceived: ' + value);
            });
        });

        vacbot.connect();

        tools.dumpSomeVacbotData(vacbot, api);

        setTimeout(() => {
            vacbot.run('GetCleanState_V2');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');

            vacbot.run('GetLifeSpan');
            vacbot.run('GetCleanLogs');

            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetChargerPos');
                vacbot.run('GetPosition');
                vacbot.run('GetMaps');
            }
        }, 6000);

        setInterval(() => {
            vacbot.run('GetSleepStatus');
            if (vacbot.hasMoppingSystem()) {
                vacbot.run('GetWaterLevel');
            }
            if (vacbot.hasVacuumPowerAdjustment()) {
                vacbot.run('GetCleanSpeed');
            }
        }, 60000);

        //
        // Catch ctrl-c to exit program
        //
        process.on('SIGINT', function () {
            console.log('\nGracefully shutting down from SIGINT (Ctrl+C)');
            disconnect();
        });

        function disconnect() {
            try {
                vacbot.disconnect();
            } catch (e) {
                console.log('Failure in disconnecting: ', e.message);
            }
            console.log('Exiting...');
            process.exit();
        }
    });
}).catch((e) => {
    console.error(`Failure in connecting: ${e.message}`);
});
