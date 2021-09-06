const tools = require('./tools.js');
const lzma = require('lzma')
const constants = require('./ecovacsConstants');
const map = require('./mapTemplate');

const SPOTAREA_SUBTYPES = {
    '0': {"en": "Default  (A, B, C...)", "de": "Standard (A, B, C...)"},
    '1': {"en": "Living room", "de": "Wohnzimmer"},
    '2': {"en": "Dining room", "de": "Esszimmer"},
    '3': {"en": "Bedroom", "de": "Schlafzimmer"},
    '4': {"en": "Study", "de": "Büro"},
    '5': {"en": "Kitchen", "de": "Küche"},
    '6': {"en": "Bathroom", "de": "Badezimmer"},
    '7': {"en": "Laundry", "de": "Waschküche"},
    '8': {"en": "Lounge", "de": "Lounge"},
    '9': {"en": "Storeroom", "de": "Lagerraum"},
    '10': {"en": "Kids room", "de": "Kinderzimmer"},
    '11': {"en": "Sunroom", "de": "Wintergarten"},
    '12': {"en": "Corridor", "de": "Flur"},
    '13': {"en": "Balcony", "de": "Balkon"},
    '14': {"en": "Gym", "de": "Fitnessstudio"}
};

//TODO: make colors customizable by introducing SetMapStyle(json)
const SPOTAREA_COLORS = [
    '#ffdcf6',
    '#fff8d2',
    '#e4fed9',
    '#dbf2fe',
    '#ffd7c9',
    '#fee3c4',
    '#e98b9d',
    '#ffa1a1',
    '#9fcfff'
];

const MAP_COLORS = {
    'vw': '#e40046', // virtual wall
    'mw': '#f7a501', // no mop zone
    'floor': '#badbff',
    'wall': '#5095e1',
    'carpet': '#b0cceb',
    'wifi_not_covered': '#d6d6d6',
    'wifi_1': '#7fbafb', // strong
    'wifi_2': '#a2cdfc',
    'wifi_3': '#bbdafd',
    'wifi_4': '#ddebfa',
    'wifi_5': '#f7fbff', // weak
};

const POSITION_OFFSET = 400; // the positions of the charger and the Deebot need an offset of 400 pixels

let mapDataObject = null;

class EcovacsMapImageBase {
    constructor(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel) {
        this.mapFloorCanvas = null;
        this.mapFloorContext = null;
        this.mapWallCanvas = null;
        this.mapWallContext = null;
        this.cropBoundaries = {
            minX: null,
            minY: null,
            maxX: null,
            maxY: null
        };
        this.mapID = mapID;
        this.mapType = constants.MAPINFOTYPE_FROM_ECOVACS[mapType];
        this.isLiveMap = false;
        this.mapTotalWidth = mapTotalWidth;
        this.mapTotalHeight = mapTotalHeight;
        this.mapPixel = mapPixel;
        this.transferMapInfo = null;

        this.initCanvas();
    }

    initCanvas() {
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }

