'use strict';

const map = require('./mapInfo');
const tools = require('./tools.js');
const lzma = require('lzma');
const { FrameBuffer, parseHexColor } = require('./render/framebuffer');
const { encodePNGDataURL } = require('./render/png');
const shapes = require('./render/shapes');

const MAPINFOTYPE_FROM_ECOVACS = {
    "ol": "outline",
    "st": "wifiHeatMap",
    "ai": "ai",
    "wa": "workarea"
};

/**
 * A set of colors for spot areas
 * @type {string[]}
 * @todo Make colors customizable by introducing setMapStyle (JSON)
 */
const SPOTAREA_COLORS = [
    '#ffdcf6',
    '#fff8d2',
    '#e4fed9',
    '#dbf2fe',
    '#ffd7c9',
    '#fee3c4',
    '#e98b9d',
    '#ffa1a1',
    '#9fcfff'
];

/**
 * A set of colors for the element types
 * @type {Object}
 * @todo Make colors customizable
 */
const MAP_COLORS = {
    'vw': '#e40046', // virtual wall
    'mw': '#f7a501', // no mop zone
    'floor': '#badbff',
    'wall': '#5095e1',
    'carpet': '#b0cceb',
    'wifi_not_covered': '#d6d6d6',
    'wifi_1': '#7fbafb', // strong
    'wifi_2': '#a2cdfc',
    'wifi_3': '#bbdafd',
    'wifi_4': '#ddebfa',
    'wifi_5': '#f7fbff', // weak
};

const POSITION_OFFSET = 400; // the positions of the charger and the Deebot need an offset of 400 pixels

// Outline colour for spot-area polygons (matches the former canvas stroke).
const SPOTAREA_STROKE = '#64b5f6';

// Vector icon colours (replacing the former embedded base64 PNG icons).
const DEEBOT_ICON_FILL = '#00a2ff';   // robot body
const DEEBOT_ICON_STROKE = '#0061a8'; // robot outline
const CHARGER_ICON_FILL = '#43a047';  // charger dot
const CHARGER_ICON_STROKE = '#1b5e20';
const ICON_RADIUS = 8; // icons were drawn 16×16, i.e. ±8 px from centre

// Pre-parsed RGB triples for the palette, so the per-pixel raster loop never re-parses hex.
const MAP_RGB = Object.fromEntries(Object.entries(MAP_COLORS).map(([k, v]) => [k, parseHexColor(v)]));

/**
 * Resolves a decoded palette index to a colour and the layer it belongs to.
 * Walls and carpet sit on the wall layer (drawn on top); everything else
 * (floor, Wi-Fi heatmap) on the floor layer. Mirrors the original canvas
 * draw loop, including the unhandled 5–10 gap which produces no pixel.
 * @returns {{floor: boolean, rgb: number[]}|null} colour + layer, or null for "no pixel".
 */
function resolvePixel(pixelValue) {
    switch (true) {
        case pixelValue === 1: return { floor: true, rgb: MAP_RGB['floor'] };
        case pixelValue === 2: return { floor: false, rgb: MAP_RGB['wall'] };
        case pixelValue === 3: return { floor: false, rgb: MAP_RGB['carpet'] };
        case pixelValue === 4: return { floor: true, rgb: MAP_RGB['wifi_not_covered'] };
        case pixelValue > 10 && pixelValue <= 20: return { floor: true, rgb: MAP_RGB['wifi_1'] };
        case pixelValue > 20 && pixelValue <= 30: return { floor: true, rgb: MAP_RGB['wifi_2'] };
        case pixelValue > 30 && pixelValue <= 40: return { floor: true, rgb: MAP_RGB['wifi_3'] };
        case pixelValue > 40 && pixelValue <= 50: return { floor: true, rgb: MAP_RGB['wifi_4'] };
        case pixelValue > 50: return { floor: true, rgb: MAP_RGB['wifi_5'] };
        default: return null;
    }
}

class EcovacsMapImageBase {
    constructor(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel) {
        // Pure-JS RGBA layers replacing the former native canvas contexts.
        // Walls/carpet live on their own layer so they composite on top of the floor.
        this.mapFloorBuffer = null;
        this.mapWallBuffer = null;
        this.cropBoundaries = {
            minX: null,
            minY: null,
            maxX: null,
            maxY: null
        };
        this.mapID = mapID;
        this.mapType = MAPINFOTYPE_FROM_ECOVACS[mapType];
        this.isLiveMap = false;
        this.mapTotalWidth = mapTotalWidth;
        this.mapTotalHeight = mapTotalHeight;
        this.mapPixel = mapPixel;
        this.transferMapInfo = null;

        (async () => {
            try {
                await this.initCanvas();
            } catch (e) {
                tools.envLogInfo(`[EcovacsMapImageBase] initCanvas failed: ${e.message}`);
            }
        })();
    }

