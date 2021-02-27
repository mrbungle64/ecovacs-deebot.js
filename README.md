![Logo](ecovacs-deebot.png)

# ecovacs-deebot.js

[![npm](http://img.shields.io/npm/v/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![npm](https://img.shields.io/npm/dm/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![npm](https://img.shields.io/npm/dt/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Dependency Status](https://img.shields.io/david/mrbungle64/ecovacs-deebot.js.svg)](https://david-dm.org/mrbungle64/ecovacs-deebot.js)
[![Travis-CI](https://travis-ci.org/mrbungle64/ecovacs-deebot.js.svg?branch=master)](https://travis-ci.org/mrbungle64/ecovacs-deebot.js)

Library for running Ecovacs Deebot vacuum cleaner robots

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

If you want to install this library explicitly without canvas you can install it with
```bash
npm install ecovacs-deebot --no-optional
```

It is recommended to use version 10.x, 12.x or 14.x of Node.js. The minimum required version is 10.x

## Usage

Information on how to use this library can be found [here](https://github.com/mrbungle64/ecovacs-deebot.js/wiki).

## Models

### Supported models

* Deebot 901
* Deebot OZMO 920
* Deebot OZMO 930
* Deebot OZMO 950

### These models should work properly or at least partially

* Deebot Slim 2
* Deebot N79 series
* Deebot M88
* Deebot 600/601/605
* Deebot 710/711/711s
* Deebot 900
* Deebot OZMO 610
* Deebot OZMO 900
* Deebot OZMO T5
* Deebot OZMO T8 series
* Deebot OZMO Slim 10
* Deebot N3 MAX
* Deebot N7
* Deebot N8 series
* Deebot U2 series

## Known issues

* There's a strange behavior of the battery value on Deebot 900/901. It's very likely that this is a firmware bug
* Some cleaning commands may not work with Deebot 710/711/711s
* "Edge" command does not work with Deebot U2 (starts auto clean instead)

## Changelog

### 0.6.0 (alpha)
* Updated login process (credits to [@And3rsL](https://github.com/And3rsL))
* Support for Chinese server login
* Implemented AutoEmpty commands for T8+/plus
* Initial support for some more models (e.g. N3, N7 and N8 series)

### 0.5.6
* Some improvements for handling charge status

### 0.5.5
* Added OZMO T5 and some more T8 models
* Several enhancements and fixes

### 0.5.4
* Some fixes for cleaning logs (non 950 type)

### 0.5.3
* Some refactoring and code improvements

### 0.5.2
* Implement ResetLifeSpan, SetVolume and GetVolume for 950 type models
* Implement OnOff for non 950 type MQTT models
* Implement method to get translated spot area names
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

### 0.4.24 - 0.4.26
* Bugfix releases

### 0.4.23
* Added support for Ozmo T8+

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

### 0.4.14 - 0.4.15
* Added support for Ozmo T8 AIVI

### 0.4.13
* (boriswerner) Emit error on missing cleanlog (Ozmo 920/950)

### 0.4.12
* (boriswerner) Control which API call is used for lastCleanMap & timestamp (Ozmo 920/950)

### 0.4.11
* Several enhancements and fixes

### 0.4.6 - 0.4.10
* Implemented cleaning logs
* Several enhancements and fixes

### 0.4.5
* (nicoduj) Fixed `Failure code 0002` error
* Implemented move commands
* Some work on implementation of handling cleanLogs
* Several enhancements and fixes

### 0.4.4
* Added support for Ozmo 920

### 0.4.1 - 0.4.3
* Added map/spotArea template and functionality for Ozmo 930 and Deebot 900/901
* Improved handling command response and MQTT messages
* Several enhancements and fixes

### 0.4.0
* (boriswerner) Added map/spotArea template and functionality
* (boriswerner) Added enhanced map/spotArea functionality for Ozmo 950

### 0.0.2 - 0.3.9
* [Changelog archive](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Changelog-(archive)#039)

## Thanks and credits

* @joostth ([sucks.js](https://github.com/joostth/sucks.js))
* @wpietri ([sucks](https://github.com/wpietri/sucks))
* @bmartin5692 ([sucks](https://github.com/bmartin5692/sucks), [bumber](https://github.com/bmartin5692/bumper))
* @Ligio ([ozmo](https://github.com/Ligio/ozmo))
* @And3rsL ([Deebotozmo](https://github.com/And3rsL/Deebotozmo))

All credits for originally figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## Disclaimer

I am in no way affiliated with ECOVACS.

## License

GNU GENERAL PUBLIC LICENSE

Copyright (c) 2021 Sascha Hölzel <mrb1232@posteo.de>
