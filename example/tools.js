
function isExternSettingsFileAvailable() {
    try {
        require.resolve('./../../deebotExampleSettings');
        return true;
    } catch (e) {
        return false;
    }
}

function getSettingsFile() {
    if (isExternSettingsFileAvailable()) {
        return require('./../../deebotExampleSettings');
    }
    return require('./settings');
}

function dumpSomeVacbotData(vacbot, api) {
    console.log(`- Name: ${vacbot.getName()}`);
    console.log(`- Model: ${vacbot.deviceModel}`);
    console.log(`- Image url: ${vacbot.deviceImageURL}`);
    console.log(`- Is known device: ${vacbot.isKnownDevice()}`);
    console.log(`- Is supported device: ${vacbot.isSupportedDevice()}`);
    console.log(`- Is 950 type model: ${vacbot.is950type()}`);
    console.log(`- Communication protocol: ${vacbot.getProtocol()}`);
    console.log(`- Main brush: ${vacbot.hasMainBrush()}`);
    console.log(`- Mapping capabilities: ${vacbot.hasMappingCapabilities()}`);
    console.log(`- Edge cleaning mode: ${vacbot.hasEdgeCleaningMode()}`);
    console.log(`- Spot cleaning mode: ${vacbot.hasSpotCleaningMode()}`);
    console.log(`- Spot area cleaning mode: ${vacbot.hasSpotAreaCleaningMode()}`);
    console.log(`- Custom area cleaning mode: ${vacbot.hasCustomAreaCleaningMode()}`);
    console.log(`- Mopping system: ${vacbot.hasMoppingSystem()}`);
    console.log(`- Voice reports: ${vacbot.hasVoiceReports()}`);
    console.log(`- Auto empty station: ${vacbot.hasAutoEmptyStation()}`);
    console.log(`- Canvas module available: ${api.getCanvasModuleIsAvailable()}`);
    console.log(`- Using country: ${api.getCountryName()}`);
    console.log(`- Using continent code: ${api.getContinent()}`);
}

module.exports.getSettingsFile = getSettingsFile;
module.exports.dumpSomeVacbotData = dumpSomeVacbotData;
