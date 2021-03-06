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

        let options = {
            clientId: this.username + '/' + resource,
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
        let ecovacsMQTT = this;

        this.client.on('connect', function () {
            tools.envLog('[EcovacsMQTT] client connected');
            this.subscribe('iot/atr/+/' + vacuum_did + '/' + vacuum_class + '/' + vacuum_resource + '/+', (error, granted) => {
                if (!error) {
                    ecovacsMQTT.emit('ready', 'Client connected. Subscribe successful');
                } else {
                    tools.envLog('[EcovacsMQTT] subscribe err: %s', error.toString());
                }
            });
        });

        this.client.on('message', (topic, message) => {
            tools.envLog('[EcovacsMQTT] message.toString(): ', message.toString());
            this.handleMessage(topic, message.toString(), "incoming");
        });

        this.client.on('error', (error) => {
            ecovacsMQTT.emit('error', error);
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
            if (this.country.toLowerCase() === 'cn') {
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
                headers = Object.assign(headers, {'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)'});
            }

            url = new URL(url);
            tools.envLog(`[EcovacsMQTT] Calling ${url.href}`);
            const reqOptions = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: headers
            };
            tools.envLog("[EcovacsMQTT] Sending POST to ", JSON.stringify(reqOptions, getCircularReplacer()));

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
                        tools.envLog("[EcovacsMQTT] call response %s", JSON.stringify(json, getCircularReplacer()));
                        if ((json['result'] === 'ok') || (json['ret'] === 'ok')) {
                            if (this.bot.errorCode !== '0') {
                                this.emitLastErrorByErrorCode('0');
                            }
                            resolve(json);
                        } else {
                            tools.envLog("[EcovacsMQTT] call failed with %s", JSON.stringify(json, getCircularReplacer()));
                            const errorCode = json['errno'];
                            const errorCodeObj = {code: errorCode};
                            if (this.bot.is950type()) {
                                this.bot.handle_error({resultData: errorCodeObj});
                            } else {
                                this.bot.handle_error(errorCodeObj);
                            }
                            // Error code 500 = wait for response timed out (see issue #19)
                            if (this.bot.errorCode !== '500') {
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
            tools.envLog("[EcovacsMQTT] Sending", JSON.stringify(params, getCircularReplacer()));
            req.write(JSON.stringify(params));
            req.end();
        });
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

function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
}

module.exports = EcovacsMQTT;
