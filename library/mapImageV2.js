'use strict';

/**
 * Renderer for the vector map delivered by newer models via `getMapInfo_V2`.
 * The (zstd-decompressed) `info` payload is an array of sub-arrays, one per
 * map layer: [ LAYER_TYPE, "roomId;x,y[,flag];...", ... ] where LAYER_TYPE is
 * "1" (walls), "2" (outline) or "6" (reachable area). Coordinates are in mm
 * (robot coordinate system, y points up).
 */

const PALETTE = [
    '#4CAF50', '#29b6f6', '#ffb300', '#ef5350', '#7e57c2', '#26a69a',
    '#ec407a', '#8d6e63', '#42a5f5', '#9ccc65', '#ff7043', '#5c6bc0',
    '#ffca28', '#66bb6a', '#ab47bc', '#26c6da'
];

function parsePolygon(polyString) {
    const parts = polyString.split(';');
    const room = parts[0];
    const points = [];
    for (let i = 1; i < parts.length; i++) {
        const seg = parts[i];
        if (!seg) continue;
        const nums = seg.split(',');
        const x = Number(nums[0]);
        const y = Number(nums[1]);
        if (!isNaN(x) && !isNaN(y)) points.push([x, y]);
    }
    return {room, points};
}

/**
 * Build an SVG floor plan from the decoded getMapInfo_V2 `info` array.
 * @param {Array} mapData
 * @param {Object} [options] - {names, width, background, highlight}
 * @returns {string|null}
 */
function buildRoomsSvg(mapData, options = {}) {
    if (!Array.isArray(mapData)) return null;
    const names = options.names || {};
    const targetWidth = options.width || 1000;
    const background = options.background || '#0b0b0b';
    const highlight = options.highlight;

    let layer = mapData.find((s) => Array.isArray(s) && String(s[0]) === '2');
    if (!layer) layer = mapData.find((s) => Array.isArray(s) && s.length > 1);
    if (!layer) return null;

    const polys = [];
    for (let i = 1; i < layer.length; i++) {
        const p = parsePolygon(layer[i]);
        if (p.points.length >= 3) polys.push(p);
    }
    if (!polys.length) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of polys) for (const [x, y] of p.points) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const pad = 400;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const w = maxX - minX, h = maxY - minY;
    if (w <= 0 || h <= 0) return null;
    const scale = targetWidth / w;
    const vw = Math.round(w * scale), vh = Math.round(h * scale);
    const tx = (x) => Math.round((x - minX) * scale * 10) / 10;
    const ty = (y) => Math.round((maxY - y) * scale * 10) / 10;

    const parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + vw + ' ' + vh + '" width="' + vw + '" height="' + vh + '" style="background:' + background + ';border-radius:8px">');
    polys.forEach((p, idx) => {
        const d = 'M ' + p.points.map(([x, y]) => tx(x) + ',' + ty(y)).join(' L ') + ' Z';
        const col = PALETTE[idx % PALETTE.length];
        const isHi = highlight !== undefined && String(highlight) === String(p.room);
        const fillOpacity = isHi ? 0.85 : 0.5;
        const strokeW = isHi ? 4 : 2.5;
        parts.push('<path d="' + d + '" fill="' + col + '" fill-opacity="' + fillOpacity + '" stroke="' + col + '" stroke-width="' + strokeW + '"/>');
        let cx = 0, cy = 0;
        for (const [x, y] of p.points) { cx += tx(x); cy += ty(y); }
        cx = Math.round(cx / p.points.length);
        cy = Math.round(cy / p.points.length);
        const label = names[p.room] || p.room;
        parts.push('<text x="' + cx + '" y="' + cy + '" fill="#fff" font-size="17" font-weight="bold" font-family="sans-serif" text-anchor="middle" style="paint-order:stroke;stroke:#000;stroke-width:3px">' + label + '</text>');
    });
    parts.push('</svg>');
    return parts.join('\n');
}

module.exports.buildRoomsSvg = buildRoomsSvg;
