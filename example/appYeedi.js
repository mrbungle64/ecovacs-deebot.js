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

        api.logInfo(`Devices: ${JSON.stringify(devices)}`);
        let vacuum = devices[deviceNumber];
        api.logInfo(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum);

        // Once the session has started the bot will fire a 'ready' event.
        // At this point you can request information from your vacuum or send actions to it.
        vacbot.on('ready', () => {

            api.logInfo('vacbot ready');

            vacbot.on('ChargeState', (state) => {
                api.logEvent('ChargeState', state);
            });
            vacbot.on('CleanSpeed', (speed) => {
                api.logEvent('CleanSpeed', speed);
            });
            vacbot.on('CleanReport', (state) => {
                api.logEvent('CleanReport', state);
            });
            vacbot.on('BatteryInfo', (value) => {
                let battery = Math.round(value);
                api.logEvent('BatteryInfo', battery);
            });
            vacbot.on('LifeSpan_filter', (level) => {
                api.logEvent('filter', Math.round(level));
            });
            vacbot.on('LifeSpan_main_brush', (level) => {
                api.logEvent('main_brush', Math.round(level));
            });
            vacbot.on('LifeSpan_side_brush', (level) => {
                api.logEvent('side_brush', Math.round(level));
            });
            vacbot.on('WaterLevel', (level) => {
                api.logEvent('water level', level);
            });
            vacbot.on('WaterBoxInfo', (level) => {
                api.logEvent('waterBoxInfo', level);
            });
            vacbot.on('DustCaseInfo', (value) => {
                api.logEvent('DustCaseInfo', value);
            });
            vacbot.on('Error', (value) => {
                api.logEvent('Error', value);
            });
            vacbot.on('DoNotDisturbEnabled', (value) => {
                const doNotDisturb = (parseInt(value) === 1);
                api.logEvent('DoNotDisturbEnabled', doNotDisturb);
            });
            vacbot.on('ContinuousCleaningEnabled', (value) => {
                const continuousCleaning = (parseInt(value) === 1);
                api.logEvent('ContinuousCleaningEnabled', continuousCleaning);
            });
            vacbot.on('Volume', (value) => {
                api.logEvent('Volume', value);
            });
            vacbot.on('ChargePosition', (chargePosition) => {
                api.logEvent('ChargePosition', chargePosition);
            });
            vacbot.on('DeebotPosition', (deebotPosition) => {
                api.logEvent('DeebotPosition', deebotPosition);
            });

            vacbot.on('LastUsedAreaValues', (values) => {
                api.logEvent('LastUsedAreaValues', values);
            });
            vacbot.on('CurrentSpotAreas', (values) => {
                api.logEvent('CurrentSpotAreas', values);
            });
            vacbot.on('CurrentCustomAreaValues', (values) => {
                api.logEvent('CurrentCustomAreaValues', values);
            });

            vacbot.on('MapSpotAreas', (spotAreas) => {
                api.logEvent('MapSpotAreas', spotAreas);
                for (const i in spotAreas['mapSpotAreas']) {
                    const spotAreaID = spotAreas['mapSpotAreas'][i]['mapSpotAreaID'];
                    vacbot.run('GetSpotAreaInfo', spotAreas['mapID'], spotAreaID);
                }
            });
            vacbot.on('MapSpotAreaInfo', (area) => {
                api.logEvent('MapSpotAreaInfo', area);
            });
            vacbot.on('MapVirtualBoundaries', (virtualBoundaries) => {
                api.logEvent('MapVirtualBoundaries', virtualBoundaries);
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
                api.logEvent('MapVirtualBoundaryInfo', virtualBoundary);
            });

            // Please comment out 'MapDataObject' and 'MapImage' if you want to use the code block above
            /*
            vacbot.on('MapDataObject', (mapDataObject) => {
                api.logEvent('MapDataObject:' + JSON.stringify(mapDataObject));
            });
            vacbot.on('MapImage', (value) => {
                api.logEvent('MapImage', JSON.stringify(value));
                api.logEvent('<img src="' + value.mapBase64PNG + '" />');
            });

            vacbot.on('CurrentMapName', (value) => {
                api.logEvent('CurrentMapName', value);
            });
            vacbot.on('CurrentMapIndex', (value) => {
                api.logEvent('CurrentMapIndex', value);
            });
            */

            vacbot.on('CurrentMapMID', (mapID) => {
                api.logEvent('CurrentMapMID', mapID);
                vacbot.run('GetSpotAreas', mapID);
            });
            vacbot.on('DeebotPositionCurrentSpotAreaID', (spotAreaID) => {
                api.logEvent('CurrentSpotAreaID', spotAreaID);
            });
            vacbot.on('CleanLog', (object) => {
                api.logEvent('CleanLog', object);
            });
            vacbot.on('Schedule', (object) => {
                api.logEvent('Schedule', object);
            });

            vacbot.on('messageReceived', (value) => {
                api.logEvent('messageReceived', value);
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
            api.logInfo('Gracefully shutting down from SIGINT (Ctrl+C)');
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
