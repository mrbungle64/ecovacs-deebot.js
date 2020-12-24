const SPOTAREA_SUBTYPE_NAMES = {
    'living room': {'en': 'Living room', 'de': 'Wohnzimmer'},
    'dining room': {'en': 'Dining room', 'de': 'Esszimmer'},
    'bedroom': {'en': 'Bedroom', 'de': 'Schlafzimmer'},
    'study': {'en': 'Study', 'de': 'Büro'},
    'kitchen': {'en': 'Kitchen', 'de': 'Küche'},
    'bathroom': {'en': 'Bathroom', 'de': 'Badezimmer'},
    'laundry': {'en': 'Laundry', 'de': 'Waschküche'},
    'lounge': {'en': 'Lounge', 'de': 'Lounge'},
    'storeroom': {'en': 'Storeroom', 'de': 'Lagerraum'},
    'kids room': {'en': 'Kids room', 'de': 'Kinderzimmer'},
    'sunroom': {'en': 'Sunroom', 'de': 'Wintergarten'},
    'corridor': {'en': 'Corridor', 'de': 'Flur'},
    'balcony': {'en': 'Balcony', 'de': 'Balkon'},
    'gym': {'en': 'Gym', 'de': 'Fitnessstudio'}
}

function getSpotAreaName(name, languageCode = 'en') {
    let areaName = name;
    const spotAreaSubtypes = SPOTAREA_SUBTYPE_NAMES;
    if (spotAreaSubtypes.hasOwnProperty(name.toLowerCase())) {
        areaName = spotAreaSubtypes[name.toLowerCase()][languageCode];
    }
    return areaName;
}

module.exports.getSpotAreaName = getSpotAreaName;
