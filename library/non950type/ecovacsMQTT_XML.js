'use strict';

const EcovacsMQTT = require('../ecovacsMQTT');
const tools = require('../tools');
const { DOMParser } = require('@xmldom/xmldom');

class EcovacsMQTT_XML extends EcovacsMQTT {
    /**
     * @param {VacBot} bot - the name of the vacuum
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
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort = 8883) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, serverAddress, serverPort);

        this.payloadType = 'x'; // XML
    }

    /**
     * The function returns the request object
     * @param {Object} command - the action to be performed
     * @returns {Object} the command object used to be sent
     */
    getCommandRequestObject(command) {
        if (command.name === 'GetLogApiCleanLogs') {
            return this.getCommandCleanLogsObject('GetCleanLogs');
        } else {
            const payload = this.getCommandPayload(command);
            return this.getCommandStandardRequestObject(command, payload);
        }
    }

    /**
     * It creates a string with the payload in xml format
     * and also removes the td element
     * @param {Object} command - the command object
     * @returns {string}
     */
    getCommandPayload(command) {
        let xml = command.to_xml();
        // Remove the td from ctl xml for RestAPI
        let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
        payloadXml.documentElement.removeAttribute('td');
        return payloadXml.toString();
    }

    /**
     * It handles the response from the Ecovacs API
     * @todo Refactor this method
     * @param {Object} command - the command that was sent to the Ecovacs API
     * @param {Object} messagePayload - The message payload that was received
     */
    handleCommandResponse(command, messagePayload) {
        let result = {};
        if (messagePayload.hasOwnProperty('resp')) {
            result = this.command_xml2json(messagePayload['resp'], command);
            (async () => {
                try {
                    await this.handleMessagePayload(command.name, result);
                } catch (e) {
                    this.emitError('-2', e.message);
                }
                delete this.bot.commandsSent[command.args.id];
            })();
        } else if (messagePayload.hasOwnProperty('logs')) {
            const children = [];
            for (let i = 0; i < 20; i++) {
                children.push(messagePayload.logs[i]);
            }
            result = {
                'event': 'CleanLogs',
                'attrs': {
                    'count': 20
                },
                'children': children
            };
            (async () => {
                try {
                    await this.handleMessagePayload(command.name, result);
                } catch (e) {
                    this.emitError('-2', e.message);
                }
                delete this.bot.commandsSent[command.args.id];
            })();
        } else {
            tools.envLog('[EcovacsMQTT] Unknown response type received: %s', JSON.stringify(messagePayload));
        }
    }

    /**
     * It handles the messages from the API (incoming MQTT message or request response)
     * @param {string} topic - the topic of the message
     * @param {Object|string} payload - the payload
     * @param {string} [type=incoming] the type of message. Can be "incoming" (MQTT message) or "response"
     */
    handleMessage(topic, payload, type = "incoming") {
        let result = this.command_xml2json(payload);
        (async () => {
            try {
                await this.handleMessagePayload(result['event'], result);
            } catch (e) {
                this.emitError('-2', e.message);
            }
        })();
    }

    /**
     * It takes an XML string and converts it into JSON object
     * @param {string} xmlString - the XML string
     * @returns {Object} a JSON object
     */
    command_xml2json(xmlString) {
        const domParser = new DOMParser();
        const xml = domParser.parseFromString(xmlString, "text/xml");
        const firstChild = xml.childNodes[0];
        let attrs = {};
        let event = null;
        tools.envLog('[EcovacsMQTT] xml received: %s', xml);
        if (arguments.length > 1) {
            event = firstChild.tagName;
            const action = arguments[1];
            attrs = action.args
        } else {
            if (!firstChild || !firstChild.attributes) {
                return {
                    'event': 'unknown',
                    'attrs': '',
                    'children': []
                };
            } else {
                event = firstChild.attributes.getNamedItem('td').value;
            }
        }
        let result = {
            'event': event,
            'attrs': attrs,
            'children': []
        };

        for (let i = 0; i < firstChild.attributes.length; i++) {
            result.attrs[firstChild.attributes[i].name] = firstChild.attributes[i].value;
            if (firstChild.childNodes) {
                for (let c = 0; c < firstChild.childNodes.length; c++) {
                    const secondChild = firstChild.childNodes[c];
                    let childObject = {
                        'event': secondChild.tagName,
                        'attrs': {}
                    };
                    for (let ca = 0; ca < secondChild.attributes.length; ca++) {
                        const thirdChild = secondChild.attributes[ca];
                        childObject['attrs'][thirdChild.name] = thirdChild.value;
                    }
                    result.children.push(childObject);
                }
            }
        }
        return result;
    }
}

module.exports = EcovacsMQTT_XML;
