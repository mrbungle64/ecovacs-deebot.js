# Usage Guide

Connecting to your Ecovacs or Yeedi device and controlling it is performed in two main steps:

1. **HTTP API Authentication:** Log in with your Ecovacs credentials and retrieve the list of registered devices linked to your account.
2. **MQTT Connection:** Establish a persistent connection to the Ecovacs MQTT broker for the chosen device to send JSON commands and listen to live state events.

Once the connection is established, the robot will emit a `ready` event, indicating it is prepared to receive commands.

---

## 1. Prerequisites & Account Setup

Before writing any code, make sure you have:
1. Registered an account and configured your vacuum using the official smartphone app (Ecovacs Home or Yeedi).
2. Installed the library. See the [Installation Guide](INSTALLATION.md) for details.

---

## 2. Modern Example (`async/await`)

This is the standard and recommended way to use the library in Node.js >= 20. It uses modern `async/await` for clean, asynchronous flow control.

```javascript
'use strict';

const ecovacsDeebot = require('ecovacs-deebot');
const { EcoVacsAPI } = ecovacsDeebot;
const nodeMachineId = require('node-machine-id');

// 1. Account Configuration
const accountId = "your_email@domain.com"; // Your Ecovacs email address or account ID
const password = "your_password";         // Your password
const countryCode = "de";                 // Two-letter country code (ISO 3166-1 alpha-2)

// 2. Auth Domain (Optional)
// Use 'yeedi.com' for yeedi login, or keep empty '' for standard Ecovacs login
const authDomain = ''; 

async function main() {
    try {
        // MD5 hash of the password is required by the API
        const passwordHash = EcoVacsAPI.md5(password);
        
        // Generate a unique device ID identifying this client machine
        const deviceNumber = 0; 
        const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceNumber);
        
        // Initialize the EcoVacs API wrapper
        // The continent is resolved automatically if left as an empty string ''
        const api = new EcoVacsAPI(deviceId, countryCode, '', authDomain);
        
        console.log("Connecting to the HTTP API...");
        await api.connect(accountId, passwordHash);
        
        // Retrieve all registered devices on the account
        const devices = await api.devices();
        console.log(`Found ${devices.length} registered devices.`);
        
        if (devices.length === 0) {
            console.error("No registered robots found on this account.");
            return;
        }
        
        // Select the first device (or iterate if you have multiple)
        const vacuum = devices[0];
        console.log(`Selected device: ${vacuum.name} (${vacuum.model})`);
        
        // Get the VacBot instance wrapper for the selected device
        const vacbot = api.getVacBotObj(vacuum);
        
        // 3. Register Event Listeners
        vacbot.on('ready', async () => {
            console.log("VacBot connection established. Robot is READY!");
            
            // Send initial commands to retrieve states
            // These will trigger event updates (BatteryInfo, CleanReport, etc.)
            vacbot.run("GetBatteryState");
            vacbot.run("GetCleanState");
            vacbot.run("GetChargeState");
        });
        
        // State change listeners
        vacbot.on('BatteryInfo', (batteryLevel) => {
            console.log(`Battery State Update: ${Math.round(batteryLevel)}%`);
        });
        
        vacbot.on('CleanReport', (status) => {
            console.log(`Cleaning Status Update: ${status}`);
        });
        
        vacbot.on('ChargeState', (status) => {
            console.log(`Charging Status Update: ${status}`);
        });
        
        vacbot.on('Error', (errorMsg) => {
            console.warn(`Robot reported an error/warning: ${errorMsg}`);
        });
        
        // 4. Connect to the Robot's MQTT Broker
        vacbot.connect();
        
        // Example: Trigger an Auto-Clean after 10 seconds, then charge
        /*
        setTimeout(() => {
            console.log("Triggering Auto-Clean...");
            vacbot.run("Clean");
        }, 10000);
        */
        
        // Graceful exit handling on Ctrl+C (SIGINT)
        process.on('SIGINT', async () => {
            console.log('\nDisconnecting and shutting down...');
            try {
                await vacbot.disconnectAsync();
                console.log("Disconnected successfully. Exiting.");
                process.exit(0);
            } catch (e) {
                console.error("Failed to disconnect cleanly:", e.message);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error("An error occurred during execution:", error.message);
    }
}

main();
```

---

## 3. Core API Components Explained

### `EcoVacsAPI` Instance
* Handles initial connection, auth handshakes, login caching, and device enumeration.
* Leaving the 3rd argument (`continent`) as an empty string `''` delegates continent resolution automatically to the country-code database.

### `getVacBotObj(vacuum)`
* This is the preferred, high-level method to initialize your device instance from the retrieved `devices` array. It automatically passes the correct auth tokens, uid, realm, and resource behind the scenes.

### `vacbot.connect()`
* Opens the persistent MQTT/JSON communication channel with the device.

### `vacbot.run("CommandName", ...args)`
* Executes a specific command on the device. For a comprehensive index of all supported command names and their parameter structures, refer to the [API Command Reference](COMMANDS.md).

### `vacbot.on("EventName", callback)`
* Listens to live state changes pushed from the vacuum. The primary event mappings are:
  * `BatteryInfo` (Percentage integer)
  * `CleanReport` (String status, e.g., `clean`, `pause`, `stop`)
  * `ChargeState` (String status, e.g., `returning`, `charging`, `completed`)
  * `WaterLevel` (Mopping water level integer, `1-4`)
  * `CleanSpeed` (Suction speed level integer, `1-4`)