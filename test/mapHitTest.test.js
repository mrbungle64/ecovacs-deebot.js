'use strict';

// Phase-5: spot-area hit-testing is now pure JS (ray-casting point-in-polygon),
// replacing the former native-canvas isPointInPath. No canvas module required.

const { describe, it } = require('node:test');
const assert = require('assert');

const { EcovacsMapSpotAreaInfo } = require('../library/mapInfo');
const { getCurrentSpotAreaID } = require('../library/mapTools');

// A 200x200 square spot area centred on the origin (raw device coordinates).
const SQUARE = '-100,-100;100,-100;100,100;-100,100';

function makeArea(id, boundaries) {
    return new EcovacsMapSpotAreaInfo('m', id, '', boundaries, '0', '');
}

describe('EcovacsMapSpotAreaInfo.containsPoint', function () {
    it('returns true for a point inside the polygon', function () {
        const area = makeArea('0', SQUARE);
        assert.strictEqual(area.containsPoint(0, 0), true);
        assert.strictEqual(area.containsPoint(50, -50), true);
    });

    it('returns false for a point outside the polygon', function () {
        const area = makeArea('0', SQUARE);
        assert.strictEqual(area.containsPoint(500, 500), false);
        assert.strictEqual(area.containsPoint(-150, 0), false);
    });
});

describe('getCurrentSpotAreaID (pure-JS, no canvas)', function () {
    it('returns the ID of the area containing the point', function () {
        const areas = {
            0: makeArea('0', SQUARE),
            1: makeArea('1', '200,200;400,200;400,400;200,400'),
        };
        assert.strictEqual(getCurrentSpotAreaID(0, 0, areas), '0');
        assert.strictEqual(getCurrentSpotAreaID(300, 300, areas), '1');
    });

    it('returns "unknown" when the point is in no area (never "void")', function () {
        const areas = { 0: makeArea('0', SQUARE) };
        assert.strictEqual(getCurrentSpotAreaID(9999, 9999, areas), 'unknown');
    });
});
