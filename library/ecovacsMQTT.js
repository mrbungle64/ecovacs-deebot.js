const Ecovacs = require('./ecovacs');
const tools = require('./tools');
const constants = require('./ecovacsConstants');
const https = require('https');
const URL = require('url').URL;

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

    callEcovacsDeviceAPI(params, api) {
        return new Promise((resolve, reject) => {
            let portalUrlFormat = constants.PORTAL_URL_FORMAT;
            if (this.country === 'CN') {
                portalUrlFormat = constants.PORTAL_URL_FORMAT_CN;
            }
            let url = (portalUrlFormat + '/' + api).format({
                continent: this.continent
            });
            if (this.bot.is950type()) {
                url = url + "?cv=1.67.3&t=a&av=1.3.1";
                if (api === constants.IOTDEVMANAGERAPI) {
                    url = url + "&mid=" + params['toType'] + "&did=" + params['toId'] + "&td=" + params['td'] + "&u=" + params['auth']['userid'];
                }
            }

            let headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(params))
            };
            if (this.bot.is950type()) {
                Object.assign(headers, {'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)'});
            }

            url = new URL(url);
            tools.envLog(`[EcovacsMQTT] Calling ${url.href}`);
            const reqOptions = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: headers
            };
            tools.envLog("[EcovacsMQTT] Sending POST to ", JSON.stringify(reqOptions));

            const req = https.request(reqOptions, (res) => {
                res.setEncoding('utf8');
                res.setTimeout(6000);
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(rawData);
                        tools.envLog("[EcovacsMQTT] call response %s", JSON.stringify(json));
                        if ((json['result'] === 'ok') || (json['ret'] === 'ok')) {
                            if (this.bot.errorCode !== '0') {
                                this.emitLastErrorByErrorCode('0');
                            }
                            resolve(json);
                        } else {
                            tools.envLog("[EcovacsMQTT] call failed with %s", JSON.stringify(json));
                            const errorCodeObj = {
                                code: json['errno']
                            };
                            this.bot.handle_error(errorCodeObj);
                            // Error code 500 = wait for response timed out (see issue #19)
                            if ((this.bot.errorCode !== '500') || !tools.is710series(this.bot.deviceClass)) {
                                this.emitLastError();
                            }
                            reject(errorCodeObj);
                        }
                    } catch (e) {
                        tools.envLog("[EcovacsMQTT] Error parsing response data: " + e.toString());
                        this.emitLastErrorByErrorCode('-3');
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => {
                tools.envLog(`[EcovacsMQTT] Received error event: ${e.message}`);
                if (e.toString().includes('ENOTFOUND')) {
                    this.bot.errorDescription = `DNS lookup failed: ${e.message}`;
                }
                if (e.toString().includes('EHOSTUNREACH')) {
                    this.bot.errorDescription = `Host is unreachable: ${e.message}`;
                }
                else if (e.toString().includes('ETIMEDOUT') || e.toString().includes('EAI_AGAIN')) {
                    this.bot.errorDescription = `Network connectivity error: ${e.message}`;
                } else {
                    this.bot.errorDescription = `Received error event: ${e.message}`;
                }
                this.bot.errorCode = '-1';
                this.emitLastError();
                reject(e);
            });

            // write data to request body
            tools.envLog("[EcovacsMQTT] Sending", JSON.stringify(params));
            req.write(JSON.stringify(params));
            req.end();
        }).catch((e)=> {
            tools.envLog("[EcovacsMQTT] Promise rejection: " + JSON.stringify(e));
        });
    }

    async sendCommand(action, recipient) {
        let wrappedCommand = this.wrapCommand(action, recipient);
        try {
            const json = await this.callEcovacsDeviceAPI(wrappedCommand, this.getAPI(action));
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
