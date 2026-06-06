'use strict';

const { describe, it } = require('node:test');
const assert = require('assert');

const { FrameBuffer } = require('../library/render/framebuffer');
const { fillPolygon, strokePolyline } = require('../library/render/shapes');

const RED = [255, 0, 0];

describe('fillPolygon', function () {
    it('fills the interior of a square (even-odd scanline)', function () {
        const fb = new FrameBuffer(10, 10);
        fillPolygon(fb, [[2, 2], [7, 2], [7, 7], [2, 7]], RED);
        // Interior is filled...
        assert.deepStrictEqual(fb.getPixel(4, 4), [255, 0, 0, 255]);
        assert.deepStrictEqual(fb.getPixel(6, 6), [255, 0, 0, 255]);
        // ...and the outside stays transparent.
        assert.deepStrictEqual(fb.getPixel(0, 0), [0, 0, 0, 0]);
        assert.deepStrictEqual(fb.getPixel(9, 9), [0, 0, 0, 0]);
    });

    it('fills a triangle (sloped edges via scanline interpolation)', function () {
        const fb = new FrameBuffer(12, 12);
        fillPolygon(fb, [[6, 1], [10, 9], [2, 9]], RED);
        assert.deepStrictEqual(fb.getPixel(6, 8), [255, 0, 0, 255]); // near the wide base
        assert.deepStrictEqual(fb.getPixel(6, 3), [255, 0, 0, 255]); // near the apex
        assert.deepStrictEqual(fb.getPixel(1, 2), [0, 0, 0, 0]);     // outside, top-left
    });

    it('ignores degenerate polygons (< 3 points)', function () {
        const fb = new FrameBuffer(5, 5);
        fillPolygon(fb, [[1, 1], [3, 3]], RED);
        assert.deepStrictEqual(fb.getPixel(2, 2), [0, 0, 0, 0]);
    });

    it('clips fills to the framebuffer bounds', function () {
        const fb = new FrameBuffer(6, 6);
        fillPolygon(fb, [[-5, -5], [11, -5], [11, 11], [-5, 11]], RED);
        assert.deepStrictEqual(fb.getPixel(0, 0), [255, 0, 0, 255]);
        assert.deepStrictEqual(fb.getPixel(5, 5), [255, 0, 0, 255]);
    });
});

describe('strokePolyline', function () {
    it('draws a closed outline without filling the interior', function () {
        const fb = new FrameBuffer(10, 10);
        strokePolyline(fb, [[2, 2], [7, 2], [7, 7], [2, 7]], RED, { closed: true });
        assert.deepStrictEqual(fb.getPixel(2, 2), [255, 0, 0, 255]); // corner
        assert.deepStrictEqual(fb.getPixel(4, 2), [255, 0, 0, 255]); // top edge
        assert.deepStrictEqual(fb.getPixel(4, 4), [0, 0, 0, 0]);     // interior empty
    });

    it('honours a dash pattern (some gaps along a straight run)', function () {
        const fb = new FrameBuffer(40, 3);
        strokePolyline(fb, [[0, 1], [39, 1]], RED, { dash: [2, 2] });
        let on = 0;
        let off = 0;
        for (let x = 0; x < 40; x++) {
            if (fb.getPixel(x, 1)[3] !== 0) on++; else off++;
        }
        assert.ok(on > 0, 'dashed line should draw some pixels');
        assert.ok(off > 0, 'dashed line should leave some gaps');
    });

    it('applies a multi-pixel width', function () {
        const fb = new FrameBuffer(10, 10);
        strokePolyline(fb, [[1, 5], [8, 5]], RED, { width: 2 });
        // width 2 paints the centre row and an adjacent row.
        assert.deepStrictEqual(fb.getPixel(4, 5), [255, 0, 0, 255]);
        assert.ok(fb.getPixel(4, 4)[3] !== 0 || fb.getPixel(4, 6)[3] !== 0, 'a neighbouring row is painted');
    });
});
