/**
 * Given the position of the Deebot and the position of the charging station,
 * return the distance to the charging station in meters
 * @param {string} deebotPosition - The current position of the Deebot, in the format "x,y"
 * @param {string} chargePosition - The position of the charging station, in the format "x,y"
 * @returns {number} the distance between the deebot and the charging station in km.
 */
export function getDistanceToChargingStation(deebotPosition: string, chargePosition: string): number;
/**
 * The function checks for the spot area for the given position
 * @param {number} x - The x-coordinate of the point to check
 * @param {number} y - The y-coordinate of the point to check
 * @param {Object} spotAreaInfo - an object instance of EcovacsMapSpotAreaInfo
 * @returns {string} the ID of the spot area (`unknown` if not determinable or `void` if Canvas module is not installed)
 */
export function getCurrentSpotAreaID(x: number, y: number, spotAreaInfo: any): string;
//# sourceMappingURL=mapTools.d.ts.map