    // Kept for API compatibility (mapManager calls it before pieces arrive).
    // Pure-JS rendering needs no native module, so this just allocates the layers.
    async initCanvas() {
        this.mapFloorBuffer = new FrameBuffer(this.mapTotalWidth, this.mapTotalHeight);
        this.mapWallBuffer = new FrameBuffer(this.mapTotalWidth, this.mapTotalHeight);
    }

    // Updates the running crop rectangle so it encloses every drawn pixel.
    updateCropBoundaries(x, y) {
        const cb = this.cropBoundaries;
        cb.minX = cb.minX === null ? x : Math.min(cb.minX, x);
        cb.minY = cb.minY === null ? y : Math.min(cb.minY, y);
        cb.maxX = cb.maxX === null ? x : Math.max(cb.maxX, x);
        cb.maxY = cb.maxY === null ? y : Math.max(cb.maxY, y);
    }

    async drawMapPieceToCanvas(mapPieceCompressed, mapPieceStartX, mapPieceStartY, mapPieceWidth, mapPieceHeight) {
        const mapPieceDecompressed = await mapPieceToIntArray(mapPieceCompressed);
        if (!mapPieceDecompressed) { // Decompression unavailable (e.g. zstd on older Node) – skip this piece
            return;
        }
        if (!this.mapFloorBuffer) {
            await this.initCanvas();
        }

        for (let row = 0; row < mapPieceWidth; row++) {
            for (let column = 0; column < mapPieceHeight; column++) {
                const bufferRow = row + mapPieceStartX;
                const bufferColumn = column + mapPieceStartY;
                const pixelValue = mapPieceDecompressed[mapPieceWidth * row + column];

                if (pixelValue === 0) { // No data
                    this.mapFloorBuffer.clearPixel(bufferRow, bufferColumn);
                    this.mapWallBuffer.clearPixel(bufferRow, bufferColumn);
                    continue;
                }

                // Any in-use pixel (even an unhandled palette index) extends the crop.
                this.updateCropBoundaries(bufferRow, bufferColumn);

                const pixel = resolvePixel(pixelValue);
                if (!pixel) {
                    continue;
                }
                // The two layers are mutually exclusive per pixel: paint one, clear the other.
                const [target, other] = pixel.floor
                    ? [this.mapFloorBuffer, this.mapWallBuffer]
                    : [this.mapWallBuffer, this.mapFloorBuffer];
                target.setPixel(bufferRow, bufferColumn, pixel.rgb[0], pixel.rgb[1], pixel.rgb[2], 255);
                other.clearPixel(bufferRow, bufferColumn);
            }
        }
    }

    // Builds the spot-area / virtual-boundary overlay (top-down, pre-flip) for
    // the given map data, or null when there is nothing to draw. Coordinates are
    // device units scaled by `/50 + POSITION_OFFSET`. Virtual boundaries also
    // extend the crop rectangle, matching the former canvas behaviour.
    renderOverlay(mapDataObject) {
        const mapObject = this.mapID === undefined
            ? map.getCurrentMapObject(mapDataObject)
            : map.getMapObject(mapDataObject, this.mapID);
        if (!mapObject) {
            return null;
        }

        const overlay = new FrameBuffer(this.mapTotalWidth, this.mapTotalHeight);

        // Spot areas: filled polygon + outline.
        const spotAreas = mapObject['mapSpotAreas'] || [];
        for (const areaIndex in spotAreas) {
            if (!spotAreas.hasOwnProperty(areaIndex)) {
                continue;
            }
            const area = spotAreas[areaIndex];
            const points = area['mapSpotAreaBoundaries'].split(';').map((pair) => {
                const [x, y] = pair.split(',');
                return [Number(x) / 50 + POSITION_OFFSET, Number(y) / 50 + POSITION_OFFSET];
            });
            const fill = parseHexColor(SPOTAREA_COLORS[area['mapSpotAreaID'] % SPOTAREA_COLORS.length]);
            shapes.fillPolygon(overlay, points, fill, 255);
            shapes.strokePolyline(overlay, points, parseHexColor(SPOTAREA_STROKE), { closed: true });
        }

        // Virtual boundaries: dashed 2px outline (red virtual wall / orange no-mop zone).
        const boundaries = mapObject['mapVirtualBoundaries'] || [];
        for (const boundaryIndex in boundaries) {
            if (!boundaries.hasOwnProperty(boundaryIndex)) {
                continue;
            }
            const boundary = boundaries[boundaryIndex];
            const raw = boundary['mapVirtualBoundaryCoordinates'];
            const flat = raw.substring(1, raw.length - 1).split(',');
            const points = [];
            for (let i = 0; i + 1 < flat.length; i += 2) {
                const x = Number(flat[i]) / 50 + POSITION_OFFSET;
                const y = Number(flat[i + 1]) / 50 + POSITION_OFFSET;
                points.push([x, y]);
                this.updateCropBoundaries(x, y);
            }
            const color = MAP_RGB[boundary['mapVirtualBoundaryType']] || MAP_RGB['vw'];
            shapes.strokePolyline(overlay, points, color, { closed: true, width: 2, dash: [2, 2] });
        }

        return overlay;
    }

