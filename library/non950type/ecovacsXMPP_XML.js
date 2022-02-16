'use strict';

const Ecovacs = require('../ecovacs');
const tools = require('../tools');
const Element = require('ltx').Element;

class EcovacsXMPP_XML extends Ecovacs {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port = 5223) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port);

        this.iqElementId = 1;
        this.pingInterval = null;

        this.simpleXmpp = require('simple-xmpp');

        this.simpleXmpp.on('online', (event) => {
            tools.envLog('[EcovacsXMPP_XML] Session start');
            this.session_start(event);
        });

        this.simpleXmpp.on('close', () => {
            tools.envLog('[EcovacsXMPP_XML] Session disconnected');
            this.emit('closed');
        });

        this.simpleXmpp.on('stanza', (stanza) => {
            if ((stanza.name === 'iq') && !!stanza.children[0] && !!stanza.children[0].children[0]) {
                if (((stanza.attrs.type === 'set') || (stanza.attrs.type === 'result')) && (stanza.children[0].name === 'query')) {
                    let payload = stanza.children[0].children[0];
                    tools.envLog('[EcovacsXMPP_XML] payload: %s', payload.toString());
                    let command = '';
                    if (payload.attrs) {
                        if (payload.attrs.id && this.bot.commandsSent[payload.attrs.id]) {
                            const action = this.bot.commandsSent[payload.attrs.id];
                            command = action.name;
                        } else {
                            command = payload.attrs.td;
                        }
                        if ((command !== undefined) && (command !== '')) {
                            tools.envLog('[EcovacsXMPP_XML] command: %s', command);
                            (async () => {
                                await this.handleMessagePayload(command, payload).catch(error => {
                                    this.emitError('-2', error.message);
                                });
                                delete this.bot.commandsSent[payload.attrs.id];
                                if (this.bot.errorCode === '-1') {
                                    this.emitLastErrorByErrorCode('0');
                                }
                            })();
                        }
                    } else {
                        tools.envLog('[EcovacsXMPP_XML] Unknown response type received: %s', JSON.stringify(stanza));
                    }
                } else if ((stanza.attrs.type === 'error') && (stanza.children[0].name === 'error')) {
                    tools.envLog('[EcovacsXMPP_XML] Response Error for request %s: %S', stanza.attrs.id, JSON.stringify(stanza.children[0]));
                    this.bot.handleResponseError(stanza.children[0].attrs);
                    this.emitLastError();
                }
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
        tools.envLog('[EcovacsXMPP_XML] Connecting as %s to %s', this.user + '@' + this.hostname, this.server_address + ':' + this.server_port);
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

    async sendCommand(action, recipient) {
        let wrappedCommand = this.wrap_command(action, recipient);
        this.simpleXmpp.conn.send(wrappedCommand);
    }

    wrap_command(action, recipient) {
        let id = this.iqElementId++;
        let iqElement = new Element('iq', {
            id: id,
            to: recipient,
            from: this.getMyAddress(),
            type: 'set'
        });
        iqElement.c('query', {
            xmlns: 'com:ctl'
        }).cnode(action);
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
        tools.envLog("[EcovacsXMPP_XML] Closed XMPP Client");
    }
}

module.exports = EcovacsXMPP_XML;
