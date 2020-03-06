# ecovacs-deebot.js

[![NPM version](http://img.shields.io/npm/v/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Downloads](https://img.shields.io/npm/dm/ecovacs-deebot.svg)](https://www.npmjs.com/package/ecovacs-deebot)
[![Travis-CI](https://travis-ci.org/mrbungle64/ecovacs-deebot.js.svg?branch=master)](https://travis-ci.org/mrbungle64/ecovacs-deebot.js)

A JavaScript port based on [sucks.js](https://github.com/joostth/sucks.js) of the python project [sucks](https://github.com/wpietri/sucks) and [ozmo](https://github.com/Ligio/ozmo)
to drive an Ecovacs Deebot (Ozmo) robot vacuum.

All credits for figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## Installation

	npm install ecovacs-deebot
	
## Models

### Theses models are known to work
* Deebot Slim 2
* Deebot 601
* Deebot 710/711
* Deebot 900/901
* Deebot Ozmo 610
* Deebot Ozmo 930
* Deebot Ozmo 950

### These models should work partially
* Deebot Ozmo 900

### These models should work
* Deebot N79T
* Deebot 600/605

## Usage

Information on how to use this library can be found [here](https://github.com/mrbungle64/ecovacs-deebot.js/wiki).

## Releases

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
  * Bugfix release

### 0.2.1
  * (boriswerner) Basic clean & charge working (Ozmo 950)

### 0.2.0
  * (boriswerner) Improved support for Ozmo 950

### 0.1.11
  * Bugfix release
  
### 0.1.8
  * Improved support for MQTT devices
  * Implemented support for Ozmo 950

### 0.1.7
  * Bugfix detecting MQTT devices
  * Register features of known and supported models
  
### 0.1.6
  * Fix package-lock.json
  * A few minor changes

### 0.1.5
  * Bugfix
  * A few minor changes

### 0.1.4
   * Implemented GetWaterLevel command
   * Implemented SetWaterLevel command

### 0.1.3
   * Implemented GetLifeSpan command
   
### 0.1.2
   * Implemented SpotArea command
   * Implemented CustomArea command

### 0.1.1
   * Implemented PlaySound command

### 0.1.0
  * Deebot Ozmo 930 is working

### 0.0.2
* Initial development release

## Thanks and credits
* @joostth ([sucks.js](https://github.com/joostth/sucks.js))
* @wpietri ([sucks](https://github.com/wpietri/sucks))
* @bmartin5692 ([sucks](https://github.com/bmartin5692/sucks), [bumber](https://github.com/bmartin5692/bumper))
* @Ligio ([ozmo](https://github.com/Ligio/ozmo))
* @And3rsL ([Deebotozmo](https://github.com/And3rsL/Deebotozmo))

## Dedication

As already mentioned above all credits for figuring out and documenting the
protocol as well as developing the python library this port is based on go
to [@wpietri](https://github.com/wpietri).

The example code about uses the following additional resources:
* [node-machine-id](https://www.npmjs.com/package/node-machine-id) which
  provides an easy way to create a unique identifier for the machine running
  the code.
* [https://ipinfo.io/](https://ipinfo.io/) which provides a json API for IP address information
  and is free to use for testing or non-commercial use up to 1000 requests
  per day.

## License
GNU GENERAL PUBLIC LICENSE
