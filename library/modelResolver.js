'use strict';

/**
 * @file This file contains the logic for dynamically resolving properties
 * and capabilities of unknown Ecovacs/Yeedi devices by comparing them to
 * known devices or using heuristic rules.
 */

const SCIENTISTS = [
    'EINSTEIN', 'TURING', 'CURIE', 'DARWIN', 'BOHR',
    'MENDEL', 'COPERNIC', 'KOPERNIK', 'FARADAY', 'EULER',
    'KEPLER', 'PLANCK', 'HALLEY', 'SHAKESPEARE'
];

const KNOWN_PLATFORMS = ['SS', 'FS', 'Y2', 'U2', 'N8', 'T30', 'T20', 'T9', 'X2', 'CARTESIANPLUS', 'CARTESIAN'];

const STATION_KEYWORDS = ['OMNI', 'PLUS', 'AES', 'TURBO', 'COMBO', 'STATION'];
const SIMILARITY_CLONE_THRESHOLD = 95;
const PLATFORM_TYPES = {
    EINSTEIN: 'X1',
    TURING: 'X1',
    CURIE: 'X1',
    DARWIN: 'T20',
    BOHR: 'X2',
    MENDEL: 'T20',
    COPERNIC: 'T20',
    KOPERNIK: 'T20',
    FARADAY: 'T20',
    EULER: 'T10',
    KEPLER: 'T20',
    PLANCK: 'X2',
    HALLEY: 'X2',
    SHAKESPEARE: 'T20',
    CARTESIAN: 'T10',
    CARTESIANPLUS: 'T10',
    SS: 'mini',
    FS: 'T20'
};

/**
 * Resolves device properties dynamically using similarity matching and heuristics.
 * @param {string} deviceClass - The 6-character class ID of the unknown device.
 * @param {Array<Object>} productIotMap - The loaded productIotMap JSON data.
 * @param {Object} allKnownDevices - All statically defined devices in models.js.
 * @returns {Object|null} The resolved device configuration object, or null if cannot be resolved.
 */
function resolveDeviceProperties(deviceClass, productIotMap, allKnownDevices) {
    const targetProduct = findProductInMap(deviceClass, productIotMap);
    if (!targetProduct) {
        return null;
    }

    const matchResult = findBestSimilarityMatch(targetProduct, productIotMap, allKnownDevices);
    if (matchResult && matchResult.score >= SIMILARITY_CLONE_THRESHOLD) {
        const baseDevice = allKnownDevices[matchResult.classid];
        let inheritedClass = matchResult.classid;
        
        // Handle deviceClassLink indirection
        if (baseDevice.deviceClassLink && allKnownDevices[baseDevice.deviceClassLink]) {
            inheritedClass = baseDevice.deviceClassLink;
        }

        const resolved = Object.assign({}, allKnownDevices[inheritedClass], {
            name: targetProduct.name || baseDevice.name,
            smartType: targetProduct.smartType || baseDevice.smartType,
            resolvedViaSimilarity: true,
            resolvedSimilarityScore: matchResult.score,
            resolvedSimilarityLink: inheritedClass
        });

        // Delete deviceClassLink if present to avoid circular lookup loops
        delete resolved.deviceClassLink;
        return resolved;
    }

    return inferPropertiesHeuristically(targetProduct);
}

/**
 * Finds the best similarity match for a target product among all statically known models.
 * @param {Object} targetProduct - The product metadata for the target device.
 * @param {Array<Object>} productIotMap - The product IoT map.
 * @param {Object} allKnownDevices - All statically defined devices.
 * @returns {Object|null} The best match containing { classid, score }, or null.
 */
function findBestSimilarityMatch(targetProduct, productIotMap, allKnownDevices) {
    let bestScore = -1;
    let bestClassid = null;

    for (const knownClassid of Object.keys(allKnownDevices)) {
        const knownProduct = findProductInMap(knownClassid, productIotMap);
        if (!knownProduct) {
            continue;
        }

        const score = calculateModelSimilarity(targetProduct, knownProduct);
        if (score > bestScore) {
            bestScore = score;
            bestClassid = knownClassid;
        }
    }

    if (!bestClassid) {
        return null;
    }

    return {
        classid: bestClassid,
        score: bestScore
    };
}

/**
 * Calculates the technical similarity probability between two products.
 * @param {Object} p1 - The first product object.
 * @param {Object} p2 - The second product object.
 * @returns {number} Normalized similarity percentage (0 to 100).
 */
