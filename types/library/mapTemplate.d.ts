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
export class EcovacsMapImage extends EcovacsMapImageBase {
    constructor(mapID: any, mapType: any, mapTotalWidth: any, mapTotalHeight: any, mapPixel: any, mapTotalCount: any);
    mapDataPieces: any[];
    updateMapPiece(pieceIndex: any, pieceStartX: any, pieceStartY: any, pieceWidth: any, pieceHeight: any, pieceCrc: any, pieceValue: any, checkPieceCrc?: boolean): Promise<void>;
    mapDataPiecesCrc: any;
}
export class EcovacsLiveMapImage extends EcovacsMapImageBase {
    constructor(mapID: any, mapType: any, mapPieceWidth: any, mapPieceHeight: any, mapCellWidth: any, mapCellHeight: any, mapPixel: any, mapDataPiecesCrc: any);
    mapPieceWidth: any;
    mapPieceHeight: any;
    mapCellWidth: any;
    mapCellHeight: any;
    mapDataPiecesCrc: any;
    updateMapDataPiecesCrc(mapDataPiecesCrc: any): void;
    updateMapPiece(mapDataPieceIndex: any, mapDataPiece: any): Promise<void>;
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
    mapSpotAreaCanvas: import("canvas").Canvas;
    mapSpotAreaSubType: string;
    toJSON(): {
        mapID: any;
        mapSpotAreaID: any;
        mapSpotAreaName: any;
        mapSpotAreaConnections: any;
        mapSpotAreaBoundaries: any;
        mapSpotAreaSubType: string;
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
export function getMapObject(mapDataObject: any, mapID: any): any;
export function getCurrentMapObject(mapDataObject: any): any;
export function getSpotAreaObject(mapDataObject: any, mapID: any, spotAreaID: any): any;
export function getVirtualBoundaryObject(mapDataObject: any, mapID: any, virtualBoundaryID: any): any;
export function mapPieceToIntArray(pieceValue: any): Promise<any>;
export let mapDataObject: any;
declare class EcovacsMapImageBase {
    constructor(mapID: any, mapType: any, mapTotalWidth: any, mapTotalHeight: any, mapPixel: any);
    mapFloorCanvas: import("canvas").Canvas;
    mapFloorContext: import("canvas").CanvasRenderingContext2D;
    mapWallCanvas: import("canvas").Canvas;
    mapWallContext: import("canvas").CanvasRenderingContext2D;
    cropBoundaries: {
        minX: any;
        minY: any;
        maxX: any;
        maxY: any;
    };
    mapID: any;
    mapType: any;
    isLiveMap: boolean;
    mapTotalWidth: any;
    mapTotalHeight: any;
    mapPixel: any;
    transferMapInfo: boolean;
    initCanvas(): Promise<void>;
    drawMapPieceToCanvas(mapPieceCompressed: any, mapPieceStartX: any, mapPieceStartY: any, mapPieceWidth: any, mapPieceHeight: any): Promise<void>;
    getBase64PNG(deebotPosition: any, chargerPosition: any, currentMapMID: any): Promise<{
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    mapBase64PNG: string;
}
export {};
//# sourceMappingURL=mapTemplate.d.ts.map