'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const zlib = require('zlib');
const lzma = require('lzma');

const { mapPieceToIntArray } = require('../library/mapTemplate');

// A small run of palette indices standing in for a decompressed map piece.
const PIXELS = [1, 1, 2, 3, 0, 6, 7, 1, 4, 5, 2, 2];

// Builds a base64 zstd payload exactly as a newer model would send it on the wire.
function zstdWire(bytes) {
    return zlib.zstdCompressSync(Buffer.from(bytes)).toString('base64');
}

// Builds a base64 LZMA payload in Ecovacs' wire format: the 4 high bytes of the
// 8-byte uncompressed-size field are omitted (mapPieceToIntArray re-inserts them).
function lzmaWire(bytes) {
    const full = Uint8Array.from(lzma.compress(bytes, 1), (b) => b & 0xff);
    const wire = Buffer.concat([Buffer.from(full.slice(0, 9)), Buffer.from(full.slice(13))]);
    return wire.toString('base64');
}

describe('mapPieceToIntArray', function () {
    it('decodes LZMA-compressed pieces (legacy models)', async function () {
        const result = await mapPieceToIntArray(lzmaWire(PIXELS));
        assert.deepStrictEqual([...result], PIXELS);
    });

    it('decodes zstd-compressed pieces (newer models) via magic-byte dispatch', async function () {
        const result = await mapPieceToIntArray(zstdWire(PIXELS));
        assert.deepStrictEqual([...result], PIXELS);
    });

    it('produces identical pixel data regardless of compression format', async function () {
        const fromLzma = await mapPieceToIntArray(lzmaWire(PIXELS));
        const fromZstd = await mapPieceToIntArray(zstdWire(PIXELS));
        assert.deepStrictEqual([...fromLzma], [...fromZstd]);
    });

    it('exposes pixel values by index for the canvas draw loop', async function () {
        const result = await mapPieceToIntArray(zstdWire(PIXELS));
        assert.strictEqual(result[5], 6); // a room index
        assert.strictEqual(result[4], 0); // "no data"
    });
});