    // Converts a device map position to display-space pixel coordinates. The x
    // axis maps directly; the y axis is flipped to match the vertically-flipped
    // composite (so icons land where they do in the final image).
    positionToPixel(position) {
        return {
            x: position['x'] / this.mapPixel + POSITION_OFFSET,
            y: this.mapTotalHeight - (position['y'] / this.mapPixel + POSITION_OFFSET)
        };
    }

    // Draws the deebot (heading triangle) and charger (dot) icons onto the final
    // composited buffer, in display space. Only for the current map – getPos only
    // returns the current map's positions (former canvas behaviour). Invalid
    // deebot positions are skipped entirely (deebot-client reference).
    drawIcons(finalBuffer, deebotPosition, chargerPosition, currentMapMID) {
        if (this.mapID !== currentMapMID) {
            return;
        }

        if (deebotPosition && !deebotPosition['isInvalid']) {
            const c = this.positionToPixel(deebotPosition);
            // Display raster is y-down; ecovacs angle: 0 = right, 90 = up.
            const angle = (deebotPosition['a'] || 0) * Math.PI / 180;
            const dirX = Math.cos(angle);
            const dirY = -Math.sin(angle);
            const baseX = c.x - dirX * ICON_RADIUS * 0.6;
            const baseY = c.y - dirY * ICON_RADIUS * 0.6;
            const half = ICON_RADIUS * 0.7;
            const triangle = [
                [c.x + dirX * ICON_RADIUS, c.y + dirY * ICON_RADIUS], // tip in heading direction
                [baseX - dirY * half, baseY + dirX * half],           // base corners (± perpendicular)
                [baseX + dirY * half, baseY - dirX * half]
            ];
            shapes.fillPolygon(finalBuffer, triangle, parseHexColor(DEEBOT_ICON_FILL), 255);
            shapes.strokePolyline(finalBuffer, triangle, parseHexColor(DEEBOT_ICON_STROKE), { closed: true });
        }

        if (chargerPosition) {
            const c = this.positionToPixel(chargerPosition);
            const r = ICON_RADIUS * 0.7;
            shapes.fillCircle(finalBuffer, c.x, c.y, r + 1, parseHexColor(CHARGER_ICON_STROKE), 255);
            shapes.fillCircle(finalBuffer, c.x, c.y, r, parseHexColor(CHARGER_ICON_FILL), 255);
        }
    }

