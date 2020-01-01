const EventEmitter = require('events');

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
            this.session_start(event);
        });

        this.simpleXmpp.on('close', () => {
            envLog('[EcovacsXMPP] I\'m disconnected :(');
            this.emit("closed");
        });

        this.simpleXmpp.on('chat', (from, message) => {
            envLog('[EcovacsXMPP] Chat from %s: %s', from, message);
        });

        this.simpleXmpp.on('stanza', (stanza) => {
            let firstChild = stanza.children[0];
            if (firstChild) {
                let secondChild = firstChild.children[0];
                if (secondChild) {
                    if (stanza.name === "iq" && stanza.attrs.type === "set" && firstChild.name === "query") {
                        let command = secondChild.attrs.td;
                        envLog('[EcovacsXMPP] Response for %s:, %s', command, JSON.stringify(secondChild));
                        switch (command) {
                            case "PushRobotNotify":
                                let type = secondChild.attrs['type'];
                                let act = secondChild.attrs['act'];
                                this.emit(command, {
                                    type: type,
                                    act: act
                                });
                                this.emit("stanza", {
                                    type: command,
                                    value: {
                                        type: type,
                                        act: act
                                    }
                                });
                                break;
                            case "DeviceInfo":
                                envLog("[EcovacsXMPP] Received an DeviceInfo Stanza");
                                break;
                            case "ChargeState":
                                this.bot._handle_charge_state(secondChild.children[0]);
                                this.emit(command, this.bot.charge_status);
                                this.emit("stanza", {
                                    type: command,
                                    value: this.bot.charge_status
                                });
                                break;
                            case "BatteryInfo":
                                this.bot._handle_battery_info(secondChild.children[0]);
                                this.emit(command, this.bot.battery_status);
                                this.emit("stanza", {
                                    type: command,
                                    value: this.bot.battery_status
                                });
                                break;
                            case "CleanReport":
                                this.bot._handle_clean_report(secondChild.children[0]);
                                this.emit(command, this.bot.clean_status);
                                this.emit("stanza", {
                                    type: command,
                                    value: this.bot.clean_status
                                });
                                break;
                            case "WKVer":
                                envLog("[EcovacsXMPP] Received an WKVer Stanza");
                                break;
                            case "Error":
                            case "error":
                                envLog("[EcovacsXMPP] Received an error for action '%s': %s", secondChild.attrs.action, secondChild.attrs.error);
                                break;
                            case "OnOff":
                                envLog("[EcovacsXMPP] Received an OnOff Stanza");
                                break;
                            case "Sched":
                                envLog("[EcovacsXMPP] Received an Sched Stanza");
                                break;
                            case "LifeSpan":
                                envLog("[EcovacsXMPP] Received an LifeSpan Stanza");
                                break;
                            default:
                                envLog("[EcovacsXMPP] Unknown response type received");
                                break;
                        }
                    } else if (stanza.name === "iq" && stanza.attrs.type === "error" && firstChild.name === "error") {
                        envLog('[EcovacsXMPP] Response Error for request %s', stanza.attrs.id);
                        switch (firstChild.attrs.code) {
                            case "404":
                                console.error("[EcovacsXMPP] Couldn't reach the vac :[%s] %s", firstChild.attrs.code, secondChild.name);
                                break;
                            default:
                                console.error("[EcovacsXMPP] Unknown error received: %s", JSON.stringify(firstChild));
                                break;
                        }
                    }
                }
            }
        });

        this.simpleXmpp.on('error', (e) => {
            envLog('[EcovacsXMPP] Error:', e);
        });
    }

    session_start(event) {
        envLog("[EcovacsXMPP] ----------------- starting session ----------------");
        envLog("[EcovacsXMPP] event = {event}".format({
            event: JSON.stringify(event)
        }));
        this.emit("ready", event);
    }

    subscribe_to_ctls(func) {
        envLog("[EcovacsXMPP] Adding listener to ready event");
        this.on("ready", func);
    }

    send_command(xml, recipient) {
        let c = this._wrap_command(xml, recipient);
        envLog('[EcovacsXMPP] Sending xml:', c.toString());
        this.simpleXmpp.conn.send(c);
    }

    _wrap_command(ctl, recipient) {
        let id = this.iter++;
        let q = new Element('iq', {
            id: id,
            to: recipient,
            from: this._my_address(),
            type: 'set'
        });
        q.c('query', {
            xmlns: 'com:ctl'
        }).cnode(ctl.to_xml());
        return q;
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {
        let id = this.iter++;
        envLog("[EcovacsXMPP] *** sending ping ***");
        var e = new Element('iq', {
            id: id,
            to: to,
            from: this._my_address(),
            type: 'get'
        });
        e.c('query', {
            xmlns: 'urn:xmpp:ping'
        });
        envLog("[EcovacsXMPP] Sending ping XML:", e.toString());
        this.simpleXmpp.conn.send(e);
    }

    connect_and_wait_until_ready() {
        envLog("[EcovacsXMPP] Connecting as %s to %s", this.user + '@' + this.hostname, this.server_address + ":" + this.server_port);
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
}

module.exports = EcovacsXMPP;