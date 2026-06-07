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
export function mapPieceToIntArray(pieceValue: any): Promise<Uint8Array<ArrayBuffer> | null>;
export function decompressToString(pieceValue: any): Promise<string | null>;
declare class EcovacsMapImageBase {
    constructor(mapID: any, mapType: any, mapTotalWidth: any, mapTotalHeight: any, mapPixel: any);
    mapFloorBuffer: FrameBuffer | null;
    mapWallBuffer: FrameBuffer | null;
    cropBoundaries: {
        minX: null;
        minY: null;
        maxX: null;
        maxY: null;
    };
    mapID: any;
    mapType: any;
    isLiveMap: boolean;
    mapTotalWidth: any;
    mapTotalHeight: any;
    mapPixel: any;
    transferMapInfo: boolean | null;
    initCanvas(): Promise<void>;
    updateCropBoundaries(x: any, y: any): void;
    drawMapPieceToCanvas(mapPieceCompressed: any, mapPieceStartX: any, mapPieceStartY: any, mapPieceWidth: any, mapPieceHeight: any): Promise<void>;
    renderOverlay(mapDataObject: any): FrameBuffer | null;
    positionToPixel(position: any): {
        x: number;
        y: number;
    };
    drawIcons(finalBuffer: any, deebotPosition: any, chargerPosition: any, currentMapMID: any): void;
    getBase64PNG(deebotPosition: any, chargerPosition: any, currentMapMID: any, mapDataObject: any): Promise<{
        mapID: any;
        mapType: any;
        mapBase64PNG: string;
    } | null>;
    mapBase64PNG: string | undefined;
}
import { FrameBuffer } from "./render/framebuffer";
export {};
//# sourceMappingURL=mapTemplate.d.ts.map