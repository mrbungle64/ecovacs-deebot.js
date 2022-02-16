'use strict';

const tools = require("./tools.js");

function getDistanceToChargingStation(deebotPosition, chargePosition) {
    const deebotPosX = deebotPosition.split(',')[0];
    const deebotPosY = deebotPosition.split(',')[1];
    const chargePosX = chargePosition.split(',')[0];
    const chargePosY = chargePosition.split(',')[1];
    const distance = getDistance(deebotPosX, deebotPosY, chargePosX, chargePosY);
    return Number((distance / 1000).toFixed(1));
}

function getDistance(x1, y1, x2, y2) {
    let xs = x2 - x1;
    let ys = y2 - y1;
    xs *= xs;
    ys *= ys;
    return Math.sqrt(xs + ys);
}

function isPositionInSpotArea(position, spotAreaInfos) {
    // Source: https://github.com/substack/point-in-polygon/blob/master/index.js
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    if (tools.isCanvasModuleAvailable()) {
        for (let infoID in spotAreaInfos) {
            if (spotAreaInfos.hasOwnProperty(infoID)) {
                if (spotAreaInfos[infoID]["mapSpotAreaCanvas"].getContext('2d').isPointInPath(parseInt(position[0]), parseInt(position[1]))) {
                    return spotAreaInfos[infoID]["mapSpotAreaID"];
                }
            }
        }
        return 'unknown';
    }
    return 'void';
}

module.exports.getDistanceToChargingStation = getDistanceToChargingStation;
module.exports.isPositionInSpotArea = isPositionInSpotArea;
