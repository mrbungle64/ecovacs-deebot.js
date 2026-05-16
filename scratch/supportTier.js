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

const supportedNames = [
    ...Object.values(SupportedDeebotModels).map(m => m.name),
    ...Object.values(SupportedAirPurifierModels).map(m => m.name)
];

function getSupportTier(model, group) {
    if (group === 'LegacyDevices' || model.type === 'legacy') {
        return '🔴 Legacy';
    }
    if (group === 'SupportedDeebotModels' || group === 'SupportedAirPurifierModels') {
        return '🟢 Active';
    }

    const isActive = supportedNames.some(supportedName => {
        return model.name.includes(supportedName);
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

        const deviceType = ModelTypes[model.type]?.deviceType || 'Unknown';
        const tier = getSupportTier(model, group);

        console.log(`| ${deviceClass} | ${model.name} | ${deviceType} | ${model.type} | ${tier} |`);
    }
}