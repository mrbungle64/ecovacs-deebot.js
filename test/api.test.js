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
              throw Error(err);
            }
            assert.strictEqual(err.response.status, 404);
          }
        })
      );
    });

    it('should store the first 8 characters of the device id as the resource id', function () {
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", "eu");
      assert.strictEqual(api.resource, "abcdefgh");
    });

    it('should store the country provided', function () {
      const country = "nl";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", country, "eu");
      assert.ok(api.country, 'country should be set');
      assert.strictEqual(api.country, country.toUpperCase());
    });

    it('should store the continent provided', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.continent, 'continent should be set');
      assert.strictEqual(api.continent, continent);
    });

    it('should provide a version number', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.getVersion(), 'getVersion() should return a value');
      assert.ok(ecovacsDeebot.EcoVacsAPI.version(), 'EcoVacsAPI.version() should return a value');
      assert.strictEqual(api.getVersion(), ecovacsDeebot.EcoVacsAPI.version());
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

  describe('VacBot platform type & device category robustness', function () {
    const VacBot = require('../library/vacBot');

    it('should gracefully handle missing capabilityManager and return empty string or Unknown Device', function () {
      const mockVacuum = {
        class: 'nonexistent',
        did: 'mock_did',
        resource: 'mock_res'
      };
      const bot = {
        vacuum: mockVacuum,
        deviceClass: 'nonexistent'
      };
      
      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getDeviceCategory = VacBot.prototype.getDeviceCategory.bind(bot);

      assert.strictEqual(bot.getPlatformType(), '');
      assert.strictEqual(bot.getDeviceCategory(), 'Unknown Device');
    });

    it('should gracefully handle capabilityManager throwing errors', function () {
      const bot = {
        capabilityManager: {
          getPlatformType: () => { throw new Error('Simulated failure'); },
          getDeviceCategory: () => { throw new Error('Simulated failure'); }
        }
      };

      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getDeviceCategory = VacBot.prototype.getDeviceCategory.bind(bot);

      assert.strictEqual(bot.getPlatformType(), '');
      assert.strictEqual(bot.getDeviceCategory(), 'Unknown Device');
    });

    it('should fall back to getDeviceProperty if capabilityManager returns unknown or fails', function () {
      const bot = {
        capabilityManager: {
          getPlatformType: () => 'unknown',
          getDeviceCategory: () => 'unknown'
        },
        getDeviceProperty: (prop) => prop === 'deviceCategory' ? 'Vacuum Cleaner' : null
      };

      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getDeviceCategory = VacBot.prototype.getDeviceCategory.bind(bot);

      assert.strictEqual(bot.getPlatformType(), '');
      assert.strictEqual(bot.getDeviceCategory(), 'Vacuum Cleaner');
    });

    it('should not cause infinite recursion if getModelType calls getPlatformType', function () {
      const bot = {};
      bot.getPlatformType = VacBot.prototype.getPlatformType.bind(bot);
      bot.getModelType = VacBot.prototype.getModelType.bind(bot);

      assert.strictEqual(bot.getPlatformType(), '');
      assert.strictEqual(bot.getModelType(), '');
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
