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
        if (mapSubType == "0") {
            this.mapSpotAreaName = String.fromCharCode(65 + parseInt(mapSpotAreaID));
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

class EcovacsMapVirtualWalls {
    constructor(mapID) {
        this.mapID = mapID;
        this.mapVirtualWalls = [];
    }

    push(mapVirtualWall) {
        this.mapVirtualWalls.push(mapVirtualWall);
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualWalls: this.mapVirtualWalls
        };
    }
}

class EcovacsMapVirtualWall {
    constructor(mapVirtualWallID) {
        this.mapVirtualWallID = mapVirtualWallID;
    }

    toJSON() {
        return {
            mapVirtualWallID: this.mapVirtualWallID
        };
    }
}

class EcovacsMapVirtualWallInfo {
    constructor(mapID, mapVirtualWallID, mapVirtualWallBoundaries) {
        this.mapID = mapID;
        this.mapVirtualWallID = mapVirtualWallID;
        this.mapVirtualWallBoundaries = mapVirtualWallBoundaries;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualWallID: this.mapVirtualWallID,
            mapVirtualWallBoundaries: this.mapVirtualWallBoundaries
        };
    }
}

class EcovacsMapNoMopZones {
    constructor(mapID) {
        this.mapID = mapID;
        this.mapNoMopZones = [];
    }

    push(mapNoMopZone) {
        this.mapNoMopZones.push(mapNoMopZone);
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapNoMopZones: this.mapNoMopZones
        };
    }
}

class EcovacsMapNoMopZone {
    constructor(mapNoMopZoneID) {
        this.mapNoMopZoneID = mapNoMopZoneID;
    }

    toJSON() {
        return {
            mapNoMopZoneID: this.mapNoMopZoneID
        };
    }
}

class EcovacsMapNoMopZoneInfo {
    constructor(mapID, mapNoMopZoneID, mapNoMopZoneIDBoundaries) {
        this.mapID = mapID;
        this.mapNoMopZoneID = mapNoMopZoneID;
        this.mapNoMopZoneIDBoundaries = mapNoMopZoneIDBoundaries;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapNoMopZoneID: this.mapNoMopZoneID,
            mapNoMopZoneIDBoundaries: this.mapNoMopZoneIDBoundaries
        };
    }
}

function createCanvasFromCoordinates(coordinates, width = 100, height = 100) {
    if (!isCanvasModuleAvailable()) {
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
    if (isCanvasModuleAvailable()) {
        for (let infoID in spotAreaInfos) {
            if (spotAreaInfos[infoID]["mapSpotAreaCanvas"].getContext('2d').isPointInPath(parseInt(position[0]), parseInt(position[1]))) {
                return spotAreaInfos[infoID]["mapSpotAreaID"];
            }
        }
    }
    return 'unknown';
}

function isCanvasModuleAvailable() {
    try {
        require.resolve('canvas');
        return true;
    } catch (e) {
        return false;
    }
}

module.exports.EcovacsMap = EcovacsMap;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapSpotArea = EcovacsMapSpotArea;
module.exports.EcovacsMapSpotAreaInfo = EcovacsMapSpotAreaInfo;
module.exports.EcovacsMapVirtualWalls = EcovacsMapVirtualWalls;
module.exports.EcovacsMapVirtualWall = EcovacsMapVirtualWall;
module.exports.EcovacsMapVirtualWallInfo = EcovacsMapVirtualWallInfo;
module.exports.EcovacsMapNoMopZones = EcovacsMapNoMopZones;
module.exports.EcovacsMapNoMopZone = EcovacsMapNoMopZone;
module.exports.EcovacsMapNoMopZoneInfo = EcovacsMapNoMopZoneInfo;
module.exports.isPositionInSpotArea = isPositionInSpotArea;
module.exports.isCanvasModuleAvailable = isCanvasModuleAvailable;
