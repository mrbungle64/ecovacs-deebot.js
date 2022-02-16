'use strict';

const Ecovacs = require('./ecovacs');
const tools = require('./tools');
const constants = require('./ecovacsConstants');
const axios = require("axios").default;

class EcovacsMQTT extends Ecovacs {
    constructor(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port = 8883) {
        super(bot, user, hostname, resource, secret, continent, country, vacuum, server_address, server_port);

        this.mqtt = require('mqtt');

        this.customdomain = hostname.split(".")[0]; // MQTT is using domain without tld extension
        this.username = user + '@' + this.customdomain;
        this.datatype = '';

        let options = {
            clientId: this.username + '/' + resource,
            username: this.username,
            password: this.secret,
            protocolVersion: 4,
            keepalive: 120,
            rejectUnauthorized: false
        };

        let url = `mqtts://${this.server_address}:${this.server_port}`;
        this.client = this.mqtt.connect(url, options);
        tools.envLog("[EcovacsMQTT] Connecting as %s to %s", this.username, url);

        let ecovacsMQTT = this;

        this.client.on('connect', function () {
            tools.envLog('[EcovacsMQTT] client connected');
            ecovacsMQTT.subscribe();
        });

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message.toString(), "incoming");
        });

        this.client.on('offline', function () {
            try {
                ecovacsMQTT.emitNetworkError('MQTT server is offline or not reachable');
            } catch (e) {
                tools.envLog('[EcovacsMQTT] MQTT server is offline or not reachable');
            }
        });

        this.client.on('disconnect', function (packet) {
            try {
                ecovacsMQTT.emitNetworkError('MQTT client received disconnect event');
            } catch (e) {
                tools.envLog('[EcovacsMQTT] MQTT client received disconnect event');
            }
        });

        this.client.on('error', (error) => {
            try {
                ecovacsMQTT.emitNetworkError(`MQTT client error: ${error.message}`);
            } catch (e) {
                tools.envLog(`MQTT client error: ${error.message}`);
            }
        });
    }

    subscribe() {
        const channel = `iot/atr/+/${this.vacuum['did']}/${this.vacuum['class']}/${this.vacuum['resource']}/${this.datatype}`;
        console.log(channel);
        this.client.subscribe(channel, (error, granted) => {
            if (!error) {
                tools.envLog('[EcovacsMQTT] Subscribed to atr channel');
                this.emit('ready', 'Client connected. Subscribe successful');
            } else {
                tools.envLog('[EcovacsMQTT] Subscribe err: %s', error.toString());
            }
        });
    }

    connect() {
        this.on("ready", (event) => {
            tools.envLog('[EcovacsMQTT] Received ready event');
        });
    }

    async callEcouserApi(params, api) {
        let portalUrlFormat = constants.PORTAL_URL_FORMAT;
        if (this.country === 'CN') {
            portalUrlFormat = constants.PORTAL_URL_FORMAT_CN;
        }
        let portalUrl = (portalUrlFormat + '/' + api).format({
            continent: this.continent
        });
        if (this.bot.is950type()) {
            portalUrl = portalUrl + "?cv=1.67.3&t=a&av=1.3.1";
            if (api === constants.IOTDEVMANAGERAPI) {
                portalUrl = portalUrl + "&mid=" + params['toType'] + "&did=" + params['toId'] + "&td=" + params['td'] + "&u=" + params['auth']['userid'];
            }
        }

        let headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(params))
        };
        if (this.bot.is950type()) {
            Object.assign(headers, {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)'
            });
        }

        let response;
        try {
            const res = await axios.post(portalUrl, params, {
                headers: headers
            });
            response = res.data;
            tools.envLog("[EcovacsAPI] got %s", JSON.stringify(response));
        } catch (e) {
            this.emitNetworkError(e.message);
            throw e.message;
        }

        if ((response['result'] === 'ok') || (response['ret'] === 'ok')) {
            if (this.bot.errorCode !== '0') {
                this.emitLastErrorByErrorCode('0');
            }
            return response;
        } else {
            const errorCodeObj = {
                code: response['errno']
            };
            this.bot.handleResponseError(errorCodeObj);
            // Error code 500 = wait for response timed out (see issue #19)
            if ((this.bot.errorCode !== '500') || !tools.is710series(this.bot.deviceClass)) {
                this.emitLastError();
            }
            tools.envLog(`[EcovacsAPI] callEcouserApi failure code ${response['errno']} (${response['error']})`);
            throw `Failure code ${response['errno']} (${response['error']})`;
        }
    }

    async sendCommand(action, recipient) {
        let wrappedCommand = this.wrapCommand(action, recipient);
        try {
            const json = await this.callEcouserApi(wrappedCommand, this.getAPI(action));
            this.handleCommandResponse(action, json);
        } catch (e) {
            tools.envLog("[EcovacsMQTT] Error making call to Ecovacs API: " + e.toString());
        }
    }

    getAPI(action) {
        let api = constants.IOTDEVMANAGERAPI; // non 950 type models
        if (action.name === 'GetLogApiCleanLogs') {
            api = constants.LGLOGAPI; // Cleaning log for non 950 type models (MQTT/XML)
        } else if (action.api) {
            api = action.api // 950 type models
        }
        return api;
    }

    //end session
    disconnect() {
        tools.envLog("[EcovacsMQTT] Closing MQTT Client...");
        try {
            this.client.end();
            tools.envLog("[EcovacsMQTT] Closed MQTT Client");
        } catch(e) {
            tools.envLog("[EcovacsMQTT] Error closing MQTT Client:  %s", e.toString());
        }
    }
}

module.exports = EcovacsMQTT;
