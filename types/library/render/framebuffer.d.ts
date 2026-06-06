/**
 * Minimal pure-JS RGBA framebuffer used to render Deebot maps without the
 * native `canvas` module. Pixels are stored row-major as 4 bytes (R, G, B, A)
 * in a Uint8ClampedArray – the exact layout a truecolour-with-alpha PNG
 * expects, so {@link module:render/png} can consume `data` directly.
 *
 * A freshly constructed buffer is fully transparent (all zero), matching a
 * cleared `<canvas>`.
 */
export class FrameBuffer {
    constructor(width: any, height: any);
    width: any;
    height: any;
    data: Uint8ClampedArray<ArrayBuffer>;
    /** Byte offset of the red channel for (x, y); G/B/A follow at +1/+2/+3. */
    offset(x: any, y: any): number;
    /** Whether (x, y) lies inside the buffer. */
    inBounds(x: any, y: any): boolean;
    /** Overwrites a single pixel (canvas fillRect of 1×1). Out-of-bounds is a no-op. */
    setPixel(x: any, y: any, r: any, g: any, b: any, a?: number): void;
    /** Reads a pixel as `[r, g, b, a]`. Out-of-bounds reads return transparent black. */
    getPixel(x: any, y: any): number[];
    /** Resets a pixel to fully transparent (canvas clearRect of 1×1). */
    clearPixel(x: any, y: any): void;
    /** Fills an axis-aligned rectangle with an opaque-or-alpha colour. */
    fillRect(x: any, y: any, w: any, h: any, r: any, g: any, b: any, a?: number): void;
    /**
     * Source-over alpha blend of a single pixel onto whatever is already there
     * (the Porter-Duff "over" operator the canvas uses for overlapping draws).
     */
    blendPixel(x: any, y: any, r: any, g: any, b: any, a?: number): void;
    /**
     * Source-over composite of another same-sized buffer onto this one
     * (canvas `drawImage` of a layer). When `flipY` is set the source is read
     * bottom-to-top – the pure-JS equivalent of the `translate/scale(1,-1)`
     * vertical flip done before drawing.
     */
    composite(src: any, flipY?: boolean): void;
    /**
     * Returns a new FrameBuffer holding the sub-rectangle `(x, y, w, h)`
     * (canvas getImageData + resize crop). The rectangle is clamped to bounds.
     */
    crop(x: any, y: any, w: any, h: any): FrameBuffer;
}
/**
 * Parses a `#rgb` / `#rrggbb` CSS hex colour into `[r, g, b]` (0–255). The map
 * palette is defined as hex strings, so this bridges them to {@link FrameBuffer}.
 */
export function parseHexColor(hex: any): number[];
//# sourceMappingURL=framebuffer.d.ts.map