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

        this.client.on('error', (error) => {
            ecovacsMQTT.emit('error', error);
        });
    }

    subscribe() {
        const channel = `iot/atr/+/${this.vacuum['did']}/${this.vacuum['class']}/${this.vacuum['resource']}/${this.datatype}`;
        console.log(channel);
        this.client.subscribe(channel, (error, granted) => {
            if (!error) {
                tools.envLog('[EcovacsMQTT] subscribed to atr');
                this.emit('ready', 'Client connected. Subscribe successful');
            } else {
                tools.envLog('[EcovacsMQTT] subscribe err: %s', error.toString());
            }
        });
    }

    connect() {
        this.on("ready", (event) => {
            tools.envLog('[EcovacsMQTT] received ready event');
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
        } catch (e) {
            tools.envLog(`[EcovacsMQTT] Received error event: ${e.message}`);
            if (e.message.includes('ENOTFOUND')) {
                this.bot.errorDescription = `DNS lookup failed: ${e.message}`;
            }
            if (e.message.includes('EHOSTUNREACH')) {
                this.bot.errorDescription = `Host is unreachable: ${e.message}`;
            }
            else if (e.message.includes('ETIMEDOUT') || e.toString().includes('EAI_AGAIN')) {
                this.bot.errorDescription = `Network connectivity error: ${e.message}`;
            } else {
                this.bot.errorDescription = `Received error event: ${e.message}`;
            }
            this.bot.errorCode = '-1';
            this.emitLastError();
            throw e.message;
        }

        tools.envLog("[EcovacsAPI] got %s", JSON.stringify(response));
        if ((response['result'] !== 'ok') && (response['ret'] !== 'ok')) {
            const errorCodeObj = {
                code: response['errno']
            };
            this.bot.handle_error(errorCodeObj);
            // Error code 500 = wait for response timed out (see issue #19)
            if ((this.bot.errorCode !== '500') || !tools.is710series(this.bot.deviceClass)) {
                this.emitLastError();
            }
            throw "failure code {errno} ({error})".format({
                errno: response['errno'],
                error: response['error']
            });
        }
        if (this.bot.errorCode !== '0') {
            this.emitLastErrorByErrorCode('0');
        }
        return response;
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
