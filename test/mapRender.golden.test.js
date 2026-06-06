'use strict';

// Phase-2 regression gate for the pure-JS map renderer.
//
// `test/fixtures/golden-livemap.png` was produced by the native `canvas`
// rasteriser (its trusted fillRect colours + vertical flip + getImageData crop;
// see scratch/capture-golden.js). This test renders the SAME synthetic fixture
// through the pure-JS path and asserts the pixels are identical – i.e. the
// pure-JS floor/wall raster + flip + crop reproduces canvas exactly.
//
// No real device data is involved (same fixture as mapManager.liveMap.test.js).

const { describe, it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const lzma = require('lzma');

const mapTemplate = require('../library/mapTemplate');

const GRID = { pieceWidth: 100, pieceHeight: 100, cellWidth: 8, cellHeight: 8, pixel: 50 };
const IN_USE_INDICES = [27, 28, 35, 36];

function makeRoomPiece() {
    const px = [];
    for (let row = 0; row < GRID.pieceWidth; row++) {
        for (let col = 0; col < GRID.pieceHeight; col++) {
            const edge = row === 0 || col === 0 || row === GRID.pieceWidth - 1 || col === GRID.pieceHeight - 1;
            px.push(edge ? 2 : 1); // wall border, floor inside
        }
    }
    return px;
}

function toWire(pixels) {
    const full = Uint8Array.from(lzma.compress(pixels, 1), (b) => b & 0xff);
    return Buffer.concat([Buffer.from(full.slice(0, 9)), Buffer.from(full.slice(13))]).toString('base64');
}

// Minimal decoder for our filter-0 truecolour-alpha PNGs (golden + render output).
function decode(buf) {
    let offset = 8;
    let width = 0;
    let height = 0;
    const idat = [];
    while (offset < buf.length) {
        const length = buf.readUInt32BE(offset);
        const type = buf.toString('ascii', offset + 4, offset + 8);
        const data = buf.subarray(offset + 8, offset + 8 + length);
        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
        } else if (type === 'IDAT') {
            idat.push(Buffer.from(data));
        }
        offset += 12 + length;
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = width * 4;
    const pixels = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) {
        raw.copy(pixels, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    }
    return { width, height, pixels };
}

describe('pure-JS live-map render (golden regression)', function () {
    it('reproduces the canvas-rendered golden pixel-for-pixel', async function () {
        const img = new mapTemplate.EcovacsLiveMapImage('m', 'ol', 100, 100, 8, 8, 50, '');
        await img.initCanvas();
        const pieceValue = toWire(makeRoomPiece());
        for (const i of IN_USE_INDICES) {
            await img.updateMapPiece(i, pieceValue);
        }

        const result = await img.getBase64PNG(undefined, undefined, 'm', null);
        assert.ok(result, 'expected a render result');
        assert.strictEqual(result.mapType, 'live');
        assert.match(result.mapBase64PNG, /^data:image\/png;base64,/);

        const rendered = decode(Buffer.from(result.mapBase64PNG.split(',')[1], 'base64'));
        const golden = decode(fs.readFileSync(path.join(__dirname, 'fixtures', 'golden-livemap.png')));

        assert.strictEqual(rendered.width, golden.width, 'width matches golden');
        assert.strictEqual(rendered.height, golden.height, 'height matches golden');
        assert.ok(rendered.pixels.equals(golden.pixels), 'pixels match golden');
    });

    it('paints visible floor and wall (guards against the blank-render bug)', async function () {
        const img = new mapTemplate.EcovacsLiveMapImage('m', 'ol', 100, 100, 8, 8, 50, '');
        await img.initCanvas();
        const pieceValue = toWire(makeRoomPiece());
        for (const i of IN_USE_INDICES) {
            await img.updateMapPiece(i, pieceValue);
        }
        const result = await img.getBase64PNG(undefined, undefined, 'm', null);
        const { pixels } = decode(Buffer.from(result.mapBase64PNG.split(',')[1], 'base64'));

        let opaque = 0;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] !== 0) opaque++;
        }
        // The 2x2 room block should fill essentially the whole cropped image.
        assert.ok(opaque > 30000, `expected a filled map, got ${opaque} opaque pixels`);
    });
});
