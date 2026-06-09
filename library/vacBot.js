'use strict';

/**
 * @deprecated Back-compat shim. The class was renamed `VacBot` → `EcovacsDevice`
 * and moved to `./ecovacsDevice`. This module re-exports it so existing deep
 * requires (`require('ecovacs-deebot/library/vacBot')`) keep working.
 * Prefer requiring `./ecovacsDevice` (or the public `EcovacsDevice` export).
 */
module.exports = require('./ecovacsDevice');
