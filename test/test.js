'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
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
      assert.ok(api.country);
      assert.strictEqual(api.country, country.toUpperCase());
    });

    it('should store the continent provided', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.continent);
      assert.strictEqual(api.continent, continent);
    });

    it('should provide a version number', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.getVersion());
      assert.ok(ecovacsDeebot.EcoVacsAPI.version());
      assert.strictEqual(api.getVersion(), ecovacsDeebot.EcoVacsAPI.version());
    });
  });

  describe('rsa key file', function () {
    const fs = require('fs');
    const crypto = require('crypto');

    it('should exist as a file', async function () {
      await fs.promises.stat("key.pem");
    });

    it('should be a valid key file', function () {
      assert.doesNotThrow(() => {
        const encrypted = crypto.publicEncrypt({
          key: fs.readFileSync("key.pem", "utf8"),
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, Buffer.from("unencrypted")).toString('base64');
      });
    });
  });
});

describe('API tools', function () {
  describe('#isObject', function () {
    it('should check if a value is truly an object', function () {
      assert.strictEqual(tools.isObject(null), false);
      assert.strictEqual(tools.isObject("test"), false);
      assert.strictEqual(tools.isObject(String("test")), false);
      assert.strictEqual(tools.isObject(100), false);
      assert.strictEqual(tools.isObject(100.5), false);
      assert.strictEqual(tools.isObject(true), false);
      assert.strictEqual(tools.isObject(undefined), false);
      assert.strictEqual(tools.isObject(Symbol()), false);
      assert.strictEqual(tools.isObject({}), true);
      assert.strictEqual(tools.isObject({ key: "value" }), true);
      assert.strictEqual(tools.isObject(JSON.parse('{"key": "value"}')), true);
      assert.strictEqual(tools.isObject(() => {
      }), true);
      assert.strictEqual(tools.isObject({}), true);
      assert.strictEqual(tools.isObject(new Date()), true);
    });
  });

  describe('#string.format', function () {
    it('should add a format method to the prototype of String', function () {
      assert.ok(tools.formatString("abcdefghijklmnopqrestuvwyz"));
    });

    it('should replace key identifiers with provided values', function () {
      assert.strictEqual(tools.formatString("{first} {second}", { first: "Hello", second: "world" }), "Hello world");
      assert.strictEqual(tools.formatString("{first} world", { first: "Hello" }), "Hello world");
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

  describe('getModelType', function () {
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
        { class: '5xu9h3', expected: 'goat' },
        { class: '123', expected: 'legacy' }
      ];

      examples.forEach(({ class: deviceClass, expected }) => {
        const modelType = tools.getModelType(deviceClass);
        assert.strictEqual(modelType, expected,
          `Device class "${deviceClass}" should have model type "${expected}", but got "${modelType}"`);
      });
    });
  });
});

describe('Tools Extended', function () {
  it('getTimeStringFormatted should format correctly', function () {
    assert.strictEqual(tools.getTimeStringFormatted(3661), '1h 01m 01s');
    assert.strictEqual(tools.getTimeStringFormatted(0), '0h 00m 00s');
  });

  it('getReqID should return 8 digits', function () {
    const id = tools.getReqID();
    assert.match(id, /^\d{8}$/);
  });

  it('deviceClassLinks should be valid', function () {
    const allDevices = tools.getAllKnownDevices();
    for (const [id, data] of Object.entries(allDevices)) {
      if (data.deviceClassLink) {
        assert.ok(allDevices[data.deviceClassLink],
          `Device ${id} links to non-existent ${data.deviceClassLink}`);
      }
    }
  });
});