        const {createCanvas} = require('canvas');
        this.mapFloorCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
        this.mapFloorContext = this.mapFloorCanvas.getContext("2d");
        this.mapFloorContext.globalAlpha = 1;
        this.mapFloorContext.beginPath();
        this.mapWallCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
        this.mapWallContext = this.mapWallCanvas.getContext("2d");
        this.mapWallContext.globalAlpha = 1;
        this.mapWallContext.beginPath();
    }

    drawMapPieceToCanvas(mapPieceCompressed, mapPieceStartX, mapPieceStartY, mapPieceWidth, mapPieceHeight) {
        let mapPieceDecompressed = mapPieceToIntArray(mapPieceCompressed);

        for (let row = 0; row < mapPieceWidth; row++) {
            for (let column = 0; column < mapPieceHeight; column++) {
                let bufferRow = row + mapPieceStartX;
                let bufferColumn = column + mapPieceStartY;
                let pieceDataPosition = mapPieceWidth * row + column;
                let pixelValue = mapPieceDecompressed[pieceDataPosition];

                if (pixelValue === 0) { // No data
                    this.mapFloorContext.clearRect(bufferRow, bufferColumn, 1, 1);
                    this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                } else {
                    // Check cropBoundaries
                    if (this.cropBoundaries.minY === null) {
                        this.cropBoundaries.minY = bufferColumn;
                    } else if (bufferColumn < this.cropBoundaries.minY) {
                        this.cropBoundaries.minY = bufferColumn;
                    }
                    if (this.cropBoundaries.minX === null) {
                        this.cropBoundaries.minX = bufferRow;
                    } else if (bufferRow < this.cropBoundaries.minX) {
                        this.cropBoundaries.minX = bufferRow;
                    }
                    if (this.cropBoundaries.maxX === null) {
                        this.cropBoundaries.maxX = bufferRow;
                    } else if (this.cropBoundaries.maxX < bufferRow) {
                        this.cropBoundaries.maxX = bufferRow;
                    }
                    if (this.cropBoundaries.maxY === null) {
                        this.cropBoundaries.maxY = bufferColumn;
                    } else if (this.cropBoundaries.maxY < bufferColumn) {
                        this.cropBoundaries.maxY = bufferColumn;
                    }

                    if (pixelValue < 4) {
                        // Floor, wall and carpet
                        if (pixelValue === 1) {
                            // Floor
                            this.mapFloorContext.fillStyle = MAP_COLORS['floor'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue === 2) {
                            // Wall
                            this.mapWallContext.fillStyle = MAP_COLORS['wall'];
                            this.mapWallContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapFloorContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue === 3) {
                            // Carpet
                            this.mapWallContext.fillStyle = MAP_COLORS['carpet'];
                            this.mapWallContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapFloorContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        }
                    } else if (pixelValue >= 4) {
                        // Wifi heatmap
                        if (pixelValue === 4) {
                            // Wifi not covered
                            this.mapFloorContext.fillStyle = MAP_COLORS['wifi_not_covered'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue > 10 && pixelValue <= 20) {
                            // Wifi coverage 1=strong
                            this.mapFloorContext.fillStyle = MAP_COLORS['wifi_1'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue > 20 && pixelValue <= 30) {
                            // Wifi coverage 2
                            this.mapFloorContext.fillStyle = MAP_COLORS['wifi_2'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue > 30 && pixelValue <= 40) {
                            // Wifi coverage 3
                            this.mapFloorContext.fillStyle = MAP_COLORS['wifi_3'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue > 40 && pixelValue <= 50) {
                            // Wifi coverage 4
                            this.mapFloorContext.fillStyle = MAP_COLORS['wifi_4'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        } else if (pixelValue > 50) {
                            // Wifi coverage 5=weak
                            this.mapFloorContext.fillStyle = MAP_COLORS['wifi_5'];
                            this.mapFloorContext.fillRect(bufferRow, bufferColumn, 1, 1);
                            this.mapWallContext.clearRect(bufferRow, bufferColumn, 1, 1);
                        }
                    }
                }
            }
        }
    }

    getBase64PNG(deebotPosition, chargerPosition, currentMapMID) {
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }
        if (!this.transferMapInfo) {
            // check if data should not be transferred
            // mapinfo: not all data pieces retrieved or sub-data piece with no changes retrieved
            return null;
        }

        const {createCanvas} = require('canvas');
        let finalCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
        let finalContext = finalCanvas.getContext("2d");
        // Flip map horizontally before drawing everything else
        finalContext.translate(0, this.mapTotalHeight);
        finalContext.scale(1, -1);

        // Draw floor map
        finalContext.drawImage(this.mapFloorCanvas, 0, 0, this.mapTotalWidth, this.mapTotalHeight);

        // Get mapObject
        let mapObject = null;

        if (map.mapDataObject !== null) {
            if (typeof this.mapID == null) {
                mapObject = getCurrentMapObject(map.mapDataObject);
            } else {
                mapObject = getMapObject(map.mapDataObject, this.mapID);
            }
            // Draw spotAreas
            let areaCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
            const areaContext = areaCanvas.getContext('2d');
            for (let areaIndex in mapObject['mapSpotAreas']) {
                let areaCoordinateArray = mapObject['mapSpotAreas'][areaIndex]['mapSpotAreaBoundaries'].split(';');
                areaContext.beginPath();
                for (let i = 0; i < areaCoordinateArray.length; i++) {
                    let row = areaCoordinateArray[i].split(',')[0] / 50 + POSITION_OFFSET;
                    let column = areaCoordinateArray[i].split(',')[1] / 50 + POSITION_OFFSET;
                    if (i === 0) {
                        areaContext.moveTo(row, column);
                    } else {
                        areaContext.lineTo(row, column);
                    }
                }
                areaContext.closePath();
                areaContext.fillStyle = SPOTAREA_COLORS[mapObject['mapSpotAreas'][areaIndex]['mapSpotAreaID'] % SPOTAREA_COLORS.length];
                areaContext.fill();
            }
            finalContext.drawImage(areaCanvas, 0, 0, this.mapTotalWidth, this.mapTotalHeight);

            // Draw virtualBoundaries
            let boundaryCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
            const boundaryContext = boundaryCanvas.getContext('2d');
            for (let boundaryIndex in mapObject['mapVirtualBoundaries']) {
                let boundaryCoordinates = mapObject['mapVirtualBoundaries'][boundaryIndex]['mapVirtualBoundaryCoordinates'];
                let boundaryCoordinateArray = boundaryCoordinates.substring(1, boundaryCoordinates.length - 1).split(',');
                boundaryContext.beginPath();
                for (let i = 0; i < boundaryCoordinateArray.length; i = i + 2) {
                    let row = boundaryCoordinateArray[i] / 50 + POSITION_OFFSET;
                    let column = boundaryCoordinateArray[i + 1] / 50 + POSITION_OFFSET;
                    // Check cropBoundaries
                    if (this.cropBoundaries.minY === null) {
                        this.cropBoundaries.minY = column;
                    } else if (column < this.cropBoundaries.minY) {
                        this.cropBoundaries.minY = column;
                    }
                    if (this.cropBoundaries.minX === null) {
                        this.cropBoundaries.minX = row;
                    } else if (row < this.cropBoundaries.minX) {
                        this.cropBoundaries.minX = row;
                    }
                    if (this.cropBoundaries.maxX === null) {
                        this.cropBoundaries.maxX = row;
                    } else if (this.cropBoundaries.maxX < row) {
                        this.cropBoundaries.maxX = row;
                    }
                    if (this.cropBoundaries.maxY === null) {
                        this.cropBoundaries.maxY = column;
                    } else if (this.cropBoundaries.maxY < column) {
                        this.cropBoundaries.maxY = column;
                    }

                    if (i === 0) {
                        boundaryContext.moveTo(row, column);
                    } else {
                        boundaryContext.lineTo(row, column);
                    }
                }
                boundaryContext.closePath();
                boundaryContext.lineWidth = 2;
                boundaryContext.strokeStyle = MAP_COLORS[mapObject['mapVirtualBoundaries'][boundaryIndex]['mapVirtualBoundaryType']];
                boundaryContext.setLineDash([2, 2]);
                boundaryContext.stroke();
            }
            finalContext.drawImage(boundaryCanvas, 0, 0, this.mapTotalWidth, this.mapTotalHeight);

            //Draw chargers
            //TODO: add results from getPos_V2 to mapDataObject
        }

        // Draw walls & carpet
        finalContext.drawImage(this.mapWallCanvas, 0, 0, this.mapTotalWidth, this.mapTotalHeight);

        // Draw deebot
        if (this.mapID === currentMapMID) { //TODO: getPos only retrieves (charger) position for current map, getPos_V2 can retrieve all charger positions
            const {Image} = require('canvas');
            if (typeof deebotPosition !== 'undefined' && !deebotPosition['isInvalid']) { //TODO: draw other icon when position is invalid
                //Draw robot
                ////////////
                //TODO: later on the deebot position should only be drawn in the livemap so the mapinfo-maps dont have to be updated with new positions
                //TODO: replace with customizable icons
                //for now taken from https://github.com/iobroker-community-adapters/ioBroker.mihome-vacuum/blob/master/lib/mapCreator.js#L27
                const robotBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAfCAMAAAHGjw8oAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADbUExURQAAAICAgICAgICAgICAgICAgHx8fH19fX19fYCAgIGBgX5+foCAgH5+foCAgH9/f39/f35+foCAgH9/f39/f4CAgH5+foGBgYCAgICAgIGBgX9/f39/f35+foCAgH9/f39/f4CAgIODg4eHh4mJiZCQkJycnJ2dnZ6enqCgoKSkpKenp62trbGxsbKysry8vL29vcLCwsXFxcbGxsvLy87OztPT09XV1d/f3+Tk5Ojo6Ozs7O3t7e7u7vHx8fLy8vPz8/X19fb29vf39/j4+Pn5+f39/f7+/v///9yECocAAAAgdFJOUwAGChgcKCkzOT5PVWZnlJmfsLq7wcrS1Nre4OXz+vr7ZhJmqwAAAAlwSFlzAAAXEQAAFxEByibzPwAAAcpJREFUKFNlkolaWkEMhYPggliBFiwWhGOx3AqCsggI4lZt8/5P5ElmuEX5P5hMMjeZJBMRafCvUKnbIqpcioci96owTQWqP0QKC54nImUAyr9k7VD1me4YvibHlJKpVUzQhR+dmdTRSDUvdHh8NK8nhqUVch7cITmXA3rtYDmH+3OL4XI1T+BhJUcXczQxOBXJuve0/daeUr5A6g9muJzo5NI2kPKtyRSGBStKQZ5RC1hENWn6NSRTrDUqLD/lsNKoFTNRETlGMn9dDoGdoDcT1fHPi7EuUDD9dMBw4+6vMQVyInnPXDsdW+8tjWfbYTbzg/OstcagzSlb0+wL/6k+1KPhCrj6YFhzS5eXuHcYNF4bsGtDYhFLTOSMqTsx9e3iyKfynb1SK+RqtEq70RzZPwEGKwv7G0OK1QA42Y+HIgct9P3WWG9ItI/mQTgvoeuWAMdlTRclO/+Km2jwlhDvinGNbyJH6EWV84AJ1wl8JowejqTqTmv+0GqDmVLlg/wLX5Mp2rO3WRs2Zs5fznAVd1EzRh10OONr7hhhM4ctevhiVVxHdYsbq+JzHzaIfdjs5CZ9tGInSfoWEXuL7//fwtn9+Jp7wSryDjBFqnOGeuUxAAAAAElFTkSuQmCC";
                const robotImage = new Image(); // Create a new Image
                robotImage.src = robotBase64;
                //icon is facing upward, so add 90
                let robotCanvas = getRotatedCanvasFromImage(robotImage, deebotPosition['a'] + 90); //angle from ecovacs: 0=facing right, 90 = facing upwards, 180/-180 = facing left, -90 = facing downwards
                // icon size is 16*16, so subtract 8 pixels to coordinates for center
                finalContext.drawImage(robotCanvas, (deebotPosition['x'] / this.mapPixel) + POSITION_OFFSET - 8, (deebotPosition['y'] / this.mapPixel) + POSITION_OFFSET - 8, 16, 16);
            }
            // Draw charger
            //////////////
            // TODO: replace with customizable icons
            // for now taken from https://github.com/iobroker-community-adapters/ioBroker.mihome-vacuum/blob/master/lib/mapCreator.js#L28
            const charger = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAdVBMVEUAAAA44Yo44Yo44Yo44Yo44Yo44Yo44Yo44Yp26q844Yr///9767Kv89DG9t2g8Md26q5C44/5/vvz/fjY+ei19NNV5ZtJ45T2/fmY78KP7r1v6atq6Kjs/PPi+u7e+uvM9+Gb8MSS7r+H7bhm6KVh56JZ5p3ZkKITAAAACnRSTlMABTr188xpJ4aepd0A4wAAANZJREFUKM9VklmCgzAMQwkQYCSmLKWl2+zL/Y9YcIUL7wvkJHIUJyKkVcyy+JIGCZILGF//QLEqlTmMdsBEXi56igfH/QVGqvXSu49+1KftCbn+dtxB5LOPfNGQNRaKaQNkTJ46OMGczZg8wJB/9TB+J3nFkyqJMp44vBrnWYhJJmOn/5uVzAotV/zACnbUtTbOpHcQzVx8kxw6mavdpYP90dsNcE5k6xd8RoIb2Xgk6xAbfm5C9NiHtxGiXD/U2P96UJunrS/LOeV2GG4wfBi241P5+NwBnAEUFx9FUdUAAAAASUVORK5CYII=";
            const chargerImage = new Image();
            chargerImage.src = charger;
            // icon size is 16*16, so subtract 8 pixels to coordinates for center
            finalContext.drawImage(chargerImage, (chargerPosition['x'] / this.mapPixel) + POSITION_OFFSET - 8, (chargerPosition['y'] / this.mapPixel) + POSITION_OFFSET - 8, 16, 16);
        }

        // Crop image
        const croppedImage = finalContext.getImageData(this.cropBoundaries.minX
            , this.mapTotalHeight - this.cropBoundaries.maxY // map was flipped horizontally before, so the boundaries have shifted
            , this.cropBoundaries.maxX - this.cropBoundaries.minX
            , this.cropBoundaries.maxY - this.cropBoundaries.minY);
        finalContext.canvas.height = this.cropBoundaries.maxY - this.cropBoundaries.minY;
        finalContext.canvas.width = this.cropBoundaries.maxX - this.cropBoundaries.minX;
        finalContext.putImageData(croppedImage, 0, 0);
        this.mapBase64PNG = finalCanvas.toDataURL();
        this.transferMapInfo = false;
        //console.log('<img src="' + finalCanvas.toDataURL() + '" />');
        return {
            'mapID': this.mapID,
            'mapType': this.isLiveMap ? 'live' : this.mapType,
            'mapBase64PNG': this.mapBase64PNG
        }
    }
}

class EcovacsLiveMapImage extends EcovacsMapImageBase {
    constructor(mapID, mapType, mapPieceWidth, mapPieceHeight, mapCellWidth, mapCellHeight, mapPixel, mapDataPiecesCrc) {
        super(mapID, mapType, mapPieceWidth * mapCellWidth, mapPieceHeight * mapCellHeight, mapPixel);
        this.mapPieceWidth = mapPieceWidth;
        this.mapPieceHeight = mapPieceHeight;
        this.mapCellWidth = mapCellWidth;
        this.mapCellHeight = mapCellHeight;
        this.mapDataPiecesCrc = mapDataPiecesCrc;
    }

    updateMapDataPiecesCrc(mapDataPiecesCrc) {
        // Is only transferred in onMajorMap
        // TODO: comparison for change has to be done before onMinorMap-Events
        this.mapDataPiecesCrc = mapDataPiecesCrc;
    }

    updateMapPiece(mapDataPieceIndex, mapDataPiece) {
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }
        this.transferMapInfo = true; //TODO: check for CRC change, interval and maybe only once per onMajorMap-Event or onMapTrace
        const mapPieceStartX = Math.floor(mapDataPieceIndex / this.mapCellWidth) * this.mapPieceWidth;
        const mapPieceStartY = (mapDataPieceIndex % this.mapCellHeight) * this.mapPieceHeight;
        this.drawMapPieceToCanvas(mapDataPiece, mapPieceStartX, mapPieceStartY, this.mapPieceWidth, this.mapPieceHeight);
    }
}

class EcovacsMapImage extends EcovacsMapImageBase {
    constructor(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel, mapTotalCount) {
        super(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel);
        this.isLiveMap = false;
        // mapinfo returns the total compressed string in several pieces, stores the string pieces for concatenation
        this.mapDataPieces = new Array(mapTotalCount).fill(false);
        // mapinfo returns the total compressed string in several pieces, stores the CRC value of the concatenated string for comparison
        this.initCanvas();
    }

    updateMapPiece(pieceIndex, pieceStartX, pieceStartY, pieceWidth, pieceHeight, pieceCrc, pieceValue, checkPieceCrc = true) {
        // TODO: currently only validated with one piece (StartX=0 and StartY=0)
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }

        if (checkPieceCrc && (this.mapDataPiecesCrc !== pieceCrc)) { // CRC has changed, so invalidate all pieces and return
            this.mapDataPiecesCrc = pieceCrc;
            this.mapDataPieces.fill(false);
            this.mapDataPieces[pieceIndex] = pieceValue;
            return null; // Nothing to process as not all pieces are received yet
        } else {
            if (!this.mapDataPieces.every(Boolean)) { // Not all pieces have been received
                this.mapDataPieces[pieceIndex] = pieceValue;
                if (!this.mapDataPieces.every(Boolean)) { // If still not all pieces have been received return
                    return null; // Nothing to process as not all pieces are received yet
                } else { // Last piece received
                    this.transferMapInfo = true;
                }
            } else { // All pieces have been received already, so only transfer once per new onMapInfo series
                if (pieceIndex === 0) {
                    this.transferMapInfo = true;
                }
            }
        }
        this.drawMapPieceToCanvas(this.mapDataPieces.join(''), pieceStartX, pieceStartY, pieceWidth, pieceHeight);
    }
}

class EcovacsMap {
    constructor(mapID, mapIndex, mapName, mapStatus, mapIsCurrentMap = 1, mapIsBuilt = 1) {
        this.mapID = mapID;
        this.mapIndex = mapIndex;
        this.mapName = mapName;
        this.mapStatus = mapStatus;
        this.mapIsCurrentMap = Number(mapIsCurrentMap) === 1 ? true : false;
        this.mapIsBuilt = Number(mapIsBuilt) === 1 ? true : false;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapIndex: this.mapIndex,
            mapName: this.mapName,
            mapStatus: this.mapStatus,
            mapIsCurrentMap: this.mapIsCurrentMap,
            mapIsBuilt: this.mapIsBuilt
        };
    }
}

class EcovacsMapSpotAreas {
    constructor(mapID, mapSetID) {
        this.mapID = mapID;
        this.mapSetID = mapSetID;
        this.mapSpotAreas = [];
    }

    push(mapSpotArea) {
        this.mapSpotAreas.push(mapSpotArea);
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSetID: this.mapSetID,
            mapSpotAreas: this.mapSpotAreas
        };
    }
}

