'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const zlib = require('zlib');

const { FrameBuffer, parseHexColor } = require('../library/render/framebuffer');
const { encodePNG, encodePNGDataURL, crc32, PNG_SIGNATURE } = require('../library/render/png');

// Independent PNG decoder used only to verify the encoder round-trips. It does
// NOT reuse the encoder's helpers (CRC is cross-checked separately below), so a
// passing round-trip means the emitted bytestream is a genuine PNG.
function decodePNG(buf) {
    assert.ok(buf.subarray(0, 8).equals(PNG_SIGNATURE), 'PNG signature');
    let offset = 8;
    let ihdr = null;
    const idatChunks = [];
    let sawIEND = false;
    while (offset < buf.length) {
        const length = buf.readUInt32BE(offset);
        const type = buf.toString('ascii', offset + 4, offset + 8);
        const data = buf.subarray(offset + 8, offset + 8 + length);
        if (type === 'IHDR') {
            ihdr = {
                width: data.readUInt32BE(0),
                height: data.readUInt32BE(4),
                bitDepth: data.readUInt8(8),
                colorType: data.readUInt8(9)
            };
        } else if (type === 'IDAT') {
            idatChunks.push(Buffer.from(data));
        } else if (type === 'IEND') {
            sawIEND = true;
        }
        offset += 12 + length;
    }
    assert.ok(ihdr, 'IHDR present');
    assert.ok(sawIEND, 'IEND present');

    const raw = zlib.inflateSync(Buffer.concat(idatChunks));
    const stride = ihdr.width * 4;
    const fb = new FrameBuffer(ihdr.width, ihdr.height);
    for (let y = 0; y < ihdr.height; y++) {
        const filter = raw[y * (stride + 1)];
        assert.strictEqual(filter, 0, `scanline ${y} uses filter 0`);
        raw.copy(fb.data, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    }
    return { ihdr, fb };
}

describe('FrameBuffer', function () {
    it('starts fully transparent', function () {
        const fb = new FrameBuffer(3, 2);
        assert.deepStrictEqual(fb.getPixel(0, 0), [0, 0, 0, 0]);
        assert.deepStrictEqual(fb.getPixel(2, 1), [0, 0, 0, 0]);
    });

    it('sets and reads back pixels', function () {
        const fb = new FrameBuffer(4, 4);
        fb.setPixel(1, 2, 10, 20, 30, 40);
        assert.deepStrictEqual(fb.getPixel(1, 2), [10, 20, 30, 40]);
    });

    it('ignores out-of-bounds writes and reads', function () {
        const fb = new FrameBuffer(2, 2);
        fb.setPixel(-1, 0, 1, 2, 3);
        fb.setPixel(0, 5, 1, 2, 3);
        assert.deepStrictEqual(fb.getPixel(99, 99), [0, 0, 0, 0]);
        // nothing leaked into the valid region
        assert.deepStrictEqual(fb.getPixel(0, 0), [0, 0, 0, 0]);
    });

    it('fills a rectangle', function () {
        const fb = new FrameBuffer(4, 4);
        fb.fillRect(1, 1, 2, 2, 100, 150, 200);
        assert.deepStrictEqual(fb.getPixel(1, 1), [100, 150, 200, 255]);
        assert.deepStrictEqual(fb.getPixel(2, 2), [100, 150, 200, 255]);
        assert.deepStrictEqual(fb.getPixel(0, 0), [0, 0, 0, 0]); // outside rect untouched
        assert.deepStrictEqual(fb.getPixel(3, 3), [0, 0, 0, 0]);
    });

    it('clears a pixel back to transparent', function () {
        const fb = new FrameBuffer(2, 2);
        fb.setPixel(0, 0, 255, 255, 255, 255);
        fb.clearPixel(0, 0);
        assert.deepStrictEqual(fb.getPixel(0, 0), [0, 0, 0, 0]);
    });

    it('opaque blend overwrites the destination', function () {
        const fb = new FrameBuffer(1, 1);
        fb.setPixel(0, 0, 0, 0, 0, 255);
        fb.blendPixel(0, 0, 255, 0, 0, 255);
        assert.deepStrictEqual(fb.getPixel(0, 0), [255, 0, 0, 255]);
    });

    it('source-over blends a half-transparent pixel onto an opaque one', function () {
        const fb = new FrameBuffer(1, 1);
        fb.setPixel(0, 0, 0, 0, 0, 255);       // opaque black
        fb.blendPixel(0, 0, 255, 255, 255, 128); // ~50% white
        const [r, g, b, a] = fb.getPixel(0, 0);
        assert.strictEqual(a, 255);
        // result is mid-grey; exact value depends on rounding, allow ±2
        for (const c of [r, g, b]) {
            assert.ok(Math.abs(c - 128) <= 2, `channel ${c} ~128`);
        }
    });

    it('composites one buffer over another', function () {
        const base = new FrameBuffer(2, 1);
        base.fillRect(0, 0, 2, 1, 0, 0, 0, 255);
        const layer = new FrameBuffer(2, 1);
        layer.setPixel(0, 0, 255, 0, 0, 255); // opaque red on the left, transparent on the right
        base.composite(layer);
        assert.deepStrictEqual(base.getPixel(0, 0), [255, 0, 0, 255]);
        assert.deepStrictEqual(base.getPixel(1, 0), [0, 0, 0, 255]); // unchanged under transparent
    });

    it('composite with flipY reads the source bottom-to-top', function () {
        const base = new FrameBuffer(1, 2);
        const layer = new FrameBuffer(1, 2);
        layer.setPixel(0, 0, 1, 1, 1, 255); // top row
        layer.setPixel(0, 1, 2, 2, 2, 255); // bottom row
        base.composite(layer, true);
        assert.deepStrictEqual(base.getPixel(0, 0), [2, 2, 2, 255]); // flipped
        assert.deepStrictEqual(base.getPixel(0, 1), [1, 1, 1, 255]);
    });

    it('rejects compositing mismatched sizes', function () {
        const base = new FrameBuffer(2, 2);
        assert.throws(() => base.composite(new FrameBuffer(3, 2)), /size mismatch/);
    });

    it('crops a sub-rectangle', function () {
        const fb = new FrameBuffer(4, 4);
        fb.setPixel(2, 2, 9, 8, 7, 255);
        const out = fb.crop(2, 2, 2, 2);
        assert.strictEqual(out.width, 2);
        assert.strictEqual(out.height, 2);
        assert.deepStrictEqual(out.getPixel(0, 0), [9, 8, 7, 255]);
        assert.deepStrictEqual(out.getPixel(1, 1), [0, 0, 0, 0]);
    });
});

describe('parseHexColor', function () {
    it('parses #rrggbb', function () {
        assert.deepStrictEqual(parseHexColor('#badbff'), [0xba, 0xdb, 0xff]);
    });

    it('parses shorthand #rgb', function () {
        assert.deepStrictEqual(parseHexColor('#f00'), [255, 0, 0]);
    });
});

describe('PNG encoder', function () {
    it('crc32 matches Node zlib.crc32 when available', function () {
        if (typeof zlib.crc32 !== 'function') {
            return; // Node < 22.2; hand-rolled table is the only path
        }
        const sample = Buffer.from('IHDR test payload \x00\x01\x02\xff', 'binary');
        assert.strictEqual(crc32(sample), zlib.crc32(sample) >>> 0);
    });

    it('emits a valid signature and IHDR geometry', function () {
        const fb = new FrameBuffer(5, 3);
        const { ihdr } = decodePNG(encodePNG(fb));
        assert.strictEqual(ihdr.width, 5);
        assert.strictEqual(ihdr.height, 3);
        assert.strictEqual(ihdr.bitDepth, 8);
        assert.strictEqual(ihdr.colorType, 6);
    });

    it('round-trips known pixels through encode → decode', function () {
        const fb = new FrameBuffer(3, 2);
        fb.setPixel(0, 0, 255, 0, 0, 255);
        fb.setPixel(1, 0, 0, 255, 0, 128);
        fb.setPixel(2, 0, 0, 0, 255, 255);
        fb.setPixel(0, 1, 10, 20, 30, 40);
        // (1,1) and (2,1) stay transparent
        const { fb: decoded } = decodePNG(encodePNG(fb));
        assert.deepStrictEqual([...decoded.data], [...fb.data]);
    });

    it('round-trips a larger filled buffer', function () {
        const fb = new FrameBuffer(64, 48);
        fb.fillRect(0, 0, 64, 48, 80, 120, 160, 255);
        fb.fillRect(10, 10, 20, 20, 200, 50, 50, 255);
        const { fb: decoded } = decodePNG(encodePNG(fb));
        assert.deepStrictEqual([...decoded.data], [...fb.data]);
    });

    it('emits a data URL matching the getBase64PNG contract', function () {
        const fb = new FrameBuffer(2, 2);
        fb.setPixel(0, 0, 1, 2, 3, 255);
        const url = encodePNGDataURL(fb);
        assert.ok(url.startsWith('data:image/png;base64,'));
        const bytes = Buffer.from(url.slice('data:image/png;base64,'.length), 'base64');
        const { fb: decoded } = decodePNG(bytes);
        assert.deepStrictEqual([...decoded.data], [...fb.data]);
    });
});
