'use strict';

const ExampleClient = require('./lib/client');
const tools = require('./tools');

/**
 * Unified Example App
 * Supports dynamic feature detection for Deebot Vacuums and AirPurifiers.
 */
async function main() {
    const config = tools.getSettingsFile();
    const client = new ExampleClient(config);

    try {
        const vacbot = await client.init();
        console.log('Connected to Ecovacs API');

        // Initial device information dump
        tools.dumpSomeVacbotData(vacbot, client.api);

        // Setup dynamic listeners based on device capabilities
        setupCommonListeners(vacbot);

        if (vacbot.getDeviceCategory() === 'Air Purifier') {
            setupAirPurifierListeners(vacbot);
        } else {
            setupVacuumListeners(vacbot);
        }

        if (vacbot.hasMappingCapabilities()) {
            setupMapListeners(vacbot);
        }

        // Start connection
        vacbot.connect();

        // Initial status requests
        setTimeout(() => {
            console.log('\n--- Initial Status Request ---');
            vacbot.run('GetChargeState');
            vacbot.run('GetBatteryState');
            vacbot.run('GetSleepStatus');

            if (vacbot.getDeviceCategory() === 'Air Purifier') {
                vacbot.run('GetAirQuality');
            } else {
                vacbot.run('GetCleanState');
                vacbot.run('GetLifeSpan');
                vacbot.run('GetCleanLogs');
                if (vacbot.hasMappingCapabilities()) {
                    vacbot.run('GetPosition');
                    vacbot.run('GetMaps', true, false);
                }
            }
        }, 3000);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nGracefully shutting down...');
        await client.disconnect();
        process.exit(0);
    });
}

function setupCommonListeners(vacbot) {
    vacbot.on('ready', () => console.log(`Device "${vacbot.getName()}" is ready.`));
    vacbot.on('ChargeState', (state) => console.log('ChargeState:', state));
    vacbot.on('BatteryInfo', (value) => console.log('Battery:', Math.round(value), '%'));
    vacbot.on('Error', (error) => console.error('Device Error:', error));
}

function setupVacuumListeners(vacbot) {
    vacbot.on('CleanReport', (state) => console.log('Cleaning Status:', state));
    vacbot.on('CleanSpeed', (speed) => console.log('Suction Power:', speed));
    vacbot.on('CleanLog', (logs) => console.log(`Clean Logs received: ${logs.length} entries`));
    if (vacbot.hasMoppingSystem()) {
        vacbot.on('WaterLevel', (level) => console.log('Water Level:', level));
    }
}

function setupAirPurifierListeners(vacbot) {
    vacbot.on('AirQuality', (obj) => {
        console.log('Air Quality:', JSON.stringify(obj, null, 2));
    });
}

function setupMapListeners(vacbot) {
    vacbot.on('Position', (pos) => console.log('Position:', pos));
    vacbot.on('MapDataObject', () => console.log('Map Data received (Object)'));
    vacbot.on('MapImage', () => console.log('Map Image received (Base64 available)'));
}

main();
