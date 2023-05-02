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
export class EcovacsMapImage extends EcovacsMapImageBase {
    constructor(mapID: any, mapType: any, mapTotalWidth: any, mapTotalHeight: any, mapPixel: any, mapTotalCount: any);
    mapDataPieces: any[];
    updateMapPiece(pieceIndex: any, pieceStartX: any, pieceStartY: any, pieceWidth: any, pieceHeight: any, pieceCrc: any, pieceValue: any, checkPieceCrc?: boolean): Promise<void>;
    mapDataPiecesCrc: any;
}
export function mapPieceToIntArray(pieceValue: any): Promise<any>;
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
    getBase64PNG(deebotPosition: any, chargerPosition: any, currentMapMID: any, mapDataObject: any): Promise<{
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    }>;
    mapBase64PNG: string;
}
export {};
//# sourceMappingURL=mapTemplate.d.ts.map