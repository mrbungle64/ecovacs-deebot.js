const ecovacsDeebot = require('./../index');
const nodeMachineId = require('node-machine-id');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;

const account_id = "email@domain.com";
const password = "a1b2c3d4";
const countryCode = 'DE';

const password_hash = EcoVacsAPI.md5(password);
const device_id = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync());
const countries = ecovacsDeebot.countries;
const continent = countries[countryCode].continent.toLowerCase();

const api = new EcoVacsAPI(device_id, countryCode, continent);

let mapData = {};
let mapSpotAreaName = [];

api.connect(account_id, password_hash).then(() => {
    api.devices().then((devices) => {
        let vacuum = devices[0];
        console.log(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
        vacbot.on('ready', (event) => {

            console.log('\nvacbot ready\n');

            vacbot.on('Position', (object) => {
                console.log(`Position (x,y): ${object.x},${object.y}`);
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
                if (mapSpotAreaName[mapData.mapSpotAreas[spotAreaID].mapSpotAreaID]) {
                    const mapSpotArea = mapData.mapSpotAreas[spotAreaID];
                    console.log(`Current spot area ${spotAreaID} = ${mapSpotAreaName[mapSpotArea.mapSpotAreaID]}`);
                } else {
                    console.log(`Current spot area ID ${spotAreaID}`);
                }
            });
        });

        vacbot.connect();

        console.log(`- Name: ${vacbot.getDeviceProperty(`name`)}`);
        console.log(`- Is known device: ${vacbot.isKnownDevice()}`);
        console.log(`- Is supported device: ${vacbot.isSupportedDevice()}`);
        console.log(`- Is 950 type model: ${vacbot.is950type()}`);
        console.log(`- Communication protocol: ${vacbot.getProtocol()}`);
        console.log(`- Mapping capabilities: ${vacbot.hasMappingCapabilities()}`);
        console.log(`- Spot area cleaning mode: ${vacbot.hasSpotAreaCleaningMode()}`);
        console.log(`- Custom area cleaning mode: ${vacbot.hasCustomAreaCleaningMode()}`);
        console.log(`- Canvas module available: ${EcoVacsAPI.isCanvasModuleAvailable()}`);

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
                vacbot.run('GetPosition');
                vacbot.run('GetChargerPos');
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
    console.log('Failure in connecting: ', e.message);
});