function calculateModelSimilarity(p1, p2) {
    let score = 0;

    // F1: Platform Codename (Weight: 30)
    const s1 = extractPlatformCodename(p1.model);
    const s2 = extractPlatformCodename(p2.model);
    if (s1 && s2 && s1 === s2) {
        score += 30;
    }

    // F2: UILogicId Full Match (Weight: 25)
    if (p1.UILogicId && p2.UILogicId && p1.UILogicId.toLowerCase() === p2.UILogicId.toLowerCase()) {
        score += 25;
    }

    // F3: SmartType (Weight: 10)
    if (p1.smartType && p2.smartType && p1.smartType === p2.smartType) {
        score += 10;
    }

    // F4: UI Base Prefix (Weight: 10)
    const prefix1 = extractUIBasePrefix(p1.UILogicId);
    const prefix2 = extractUIBasePrefix(p2.UILogicId);
    if (prefix1 && prefix2 && prefix1 === prefix2) {
        score += 10;
    }

    // F5: Station Keywords (Weight: 5)
    const kw1 = getStationKeywords(p1);
    const kw2 = getStationKeywords(p2);
    score += calculateKeywordScore(kw1, kw2) * 5;

    // F6: Icon ID (Weight: 5)
    const icon1 = extractIconId(p1.icon || p1.iconUrl);
    const icon2 = extractIconId(p2.icon || p2.iconUrl);
    if (icon1 && icon2 && icon1 === icon2) {
        score += 5;
    }

    // F7: Brand and Series Family Match (Weight: 15)
    const m1 = getManufacturer(p1);
    const m2 = getManufacturer(p2);
    const ser1 = getProductSeries(p1);
    const ser2 = getProductSeries(p2);
    if (ser1 !== 'unknown' && ser2 !== 'unknown' && ser1 === ser2) {
        if (m1 === m2) {
            score += 15;
        } else {
            score += 7.5;
        }
    }

    return score;
}

/**
 * Infers device capabilities and platform properties heuristically based on product info.
 * @param {Object} product - The product metadata.
 * @returns {Object} The inferred device configuration.
 */
function inferPropertiesHeuristically(product) {
    const UILogicId = (product.UILogicId || '').toLowerCase();
    const model = (product.model || '').toLowerCase();
    const name = (product.name || 'DEEBOT Unknown');
    const platform = extractPlatformCodename(product.model);

    // Heuristics A: Platform Type Resolution
    let type = platform ? PLATFORM_TYPES[platform] : null;

    // Refine type by deep-inspecting UI Plugin suffixes (UI Families)
    if (UILogicId.endsWith('ssh5') || UILogicId.endsWith('ssth5')) {
        type = 'mini';
    } else if (UILogicId.endsWith('fsh5') || UILogicId.endsWith('shakespeareh5')) {
        type = 'T20';
    } else if (UILogicId.startsWith('t10_')) {
        type = 'T10';
    } else if (UILogicId.startsWith('t30_') || UILogicId.startsWith('omni_')) {
        type = 'T20';
    } else if (UILogicId.startsWith('n8_')) {
        type = 'N8';
    } else if (UILogicId.startsWith('y2_') || UILogicId.startsWith('y30_')) {
        type = 'T10';
    } else if (UILogicId.startsWith('goat') || UILogicId.startsWith('goatl_') || UILogicId.startsWith('goatr_')) {
        type = 'lawnMower';
    } else if (UILogicId.startsWith('w2pro_') || UILogicId.startsWith('sharkmini_') || UILogicId.startsWith('belugapro_') || UILogicId.startsWith('davinicih_') || UILogicId.startsWith('taishan_')) {
        type = 'WINBOT';
    } else if (product.smartType === 'BT') {
        type = 'WINBOT';
    } else if (product.smartType === 'SPA' || product.smartType === 'HK_AP') {
        type = 'legacy';
    }
    
    if (!type) {
        type = 'unknown';
    }

    // Default basic capabilities
    const capabilities = type === 'legacy' ? ['vacuumBase'] : ['vacuumBase', 'navigationBase', 'moppingHigh'];

    // Heuristics B: Dynamic Station & Capability Inference
    // We only trust the name and model for hardware station features (OMNI/PLUS/COMBO)
    const hardwareSearchString = (name + " " + model).toLowerCase();
    const hasOmni = hardwareSearchString.includes('omni');
    const hasPlus = hardwareSearchString.includes('plus') || hardwareSearchString.includes('aes');
    const hasCombo = hardwareSearchString.includes('combo');
    const hasTurbo = hardwareSearchString.includes('turbo');

    if (hasCombo) {
        capabilities.push('COMBO', 'suctionMaxPlus', 'moppingUltraHigh');
    } else if (hasOmni) {
        capabilities.push('OMNI', 'suctionMaxPlus', 'moppingUltraHigh');
    } else if (hasPlus) {
        capabilities.push('PLUS', 'suctionMaxPlus');
    } else if (hasTurbo) {
        capabilities.push('TURBO', 'suctionMaxPlus', 'moppingUltraHigh');
    }

    // Heuristics C: Protocol Version Inference
    const isV2 = hasH5PluginSuffix(UILogicId);

    // Remove duplicates from capabilities
    const uniqueCapabilities = [...new Set(capabilities)];

    return {
        name,
        smartType: product.smartType || 'MQ_AP',
        capabilities: uniqueCapabilities,
        type,
        V2: isV2,
        resolvedViaHeuristics: true
    };
}

