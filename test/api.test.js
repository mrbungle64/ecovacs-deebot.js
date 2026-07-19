'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

const ecovacsDeebot = require('../index.js');
const tools = require('../library/tools.js');
const constants = require('../library/constants');
const i18n = require('../library/i18n');

describe('API', function () {
  describe('storing variables', function () {
    it('should connect to every continent API', async function () {
      const continents = [];

      await Promise.all(
        Object.values(ecovacsDeebot.countries).map(async ({ continent }) => {
          if (continents.includes(continent)) {
            return;
          }
          continents.push(continent);

          try {
            let portalUrlFormat = constants.PORTAL_ECOUSER_API;
            if (continent === 'WW') {
              portalUrlFormat = constants.PORTAL_ECOUSER_API_LEGACY;
            }
            const url = tools.formatString(portalUrlFormat, { "continent": continent });
            await axios.get(url, { timeout: 5000 });
          } catch (err) {
            if (err.code === 'ENOTFOUND') {
              throw new Error(err.message, { cause: err });
            }
            assert.strictEqual(err.response.status, 404);
          }
        })
      );
    });

    it('should store the first 8 characters of the device id as the resource id', function () {
      const api = new ecovacsDeebot.EcovacsAPI("abcdefghijklmnopqrestuvwyz", "nl", "eu");
      assert.strictEqual(api.resource, "abcdefgh");
    });

    it('should store the country provided', function () {
      const country = "nl";
      const api = new ecovacsDeebot.EcovacsAPI("abcdefghijklmnopqrestuvwyz", country, "eu");
      assert.ok(api.country, 'country should be set');
      assert.strictEqual(api.country, country.toUpperCase());
    });

    it('should store the continent provided', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcovacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.continent, 'continent should be set');
      assert.strictEqual(api.continent, continent);
    });

    it('should provide a version number', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcovacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.getVersion(), 'getVersion() should return a value');
      assert.ok(ecovacsDeebot.EcovacsAPI.version(), 'EcovacsAPI.version() should return a value');
      assert.strictEqual(api.getVersion(), ecovacsDeebot.EcovacsAPI.version());
    });
  });

  describe('auth domain selection (Ecovacs vs yeedi)', function () {
    const DEVICE_ID = 'abcdefghijklmnopqrestuvwyz';

    it('uses Ecovacs app identity for the default auth domain', function () {
      const api = new ecovacsDeebot.EcovacsAPI(DEVICE_ID, 'de', 'eu');
      const meta = api.getMetaObject();
      assert.strictEqual(meta.appCode, 'global_e');
      assert.strictEqual(meta.appVersion, '2.2.3');
    });

    it('uses yeedi app identity for the yeedi auth domain', function () {
      const api = new ecovacsDeebot.EcovacsAPI(DEVICE_ID, 'de', 'eu', constants.AUTH_DOMAIN_YD);
      const meta = api.getMetaObject();
      assert.strictEqual(meta.appCode, 'yd_global_e');
      assert.strictEqual(meta.appVersion, '1.3.0');
    });

    it('_authDomainValue picks the value matching the auth domain', function () {
      const ecovacsApi = new ecovacsDeebot.EcovacsAPI(DEVICE_ID, 'de', 'eu');
      const yeediApi = new ecovacsDeebot.EcovacsAPI(DEVICE_ID, 'de', 'eu', constants.AUTH_DOMAIN_YD);
      assert.strictEqual(ecovacsApi._authDomainValue('eco', 'yd'), 'eco');
      assert.strictEqual(yeediApi._authDomainValue('eco', 'yd'), 'yd');
    });

    it('verification meta inherits Ecovacs appCode for the default auth domain', function () {
      const api = new ecovacsDeebot.EcovacsAPI(DEVICE_ID, 'DE', 'eu');
      const verifyMeta = api.getVerificationMetaObject();
      assert.strictEqual(verifyMeta.appCode, 'global_e');
      assert.strictEqual(verifyMeta.appVersion, constants.VERIFY_APP_VERSION);
      assert.strictEqual(verifyMeta.country, 'de', 'verification meta should lowercase the country');
    });

    it('verification meta inherits yeedi appCode for the yeedi auth domain', function () {
      const api = new ecovacsDeebot.EcovacsAPI(DEVICE_ID, 'DE', 'eu', constants.AUTH_DOMAIN_YD);
      const verifyMeta = api.getVerificationMetaObject();
      assert.strictEqual(verifyMeta.appCode, 'yd_global_e');
      assert.strictEqual(verifyMeta.appVersion, constants.VERIFY_APP_VERSION);
      assert.strictEqual(verifyMeta.country, 'de');
    });
  });

  describe('rsa key file', function () {
    it('should exist as a file', async function () {
      await fs.promises.stat("key.pem");
    });

    it('should be a valid key file', function () {
      assert.doesNotThrow(() => {
        crypto.publicEncrypt({
          key: fs.readFileSync("key.pem", "utf8"),
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, Buffer.from("unencrypted")).toString('base64');
      });
    });
  });
});

