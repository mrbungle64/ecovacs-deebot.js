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
export function fillPolygon(fb: FrameBuffer, points: number[][], rgb: number[], alpha?: number): void;
/**
 * Fills a circle (disc) centred on `(cx, cy)` with radius `r` via per-scanline
 * span filling. Used for the charger icon.
 * @param {FrameBuffer} fb
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number[]} rgb
 * @param {number} [alpha=255]
 */
export function fillCircle(fb: FrameBuffer, cx: number, cy: number, r: number, rgb: number[], alpha?: number): void;
/**
 * Strokes a polyline. Supports closing the path, a multi-pixel width, and a
 * dash pattern (`[onLength, offLength]` in pixels, walked by arc length so
 * dashes stay even across vertices).
 * @param {FrameBuffer} fb
 * @param {number[][]} points
 * @param {number[]} rgb
 * @param {{alpha?: number, closed?: boolean, width?: number, dash?: number[]|null}} [opts]
 */
export function strokePolyline(fb: FrameBuffer, points: number[][], rgb: number[], opts?: {
    alpha?: number;
    closed?: boolean;
    width?: number;
    dash?: number[] | null;
}): void;
//# sourceMappingURL=shapes.d.ts.map