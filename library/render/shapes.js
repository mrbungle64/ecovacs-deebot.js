'use strict';

/**
 * Pure-JS rasterised polygon/line primitives operating on a
 * {@link module:render/framebuffer~FrameBuffer}. These replace the canvas
 * path/fill/stroke calls used for the spot-area and virtual-boundary overlays.
 *
 * Points are `[x, y]` pairs in framebuffer pixel space. Edges are not
 * anti-aliased (Cairo gave that for free; here we accept aliased edges, as
 * noted in the canvas-removal plan).
 */

/**
 * Fills a closed polygon using the even-odd scanline rule.
 * @param {FrameBuffer} fb
 * @param {number[][]} points - polygon vertices `[x, y]`
 * @param {number[]} rgb - `[r, g, b]`
 * @param {number} [alpha=255]
 */
function fillPolygon(fb, points, rgb, alpha = 255) {
    const n = points.length;
    if (n < 3) {
        return;
    }
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of points) {
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
    }
    minY = Math.max(0, Math.ceil(minY));
    maxY = Math.min(fb.height - 1, Math.floor(maxY));

    for (let y = minY; y <= maxY; y++) {
        // Collect x-intersections of the scanline with every edge.
        const crossings = [];
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const yi = points[i][1];
            const yj = points[j][1];
            if ((yi <= y && yj > y) || (yj <= y && yi > y)) {
                const t = (y - yi) / (yj - yi);
                crossings.push(points[i][0] + t * (points[j][0] - points[i][0]));
            }
        }
        crossings.sort((a, b) => a - b);
        for (let k = 0; k + 1 < crossings.length; k += 2) {
            const xStart = Math.max(0, Math.ceil(crossings[k]));
            const xEnd = Math.min(fb.width - 1, Math.floor(crossings[k + 1]));
            for (let x = xStart; x <= xEnd; x++) {
                fb.blendPixel(x, y, rgb[0], rgb[1], rgb[2], alpha);
            }
        }
    }
}

// Plots a filled square brush (size×size) centred on (x, y) – the poor man's
// line width. width 1 plots a single pixel.
function plotBrush(fb, x, y, rgb, alpha, width) {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (width <= 1) {
        fb.blendPixel(cx, cy, rgb[0], rgb[1], rgb[2], alpha);
        return;
    }
    const half = Math.floor(width / 2);
    for (let dy = -half; dy < width - half; dy++) {
        for (let dx = -half; dx < width - half; dx++) {
            fb.blendPixel(cx + dx, cy + dy, rgb[0], rgb[1], rgb[2], alpha);
        }
    }
}

// Strokes a single segment with Bresenham, applying the brush at each step.
function strokeSegment(fb, x0, y0, x1, y1, rgb, alpha, width) {
    let ax = Math.round(x0);
    let ay = Math.round(y0);
    const bx = Math.round(x1);
    const by = Math.round(y1);
    const dx = Math.abs(bx - ax);
    const dy = -Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1;
    const sy = ay < by ? 1 : -1;
    let err = dx + dy;
    for (;;) {
        plotBrush(fb, ax, ay, rgb, alpha, width);
        if (ax === bx && ay === by) {
            break;
        }
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            ax += sx;
        }
        if (e2 <= dx) {
            err += dx;
            ay += sy;
        }
    }
}

/**
 * Strokes a polyline. Supports closing the path, a multi-pixel width, and a
 * dash pattern (`[onLength, offLength]` in pixels, walked by arc length so
 * dashes stay even across vertices).
 * @param {FrameBuffer} fb
 * @param {number[][]} points
 * @param {number[]} rgb
 * @param {{alpha?: number, closed?: boolean, width?: number, dash?: number[]|null}} [opts]
 */
function strokePolyline(fb, points, rgb, opts = {}) {
    const { alpha = 255, closed = false, width = 1, dash = null } = opts;
    if (points.length < 2) {
        return;
    }
    const verts = closed ? [...points, points[0]] : points;

    if (!dash) {
        for (let i = 0; i + 1 < verts.length; i++) {
            strokeSegment(fb, verts[i][0], verts[i][1], verts[i + 1][0], verts[i + 1][1], rgb, alpha, width);
        }
        return;
    }

    const [on, off] = dash;
    let drawing = true;
    let remaining = on; // pixels left in the current dash phase
    for (let i = 0; i + 1 < verts.length; i++) {
        const [x0, y0] = verts[i];
        const [x1, y1] = verts[i + 1];
        const segLen = Math.hypot(x1 - x0, y1 - y0);
        if (segLen === 0) {
            continue;
        }
        const dirX = (x1 - x0) / segLen;
        const dirY = (y1 - y0) / segLen;
        let traveled = 0;
        while (traveled < segLen) {
            const step = Math.min(remaining, segLen - traveled);
            if (drawing) {
                strokeSegment(
                    fb,
                    x0 + dirX * traveled, y0 + dirY * traveled,
                    x0 + dirX * (traveled + step), y0 + dirY * (traveled + step),
                    rgb, alpha, width
                );
            }
            traveled += step;
            remaining -= step;
            if (remaining <= 1e-9) {
                drawing = !drawing;
                remaining = drawing ? on : off;
            }
        }
    }
}

module.exports.fillPolygon = fillPolygon;
module.exports.strokePolyline = strokePolyline;
