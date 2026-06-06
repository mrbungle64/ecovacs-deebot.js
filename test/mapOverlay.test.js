'use strict';

// Phase-3 integration: spot-area + virtual-boundary overlays rendered through
// the pure-JS getBase64PNG path. Uses the synthetic live-map fixture (a 2x2
// block of floor/wall pieces) plus a hand-built mapDataObject – no device data.

const { describe, it } = require('node:test');
const assert = require('assert');
const zlib = require('zlib');
const lzma = require('lzma');

const mapTemplate = require('../library/mapTemplate');
const { parseHexColor } = require('../library/render/framebuffer');

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

function decodePixels(png) {
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
    return { width, height, counts };
}

async function renderWith(mapDataObject) {
    const img = new mapTemplate.EcovacsLiveMapImage('m', 'ol', 100, 100, 8, 8, 50, '');
    await img.initCanvas();
    const pieceValue = toWire(makeRoomPiece());
    for (const i of IN_USE_INDICES) {
        await img.updateMapPiece(i, pieceValue);
    }
    const result = await img.getBase64PNG(undefined, undefined, 'm', mapDataObject);
    return decodePixels(Buffer.from(result.mapBase64PNG.split(',')[1], 'base64'));
}

// device units map to pixels via `/50 + 400`; these span ~[350,450] in pixel space,
// well inside the rendered floor block (pixel rows/cols 300..499).
const SQUARE = '-2500,-2500;2500,-2500;2500,2500;-2500,2500';

describe('pure-JS overlay rendering (spot areas + virtual boundaries)', function () {
    it('paints a spot-area fill colour onto the map', async function () {
        const spotAreaID = 0;
        const mapDataObject = [{
            mapID: 'm',
            mapSpotAreas: [{ mapSpotAreaID: spotAreaID, mapSpotAreaBoundaries: SQUARE }],
            mapVirtualBoundaries: []
        }];
        const { counts } = await renderWith(mapDataObject);

        const [r, g, b] = parseHexColor('#ffdcf6'); // SPOTAREA_COLORS[0]
        const fillCount = counts.get(`${r},${g},${b},255`) || 0;
        assert.ok(fillCount > 1000, `expected spot-area fill, got ${fillCount} px`);
    });

    it('paints a red dashed virtual wall onto the map', async function () {
        const mapDataObject = [{
            mapID: 'm',
            mapSpotAreas: [],
            mapVirtualBoundaries: [{
                mapVirtualBoundaryType: 'vw',
                mapVirtualBoundaryCoordinates: `[${SQUARE.replace(/;/g, ',')}]`
            }]
        }];
        const { counts } = await renderWith(mapDataObject);

        const [r, g, b] = parseHexColor('#e40046'); // MAP_COLORS.vw
        const wallCount = counts.get(`${r},${g},${b},255`) || 0;
        assert.ok(wallCount > 0, `expected virtual-wall pixels, got ${wallCount}`);
    });

    it('does not alter the map when no overlay data is present', async function () {
        const withNull = await renderWith(null);
        const withEmpty = await renderWith([{ mapID: 'm', mapSpotAreas: [], mapVirtualBoundaries: [] }]);
        assert.strictEqual(withNull.width, withEmpty.width);
        assert.strictEqual(withNull.height, withEmpty.height);
    });
});
