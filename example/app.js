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

  if (!countries[country.toUpperCase()]) {
    throw "Unrecognized country code";
  }
  if (!countries[country.toUpperCase()].continent) {
    throw "Continent unknown for this country code";
  }

  continent = countries[country.toUpperCase()].continent.toLowerCase();

  console.log("Device ID: %s", device_id);
  console.log("Account ID: %s", account_id);
  console.log("Encrypted account ID: %s", EcoVacsAPI.encrypt(account_id));
  console.log("Password hash: %s", password_hash);
  console.log("Encrypted password hash: %s", EcoVacsAPI.encrypt(password_hash));
  console.log("Country: %s", country);
  console.log("Conttinent: %s", continent);

  let api = new EcoVacsAPI(device_id, country, continent);

  // Login
  api.connect(account_id, password_hash).then(() => {
    console.log("Connected!");
    // Get devices
    api.devices().then((devices) => {
      console.log("Devices:", JSON.stringify(devices));

      let vacuum = devices[0];
      let vacbot = new VacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
      vacbot.on("ready", (event) => {
        console.log("Vacbot ready: %s", JSON.stringify(event.jid));

        vacbot.run("batterystate");
        vacbot.run("clean");
        setTimeout(() => {
          vacbot.run("stop");
          vacbot.run("charge");
        }, 60000);

        vacbot.on("BatteryInfo", (battery) => {
          console.log("Battery level: %d\%", Math.round(battery * 100));
        });

        vacbot.on("CleanReport", (clean_status) => {
          console.log("Clean status: %s", clean_status);
        });

        vacbot.on("ChargeState", (charge_status) => {
          console.log("Charge status: %s", charge_status);
        });

        vacbot.on("PushRobotNotify", (values) => {
          console.log("Notification '%s': %s", values.type, values.act);
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
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        console.error("[App]", error.message);
        // consume response data to free up memory
        res.resume();
        throw error;
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', function () {
        try {
          const json = JSON.parse(rawData);
          resolve(json);
        } catch (e) {
          console.error("[App]", e.message);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      reject(e);
    });
  });
}
