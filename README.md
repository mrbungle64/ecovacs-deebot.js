# ecovacs-deebot.js

[![npm](http://img.shields.io/npm/v/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![npm](https://img.shields.io/npm/dm/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![npm](https://img.shields.io/npm/dt/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Travis-CI](https://travis-ci.org/mrbungle64/ecovacs-deebot.js.svg?branch=master)](https://travis-ci.org/mrbungle64/ecovacs-deebot.js)

A Node.js library for running Ecovacs Deebot vacuum cleaner robots.

## Installation

This library uses the canvas library which might require additional installations.
For the full functional range please install the following packages.

For Debian-based Linux systems the following commands should be executed:
```bash
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```
A reboot might be necessary before executing the next command
```bash
sudo npm install canvas --unsafe-perm=true
```
For instructions for other systems visit https://www.npmjs.com/package/canvas#compiling

Afterwards you can install the library with
```bash
npm install ecovacs-deebot
```

## Usage

Information on how to use this library can be found [here](https://github.com/mrbungle64/ecovacs-deebot.js/wiki).

## Models

### Supported models
* Deebot 900/901
* Deebot Ozmo 930
* Deebot Ozmo 950

### These models are known to work
* Deebot Slim 2
* Deebot N79
* Deebot 600/601
* Deebot 710/711
* Deebot Ozmo 610
* Deebot Ozmo 900
* Deebot Ozmo 920
* Deebot Ozmo T8 AIVI
* Deebot Ozmo Slim 10

### These models should work
* Deebot M88
* Deebot 605
* Deebot Ozmo 960
* Deebot Ozmo T8 (+)

## Changelog

### 0.4.23
* (mrbungle64) Added support for Ozmo T8+

### 0.4.22
* (boriswerner) Added new spotAreaNames (950 type)

### 0.4.21
* Update some dependencies
* Bugfix for Ozmo T8 (without AIVI)

### 0.4.20
* Removed canvas from dependencies

### 0.4.19
* Added support for Ozmo T8 (without AIVI)

### 0.4.18
* Update dependencies
* ResetLifeSpan and SetLifeSpan (non Ozmo 950)

### 0.4.17
* Several enhancements and fixes. Especially for N79S/SE and N79T/W

### 0.4.16
* Bugfix release

### 0.4.15
* Added configuration for Ozmo T8 AIVI

### 0.4.14
* Initial Support for Ozmo T8 AIVI

### 0.4.13
* (boriswerner) Emit error on missing cleanlog (Ozmo 920/950)

### 0.4.12
* (boriswerner) Control which API call is used for lastCleanMap & timestamp (Ozmo 920/950)

### 0.4.11
* Several enhancements and fixes

### 0.4.10
* Several minor changes

### 0.4.9
* Bugfix release

### 0.4.8
* Implemented cleaning logs

### 0.4.7
* Several enhancements and fixes

### 0.4.6
* (nicoduj) Bugfix release

### 0.4.5
* (nicoduj) Fixed `Failure code 0002` error
* Implemented move commands
* Some work on implementation of handling cleanLogs
* Several enhancements and fixes

### 0.4.4
* Added support for Ozmo 920

### 0.4.3
* (mrbungle64) Several enhancements and fixes

### 0.4.2
* (mrbungle64) Added map/spotArea template and functionality for Ozmo 930 and Deebot 900/901
* (mrbungle64) Improved handling command response and MQTT messages

### 0.4.1
* Several enhancements and fixes

### 0.4.0
* (boriswerner) Added map/spotArea template and functionality
* (boriswerner) Added enhanced map/spotArea functionality for Ozmo 950

### 0.3.9
* Several enhancements and fixes

### 0.3.8
* Several enhancements and fixes

### 0.3.7
* (mrbungle64) Bugfixes and some improvements (MQTT/XML)

### 0.3.6
* (mrbungle64) A few changes and fixes

### 0.3.5
* (mrbungle64) Bugfixes for CleanReport (Ozmo 950), DeebotPosition and ChargePosition (XMPP devices)
  
### 0.3.4
* (mrbungle64) GetPos, GetChargePos (XMPP), DustCaseST (MQTT/XML)
* (boriswerner) setCleanSpeed standardized to numeric 1-4

### 0.3.3
* (mrbungle64) Bugfixes (MQTT/XML)
* (mrbungle64) Start implement NetInfo (XMPP)

### 0.3.2
* (boriswerner) Added Features for Ozmo 950
* (mrbungle64) Some improvements for non Ozmo 950

### 0.3.1
* A few changes and improvements

### 0.3.0
* (boriswerner) Separation of Ozmo 950 type bots (MQTT/JSON) from others (MQTT/XML and XMPP)

### 0.2.7
* (mrbungle64) Improved handling of messages (MQTT/XML)

### 0.2.7
* (mrbungle64) Improved handling of messages (MQTT/XML)
  
### 0.2.3
* (boriswerner) Improved support for Ozmo 950

### 0.2.2
* (mrbungle64) Bugfix release

### 0.2.1
* (boriswerner) Basic clean & charge working (Ozmo 950)

### 0.2.0
* (boriswerner) Improved support for Ozmo 950

### 0.1.11
* (mrbungle64) Bugfix release

### 0.1.8
* (mrbungle64) Improved support for MQTT devices
* (mrbungle64) Implemented support for Ozmo 950

### 0.1.7
* (mrbungle64) Bugfix detecting MQTT devices
* (mrbungle64) Register features of known and supported models

### 0.1.6
* (mrbungle64) Fix package-lock.json
* (mrbungle64) A few minor changes

### 0.1.5
* (mrbungle64) Bugfix
* (mrbungle64) A few minor changes

### 0.1.4
* (mrbungle64) Implemented GetWaterLevel command
* (mrbungle64) Implemented SetWaterLevel command

### 0.1.3
* (mrbungle64) Implemented GetLifeSpan command

### 0.1.2
* (mrbungle64) Implemented SpotArea command
* (mrbungle64) Implemented CustomArea command

### 0.1.1
* (mrbungle64) Implemented PlaySound command

### 0.1.0
* (mrbungle64) Deebot Ozmo 930 is working

### 0.0.2
* (mrbungle64) Initial development release

## Thanks and credits

* @joostth ([sucks.js](https://github.com/joostth/sucks.js))
* @wpietri ([sucks](https://github.com/wpietri/sucks))
* @bmartin5692 ([sucks](https://github.com/bmartin5692/sucks), [bumber](https://github.com/bmartin5692/bumper))
* @Ligio ([ozmo](https://github.com/Ligio/ozmo))
* @And3rsL ([Deebotozmo](https://github.com/And3rsL/Deebotozmo))

All credits for originally figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## License

GNU GENERAL PUBLIC LICENSE
