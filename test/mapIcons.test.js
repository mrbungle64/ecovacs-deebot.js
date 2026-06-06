'use strict';

// Phase-4 integration: deebot (heading triangle) + charger (dot) vector icons
// rendered through the pure-JS getBase64PNG path. Synthetic fixture, no device.

const { describe, it } = require('node:test');
const assert = require('assert');
const zlib = require('zlib');
const lzma = require('lzma');

const mapTemplate = require('../library/mapTemplate');
const { FrameBuffer } = require('../library/render/framebuffer');
const { fillCircle } = require('../library/render/shapes');

const IN_USE_INDICES = [27, 28, 35, 36];

function makeRoomPiece() {
    const px = [];
    for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 100; col++) {
            const edge = row === 0 || col === 0 || row === 99 || col === 99;
            px.push(edge ? 2 : 1);
        }
    }
    return px;
}

function toWire(pixels) {
    const full = Uint8Array.from(lzma.compress(pixels, 1), (b) => b & 0xff);
    return Buffer.concat([Buffer.from(full.slice(0, 9)), Buffer.from(full.slice(13))]).toString('base64');
}

function colourCounts(png) {
    let offset = 8;
    let width = 0;
    let height = 0;
    const idat = [];
    while (offset < png.length) {
        const length = png.readUInt32BE(offset);
        const type = png.toString('ascii', offset + 4, offset + 8);
        const data = png.subarray(offset + 8, offset + 8 + length);
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
    const counts = new Map();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * (stride + 1) + 1 + x * 4;
            const key = `${raw[i]},${raw[i + 1]},${raw[i + 2]},${raw[i + 3]}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    return counts;
}

async function render(deebotPosition, chargerPosition) {
    const img = new mapTemplate.EcovacsLiveMapImage('m', 'ol', 100, 100, 8, 8, 50, '');
    await img.initCanvas();
    const pieceValue = toWire(makeRoomPiece());
    for (const i of IN_USE_INDICES) {
        await img.updateMapPiece(i, pieceValue);
    }
    const result = await img.getBase64PNG(deebotPosition, chargerPosition, 'm', null);
    return colourCounts(Buffer.from(result.mapBase64PNG.split(',')[1], 'base64'));
}

// Centre of the rendered floor block (device 0,0 -> pixel 400,400 -> inside crop).
const CENTRE = { x: 0, y: 0, a: 0, isInvalid: false };

describe('pure-JS icon rendering (deebot + charger)', function () {
    it('draws the deebot body colour when a valid position is given', async function () {
        const counts = await render(CENTRE, undefined);
        const deebot = counts.get('0,162,255,255') || 0; // DEEBOT_ICON_FILL #00a2ff
        assert.ok(deebot > 0, `expected deebot icon pixels, got ${deebot}`);
    });

    it('skips the deebot icon when the position is invalid', async function () {
        const counts = await render({ x: 0, y: 0, a: 0, isInvalid: true }, undefined);
        const deebot = counts.get('0,162,255,255') || 0;
        assert.strictEqual(deebot, 0, 'invalid deebot position must not be drawn');
    });

    it('draws the charger dot colour when a position is given', async function () {
        const counts = await render(undefined, { x: 0, y: 0, a: 0 });
        const charger = counts.get('67,160,71,255') || 0; // CHARGER_ICON_FILL #43a047
        assert.ok(charger > 0, `expected charger icon pixels, got ${charger}`);
    });

    it('rotates the deebot triangle with the heading angle', async function () {
        // Two headings 90° apart must produce different icon pixel layouts.
        const east = await render({ x: 0, y: 0, a: 0, isInvalid: false }, undefined);
        const north = await render({ x: 0, y: 0, a: 90, isInvalid: false }, undefined);
        // Same number of body pixels is plausible, but the bounding shape differs;
        // compare the count of stroke pixels as a cheap proxy that the shape moved.
        const eastBody = east.get('0,162,255,255') || 0;
        const northBody = north.get('0,162,255,255') || 0;
        assert.ok(eastBody > 0 && northBody > 0, 'both headings draw a body');
        // The outline colour set differs in placement; assert the renders are not identical.
        assert.notDeepStrictEqual([...east.entries()].sort(), [...north.entries()].sort());
    });
});

describe('fillCircle', function () {
    it('fills a disc and leaves the corners empty', function () {
        const fb = new FrameBuffer(11, 11);
        fillCircle(fb, 5, 5, 4, [10, 20, 30]);
        assert.deepStrictEqual(fb.getPixel(5, 5), [10, 20, 30, 255]); // centre
        assert.deepStrictEqual(fb.getPixel(5, 2), [10, 20, 30, 255]); // top of disc
        assert.deepStrictEqual(fb.getPixel(0, 0), [0, 0, 0, 0]);      // corner outside radius
    });
});
