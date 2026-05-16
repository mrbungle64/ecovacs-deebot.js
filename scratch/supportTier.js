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

const activeDeviceClasses = new Set([
    ...Object.keys(SupportedDeebotModels),
    ...Object.keys(SupportedAirPurifierModels)
]);

const supportedNames = [
    ...Object.values(SupportedDeebotModels).map(m => m.name),
    ...Object.values(SupportedAirPurifierModels).map(m => m.name)
];

function getSupportTier(model, group) {
    if (group === 'LegacyDevices' || model.type === 'legacy') {
        return '🔴 Legacy';
    }

    // Resolve model to get linked properties
    let resolvedModel = { ...model };
    if (resolvedModel.deviceClassLink && allModelsRegistry[resolvedModel.deviceClassLink]) {
        resolvedModel = { ...allModelsRegistry[resolvedModel.deviceClassLink], ...resolvedModel };
    }

    // Is in a supported group OR links to a device in a supported group
    if (group === 'SupportedDeebotModels' ||
        group === 'SupportedAirPurifierModels' ||
        activeDeviceClasses.has(model.deviceClassLink)) {
        return '🟢 Active';
    }

    const isActive = supportedNames.some(supportedName => {
        return resolvedModel.name.includes(supportedName);
    });

    if (isActive) {
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