'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const nodeMachineId = require('node-machine-id');
const { EcovacsAPI } = require('../index');
const constants = require('../library/constants');
const tools = require('../library/tools');

/**
 * Perform login and fetch product IoT maps for Germany, US, and Japan.
 * @returns {Promise<void>}
 */
async function main() {
    try {
        const settings = getEnvironmentSettings();
        const passwordHash = EcovacsAPI.md5(settings.password);
        
        let machineId;
        try {
            machineId = await nodeMachineId.machineId();
        } catch (err) {
            machineId = 'fallback-machine-id-for-iot-map';
        }
        
        const deviceId = EcovacsAPI.getDeviceId(machineId, 0);
        const api = new EcovacsAPI(deviceId, settings.countryCode, '', settings.authDomain);

        console.log('Logging into Ecovacs...');
        await api.connect(settings.accountId, passwordHash);
        console.log('Login successful.');

        const targetCountries = ['DE', 'US', 'JP'];
        const allItems = [];

        for (const country of targetCountries) {
            console.log(`Fetching IoT map for country: ${country}...`);
            // Temporarily switch country and continent on API helper
            api.country = country;
            api.continent = api.getContinent();

            const response = await callPortalApiCustom(api, 'pim/product/getProductIotMap', 'GetProductIotMap', {
                'userid': api.uid,
                'auth': {
                    'with': 'users',
                    'userid': api.uid,
                    'realm': constants.REALM,
                    'token': api.user_access_token,
                    'resource': api.resource
                }
            });

            if (response && (response.code === 0 || response.code === '0000')) {
                if (Array.isArray(response.data)) {
                    console.log(`Fetched ${response.data.length} items for ${country}.`);
                    allItems.push(...response.data);
                } else {
                    console.warn(`Warning: response.data is not an array for ${country}`);
                }
            } else {
                throw new Error(`Failed to fetch IoT map for ${country}: ${JSON.stringify(response)}`);
            }
        }

        console.log('Merging and deduplicating arrays...');
        const mergedMap = new Map();
        for (const item of allItems) {
            if (item && item.classid) {
                // If already present, keep the existing one (first one fetched)
                if (!mergedMap.has(item.classid)) {
                    mergedMap.set(item.classid, item);
                }
            }
        }

        const mergedList = Array.from(mergedMap.values());
        console.log(`Deduplicated to ${mergedList.length} items.`);

        console.log('Sorting by classid...');
        mergedList.sort((a, b) => a.classid.localeCompare(b.classid));

        console.log('Normalizing and completing product names...');
        const { getNormalizedProductName } = require('../library/modelResolver');
        for (const item of mergedList) {
            if (item && item.product) {
                item.product.name = getNormalizedProductName(item.product);
            }
        }

        console.log('Applying domain replacements (api-app.dc-{na,eu,as}.ww -> portal-ww)...');
        let jsonStr = JSON.stringify(mergedList, null, 2);
        jsonStr = jsonStr.replace(/api-app\.dc-(na|eu|as)\.ww/g, 'portal-ww');

        const outputPath = path.join(__dirname, '../library/productIotMap.json');
        console.log(`Writing pretty JSON to ${outputPath}...`);
        fs.writeFileSync(outputPath, jsonStr, 'utf8');
        console.log('Successfully completed update.');

    } catch (error) {
        console.error('Error during execution:', error.message);
        process.exit(1);
    }
}

/**
 * Custom portal API call to bypass the strict success/error validation in EcovacsAPI.callPortalApi.
 * @param {EcovacsAPI} api - The EcovacsAPI instance.
 * @param {string} loginPath - The API path.
 * @param {string} func - The API function.
 * @param {Object} args - The arguments.
 * @returns {Promise<Object>} The API response data.
 */
async function callPortalApiCustom(api, loginPath, func, args) {
    const params = {
        'todo': func,
        ...args
    };

    let portalUrlFormat = constants.PORTAL_ECOUSER_API;
    if (api.country === 'CN') {
        portalUrlFormat = constants.PORTAL_ECOUSER_API_CN;
    } else if ((api.country === 'WW') || (api.continent.toUpperCase() === 'WW')) {
        portalUrlFormat = constants.PORTAL_ECOUSER_API_LEGACY;
    }
    const portalUrl = tools.formatString(portalUrlFormat + "/" + loginPath, { continent: api.continent });
    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(params))
    };

    const res = await axios.post(portalUrl, params, {
        headers: headers
    });
    return res.data;
}

/**
 * Retrieve credentials and configuration from environment variables.
 * @returns {Object} The environment settings.
 */
function getEnvironmentSettings() {
    const accountId = process.env.ECOVACS_ACCOUNT_ID;
    const password = process.env.ECOVACS_PASSWORD;
    const countryCode = process.env.ECOVACS_COUNTRY_CODE || 'DE';
    const authDomain = process.env.ECOVACS_AUTH_DOMAIN || '';

    if (!accountId || !password) {
        throw new Error('ECOVACS_ACCOUNT_ID and ECOVACS_PASSWORD must be set in the environment.');
    }

    return {
        accountId,
        password,
        countryCode,
        authDomain
    };
}

main();
