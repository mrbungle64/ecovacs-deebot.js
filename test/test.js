const assert = require('assert');

const ecovacsDeebot = require('../index.js');
const tools = require('../library/tools.js');

describe('API', function () {
  describe('error checking', function () {
    it('should throw an error when no arguments are provided', function () {
      assert.throws(() => {
        const api = new ecovacsDeebot.EcoVacsAPI();
      });
    });

    it('should throw an error when no country or continent is provided', function () {
      assert.throws(() => {
        const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz");
      });
    });

    it('should throw an error when no continent is provided', function () {
      assert.throws(() => {
        const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl");
      });
    });

    it('should not throw an error when all arguments are provided to the constructor', function () {
      assert.doesNotThrow(() => {
        const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", "eu");
      });
    });
  });

  describe('storing variables', function () {
    it('should store the country and device id parameter in a meta variable', function () {
      const device_id = "abcdefghijklmnopqrestuvwyz";
      const country = "nl";
      const api = new ecovacsDeebot.EcoVacsAPI(device_id, country, "eu");
      assert.strictEqual(api.meta.deviceId, device_id);
      assert.strictEqual(api.meta.country, country);
    });

    it('should store the first 8 characters of the device id as the resource id', function () {
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", "eu");
      assert.strictEqual(api.resource, "abcdefgh");
    });

    it('should store the country provided', function () {
      const country = "nl";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", country, "eu");
      assert.ok(api.country);
      assert.strictEqual(api.country, country);
    });

    it('should store the continent provided', function () {
      const continent = "eu";
      const api = new ecovacsDeebot.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.continent);
      assert.strictEqual(api.continent, continent);
    });
  });

  describe('rsa key file', function () {
    const fs = require('fs')
      , crypto = require('crypto');

    it('should exist as a file', function (done) {
      fs.stat("key.pem", done);
    });

    it('should be a valid key file', function () {
      assert.doesNotThrow(() => {
        const encrypted = crypto.publicEncrypt({
          key: fs.readFileSync("key.pem", "utf8"),
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, new Buffer("unencrypted")).toString('base64');
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
      assert.strictEqual(tools.isObject({key: "value"}), true);
      assert.strictEqual(tools.isObject(JSON.parse('{"key": "value"}')), true);
      assert.strictEqual(tools.isObject(() => {
      }), true);
      assert.strictEqual(tools.isObject(new Object()), true);
      assert.strictEqual(tools.isObject(new Date()), true);
    });
  });

  describe('#string.format', function () {
    it('should add a format method to the prototype of String', function () {
      assert.ok("abcdefghijklmnopqrestuvwyz".format);
    });

    it('should replace key identifiers with provided values', function () {
      assert.strictEqual("{first} {second}".format({first: "Hello", second: "world"}), "Hello world");
      assert.strictEqual("{first} world".format({first: "Hello"}), "Hello world");
    });

    it('should not replace key identifiers when not provided as values', function () {
      assert.strictEqual("{first} {second}".format({foo: "Hello", bar: "world"}), "{first} {second}");
      assert.strictEqual("{first} world".format({foo: "Hello", bar: "world"}), "{first} world");
      assert.strictEqual("{first} {second}".format({}), "{first} {second}");
    });
  });

  describe('countries', function () {
    it('should export a countries object', function () {
      assert.ok(ecovacsDeebot.countries);
    });
  });
});
