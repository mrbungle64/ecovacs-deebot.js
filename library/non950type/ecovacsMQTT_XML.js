'use strict';

const EcovacsMQTT = require('../ecovacsMQTT');
const tools = require('../tools');
const constants = require('../ecovacsConstants');
const { DOMParser } = require('@xmldom/xmldom');

class EcovacsMQTT_XML extends EcovacsMQTT {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port = 8883) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port);

        this.datatype = 'x';
    }

    wrapCommand(action, recipient) {
        const auth = {
            'realm': constants.REALM,
            'resource': this.resource,
            'token': this.secret,
            'userid': this.user,
            'with': 'users',
        };
        if (action.name === 'GetLogApiCleanLogs') {
            return {
                'auth': auth,
                "did": recipient,
                "country": this.country,
                "td": "GetCleanLogs",
                "resource": this.vacuum['resource']
            }
        } else {
            return {
                'auth': auth,
                "cmdName": action.name,
                "payload": this.wrapCommand_getPayload(action),
                "payloadType": "x",
                "td": "q",
                "toId": recipient,
                "toRes": this.vacuum['resource'],
                "toType": this.vacuum['class']
            }
        }
    }

    wrapCommand_getPayload(action) {
        let xml = action.to_xml();
        // Remove the td from ctl xml for RestAPI
        let payloadXml = new DOMParser().parseFromString(xml.toString(), 'text/xml');
        payloadXml.documentElement.removeAttribute('td');
        return payloadXml.toString();
    }

    handleCommandResponse(action, json) {
        let result = {};
        if (json.hasOwnProperty('resp')) {
            result = this.command_xml2json(json['resp'], action);
            (async () => {
                try {
                    await this.handleMessagePayload(action.name, result);
                } catch (e) {
                    this.emitError('-2', e.message);
                }
                delete this.bot.commandsSent[action.args.id];
            })();
        } else if (json.hasOwnProperty('logs')) {
            const children = [];
            for (let i = 0; i < 20; i++) {
                children.push(json.logs[i]);
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
                    await this.handleMessagePayload(action.name, result);
                } catch (e) {
                    this.emitError('-2', e.message);
                }
                delete this.bot.commandsSent[action.args.id];
            })();
        } else {
            tools.envLog('[EcovacsMQTT] Unknown response type received: %s', JSON.stringify(json));
        }
    }

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
