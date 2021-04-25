const tools = require('./tools.js');
const lzma = require('lzma')
const constants = require('./ecovacsConstants');

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

class EcovacsMapImage {
    mapCanvas;
    mapContext;
    offset = 400; //the positions of the chargers and the deebots need an offset of 400 pixels, #TODO: make e.g. static to use in other map classes
    cropBoundaries = {
        minX: null,
        minY: null,
        maxX: null,
        maxY: null
    };

    constructor(mapID, mapType, mapTotalWidth, mapTotalHeight, mapPixel, mapTotalCount){
        this.mapID = mapID;
        this.mapType = constants.MAPINFOTYPE_FROM_ECOVACS[mapType];
        this.mapTotalWidth = mapTotalWidth;
        this.mapTotalHeight = mapTotalHeight;
        this.mapPixel = mapPixel;
        this.mapTotalCount = mapTotalCount;
        
        //mapinfo returns the total compressed string in several pieces, stores the string pieces for concatenation
        this.mapPieces = new Array(mapTotalCount).fill(false);
        //mapinfo returns the total compressed string in several pieces, stores the CRC value of the concatenated string for comparison 
        this.mapPiecesCrc; 
        this.initCanvas();
    }

    initCanvas() {
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }
        const {createCanvas} = require('canvas');
        this.mapCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
        this.mapContext = this.mapCanvas.getContext("2d");
        this.mapContext.globalAlpha = 1;
        this.mapContext.beginPath();
    }

    updateMapPiece(pieceIndex, pieceStartX, pieceStartY, pieceWidth, pieceHeight, pieceCrc, pieceValue) { 
        //#TODO: currently only validated with one piece (StartX=0 and StartY=0)
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }

        if(this.mapPiecesCrc != pieceCrc) { //CRC has changed, so invalidate all pieces and return
            this.mapPiecesCrc = pieceCrc;
            this.mapPieces.fill(false);
            this.mapPieces[pieceIndex] = pieceValue;
            return null; //nothing to process as not all pieces are received yet
        } else {
            if(!this.mapPieces.every(Boolean)) { //not all pieces have been received
                this.mapPieces[pieceIndex] = pieceValue;
                if(!this.mapPieces.every(Boolean)) { //if still not all pieces have been received return
                    return null; //nothing to process as not all pieces are received yet
                } else { //last piece received
                    this.transferMapInfo = true;
                }
            } else { //all pieces have been received already, so only transfer once per new onMapInfo series
                if(pieceIndex == 0) {
                    this.transferMapInfo = true;
                }
            }
        }
        
        let decompressedArray = mapPieceToIntArray(this.mapPieces.join(''));
        //#TODO: extract to separate function for reuse with livemap
        for (let row = 0; row < pieceWidth; row++) {
            for (let column = 0; column < pieceHeight; column++) {
                let bufferRow = row + pieceStartX * pieceWidth;
                let bufferColumn = column + pieceStartY * pieceHeight;
                let pieceDataPosition = pieceWidth * row + column;
                let pixelValue = decompressedArray[pieceDataPosition];
                
                if(pixelValue == 0) { //No data
                    this.mapContext.clearRect(bufferRow, bufferColumn, 1, 1);
                } else {
                    //checkCropBoundaries 
                    if (this.cropBoundaries.minY === null) {this.cropBoundaries.minY = bufferColumn;} else if (bufferColumn < this.cropBoundaries.minY) {this.cropBoundaries.minY = bufferColumn;}
                    if (this.cropBoundaries.minX === null) {this.cropBoundaries.minX = bufferRow; } else if (bufferRow < this.cropBoundaries.minX) {this.cropBoundaries.minX = bufferRow;}
                    if (this.cropBoundaries.maxX === null) {this.cropBoundaries.maxX = bufferRow; } else if (this.cropBoundaries.maxX < bufferRow) {this.cropBoundaries.maxX = bufferRow;}
                    if (this.cropBoundaries.maxY === null) {this.cropBoundaries.maxY = bufferColumn;} else if (this.cropBoundaries.maxY < bufferColumn) {this.cropBoundaries.maxY = bufferColumn;}
                    
                    //#TODO: make colors customizable
                    if(pixelValue == 1) { //Floor
                        this.mapContext.fillStyle = "#badbff";
                    } else if(pixelValue == 2) { //Wall
                        this.mapContext.fillStyle = "#5095e1";
                    } else if(pixelValue == 3) { //Carpet
                        this.mapContext.fillStyle = "#b0cceb";
                    } else if(pixelValue == 4) { //Wifi not covered
                        this.mapContext.fillStyle = "#d6d6d6";
                    
                    } else if (pixelValue>10 && pixelValue <= 20) {  //Wifi coverage 1=strong
                        this.mapContext.fillStyle = "#7fbafb";  
                    } else if (pixelValue>20 && pixelValue <= 30) { //Wifi coverage 2
                        this.mapContext.fillStyle = "#a2cdfc";                
                    } else if (pixelValue>30 && pixelValue <= 40) { //Wifi coverage 3
                        this.mapContext.fillStyle = "#bbdafd";                
                    } else if (pixelValue>40 && pixelValue <= 50) { //Wifi coverage 4
                        this.mapContext.fillStyle = "#ddebfa";                
                    } else if (pixelValue>50) {        //Wifi coverage 5=weak
                        this.mapContext.fillStyle = "#f7fbff";                      
                    }

                    this.mapContext.fillRect(bufferRow, bufferColumn, 1, 1);
                } 
            }
        }
    }

    getBase64PNG(deebotPosition, chargerPosition, currentMapMID) {
        if (!tools.isCanvasModuleAvailable()) {
            return null;
        }
        if(!this.mapPieces.every(Boolean) || !this.transferMapInfo) { //check if all pieces were retrieved yet or data should not be transferred
            return null;
        };
        
        const {createCanvas} = require('canvas');
        let finalCanvas = createCanvas(this.mapTotalWidth, this.mapTotalHeight);
        let finalContext = finalCanvas.getContext("2d");
        //flip map horizontally before drawing everything else
        finalContext.translate(0, this.mapTotalHeight);
        finalContext.scale(1, -1);
        finalContext.drawImage(this.mapCanvas, 0, 0, this.mapTotalWidth, this.mapTotalHeight);
        
        if(this.mapID == currentMapMID) { //#TODO: getPos only retrieves (charger) position for current map, getPos_V2 can retrieve all charger positions
            const {Image} = require('canvas');
            if(typeof deebotPosition !== 'undefined' && !deebotPosition['isInvalid']) { //#TODO: draw other icon when position is invalid
                //Draw robot
                ////////////
                //#TODO: later on the deebot position should only be drawn in the livemap so the mapinfo-maps dont have to be updated with new positions
                //#TODO: replace with customizable icons
                //for now taken from https://github.com/iobroker-community-adapters/ioBroker.mihome-vacuum/blob/master/lib/mapCreator.js#L27
                const robotBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAfCAMAAAHGjw8oAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADbUExURQAAAICAgICAgICAgICAgICAgHx8fH19fX19fYCAgIGBgX5+foCAgH5+foCAgH9/f39/f35+foCAgH9/f39/f4CAgH5+foGBgYCAgICAgIGBgX9/f39/f35+foCAgH9/f39/f4CAgIODg4eHh4mJiZCQkJycnJ2dnZ6enqCgoKSkpKenp62trbGxsbKysry8vL29vcLCwsXFxcbGxsvLy87OztPT09XV1d/f3+Tk5Ojo6Ozs7O3t7e7u7vHx8fLy8vPz8/X19fb29vf39/j4+Pn5+f39/f7+/v///9yECocAAAAgdFJOUwAGChgcKCkzOT5PVWZnlJmfsLq7wcrS1Nre4OXz+vr7ZhJmqwAAAAlwSFlzAAAXEQAAFxEByibzPwAAAcpJREFUKFNlkolaWkEMhYPggliBFiwWhGOx3AqCsggI4lZt8/5P5ElmuEX5P5hMMjeZJBMRafCvUKnbIqpcioci96owTQWqP0QKC54nImUAyr9k7VD1me4YvibHlJKpVUzQhR+dmdTRSDUvdHh8NK8nhqUVch7cITmXA3rtYDmH+3OL4XI1T+BhJUcXczQxOBXJuve0/daeUr5A6g9muJzo5NI2kPKtyRSGBStKQZ5RC1hENWn6NSRTrDUqLD/lsNKoFTNRETlGMn9dDoGdoDcT1fHPi7EuUDD9dMBw4+6vMQVyInnPXDsdW+8tjWfbYTbzg/OstcagzSlb0+wL/6k+1KPhCrj6YFhzS5eXuHcYNF4bsGtDYhFLTOSMqTsx9e3iyKfynb1SK+RqtEq70RzZPwEGKwv7G0OK1QA42Y+HIgct9P3WWG9ItI/mQTgvoeuWAMdlTRclO/+Km2jwlhDvinGNbyJH6EWV84AJ1wl8JowejqTqTmv+0GqDmVLlg/wLX5Mp2rO3WRs2Zs5fznAVd1EzRh10OONr7hhhM4ctevhiVVxHdYsbq+JzHzaIfdjs5CZ9tGInSfoWEXuL7//fwtn9+Jp7wSryDjBFqnOGeuUxAAAAAElFTkSuQmCC";
                const robotImage = new Image(); // Create a new Image
                robotImage.src = robotBase64;
                //icon is facing upward, so add 90
                let robotCanvas = getRotatedCanvasFromImage(robotImage, deebotPosition['a']+90); //0=facing right, 90 = facing upwards, 180/-180 = facing left, -90 = facing downwards
                // icon size is 16*16, so subtract 8 pixels to coordinates for center 
                finalContext.drawImage(robotCanvas, (deebotPosition['x']/this.mapPixel)+this.offset-8, (deebotPosition['y']/this.mapPixel)+this.offset-8, 16, 16);
            }
            //Draw charger
            //////////////
            //#TODO: replace with customizable icons
            //for now taken from https://github.com/iobroker-community-adapters/ioBroker.mihome-vacuum/blob/master/lib/mapCreator.js#L28
            const charger = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAdVBMVEUAAAA44Yo44Yo44Yo44Yo44Yo44Yo44Yo44Yp26q844Yr///9767Kv89DG9t2g8Md26q5C44/5/vvz/fjY+ei19NNV5ZtJ45T2/fmY78KP7r1v6atq6Kjs/PPi+u7e+uvM9+Gb8MSS7r+H7bhm6KVh56JZ5p3ZkKITAAAACnRSTlMABTr188xpJ4aepd0A4wAAANZJREFUKM9VklmCgzAMQwkQYCSmLKWl2+zL/Y9YcIUL7wvkJHIUJyKkVcyy+JIGCZILGF//QLEqlTmMdsBEXi56igfH/QVGqvXSu49+1KftCbn+dtxB5LOPfNGQNRaKaQNkTJ46OMGczZg8wJB/9TB+J3nFkyqJMp44vBrnWYhJJmOn/5uVzAotV/zACnbUtTbOpHcQzVx8kxw6mavdpYP90dsNcE5k6xd8RoIb2Xgk6xAbfm5C9NiHtxGiXD/U2P96UJunrS/LOeV2GG4wfBi241P5+NwBnAEUFx9FUdUAAAAASUVORK5CYII=";
            const chargerImage = new Image();
            chargerImage.src = charger;
            // icon size is 16*16, so subtract 8 pixels to coordinates for center
            finalContext.drawImage(chargerImage, (chargerPosition['x']/this.mapPixel)+this.offset-8, (chargerPosition['y']/this.mapPixel)+this.offset-8, 16, 16);    
        }
        
        //crop image
        const croppedImage = finalContext.getImageData(this.cropBoundaries.minX
                , this.mapTotalHeight - this.cropBoundaries.maxY // map was flipped horizontally before, so the boundaries have shifted
                , this.cropBoundaries.maxX - this.cropBoundaries.minX
                , this.cropBoundaries.maxY - this.cropBoundaries.minY);
        finalContext.canvas.height = this.cropBoundaries.maxY - this.cropBoundaries.minY;
        finalContext.canvas.width = this.cropBoundaries.maxX - this.cropBoundaries.minX;
        finalContext.putImageData(croppedImage, 0, 0);
        this.mapBase64PNG = finalCanvas.toDataURL();
        this.transferMapInfo = false ; //transfer only once per onMapInfo event series
        //console.log('<img src="' + finalCanvas.toDataURL() + '" />');
        return {
            'mapID': this.mapID,
            'mapType': this.mapType,
            'mapBase64PNG': this.mapBase64PNG
        }
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
    constructor(mapID, mapSpotAreaID, mapSpotAreaConnections, mapSpotAreaBoundaries, mapSubType = "0") {
        this.mapID = mapID;
        this.mapSpotAreaID = mapSpotAreaID;
        if (mapSubType == "0" || !SPOTAREA_SUBTYPES[mapSubType]["en"]) {
            // if default naming or ID not found in list of names
            // return character representation (0=A, 1=B, etc.)
            this.mapSpotAreaName = String.fromCharCode(65 + parseInt(mapSpotAreaID));
        } else {
            this.mapSpotAreaName = SPOTAREA_SUBTYPES[mapSubType]["en"]; //#LANG#
        }
        this.mapSpotAreaConnections = mapSpotAreaConnections;
        this.mapSpotAreaBoundaries = mapSpotAreaBoundaries;
        this.mapSpotAreaCanvas = createCanvasFromCoordinates(mapSpotAreaBoundaries);
    }

    toJSON() {
        return {
            mapID: this.mapID,
            mapSpotAreaID: this.mapSpotAreaID,
            mapSpotAreaName: this.mapSpotAreaName,
            mapSpotAreaConnections: this.mapSpotAreaConnections,
            mapSpotAreaBoundaries: this.mapSpotAreaBoundaries
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
        if(mapVirtualBoundaryType === 'vw') {
            this.mapVirtualWalls.push(mapVirtualBoundary);
        } else if(mapVirtualBoundaryType === 'mw') {
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

function createCanvasFromCoordinates(coordinates, width = 100, height = 100) {
    if (!tools.isCanvasModuleAvailable()) {
        return null;
    }
    let coordinateArray = coordinates.split(";");
    const {createCanvas} = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    //ctx.translate(0, 2500);
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

//converts the compressed data retrieved from ecovacs API into int array containing the map pixels
//thanks to https://gitlab.com/michael.becker/vacuumclean/-/blob/master/deebot/deebot-core/README.md#map-details
function mapPieceToIntArray(pieceValue) {
    const fixArray = new Int8Array([0,0,0,0]);
    let buff = Buffer.from(pieceValue, 'base64');
    let int8Array = new Int8Array(buff.buffer, buff.byteOffset, buff.length);
    //fix 9 byte header to 13 bytes for lzma decompression
    let correctedArray = [...int8Array.slice(0,9), ...fixArray, ...int8Array.slice(9)];
    //console.log(correctedArray);
    //decompress
    let decompressedArray = lzma.decompress(correctedArray);
    //console.log(decompressedArray);
    return decompressedArray
}


function getRotatedCanvasFromImage (image, angle) {
    const {createCanvas} = require('canvas');
    let rotatedCanvas = createCanvas(image.width,image.height);
    let rotatedContext = rotatedCanvas.getContext("2d");
    rotatedContext.translate( image.width/2, image.height/2 );
    rotatedContext.rotate(angle * (Math.PI / 180));
    rotatedContext.translate( -image.width/2, -image.height/2 );
    rotatedContext.drawImage(image, 0, 0);
    
    // console.log('<p>'+angle+"</p>")
    // console.log('<img src="' + rotatedCanvas.toDataURL() + '" />')
    return rotatedCanvas;
}

module.exports.EcovacsMap = EcovacsMap;
module.exports.EcovacsMapImage = EcovacsMapImage;
module.exports.EcovacsMapSpotAreas = EcovacsMapSpotAreas;
module.exports.EcovacsMapSpotArea = EcovacsMapSpotArea;
module.exports.EcovacsMapSpotAreaInfo = EcovacsMapSpotAreaInfo;
module.exports.EcovacsMapVirtualBoundaries = EcovacsMapVirtualBoundaries;
module.exports.EcovacsMapVirtualBoundary = EcovacsMapVirtualBoundary;
module.exports.EcovacsMapVirtualBoundaryInfo = EcovacsMapVirtualBoundaryInfo;
module.exports.isPositionInSpotArea = isPositionInSpotArea;
