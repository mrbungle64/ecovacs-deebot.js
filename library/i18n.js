'use strict';

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
};

/**
 * Given a spot area name, return the localized name of the area
 * @param {string} name - The name of the spot area
 * @param {string} [languageCode=en] - The two-letter code (ISO 639-1) of the language you want the area name to be in
 * @returns {string} the area name for the given area name
 */
function getSpotAreaName(name, languageCode = 'en') {
    const key = name.toLowerCase();
    if (SPOTAREA_SUBTYPE_NAMES.hasOwnProperty(key)) {
        if (SPOTAREA_SUBTYPE_NAMES[key].hasOwnProperty(languageCode)) {
            name = SPOTAREA_SUBTYPE_NAMES[key][languageCode];
        }
    }
    return name;
}

module.exports.getSpotAreaName = getSpotAreaName;