class EcovacsMapSpotArea {
    constructor(mapSpotAreaID) {
        this.mapSpotAreaID = mapSpotAreaID;
    }

    toJSON() {
        return {
            mapSpotAreaID: this.mapSpotAreaID
        };
    }
}

class EcovacsMapSpotAreaInfo {
    constructor(mapID, mapSpotAreaID, mapSpotAreaConnections, mapSpotAreaBoundaries, mapSubType = "0", customName = "") {
        this.mapID = mapID;
        this.mapSpotAreaID = mapSpotAreaID;
        if (customName !== "") {
            this.mapSpotAreaName = customName;
        } else if ((mapSubType === "0") || !SPOTAREA_SUBTYPES[mapSubType]["en"]) {
            // if default naming or ID not found in list of names
            // return character representation (0=A, 1=B, etc.)
            this.mapSpotAreaName = String.fromCharCode(65 + parseInt(mapSpotAreaID));
        } else {
            this.mapSpotAreaName = SPOTAREA_SUBTYPES[mapSubType]["en"]; //#LANG#
        }
        this.mapSpotAreaConnections = mapSpotAreaConnections;
        this.mapSpotAreaBoundaries = mapSpotAreaBoundaries;
        this.mapSpotAreaCanvas = createCanvasFromCoordinates(mapSpotAreaBoundaries);
        this.mapSpotAreaSubType = mapSubType;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSpotAreaID: this.mapSpotAreaID,
            mapSpotAreaName: this.mapSpotAreaName,
            mapSpotAreaConnections: this.mapSpotAreaConnections,
            mapSpotAreaBoundaries: this.mapSpotAreaBoundaries,
            mapSpotAreaSubType: this.mapSpotAreaSubType
        };
    }
}

