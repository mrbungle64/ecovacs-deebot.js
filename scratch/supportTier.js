const { SupportedDeebotModels, SupportedAirPurifierModels, KnownDeebotModels, KnownYeediModels, KnownLawnMowerModels, LegacyDevices } = require('/home/sh/Projects/ecovacs-deebot.js/library/models.js');
const { ModelTypes } = require('/home/sh/Projects/ecovacs-deebot.js/library/modelTypes.js');

const allModels = [
    { group: 'SupportedDeebotModels', models: SupportedDeebotModels },
    { group: 'SupportedAirPurifierModels', models: SupportedAirPurifierModels },
    { group: 'KnownDeebotModels', models: KnownDeebotModels },
    { group: 'KnownYeediModels', models: KnownYeediModels },
    { group: 'KnownLawnMowerModels', models: KnownLawnMowerModels },
    { group: 'LegacyDevices', models: LegacyDevices }
];

const allModelsRegistry = Object.assign({}, SupportedDeebotModels, SupportedAirPurifierModels, KnownDeebotModels, KnownYeediModels, KnownLawnMowerModels, LegacyDevices);

function getSupportTier(model, group) {
    if (group === 'LegacyDevices' || model.type === 'legacy') {
        return '🔴 Legacy';
    }
    if (group === 'SupportedDeebotModels' || group === 'SupportedAirPurifierModels') {
        return '🟢 Active';
    }
    return '🟡 Community';
}

console.log('| Device Class | Name | Device Type | Type | Support Tier |');
console.log('| :--- | :--- | :--- | :--- | :--- |');

const processedClasses = new Set();

for (const { group, models } of allModels) {
    for (const [deviceClass, model] of Object.entries(models)) {
        if (processedClasses.has(deviceClass)) continue;
        processedClasses.add(deviceClass);

        let resolvedModel = { ...model };
        if (resolvedModel.deviceClassLink && allModelsRegistry[resolvedModel.deviceClassLink]) {
            resolvedModel = { ...allModelsRegistry[resolvedModel.deviceClassLink], ...resolvedModel };
        }

        const deviceType = ModelTypes[resolvedModel.type]?.deviceType || 'Unknown';
        const tier = getSupportTier(model, group);

        console.log(`| ${deviceClass} | ${resolvedModel.name} | ${deviceType} | ${resolvedModel.type} | ${tier} |`);
    }
}