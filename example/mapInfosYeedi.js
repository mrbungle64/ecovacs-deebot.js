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

            vacbot.on('Position', (object) => {
                console.log(`Position (x,y): ${object.x},${object.y}`);
                if (object.distanceToChargingStation) {
                    console.log(`Distance to charger (m): ${object.distanceToChargingStation}`);
                }
            });

            vacbot.on('ChargingPosition', (object) => {
                console.log(`Charging position (x,y): ${object.x},${object.y}`);
            });

            vacbot.on('CurrentSpotAreas', (values) => {
                console.log(`Current spot areas: ${values}`);
            });
            vacbot.on('CurrentCustomAreaValues', (values) => {
                console.log(`Current custom area values (x1,y1,x2,y2): ${values}`);
            });
            vacbot.on('LastUsedAreaValues', (values) => {
                console.log(`Last used custom area values (x1,y1,x2,y2): ${values}`);
            });

            vacbot.on('MapSpotAreas', (spotAreas) => {
                console.log('MapSpotAreas: ' + JSON.stringify(spotAreas));
                for (const i in spotAreas['mapSpotAreas']) {
                    const spotAreaID = spotAreas['mapSpotAreas'][i]['mapSpotAreaID'];
                    vacbot.run('GetSpotAreaInfo', spotAreas['mapID'], spotAreaID);
                }
                initGetPosition();
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

            vacbot.on('CurrentMapName', (value) => {
                console.log(`Current map name: ${value}`);
            });
            vacbot.on('CurrentMapMID', (mapID) => {
                console.log(`Current map ID: ${mapID}`);
                vacbot.run('GetSpotAreas', mapID);
            });

            vacbot.on('DeebotPositionCurrentSpotAreaID', (spotAreaID) => {
                if (mapData && mapData.mapSpotAreas[spotAreaID]) {
                    if (mapSpotAreaName[mapData.mapSpotAreas[spotAreaID].mapSpotAreaID]) {
                        const mapSpotArea = mapData.mapSpotAreas[spotAreaID];
                        console.log(`Current spot area ${spotAreaID} = ${mapSpotAreaName[mapSpotArea.mapSpotAreaID]}`);
                    } else {
                        console.log(`Current spot area ID ${spotAreaID}`);
                    }
                }
            });

            vacbot.on('Error', (value) => {
                console.log('Error: ' + value);
            });
        });

        vacbot.connect();

        tools.dumpSomeVacbotData(vacbot, api);

        setTimeout(() => {
            vacbot.run('GetCleanState_V2');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');

            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetMaps');
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
            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetChargerPos');
                vacbot.run('GetPosition');
            }
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
