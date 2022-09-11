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

The minimum required version of Node.js is 14.x. It is recommended to use version 14.x or 16.x

## Usage

Information on how to use this library can be found [here](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Usage).

## Models

### Supported models

The supported models are those that I own myself:

* Deebot Slim 2
* Deebot 900/901
* Deebot OZMO 930
* Deebot OZMO 920/950
* Deebot T8 AIVI (T8 series)

### These models should work properly or at least partially

The following models are either already known to work or are technically similar to these models.
Nevertheless, the functionality may be partially limited.

I try to achieve a wide range of functionality, but decide this case by case depending on complexity and various other criteria.
There is of course no claim to full functionality.

#### Ecovacs Deebot

* Deebot N79 series
* Deebot M88
* Deebot 500
* Deebot 600/601/605
* Deebot 710/711
* Deebot OZMO 610
* Deebot OZMO 900/905
* Deebot OZMO Slim 10/11
* Deebot U2 series
* Deebot N8 series
* Deebot OZMO T5
* Deebot OZMO T10 Plus
* Deebot (OZMO) T8 series
* Deebot T9 series
* Deebot X1 series

#### yeedi (experimental)

* yeedi k650
* yeedi 2 hybrid
* yeedi vac hybrid
* yeedi mop station

## Known issues

* The generation of map images is currently not stable on 32-bit systems (e.g. most Raspberry Pi systems)
* The cleaning log has an empty result on T9 series
* "Edge" command does not work with Deebot U2 (starts auto clean instead)

## Changelog

### 0.9.0 (alpha)
* Bump minimum required version of Node.js to 14.x
* Bump dependencies

### 0.8.3
* Added initial support for yeedi login
* and also for a few models
  * yeedi k650
  * yeedi 2 hybrid
  * yeedi vac hybrid
  * yeedi mop station
* Added CurrentStats event for XMPP devices
* Added commands for air drying the wiper blades
* Added 'donotClean' for CustomArea_V2 command
* Bumped canvas to 2.9.3
* Some minor improvements

### 0.8.2
* Added Deebot T10 series
* Some minor improvements

### 0.8.1
* Handle FwBuryPoint messages (e.g. T8/T9 series, experimental)
* Handle some additional events (e.g. T8/T9 series)
* Added commands to enable/disable Clean Preference (e.g. T8/T9 series)
* Some fixes and improvements
* Updated dependencies

### 0.8.0
* (m8schmit) Added types for TypeScript
* Lots of code documentation
* Lots of code improvements
* Added some new models to config
* Added unit care to LifeSpan components
* Added current spot area name to the events
* Implemented getCleanCount/setCleanCount command
* Add CurrentSpotAreas and CurrentCustomAreaValues events
* Some fixes
* Updated dependencies

### 0.7.2
* Bumped mqtt to 4.3.6
* Stability improvements
* A lot of code refactoring
* Bumped several dependencies
* Switched to axios

### 0.7.1
* Bumped mqtt to 4.3.4
* Bumped xmldom to 0.8.0
* Bumped follow-redirects to 1.14.7 (fix for CVE-2022-0155)

### 0.7.0
* Bumped required Node.js version to 12
* Added some new models
* Implement ContinuousCleaning and ContinuousCleaning commands (950 type models)
* Start implementing V2 commands (e.g. T8 and T9 series)
* Some minor changes and improvements
* Fix for Deebot 710 series
* Added Deebot X1 series

### 0.6.8
* Some minor changes and improvements
* Added Deebot 500

### 0.6.7
* (juliangsibecas) Added support for accounts from South America
* (juliangsibecas) Updated the lookup table for countries of Africa, Antarctica, South America and Oceania
* Many improvements to the example apps
* Add new example app for map related infos
* Implemented GetDistanceToChargingStation command
* Some refactoring
* Added Deebot 661

### 0.6.3 - 0.6.6
* Some Bugfixes and improved error handling when sending requests

### 0.6.2
* Lots of refactoring, code improvements and some fixes
* Added some wrapper [functions](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Shortcut-functions) for controlling the bot
* Switch to @xmldom/xmldom (bump xmldom from 0.6.0 to 0.7.2)

### 0.6.1
* Added full map data (maps, spot areas, virtual boundaries) as one structured event
* (boriswerner) Implementation of a static map image (incl. bot and charging position)
* Initial map image support for non 950 type models
* Handle compressed spot area boundary data (e.g. T9 series)
* Handle custom names for spot areas (e.g. T9 series)
* Implemented DoNotDisturb and AdvanceMode commands (950 type models)
* Implemented TrueDetect commands (models with TrueDetect 3D)
* Implemented EmptyDustBin command for models with suction station (e.g. T8+/plus)
* Implemented GetSchedule command
* Added messageReceived event
* Added N8 PRO+, N9+, T9 AIVI Plus
* Some enhancements and fixes

### 0.6.0
* Updated login process (credits to [@And3rsL](https://github.com/And3rsL))
* Support for Chinese server login
* Implemented AutoEmpty commands for models with suction station (e.g. T8+/plus)
* Added some cleaning log values and cleaning stats
* Initial support for some more models (e.g. N3, N7, N8, T9 series)
* Improved example apps
* (dbochicchio) Added some structured events
* Quite a lot refactoring and code consolidation
* Several improvements and fixes
* Bump some dependencies

### 0.5.6
* Some improvements for handling charge status

### 0.5.5
* Added OZMO T5 and some more T8 models
* Several enhancements and fixes

### 0.5.4
* Some fixes for cleaning log (non 950 type)

### 0.5.3
* Some refactoring and code improvements

### 0.5.2
* Implemented ResetLifeSpan, SetVolume and GetVolume for 950 type models
* Implemented OnOff for non 950 type MQTT models
* Implemented method to get translated spot area names
* Bump some dependencies
* Several enhancements and fixes

### 0.5.1
* Initial support for Deebot U2 series
* Improved support for T8 models
* Improved handling of device classes
* (boriswerner) Fixed cleaning log for 950 type models
* (boriswerner) VirtualBoundaries handling

### 0.5.0
* Lots of code refactoring
* Fix problem running multiple devices
* Added support for more Ozmo T8 models

### 0.0.2 - 0.4.26
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

I am in no way affiliated with ECOVACS.

## License

GNU GENERAL PUBLIC LICENSE

Copyright (c) 2022 Sascha Hölzel <mrb1232@posteo.de>