/**
 * Searches the productIotMap for a given class ID.
 * @param {string} classid - The 6-character class ID to find.
 * @param {Array<Object>} productIotMap - The product IoT map.
 * @returns {Object|null} The product details if found, or null.
 */
function findProductInMap(classid, productIotMap) {
    if (!classid || !Array.isArray(productIotMap)) {
        return null;
    }
    const found = productIotMap.find(item => item.classid === classid);
    return found ? found.product : null;
}

/**
 * Extracts a platform codename from the model string.
 * Supports underscores and hyphens as delimiters.
 * Matches exact segments to avoid false substring positives.
 * @param {string} model - The model attribute.
 * @returns {string|null} The platform name, or null.
 */
function extractPlatformCodename(model) {
    if (!model) {
        return null;
    }
    const upperModel = model.toUpperCase();
    const segments = upperModel.split(/[_-]/);

    // 1. Check segments for exact matches with known scientists or platforms
    const allKnown = [...SCIENTISTS, ...KNOWN_PLATFORMS];
    for (const seg of segments) {
        if (allKnown.includes(seg)) {
            return seg;
        }
    }

    // 2. Fallback: First segment if it looks like a custom technical ID
    const firstSegment = segments[0];
    if (firstSegment && firstSegment.length >= 2 && firstSegment !== 'DEEBOT' && firstSegment !== 'GOAT') {
        return firstSegment;
    }
    return null;
}

/**
 * Extracts a scientist codename from the model string (Alias for extractPlatformCodename).
 * @param {string} model - The model attribute.
 * @returns {string|null} The platform name, or null.
 */
function extractScientist(model) {
    return extractPlatformCodename(model);
}

/**
 * Extracts the base UI logic prefix before the first underscore and normalizes it.
 * Normalization removes marketing suffixes to group variants into families.
 * @param {string} UILogicId - The UI Logic ID.
 * @returns {string|null} The normalized prefix, or null.
 */
function extractUIBasePrefix(UILogicId) {
    if (!UILogicId) {
        return null;
    }
    let prefix = UILogicId.split('_')[0].toLowerCase();
    
    // Normalize: remove known marketing suffixes (sequential removal)
    const suffixes = ['pro', 'max', 'plus', 'combo', 'mix', 'se', 'black', 'white', 'dock', 'up', 'h'];
    let changed = true;
    while (changed) {
        changed = false;
        for (const s of suffixes) {
            if (prefix.endsWith(s) && prefix.length > s.length) {
                prefix = prefix.substring(0, prefix.length - s.length);
                changed = true;
            }
        }
    }
    return prefix;
}

/**
 * Extracts station keywords present in the product metadata.
 * @param {Object} product - The product object.
 * @returns {Array<string>} List of lowercase found keywords.
 */
function getStationKeywords(product) {
    const list = [];
    const searchString = ( (product.name || '') + " " + (product.model || '') + " " + (product.UILogicId || '')).toUpperCase();
    
    for (const kw of STATION_KEYWORDS) {
        if (searchString.includes(kw)) {
            list.push(kw);
        }
    }
    return list;
}

/**
 * Computes keyword matching score (1.0 for perfect match, 0.5 for partial overlap, 0 otherwise).
 * @param {Array<string>} kw1 - Keywords of product 1.
 * @param {Array<string>} kw2 - Keywords of product 2.
 * @returns {number} Score multiplier between 0 and 1.
 */
function calculateKeywordScore(kw1, kw2) {
    if (kw1.length === 0 && kw2.length === 0) {
        return 1.0;
    }
    if (kw1.length === 0 || kw2.length === 0) {
        return 0;
    }
    
    const set1 = new Set(kw1);
    const set2 = new Set(kw2);
    
    let intersectCount = 0;
    for (const item of set1) {
        if (set2.has(item)) {
            intersectCount++;
        }
    }
    
    if (intersectCount === set1.size && intersectCount === set2.size) {
        return 1.0;
    }
    if (intersectCount > 0) {
        return 0.5;
    }
    return 0;
}

