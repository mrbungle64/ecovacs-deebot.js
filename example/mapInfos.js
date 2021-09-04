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
        // TODO: change device number
        let vacuum = devices[1];
        console.log(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
        vacbot.on('ready', (event) => {

            console.log('vacbot ready');

            vacbot.on('ChargePosition', (chargePosition) => {
                console.log('[mapInfos.js] ChargePosition: ' + chargePosition);
            });
            vacbot.on('DeebotPosition', (deebotPosition) => {
                console.log('[mapInfos.js] DeebotPosition: ' + deebotPosition);
            });
            vacbot.on('LastUsedAreaValues', (values) => {
                console.log('[mapInfos.js] LastUsedAreaValues: ' + values);
            });

            vacbot.on('MapDataObject', (mapDataObject) => {
                mapData = Object.assign(mapDataObject)[0];
                for (let i = 0; i < mapData.mapSpotAreas.length; i++) {
                    const mapSpotArea = mapData.mapSpotAreas[i];
                    mapSpotAreaName[mapSpotArea.mapSpotAreaID] = mapSpotArea.mapSpotAreaName;
                    console.log('[mapInfos.js] MapSpotArea ' + mapSpotArea.mapSpotAreaID + ' => ' + mapSpotArea.mapSpotAreaName);
                }
                initInterval();
            });

            vacbot.on('CurrentMapName', (value) => {
                console.log('[mapInfos.js] CurrentMapName: ' + value);
            });
            vacbot.on('CurrentMapMID', (mapID) => {
                console.log('[mapInfos.js] CurrentMapMID: ' + mapID);
                vacbot.run('GetSpotAreas', mapID);
            });

            vacbot.on('DeebotPositionCurrentSpotAreaID', (spotAreaID) => {
                if (mapSpotAreaName[mapData.mapSpotAreas[spotAreaID].mapSpotAreaID]) {
                    const mapSpotArea = mapData.mapSpotAreas[spotAreaID];
                    console.log('[mapInfos.js] CurrentSpotArea: ' + spotAreaID + ' => ' + mapSpotAreaName[mapSpotArea.mapSpotAreaID]);
                } else {
                    console.log('[mapInfos.js] CurrentSpotAreaID: ' + spotAreaID);
                }
            });
        });

        vacbot.connect();

        console.log('[mapInfos.js] name: ' + vacbot.getDeviceProperty('name'));
        console.log('[mapInfos.js] isKnownDevice: ' + vacbot.isKnownDevice());
        console.log('[mapInfos.js] isSupportedDevice: ' + vacbot.isSupportedDevice());
        console.log('[mapInfos.js] is950type: ' + vacbot.is950type());
        console.log('[mapInfos.js] protocol: ' + vacbot.getProtocol());
        console.log('[mapInfos.js] hasMappingCapabilities: ' + vacbot.hasMappingCapabilities());
        console.log('[mapInfos.js] hasSpotAreaCleaningMode: ' + vacbot.hasSpotAreaCleaningMode());
        console.log('[mapInfos.js] hasCustomAreaCleaningMode: ' + vacbot.hasCustomAreaCleaningMode());
        console.log('[mapInfos.js] isCanvasModuleAvailable: ' + EcoVacsAPI.isCanvasModuleAvailable());

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

        function initInterval() {
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
