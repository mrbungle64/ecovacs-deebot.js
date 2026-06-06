'use strict';

/**
* Dictionary of the spot area types
* @see i18n.js for translation dictionary
**/
const SPOTAREA_SUBTYPES = {
    '0': 'Default  (A, B, C...)',
    '1': 'Living room',
    '2': 'Dining room',
    '3': 'Bedroom',
    '4': 'Study',
    '5': 'Kitchen',
    '6': 'Bathroom',
    '7': 'Laundry',
    '8': 'Lounge',
    '9': 'Storeroom',
    '10': 'Kids room',
    '11': 'Sunroom',
    '12': 'Corridor',
    '13': 'Balcony',
    '14': 'Gym'
};

class EcovacsMap {
    constructor(mapID, mapIndex, mapName, mapStatus, mapIsCurrentMap = 1, mapIsBuilt = 1) {
        this.mapID = mapID;
        this.mapIndex = mapIndex;
        this.mapName = mapName;
        this.mapStatus = mapStatus;
        this.mapIsCurrentMap = Number(mapIsCurrentMap) === 1;
        this.mapIsBuilt = Number(mapIsBuilt) === 1;
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
    constructor(mapID, mapSpotAreaID, mapSpotAreaConnections, mapSpotAreaBoundaries, mapSubType = '0', customName = '') {
        this.mapID = mapID;
        this.mapSpotAreaID = mapSpotAreaID;
        if (customName !== '') {
            this.mapSpotAreaName = customName;
        } else if ((mapSubType === '0') || !SPOTAREA_SUBTYPES[mapSubType]) {
            // if default naming or ID not found in list of names
            // return character representation (0=A, 1=B, etc.)
            this.mapSpotAreaName = String.fromCharCode(65 + parseInt(mapSpotAreaID));
        } else {
            this.mapSpotAreaName = SPOTAREA_SUBTYPES[mapSubType]; //#LANG#
        }
        this.mapSpotAreaConnections = mapSpotAreaConnections;
        this.mapSpotAreaBoundaries = mapSpotAreaBoundaries;
        // Parsed `[x, y]` polygon vertices for pure-JS hit-testing (replaces the
        // former native-canvas path used with isPointInPath).
        this.mapSpotAreaBoundaryPoints = parseBoundaryPoints(mapSpotAreaBoundaries);
        this.mapSpotAreaSubType = mapSubType;
        this.mapSpotAreaSequenceNumber = null;
        this.mapSpotAreaCleanSet = {};
    }

    /**
     * Whether the given point lies inside this spot area's boundary polygon.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    containsPoint(x, y) {
        return pointInPolygon(x, y, this.mapSpotAreaBoundaryPoints);
    }

    setSequenceNumber(index) {
        this.mapSpotAreaSequenceNumber = index;
    }

    setCleanSet(cleanSet) {
        const dictionary = require('./dictionary');
        const cleanSetArray = cleanSet.split(',');
        if (cleanSetArray.length === 3) {
            this.mapSpotAreaCleanSet = {
                'cleanCount': Number(cleanSetArray[0]),
                'cleanSpeed': dictionary.CLEAN_SPEED_FROM_ECOVACS[Number(cleanSetArray[1])],
                'waterLevel': Number(cleanSetArray[2])
            };
        }
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSpotAreaID: this.mapSpotAreaID,
            mapSpotAreaName: this.mapSpotAreaName,
            mapSpotAreaConnections: this.mapSpotAreaConnections,
            mapSpotAreaBoundaries: this.mapSpotAreaBoundaries,
            mapSpotAreaSubType: this.mapSpotAreaSubType,
            mapSpotAreaSequenceNumber: this.mapSpotAreaSequenceNumber,
            mapSpotAreaCleanSet: this.mapSpotAreaCleanSet
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
        if (mapVirtualBoundaryType === 'vw') {
            this.mapVirtualWalls.push(mapVirtualBoundary);
        } else if (mapVirtualBoundaryType === 'mw') {
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

function getMapObject(mapDataObject, mapID) {
    if (mapDataObject) {
        return mapDataObject.find((map) => {
            return map.mapID === mapID;
        });
    }
    return null;
}

function getCurrentMapObject(mapDataObject) {
    if (mapDataObject) {
        return mapDataObject.find((map) => {
            return map.mapIsCurrentMap === true;
        });
    }
    return null;
}

function getSpotAreaObject(mapDataObject, mapID, spotAreaID) {
    if (mapDataObject) {
        const mapSpotAreasObject = mapDataObject.find((map) => {
            return map.mapID === mapID;
        }).mapSpotAreas;
        if (mapSpotAreasObject) {
            return mapSpotAreasObject.find((spotArea) => {
                return spotArea.mapSpotAreaID === spotAreaID;
            });
        }
    }
    return null;
}

function getVirtualBoundaryObject(mapDataObject, mapID, virtualBoundaryID) {
    if (mapDataObject) {
        const mapVirtualBoundariesObject = mapDataObject.find((map) => {
            return map.mapID === mapID;
        }).mapVirtualBoundaries;
        if (mapVirtualBoundariesObject) {
            return mapVirtualBoundariesObject.find((virtualBoundary) => {
                return virtualBoundary.mapVirtualBoundaryID === virtualBoundaryID;
            });
        }
    }
    return null;
}

/**
 * Parses an Ecovacs boundary string (`"x,y;x,y;..."`) into `[x, y]` number pairs.
 * @param {string} coordinates
 * @returns {number[][]}
 */
function parseBoundaryPoints(coordinates) {
    if (!coordinates) {
        return [];
    }
    return coordinates.split(';').map((pair) => {
        const [x, y] = pair.split(',');
        return [Number(x), Number(y)];
    });
}

/**
 * Ray-casting point-in-polygon test (replaces canvas isPointInPath).
 * Source: https://github.com/substack/point-in-polygon (based on the
 * pnpoly algorithm by W. Randolph Franklin).
 * @param {number} x
 * @param {number} y
 * @param {number[][]} points - polygon vertices `[x, y]`
 * @returns {boolean}
 */
function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i][0];
        const yi = points[i][1];
        const xj = points[j][0];
        const yj = points[j][1];
        const intersects = ((yi > y) !== (yj > y)) &&
            (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersects) {
            inside = !inside;
        }
    }
    return inside;
}

module.exports.EcovacsMap = EcovacsMap;
module.exports.EcovacsMapSpotArea = EcovacsMapSpotArea;
module.exports.EcovacsMapSpotAreaInfo = EcovacsMapSpotAreaInfo;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapVirtualBoundaries = EcovacsMapVirtualBoundaries;
module.exports.EcovacsMapVirtualBoundary = EcovacsMapVirtualBoundary;
module.exports.EcovacsMapVirtualBoundaryInfo = EcovacsMapVirtualBoundaryInfo;
module.exports.getCurrentMapObject = getCurrentMapObject;
module.exports.getMapObject = getMapObject;
module.exports.getSpotAreaObject = getSpotAreaObject;
module.exports.getVirtualBoundaryObject = getVirtualBoundaryObject;
