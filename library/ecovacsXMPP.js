const EventEmitter = require('events');
const tools = require('./tools');
const Element = require('ltx').Element;
const dictionary = require('./ecovacsConstants_non950type.js');

String.prototype.format = function () {
    if (arguments.length === 0) {
        return this;
    }
    var args = arguments['0'];
    return this.replace(/{(\w+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

class EcovacsXMPP extends EventEmitter {
    constructor(bot, user, hostname, resource, secret, continent, vacuum, server_address, server_port) {
        super();
        this.simpleXmpp = require('simple-xmpp');

        this.bot = bot;
        this.user = user;
        this.hostname = hostname;
        this.resource = resource;
        this.secret = secret;
        this.continent = continent;
        this.vacuum = vacuum;

        this.iter = 1;

        if (!server_address) {
            this.server_address = 'msg-{continent}.ecouser.net'.format({
                continent: continent
            });
        } else {
            this.server_address = server_address;
        }

        if (!server_port) {
            this.server_port = 5223
        } else {
            this.server_port = server_port;
        }

        this.simpleXmpp.on('online', (event) => {
            tools.envLog('[EcovacsXMPP] Session start');
            this.session_start(event);
        });

        this.simpleXmpp.on('close', () => {
            tools.envLog('[EcovacsXMPP] I\'m disconnected :(');
            this.emit('closed');
        });

        this.simpleXmpp.on('stanza', (stanza) => {
            tools.envLog('stanza: %s', stanza.toString());
            if (stanza.name === 'iq' && (stanza.attrs.type === 'set' || stanza.attrs.type === 'result') && !!stanza.children[0] && stanza.children[0].name === 'query' && !!stanza.children[0].children[0]) {
                let firstChild = stanza.children[0];
                tools.envLog('firstChild: %s', firstChild.toString());
                let secondChild = firstChild.children[0];
                tools.envLog('secondChild: %s', secondChild.toString());
                let command = secondChild.attrs.td;
                if (!command) {
                    if (secondChild.children[0]) {
                        if (secondChild.children[0].name) {
                            command = secondChild.children[0].name;
                        }
                    }
                    if (secondChild.attrs.hasOwnProperty('type')) {
                        if (dictionary.COMPONENT_FROM_ECOVACS[secondChild.attrs.type]) {
                            command = 'LifeSpan';
                        }
                    }
                    if (secondChild.attrs.hasOwnProperty('v')) {
                        let waterLevel = parseInt(secondChild.attrs.v);
                        if ((waterLevel >= 1) && (waterLevel <= 4)) {
                            command = 'WaterLevel';
                        }
                    }
                    if (secondChild.attrs.hasOwnProperty('on')) {
                        if (secondChild.attrs.on) {
                            command = 'WaterBoxInfo';
                        }
                    }
                    if ((secondChild.attrs.hasOwnProperty('p')) && (secondChild.attrs.hasOwnProperty('a'))) {
                        if (secondChild.attrs.id === "999999999") {
                            command = 'ChargePosition';
                        }
                        else {
                            command = 'DeebotPosition';
                        }
                    }
                    if ((secondChild.attrs.hasOwnProperty('st'))) {
                        if (secondChild.attrs.id === "999999997") {
                            command = 'SleepStatus';
                        }
                    }
                    if ((secondChild.attrs.hasOwnProperty('a')) && (secondChild.attrs.hasOwnProperty('l')) && (secondChild.attrs.hasOwnProperty('c'))) {
                        command = 'CleanSum';
                    }
                    if ((secondChild.attrs.hasOwnProperty('i')) && (secondChild.attrs.hasOwnProperty('m'))) {
                        let id = parseInt(secondChild.attrs.id);
                        if (id === 999999998) {
                            command = 'MapP';
                        }
                    }
                    if (secondChild.attrs.hasOwnProperty('tp')) {
                        let id = parseInt(secondChild.attrs.id);
                        if (id === 999999996) {
                            command = 'MapSet';
                        }
                    }
                    if ((secondChild.attrs.hasOwnProperty('m'))) {
                        let id = parseInt(secondChild.attrs.id);
                        if ((id >= 999999900) && (id <= 999999979)) {
                            command = 'PullM';
                        }
                    }
                }
                if (command) {
                    switch (tools.getEventNameForCommandString(command)) {
                        case "MapP":
                            this.bot._handle_cachedmapinfo(secondChild);
                            this.emit("CurrentMapName", this.bot.currentMapName);
                            this.emit("CurrentMapMID", this.bot.currentMapMID);
                            this.emit("CurrentMapIndex", this.bot.currentMapIndex);
                            this.emit("Maps", this.bot.maps);
                            break;
                        case "MapSet":
                            let mapset = this.bot._handle_mapset(secondChild);
                            if(mapset["mapsetEvent"] != 'error'){
                                this.emit(mapset["mapsetEvent"], mapset["mapsetData"]);
                            }
                            break;
                        case "PullM":
                            let mapsubset = this.bot._handle_mapsubset(secondChild);
                            if(mapsubset["mapsubsetEvent"] != 'error'){
                                this.emit(mapsubset["mapsubsetEvent"], mapsubset["mapsubsetData"]);
                            }
                            break;
                        case 'ChargeState':
                            this.bot._handle_charge_state(secondChild.children[0]);
                            this.emit('ChargeState', this.bot.charge_status);
                            break;
                        case 'BatteryInfo':
                            this.bot._handle_battery_info(secondChild.children[0]);
                            this.emit('BatteryInfo', this.bot.battery_status);
                            break;
                        case 'CleanReport':
                            this.bot._handle_clean_report(secondChild.children[0]);
                            this.emit('CleanReport', this.bot.clean_status);
                            if (this.bot.lastAreaValues) {
                                this.emit("LastAreaValues", this.bot.lastAreaValues);
                            }
                            break;
                        case "CleanSpeed":
                            this.bot._handle_clean_speed(secondChild.children[0]);
                            this.emit("FanSpeed", this.bot.fan_speed);
                            break;
                        case 'Error':
                            this.bot._handle_error(secondChild.attrs);
                            this.emit('Error', this.bot.errorDescription);
                            this.emit('ErrorCode', this.bot.errorCode);
                            break;
                        case 'LifeSpan':
                            this.bot._handle_life_span(secondChild.attrs);
                            const component = dictionary.COMPONENT_FROM_ECOVACS[secondChild.attrs.type];
                            if (component) {
                                if (this.bot.components[component]) {
                                    this.emit('LifeSpan_' + component, this.bot.components[component]);
                                }
                            }
                            break;
                        case 'WaterLevel':
                            this.bot._handle_water_level(secondChild);
                            this.emit('WaterLevel', this.bot.water_level);
                            break;
                        case 'WaterBoxInfo':
                            this.bot._handle_waterbox_info(secondChild);
                            this.emit('WaterBoxInfo', this.bot.waterbox_info);
                            break;
                        case 'DustCaseST':
                            this.bot._handle_dustbox_info(secondChild);
                            this.emit('DustCaseInfo', this.bot.dustbox_info);
                            break;
                        case 'DeebotPosition':
                            this.bot._handle_deebot_position(secondChild);
                            this.emit('DeebotPosition', this.bot.deebot_position["x"]+","+this.bot.deebot_position["y"]+","+this.bot.deebot_position["a"]);
                            this.emit("DeebotPositionCurrentSpotAreaID", this.bot.deebot_position["currentSpotAreaID"]);
                            break;
                        case 'ChargePosition':
                            this.bot._handle_charge_position(secondChild);
                            this.emit('ChargePosition', this.bot.charge_position["x"]+","+this.bot.charge_position["y"]+","+this.bot.charge_position["a"]);
                            break;
                        case 'NetInfo':
                            this.bot._handle_net_info(secondChild.attrs);
                            this.emit("NetInfoIP", this.bot.netInfoIP);
                            this.emit("NetInfoWifiSSID", this.bot.netInfoWifiSSID);
                            break;
                        case 'SleepStatus':
                            this.bot._handle_sleep_status(secondChild);
                            this.emit("SleepStatus", this.bot.sleep_status);
                            break;
                        case 'CleanSum':
                            this.bot._handle_cleanSum(secondChild);
                            this.emit("CleanSum_totalSquareMeters", this.bot.cleanSum_totalSquareMeters);
                            this.emit("CleanSum_totalSeconds", this.bot.cleanSum_totalSeconds);
                            this.emit("CleanSum_totalNumber", this.bot.cleanSum_totalNumber);
                            break;
                        default:
                            tools.envLog('[EcovacsXMPP] Unknown response type received: %s', JSON.stringify(stanza));
                            break;
                    }
                }
                else {
                    tools.envLog('[EcovacsXMPP] Unknown response type received: %s', JSON.stringify(stanza));
                }
            } else if (stanza.name === 'iq' && stanza.attrs.type === 'error' && !!stanza.children[0] && stanza.children[0].name === 'error' && !!stanza.children[0].children[0]) {
                tools.envLog('[EcovacsXMPP] Response Error for request %s: %S', stanza.attrs.id, JSON.stringify(stanza.children[0]));
                this.bot._handle_error(stanza.children[0].attrs);
                this.emit('Error', this.bot.errorDescription);
                this.emit('ErrorCode', this.bot.errorCode);
            }
        });

        this.simpleXmpp.on('error', (e) => {
            tools.envLog('[EcovacsXMPP] Error:', e);
        });
    }

    session_start(event) {
        tools.envLog('[EcovacsXMPP] ----------------- starting session ----------------');
        tools.envLog('[EcovacsXMPP] event = {event}'.format({
            event: JSON.stringify(event)
        }));
        this.emit('ready', event);
    }

    connect_and_wait_until_ready() {
        tools.envLog('[EcovacsXMPP] Connecting as %s to %s', this.user + '@' + this.hostname, this.server_address + ':' + this.server_port);
        this.simpleXmpp.connect({
            jid: this.user + '@' + this.hostname,
            password: '0/' + this.resource + '/' + this.secret,
            host: this.server_address,
            port: this.server_port
        });

        this.on('ready', (event) => {
            this.send_ping(this.bot._vacuum_address());
        });
    }

    send_command(xml, recipient) {
        let result = this._wrap_command(xml, recipient);
        tools.envLog('[EcovacsXMPP] Sending xml:', result.toString());
        this.simpleXmpp.conn.send(result);
    }

    _wrap_command(xml, recipient) {
        let id = this.iter++;
        let iqElement = new Element('iq', {
            id: id,
            to: recipient,
            from: this._my_address(),
            type: 'set'
        });
        iqElement.c('query', {
            xmlns: 'com:ctl'
        }).cnode(xml);
        return iqElement;
    }

    _my_address() {
        return this.user + '@' + this.hostname + '/' + this.resource;
    }

    send_ping(to) {
        let id = this.iter++;
        var e = new Element('iq', {
            id: id,
            to: to,
            from: this._my_address(),
            type: 'get'
        });
        e.c('query', {
            xmlns: 'urn:xmpp:ping'
        });
        this.simpleXmpp.conn.send(e);
    }

    disconnect() {
        this.simpleXmpp.disconnect();
        tools.envLog("[EcovacsXMPP] Closed XMPP Client");
    }
}

module.exports = EcovacsXMPP;
