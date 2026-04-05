![Logo](ecovacs-deebot.png)

# ecovacs-deebot.js

[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/latest?label=stable)](https://www.npmjs.com/package/ecovacs-deebot)
[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/beta?label=beta)](https://www.npmjs.com/package/ecovacs-deebot/v/beta)
[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/alpha?label=alpha)](https://www.npmjs.com/package/ecovacs-deebot/v/alpha)
[![Number of monthly downloads](https://img.shields.io/npm/dm/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Number of downloads](https://img.shields.io/npm/dt/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![github-workflow](https://github.com/mrbungle64/ecovacs-deebot.js/actions/workflows/node.js.yml/badge.svg)](https://github.com/mrbungle64/ecovacs-deebot.js)

Library for running Ecovacs Deebot (and also some yeedi) vacuum cleaner robots

## Installation

Information on how to install this library can be found [here](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Installation).

The minimum required version of Node.js is 20.x.

## Usage

Information on how to use this library can be found [here](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Usage).

## Models

### Supported models

The following models I own myself, so they are very widely supported:

* Deebot OZMO 920/950
* Deebot OZMO T8 AIVI
* Deebot X1 Turbo
* Airbot Z1

### Other models

The following models should work properly or at least partially.
They are either already known to work or are technically similar to these models.
Nevertheless, the functionality may be partially limited.

I try to achieve a wide range of functionality, but decide this case by case depending on complexity and various other criteria.
There is of course no claim to full functionality.

#### Ecovacs Deebot

* Deebot N8 series
* Deebot T8 series
* Deebot T9 series
* Deebot T10 series
* Deebot T20 series
* Deebot X1 series
* Deebot X2 series

#### yeedi

* yeedi k650
* yeedi 2 hybrid
* yeedi vac hybrid
* yeedi vac max
* yeedi vac 2 pro
* yeedi mop station

#### Legacy models (soon to be discontinued)

These models use XML for data transport and also different characteristics for commands and events than the current models.
I also don't use my Slim 2, Deebot 901 and OZMO 930 anymore.

**Support for these models will therefore be discontinued sooner or later**

* Deebot Slim 2
* Deebot N79 series
* Deebot M88
* Deebot 500
* Deebot 600/601/605
* Deebot 710/711
* Deebot 900/901
* Deebot OZMO 610
* Deebot OZMO 900/905
* Deebot OZMO 930
* Deebot OZMO Slim 10/11

**Note**: All these lists may not be fully complete

## Known issues

* The "move" function varies from model to model, so I won't implement it universally
* The generation of map images is not stable on 32-bit systems
* and it still does not work properly with the Deebot X1 series and other current models

## Changelog

### 0.9.6 (beta)
* Breaking change: Bumped minimum required version of Node.js to 20.x
* (RonnyWinkler) Added auto V2 API handling
* Added some new models to the model dictionary (incl. T20, T30, T80, X2 and X8 series)
* Added shortcut commands for sweep mode
* A lot of improvements for Airbot Z1 and Air Quality Monitor
* and also some improvements for T20 series and X2 series
* Some clean-up and refactoring
* Added new example app for output of incoming messages
* Some further improvements and fixes
* Updated dependencies

### 0.0.2 - 0.9.5
* [Changelog archive](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Changelog-(archive))

## Thanks and credits

* @joostth ([sucks.js](https://github.com/joostth/sucks.js))
* @wpietri ([sucks](https://github.com/wpietri/sucks))
* @bmartin5692 ([sucks](https://github.com/bmartin5692/sucks), [bumber](https://github.com/bmartin5692/bumper))
* @Ligio ([ozmo](https://github.com/Ligio/ozmo))
* @And3rsL ([Deebotozmo](https://github.com/And3rsL/Deebotozmo))
* @edenhaus ([Client Library for Deebot Vacuums](https://github.com/DeebotUniverse/client.py), [Deebot-4-Home-Assistant](https://github.com/DeebotUniverse/Deebot-4-Home-Assistant))

All credits for originally figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## Disclaimer

I am in no way affiliated with Ecovacs Robotics Co., Ltd. or yeedi Technology Limited.

## License

GNU GENERAL PUBLIC LICENSE

Copyright (c) 2025 Sascha Hölzel <mrb1232@posteo.de>
