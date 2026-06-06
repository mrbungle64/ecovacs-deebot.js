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

This is the standard and recommended way to use the library in Node.js >= 22.15. It uses modern `async/await` for clean, asynchronous flow control.

```javascript
'use strict';

const ecovacsDeebot = require('ecovacs-deebot');
const { EcovacsAPI } = ecovacsDeebot;
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
        const passwordHash = EcovacsAPI.md5(password);
        
        // Generate a unique device ID identifying this client machine
        const deviceNumber = 0; 
        const deviceId = EcovacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceNumber);
        
        // Initialize the Ecovacs API wrapper
        // The continent is resolved automatically if left as an empty string ''
        const api = new EcovacsAPI(deviceId, countryCode, '', authDomain);
        
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
        
        // Retrieve and print device metadata
        console.log(`Device category: ${vacbot.getDeviceCategory()}`);
        console.log(`Platform architecture: ${vacbot.getPlatformType()}`);
        console.log(`Internal IoT platform protocol (SmartType): ${vacbot.getSmartType()}`);
        
        // 3. Register Event Listeners
        vacbot.on('ready', async () => {
            console.log("VacBot connection established. Robot is READY!");
            
            try {
                // Send initial commands to retrieve states asynchronously using runAsync
                const battery = await vacbot.runAsync("GetBatteryState");
                console.log(`Initial Battery: ${battery.level}% (Low: ${battery.isLow})`);
                
                const cleanState = await vacbot.runAsync("GetCleanState");
                console.log(`Initial Clean State: ${cleanState.cleanState || cleanState.state}`);
                
                const chargeState = await vacbot.runAsync("GetChargeState");
                console.log(`Initial Charge State: ${chargeState.chargeState || chargeState.state}`);
            } catch (error) {
                console.error("Failed to retrieve initial states:", error.message);
            }
        });
        
        // State change/update listeners (to receive live updates during operation)
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

### `EcovacsAPI` Instance
* Handles initial connection, auth handshakes, login caching, and device enumeration.
* Leaving the 3rd argument (`continent`) as an empty string `''` delegates continent resolution automatically to the country-code database.

### `getVacBotObj(vacuum)`
* This is the preferred, high-level method to initialize your device instance from the retrieved `devices` array. It automatically passes the correct auth tokens, uid, realm, and resource behind the scenes.

### `vacbot.connect()`
* Opens the persistent MQTT/JSON communication channel with the device.

### `vacbot.run("CommandName", ...args)`
* Executes a specific command on the device. For a comprehensive index of all supported command names and their parameter structures, refer to the [API Command Reference](COMMANDS.md).

### `vacbot.runAsync("CommandName", ...args)`
* The modern, Promise-based alternative to `run()`. It executes the command and returns a `Promise` resolving with the parsed, normalized response from the device (e.g., `{ level: 87, isLow: false }` for `GetBatteryState`).
* For action/set commands, the Promise resolves immediately upon successful server acknowledgment.
* It accepts an optional options object as the final argument (e.g. `vacbot.runAsync("GetBatteryState", { timeoutMs: 2000 })`).
* Note: All commands registered in the `COMMAND_REGISTRY` support `runAsync()`. If a command is unknown, or if it is called with incorrect or missing arguments, `runAsync()` will reject with an error.
* Any MQTT transport or network failure (unreachable broker, malformed request) also rejects the returned Promise **and** emits `Error`, `ErrorCode` (code `"-1"`), and `LastError` events so you can observe failures even without `await`.

### `vacbot.on("EventName", callback)`
* Listens to live state changes pushed from the vacuum. The primary event mappings are:
  * `BatteryInfo` (Percentage integer)
  * `CleanReport` (String status, e.g., `auto`, `pause`, `stop`)
  * `ChargeState` (String status, e.g., `returning`, `charging`, `completed`)
  * `WaterLevel` (Mopping water level integer, `1-4`)
  * `CleanSpeed` (Suction speed level integer, `1-4`)

### Device Metadata & Capabilities APIs
The `VacBot` instance provides helper methods to inspect the device's architecture, hardware type, and internal IoT platform protocol details synchronously:

* **`vacbot.getPlatformType()`**: Returns the base architecture/generation of the device as a string (e.g. `'T20'`, `'X2'`, `'legacy'`, `'950'`). Note: `vacbot.getModelType()` is deprecated and wraps this.
* **`vacbot.getDeviceCategory()`**: Returns the device category as a string (e.g. `'Vacuum Cleaner'`, `'Air Purifier'`, etc.). Note: `vacbot.getDeviceType()` is deprecated and wraps this.
* **`vacbot.getSmartType()`**: Returns the internal IoT platform generation/protocol identifier as a string (e.g. `'MQ_AP'`, `'BLAP2'`, `'QRP'`, `'BT'`).
* **Platform Type Helpers**: Convenience boolean methods to check the platform generation directly:
  * `vacbot.isPlatformTypeLegacy()`
  * `vacbot.isPlatformTypeN8()`
  * `vacbot.isPlatformTypeT8()`
  * `vacbot.isPlatformTypeT9()`
  * `vacbot.isPlatformTypeT10()`
  * `vacbot.isPlatformTypeT20()`
  * `vacbot.isPlatformTypeX1()`
  * `vacbot.isPlatformTypeX2()`
  * `vacbot.isPlatformTypeAirbot()`
  * `vacbot.isPlatformTypeAqMonitor()`
  * `vacbot.isPlatformTypeLawnMower()`