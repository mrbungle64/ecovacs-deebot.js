const EventEmitter = require('events');
const tools = require('./tools.js');
const Element = require('ltx').Element;
const constants = require('./ecovacsConstants.js');

String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    var args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class EcovacsXMPP extends EventEmitter {
    constructor(bot, user, hostname, resource, secret, continent, vacuum, server_address, server_port) {
        super();
        this.simpleXmpp = require('simple-xmpp');

        this.bot = bot;
        this.user = user;
        this.hostname = hostname;
        this.resource = resource;
        this.secret = secret;
        this.continent = continent;
        this.vacuum = vacuum;

        this.iter = 1;

        if (!server_address) {
            this.server_address = 'msg-{continent}.ecouser.net'.format({
                continent: continent
            });
        } else {
            this.server_address = server_address;
        }

        if (!server_port) {
            this.server_port = 5223
        } else {
            this.server_port = server_port;
        }

        this.simpleXmpp.on('online', (event) => {
            tools.envLog('[EcovacsXMPP] Session start');
            this.session_start(event);
        });

        this.simpleXmpp.on('close', () => {
            tools.envLog('[EcovacsXMPP] I\'m disconnected :(');
            this.emit("closed");
        });

        this.simpleXmpp.on('stanza', (stanza) => {
            tools.envLog('stanza: %s',stanza.toString());
            if (stanza.name === "iq" && (stanza.attrs.type === "set" || stanza.attrs.type === "result") && !!stanza.children[0] && stanza.children[0].name === "query" && !!stanza.children[0].children[0]) {
                let firstChild = stanza.children[0];
                tools.envLog('firstChild: %s',firstChild.toString());
                let secondChild = firstChild.children[0];
                tools.envLog('secondChild: %s',secondChild.toString());
                let type = null;
                let level = null;
                let component = null;
                let command = secondChild.attrs.td;
                if (!command) {
                    if (secondChild.children[0]) {
                        let name = secondChild.children[0].name;
                        if (name) {
                            command = tools.getEventNameForCommandString(name);
                        }
                    }
                    if (secondChild.attrs.hasOwnProperty('type')) {
                        component = constants.COMPONENT_FROM_ECOVACS[secondChild.attrs.type];
                        tools.envLog("[EcovacsXMPP] LifeSpan component %s", component);
                        if (component) {
                            command = 'LifeSpan';
                        }
                    }
                    if (secondChild.attrs.hasOwnProperty('v')) {
                        level = constants.WATER_LEVEL_FROM_ECOVACS[secondChild.attrs.v];
                        if (level) {
                            command = 'WaterLevel';
                        }
                    }
                }
                switch (command) {
                    case "WaterBoxInfo":
                        this.bot._handle_waterbox_info(secondChild.attrs.on);
                        this.emit("WaterBoxInfo", this.bot.waterbox_info);
                        break;
                    case "ChargeState":
                        this.bot._handle_charge_state(secondChild.children[0]);
                        this.emit(command, this.bot.charge_status);
                        break;
                    case "BatteryInfo":
                        this.bot._handle_battery_info(secondChild.children[0]);
                        this.emit(command, this.bot.battery_status);
                        break;
                    case "CleanReport":
                        this.bot._handle_clean_report(secondChild.children[0]);
                        this.emit(command, this.bot.clean_status);
                        this.emit('FanSpeed', this.bot.fan_speed);
                        break;
                    case "Error":
                    case "error":
                        tools.envLog("[EcovacsXMPP] Received an error for action '%s': %s", secondChild.attrs.action, secondChild.attrs.error);
                        this.bot._handle_error(secondChild.attrs.error);
                        this.emit(command, this.bot.error_event);
                        break;
                    case "LifeSpan":
                        tools.envLog("[EcovacsXMPP] Received an LifeSpan Stanza %s", JSON.stringify(secondChild.attrs));
                        this.bot._handle_life_span(secondChild.attrs);
                        if (component) {
                            if (this.bot.components[component]) {
                                this.emit('LifeSpan_' + component, this.bot.components[component]);
                            }
                        }
                        break;
                    case "WaterLevel":
                        tools.envLog("[EcovacsXMPP] Received an WaterLevel Stanza %s", secondChild.attrs);
                        this.bot._handle_water_level(secondChild);
                        if (this.bot.water_level) {
                            this.emit('WaterLevel', this.bot.water_level);
                        }
                        break;
                    default:
                        tools.envLog("[EcovacsXMPP] Unknown response type received: %s", JSON.stringify(stanza));
                        break;
                }
            } else if (stanza.name === "iq" && stanza.attrs.type === "error" && !!stanza.children[0] && stanza.children[0].name === "error" && !!stanza.children[0].children[0]) {
                tools.envLog('[EcovacsXMPP] Response Error for request %s', stanza.attrs.id);
                switch (stanza.children[0].attrs.code) {
                    case "404":
                        console.error("[EcovacsXMPP] Couldn't reach the vac: [%s] %s", stanza.children[0].attrs.code, stanza.children[0].children[0].name);
                        break;
                    default:
                        console.error("[EcovacsXMPP] Unknown error received: %s", JSON.stringify(stanza.children[0]));
                        break;
                }
            }
        });

        this.simpleXmpp.on('error', (e) => {
            tools.envLog('[EcovacsXMPP] Error:', e);
        });
    }

    session_start(event) {
        tools.envLog("[EcovacsXMPP] ----------------- starting session ----------------");
        tools.envLog("[EcovacsXMPP] event = {event}".format({
            event: JSON.stringify(event)
        }));
        this.emit("ready", event);
    }

    connect_and_wait_until_ready() {
        tools.envLog("[EcovacsXMPP] Connecting as %s to %s", this.user + '@' + this.hostname, this.server_address + ":" + this.server_port);
        this.simpleXmpp.connect({
            jid: this.user + '@' + this.hostname,
            password: '0/' + this.resource + '/' + this.secret,
            host: this.server_address,
            port: this.server_port
        });

        this.on("ready", (event) => {
            this.send_ping(this.bot._vacuum_address());
        });
    }

    send_command(xml, recipient) {
        let result = this._wrap_command(xml, recipient);
        tools.envLog('[EcovacsXMPP] Sending xml:', result.toString());
        this.simpleXmpp.conn.send(result);
    }

    _wrap_command(xml, recipient) {
        let id = this.iter++;
        let iqElement = new Element('iq', {
            id: id,
            to: recipient,
            from: this._my_address(),
            type: 'set'
        });
        iqElement.c('query', {
            xmlns: 'com:ctl'
        }).cnode(xml);
        return iqElement;
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {
        let id = this.iter++;
        var e = new Element('iq', {
            id: id,
            to: to,
            from: this._my_address(),
            type: 'get'
        });
        e.c('query', {
            xmlns: 'urn:xmpp:ping'
        });
        this.simpleXmpp.conn.send(e);
    }

    disconnect() {
    }
}

module.exports = EcovacsXMPP;