class EcovacsMapVirtualBoundaries {
    constructor(mapID) {
        this.mapID = mapID;
        this.mapVirtualWalls = [];
        this.mapNoMopZones = [];
    }

    push(mapVirtualBoundary, mapVirtualBoundaryType = 'vw') {
        if (mapVirtualBoundaryType === 'vw') {
            this.mapVirtualWalls.push(mapVirtualBoundary);
        } else if (mapVirtualBoundaryType === 'mw') {
            this.mapNoMopZones.push(mapVirtualBoundary);
        }
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualWalls: this.mapVirtualWalls,
            mapNoMopZones: this.mapNoMopZones
        };
    }
}

class EcovacsMapVirtualBoundary {
    constructor(mapVirtualBoundaryID, mapVirtualBoundaryType) {
        this.mapVirtualBoundaryID = mapVirtualBoundaryID;
        this.mapVirtualBoundaryType = mapVirtualBoundaryType;
    }

    toJSON() {
        return {
            mapVirtualBoundaryID: this.mapVirtualBoundaryID,
            mapVirtualBoundaryType: this.mapVirtualBoundaryType
        };
    }
}

class EcovacsMapVirtualBoundaryInfo {
    constructor(mapID, mapVirtualBoundaryID, mapVirtualBoundaryType, mapVirtualBoundaryCoordinates) {
        this.mapID = mapID;
        this.mapVirtualBoundaryID = mapVirtualBoundaryID;
        this.mapVirtualBoundaryType = mapVirtualBoundaryType;
        this.mapVirtualBoundaryCoordinates = mapVirtualBoundaryCoordinates;
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapVirtualBoundaryID: this.mapVirtualBoundaryID,
            mapVirtualBoundaryType: this.mapVirtualBoundaryType,
            mapVirtualBoundaryCoordinates: this.mapVirtualBoundaryCoordinates
        };
    }
}