    async getBase64PNG(deebotPosition, chargerPosition, currentMapMID, mapDataObject) {
        if (!this.transferMapInfo) {
            // Data should not be transferred: not all pieces retrieved, or a
            // sub-data piece arrived with no changes.
            return null;
        }
        if (!this.mapFloorBuffer || this.cropBoundaries.minX === null) {
            // Nothing has been rasterised yet, so there is no image to emit.
            return null;
        }

        const width = this.mapTotalWidth;
        const height = this.mapTotalHeight;
        const finalBuffer = new FrameBuffer(width, height);

        // Floor first, walls/carpet on top. The layers are stored top-down; the
        // device map is vertically flipped for display (former canvas scale(1,-1)).
        finalBuffer.composite(this.mapFloorBuffer, true);

        // Spot-area fills + dashed virtual-boundary strokes sit between floor and
        // walls. Drawn top-down into an overlay, then composited with the same flip.
        if (mapDataObject !== null) {
            const overlay = this.renderOverlay(mapDataObject);
            if (overlay) {
                finalBuffer.composite(overlay, true);
            }
        }

        finalBuffer.composite(this.mapWallBuffer, true);

        // Deebot + charger icons, drawn last so they sit on top of everything.
        this.drawIcons(finalBuffer, deebotPosition, chargerPosition, currentMapMID);

        // Crop to the drawn region. Boundary coordinates can be fractional, so
        // floor the origin / ceil the extent to an integer rectangle that still
        // encloses everything. The flip moved rows, so maxY maps to the top.
        const minX = Math.floor(this.cropBoundaries.minX);
        const minY = Math.floor(this.cropBoundaries.minY);
        const maxX = Math.ceil(this.cropBoundaries.maxX);
        const maxY = Math.ceil(this.cropBoundaries.maxY);
        const cropped = finalBuffer.crop(minX, height - maxY, maxX - minX, maxY - minY);

        this.mapBase64PNG = encodePNGDataURL(cropped);
        this.transferMapInfo = false;
        return {
            'mapID': this.mapID,
            'mapType': this.isLiveMap ? 'live' : this.mapType,
            'mapBase64PNG': this.mapBase64PNG
        };
    }
}

class EcovacsLiveMapImage extends EcovacsMapImageBase {
    constructor(mapID, mapType, mapPieceWidth, mapPieceHeight, mapCellWidth, mapCellHeight, mapPixel, mapDataPiecesCrc) {
        super(mapID, mapType, mapPieceWidth * mapCellWidth, mapPieceHeight * mapCellHeight, mapPixel);
        this.isLiveMap = true;
        this.mapPieceWidth = mapPieceWidth;
        this.mapPieceHeight = mapPieceHeight;
        this.mapCellWidth = mapCellWidth;
        this.mapCellHeight = mapCellHeight;
        this.mapDataPiecesCrc = mapDataPiecesCrc;
    }

    updateMapDataPiecesCrc(mapDataPiecesCrc) {
        // Is only transferred in onMajorMap
        // TODO: comparison for change has to be done before onMinorMap-Events
        this.mapDataPiecesCrc = mapDataPiecesCrc;
    }

    async updateMapPiece(mapDataPieceIndex, mapDataPiece) {
        this.transferMapInfo = true; //TODO: check for CRC change, interval and maybe only once per onMajorMap-Event or onMapTrace
        const mapPieceStartX = Math.floor(mapDataPieceIndex / this.mapCellWidth) * this.mapPieceWidth;
        const mapPieceStartY = (mapDataPieceIndex % this.mapCellHeight) * this.mapPieceHeight;
        await this.drawMapPieceToCanvas(mapDataPiece, mapPieceStartX, mapPieceStartY, this.mapPieceWidth, this.mapPieceHeight);
    }
}

class EcovacsMapImage extends EcovacsMapImageBase {
    constructor(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel, mapTotalCount) {
        super(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel);
        this.isLiveMap = false;
        // mapinfo returns the total compressed string in several pieces, stores the string pieces for concatenation
        this.mapDataPieces = new Array(mapTotalCount).fill(false);
        // mapinfo returns the total compressed string in several pieces, stores the CRC value of the concatenated string for comparison
        (async () => {
            try {
                await this.initCanvas();
            } catch (e) {
                tools.envLogInfo(`[EcovacsMapImage] initCanvas failed: ${e.message}`);
            }
        })();
    }

    async updateMapPiece(pieceIndex, pieceStartX, pieceStartY, pieceWidth, pieceHeight, pieceCrc, pieceValue, checkPieceCrc = true) {
        // TODO: currently only validated with one piece (StartX=0 and StartY=0)
        if (checkPieceCrc && (this.mapDataPiecesCrc !== pieceCrc)) { // CRC has changed, so invalidate all pieces and return
            this.mapDataPiecesCrc = pieceCrc;
            this.mapDataPieces.fill(false);
            this.mapDataPieces[pieceIndex] = pieceValue;
            return; // Nothing to process as not all pieces are received yet
        } else {
            if (!this.mapDataPieces.every(Boolean)) { // Not all pieces have been received
                this.mapDataPieces[pieceIndex] = pieceValue;
                if (!this.mapDataPieces.every(Boolean)) { // If still not all pieces have been received return
                    return; // Nothing to process as not all pieces are received yet
                } else { // Last piece received
                    this.transferMapInfo = true;
                }
            } else { // All pieces have been received already, so only transfer once per new onMapInfo series
                if (pieceIndex === 0) {
                    this.transferMapInfo = true;
                }
            }
        }
        await this.drawMapPieceToCanvas(this.mapDataPieces.join(''), pieceStartX, pieceStartY, pieceWidth, pieceHeight);
    }
}