describe('API tools', function () {
  describe('#isObject', function () {
    it('should return false for primitive values and null', function () {
      assert.strictEqual(tools.isObject(null), false);
      assert.strictEqual(tools.isObject("test"), false);
      assert.strictEqual(tools.isObject(String("test")), false);
      assert.strictEqual(tools.isObject(100), false);
      assert.strictEqual(tools.isObject(100.5), false);
      assert.strictEqual(tools.isObject(true), false);
      assert.strictEqual(tools.isObject(undefined), false);
      assert.strictEqual(tools.isObject(Symbol()), false);
    });

    it('should return true for plain objects, functions and class instances', function () {
      assert.strictEqual(tools.isObject({}), true);
      assert.strictEqual(tools.isObject({ key: "value" }), true);
      assert.strictEqual(tools.isObject(JSON.parse('{"key": "value"}')), true);
      assert.strictEqual(tools.isObject(() => {}), true);
      assert.strictEqual(tools.isObject(new Date()), true);
    });

    it('should return true for arrays (arrays are objects in JavaScript)', function () {
      // Arrays are objects in JS – isObject() intentionally returns true
      assert.strictEqual(tools.isObject([]), true);
      assert.strictEqual(tools.isObject([1, 2, 3]), true);
    });
  });

  describe('#string.format', function () {
    it('should return the original string when called without replacement args', function () {
      assert.ok(tools.formatString("abcdefghijklmnopqrestuvwyz"));
      assert.strictEqual(tools.formatString("plain string"), "plain string");
    });

    it('should handle empty string without throwing', function () {
      assert.strictEqual(tools.formatString(""), "");
      assert.strictEqual(tools.formatString("", {}), "");
    });

    it('should replace key identifiers with provided values', function () {
      assert.strictEqual(tools.formatString("{first} {second}", { first: "Hello", second: "world" }), "Hello world");
      assert.strictEqual(tools.formatString("{first} world", { first: "Hello" }), "Hello world");
    });

    it('should replace the same key multiple times in one template', function () {
      assert.strictEqual(tools.formatString("{key}-{key}", { key: "x" }), "x-x");
    });

    it('should not replace key identifiers when not provided as values', function () {
      assert.strictEqual(tools.formatString("{first} {second}", { foo: "Hello", bar: "world" }), "{first} {second}");
      assert.strictEqual(tools.formatString("{first} world", { foo: "Hello", bar: "world" }), "{first} world");
      assert.strictEqual(tools.formatString("{first} {second}", {}), "{first} {second}");
    });
  });

  describe('countries', function () {
    it('should export a countries object', function () {
      assert.ok(ecovacsDeebot.countries);
    });
  });

  describe('i18n', function () {
    it('should translate a spot area name', function () {
      assert.strictEqual(i18n.getSpotAreaName('random spot area name', 'en'), 'random spot area name');
      assert.strictEqual(i18n.getSpotAreaName('living room'), 'Living room');
      assert.strictEqual(i18n.getSpotAreaName('living room', 'en'), 'Living room');
      assert.strictEqual(i18n.getSpotAreaName('living room', 'de'), 'Wohnzimmer');
      assert.notStrictEqual(i18n.getSpotAreaName('living room', 'en'), 'Wohnzimmer');
      assert.notStrictEqual(i18n.getSpotAreaName('living room'), 'Wohnzimmer');
    });
  });

  describe('getPlatformType', function () {
    it('should return a valid type (not "unknown") for all models in models.js', function () {
      const allDevices = tools.getAllKnownDevices();
      const deviceClasses = Object.keys(allDevices);

      assert.ok(deviceClasses.length > 0, 'There should be at least one device class');

      deviceClasses.forEach(deviceClass => {
        const platformType = tools.getPlatformType(deviceClass);
        assert.notStrictEqual(platformType, 'unknown',
          `Device class "${deviceClass}" (${allDevices[deviceClass].name}) should have a known platform type, but got "unknown"`);
      });
    });

    it('should return the correct type for specific example models', function () {
      const examples = [
        { class: 'yna5xi', expected: '950' },
        { class: 'h18jkh', expected: 'T8' },
        { class: 'ucn2xe', expected: 'T9' },
        { class: 'n6cwdb', expected: 'N8' },
        { class: 'jtmf04', expected: 'T10' },
        { class: '2o4lnm', expected: 'X1' },
        { class: 'e6ofmn', expected: 'X2' },
        { class: 'ipzjy0', expected: 'U2' },
        { class: 'h041es', expected: 'yeedi' },
        { class: 'sdp1y1', expected: 'airbot' },
        { class: '20anby', expected: 'aqMonitor' },
        { class: '5xu9h3', expected: 'lawnMower' },
        { class: '123', expected: 'legacy' }
      ];

      examples.forEach(({ class: deviceClass, expected }) => {
        const platformType = tools.getPlatformType(deviceClass);
        assert.strictEqual(platformType, expected,
          `Device class "${deviceClass}" should have platform type "${expected}", but got "${platformType}"`);
      });
    });
  });

  describe('getModelType (deprecated alias for getPlatformType)', function () {
    it('should return a valid type (not "unknown") for all models in models.js', function () {
      const allDevices = tools.getAllKnownDevices();
      const deviceClasses = Object.keys(allDevices);

      assert.ok(deviceClasses.length > 0, 'There should be at least one device class');

      deviceClasses.forEach(deviceClass => {
        const modelType = tools.getModelType(deviceClass);
        assert.notStrictEqual(modelType, 'unknown',
          `Device class "${deviceClass}" (${allDevices[deviceClass].name}) should have a known model type, but got "unknown"`);
      });
    });

    it('should return the correct type for specific example models', function () {
      const examples = [
        { class: 'yna5xi', expected: '950' },
        { class: 'h18jkh', expected: 'T8' },
        { class: 'ucn2xe', expected: 'T9' },
        { class: 'n6cwdb', expected: 'N8' },
        { class: 'jtmf04', expected: 'T10' },
        { class: '2o4lnm', expected: 'X1' },
        { class: 'e6ofmn', expected: 'X2' },
        { class: 'ipzjy0', expected: 'U2' },
        { class: 'h041es', expected: 'yeedi' },
        { class: 'sdp1y1', expected: 'airbot' },
        { class: '20anby', expected: 'aqMonitor' },
        { class: '5xu9h3', expected: 'lawnMower' },
        { class: '123', expected: 'legacy' }
      ];

      examples.forEach(({ class: deviceClass, expected }) => {
        const modelType = tools.getModelType(deviceClass);
        assert.strictEqual(modelType, expected,
          `Device class "${deviceClass}" should have model type "${expected}", but got "${modelType}"`);
      });
    });

    it('should always return the same value as getPlatformType() (alias contract)', function () {
      // getModelType is a @deprecated alias — its return value MUST be identical to getPlatformType
      const allDevices = tools.getAllKnownDevices();
      Object.keys(allDevices).forEach(deviceClass => {
        assert.strictEqual(
          tools.getModelType(deviceClass),
          tools.getPlatformType(deviceClass),
          `getModelType() and getPlatformType() differ for device class "${deviceClass}"`
        );
      });
    });

    it('should return "unknown" for an unrecognized device class', function () {
      assert.strictEqual(tools.getModelType('__nonexistent_device__'), 'unknown');
      assert.strictEqual(tools.getPlatformType('__nonexistent_device__'), 'unknown');
    });
  });

  describe('getDeviceCategory', function () {
    it('should return a valid device category (not "unknown") for all models in models.js', function () {
      const allDevices = tools.getAllKnownDevices();
      const deviceClasses = Object.keys(allDevices);

      assert.ok(deviceClasses.length > 0, 'There should be at least one device class');

      deviceClasses.forEach(deviceClass => {
        const deviceCategory = tools.getDeviceCategory(deviceClass);
        assert.notStrictEqual(deviceCategory, 'unknown',
          `Device class "${deviceClass}" (${allDevices[deviceClass].name}) should have a known device category, but got "unknown"`);
      });
    });

    it('should return the correct device category for specific example models', function () {
      const examples = [
        { class: 'yna5xi', expected: 'Vacuum Cleaner' },
        { class: 'h18jkh', expected: 'Vacuum Cleaner' },
        { class: 'ucn2xe', expected: 'Vacuum Cleaner' },
        { class: 'n6cwdb', expected: 'Vacuum Cleaner' },
        { class: 'jtmf04', expected: 'Vacuum Cleaner' },
        { class: '2o4lnm', expected: 'Vacuum Cleaner' },
        { class: 'e6ofmn', expected: 'Vacuum Cleaner' },
        { class: 'ipzjy0', expected: 'Vacuum Cleaner' },
        { class: 'h041es', expected: 'Vacuum Cleaner' },
        { class: 'sdp1y1', expected: 'Air Purifier' },
        { class: '20anby', expected: 'Air Quality Monitor' },
        { class: '5xu9h3', expected: 'Lawn Mower' },
        { class: '123', expected: 'Vacuum Cleaner' }
      ];

      examples.forEach(({ class: deviceClass, expected }) => {
        const deviceCategory = tools.getDeviceCategory(deviceClass);
        assert.strictEqual(deviceCategory, expected,
          `Device class "${deviceClass}" should have device category "${expected}", but got "${deviceCategory}"`);
      });
    });
  });

  describe('getSmartType', function () {
    it('should return a valid smartType (not "unknown") for all models in models.js', function () {
      const allDevices = tools.getAllKnownDevices();
      const deviceClasses = Object.keys(allDevices);

      assert.ok(deviceClasses.length > 0, 'There should be at least one device class');

      deviceClasses.forEach(deviceClass => {
        const smartType = tools.getSmartType(deviceClass);
        assert.notStrictEqual(smartType, 'unknown',
          `Device class "${deviceClass}" (${allDevices[deviceClass].name}) should have a known smartType, but got "unknown"`);
      });
    });

    it('should return the correct smartType for specific example models', function () {
      const examples = [
        { class: 'yna5xi', expected: 'MQ_AP' },
        { class: 'h18jkh', expected: 'MQ_AP' },
        { class: 'ucn2xe', expected: 'MQ_AP' },
        { class: 'n6cwdb', expected: 'MQ_AP' },
        { class: 'jtmf04', expected: 'MQ_AP' },
        { class: '2o4lnm', expected: 'MQ_AP' },
        { class: 'e6ofmn', expected: 'BLAP2' },
        { class: 'ipzjy0', expected: 'MQ_AP' },
        { class: 'h041es', expected: 'QRP' },
        { class: 'sdp1y1', expected: 'QRP' },
        { class: '20anby', expected: 'MQ_AP' },
        { class: '5xu9h3', expected: 'BLAP' },
        { class: '123', expected: 'SPA' }
      ];

      examples.forEach(({ class: deviceClass, expected }) => {
        const smartType = tools.getSmartType(deviceClass);
        assert.strictEqual(smartType, expected,
          `Device class "${deviceClass}" should have smartType "${expected}", but got "${smartType}"`);
      });
    });
  });

  describe('950 V2 type resolution (casing consistency)', function () {
    // Regression for the `950type_v2` casing bug: EcovacsAPI.isDeviceClass950v2type()
    // used the lowercase key, which never matched the back-compat alias and always
    // returned false — disagreeing with EcovacsDevice.is950type_V2() (which reads `V2`).
    const V2_CLASS = 'x5d34r';     // DEEBOT OZMO T8 AIVI (V2: true)
    const NON_V2_CLASS = 'vi829v'; // DEEBOT OZMO 920 (V2: false)

    it('isDeviceClass950v2type() should agree with the canonical V2 property', function () {
      assert.strictEqual(ecovacsDeebot.EcovacsAPI.isDeviceClass950v2type(V2_CLASS), true);
      assert.strictEqual(ecovacsDeebot.EcovacsAPI.isDeviceClass950v2type(NON_V2_CLASS), false);
    });

    it('getDeviceProperty() should resolve the V2 back-compat alias in either casing', function () {
      for (const cls of [V2_CLASS, NON_V2_CLASS]) {
        const canonical = tools.getDeviceProperty(cls, 'V2', false);
        assert.strictEqual(tools.getDeviceProperty(cls, '950type_v2', false), canonical,
          `lowercase '950type_v2' should equal 'V2' for ${cls}`);
        assert.strictEqual(tools.getDeviceProperty(cls, '950type_V2', false), canonical,
          `uppercase '950type_V2' should equal 'V2' for ${cls}`);
      }
    });
  });

  describe('VacBot platform type, device category & smartType robustness', function () {
    const VacBot = require('../library/vacBot');

    it('should return unknown sentinel when capabilityManager is absent', function () {
      const bot = {
        vacuum: { class: 'nonexistent', did: 'mock_did', resource: 'mock_res' },
        deviceClass: 'nonexistent'
      };

      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getDeviceCategory = VacBot.prototype.getDeviceCategory.bind(bot);
      bot.getSmartType = VacBot.prototype.getSmartType.bind(bot);

      assert.strictEqual(bot.getPlatformType(), 'unknown');
      assert.strictEqual(bot.getDeviceCategory(), 'unknown');
      assert.strictEqual(bot.getSmartType(), 'unknown');
    });

    it('should fall back to getDeviceProperty if capabilityManager returns unknown', function () {
      const bot = {
        capabilityManager: {
          getPlatformType: () => 'unknown',
          getDeviceCategory: () => 'unknown',
          getSmartType: () => 'unknown'
        },
        getDeviceProperty: (prop) => {
          if (prop === 'deviceCategory') return 'Vacuum Cleaner';
          if (prop === 'smartType') return 'BLAP2';
          return null;
        }
      };

      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getDeviceCategory = VacBot.prototype.getDeviceCategory.bind(bot);
      bot.getSmartType = VacBot.prototype.getSmartType.bind(bot);

      assert.strictEqual(bot.getPlatformType(), 'unknown');
      assert.strictEqual(bot.getDeviceCategory(), 'Vacuum Cleaner');
      assert.strictEqual(bot.getSmartType(), 'BLAP2');
    });

    it('should not cause infinite recursion if getModelType calls getPlatformType', function () {
      const bot = {};
      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getModelType = VacBot.prototype.getModelType.bind(bot);

      assert.strictEqual(bot.getPlatformType(), 'unknown');
      assert.strictEqual(bot.getModelType(), 'unknown');
    });
  });
});