function createCanvasFromCoordinates(coordinates, width = 100, height = 100, style = {}) {
    if (!tools.isCanvasModuleAvailable()) {
        return null;
    }
    let coordinateArray = coordinates.split(";");

    const {createCanvas} = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    for (let i = 0; i < coordinateArray.length; i++) {
        let xi = coordinateArray[i].split(',')[0];
        let yi = coordinateArray[i].split(',')[1];
        if (i === 0) {
            ctx.moveTo(xi, yi);
        } else {
            ctx.lineTo(xi, yi);
        }
    }
    ctx.closePath();
    return canvas;
}

// converts the compressed data retrieved from ecovacs API into int array containing the map pixels
// thanks to https://gitlab.com/michael.becker/vacuumclean/-/blob/master/deebot/deebot-core/README.md#map-details
function mapPieceToIntArray(pieceValue) {
    const fixArray = new Int8Array([0, 0, 0, 0]);
    let buff = Buffer.from(pieceValue, 'base64');
    let int8Array = new Int8Array(buff.buffer, buff.byteOffset, buff.length);
    //fix 9 byte header to 13 bytes for lzma decompression
    let correctedArray = [...int8Array.slice(0, 9), ...fixArray, ...int8Array.slice(9)];
    //decompress
    return lzma.decompress(correctedArray)
}

