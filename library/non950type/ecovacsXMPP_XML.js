'use strict';

const Ecovacs = require('../ecovacs');
const tools = require('../tools');
const Element = require('ltx').Element;

class EcovacsXMPP_XML extends Ecovacs {
    /**
     * @param {VacBot_non950type} bot - the VacBot object
     * @param {string} user - the userId retrieved by the Ecovacs API
     * @param {string} hostname - the hostname of the API endpoint
     * @param {string} resource - the resource of the vacuum
     * @param {string} secret - the user access token
     * @param {string} continent - the continent where the Ecovacs account is registered
     * @param {string} country - the country where the Ecovacs account is registered
     * @param {Object} vacuum - the device object for the vacuum
     * @param {string} serverAddress - the address of the MQTT server
     * @param {number} [serverPort=8883] - the port that the MQTT server is listening on
     */
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort = 5223) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort);
        this.bot = bot;

        this.iqElementId = 1;
        this.pingInterval = null;

        this.simpleXmpp = require('simple-xmpp');

        this.simpleXmpp.on('online', (event) => {
            tools.envLog('[EcovacsXMPP_XML] Session start');
            this.emit("ready", event);
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
                    this.bot.handle_ResponseError(stanza.children[0].attrs);
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

    /**
     * Connect to the Ecovacs server
     */
    connect() {
        tools.envLog('[EcovacsXMPP_XML] Connecting as %s to %s', this.user + '@' + this.hostname, this.serverAddress + ':' + this.serverPort);
        this.simpleXmpp.connect({
            jid: this.user + '@' + this.hostname,
            password: '0/' + this.resource + '/' + this.secret,
            host: this.serverAddress,
            port: this.serverPort
        });

        if (!this.pingInterval) {
            this.pingInterval = setInterval(() => {
                this.sendPing();
            }, 30000);
        }

        this.on('ready', () => {
            tools.envLog('[EcovacsMQTT] received ready event');
            this.sendPing();
        });
    }

    /**
     * Sends a command to the device
     * @param {Object} command - the command object used to send
     */
    async sendCommand(command) {
        let commandXml = this.getCommandXml(command);
        this.simpleXmpp.conn.send(commandXml);
    }

    /**
     * Create a specific XML element with the given command and return it
     * @param {Object} command - the command as XML to send to the device
     * @returns The specific XML for the command
     */
    getCommandXml(command) {
        let id = this.iqElementId++;
        let iqElement = new Element('iq', {
            id: id,
            from: this.getServerJID(),
            to: this.getDeviceJID(),
            type: 'set'
        });
        iqElement.c('query', {
            xmlns: 'com:ctl'
        }).cnode(command);
        return iqElement;
    }

    /**
     * @returns {string} the Jabber Identifier of the device
     */
    getDeviceJID() {
        return this.bot.vacuum['did'] + '@' + this.bot.vacuum['class'] + '.ecorobot.net/atom';
    }

    /**
     * @returns {string} the Jabber Identifier of the server side
     */
    getServerJID() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    /**
     * Sends a ping to the device
     */
    sendPing() {
        let id = this.iqElementId++;
        let e = new Element('iq', {
            id: id,
            from: this.getServerJID(),
            to: this.getDeviceJID(),
            type: 'get'
        });
        e.c('query', {
            xmlns: 'urn:xmpp:ping'
        });
        this.simpleXmpp.conn.send(e);
    }

    /**
     * Disconnects from the XMPP server
     */
    disconnect() {
        tools.envLog("[EcovacsXMPP_XML] Disconnect from the XMPP server");
        this.simpleXmpp.disconnect();
        clearInterval(this.pingInterval);
        this.pingInterval = null;
    }
}

module.exports = EcovacsXMPP_XML;
