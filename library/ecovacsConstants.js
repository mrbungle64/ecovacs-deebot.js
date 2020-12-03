exports.MAIN_URL_FORMAT = 'https://eco-{country}-api.ecovacs.com/v1/private/{country}/{lang}/{deviceId}/{appCode}/{appVersion}/{channel}/{deviceType}';
exports.USER_URL_FORMAT = 'https://users-{continent}.ecouser.net:8000/user.do';
exports.PORTAL_URL_FORMAT = 'https://portal-{continent}.ecouser.net/api';
exports.USERSAPI = 'users/user.do';
// IOT Device Manager - This provides control of "IOT" products via RestAPI, some bots use this instead of XMPP
exports.IOTDEVMANAGERAPI = 'iot/devmanager.do';
exports.LGLOGAPI = 'lg/log.do';
// Leaving this open, the only endpoint known currently is "Product IOT Map" -  pim/product/getProductIotMap - This provides a list of "IOT" products.  Not sure what this provides the app.
exports.PRODUCTAPI = 'pim/product';
exports.REALM = 'ecouser.net';

exports.SupportedDevices = {
    "ls1ok3": {
        "name": "DEEBOT 900 Series",
        "950type": false,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": false,
        "voice_report": true,
        'single_room': false
    },
    "115": {
        "name": "DEEBOT OZMO/PRO 930 Series",
        "950type": false,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "vi829v": {
        "name": "DEEBOT OZMO 920",
        "deviceClassLink": "yna5xi"
    },
    "yna5xi": {
        "name": "DEEBOT OZMO 950 Series",
        "950type": true,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "123": {
        "name": "DEEBOT Slim2 Series",
        "950type": false,
        "main_brush": false,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": false,
        "voice_report": false,
        'single_room': false
    }
};

exports.KnownDevices = {
    "dl8fht": {
        "name": "DEEBOT 600 Series",
        "950type": false,
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "159": {
        "name": "DEEBOT OZMO 601",
        "950type": false,
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "130": {
        "name": "DEEBOT OZMO 610 Series",
        "950type": false,
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": true,
        "voice_report": false,
        'single_room': true
    },
    "uv242z": {
        "name": "DEEBOT 710",
        "950type": false,
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": false,
        "voice_report": true,
        'single_room': false
    },
    "y79a7u": {
        "name": "DEEBOT OZMO 900 Series",
        "950type": false,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "2pv572": {
        "name": "DEEBOT OZMO 905",
        "950type": false,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "gd4uut": {
        "name": "DEEBOT OZMO 960",
        "950type": false,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "h18jkh": {
        "name": "DEEBOT OZMO T8",
        "950type": true,
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "b742vd": {
        "name": "DEEBOT OZMO T8",
        "deviceClassLink": "h18jkh"
    },
    "fqxoiu": {
        "name": "DEEBOT OZMO T8+",
        "deviceClassLink": "h18jkh"
    },
    "55aiho": {
        "name": "DEEBOT OZMO T8+",
        "deviceClassLink": "h18jkh"
    },
    "x5d34r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "h18jkh"
    },
    "tpnwyu": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "h18jkh"
    },
    "34vhpm": {
        "name": "DEEBOT OZMO T8 AIVI +",
        "deviceClassLink": "h18jkh"
    },
    "155": {
        "name": "DEEBOT N79S/SE",
        "950type": false,
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": false,
        "voice_report": false,
        'single_room': false
    },
    "165": {
        "name": "DEEBOT N79T/W",
        "deviceClassLink": "155"
    },
    "ipzjy0": {
        "name": "DEEBOT U2",
        "950type": true,
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": false,
        "voice_report": true,
        'single_room': false
    },
    "rvo6ev": {
        "name": "DEEBOT U2",
        "deviceClassLink": "ipzjy0"
    },
    "wlqdkp": {
        "name": "DEEBOT U2",
        "deviceClassLink": "ipzjy0"
    },
    "nq9yhl": {
        "name": "DEEBOT U2 PRO"
    },
    "y2qy3m": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "7j1tu6": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "ts2ofl": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "c0lwyn": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "d4v1pm": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "u6eqoa": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "12baap": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "u4h1uk": {
        "name": "DEEBOT U2 PRO",
        "deviceClassLink": "nq9yhl"
    },
    "1zqysa": {
        "name": "DEEBOT U2 POWER"
    },
    "chmi0g": {
        "name": "DEEBOT U2 POWER",
        "deviceClassLink": "1zqysa"
    }
};

exports.EcoVacsHomeProducts = {
    "dl8fht": {
        "product": {
            "_id": "5acb0fa87c295c0001876ecf",
            "name": "DEEBOT 600 Series",
            "icon": "5acc32067c295c0001876eea",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5acc32067c295c0001876eea"
        }
    },
    "02uwxm": {
        "product": {
            "_id": "5ae1481e7ccd1a0001e1f69e",
            "name": "DEEBOT OZMO Slim10 Series",
            "icon": "5b1dddc48bc45700014035a1",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b1dddc48bc45700014035a1"
        }
    },
    "y79a7u": {
        "product": {
            "_id": "5b04c0227ccd1a0001e1f6a8",
            "name": "DEEBOT OZMO 900 Series",
            "icon": "5b04c0217ccd1a0001e1f6a7",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b04c0217ccd1a0001e1f6a7"
        }
    },
    "jr3pqa": {
        "product": {
            "_id": "5b43077b8bc457000140363e",
            "name": "DEEBOT 711",
            "icon": "5b5ac4cc8d5a56000111e769",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b5ac4cc8d5a56000111e769"
        }
    },
    "uv242z": {
        "product": {
            "_id": "5b5149b4ac0b87000148c128",
            "name": "DEEBOT 710",
            "icon": "5b5ac4e45f21100001882bb9",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b5ac4e45f21100001882bb9"
        }
    },
    "ls1ok3": {
        "product": {
            "_id": "5b6561060506b100015c8868",
            "name": "DEEBOT 900 Series",
            "icon": "5ba4a2cb6c2f120001c32839",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ba4a2cb6c2f120001c32839"
        }
    },
    "eyi9jv": {
        "product": {
            "_id": "5b7b65f364e1680001a08b54",
            "name": "DEEBOT 715",
            "icon": "5b7b65f176f7f10001e9a0c2",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b7b65f176f7f10001e9a0c2"
        }
    },
    "4zfacv": {
        "product": {
            "_id": "5bf2596f23244a00013f2f13",
            "name": "DEEBOT 910",
            "icon": "5c778731280fda0001770ba0",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c778731280fda0001770ba0"
        }
    },
    "115": {
        "product": {
            "_id": "5bbedd2822d57f00018c13b7",
            "name": "DEEBOT OZMO/PRO 930 Series",
            "icon": "5cf711aeb0acfc000179ff8a",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5cf711aeb0acfc000179ff8a"
        }
    },
    "vi829v": {
        "product": {
            "_id": "5c19a8f3a1e6ee0001782247",
            "name": "DEEBOT OZMO 920 Series",
            "icon": "5c9c7995e9e9270001354ab4",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c9c7995e9e9270001354ab4"
        }
    },
    "yna5xi": {
        "product": {
            "_id": "5c19a91ca1e6ee000178224a",
            "name": "DEEBOT OZMO 950 Series",
            "icon": "5caafd7e1285190001685965",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5caafd7e1285190001685965"
        }
    },
    "gd4uut": {
        "product": {
            "_id": "5bc8189d68142800016a6937",
            "name": "DEEBOT OZMO 960",
            "icon": "5c7384767b93c700013f12e7",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c7384767b93c700013f12e7"
        }
    },
    "9akc61": {
        "product": {
            "_id": "5c763f8263023c0001e7f855",
            "name": "DEEBOT 505",
            "icon": "5c932067280fda0001770d7f",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c932067280fda0001770d7f"
        }
    },
    "r8ead0": {
        "product": {
            "_id": "5c763f63280fda0001770b88",
            "name": "DEEBOT 502",
            "icon": "5c93204b63023c0001e7faa7",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c93204b63023c0001e7faa7"
        }
    },
    "emzppx": {
        "product": {
            "_id": "5c763f35280fda0001770b84",
            "name": "DEEBOT 501",
            "icon": "5c931fef280fda0001770d7e",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c931fef280fda0001770d7e"
        }
    },
    "vsc5ia": {
        "product": {
            "_id": "5c763eba280fda0001770b81",
            "name": "DEEBOT 500",
            "icon": "5c874326280fda0001770d2a",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c874326280fda0001770d2a"
        }
    },
    "142": {
        "product": {
            "_id": "5ca1ca7a12851900016858bd",
            "name": "DEEBOT Mini2",
            "icon": "5ca1ca79e9e9270001354b2d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca1ca79e9e9270001354b2d"
        }
    },
    "129": {
        "product": {
            "_id": "5ca31df1e9e9270001354b35",
            "name": "DEEBOT M86",
            "icon": "5ca31df112851900016858c0",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca31df112851900016858c0"
        }
    },
    "165": {
        "product": {
            "_id": "5ca32a11e9e9270001354b39",
            "name": "DEEBOT N79T/W",
            "icon": "5ca32a1012851900016858c6",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca32a1012851900016858c6"
        }
    },
    "126": {
        "product": {
            "_id": "5ca32ab212851900016858c7",
            "name": "DEEBOT N79",
            "icon": "5ca32ab2e9e9270001354b3d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca32ab2e9e9270001354b3d"
        }
    },
    "159": {
        "product": {
            "_id": "5ca32bc2e9e9270001354b41",
            "name": "DEEBOT OZMO 601",
            "icon": "5d4b7606de51dd0001fee12d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d4b7606de51dd0001fee12d"
        }
    },
    "0xyhhr": {
        "product": {
            "_id": "5ca4716312851900016858cd",
            "name": "DEEBOT OZMO 700",
            "icon": "5d117d4f0ac6ad00012b792d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d117d4f0ac6ad00012b792d"
        }
    },
    "125": {
        "product": {
            "_id": "5cae9703128519000168596a",
            "name": "DEEBOT M80 Pro",
            "icon": "5d2c14414d60de0001eaf1f2",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c14414d60de0001eaf1f2"
        }
    },
    "141": {
        "product": {
            "_id": "5cae97c9128519000168596f",
            "name": "DEEBOT M81 Pro",
            "icon": "5d2c2aa64d60de0001eaf1f6",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c2aa64d60de0001eaf1f6"
        }
    },
    "130": {
        "product": {
            "_id": "5cae98d01285190001685974",
            "name": "DEEBOT OZMO 610 Series",
            "icon": "5d4b7640de51dd0001fee131",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d4b7640de51dd0001fee131"
        }
    },
    "123": {
        "product": {
            "_id": "5cae9b201285190001685977",
            "name": "DEEBOT Slim2 Series",
            "icon": "5d2c150dba13eb00013feaae",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c150dba13eb00013feaae"
        }
    },
    "aqdd5p": {
        "product": {
            "_id": "5cb7cfba179839000114d762",
            "name": "DEEBOT DE55",
            "icon": "5cb7cfbab72c4d00010e5fc7",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5cb7cfbab72c4d00010e5fc7"
        }
    },
    "152": {
        "product": {
            "_id": "5cbd97b961526a00019799bd",
            "name": "DEEBOT",
            "icon": "5d4b7628de51dd0001fee12f",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d4b7628de51dd0001fee12f"
        }
    },
    "155": {
        "product": {
            "_id": "5cce893813afb7000195d6af",
            "name": "DEEBOT N79S/SE",
            "icon": "5cd4ca505b032200015a455d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5cd4ca505b032200015a455d"
        }
    },
    "jjccwk": {
        "product": {
            "_id": "5ce7870cd85b4d0001775db9",
            "name": "DEEBOT OZMO 750",
            "icon": "5d3aa309ba13eb00013feb69",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d3aa309ba13eb00013feb69"
        }
    },
    "d0cnel": {
        "product": {
            "_id": "5ceba1c6d85b4d0001776986",
            "name": "DEEBOT 711s",
            "icon": "5d157f9f77a3a60001051f69",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d157f9f77a3a60001051f69"
        }
    },
    "140": {
        "product": {
            "_id": "5cd43b4cf542e00001dc2dec",
            "name": "DEEBOT Slim Neo",
            "icon": "5d2c152f4d60de0001eaf1f4",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c152f4d60de0001eaf1f4"
        }
    },
    "2pv572": {
        "product": {
            "_id": "5d1474630ac6ad00012b7940",
            "name": "DEEBOT OZMO 905",
            "icon": "5d1474632a6bd50001b5b6f3",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d1474632a6bd50001b5b6f3"
        }
    },
    "xb83mv": {
        "product": {
            "_id": "5d246180350e7a0001e84bea",
            "name": "DEEBOT U3",
            "icon": "5d3fe649de51dd0001fee0de",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d3fe649de51dd0001fee0de"
        }
    },
    "16wdph": {
        "product": {
            "_id": "5d280ce344af3600013839ab",
            "name": "DEEBOT 661",
            "icon": "5d280ce3350e7a0001e84c95",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d280ce3350e7a0001e84c95"
        }
    },
    "zi1uwd": {
        "product": {
            "_id": "5d78f4e878d8b60001e23edc",
            "name": "DEEBOT U3 LINE FRIENDS",
            "icon": "5da834a8d66cd10001f58265",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5da834a8d66cd10001f58265"
        }
    },
    "9rft3c": {
        "product": {
            "_id": "5e14196a6e71b80001b60fda",
            "name": "DEEBOT OZMO T5",
            "icon": "5e1d1e06f024120001a329b4",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e1d1e06f024120001a329b4"
        }
    },
    "fqxoiu": {
        "product": {
            "_id": "5e8e8d8a032edd8457c66bfb",
            "name": "DEEBOT OZMO T8+",
            "icon": "5e8e8d84648255c9e8530e48",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e8e8d84648255c9e8530e48"
        }
    },
    "55aiho": {
        "product": {
            "_id": "5e698a6306f6de52c264c61b",
            "name": "DEEBOT OZMO T8+",
            "icon": "5e8e93d1648255d5e6530e4e",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e8e93d1648255d5e6530e4e"
        }
    },
    "h18jkh": {
        "product": {
            "_id": "5e8e8d2a032edd3c03c66bf7",
            "name": "DEEBOT OZMO T8",
            "icon": "5e8e8d146482551d72530e47",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e8e8d146482551d72530e47"
        }
    },
    "b742vd": {
        "product": {
            "_id": "5e699a4106f6de83ea64c620",
            "name": "DEEBOT OZMO T8",
            "icon": "5e8e93a7032edd3f5ec66d4a",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e8e93a7032edd3f5ec66d4a"
        }
    },
    "x5d34r": {
        "product": {
            "_id": "5de0d86ed88546000195239a",
            "name": "DEEBOT OZMO T8 AIVI",
            "icon": "5df6d1f10136c00001cb1fe4",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5df6d1f10136c00001cb1fe4"
        }
    },
    "tpnwyu": {
        "product": {
            "_id": "5edd9a4075f2fc000636086c",
            "name": "DEEBOT OZMO T8 AIVI +",
            "icon": "5edd9a3cfdd6a30008da039e",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5edd9a3cfdd6a30008da039e"
        }
    },
    "34vhpm": {
        "product": {
            "_id": "5edd9a4075f2fc000636086c",
            "name": "DEEBOT OZMO T8 AIVI +",
            "icon": "5edd996bbd3b770008434636",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5edd996bbd3b770008434636"
        }
    },
    "wgxm70": {
        "product": {
            "_id": "5ed5e4d3a719ea460ec3216c",
            "name": "DEEBOT T8",
            "icon": "5edf2bbedb28cc00062f8bd7",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5edf2bbedb28cc00062f8bd7"
        }
    },
    "p5nx9u": {
        "product": {
            "_id": "5f0d45404a3cbe00073d17db",
            "name": "yeedi 2 hybrid",
            "icon": "5f59e774c0f03a0008ee72e0",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5f59e774c0f03a0008ee72e0"
        }
    },
    "nq9yhl": {
        "product": {
            "_id": "5e8597b0032edd333ac66bbf",
            "name": "DEEBOT U2 PRO",
            "icon": "5e9922e88c92c77d08835552",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e9922e88c92c77d08835552"
        }
    },
    "y2qy3m": {
        "product": {
            "_id": "5ea8d28922838d15795ed88d",
            "name": "DEEBOT U2 PRO",
            "icon": "5ea8d28373193e9d5867c554",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ea8d28373193e9d5867c554"
        }
    },
    "7j1tu6": {
        "product": {
            "_id": "5e993e566a299d449a06d65a",
            "name": "DEEBOT U2 PRO",
            "icon": "5e993e538c92c76d4a83555d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e993e538c92c76d4a83555d"
        }
    },
    "ts2ofl": {
        "product": {
            "_id": "5e993e8b8c92c753dd83555f",
            "name": "DEEBOT U2",
            "icon": "5e993e856a299dcf0006d65d",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e993e856a299dcf0006d65d"
        }
    },
    "c0lwyn": {
        "product": {
            "_id": "5e993eef6a299d7e4a06d660",
            "name": "DEEBOT U2 PRO",
            "icon": "5e993eea6a299d711406d65e",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e993eea6a299d711406d65e"
        }
    },
    "ipzjy0": {
        "product": {
            "_id": "5e9923878c92c7676b835555",
            "name": "DEEBOT U2",
            "icon": "5e9923616a299db1aa06d653",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e9923616a299db1aa06d653"
        }
    },
    "d4v1pm": {
        "product": {
            "_id": "5e9924416a299dddac06d656",
            "name": "DEEBOT U2 PRO",
            "icon": "5e99243b8c92c7d8b883555c",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e99243b8c92c7d8b883555c"
        }
    },
    "u6eqoa": {
        "product": {
            "_id": "5e993f2f6a299d0bd506d665",
            "name": "DEEBOT U2 PRO",
            "icon": "5e993f2b6a299d414106d663",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e993f2b6a299d414106d663"
        }
    },
    "12baap": {
        "product": {
            "_id": "5ea8d1fe73193e3bef67c551",
            "name": "DEEBOT U2 PRO",
            "icon": "5ea8d1f273193e192467c54f",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ea8d1f273193e192467c54f"
        }
    },
    "u4h1uk": {
        "product": {
            "_id": "5e993eba8c92c71489835564",
            "name": "DEEBOT U2 PRO",
            "icon": "5e993eb68c92c7531a835562",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e993eb68c92c7531a835562"
        }
    },
    "rvo6ev": {
        "product": {
            "_id": "5e859780648255c8bf530e14",
            "name": "DEEBOT U2",
            "icon": "5e9922fa6a299d5d7606d651",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e9922fa6a299d5d7606d651"
        }
    },
    "wlqdkp": {
        "product": {
            "_id": "5e9924018c92c7c480835559",
            "name": "DEEBOT U2",
            "icon": "5e9923b06a299da02406d654",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e9923b06a299da02406d654"
        }
    },
    "1zqysa": {
        "product": {
            "_id": "5ee85c64fdd6a30008da0af4",
            "name": "DEEBOT U2 POWER",
            "icon": "5ee85ea9db28cc00062f933c",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ee85ea9db28cc00062f933c"
        }
    },
    "chmi0g": {
        "product": {
            "_id": "5ee85cabfdd6a30008da0af8",
            "name": "DEEBOT U2 POWER",
            "icon": "5ee85eb6bd3b770008435090",
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ee85eb6bd3b770008435090"
        }
    }
};
