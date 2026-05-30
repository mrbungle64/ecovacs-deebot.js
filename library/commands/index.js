'use strict';

const { VacBotCommand } = require('./base');
const clean = require('./clean');
const map = require('./map');
const info = require('./info');
const settings = require('./settings');
const movement = require('./movement');

module.exports = VacBotCommand;
Object.assign(module.exports,
    clean,
    map,
    info,
    settings,
    movement,
    { SpotPurification: clean.MapPoint_V2 }
);
