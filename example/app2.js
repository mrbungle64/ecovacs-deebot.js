const ecovacsDeebot = require('./../index');
const tools = require('./tools');
const nodeMachineId = require('node-machine-id');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;

let settingsFile = tools.getSettingsFile();

const account_id = settingsFile.ACCOUNT_ID;
const password = settingsFile.PASSWORD;
const countryCode = settingsFile.COUNTRY_CODE;
const deviceNumber = settingsFile.DEVICE_NUMBER;

// The password_hash is an md5 hash of your Ecovacs password.
const password_hash = EcoVacsAPI.md5(password);
// You need to provide a device ID uniquely identifying the machine you're using to connect
const device_id = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceNumber);

const api = new EcoVacsAPI(device_id, countryCode);

// This logs you in through the HTTP API and retrieves the required
// access tokens from the server side. This allows you to requests
// the devices linked to your account to prepare connectivity to your vacuum.
api.connect(account_id, password_hash).then(() => {

    api.devices().then((devices) => {

        console.log(`Devices: ${JSON.stringify(devices)}`);
        let vacuum = devices[deviceNumber];
        console.log(vacuum);
        let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, api.getContinent());

        // Once the session has started the bot will fire a 'ready' event.
        // At this point you can request information from your vacuum or send actions to it.
        vacbot.on('ready', (event) => {

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

            // Please uncomment this code block if you want to use GetMaps cmd
            // to retrieve every single event (without retrieving the map data object)
            // Please do not uncomment this code block if you want to retrieve the full map data object (standard)
            // But if you do please also comment out 'MapDataObject' and 'MapImage'

            /*vacbot.on('Maps', (maps) => {
                console.log('Maps: ' + JSON.stringify(maps));
                for (const i in maps['maps']) {
                    const mapID = maps['maps'][i]['mapID'];
                    vacbot.run('GetSpotAreas', mapID);
                    vacbot.run('GetVirtualBoundaries', mapID);
                }
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
            });*/

            // Please comment out 'MapDataObject' and 'MapImage' if you want to use the code block above
            vacbot.on('MapDataObject', (mapDataObject) => {
                console.log('MapDataObject:' + JSON.stringify(mapDataObject));
            });
            vacbot.on('MapImage', (value) => {
                console.log('MapImage: ' + JSON.stringify(value));
                console.log('<img src="' + value['mapBase64PNG'] + '" />');
            });

            vacbot.on('CurrentMapName', (value) => {
                console.log('CurrentMapName: ' + value);
            });
            vacbot.on('CurrentMapMID', (mapID) => {
                console.log('CurrentMapMID: ' + mapID);
                vacbot.run('GetSpotAreas', mapID);
            });
            vacbot.on('CurrentMapIndex', (value) => {
                console.log('CurrentMapIndex: ' + value);
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
        });

        vacbot.connect();

        tools.dumpSomeVacbotData(vacbot, api);

        setTimeout(() => {
            vacbot.run('GetCleanState');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');

            vacbot.run('GetLifeSpan');
            vacbot.run('GetCleanLogs');

            if (vacbot.hasMappingCapabilities()) {
                vacbot.run('GetChargerPos');
                vacbot.run('GetPosition');
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

        function variousShortcutFunctions() {
            // Please do not execute this function
            // To try some of the commands, please copy and paste them

            // Cleaning
            vacbot.run('Clean'); // auto clean
            vacbot.clean(); // version >= 0.6.2
            vacbot.run('Edge');
            vacbot.edge(); // version >= 0.6.2
            vacbot.run('Spot');
            vacbot.spot(); // version >= 0.6.2
            const areas = '0,7'; // Example values
            let boundaryCoordinates = '-3975,2280,-1930,4575'; // Example values
            const numberOfCleanings = 1;
            vacbot.run('SpotArea', 'start', areas);
            vacbot.spotArea(areas); // version >= 0.6.2
            vacbot.run('CustomArea', 'start', boundaryCoordinates, numberOfCleanings);
            vacbot.customArea(boundaryCoordinates, numberOfCleanings); // version >= 0.6.2

            // Various control commands
            vacbot.run('Charge'); // return to charging station
            vacbot.charge(); // version >= 0.6.2
            vacbot.run('Stop');
            vacbot.stop(); // version >= 0.6.2
            vacbot.run('Pause');
            vacbot.pause(); // version >= 0.6.2
            vacbot.run('Resume'); // resume if paused
            vacbot.resume(); // version >= 0.6.2

            // Retrieve states
            vacbot.run('GetCleanState'); // retrieve the cleaning status
            vacbot.run('GetChargeState'); // retrieve the charging status
            vacbot.run('GetBatteryState'); // retrieve the battery level
            vacbot.run('GetSleepStatus'); // retrieve info if the vacuum is in sleeping mode

            // Cleaning log and consumable
            vacbot.run('GetCleanLogs');
            vacbot.run('GetCleanSum');
            vacbot.run('GetLifeSpan'); // retrieve combined LifeSpan event
            vacbot.run('ResetLifeSpan', 'main_brush');
            vacbot.run('ResetLifeSpan', 'side_brush');
            vacbot.run('ResetLifeSpan', 'filter');

            // Voice and sound
            vacbot.run('PlaySound'); // soundID = 0 'startup music chime'
            vacbot.run('PlaySound', 30);
            vacbot.playSound(30); // version >= 0.6.2
            // 950 type devices only
            vacbot.run('GetVolume');
            vacbot.run('SetVolume', 7); // value range: 0-10

            // Position
            vacbot.run('GetPosition'); // retrieve current position of the vacuum
            vacbot.run('GetChargerPos'); // retrieve charging position
            vacbot.run('Relocate'); // send command to relocate position

            // Map data, spot areas and virtual boundaries
            // Some of the commands are classified as experimental for now (e.g. DeleteVirtualBoundary, GetMapImage)

            const mapID = '1298761989'; // Example value
            // See "Please uncomment this code block if you want to use GetMaps cmd" (currently line 76)
            vacbot.run('GetMaps'); // retrieve map data
            vacbot.run('GetSpotAreas', mapID); // retrieve spot areas
            vacbot.run('GetVirtualBoundaries', mapID); // retrieve virtual boundaries
            vacbot.run('GetSpotAreaInfo', mapID, '0'); // retrieve various data for a spot area
            vacbot.run('RenameSpotArea', '2', '0', 'Dressing room') // works only with a few models (e.g. OZMO 930)
            const boundaryType = 'vw'; // vw = virtual wall, mw = no-mop-zone
            vacbot.run('GetVirtualBoundaryInfo', mapID, '0', boundaryType); // retrieve various data for a virtual boundary
            vacbot.run('DeleteVirtualBoundary', mapID, '0', boundaryType); // delete a virtual boundary
            // boundaryCoordinates are passed as a string with a comma-separated
            // list of boundaries (x, y pairs), formatted like an array.
            boundaryCoordinates = '[-1072,-3142,-1072,-4240,1349,-4240,1349,-3142]'; // Example value
            vacbot.run('AddVirtualBoundary', mapID, boundaryCoordinates, boundaryType);

            // combined map data (recommended)
            vacbot.run('GetMaps', true); // retrieve combined map data including map data
            vacbot.run('GetMaps', true, false); // retrieve combined map data without map image
            // Map image data
            vacbot.run('GetMapImage', mapID, 'outline'); // Get image data for specified map
            vacbot.run('GetMapImage', mapID, 'wifiHeatMap'); // Get image data for WiFi heat map

            // Vacuum power
            vacbot.run('GetCleanSpeed'); // retrieve vacuum power value
            vacbot.run('SetCleanSpeed', 2); // Power adjustment - value range 1-4 (but varies from model to model)

            // Mopping and waterbox
            vacbot.run('GetWaterLevel'); // retrieve mopping water amount
            vacbot.run('SetWaterLevel', 2); // Water level adjustment - value range 1-4
            vacbot.run('GetWaterBoxInfo'); // indicates if waterbox is installed

            // Various other commands
            vacbot.run('GetError'); // 950 type models and maybe some other models
            vacbot.run('GetNetInfo'); // 950 type models and maybe some other models
            vacbot.run('GetSchedule');
            vacbot.run('DisableDoNotDisturb');
            vacbot.run('EnableDoNotDisturb', '22:00', '08:00'); // 950 type models
            vacbot.run('EnableDoNotDisturb'); // some other models
            // 0 = off, 1 = on
            vacbot.run('GetOnOff', 'do_not_disturb');
            vacbot.run('GetOnOff', 'continuous_cleaning');
            vacbot.run('GetOnOff', 'silence_voice_report');
            vacbot.run('SetOnOff', 'do_not_disturb', 1);
            vacbot.run('SetOnOff', 'continuous_cleaning', 1);
            vacbot.run('SetOnOff', 'silence_voice_report', 1);
            vacbot.run('GetAdvancedMode'); // 950 type models
            vacbot.run('EnableAdvancedMode'); // 950 type models
            vacbot.run('DisableAdvancedMode'); // 950 type models

            // Auto empty station
            // 0 = disabled, 1 = enabled
            vacbot.run('GetAutoEmpty'); // retrieve info if auto empty is enabled
            vacbot.run('SetAutoEmpty', 1);

            // Manual control
            // Each command is executed only 1 time by the Ecovacs API.
            // You must first execute another command before the command can be executed the next time
            vacbot.run('MoveBackward');
            vacbot.run('MoveLeft');
            vacbot.run('MoveRight');
            vacbot.run('MoveForward');
        }

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
