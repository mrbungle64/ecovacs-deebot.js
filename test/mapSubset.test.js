'use strict';

// Regression for the ioBroker "coordinates.split is not a function" crash:
// compressed spot-area boundaries must decode to a coordinate STRING (not the
// byte array mapPieceToIntArray now returns), so EcovacsMapSpotAreaInfo can
// parse and hit-test them. Synthetic data only.

const { describe, it } = require('node:test');
const assert = require('assert');
const lzma = require('lzma');

const MapManager = require('../library/managers/mapManager');
const mapTools = require('../library/mapTools');

// Ecovacs LZMA wire format (4 high bytes of the size field omitted).
function lzmaWire(str) {
    const full = Uint8Array.from(lzma.compress([...Buffer.from(str, 'utf8')], 1), (b) => b & 0xff);
    return Buffer.concat([Buffer.from(full.slice(0, 9)), Buffer.from(full.slice(13))]).toString('base64');
}

function makeManager() {
    const bot = { on() {}, ecovacs: { sendCommand() {} }, currentMapMID: '42' };
    return new MapManager(bot);
}

const COORDS = '-3900,2700;-3900,800;-2700,800;-2700,2700';

describe('MapManager.handleMapSubset – compressed spot-area boundaries', function () {
    it('decodes compressed boundaries to a coordinate string (no .split crash)', async function () {
        const mgr = makeManager();
        const result = await mgr.handleMapSubset({
            mid: '42', type: 'ar', mssid: '7', connections: '',
            value: lzmaWire(COORDS), compress: 1, subtype: '1', name: ''
        });
        assert.strictEqual(result.mapsubsetEvent, 'MapSpotAreaInfo');
        const info = result.mapsubsetData;
        assert.strictEqual(typeof info.mapSpotAreaBoundaries, 'string');
        assert.strictEqual(info.mapSpotAreaBoundaries, COORDS);
        assert.strictEqual(info.mapSpotAreaBoundaryPoints.length, 4);
    });

    it('hit-tests the decoded polygon', async function () {
        const mgr = makeManager();
        const result = await mgr.handleMapSubset({
            mid: '42', type: 'ar', mssid: '7', connections: '',
            value: lzmaWire(COORDS), compress: 1, subtype: '1', name: ''
        });
        const info = result.mapsubsetData;
        assert.strictEqual(info.containsPoint(-3000, 1500), true);
        assert.strictEqual(info.containsPoint(0, 0), false);
        assert.strictEqual(mapTools.getCurrentSpotAreaID(-3000, 1500, { 7: info }), '7');
    });

    it('still accepts uncompressed boundaries', async function () {
        const mgr = makeManager();
        const result = await mgr.handleMapSubset({
            mid: '42', type: 'ar', mssid: '3', connections: '',
            value: COORDS, subtype: '1', name: ''
        });
        assert.strictEqual(result.mapsubsetData.mapSpotAreaBoundaries, COORDS);
        assert.strictEqual(result.mapsubsetData.containsPoint(-3000, 1500), true);
    });
});
