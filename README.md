# ecovacs-deebot.js

[![NPM version](http://img.shields.io/npm/v/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Downloads](https://img.shields.io/npm/dm/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Travis-CI](https://travis-ci.org/mrbungle64/ecovacs-deebot.js.svg?branch=master)](https://travis-ci.org/mrbungle64/ecovacs-deebot.js)

A JavaScript port based on [sucks.js](https://github.com/joostth/sucks.js) of the python project [sucks](https://github.com/wpietri/sucks) and [ozmo](https://github.com/Ligio/ozmo)
to drive an Ecovacs Deebot (Ozmo) robot vacuum.

So far, only devices that communicate with the **XMPP** protocol work.

All credits for figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## Installation

	npm install ecovacs-deebot

## Usage

To get started, you'll need to have already set up an Ecovacs account using your smartphone.

Connecting to your vacuum is performed in two steps:
1. Connect to the HTTP API and retrieve the devices connected to your account
2. Connect to the XMPP server to send and receive messages to/from your vacuum

Once you have your account setup, step one is to log in:
```javascript
const ecovacsDeebot = require('ecovacs-deebot')
	, EcoVacsAPI = ecovacsDeebot.EcoVacsAPI
	, VacBot = ecovacsDeebot.VacBot;

// You need to provide a device ID uniquely identifying the
// machine you're using to connect, the country you're in
// (which you can for example retrieve from http://ipinfo.io/json).
// The module exports a countries object which contains a mapping 
// between country codes and continent codes. If it doesn't appear
// to work for your continent, try "ww", their world-wide catchall.
let api = new EcoVacsAPI(device_id, country, continent);

// The account_id is your Ecovacs username.
// The password_hash is an md5 hash of your Ecovacs password.
api.connect(account_id, password_hash).then(() => {
	console.log("Connected!");
}).catch((e) => {
	// The Ecovacs API endpoint is not very stable, so
	// connecting fails randomly from time to time
	console.error("Failure in connecting!");
});
```

This logs you in through the HTTP API and retrieves the required
access tokens from the server side. This allows you to requests
the devices linked to your account to prepare connectivity to your
vacuum.

```javascript
api.devices().then((devices) => {
	console.log("Devices:", JSON.stringify(devices));
	
	let vacuum = devices[0]; // Selects the first vacuum from your account
	let vacbot = new VacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
	vacbot.on("ready", (event) => {
		console.log("Vacbot ready");
	});
});
```

This connects to your vacuum through the XMPP protocol. Once the
XMPP session has started the bot will fire a 'ready' event. At
this point you can request information from your vacuum or send
actions to it.

There are shortcut functions available to run actions on your bot.
```javascript
vacbot.run("Clean", mode, action);
vacbot.run("SpotArea", mode, action, area);
vacbot.run("CustomArea", mode, action, map_position, cleanings);
vacbot.run("Edge");
vacbot.run("Spot");
vacbot.run("Stop");
vacbot.run("Pause");
vacbot.run("Charge");
vacbot.run("GetDeviceInfo");
vacbot.run("GetCleanState");
vacbot.run("GetChargeState");
vacbot.run("GetBatteryState");
vacbot.run("PlaySound");
vacbot.run('GetLifeSpan', 'main_brush');
vacbot.run('GetLifeSpan', 'side_brush');
vacbot.run('GetLifeSpan', 'filter');
vacbot.run('GetWaterLevel');
vacbot.run('SetWaterLevel', level);
```

### Possible options

#### Clean

##### mode
* `auto`, `edge`, `spot`, `spot_area`, `single_room`, `stop`

##### action
* `start`, `pause`, `resume`, `stop`

#### SpotArea

##### area
* comma-separated list of numbers starting by `0` (e.g. `1,3`) for areas to be cleaned.

#### CustomArea

##### map_position
* comma-separated list of exactly 4 position values for `x1,y1,x2,y2` (e.g. `-3975.000000,2280.000000,-1930.000000,4575.000000`)
    * position `0.000000,0.000000,0.000000,0.000000` the position of the charging station

##### cleanings
* `1`, `2`

## Example
A simple usage might go something like this:

```javascript
const ecovacsDeebot = require('ecovacs-deebot')
	, EcoVacsAPI = ecovacsDeebot.EcoVacsAPI
	, VacBot = ecovacsDeebot.VacBot
	, nodeMachineId = require('node-machine-id')
	, http = require('http')
	, countries = ecovacsDeebot.countries;

let account_id = "email@domain.com"
	, password = "a1b2c3d4"
	, password_hash = EcoVacsAPI.md5(password)
	, device_id = EcoVacsAPI.md5(nodeMachineId.machineIdSync())
	, country = null
	, continent = null;
  
httpGetJson('http://ipinfo.io/json').then((json) => {
	country = json['country'].toLowerCase();
	continent = countries[country.toUpperCase()].continent.toLowerCase();
	
	let api = new EcoVacsAPI(device_id, country, continent);
	
	api.connect(account_id, password_hash).then(() => {
		api.devices().then((devices) => {
			let vacuum = devices[0];
			let vacbot = new VacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
			vacbot.on("ready", (event) => {
				vacbot.run("BatteryState");
				vacbot.run("Clean");
				setTimeout(() => {
					vacbot.run("Stop");
					vacbot.run("Charge");
				}, 60000);
				
				vacbot.on("BatteryInfo", (battery) => {
					console.log("Battery level: %d\%", Math.round(battery*100));
				});
			});
			vacbot.connect_and_wait_until_ready();
		});
	}).catch((e) => {
		console.error("Failure in connecting!");
	});
});

function httpGetJson(url) {
	return new Promise((resolve, reject) => {
		http.get(url, (res) => {
			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', function(){
				try {
					const json = JSON.parse(rawData);
					resolve(json);
				} catch (e) {
					reject(e);
				}
			});
		}).on('error', (e) => {
			reject(e);
		});
	});
}
```
### 0.1.6
* (mrbungle64) Bugfix release (alpha)
  * Fix package-lock.json
  * A few minor changes

### 0.1.5
* (mrbungle64) Bugfix release (alpha)
  * Bugfix
  * A few minor changes

### 0.1.4
* (mrbungle64) Feature release (alpha)
   * Implemented GetWaterLevel command
   * Implemented SetWaterLevel command

### 0.1.3
* (mrbungle64) Feature release (alpha)
   * Implemented GetLifeSpan command
   
### 0.1.2
* (mrbungle64) Feature release (alpha)
   * Implemented SpotArea command
   * Implemented CustomArea command

### 0.1.1
* (mrbungle64) Feature release (Alpha)
   * Implemented PlaySound command

### 0.1.0
* (mrbungle64) Alpha release
  * Deebot Ozmo 930 is working

### 0.0.2
* (mrbungle64) Initial development release

## Thanks and credits
* @joostth ([sucks.js](https://github.com/joostth/sucks.js))
* @wpietri ([sucks](https://github.com/wpietri/sucks))
* @bmartin5692 ([sucks](https://github.com/bmartin5692/sucks), [bumber](https://github.com/bmartin5692/bumper))
* @Ligio ([ozmo](https://github.com/Ligio/ozmo))

## Dedication

As already mentioned above all credits for figuring out and documenting the
protocol as well as developing the python library this port is based on go
to [@wpietri](https://github.com/wpietri).

The example code about uses the following additional resources:
* [node-machine-id](https://www.npmjs.com/package/node-machine-id) which
  provides an easy way to create a unique identifier for the machine running
  the code.
* [https://ipinfo.io/](https://ipinfo.io/) which provides a json API for IP address information
  and is free to use for testing or non-commercial use up to 1000 requests
  per day.

## License
GNU GENERAL PUBLIC LICENSE
