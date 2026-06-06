'use strict';

/**
 * Minimal pure-JS RGBA framebuffer used to render Deebot maps without the
 * native `canvas` module. Pixels are stored row-major as 4 bytes (R, G, B, A)
 * in a Uint8ClampedArray – the exact layout a truecolour-with-alpha PNG
 * expects, so {@link module:render/png} can consume `data` directly.
 *
 * A freshly constructed buffer is fully transparent (all zero), matching a
 * cleared `<canvas>`.
 */
class FrameBuffer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
    }

    /** Byte offset of the red channel for (x, y); G/B/A follow at +1/+2/+3. */
    offset(x, y) {
        return (y * this.width + x) * 4;
    }

    /** Whether (x, y) lies inside the buffer. */
    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    /** Overwrites a single pixel (canvas fillRect of 1×1). Out-of-bounds is a no-op. */
    setPixel(x, y, r, g, b, a = 255) {
        if (!this.inBounds(x, y)) {
            return;
        }
        const i = this.offset(x, y);
        this.data[i] = r;
        this.data[i + 1] = g;
        this.data[i + 2] = b;
        this.data[i + 3] = a;
    }

    /** Reads a pixel as `[r, g, b, a]`. Out-of-bounds reads return transparent black. */
    getPixel(x, y) {
        if (!this.inBounds(x, y)) {
            return [0, 0, 0, 0];
        }
        const i = this.offset(x, y);
        return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
    }

    /** Resets a pixel to fully transparent (canvas clearRect of 1×1). */
    clearPixel(x, y) {
        if (!this.inBounds(x, y)) {
            return;
        }
        const i = this.offset(x, y);
        this.data[i] = this.data[i + 1] = this.data[i + 2] = this.data[i + 3] = 0;
    }

    /** Fills an axis-aligned rectangle with an opaque-or-alpha colour. */
    fillRect(x, y, w, h, r, g, b, a = 255) {
        for (let yy = y; yy < y + h; yy++) {
            for (let xx = x; xx < x + w; xx++) {
                this.setPixel(xx, yy, r, g, b, a);
            }
        }
    }

    /**
     * Source-over alpha blend of a single pixel onto whatever is already there
     * (the Porter-Duff "over" operator the canvas uses for overlapping draws).
     */
    blendPixel(x, y, r, g, b, a = 255) {
        if (!this.inBounds(x, y) || a <= 0) {
            return;
        }
        if (a >= 255) {
            this.setPixel(x, y, r, g, b, 255);
            return;
        }
        const i = this.offset(x, y);
        const srcA = a / 255;
        const dstA = this.data[i + 3] / 255;
        const outA = srcA + dstA * (1 - srcA);
        if (outA <= 0) {
            this.clearPixel(x, y);
            return;
        }
        const blend = (s, d) => (s * srcA + d * dstA * (1 - srcA)) / outA;
        this.data[i] = blend(r, this.data[i]);
        this.data[i + 1] = blend(g, this.data[i + 1]);
        this.data[i + 2] = blend(b, this.data[i + 2]);
        this.data[i + 3] = outA * 255;
    }

    /**
     * Source-over composite of another same-sized buffer onto this one
     * (canvas `drawImage` of a layer). When `flipY` is set the source is read
     * bottom-to-top – the pure-JS equivalent of the `translate/scale(1,-1)`
     * vertical flip done before drawing.
     */
    composite(src, flipY = false) {
        if (src.width !== this.width || src.height !== this.height) {
            throw new Error(`composite size mismatch: ${src.width}x${src.height} onto ${this.width}x${this.height}`);
        }
        for (let y = 0; y < this.height; y++) {
            const srcY = flipY ? this.height - 1 - y : y;
            for (let x = 0; x < this.width; x++) {
                const s = src.offset(x, srcY);
                this.blendPixel(x, y, src.data[s], src.data[s + 1], src.data[s + 2], src.data[s + 3]);
            }
        }
    }

    /**
     * Returns a new FrameBuffer holding the sub-rectangle `(x, y, w, h)`
     * (canvas getImageData + resize crop). The rectangle is clamped to bounds.
     */
    crop(x, y, w, h) {
        const out = new FrameBuffer(w, h);
        for (let yy = 0; yy < h; yy++) {
            for (let xx = 0; xx < w; xx++) {
                const i = out.offset(xx, yy);
                const [r, g, b, a] = this.getPixel(x + xx, y + yy);
                out.data[i] = r;
                out.data[i + 1] = g;
                out.data[i + 2] = b;
                out.data[i + 3] = a;
            }
        }
        return out;
    }
}

/**
 * Parses a `#rgb` / `#rrggbb` CSS hex colour into `[r, g, b]` (0–255). The map
 * palette is defined as hex strings, so this bridges them to {@link FrameBuffer}.
 */
function parseHexColor(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const value = parseInt(h, 16);
    return [(value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF];
}

module.exports.FrameBuffer = FrameBuffer;
module.exports.parseHexColor = parseHexColor;
