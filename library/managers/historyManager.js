'use strict';

const crypto = require("crypto");
const querystring = require("node:querystring");
const axios = require('axios').default;
const tools = require('../tools');
const constants = require("../constants");

/**
 * @class HistoryManager
 * Handles REST API interactions for cleaning logs and secured content.
 */
class HistoryManager {
    /**
     * @param {import('../vacBot')} bot - The VacBot instance.
     */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Call the REST API to fetch cleaning results logs.
     * @returns {Promise<Object>}
     */
    async callCleanResultsLogsApi() {
        let portalPath = constants.APP_ECOUSER_API;
        if (this.bot.country === 'CN') {
            portalPath = constants.APP_ECOUSER_API;
        }

        portalPath = tools.formatString(portalPath, { continent: this.bot.continent });
        if (this.bot.country === 'CN') {
            portalPath = portalPath.replace('.com', '.cn');
        }
        portalPath = portalPath + '/dln/api/log/clean_result/list?';

        const auth = {
            "realm": constants.REALM,
            "with": "users",
            "userid": this.bot.uid,
            "token": this.bot.user_access_token,
            "resource": this.bot.resource
        };

        const ts = Date.now();
        const sign = crypto.createHash('sha256').update(constants.APP_ID + constants.APP_SK + ts.toString()).digest("hex");

        const queryParams = {
            'auth': JSON.stringify(auth),
            'channel': 'google_play',
            'did': this.bot.did,
            'et1': ts,
            'defaultLang': 'EN',
            'logType': 'clean',
            'reqid': '##REQID##',
            'res': this.bot.res,
            'size': 20,
            'version': 'v2'
        };

        const config = {
            headers: {
                'Authorization': 'Bearer ' + this.bot.user_access_token,
                'token': this.bot.user_access_token,
                'appid': 'ecovacs',
                'plat': 'android',
                'userid': this.bot.uid,
                'user-agent': 'EcovacsHome/2.3.7 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)',
                'v': '2.3.7',
                'country': this.bot.country,
                'sign': sign,
                'signType': 'sha256'
            }
        };

        const searchParams = querystring.encode(queryParams);
        tools.envLogInfo(`[EcovacsAPI] callLogsApi calling ${portalPath}`);
        try {
            const res = await axios.get(portalPath + searchParams, config);
            return res.data;
        } catch (err) {
            tools.envLogInfo(`[EcovacsAPI] callLogsApi error: ${err}`);
            throw err;
        }
    }

    /**
     * Get the crypto hash string for secured content.
     * @returns {string}
     */
    getCryptoHashStringForSecuredContent() {
        const ts = Date.now();
        return constants.APP_ID + constants.APP_SK + ts.toString();
    }

    /**
     * Download secured content (e.g. map images from logs).
     * @param {string} url
     * @param {string} targetFilename
     * @returns {Promise<void>}
     */
    async downloadSecuredContent(url, targetFilename) {
        const sign = crypto.createHash('sha256').update(this.getCryptoHashStringForSecuredContent()).digest("hex");

        const headers = {
            'Authorization': 'Bearer ' + this.bot.user_access_token,
            'token': this.bot.user_access_token,
            'appid': 'ecovacs',
            'plat': 'android',
            'userid': this.bot.uid,
            'user-agent': 'EcovacsHome/2.3.7 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)',
            'v': '2.3.7',
            'country': this.bot.country,
            'sign': sign,
            'signType': 'sha256'
        };

        try {
            const res = await axios.get(url, {
                headers,
                responseType: 'arraybuffer'
            });
            const result = res.data;
            const fs = require('fs');
            fs.writeFile(targetFilename, result, err => {
                if (err) {
                    tools.envLogInfo(`[EcovacsAPI] downloadSecuredContent error: ${err}`);
                }
            });
        } catch (err) {
            tools.envLogInfo(`[EcovacsAPI] downloadSecuredContent error: ${err}`);
            throw err;
        }
    }
}

module.exports = HistoryManager;