function getRotatedCanvasFromImage(image, angle) {
    const {createCanvas} = require('canvas');
    let rotatedCanvas = createCanvas(image.width, image.height);
    let rotatedContext = rotatedCanvas.getContext("2d");
    rotatedContext.translate(image.width / 2, image.height / 2);
    rotatedContext.rotate(angle * (Math.PI / 180));
    rotatedContext.translate(-image.width / 2, -image.height / 2);
    rotatedContext.drawImage(image, 0, 0);

    return rotatedCanvas;
}

function getMapObject(mapDataObject, mapID) {
    if (mapDataObject == null) {
        return null;
    }
    return mapDataObject.find((map) => {
        return map.mapID === mapID;
    });
}

function getCurrentMapObject(mapDataObject) {
    if (mapDataObject == null) {
        return null;
    }
    return mapDataObject.find((map) => {
        return map.mapIsCurrentMap === true;
    });
}

function getSpotAreaObject(mapDataObject, mapID, spotAreaID) {
    if (mapDataObject == null) {
        return null;
    }
    const mapSpotAreasObject = mapDataObject.find((map) => {
        return map.mapID === mapID;
    }).mapSpotAreas;
    if (mapSpotAreasObject) {
        return mapSpotAreasObject.find((spotArea) => {
            return spotArea.mapSpotAreaID === spotAreaID;
        });
    }
    return null;
}

