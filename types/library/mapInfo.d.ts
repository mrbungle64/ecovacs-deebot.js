export class EcovacsMap {
    constructor(mapID: any, mapIndex: any, mapName: any, mapStatus: any, mapIsCurrentMap?: number, mapIsBuilt?: number);
    mapID: any;
    mapIndex: any;
    mapName: any;
    mapStatus: any;
    mapIsCurrentMap: boolean;
    mapIsBuilt: boolean;
    toJSON(): {
        mapID: any;
        mapIndex: any;
        mapName: any;
        mapStatus: any;
        mapIsCurrentMap: boolean;
        mapIsBuilt: boolean;
    };
}
export class EcovacsMapSpotArea {
    constructor(mapSpotAreaID: any);
    mapSpotAreaID: any;
    toJSON(): {
        mapSpotAreaID: any;
    };
}
export class EcovacsMapSpotAreaInfo {
    constructor(mapID: any, mapSpotAreaID: any, mapSpotAreaConnections: any, mapSpotAreaBoundaries: any, mapSubType?: string, customName?: string);
    mapID: any;
    mapSpotAreaID: any;
    mapSpotAreaName: any;
    mapSpotAreaConnections: any;
    mapSpotAreaBoundaries: any;
    mapSpotAreaBoundaryPoints: number[][];
    mapSpotAreaSubType: string;
    mapSpotAreaSequenceNumber: any;
    mapSpotAreaCleanSet: {};
    /**
     * Whether the given point lies inside this spot area's boundary polygon.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    containsPoint(x: number, y: number): boolean;
    setSequenceNumber(index: any): void;
    setCleanSet(cleanSet: any): void;
    toJSON(): {
        mapID: any;
        mapSpotAreaID: any;
        mapSpotAreaName: any;
        mapSpotAreaConnections: any;
        mapSpotAreaBoundaries: any;
        mapSpotAreaSubType: string;
        mapSpotAreaSequenceNumber: any;
        mapSpotAreaCleanSet: {};
    };
}
export class EcovacsMapSpotAreas {
    constructor(mapID: any, mapSetID: any);
    mapID: any;
    mapSetID: any;
    mapSpotAreas: any[];
    push(mapSpotArea: any): void;
    toJSON(): {
        mapID: any;
        mapSetID: any;
        mapSpotAreas: any[];
    };
}
export class EcovacsMapVirtualBoundaries {
    constructor(mapID: any);
    mapID: any;
    mapVirtualWalls: any[];
    mapNoMopZones: any[];
    push(mapVirtualBoundary: any, mapVirtualBoundaryType?: string): void;
    toJSON(): {
        mapID: any;
        mapVirtualWalls: any[];
        mapNoMopZones: any[];
    };
}
export class EcovacsMapVirtualBoundary {
    constructor(mapVirtualBoundaryID: any, mapVirtualBoundaryType: any);
    mapVirtualBoundaryID: any;
    mapVirtualBoundaryType: any;
    toJSON(): {
        mapVirtualBoundaryID: any;
        mapVirtualBoundaryType: any;
    };
}
export class EcovacsMapVirtualBoundaryInfo {
    constructor(mapID: any, mapVirtualBoundaryID: any, mapVirtualBoundaryType: any, mapVirtualBoundaryCoordinates: any);
    mapID: any;
    mapVirtualBoundaryID: any;
    mapVirtualBoundaryType: any;
    mapVirtualBoundaryCoordinates: any;
    toJSON(): {
        mapID: any;
        mapVirtualBoundaryID: any;
        mapVirtualBoundaryType: any;
        mapVirtualBoundaryCoordinates: any;
    };
}
export function getCurrentMapObject(mapDataObject: any): any;
export function getMapObject(mapDataObject: any, mapID: any): any;
export function getSpotAreaObject(mapDataObject: any, mapID: any, spotAreaID: any): any;
export function getVirtualBoundaryObject(mapDataObject: any, mapID: any, virtualBoundaryID: any): any;
//# sourceMappingURL=mapInfo.d.ts.map