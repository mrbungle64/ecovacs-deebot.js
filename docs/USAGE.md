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
        
        // Get the EcovacsDevice instance for the selected device
        const device = api.getDeviceObj(vacuum);
        
        // Retrieve and print device metadata
        console.log(`Device category: ${device.getDeviceCategory()}`);
        console.log(`Platform architecture: ${device.getPlatformType()}`);
        console.log(`Internal IoT platform protocol (SmartType): ${device.getSmartType()}`);
        
        // 3. Register Event Listeners
        device.on('ready', async () => {
            console.log("Device connection established. Robot is READY!");
            
            try {
                // Send initial commands to retrieve states asynchronously using runAsync
                const battery = await device.runAsync("GetBatteryState");
                console.log(`Initial Battery: ${battery.level}% (Low: ${battery.isLow})`);
                
                const cleanState = await device.runAsync("GetCleanState");
                console.log(`Initial Clean State: ${cleanState.cleanState || cleanState.state}`);
                
                const chargeState = await device.runAsync("GetChargeState");
                console.log(`Initial Charge State: ${chargeState.chargeState || chargeState.state}`);
            } catch (error) {
                console.error("Failed to retrieve initial states:", error.message);
            }
        });
        
        // State change/update listeners (to receive live updates during operation)
        device.on('BatteryInfo', (batteryLevel) => {
            console.log(`Battery State Update: ${Math.round(batteryLevel)}%`);
        });
        
        device.on('CleanReport', (status) => {
            console.log(`Cleaning Status Update: ${status}`);
        });
        
        device.on('ChargeState', (status) => {
            console.log(`Charging Status Update: ${status}`);
        });
        
        device.on('Error', (errorMsg) => {
            console.warn(`Robot reported an error/warning: ${errorMsg}`);
        });
        
        // 4. Connect to the Robot's MQTT Broker
        device.connect();
        
        // Example: Trigger an Auto-Clean after 10 seconds, then charge
        /*
        setTimeout(() => {
            console.log("Triggering Auto-Clean...");
            device.run("Clean");
        }, 10000);
        */
        
        // Graceful exit handling on Ctrl+C (SIGINT)
        process.on('SIGINT', async () => {
            console.log('\nDisconnecting and shutting down...');
            try {
                await device.disconnectAsync();
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

### Long-running connections: automatic token refresh (opt-in)
The access token returned by `connect()` is only valid for a limited time (typically ~7 days). For short-lived scripts this never matters, but a long-running process (e.g. a 24/7 adapter) will eventually see authentication errors once the token expires.

`EcovacsAPI` can refresh the token proactively. It is **opt-in** and decoupled from the bot, so you wire the refreshed token to your `EcovacsDevice` instance(s) yourself:

```javascript
// After api.connect(...) and creating your device(s):
api.on('credentialsUpdated', (creds) => {
    // Apply the refreshed token: updates REST auth immediately and reconnects MQTT
    device.updateUserAccessToken(creds.token);
});

// Re-authenticate automatically shortly before the token expires
api.enableAutoTokenRefresh(accountId, passwordHash);

// ... and when shutting down:
api.disableAutoTokenRefresh();
```

* **`api.getTokenExpiry()`** returns the absolute timestamp (ms since epoch) at which the token will be refreshed, or `null` before the first login.
* **`api.getCredentials()`** returns `{ userId, token, expiresAt }`.
* The **`credentialsUpdated`** event also fires after the initial `connect()`, so you can register the listener before connecting.
* If an automatic refresh fails, a **`credentialsRefreshError`** event is emitted and the refresh is retried after a short delay.
* For multiple bots sharing one MQTT connection, call `updateUserAccessToken()` on **every** `EcovacsDevice` instance — each one needs its own refreshed REST token. Only the connection owner actually reconnects MQTT; the shared instances just update their token in place.

### `getDeviceObj(vacuum)`
* This is the preferred, high-level method to initialize your device instance from the retrieved `devices` array. It automatically passes the correct auth tokens, uid, realm, and resource behind the scenes.
* Returns an **`EcovacsDevice`** instance — the client-side handle for one device (vacuum, air purifier, lawn mower or air-quality monitor).
* For full control over the connection parameters there is also the lower-level `getDevice(user, hostname, resource, userToken, vacuum[, continent])`.

> **Naming note:** The device class is exported as **`EcovacsDevice`** (the former name **`VacBot`** is retained as a **deprecated alias** — `require('ecovacs-deebot').VacBot === require('ecovacs-deebot').EcovacsDevice`). The factory methods were likewise renamed: use **`getDeviceObj()`** / **`getDevice()`**; the previous **`getVacBotObj()`** / **`getVacBot()`** still work as deprecated aliases. Prefer the `Device` names in new code.

### `device.connect()`
* Opens the persistent MQTT/JSON communication channel with the device.

### `device.run("CommandName", ...args)`
* Executes a specific command on the device. For a comprehensive index of all supported command names and their parameter structures, refer to the [API Command Reference](COMMANDS.md).

### `device.runAsync("CommandName", ...args)`
* The modern, Promise-based alternative to `run()`. It executes the command and returns a `Promise` resolving with the parsed, normalized response from the device (e.g., `{ level: 87, isLow: false }` for `GetBatteryState`).
* For action/set commands, the Promise resolves immediately upon successful server acknowledgment.
* It accepts an optional options object as the final argument (e.g. `device.runAsync("GetBatteryState", { timeoutMs: 2000 })`).
* Note: All commands registered in the `COMMAND_REGISTRY` support `runAsync()`. If a command is unknown, or if it is called with incorrect or missing arguments, `runAsync()` will reject with an error.
* Any MQTT transport or network failure (unreachable broker, malformed request) also rejects the returned Promise **and** emits `Error`, `ErrorCode` (code `"-1"`), and `LastError` events so you can observe failures even without `await`.

### `device.on("EventName", callback)`
* Listens to live state changes pushed from the vacuum. The primary event mappings are:
  * `BatteryInfo` (Percentage integer)
  * `CleanReport` (String status, e.g., `auto`, `pause`, `stop`)
  * `ChargeState` (String status, e.g., `returning`, `charging`, `completed`)
  * `WaterLevel` (Mopping water level integer, `1-4`)
  * `CleanSpeed` (Suction speed level integer, `1-4`)

### Device Metadata & Capabilities APIs
The `EcovacsDevice` instance provides helper methods to inspect the device's architecture, hardware type, and internal IoT platform protocol details synchronously:

* **`device.getPlatformType()`**: Returns the base architecture/generation of the device as a string (e.g. `'T20'`, `'X2'`, `'legacy'`, `'950'`). Note: `device.getModelType()` is deprecated and wraps this.
* **`device.getDeviceCategory()`**: Returns the device category as a string (e.g. `'Vacuum Cleaner'`, `'Air Purifier'`, etc.). Note: `device.getDeviceType()` is deprecated and wraps this.
* **`device.getSmartType()`**: Returns the internal IoT platform generation/protocol identifier as a string (e.g. `'MQ_AP'`, `'BLAP2'`, `'QRP'`, `'BT'`).
* **Platform Type Helpers**: Convenience boolean methods to check the platform generation directly:
  * `device.isPlatformTypeLegacy()`
  * `device.isPlatformTypeN8()`
  * `device.isPlatformTypeT8()`
  * `device.isPlatformTypeT9()`
  * `device.isPlatformTypeT10()`
  * `device.isPlatformTypeT20()`
  * `device.isPlatformTypeX1()`
  * `device.isPlatformTypeX2()`
  * `device.isPlatformTypeAirbot()`
  * `device.isPlatformTypeAqMonitor()`
  * `device.isPlatformTypeLawnMower()`