function getVirtualBoundaryObject(mapDataObject, mapID, virtualBoundaryID) {
    if (mapDataObject == null) {
        return null;
    }
    const mapVirtualBoundariesObject = mapDataObject.find((map) => {
        return map.mapID === mapID;
    }).mapVirtualBoundaries;
    if (mapVirtualBoundariesObject) {
        return mapVirtualBoundariesObject.find((virtualBoundary) => {
            return virtualBoundary.mapVirtualBoundaryID === virtualBoundaryID;
        });
    }
    return null;
}

module.exports.EcovacsMap = EcovacsMap;
module.exports.EcovacsMapImage = EcovacsMapImage;
module.exports.EcovacsLiveMapImage = EcovacsLiveMapImage;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapSpotArea = EcovacsMapSpotArea;
module.exports.EcovacsMapSpotAreaInfo = EcovacsMapSpotAreaInfo;
module.exports.EcovacsMapVirtualBoundaries = EcovacsMapVirtualBoundaries;
module.exports.EcovacsMapVirtualBoundary = EcovacsMapVirtualBoundary;
module.exports.EcovacsMapVirtualBoundaryInfo = EcovacsMapVirtualBoundaryInfo;
module.exports.getMapObject = getMapObject;
module.exports.getCurrentMapObject = getCurrentMapObject;
module.exports.getSpotAreaObject = getSpotAreaObject;
module.exports.getVirtualBoundaryObject = getVirtualBoundaryObject;
module.exports.mapPieceToIntArray = mapPieceToIntArray;
module.exports.mapDataObject = mapDataObject;
