sucks.js
========

A like for like JavaScript port of the python project [sucks](https://github.com/wpietri/sucks)
to drive an Ecovacs robot vacuum. Currently known to work
with the Ecovacs Deebot N79, M80 Pro, M81, M88 Pro, R95 and Slim 2
MKII from both North America and Europe.

All credits for figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## Installation

	npm install sucks

## Usage

To get started, you'll need to have already set up an EcoVacs account
using your smartphone.

Connecting to your vacuum is performed in two steps:
1. Connect to the HTTP API and retrieve the devices connected to your account
2. Connect to the XMPP server to send and receive messages to/from your vacuum

Once you have your account setup, step one is to log in:
```javascript
const sucks = require('sucks')
	, EcoVacsAPI = sucks.EcoVacsAPI
	, VacBot = sucks.VacBot;

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
vacbot.run("clean", [mode, [speed]]);
vacbot.run("edge");
vacbot.run("spot");
vacbot.run("stop");
vacbot.run("charge");
vacbot.run("move", direction);
vacbot.run("left"); // shortcut for vacbot.run("move", "left")
vacbot.run("right"); // shortcut for vacbot.run("move", "right")
vacbot.run("forward"); // shortcut for vacbot.run("move", "forward")
vacbot.run("turnaround"); // shortcut for vacbot.run("move", "turnaround")
vacbot.run("deviceinfo");
vacbot.run("cleanstate");
vacbot.run("chargestate");
vacbot.run("batterystate");
vacbot.run("lifespan", component);
vacbot.run("settime", timestamp, timezone);
```

Or you can use command classes like the original python sucks library
```javascript
vacbot.send_command(new sucks.Clean([mode, [speed]]));
vacbot.send_command(new sucks.Edge());
vacbot.send_command(new sucks.Spot());
vacbot.send_command(new sucks.Stop());
vacbot.send_command(new sucks.Charge());
vacbot.send_command(new sucks.Move(direction));
vacbot.send_command(new sucks.GetDeviceInfo());
vacbot.send_command(new sucks.GetCleanState());
vacbot.send_command(new sucks.GetChargeState());
vacbot.send_command(new sucks.GetBatteryState());
vacbot.send_command(new sucks.GetLifeSpan(component));
vacbot.send_command(new sucks.SetTime(timestamp, timezone));
```

Possible options for direction are `left`, `right`, `forward`, `turnaround`, and `stop`.

Possible options for clean mode are `auto`, `edge`, `spot`, `single_room`, and `stop`.

Possible options for cleaning fan speed are `normal` and `high`.

Possible options for lifespan component are `main_brush`, `side_brush` and `filter`.

Based on the response from the XMPP Server several events are
emitted:
* `stanza`: generic event with an object as it's argument: {type: 
  \<any of the other event names in this list\>, value: \<value object\>}
* `ChargeState`: event fired when the charge state is reported. Argument
  of the event is a string representing the charge state.
* `BatteryInfo`: event fired when the battery charge state is reported.
  Argument of the event is a float between 0 and 1 representing the
  battery percentage.
* `CleanReport`: event fired when the cleaning status is reported.
  Argument of the event is a string representing the cleaning state.

## Example

A simple usage might go something like this:

```javascript
const sucks = require('sucks')
	, EcoVacsAPI = sucks.EcoVacsAPI
	, VacBot = sucks.VacBot
	, nodeMachineId = require('node-machine-id')
	, http = require('http')
	, countries = sucks.countries;

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
				vacbot.run("batterystate");
				vacbot.run("clean");
				setTimeout(() => {
					vacbot.run("stop");
					vacbot.run("charge");
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

## Contribute

If you want to contribute to this library, feel free to check out the code,
perform `npm install`, start coding, and do a pull request. Existing
tests can be performed with `npm test` or `npm run test_windows` on
Windows. Please add tests for any new functionality you add to the code.

## Dedication

As already mentioned above all credits for figuring out and documenting the
protocol as well as developing the python library this port is based on go
to [@wpietri](https://github.com/wpietri).

In this javascript port the following libraries are leveraged:
* [simple-xmpp](https://www.npmjs.com/package/simple-xmpp) which in turn is
  an easy to use wrapper around [node-xmpp-client](https://www.npmjs.com/package/node-xmpp-client)
  of which some elements are used directly as well.

The example code about uses the following additional resources:
* [node-machine-id](https://www.npmjs.com/package/node-machine-id) which
  provides an easy way to create a unique identifier for the machine running
  the code.
* [https://ipinfo.io/](https://ipinfo.io/) which provides a json API for IP address information
  and is free to use for testing or non-commercial use up to 1000 requests
  per day.