/**
 * Checks whether a UILogicId uses a modern H5 plugin suffix.
 * @param {string} UILogicId - The UI Logic ID.
 * @returns {boolean} True if the final plugin segment ends with h5.
 */
function hasH5PluginSuffix(UILogicId) {
    if (!UILogicId) {
        return false;
    }
    const pluginId = UILogicId.split('_').pop();
    return pluginId.endsWith('h5');
}

/**
 * Extracts the trailing hex/id value from an icon identifier or portal URL path.
 * @param {string} iconOrUrl - The icon field or iconUrl string.
 * @returns {string|null} The icon ID, or null.
 */
function extractIconId(iconOrUrl) {
    if (!iconOrUrl) {
        return null;
    }
    const parts = iconOrUrl.split('/');
    return parts[parts.length - 1].toLowerCase();
}

/**
 * Classifies the manufacturer based on the product metadata.
 * @param {Object} product - The product object.
 * @returns {string} The manufacturer name ('yeedi' or 'ecovacs').
 */
function getManufacturer(product) {
    const name = (product.name || '').toLowerCase();
    const model = (product.model || '').toLowerCase();
    const ui = (product.UILogicId || '').toLowerCase();
    if (name.includes('yeedi') || model.includes('yeedi') || ui.includes('yyeedi') || ui.includes('yeedi')) {
        return 'yeedi';
    }
    return 'ecovacs';
}

/**
 * Extracts a normalized series codename from the product metadata.
 * @param {Object} product - The product object.
 * @returns {string} The normalized series codename, or 'unknown'.
 */
function getProductSeries(product) {
    const name = (product.name || '').toLowerCase();
    const model = (product.model || '').toLowerCase();
    
    // 1. Try to match standard alphanumeric series patterns (e.g. T8, T30, X1, S20, M12, G1, W2, etc.)
    const match = name.toUpperCase().match(/\b([A-Z]{1,2}\d{1,4}[A-Z]*)\b/);
    if (match) {
        let series = match[1].toLowerCase();
        if (series.endsWith('e')) {
            series = series.replace(/([a-z]{1,2}\d+)e$/, '$1e');
        } else {
            series = series.replace(/([a-z]{1,2}\d+)[a-z]+$/, '$1');
        }
        return series;
    }
    
    // 2. Look for 3-4 digit numbers (e.g. 920, 950, 900, 710, 500)
    const numMatch = name.match(/\b(\d{3,4})\b/);
    if (numMatch) {
        return numMatch[1];
    }

    // 3. Fallback to model string matching
    const modelMatch = model.toUpperCase().match(/([A-Z]{1,2}\d{1,4})/);
    if (modelMatch) {
        return modelMatch[1].toLowerCase();
    }
    
    // 4. Try descriptive keywords in name or model
    if (name.includes('neo')) {
        return 'neo';
    }
    if (name.includes('mini')) {
        return 'mini';
    }
    if (name.includes('cube') || model.includes('cube') || model.includes('_cc')) {
        return 'cube';
    }
    if (name.includes('vac') || model.includes('vac') || model.includes('_k7')) {
        return 'vac';
    }
    if (name.includes('floor') || model.includes('k960')) {
        return 'floor';
    }
    if (name.includes('milo') || model.includes('phoenix')) {
        return 'milo';
    }
    if (name.includes('purifier') || name.includes('airbot') || name.includes('at90')) {
        return 'airbot';
    }
    if (name.includes('monalisa')) {
        return 'monalisa';
    }
    if (name.includes('aaron') || model.includes('at80')) {
        return 'aaron';
    }
    if (name.includes('ava') || model.includes('ava')) {
        return 'ava';
    }
    if (name.includes('goat') || model.includes('goat')) {
        return 'goat';
    }
    if (name.includes('teo') || model.includes('teo') || model.includes('darwin_omni_teo')) {
        return 'teo';
    }
    if (name.includes('iboto') || model.includes('iboto')) {
        return 'iboto';
    }
    if (name.includes('andy') || model.includes('andy')) {
        return 'andy';
    }
    if (name.includes('alpha') || model.includes('alpha')) {
        return 'alpha';
    }
    
    return 'unknown';
}

module.exports = {
    resolveDeviceProperties,
    calculateModelSimilarity,
    inferPropertiesHeuristically,
    extractPlatformCodename,
    extractScientist,
    extractUIBasePrefix,
    getStationKeywords,
    hasH5PluginSuffix,
    extractIconId,
    getManufacturer,
    getProductSeries
};
