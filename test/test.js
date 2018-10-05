const assert = require('assert');

const sucks = require('../index.js');

describe('API', function () {
  describe('error checking', function () {
    it('should throw an error when no arguments are provided', function () {
      assert.throws(() => {
        let api = new sucks.EcoVacsAPI();
      });
    });

    it('should throw an error when no country or continent is provided', function () {
      assert.throws(() => {
        let api = new sucks.EcoVacsAPI("abcdefghijklmnopqrestuvwyz");
      });
    });

    it('should throw an error when no continent is provided', function () {
      assert.throws(() => {
        let api = new sucks.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl");
      });
    });

    it('should not throw an error when all arguments are provided to the constructor', function () {
      assert.doesNotThrow(() => {
        let api = new sucks.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", "eu");
      });
    });
  });

  describe('storing variables', function () {
    it('should store the country and device id parameter in a meta variable', function () {
      let device_id = "abcdefghijklmnopqrestuvwyz";
      let country = "nl";
      let api = new sucks.EcoVacsAPI(device_id, country, "eu");
      assert.equal(api.meta.deviceId, device_id);
      assert.equal(api.meta.country, country);
    });

    it('should store the first 8 characters of the device id as the resource id', function () {
      let api = new sucks.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", "eu");
      assert.equal(api.resource, "abcdefgh");
    });

    it('should store the country provided', function () {
      let country = "nl";
      let api = new sucks.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", country, "eu");
      assert.ok(api.country);
      assert.equal(api.country, country);
    });

    it('should store the continent provided', function () {
      let continent = "eu";
      let api = new sucks.EcoVacsAPI("abcdefghijklmnopqrestuvwyz", "nl", continent);
      assert.ok(api.continent);
      assert.equal(api.continent, continent);
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
        let encrypted = crypto.publicEncrypt({
          key: fs.readFileSync("key.pem", "utf8"),
          padding: crypto.constants.RSA_PKCS1_PADDING
        }, new Buffer("unencrypted")).toString('base64');
      });
    });
  });
});

describe('API tools', function () {
  describe('#isObject', function () {
    it('should check if a value is truely an object', function () {
      assert.equal(sucks.isObject(null), false);
      assert.equal(sucks.isObject("test"), false);
      assert.equal(sucks.isObject(String("test")), false);
      assert.equal(sucks.isObject(100), false);
      assert.equal(sucks.isObject(100.5), false);
      assert.equal(sucks.isObject(true), false);
      assert.equal(sucks.isObject(undefined), false);
      assert.equal(sucks.isObject(Symbol()), false);
      assert.equal(sucks.isObject({}), true);
      assert.equal(sucks.isObject({key: "value"}), true);
      assert.equal(sucks.isObject(JSON.parse('{"key": "value"}')), true);
      assert.equal(sucks.isObject(() => {
      }), true);
      assert.equal(sucks.isObject(new Object()), true);
      assert.equal(sucks.isObject(new Date()), true);
    });
  });

  describe('#string.format', function () {
    it('should add a format method to the prototype of String', function () {
      assert.ok("abcdefghijklmnopqrestuvwyz".format);
    });

    it('should replace key identifiers with provided values', function () {
      assert.equal("{first} {second}".format({first: "Hello", second: "world"}), "Hello world");
      assert.equal("{first} world".format({first: "Hello"}), "Hello world");
    });

    it('should not replace key identifiers when not provided as values', function () {
      assert.equal("{first} {second}".format({foo: "Hello", bar: "world"}), "{first} {second}");
      assert.equal("{first} world".format({foo: "Hello", bar: "world"}), "{first} world");
      assert.equal("{first} {second}".format({}), "{first} {second}");
      assert.equal("{first} {second}".format(), "{first} {second}");
    });
  });

  describe('countries', function () {
    it('should export a countries object', function () {
      assert.ok(sucks.countries);
    });

    it('should export the continent for 250 countries', function () {
      let iter = 0;
      for (let key in sucks.countries) {
        if (sucks.countries.hasOwnProperty(key)) {
          if (!!sucks.countries[key].continent) {
            iter++;
          }
        }
      }
      assert.equal(iter, 250);
    })
  });
});
