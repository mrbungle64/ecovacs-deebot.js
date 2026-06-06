'use strict';

const zlib = require('zlib');

/**
 * Pure-JS PNG encoder for {@link module:render/framebuffer~FrameBuffer}.
 *
 * Emits an 8-bit truecolour-with-alpha (colour type 6) PNG: signature +
 * IHDR + IDAT (zlib `deflate`) + IEND, each chunk carrying its CRC32. This
 * replaces the native `canvas` `toDataURL()` while keeping the same
 * `data:image/png;base64,...` output contract.
 *
 * @see https://www.w3.org/TR/png/
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// CRC32 (IEEE) lookup table, built once. Each PNG chunk carries a CRC over its
// type + data. Hand-rolled rather than using `zlib.crc32`, which only exists
// from Node 22.2 (the project floor is Node >=22).
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Wraps payload as a PNG chunk: length(4) + type(4) + data + crc(4).
function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([length, typeBuf, data, crc]);
}

/**
 * Encodes a FrameBuffer as a PNG and returns the raw bytes as a Buffer.
 */
function encodePNG(frameBuffer) {
    const { width, height, data } = frameBuffer;

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8);   // bit depth
    ihdr.writeUInt8(6, 9);   // colour type 6 = truecolour + alpha
    ihdr.writeUInt8(0, 10);  // compression method: deflate
    ihdr.writeUInt8(0, 11);  // filter method: adaptive (we always use filter 0)
    ihdr.writeUInt8(0, 12);  // interlace method: none

    // Each scanline is prefixed with a filter-type byte (0 = none) before deflate.
    const stride = width * 4;
    const pixels = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        const dst = y * (stride + 1);
        raw[dst] = 0; // filter type 0 (none)
        pixels.copy(raw, dst + 1, y * stride, (y + 1) * stride);
    }

    const idat = zlib.deflateSync(raw);

    return Buffer.concat([
        PNG_SIGNATURE,
        chunk('IHDR', ihdr),
        chunk('IDAT', idat),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

/**
 * Encodes a FrameBuffer as a `data:image/png;base64,...` URL, matching the
 * existing `getBase64PNG()` / canvas `toDataURL()` output contract.
 */
function encodePNGDataURL(frameBuffer) {
    return 'data:image/png;base64,' + encodePNG(frameBuffer).toString('base64');
}

module.exports.encodePNG = encodePNG;
module.exports.encodePNGDataURL = encodePNGDataURL;
module.exports.crc32 = crc32;
module.exports.PNG_SIGNATURE = PNG_SIGNATURE;
