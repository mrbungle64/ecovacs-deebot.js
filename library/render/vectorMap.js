'use strict';

/**
 * Renders the vector floor plan delivered by `getMapInfo_V2` into a PNG
 * data URL using the existing pure-JS rendering primitives.
 *
 * Decoded format:
 *   [[layerType, "roomId;x,y[,flag];...", "roomId;x,y;...", ...], ...]
 *
 * Layer types:
 *   "1": wall geometry
 *   "2": room outlines
 *   "6": detailed per-room geometry (meaning unverified)
 *
 * Coordinates are in map/world units.
 *
 * @module render/vectorMap
 */

const { FrameBuffer } = require('./framebuffer');
const shapes = require('./shapes');
const { encodePNGDataURL } = require('./png');

const ROOM_COLORS = [
    [155, 188, 230], // pastel blue
    [242, 210, 143], // pastel yellow
    [131, 210, 215], // pastel turquoise
    [241, 190, 199], // pastel pink
    [190, 175, 220],
    [170, 210, 175],
    [235, 190, 150],
    [180, 200, 220]
];

// const ROOM_COLORS = [
//     [76, 175, 80], [41, 182, 246], [255, 179, 0], [239, 83, 80],
//     [126, 87, 194], [38, 166, 154], [236, 64, 122], [141, 110, 99],
//     [66, 165, 245], [156, 204, 101], [255, 112, 67], [92, 107, 192]
// ];

const WALL_COLOR = [230, 230, 230];
// Diagnostic colours; flag meanings are not yet confirmed.
const TRACE_FLAG_COLORS = new Map([
    [0x08, [210, 30, 40]],   // 8: red
    [0x10, [20, 70, 210]],   // 16: blue
    [0x18, [150, 30, 180]],  // 24: purple
    [0x40, [0, 110, 50]],    // 64: green
    [0x48, [230, 110, 0]],   // 72: orange
    [0xC8, [30, 30, 30]]    // 200: almost black
]);
const BG_COLOR = [11, 11, 11];
const ROBOT_COLOR = [33, 150, 243];
const CHARGER_COLOR = [76, 175, 80];

// function getTraceFlagColor(flag) {
//     return TRACE_FLAG_COLORS.get(flag)
//         ?? [flag, 255 - flag, 180];
// }
function getTraceFlagColor(flag) {
    let color = TRACE_FLAG_COLORS.get(flag);
    if (color) {
        return color;
    }
    else{
        console.log(`Unknown trace flag: ${flag}`);
        return [255, 0, 255];
    }
    // return TRACE_FLAG_COLORS.get(flag) ?? [255, 0, 255];
}

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
 * Normalises the highlight option to a Set of room-id strings.
 * @param {string|number|Array<string|number>} highlight
 * @returns {Set<string>}
 */
function toHighlightSet(highlight) {
    if (highlight === undefined || highlight === null || highlight === '') {
        return new Set();
    }

    const list = Array.isArray(highlight)
        ? highlight
        : String(highlight).split(',');

    return new Set(
        list.map((v) => String(v).trim()).filter((v) => v.length)
    );
}

/**
 * Splits the decoded vector into rooms, walls and layer-6 geometry.
 * @param {Array} vector
 * @returns {{rooms: Array, walls: Array, layer6: Array}}
 */
function classifyLayers(vector) {
    const rooms = [];
    const walls = [];
    const layer6 = [];

    if (!Array.isArray(vector)) {
        return { rooms, walls, layer6 };
    }

    for (const layer of vector) {
        if (!Array.isArray(layer) || layer.length < 2) {
            continue;
        }

        const type = String(layer[0]);

        if (!['1', '2', '6'].includes(type)) {
            continue;
        }

        for (const value of layer.slice(1)) {
            if (typeof value !== 'string') {
                continue;
            }

            const parsed = parseLayer(value);

            if (type === '2') {
                rooms.push(parsed);
            } else if (type === '1') {
                walls.push(parsed);
            } else {
                layer6.push(parsed);
            }
        }
    }

    return { rooms, walls, layer6 };
}

/**
 * Renders the decoded `getMapInfo_V2` vector to a PNG data URL.
 *
 * @param {Array} vector - decoded info array
 * @param {Object} [opts]
 * @param {number} [opts.width=1000] - output width in pixels
 * @param {number} [opts.padding=20] - border padding in pixels
 * @param {{x:number,y:number}} [opts.deebotPosition] - world units
 * @param {{x:number,y:number}} [opts.chargePosition] - world units
 * @param {string|number|Array} [opts.highlight] - room IDs to emphasise
 * @param {boolean} [opts.showLayer6=true] - show layer-6 overlay
 * @param {Array<{index:number,x:number,y:number,flag:number}>} [opts.tracePoints]
 *   Route points sorted by index; coordinates already scaled to world units.
 * @returns {string|null} PNG data URL, or null when nothing renderable
 */
