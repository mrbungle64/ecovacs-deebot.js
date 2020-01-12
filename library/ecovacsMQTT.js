const EventEmitter = require('events');
const tools = require('./tools');
const URL = require('url').URL;

String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    var args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class EcovacsMQTT extends EventEmitter {
    constructor(bot, user, hostname, resource, secret, continent, vacuum, server_address, server_port) {
        super();
        this.mqtt = require('mqtt');
        this.client = null;

        this.bot = bot;
        this.user = user;
        this.username = this.user + '@' + this.domain;
        this.clientId = this.username + '/' + this.resource;
        this.hostname = hostname;
        this.domain = this.hostname.split(".")[0]; // MQTT is using domain without tld extension
        this.resource = resource;
        this.secret = secret;
        this.continent = continent;
        this.vacuum = vacuum;

        if (!server_address) {
            this.server_address = 'mq-{continent}.ecouser.net'.format({
                continent: continent
            });
        } else {
            this.server_address = server_address;
        }

        if (!server_port) {
            this.server_port = 8883
        } else {
            this.server_port = server_port;
        }
    }

    connect_and_wait_until_ready() {
        let options = {
            clientId: this.clientId,
            username: this.username,
            password: this.secret,
            rejectUnauthorized: false
        };
        let url = 'mqtts://' + this.server_address + ':' + this.server_port;
        this.client = this.mqtt.connect(url, options);
        tools.envLog("[EcovacsMQTT] Connecting as %s to %s", this.username, url);

        let vacuum_did = this.vacuum['did'];
        let vacuum_class = this.vacuum['class'];
        let vacuum_resource = this.vacuum['resource'];
        let client = this.client;

        this.client.on('connect', function () {
            tools.envLog('[EcovacsMQTT] connected');
            client.subscribe('iot/atr/+/' + vacuum_did + '/' + vacuum_class + '/' + vacuum_resource + '/+', {
                qos: 0
            }, (err, granted) => {
                if (!err) {
                    tools.envLog('[EcovacsMQTT] subscribe successful');
                } else {
                    tools.envLog('[EcovacsMQTT] subscribe err: %s', err.toString());
                }
            });
            client.handleMessage = (packet, done) => {
                tools.envLog('[EcovacsMQTT] packet.payload: %s', packet.payload.toString());
                done();
            }
        });
        this.client.on('message', (topic, message) => {
            // message is Buffer
            tools.envLog('[EcovacsMQTT] message: %s', message.toString());
            client.end();
        });
    }

    subscribe_to_ctls(self, func) {}

    _disconnect() {
        //disconnect mqtt connection
        this.client.disconnect();
    }

    _run_scheduled_func(self, timer_seconds, timer_func) {}

    schedule(self, timer_seconds, timer_func) {}

    send_ping(to) {}

    send_command(action, recipient) {}

    _wrap_command(self, cmd, recipient) {
        // Remove the td from ctl xml for RestAPI
        let payloadXml = cmd.to_xml();
        payloadXml.attrib.pop("td");

        return {
            'auth': {
                'realm': EcoVacsAPI.REALM,
                'resource': this.resource,
                'token': this.secret,
                'userid': this.user,
                'with': 'users',
            },
            "cmdName": cmd.name,
            "payload": ET.tostring(payloadXml).decode(),

            "payloadType": "x",
            "td": "q",
            "toId": recipient,
            "toRes": this.vacuum['resource'],
            "toType": this.vacuum['class']
        }
    }

    _wrap_td_command(self, cmd, recipient) {
        return {
            'auth': {
                'realm': EcoVacsAPI.REALM,
                'resource': this.resource,
                'token': this.secret,
                'userid': this.user,
                'with': 'users',
            },
            "td": cmd.name,
            "did": recipient,
            "resource": this.vacuum['resource']
        }
    }

    __call_ecovacs_device_api(self, args, base_url = EcoVacsAPI.IOTDEVMANAGERAPI) {
        let params = {};
        params.update(args);

        let url = (EcoVacsAPI.PORTAL_URL_FORMAT + "/" + base_url).format(this.continent);
        //The RestAPI sometimes doesnt provide a response depending on command, reduce timeout to 3 to accomodate and make requests faster
        try {
            //May think about having timeout as an arg that could be provided in the future
            let response = requests.post(url, params, 3);
        } catch (e) {

        }

        let json = response.json();
        if (json['ret'] === 'ok') {
            return json;
        } else if (json['ret'] === 'fail') {
            if ('debug' in json) {
                if (json['debug'] === 'wait for response timed out') {
                    // TODO - Maybe handle timeout for IOT better in the future
                    return {};
                }
            }
        } else
            //TODO - Not sure if we want to raise an error yet, just return empty for now
            return {};
    }

    _handle_ctl_api(self, action, message) {}

    _ctl_to_dict_api(self, action, xmlstring) {
        let xml = ET.fromstring(xmlstring);
        let xmlChild = xml.getchildren();
        if (len(xmlChild) > 0) {
            let result = xmlChild[0].attrib.copy();
            //Fix for difference in XMPP vs API response
            //Depending on the report will use the tag and add "report" to fit the mold of ozmo library
            if (xmlChild[0].tag === "clean") {
                result['event'] = "CleanReport";
            } else if (xmlChild[0].tag === "charge") {
                result['event'] = "ChargeState";
            } else if (xmlChild[0].tag === "battery") {
                result['event'] = "BatteryInfo";
            } else { //Default back to replacing Get from the api cmdName
                result['event'] = action.name.replace("Get", "", 1);
            }
        } else {
            let result = xml.attrib.copy();
            result['event'] = action.name.replace("Get", "", 1);
            if ('ret' in result) { //Handle errors as needed
                if (result['ret'] === 'fail') {
                    if (action.name === "Charge") { //So far only seen this with Charge, when already docked
                        result['event'] = "ChargeState";
                    }
                }
            }
            for (let key in result) {
                if (result.hasOwnProperty(key)) {
                    if (!parseInt(result[key])) { //Fix to handle negative int values
                        result[key] = stringcase.snakecase(result[key]);
                    }
                }
            }
            return result;
        }
    }

    _handle_ctl_mqtt(self, client, userdata, message) {}

    _ctl_to_dict_mqtt(self, topic, xmlstring) {
        //I haven't seen the need to fall back to data within the topic (like we do with IOT rest call actions), but it is here in case of future need
        let xml = ET.fromstring(xmlstring); //Convert from string to xml (like IOT rest calls), other than this it is similar to XMPP

        //Including changes from jasonarends @ 28da7c2 below
        let result = xml.attrib.copy();

        if (!'td' in result) {
            // This happens for commands with no response data, such as PlaySound
            // Handle response data with no 'td'

            // single element with type and val
            if ('type' in result) {
                // seems to always be LifeSpan type
                result['event'] = "LifeSpan";
            } else {
                // case where there is child element
                if (len(xml) > 0) {
                    if ('clean' in xml[0].tag) {
                        result['event'] = "CleanReport";
                    } else if ('charge' in xml[0].tag) {
                        result['event'] = "ChargeState";
                    } else if ('battery' in xml[0].tag) {
                        result['event'] = "BatteryInfo";
                    } else {
                        return;
                    }
                    result.update(xml[0].attrib);
                } else {
                    // for non-'type' result with no child element, e.g., result of PlaySound
                    return;
                }
            }
        } else {
            // response includes 'td'
            result['event'] = result.pop('td');
            if (xml) {
                result.update(xml[0].attrib);
            }
        }

        for (let key in result) {
            if (result.hasOwnProperty(key)) {
                //Check for RepresentInt to handle negative int values, and ',' for ignoring position updates
                if (!parseInt(result[key]) && !',' in result[key]) {
                    result[key] = stringcase.snakecase(result[key]);
                }
            }
        }
        return result
    }
}

module.exports = EcovacsMQTT;