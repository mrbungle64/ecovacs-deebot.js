'use strict';

const tools = require("./tools.js");

/**
 * Given the position of the Deebot and the position of the charging station,
 * return the distance to the charging station in meters
 * @param {string} deebotPosition - The current position of the Deebot, in the format "x,y"
 * @param {string} chargePosition - The position of the charging station, in the format "x,y"
 * @returns {number} the distance between the deebot and the charging station in km.
 */
function getDistanceToChargingStation(deebotPosition, chargePosition) {
    const deebotPosX = Number(deebotPosition.split(',')[0]);
    const deebotPosY = Number(deebotPosition.split(',')[1]);
    const chargePosX = Number(chargePosition.split(',')[0]);
    const chargePosY = Number(chargePosition.split(',')[1]);
    const distance = getDistance(deebotPosX, deebotPosY, chargePosX, chargePosY);
    return Number((distance / 1000).toFixed(1));
}

/**
 * Return the distance between two points
 * @param {number} x1 - The x-coordinate of the first point
 * @param {number} y1 - The y-coordinate of the first point
 * @param {number} x2 - The x-coordinate of the second point
 * @param {number} y2 - The y-coordinate of the second point
 * @returns {number} the distance between the two points
 */
function getDistance(x1, y1, x2, y2) {
    let xs = x2 - x1;
    let ys = y2 - y1;
    xs *= xs;
    ys *= ys;
    return Math.sqrt(xs + ys);
}

/**
 * The function checks for the spot area for the given position
 * @param {number} x - The x-coordinate of the point to check
 * @param {number} y - The y-coordinate of the point to check
 * @param {Object} spotAreaInfo - an object instance of EcovacsMapSpotAreaInfo
 * @returns {string} the ID of the spot area (`unknown` if not determinable or `void` if Canvas module is not installed)
 */
function getCurrentSpotAreaID(x, y, spotAreaInfo) {
    // Source: https://github.com/substack/point-in-polygon/blob/master/index.js
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    if (tools.isCanvasModuleAvailable()) {
        for (let infoID in spotAreaInfo) {
            if (spotAreaInfo.hasOwnProperty(infoID)) {
                if (spotAreaInfo[infoID]["mapSpotAreaCanvas"].getContext('2d').isPointInPath(x, y)) {
                    return spotAreaInfo[infoID]["mapSpotAreaID"];
                }
            }
        }
        // Spot area is unknown because the position is not found in the given coordinates
        return 'unknown';
    }
    // Spot area is unknown because the Canvas module is not installed
    return 'void';
}

module.exports.getDistanceToChargingStation = getDistanceToChargingStation;
module.exports.getCurrentSpotAreaID = getCurrentSpotAreaID;
