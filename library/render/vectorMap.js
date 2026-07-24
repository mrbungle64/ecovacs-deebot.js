'use strict';

/**
 * Renders the *vector* floor plan delivered by `getMapInfo_V2` into a PNG data
 * URL, using the same pure-JS primitives as the piece-based map renderer
 * (no native `canvas` dependency).
 *
 * Newer devices (e.g. DEEBOT T80/T80S/X8 OMNI) do not stream a raster map via
 * the GetMajorMap/GetMinorMap piece flow. Instead `getMapInfo_V2` returns an
 * `info` payload (base64 + Zstandard) that decodes to a JSON array of layers:
 *
 *   [ [layerType, "roomId;x,y[,flag];x,y;..."], ... ]
 *
 * Layer types observed: "1" = walls, "2" = room outline (roomId = mssid),
 * "6" = reachable area. Coordinates are in map/world units.
 *
 * @module render/vectorMap
 */

const { FrameBuffer } = require('./framebuffer');
const shapes = require('./shapes');
const { encodePNGDataURL } = require('./png');

// Distinct fill colours cycled per room (RGB triples).
const ROOM_COLORS = [
    [76, 175, 80], [41, 182, 246], [255, 179, 0], [239, 83, 80],
    [126, 87, 194], [38, 166, 154], [236, 64, 122], [141, 110, 99],
    [66, 165, 245], [156, 204, 101], [255, 112, 67], [92, 107, 192]
];
const WALL_COLOR = [230, 230, 230];
const BG_COLOR = [11, 11, 11];
const ROBOT_COLOR = [33, 150, 243];
const CHARGER_COLOR = [76, 175, 80];

/**
 * Parses a layer coordinate string `"roomId;x,y[,flag];..."`.
 * @param {string} str
 * @returns {{id: string, points: number[][]}}
 */
function parseLayer(str) {
    const parts = String(str).split(';');
    const id = parts.shift();
    const points = [];
    for (const part of parts) {
        if (!part) {
            continue;
        }
        const xy = part.split(',');
        const x = parseFloat(xy[0]);
        const y = parseFloat(xy[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
            points.push([x, y]);
        }
    }
    return { id, points };
}

/**
 * Normalises the `highlight` option to a Set of room-id strings.
 * @param {string|number|Array<string|number>} highlight
 * @returns {Set<string>}
 */
function toHighlightSet(highlight) {
    if (highlight === undefined || highlight === null || highlight === '') {
        return new Set();
    }
    const list = Array.isArray(highlight) ? highlight : String(highlight).split(',');
    return new Set(list.map((v) => String(v).trim()).filter((v) => v.length));
}

/**
 * Splits the decoded vector into rooms (type 2) and walls (type 1).
 * @param {Array} vector
 * @returns {{rooms: Array, walls: Array}}
 */
function classifyLayers(vector) {
    const rooms = [];
    const walls = [];
    if (!Array.isArray(vector)) {
        return { rooms, walls };
    }
    for (const layer of vector) {
        if (!Array.isArray(layer) || layer.length < 2) {
            continue;
        }
        const type = String(layer[0]);
        const parsed = parseLayer(layer[1]);
        if (type === '2') {
            rooms.push(parsed);
        } else if (type === '1') {
            walls.push(parsed);
        }
    }
    return { rooms, walls };
}

/**
 * Renders the decoded `getMapInfo_V2` vector to a PNG data URL.
 *
 * @param {Array} vector - decoded `info` array `[[type, "id;x,y;..."], ...]`
 * @param {Object} [opts]
 * @param {number} [opts.width=1000] - output width in pixels (height derived)
 * @param {number} [opts.padding=20] - border padding in pixels
 * @param {{x:number,y:number}} [opts.deebotPosition] - robot marker (world units)
 * @param {{x:number,y:number}} [opts.chargePosition] - charger marker (world units)
 * @param {string|number|Array} [opts.highlight] - room id(s) to emphasise
 * @returns {string|null} PNG data URL, or null when nothing renderable
 */
function renderVectorMapPNG(vector, opts = {}) {
    const width = opts.width || 1000;
    const padding = opts.padding !== undefined ? opts.padding : 20;
    const highlight = toHighlightSet(opts.highlight);

    const { rooms, walls } = classifyLayers(vector);
    if (!rooms.length && !walls.length) {
        return null;
    }

    // Bounding box over every point.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const group of [rooms, walls]) {
        for (const layer of group) {
            for (const [x, y] of layer.points) {
                if (x < minX) { minX = x; }
                if (x > maxX) { maxX = x; }
                if (y < minY) { minY = y; }
                if (y > maxY) { maxY = y; }
            }
        }
    }
    if (!Number.isFinite(minX)) {
        return null;
    }

    const worldW = (maxX - minX) || 1;
    const worldH = (maxY - minY) || 1;
    const scale = (width - padding * 2) / worldW;
    const height = Math.round(worldH * scale + padding * 2);

    // World -> pixel (Y is flipped so the map is not upside down).
    const tx = (x) => padding + (x - minX) * scale;
    const ty = (y) => padding + (maxY - y) * scale;

    const fb = new FrameBuffer(width, height);
    fb.fillRect(0, 0, width, height, BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], 255);

    rooms.forEach((room, index) => {
        if (room.points.length < 3) {
            return;
        }
        const color = ROOM_COLORS[index % ROOM_COLORS.length];
        const pts = room.points.map(([x, y]) => [tx(x), ty(y)]);
        const emphasised = highlight.has(String(room.id));
        shapes.fillPolygon(fb, pts, color, emphasised ? 216 : 120);
        shapes.strokePolyline(fb, pts, color, { closed: true, width: 2 });
    });

    walls.forEach((wall) => {
        if (wall.points.length < 2) {
            return;
        }
        const pts = wall.points.map(([x, y]) => [tx(x), ty(y)]);
        shapes.strokePolyline(fb, pts, WALL_COLOR, { width: 2 });
    });

    const marker = (pos, color, radius) => {
        if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
            shapes.fillCircle(fb, tx(pos.x), ty(pos.y), radius, color, 255);
        }
    };
    marker(opts.chargePosition, CHARGER_COLOR, 8);
    marker(opts.deebotPosition, ROBOT_COLOR, 9);

    return encodePNGDataURL(fb);
}

module.exports.renderVectorMapPNG = renderVectorMapPNG;
module.exports.parseLayer = parseLayer;
module.exports.classifyLayers = classifyLayers;
