const path = require('path');
const fs = require('fs');

const { SupportedDeebotModels, SupportedAirPurifierModels, KnownDeebotModels, KnownYeediModels, KnownLawnMowerModels, LegacyDevices } = require('../library/models.js');
const { ModelTypes } = require('../library/modelTypes.js');

const allModels = [
    { group: 'SupportedDeebotModels', models: SupportedDeebotModels },
    { group: 'SupportedAirPurifierModels', models: SupportedAirPurifierModels },
    { group: 'KnownDeebotModels', models: KnownDeebotModels },
    { group: 'KnownYeediModels', models: KnownYeediModels },
    { group: 'KnownLawnMowerModels', models: KnownLawnMowerModels },
    { group: 'LegacyDevices', models: LegacyDevices }
];

const allModelsRegistry = Object.assign({}, SupportedDeebotModels, SupportedAirPurifierModels, KnownDeebotModels, KnownYeediModels, KnownLawnMowerModels, LegacyDevices);

const productIotMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../library/productIotMap.json'), 'utf8'));
const iconUrlMap = new Map();
for (const entry of productIotMap) {
    if (entry.product && entry.product.iconUrl) {
        iconUrlMap.set(entry.classid, entry.product.iconUrl);
    }
}

function getSupportTier(model, group) {
    if (group === 'LegacyDevices' || model.type === 'legacy') {
        return '🔴 Legacy';
    }
    if (group === 'SupportedDeebotModels' || group === 'SupportedAirPurifierModels') {
        return '🟢 Active';
    }
    return '🟡 Community';
}

function getTierPriority(tier) {
    if (tier === '🟢 Active') return 0;
    if (tier === '🟡 Community') return 1;
    return 2;
}

function getCategoryPriority(category) {
    if (category === 'Vacuum Cleaner') return 0;
    if (category === 'Air Purifier' || category === 'Air Quality Monitor') return 1;
    if (category === 'Lawn Mower') return 2;
    return 3;
}

const processedClasses = new Set();
const deviceEntries = [];

for (const { group, models } of allModels) {
    for (const [deviceClass, model] of Object.entries(models)) {
        if (processedClasses.has(deviceClass)) continue;
        processedClasses.add(deviceClass);

        let resolvedModel = { ...model };
        if (resolvedModel.deviceClassLink && allModelsRegistry[resolvedModel.deviceClassLink]) {
            resolvedModel = { ...allModelsRegistry[resolvedModel.deviceClassLink], ...resolvedModel };
        }

        const deviceCategory = ModelTypes[resolvedModel.type]?.deviceCategory || 'Unknown';
        const tier = getSupportTier(model, group);
        const iconUrl = iconUrlMap.get(deviceClass);
        const iconHtml = iconUrl ? `<img src="${iconUrl}" width="96" height="96" alt="${resolvedModel.name}">` : '';

        deviceEntries.push({
            iconHtml,
            deviceClass,
            name: resolvedModel.name,
            deviceCategory,
            type: resolvedModel.type,
            tier,
            tierPriority: getTierPriority(tier),
            categoryPriority: getCategoryPriority(deviceCategory)
        });
    }
}

// Sort by tierPriority, then categoryPriority, then type, then name
deviceEntries.sort((a, b) => {
    if (a.tierPriority !== b.tierPriority) {
        return a.tierPriority - b.tierPriority;
    }
    if (a.categoryPriority !== b.categoryPriority) {
        return a.categoryPriority - b.categoryPriority;
    }
    if (a.type !== b.type) {
        return String(a.type).localeCompare(String(b.type));
    }
    return String(a.name).localeCompare(String(b.name));
});

console.log('| Icon | Device Class | Name | Device Type | Type | Support Tier |');
console.log('| :--- | :--- | :--- | :--- | :--- | :--- |');

for (const entry of deviceEntries) {
    console.log(`| ${entry.iconHtml} | ${entry.deviceClass} | ${entry.name} | ${entry.deviceCategory} | ${entry.type} | ${entry.tier} |`);
}