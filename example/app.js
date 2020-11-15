const ecovacsDeebot = require('../index.js')
  , EcoVacsAPI = ecovacsDeebot.EcoVacsAPI
  , nodeMachineId = require('node-machine-id')
  , http = require('http')
  , countries = ecovacsDeebot.countries
  , myInfo = require('./myInfo.js');


let account_id = myInfo ? myInfo.ACCOUNT_ID : "email@domain.com"
  , password = myInfo ? myInfo.PASSWORD : "a1b2c3d4"
  , password_hash = EcoVacsAPI.getDeviceId(password)
  , device_id = EcoVacsAPI.md5(nodeMachineId.machineIdSync())
  , country = myInfo ? myInfo.COUNTRY : null
  , continent = myInfo ? myInfo.CONTINENT : null;


httpGetJson('http://ipinfo.io/json').then((json) => {
  country = json['country'].toUpperCase();

  if (!countries[country]) {
    throw "Unrecognized country code";
  }
  if (!countries[country].continent) {
    throw "Continent unknown for this country code";
  }

  continent = countries[country].continent.toUpperCase();

  console.log("Device ID: %s", device_id);
  console.log("Account ID: %s", account_id);
  console.log("Encrypted account ID: %s", EcoVacsAPI.encrypt(account_id));
  console.log("Password hash: %s", password_hash);
  console.log("Encrypted password hash: %s", EcoVacsAPI.encrypt(password_hash));
  console.log("Country: %s", country);
  console.log("Continent: %s", continent);

  let api = new EcoVacsAPI(device_id, country, continent);

  // Login
  api.connect(account_id, password_hash).then(() => {
    console.log("Connected!");
    // Get devices
    api.devices().then((devices) => {

      let vacuum = devices[0];
      let vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);

      vacbot.on("ready", (event) => {
       console.log("Vacbot ready");

       vacbot.run("batterystate");
       vacbot.run("clean");



       setTimeout(() => {
        vacbot.run("stop");
        vacbot.run("charge");
      }, 10000);

       vacbot.on("BatteryInfo", (battery) => {
          console.log("Battery level: %d\%", Math.round(battery.power));
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