// zstd frame magic bytes. Newer models compress map pieces with zstd instead of LZMA.
const ZSTD_MAGIC = [0x28, 0xB5, 0x2F, 0xFD];

// Decompresses a zstd buffer using Node's built-in zlib (available since Node 22.15).
// Returns the decompressed bytes, or null if the runtime lacks zstd support.
function zstdDecompress(buffer) {
    const zlib = require('zlib');
    if (typeof zlib.zstdDecompressSync !== 'function') {
        tools.envLogError('Received zstd-compressed map data, but this Node.js version lacks zstd support (requires Node >= 22.15). Map generation will be incomplete.');
        return null;
    }
    return zlib.zstdDecompressSync(buffer);
}

// Normalises a decompressed map piece into a Uint8Array of palette indices.
// The `lzma` library is inconsistent: it returns a plain number array for small
// payloads but a String (one char per byte) for large ones – a real 100×100
// piece (10000 bytes) comes back as a String, whose chars fail the numeric
// `pixelValue < 4` comparisons in the draw loop. zstd already yields a Buffer.
// Returning bytes uniformly keeps the draw loop working regardless of source.
function toPixelBytes(decompressed) {
    if (decompressed === null || decompressed === undefined) {
        return null;
    }
    if (typeof decompressed === 'string') {
        return Uint8Array.from(decompressed, (ch) => ch.charCodeAt(0));
    }
    return Uint8Array.from(decompressed);
}

// Decompresses a base64 map payload to its raw form, dispatching on the wire
// format. Returns whatever the decoder yields (kept un-normalised so both the
// pixel and text consumers can interpret it correctly):
//   - zstd  -> Buffer of bytes
//   - LZMA  -> String (large payloads, already text-decoded) or number[] (small)
//   - null when decompression is unavailable (e.g. zstd on older Node)
// thanks to https://gitlab.com/michael.becker/vacuumclean/-/blob/master/deebot/deebot-core/README.md#map-details
async function decompressMapPiece(pieceValue) {
    const buff = Buffer.from(pieceValue, 'base64');
    // Newer models send zstd-compressed pieces (detected via magic bytes); older ones use LZMA.
    if ((buff.length >= 4) && ZSTD_MAGIC.every((byte, i) => buff[i] === byte)) {
        return zstdDecompress(buff);
    }
    const fixArray = new Int8Array([0, 0, 0, 0]);
    const int8Array = new Int8Array(buff.buffer, buff.byteOffset, buff.length);
    //fix 9 byte header to 13 bytes for lzma decompression
    const correctedArray = [...int8Array.slice(0, 9), ...fixArray, ...int8Array.slice(9)];
    //decompress
    return lzma.decompress(correctedArray);
}

// converts the compressed data retrieved from ecovacs API into int array containing the map pixels
async function mapPieceToIntArray(pieceValue) {
    return toPixelBytes(await decompressMapPiece(pieceValue));
}

// Decompresses a base64 payload to a string. Used for the *text* payloads
// (compressed spot-area/boundary coordinate strings, V2 subset JSON) – not pixel
// data. Callers that need text (`.split(';')`, `JSON.parse`) must use this rather
// than `mapPieceToIntArray`, which normalises to bytes. Returns null when
// decompression is unavailable (e.g. zstd on older Node).
async function decompressToString(pieceValue) {
    const raw = await decompressMapPiece(pieceValue);
    if (raw === null || raw === undefined) {
        return null;
    }
    // LZMA returns text already decoded as a String; zstd (Buffer) and the
    // small-payload number[] form are raw bytes that decode as UTF-8.
    return typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8');
}

module.exports.EcovacsLiveMapImage = EcovacsLiveMapImage;
module.exports.EcovacsMapImage = EcovacsMapImage;
module.exports.mapPieceToIntArray = mapPieceToIntArray;
module.exports.decompressToString = decompressToString;
