'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');
const lzma = require('lzma');
const tools = require('../library/tools');
const constants = require('../library/constants');
const MapManager = require('../library/managers/mapManager');

// ---------------------------------------------------------------------------
// Synthetic map fixture (no real device / no personal floor-plan data).
// We build the exact wire format the X1/T8/OZMO live-grid path uses: an 8x8
// grid of 100x100 LZMA-compressed pieces, with most pieces empty and a few
// "in use" forming a simple room, so the test exercises the real decode +
// assembly + render path deterministically.
// ---------------------------------------------------------------------------

const GRID = { pieceWidth: 100, pieceHeight: 100, cellWidth: 8, cellHeight: 8, pixel: 50 };
const PIECE_BYTES = GRID.pieceWidth * GRID.pieceHeight; // 10000
// A 2x2 block of pieces in the centre of the grid (see EcovacsLiveMapImage index→origin).
const IN_USE_INDICES = [27, 28, 35, 36];

// Palette: 0 = no data, 1 = floor, 2 = wall.
function makeRoomPiece() {
    const px = new Uint8Array(PIECE_BYTES);
    for (let row = 0; row < GRID.pieceWidth; row++) {
        for (let col = 0; col < GRID.pieceHeight; col++) {
            const edge = row === 0 || col === 0 || row === GRID.pieceWidth - 1 || col === GRID.pieceHeight - 1;
            px[GRID.pieceWidth * row + col] = edge ? 2 : 1; // wall border, floor inside
        }
    }
    return px;
}

// Encodes raw pixels into the Ecovacs LZMA wire format: the 4 high bytes of the
// 8-byte uncompressed-size header are omitted (mapPieceToIntArray re-inserts them).
function toWire(pixels) {
    const full = Uint8Array.from(lzma.compress(Array.from(pixels), 1), (b) => b & 0xff);
    return Buffer.concat([Buffer.from(full.slice(0, 9)), Buffer.from(full.slice(13))]).toString('base64');
}

function buildFixture() {
    const pieceValue = toWire(makeRoomPiece());
    const crc = new Array(GRID.cellWidth * GRID.cellHeight).fill(constants.CRC_EMPTY_PIECE);
    for (const i of IN_USE_INDICES) {
        crc[i] = String(100000 + i); // any non-empty sentinel marks the piece in use
    }
    return {
        major: { mid: '12345678', type: 'ol', ...GRID, value: crc.join(',') },
        minor: IN_USE_INDICES.map((i) => ({ pieceIndex: i, pieceValue })),
    };
}

const fixture = buildFixture();

function makeBot() {
    const sentCommands = [];
    return {
        on() {},
        ecovacs: { sendCommand: (cmd) => sentCommands.push(cmd) },
        deebotPosition: { x: 0, y: 0, a: 0, isInvalid: false },
        chargePosition: { x: 100, y: 0, a: 0 },
        _sentCommands: sentCommands,
    };
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

describe('MapManager – live map (MajorMap/MinorMap) rendering', function () {
    // The live map render requires the optional `canvas` module.
    if (!tools.isCanvasModuleAvailable()) {
        it('skipped (canvas module not available)', function () {
            assert.ok(true);
        });
        return;
    }

    it('requests only in-use pieces (sentinel fix), not all 64', async function () {
        const bot = makeBot();
        const mgr = new MapManager(bot);
        await mgr.handleMajorMap(fixture.major);
        assert.strictEqual(bot._sentCommands.length, IN_USE_INDICES.length);
        assert.ok(bot._sentCommands.length < 64, 'should not request all 64 grid pieces');
    });

    it('returns null until the full set of pieces has arrived', async function () {
        const bot = makeBot();
        const mgr = new MapManager(bot);
        await mgr.handleMajorMap(fixture.major);
        const first = fixture.minor[0];
        const intermediate = await mgr.handleMinorMap({
            mid: fixture.major.mid, pieceIndex: first.pieceIndex, pieceValue: first.pieceValue,
        });
        assert.strictEqual(intermediate, null);
    });

    it('renders a valid live PNG once all pieces are received', async function () {
        const bot = makeBot();
        const mgr = new MapManager(bot);
        await mgr.handleMajorMap(fixture.major);

        let result = null;
        for (const piece of fixture.minor) {
            result = await mgr.handleMinorMap({
                mid: fixture.major.mid, pieceIndex: piece.pieceIndex, pieceValue: piece.pieceValue,
            });
        }

        assert.ok(result, 'expected a rendered image after the last piece');
        assert.strictEqual(result.mapID, fixture.major.mid);
        assert.strictEqual(result.mapType, 'live');
        assert.match(result.mapBase64PNG, /^data:image\/png;base64,/);

        const png = Buffer.from(result.mapBase64PNG.replace(/^data:image\/png;base64,/, ''), 'base64');
        assert.deepStrictEqual([...png.subarray(0, 8)], PNG_SIGNATURE, 'output must be a valid PNG');
        assert.ok(png.length > 200, 'rendered PNG should be non-trivial');
    });

    it('renders even when positions are unknown (no charger/robot)', async function () {
        const bot = makeBot();
        bot.deebotPosition = undefined;
        bot.chargePosition = undefined;
        const mgr = new MapManager(bot);
        await mgr.handleMajorMap(fixture.major);

        let result = null;
        for (const piece of fixture.minor) {
            result = await mgr.handleMinorMap({
                mid: fixture.major.mid, pieceIndex: piece.pieceIndex, pieceValue: piece.pieceValue,
            });
        }
        assert.ok(result && result.mapBase64PNG, 'map should still render without positions');
    });
});
