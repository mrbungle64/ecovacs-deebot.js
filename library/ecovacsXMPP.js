const Ecovacs = require('./ecovacs');
const tools = require('./tools');
const Element = require('ltx').Element;
const errorCodes = require('./errorCodes');

class EcovacsXMPP extends Ecovacs {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port = 5223) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port);

        this.iqElementId = 1;
        this.pingInterval = null;

        this.simpleXmpp = require('simple-xmpp');

        this.simpleXmpp.on('online', (event) => {
            tools.envLog('[EcovacsXMPP] Session start');
            this.session_start(event);
        });

        this.simpleXmpp.on('close', () => {
            tools.envLog('[EcovacsXMPP] Session disconnected');
            this.emit('closed');
        });

        this.simpleXmpp.on('stanza', (stanza) => {
            tools.envLog('[EcovacsXMPP] stanza: %s', stanza.toString());
            if (stanza.name === 'iq' && (stanza.attrs.type === 'set' || stanza.attrs.type === 'result') && !!stanza.children[0] && stanza.children[0].name === 'query' && !!stanza.children[0].children[0]) {
                let firstChild = stanza.children[0];
                tools.envLog('[EcovacsXMPP] firstChild: %s', firstChild.toString());
                let secondChild = firstChild.children[0];
                tools.envLog('[EcovacsXMPP] secondChild: %s', secondChild.toString());
                let command = '';
                if (secondChild.attrs) {
                    if (secondChild.attrs.id && (this.bot.commandsSent[secondChild.attrs.id])) {
                        const action = this.bot.commandsSent[secondChild.attrs.id];
                        command = action.name;
                    } else {
                        command = secondChild.attrs.td;
                    }
                    tools.envLog('[EcovacsXMPP] command: %s', command);
                    this.handleCommand(command, secondChild);
                    delete this.bot.commandsSent[secondChild.attrs.id];
                    if (this.bot.errorCode === '-1') {
                        this.bot.errorCode = '0';
                        this.bot.errorDescription = errorCodes[this.bot.errorCode];
                        this.emitLastError();
                    }
                }
                else {
                    tools.envLog('[EcovacsXMPP] Unknown response type received: %s', JSON.stringify(stanza));
                }
            } else if (stanza.name === 'iq' && stanza.attrs.type === 'error' && !!stanza.children[0] && stanza.children[0].name === 'error' && !!stanza.children[0].children[0]) {
                tools.envLog('[EcovacsXMPP] Response Error for request %s: %S', stanza.attrs.id, JSON.stringify(stanza.children[0]));
                this.bot.handle_error(stanza.children[0].attrs);
                this.emitLastError();
            }
        });

        this.simpleXmpp.on('error', (error) => {
            tools.envLog(`[EcovacsXMPP] Received error event: ${error}`);
            this.bot.errorDescription = `Received error event: ${error}`;
            this.bot.errorCode = '-1';
            this.emitLastError();
        });
    }

    connect() {
        tools.envLog('[EcovacsXMPP] Connecting as %s to %s', this.user + '@' + this.hostname, this.server_address + ':' + this.server_port);
        this.simpleXmpp.connect({
            jid: this.user + '@' + this.hostname,
            password: '0/' + this.resource + '/' + this.secret,
            host: this.server_address,
            port: this.server_port
        });

        if (!this.pingInterval) {
            this.pingInterval = setInterval(() => {
                this.sendPing(this.bot.getVacBotDeviceId());
            }, 30000);
        }

        this.on('ready', (event) => {
            tools.envLog('[EcovacsMQTT] received ready event');
            this.sendPing(this.bot.getVacBotDeviceId());
        });
    }

    sendCommand(xml, recipient) {
        let result = this.wrap_command(xml, recipient);
        tools.envLog('[EcovacsXMPP] Sending xml:', result.toString());
        this.simpleXmpp.conn.send(result);
    }

    wrap_command(xml, recipient) {
        let id = this.iqElementId++;
        let iqElement = new Element('iq', {
            id: id,
            to: recipient,
            from: this.getMyAddress(),
            type: 'set'
        });
        iqElement.c('query', {
            xmlns: 'com:ctl'
        }).cnode(xml);
        return iqElement;
    }

    getMyAddress() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    sendPing(to) {
        let id = this.iqElementId++;
        let e = new Element('iq', {
            id: id,
            to: to,
            from: this.getMyAddress(),
            type: 'get'
        });
        e.c('query', {
            xmlns: 'urn:xmpp:ping'
        });
        this.simpleXmpp.conn.send(e);
    }

    disconnect() {
        this.simpleXmpp.disconnect();
        clearInterval(this.pingInterval);
        this.pingInterval = null;
        tools.envLog("[EcovacsXMPP] Closed XMPP Client");
    }
}

module.exports = EcovacsXMPP;
