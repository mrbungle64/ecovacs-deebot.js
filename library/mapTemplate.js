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
    '11': {"en": "Sunroom", "de": "Wintergarten"}
};

class EcovacsMap {
    constructor(mapID, mapIndex, mapName, mapStatus, mapIsCurrentMap=1, mapIsBuilt=1 ) {
      this.mapID= mapID;
      this.mapIndex = mapIndex;
      this.mapName = mapName;
      this.mapStatus = mapStatus;
      this.mapIsCurrentMap = mapIsCurrentMap;
      this.mapIsBuilt = mapIsBuilt;
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
      this.mapID= mapID;
      this.mapSetID= mapSetID;
      this.mapSpotAreas = [];
    }

    push(mapSpotAreas) {
        this.mapSpotAreas.push(mapSpotAreas);
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
      this.mapSpotAreaID= mapSpotAreaID;
    }

    toJSON() {
        return {
            mapSpotAreaID: this.mapSpotAreaID
        };
    }
}

class EcovacsMapSpotAreaInfo {
    constructor(mapID, mapSpotAreaID, mapSubType="0") {
      this.mapID= mapID;
      this.mapSpotAreaID= mapSpotAreaID;
      if(mapSubType == "0") {
        this.mapSpotAreaName = String.fromCharCode(65 + parseInt(mapSpotAreaID));
      } else {
        this.mapSpotAreaName = SPOTAREA_SUBTYPES[mapSubType]["en"]; //#LANG#
      }
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSpotAreaID: this.mapSpotAreaID,
            mapSpotAreaName: this.mapSpotAreaName
        };
    }
}


class EcovacsMapVirtualWalls {
    constructor(mapID, mapVirtualWalls) {
      this.mapID= mapID;
      this.mapVirtualWalls = mapVirtualWalls;
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
      this.mapVirtualWallID= mapVirtualWallID;
    }

    toJSON() {
        return {
            mapVirtualWallID: this.mapVirtualWallID
        };
    }
}


class EcovacsMapVirtualWallInfo {
    constructor(mapID, mapVirtualWallID, mapVirtualWallDimensions) {
      this.mapID= mapID;
      this.mapVirtualWallID= mapVirtualWallID;
      this.mapVirtualWallDimensions= mapVirtualWallDimensions;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualWallID: this.mapVirtualWallID,
            mapVirtualWallDimensions: this.mapVirtualWallDimensions
        };
    }
}


class EcovacsMapNoMoppingZones {
    constructor(mapID, mapNoMopZones) {
      this.mapID= mapID;
      this.mapNoMopZones = mapNoMopZones;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapNoMopZones: this.mapNoMopZones
        };
    }
}
class EcovacsMapNoMoppingZone {
    constructor(mapNoMopZoneID) {
      this.mapNoMopZoneID= mapNoMopZoneID;
    }

    toJSON() {
        return {
            mapNoMopZoneID: this.mapNoMopZoneID
        };
    }
}


class EcovacsMapNoMoppingZoneInfo {
    constructor(mapID, mapNoMopZoneID, mapNoMopZoneIDDimensions) {
      this.mapID= mapID;
      this.mapNoMopZoneID= mapNoMopZoneID;
      this.mapNoMopZoneIDDimensions= mapNoMopZoneIDDimensions;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapNoMopZoneID: this.mapNoMopZoneID,
            mapNoMopZoneIDDimensions: this.mapNoMopZoneIDDimensions
        };
    }
}


module.exports.EcovacsMap = EcovacsMap;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapSpotArea = EcovacsMapSpotArea;
module.exports.EcovacsMapSpotAreaInfo = EcovacsMapSpotAreaInfo;
module.exports.EcovacsMapVirtualWalls = EcovacsMapVirtualWalls;
module.exports.EcovacsMapVirtualWall = EcovacsMapVirtualWall;
module.exports.EcovacsMapVirtualWallInfo = EcovacsMapVirtualWallInfo;
module.exports.EcovacsMapNoMoppingZones = EcovacsMapNoMoppingZones;
module.exports.EcovacsMapNoMoppingZone = EcovacsMapNoMoppingZone;
module.exports.EcovacsMapNoMoppingZoneInfo = EcovacsMapNoMoppingZoneInfo;