function renderVectorMapPNG(vector, opts = {}) {
    const width = opts.width || 1000;
    const padding = opts.padding !== undefined ? opts.padding : 20;
    const highlight = toHighlightSet(opts.highlight);
    const showLayer6 = opts.showLayer6 !== false;

    const { rooms, walls, layer6 } = classifyLayers(vector);
    const visibleLayer6 = showLayer6 ? layer6 : [];

    if (!rooms.length && !walls.length && !visibleLayer6.length) {
        return null;
    }

    // Include all visible geometry in the bounding box.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const group of [rooms, walls, visibleLayer6]) {
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

    // World -> pixel; flip the Y axis.
    const tx = (x) => padding + (x - minX) * scale;
    const ty = (y) => padding + (maxY - y) * scale;

    const fb = new FrameBuffer(width, height);
    fb.fillRect(
        0, 0, width, height,
        BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], 255
    );

    // Coloured room polygons.
    rooms.forEach((room, index) => {
        if (room.points.length < 3) {
            return;
        }

        const color = ROOM_COLORS[index % ROOM_COLORS.length];
        const pts = room.points.map(([x, y]) => [tx(x), ty(y)]);
        const emphasised = highlight.has(String(room.id));

        shapes.fillPolygon(fb, pts, color, emphasised ? 255 : 210);
        shapes.strokePolyline(fb, pts, color, {
            closed: true,
            width: 2
        });
    });

    // Layer 6: normal room colour.
    // The room area outside layer 6 retains its darker base fill.
    visibleLayer6.forEach((area) => {
        if (area.points.length < 3) {
            return;
        }

        const roomIndex = rooms.findIndex(
            (room) => String(room.id) === String(area.id)
        );

        if (roomIndex < 0) {
            return;
        }

        const color = ROOM_COLORS[roomIndex % ROOM_COLORS.length];
        const pts = area.points.map(([x, y]) => [tx(x), ty(y)]);

        shapes.fillPolygon(fb, pts, color, 255);
    });

    // Draw walls over the polygons.
    walls.forEach((wall) => {
        if (wall.points.length < 2) {
            return;
        }

        const pts = wall.points.map(([x, y]) => [tx(x), ty(y)]);
        shapes.strokePolyline(fb, pts, WALL_COLOR, { width: 2 });
    });

    // Diagnostic route: draw all flags above walls and below markers.
    // Do not bridge missing indexes or invalid coordinates.
    // Keep the map transform fixed: route points do not affect its bounds.
    const tracePoints = Array.isArray(opts.tracePoints) ? opts.tracePoints : [];
    for (let i = 1; i < tracePoints.length; i++) {
        const previous = tracePoints[i - 1];
        const current = tracePoints[i];

        if (
            !previous || !current ||
            !Number.isInteger(previous.index) ||
            !Number.isInteger(current.index) ||
            current.index !== previous.index + 1 ||
            !Number.isFinite(previous.x) ||
            !Number.isFinite(previous.y) ||
            !Number.isFinite(current.x) ||
            !Number.isFinite(current.y)
        ) {
            continue;
        }

        // Colour the segment using its destination point's flag.
        const color = getTraceFlagColor(current.flag);

        shapes.strokePolyline(fb, [
            [tx(previous.x), ty(previous.y)],
            [tx(current.x), ty(current.y)]
        ], color, { width: 6 });
    }

    const marker = (pos, color, radius) => {
        if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
            shapes.fillCircle(
                fb, tx(pos.x), ty(pos.y), radius, color, 255
            );
        }
    };

    marker(opts.chargePosition, CHARGER_COLOR, 8);
    // White outline, followed by the larger blue robot marker.
    marker(opts.deebotPosition, [255, 255, 255], 32);
    marker(opts.deebotPosition, ROBOT_COLOR, 28);

    return encodePNGDataURL(fb);
}

module.exports.getTraceFlagColor = getTraceFlagColor;
module.exports.renderVectorMapPNG = renderVectorMapPNG;
module.exports.parseLayer = parseLayer;
module.exports.classifyLayers = classifyLayers;