const ecovacsDeebot = require('./../index');
const tools = require('./tools');
const nodeMachineId = require('node-machine-id');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;

let settingsFile = tools.getSettingsFile();

const account_id = settingsFile.ACCOUNT_ID;
const password = settingsFile.PASSWORD;
const countryCode = settingsFile.COUNTRY_CODE;
const deviceNumber = settingsFile.DEVICE_NUMBER;

const password_hash = EcoVacsAPI.md5(password);
const device_id = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceNumber);

const api = new EcoVacsAPI(device_id, countryCode);

let mapData = null;
let mapSpotAreaName = [];

api.connect(account_id, password_hash).then(() => {
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

            vacbot.on('LastUsedAreaValues', (values) => {
                console.log(`Last used area values (x1,y1,x2,y2): ${values}`);
            });

            vacbot.on('MapDataObject', (mapDataObject) => {
                mapData = Object.assign(mapDataObject[0]);
                for (let i = 0; i < mapData.mapSpotAreas.length; i++) {
                    const mapSpotArea = mapData.mapSpotAreas[i];
                    mapSpotAreaName[mapSpotArea.mapSpotAreaID] = mapSpotArea.mapSpotAreaName;
                    console.log(`- Spot area ${mapSpotArea.mapSpotAreaID} = ${mapSpotArea.mapSpotAreaName}`);
                }
                console.log('\nRequesting position data\n');
                initGetPosition();
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
            vacbot.run('GetCleanState');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');

            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetMaps', true, false);
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
