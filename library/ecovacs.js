const EventEmitter = require('events');

exports = String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    let args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class Ecovacs extends EventEmitter {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port) {
        super();

        this.bot = bot;
        this.user = user;
        this.hostname = hostname;
        this.resource = resource;
        this.secret = secret;
        this.continent = continent;
        this.country = country;
        this.vacuum = vacuum;

        this.iter = 1;
    }

    session_start(event) {
        this.emit("ready", event);
    }
}

module.exports = Ecovacs;
