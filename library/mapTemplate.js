const tools = require('./tools.js');
const SPOTAREA_SUBTYPES = {
    '0': {"en": "Default  (A, B, C...)", "de": "Standard (A, B, C...)"},
    '1': {"en": "Living room", "de": "Wohnzimmer"},
    '2': {"en": "Dining room", "de": "Esszimmer"},
    '3': {"en": "Bedroom", "de": "Schlafzimmer"},
    '4': {"en": "Study", "de": "Büro"},
    '5': {"en": "Kitchen", "de": "Küche"},
    '6': {"en": "Bathroom", "de": "Badezimmer"},
    '7': {"en": "Laundry", "de": "Waschküche"},
    '8': {"en": "Lounge", "de": "Lounge"},
    '9': {"en": "Storeroom", "de": "Lagerraum"},
    '10': {"en": "Kids room", "de": "Kinderzimmer"},
    '11': {"en": "Sunroom", "de": "Wintergarten"},
    '12': {"en": "Corridor", "de": "Flur"},
    '13': {"en": "Balcony", "de": "Balkon"},
    '14': {"en": "Gym", "de": "Fitnessstudio"}
};

class EcovacsMap {
    constructor(mapID, mapIndex, mapName, mapStatus, mapIsCurrentMap = 1, mapIsBuilt = 1) {
        this.mapID = mapID;
        this.mapIndex = mapIndex;
        this.mapName = mapName;
        this.mapStatus = mapStatus;
        this.mapIsCurrentMap = mapIsCurrentMap == 1 ? true : false;
        this.mapIsBuilt = mapIsBuilt == 1 ? true : false;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapIndex: this.mapIndex,
            mapName: this.mapName,
            mapStatus: this.mapStatus,
            mapIsCurrentMap: this.mapIsCurrentMap,
            mapIsBuilt: this.mapIsBuilt
        };
    }
}

class EcovacsMapSpotAreas {
    constructor(mapID, mapSetID) {
        this.mapID = mapID;
        this.mapSetID = mapSetID;
        this.mapSpotAreas = [];
    }

    push(mapSpotArea) {
        this.mapSpotAreas.push(mapSpotArea);
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSetID: this.mapSetID,
            mapSpotAreas: this.mapSpotAreas
        };
    }
}

class EcovacsMapSpotArea {
    constructor(mapSpotAreaID) {
        this.mapSpotAreaID = mapSpotAreaID;
    }

    toJSON() {
        return {
            mapSpotAreaID: this.mapSpotAreaID
        };
    }
}

class EcovacsMapSpotAreaInfo {
    constructor(mapID, mapSpotAreaID, mapSpotAreaConnections, mapSpotAreaBoundaries, mapSubType = "0") {
        this.mapID = mapID;
        this.mapSpotAreaID = mapSpotAreaID;
        if (mapSubType == "0" || !SPOTAREA_SUBTYPES[mapSubType]["en"]) { //if default naming or ID not found in list of names
            this.mapSpotAreaName = String.fromCharCode(65 + parseInt(mapSpotAreaID)); //return character representation (0=A, 1=B, etc.)
        } else {
            this.mapSpotAreaName = SPOTAREA_SUBTYPES[mapSubType]["en"]; //#LANG#
        }
        this.mapSpotAreaConnections = mapSpotAreaConnections;
        this.mapSpotAreaBoundaries = mapSpotAreaBoundaries;
        this.mapSpotAreaCanvas = createCanvasFromCoordinates(mapSpotAreaBoundaries);
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSpotAreaID: this.mapSpotAreaID,
            mapSpotAreaName: this.mapSpotAreaName,
            mapSpotAreaConnections: this.mapSpotAreaConnections,
            mapSpotAreaBoundaries: this.mapSpotAreaBoundaries
        };
    }
}

class EcovacsMapVirtualBoundaries {
    constructor(mapID) {
        this.mapID = mapID;
        this.mapVirtualWalls = [];
        this.mapNoMopZones = [];
    }

    push(mapVirtualBoundary, mapVirtualBoundaryType = 'vw') {
        if(mapVirtualBoundaryType == 'vw') {
            this.mapVirtualWalls.push(mapVirtualBoundary);
        } else if(mapVirtualBoundaryType == 'mw') {
            this.mapNoMopZones.push(mapVirtualBoundary);
        }
    }
    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualWalls: this.mapVirtualWalls,
            mapNoMopZones: this.mapNoMopZones
        };
    }
}

class EcovacsMapVirtualBoundary {
    constructor(mapVirtualBoundaryID, mapVirtualBoundaryType) {
        this.mapVirtualBoundaryID = mapVirtualBoundaryID;
        this.mapVirtualBoundaryType = mapVirtualBoundaryType;
    }
    toJSON() {
        return {
            mapVirtualBoundaryID: this.mapVirtualBoundaryID,
            mapVirtualBoundaryType: this.mapVirtualBoundaryType
        };
    }
}

class EcovacsMapVirtualBoundaryInfo {
    constructor(mapID, mapVirtualBoundaryID, mapVirtualBoundaryType, mapVirtualBoundaryCoordinates) {
        this.mapID = mapID;
        this.mapVirtualBoundaryID = mapVirtualBoundaryID;
        this.mapVirtualBoundaryType = mapVirtualBoundaryType;
        this.mapVirtualBoundaryCoordinates = mapVirtualBoundaryCoordinates;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualBoundaryID: this.mapVirtualBoundaryID,
            mapVirtualBoundaryType: this.mapVirtualBoundaryType,
            mapVirtualBoundaryCoordinates: this.mapVirtualBoundaryCoordinates
        };
    }
}

function createCanvasFromCoordinates(coordinates, width = 100, height = 100) {
    if (!tools.isCanvasModuleAvailable()) {
        return null;
    }
    let coordinateArray = coordinates.split(";");
    const {createCanvas} = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    //ctx.translate(0, 2500);
    ctx.beginPath();
    for (let i = 0; i < coordinateArray.length; i++) {
        let xi = coordinateArray[i].split(',')[0];
        let yi = coordinateArray[i].split(',')[1];
        if (i === 0) {
            ctx.moveTo(xi, yi);
        } else {
            ctx.lineTo(xi, yi);
        }
    }
    ctx.closePath();
    return canvas;
}

function isPositionInSpotArea(position, spotAreaInfos) {
    // Source: https://github.com/substack/point-in-polygon/blob/master/index.js
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    tools.envLog("[isPositionInSpotArea] spotAreaInfos: " + JSON.stringify(spotAreaInfos));
    if (tools.isCanvasModuleAvailable()) {
        for (let infoID in spotAreaInfos) {
            if (spotAreaInfos[infoID]["mapSpotAreaCanvas"].getContext('2d').isPointInPath(parseInt(position[0]), parseInt(position[1]))) {
                return spotAreaInfos[infoID]["mapSpotAreaID"];
            }
        }
    }
    return 'unknown';
}

module.exports.EcovacsMap = EcovacsMap;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapSpotArea = EcovacsMapSpotArea;
module.exports.EcovacsMapSpotAreaInfo = EcovacsMapSpotAreaInfo;
module.exports.EcovacsMapVirtualBoundaries = EcovacsMapVirtualBoundaries;
module.exports.EcovacsMapVirtualBoundary = EcovacsMapVirtualBoundary;
module.exports.EcovacsMapVirtualBoundaryInfo = EcovacsMapVirtualBoundaryInfo;
module.exports.isPositionInSpotArea = isPositionInSpotArea;