describe('Tools Extended', function () {
  describe('#getTimeStringFormatted', function () {
    it('should format seconds into h m s notation', function () {
      assert.strictEqual(tools.getTimeStringFormatted(3661), '1h 01m 01s');
      assert.strictEqual(tools.getTimeStringFormatted(0), '0h 00m 00s');
    });

    it('should pad minutes and seconds with leading zeros', function () {
      assert.strictEqual(tools.getTimeStringFormatted(60), '0h 01m 00s');
      assert.strictEqual(tools.getTimeStringFormatted(3600), '1h 00m 00s');
      assert.strictEqual(tools.getTimeStringFormatted(9), '0h 00m 09s');
    });
  });

  describe('#getPortalUrlFormat', function () {
    it('should select the CN portal for China accounts', function () {
      assert.strictEqual(tools.getPortalUrlFormat('CN', 'as'), constants.PORTAL_ECOUSER_API_CN);
    });

    it('should select the legacy portal for a WW country or continent', function () {
      assert.strictEqual(tools.getPortalUrlFormat('WW', 'eu'), constants.PORTAL_ECOUSER_API_LEGACY);
      assert.strictEqual(tools.getPortalUrlFormat('US', 'WW'), constants.PORTAL_ECOUSER_API_LEGACY);
      assert.strictEqual(tools.getPortalUrlFormat('US', 'ww'), constants.PORTAL_ECOUSER_API_LEGACY);
    });

    it('should select the default api-app portal otherwise', function () {
      assert.strictEqual(tools.getPortalUrlFormat('DE', 'eu'), constants.PORTAL_ECOUSER_API);
      assert.strictEqual(tools.getPortalUrlFormat('US', ''), constants.PORTAL_ECOUSER_API);
    });
  });

  describe('#getReqID', function () {
    it('should return exactly 8 digits', function () {
      const id = tools.getReqID();
      assert.match(id, /^\d{8}$/);
    });

    it('should return a different value on repeated calls (probabilistic)', function () {
      // With 10^8 possible values, the chance of collision in 5 calls is negligible
      const ids = new Set(Array.from({ length: 5 }, () => tools.getReqID()));
      assert.ok(ids.size > 1, 'getReqID() should not always return the same value');
    });
  });

  describe('#deviceClassLinks', function () {
    it('should all reference existing device classes', function () {
      const allDevices = tools.getAllKnownDevices();
      for (const [id, data] of Object.entries(allDevices)) {
        if (data.deviceClassLink) {
          assert.ok(
            allDevices[data.deviceClassLink],
            `Device ${id} links to non-existent ${data.deviceClassLink}`
          );
        }
      }
    });
  });

  describe('#isValidVirtualWallType', function () {
    it('should return true for valid virtual wall types', function () {
      assert.strictEqual(tools.isValidVirtualWallType('vw'), true);
      assert.strictEqual(tools.isValidVirtualWallType('mw'), true);
    });

    it('should return false for invalid virtual wall types', function () {
      assert.strictEqual(tools.isValidVirtualWallType(''), false);
      assert.strictEqual(tools.isValidVirtualWallType('VW'), false);
      assert.strictEqual(tools.isValidVirtualWallType('MW'), false);
      assert.strictEqual(tools.isValidVirtualWallType('other'), false);
      assert.strictEqual(tools.isValidVirtualWallType(null), false);
      assert.strictEqual(tools.isValidVirtualWallType(undefined), false);
    });
  });

  describe('#convertAreaValuesForFreeCleanCmd', function () {
    it('should convert a simple comma-separated list to semicolon-delimited format', function () {
      assert.strictEqual(tools.convertAreaValuesForFreeCleanCmd('1,2'), '1,1;1,2;');
    });

    it('should strip trailing commas before converting', function () {
      assert.strictEqual(tools.convertAreaValuesForFreeCleanCmd('1,2,'), '1,1;1,2;');
    });

    it('should strip all spaces before converting', function () {
      assert.strictEqual(tools.convertAreaValuesForFreeCleanCmd(' 1 , 2 '), '1,1;1,2;');
    });

    it('should pass through already-converted semicolon format unchanged', function () {
      const input = '1,1;1,2;';
      assert.strictEqual(tools.convertAreaValuesForFreeCleanCmd(input), input);
    });
  });

  describe('#areaValuesAreValidForFreeCleanCmd', function () {
    it('should return true for valid semicolon-delimited area values', function () {
      assert.strictEqual(tools.areaValuesAreValidForFreeCleanCmd('1,2;3,4'), true);
      assert.strictEqual(tools.areaValuesAreValidForFreeCleanCmd('10,20'), true);
      assert.strictEqual(tools.areaValuesAreValidForFreeCleanCmd('1,2;'), true); // trailing semicolon stripped
    });

    it('should return false for malformed area values', function () {
      assert.strictEqual(tools.areaValuesAreValidForFreeCleanCmd('abc'), false);
      assert.strictEqual(tools.areaValuesAreValidForFreeCleanCmd('1;2'), false); // missing comma-pair
      assert.strictEqual(tools.areaValuesAreValidForFreeCleanCmd(''), false);
    });
  });

  describe('#paramsToQueryList', function () {
    it('should encode parameters as a query string', function () {
      const result = tools.paramsToQueryList({ a: '1', b: '2' });
      assert.ok(result.includes('a=1'));
      assert.ok(result.includes('b=2'));
      assert.ok(result.includes('&'));
    });

    it('should URI-encode special characters in values', function () {
      const result = tools.paramsToQueryList({ key: 'hello world' });
      assert.strictEqual(result, 'key=hello%20world');
    });

    it('should return an empty string for empty params', function () {
      assert.strictEqual(tools.paramsToQueryList({}), '');
    });
  });

  describe('#createErrorDescription', function () {
    it('should describe ENOTFOUND as a DNS lookup failure', function () {
      const desc = tools.createErrorDescription('getaddrinfo ENOTFOUND example.com');
      assert.ok(desc.includes('DNS lookup failed'), `Expected DNS message, got: ${desc}`);
    });

    it('should describe EHOSTUNREACH as host unreachable', function () {
      const desc = tools.createErrorDescription('connect EHOSTUNREACH 192.168.1.1');
      assert.ok(desc.includes('Host is unreachable'), `Expected host unreachable message, got: ${desc}`);
    });

    it('should describe ECONNRESET as a connection interruption', function () {
      const desc = tools.createErrorDescription('read ECONNRESET');
      assert.ok(desc.includes('Connection is interrupted'), `Expected connection interrupted message, got: ${desc}`);
    });

    it('should describe ETIMEDOUT as a network connectivity error', function () {
      const desc = tools.createErrorDescription('connect ETIMEDOUT');
      assert.ok(desc.includes('Network connectivity error'), `Expected timeout message, got: ${desc}`);
    });

    it('should include the command name in a generic error description', function () {
      const desc = tools.createErrorDescription('Something failed', 'GetBatteryState');
      assert.ok(desc.includes('GetBatteryState'), `Expected command name in message, got: ${desc}`);
    });

    it('should return a generic message for unknown errors without a command', function () {
      const desc = tools.createErrorDescription('Unexpected failure');
      assert.ok(desc.includes('Received error message'), `Expected generic message, got: ${desc}`);
    });
  });
});
