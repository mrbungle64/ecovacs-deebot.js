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
console.log(continent);

const api = new EcoVacsAPI(device_id, countryCode, continent);
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
            vacbot.on('CleanSpeed', (speed) => {
                console.log('[app2.js] CleanSpeed: ' + speed);
            });
            vacbot.on('CleanReport', (state) => {
                console.log('[app2.js] CleanReport: ' + state);
            });
            vacbot.on('BatteryInfo', (value) => {
                let battery = Math.round(value);
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
            vacbot.on('DoNotDisturbEnabled', (value) => {
                const doNotDisturb = (parseInt(value) === 1);
                console.log('[app2.js] DoNotDisturbEnabled: ' + doNotDisturb);
            });
            vacbot.on('ContinuousCleaningEnabled', (value) => {
                const continuousCleaning = (parseInt(value) === 1);
                console.log('[app2.js] ContinuousCleaningEnabled: ' + continuousCleaning);
            });
            vacbot.on('Volume', (value) => {
                console.log('[app2.js] Volume: ' + value);
            });
            vacbot.on('ChargePosition', (chargePosition) => {
                console.log('[app2.js] ChargePosition: ' + chargePosition);
            });
            vacbot.on('DeebotPosition', (deebotPosition) => {
                console.log('[app2.js] DeebotPosition: ' + deebotPosition);
            });
            vacbot.on('LastUsedAreaValues', (values) => {
                console.log('[app2.js] LastUsedAreaValues: ' + values);
            });
            /*vacbot.on('Maps', (maps) => {
                console.log('[app2.js] Maps: ' + JSON.stringify(maps));
                for (const i in maps['maps']) {
                    const mapID = maps['maps'][i]['mapID'];
                    vacbot.run('GetSpotAreas', mapID);
                    vacbot.run('GetVirtualBoundaries', mapID);

                    vacbot.run('GetMapImage', mapID,'outline');
                    vacbot.run('GetMapImage', mapID,'wifiHeatMap');
                }
            });
            vacbot.on('MapSpotAreas', (spotAreas) => {
                console.log('[app2.js] MapSpotAreas: ' + JSON.stringify(spotAreas));
                for (const i in spotAreas['mapSpotAreas']) {
                    const spotAreaID = spotAreas['mapSpotAreas'][i]['mapSpotAreaID'];
                    vacbot.run('GetSpotAreaInfo', spotAreas['mapID'], spotAreaID);
                }
            });
            vacbot.on('MapSpotAreaInfo', (area) => {
                console.log('[app2.js] MapSpotAreaInfo: ' + JSON.stringify(area));
            });
            vacbot.on('MapVirtualBoundaries', (virtualBoundaries) => {
                console.log('[app2.js] MapVirtualBoundaries: ' + JSON.stringify(virtualBoundaries));
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
                console.log('[app2.js] MapVirtualBoundaryInfo: ' + JSON.stringify(virtualBoundary));
            });*/
            vacbot.on('MapDataObject', (mapDataObject) => {
                console.log('[app2.js] MapDataObject:' + JSON.stringify(mapDataObject));
            });
            vacbot.on('MapImage', (value) => {
                console.log('[app2.js] MapImage: ' + JSON.stringify(value));
                console.log('<img src="' + value['mapBase64PNG'] + '" />');
            });
            vacbot.on('CurrentMapName', (value) => {
                console.log('[app2.js] CurrentMapName: ' + value);
            });
            vacbot.on('CurrentMapMID', (mapID) => {
                console.log('[app2.js] CurrentMapMID: ' + mapID);
                vacbot.run('GetSpotAreas', mapID);
            });
            vacbot.on('CurrentMapIndex', (value) => {
                console.log('[app2.js] CurrentMapIndex: ' + value);
            });
            vacbot.on('DeebotPositionCurrentSpotAreaID', (spotAreaID) => {
                console.log('[app2.js] CurrentSpotAreaID: ' + spotAreaID);
            });
            vacbot.on('CleanLog', (object) => {
                console.log('[app2.js] CleanLog: ' + JSON.stringify(object));
            });
            vacbot.on('Schedule', (object) => {
                console.log('[app2.js] Schedule: ' + JSON.stringify(object));
            });
        });

        vacbot.connect();

        console.log('[app2.js] name: ' + vacbot.getDeviceProperty('name'));
        console.log('[app2.js] isKnownDevice: ' + vacbot.isKnownDevice());
        console.log('[app2.js] isSupportedDevice: ' + vacbot.isSupportedDevice());
        console.log('[app2.js] is950type: ' + vacbot.is950type());
        console.log('[app2.js] isNot950type: ' + vacbot.isNot950type());
        console.log('[app2.js] protocol: ' + vacbot.getProtocol());
        console.log('[app2.js] hasMainBrush: ' + vacbot.hasMainBrush());
        console.log('[app2.js] hasEdgeCleaningMode: ' + vacbot.hasEdgeCleaningMode());
        console.log('[app2.js] hasSpotCleaningMode: ' + vacbot.hasSpotCleaningMode());
        console.log('[app2.js] hasMappingCapabilities: ' + vacbot.hasMappingCapabilities());
        console.log('[app2.js] hasSpotAreaCleaningMode: ' + vacbot.hasSpotAreaCleaningMode());
        console.log('[app2.js] hasCustomAreaCleaningMode: ' + vacbot.hasCustomAreaCleaningMode());
        console.log('[app2.js] hasMoppingSystem: ' + vacbot.hasMoppingSystem());
        console.log('[app2.js] hasVoiceReports: ' + vacbot.hasVoiceReports());
        console.log('[app2.js] hasAutoEmptyStation: ' + vacbot.hasAutoEmptyStation());
        console.log('[app2.js] isCanvasModuleAvailable: ' + EcoVacsAPI.isCanvasModuleAvailable());

        setTimeout(() => {
            vacbot.run('GetCleanState');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');

            vacbot.run('GetLifeSpan');
            vacbot.run('GetCleanLogs');

            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetPosition');
                vacbot.run('GetChargerPos');
                const createMapDataObject = true; // default = false
                const createMapImage = false; // default = createMapDataObject && vacbot.isMapImageSupported();
                vacbot.run('GetMaps', createMapDataObject, createMapImage);
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
            if (vacbot.is950type()) {
                vacbot.run('GetVolume');
                vacbot.run('GetAdvancedMode');
            }
        }, 60000);

        // setInterval(() => {
        //     if (vacbot.hasSpotAreaCleaningMode()) {
        //         //enable to also see deebotposition change more frequently in map image
        //         vacbot.run('GetMapImage', 'INSERT_MAP_ID_MANUALLY','outline');
        //         vacbot.run('GetMapImage', 'INSERT_MAP_ID_MANUALLY','wifiHeatMap');
        //     }
        // }, 5000);

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
