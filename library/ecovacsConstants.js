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
    "115": {
        "name": "DEEBOT OZMO/PRO 930 Series",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "vi829v": {
        "name": "DEEBOT OZMO 920",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "yna5xi": {
        "name": "DEEBOT OZMO 950 Series",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "123": {
        "name": "DEEBOT Slim2 Series",
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
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "159": {
        "name": "DEEBOT OZMO 601",
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "130": {
        "name": "DEEBOT OZMO 610 Series",
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": true,
        "voice_report": false,
        'single_room': true
    },
    "uv242z": {
        "name": "DEEBOT 710",
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": false,
        "voice_report": true,
        'single_room': false
    },
    "ls1ok3": {
        "name": "DEEBOT 900 Series",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": false,
        "voice_report": true,
        'single_room': false
    },
    "y79a7u": {
        "name": "DEEBOT OZMO 900 Series",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "2pv572": {
        "name": "DEEBOT OZMO 905",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "gd4uut": {
        "name": "DEEBOT OZMO 960",
        "main_brush": true,
        "spot_area": true,
        "custom_area": true,
        "mopping_system": true,
        "voice_report": true,
        'single_room': false
    },
    "165": {
        "name": "DEEBOT N79T/W",
        "main_brush": true,
        "spot_area": false,
        "custom_area": false,
        "mopping_system": false,
        "voice_report": false,
        'single_room': false
    }
};

// https://github.com/bmartin5692/bumper/blob/master/bumper/models.py
// EcoVacs Home Product IOT Map - 2020-01-05
// https://portal-ww.ecouser.net/api/pim/product/getProductIotMap
exports.EcoVacsHomeProducts = {
    "dl8fht": {
        "product": {
            "_id": "5acb0fa87c295c0001876ecf",
            "materialNo": "702-0000-0170",
            "name": "DEEBOT 600 Series",
            "icon": "5acc32067c295c0001876eea",
            "UILogicId": "D_600",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5acc32067c295c0001876eea"
        }
    },
    "02uwxm": {
        "product": {
            "_id": "5ae1481e7ccd1a0001e1f69e",
            "materialNo": "110-1715-0201",
            "name": "DEEBOT OZMO Slim10 Series",
            "icon": "5b1dddc48bc45700014035a1",
            "UILogicId": "D_OZMO_SLIM10",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b1dddc48bc45700014035a1"
        }
    },
    "y79a7u": {
        "product": {
            "_id": "5b04c0227ccd1a0001e1f6a8",
            "materialNo": "110-1810-0101",
            "name": "DEEBOT OZMO 900 Series",
            "icon": "5b04c0217ccd1a0001e1f6a7",
            "UILogicId": "D_OZMO_900",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b04c0217ccd1a0001e1f6a7"
        }
    },
    "jr3pqa": {
        "product": {
            "_id": "5b43077b8bc457000140363e",
            "materialNo": "702-0000-0202",
            "name": "DEEBOT 711",
            "icon": "5b5ac4cc8d5a56000111e769",
            "UILogicId": "D_700",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b5ac4cc8d5a56000111e769"
        }
    },
    "uv242z": {
        "product": {
            "_id": "5b5149b4ac0b87000148c128",
            "materialNo": "702-0000-0205",
            "name": "DEEBOT 710",
            "icon": "5b5ac4e45f21100001882bb9",
            "UILogicId": "D_700",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b5ac4e45f21100001882bb9"
        }
    },
    "ls1ok3": {
        "product": {
            "_id": "5b6561060506b100015c8868",
            "materialNo": "110-1711-0201",
            "name": "DEEBOT 900 Series",
            "icon": "5ba4a2cb6c2f120001c32839",
            "UILogicId": "D_900",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ba4a2cb6c2f120001c32839"
        }
    },
    "eyi9jv": {
        "product": {
            "_id": "5b7b65f364e1680001a08b54",
            "materialNo": "702-0000-0202",
            "name": "DEEBOT 715",
            "icon": "5b7b65f176f7f10001e9a0c2",
            "UILogicId": "D_700",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5b7b65f176f7f10001e9a0c2"
        }
    },
    "4zfacv": {
        "product": {
            "_id": "5bf2596f23244a00013f2f13",
            "materialNo": "910",
            "name": "DEEBOT 910",
            "icon": "5c778731280fda0001770ba0",
            "UILogicId": "DN_2G",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c778731280fda0001770ba0"
        }
    },
    "115": {
        "product": {
            "_id": "5bbedd2822d57f00018c13b7",
            "materialNo": "110-1602-0101",
            "name": "DEEBOT OZMO/PRO 930 Series",
            "icon": "5cf711aeb0acfc000179ff8a",
            "UILogicId": "DR_930G",
            "ota": true,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5cf711aeb0acfc000179ff8a"
        }
    },
    "vi829v": {
        "product": {
            "_id": "5c19a8f3a1e6ee0001782247",
            "materialNo": "110-1819-0101",
            "name": "DEEBOT OZMO 920 Series",
            "icon": "5c9c7995e9e9270001354ab4",
            "UILogicId": "DX_5G",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c9c7995e9e9270001354ab4"
        }
    },
    "yna5xi": {
        "product": {
            "_id": "5c19a91ca1e6ee000178224a",
            "materialNo": "110-1820-0101",
            "name": "DEEBOT OZMO 950 Series",
            "icon": "5caafd7e1285190001685965",
            "UILogicId": "DX_9G",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5caafd7e1285190001685965"
        }
    },
    "gd4uut": {
        "product": {
            "_id": "5bc8189d68142800016a6937",
            "materialNo": "110-1803-0101",
            "name": "DEEBOT OZMO 960",
            "icon": "5c7384767b93c700013f12e7",
            "UILogicId": "DR_935G",
            "ota": true,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c7384767b93c700013f12e7"
        }
    },
    "9akc61": {
        "product": {
            "_id": "5c763f8263023c0001e7f855",
            "materialNo": "702-0000-0163",
            "name": "DEEBOT 505",
            "icon": "5c932067280fda0001770d7f",
            "UILogicId": "D_500",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c932067280fda0001770d7f"
        }
    },
    "r8ead0": {
        "product": {
            "_id": "5c763f63280fda0001770b88",
            "materialNo": "702-0000-0163",
            "name": "DEEBOT 502",
            "icon": "5c93204b63023c0001e7faa7",
            "UILogicId": "D_500",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c93204b63023c0001e7faa7"
        }
    },
    "emzppx": {
        "product": {
            "_id": "5c763f35280fda0001770b84",
            "materialNo": "702-0000-0163",
            "name": "DEEBOT 501",
            "icon": "5c931fef280fda0001770d7e",
            "UILogicId": "D_500",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c931fef280fda0001770d7e"
        }
    },
    "vsc5ia": {
        "product": {
            "_id": "5c763eba280fda0001770b81",
            "materialNo": "702-0000-0163",
            "name": "DEEBOT 500",
            "icon": "5c874326280fda0001770d2a",
            "UILogicId": "D_500",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5c874326280fda0001770d2a"
        }
    },
    "142": {
        "product": {
            "_id": "5ca1ca7a12851900016858bd",
            "materialNo": "110-1640-0101",
            "name": "DEEBOT Mini2",
            "icon": "5ca1ca79e9e9270001354b2d",
            "UILogicId": "ECO_INTL_142",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca1ca79e9e9270001354b2d"
        }
    },
    "129": {
        "product": {
            "_id": "5ca31df1e9e9270001354b35",
            "materialNo": "110-1628-0101",
            "name": "DEEBOT M86",
            "icon": "5ca31df112851900016858c0",
            "UILogicId": "ECO_INTL_129",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca31df112851900016858c0"
        }
    },
    "165": {
        "product": {
            "_id": "5ca32a11e9e9270001354b39",
            "materialNo": "702-0000-0189",
            "name": "DEEBOT N79T/W",
            "icon": "5ca32a1012851900016858c6",
            "UILogicId": "ECO_INTL_165",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca32a1012851900016858c6"
        }
    },
    "126": {
        "product": {
            "_id": "5ca32ab212851900016858c7",
            "materialNo": "702-0000-0136",
            "name": "DEEBOT N79",
            "icon": "5ca32ab2e9e9270001354b3d",
            "UILogicId": "ECO_INTL_126",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5ca32ab2e9e9270001354b3d"
        }
    },
    "159": {
        "product": {
            "_id": "5ca32bc2e9e9270001354b41",
            "materialNo": "110-1629-0203",
            "name": "DEEBOT OZMO 601",
            "icon": "5d4b7606de51dd0001fee12d",
            "UILogicId": "ECO_INTL_159",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d4b7606de51dd0001fee12d"
        }
    },
    "0xyhhr": {
        "product": {
            "_id": "5ca4716312851900016858cd",
            "materialNo": "110-1825-0201",
            "name": "DEEBOT OZMO 700",
            "icon": "5d117d4f0ac6ad00012b792d",
            "UILogicId": "DV_5G",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d117d4f0ac6ad00012b792d"
        }
    },
    "125": {
        "product": {
            "_id": "5cae9703128519000168596a",
            "materialNo": "110-1638-0102",
            "name": "DEEBOT M80 Pro",
            "icon": "5d2c14414d60de0001eaf1f2",
            "UILogicId": "ECO_INTL_125",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c14414d60de0001eaf1f2"
        }
    },
    "141": {
        "product": {
            "_id": "5cae97c9128519000168596f",
            "materialNo": "110-1638-0101",
            "name": "DEEBOT M81 Pro",
            "icon": "5d2c2aa64d60de0001eaf1f6",
            "UILogicId": "ECO_INTL_141",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c2aa64d60de0001eaf1f6"
        }
    },
    "130": {
        "product": {
            "_id": "5cae98d01285190001685974",
            "materialNo": "110-1629-0201",
            "name": "DEEBOT OZMO 610 Series",
            "icon": "5d4b7640de51dd0001fee131",
            "UILogicId": "ECO_INTL_130",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d4b7640de51dd0001fee131"
        }
    },
    "123": {
        "product": {
            "_id": "5cae9b201285190001685977",
            "materialNo": "110-1639-0102",
            "name": "DEEBOT Slim2 Series",
            "icon": "5d2c150dba13eb00013feaae",
            "UILogicId": "ECO_INTL_123",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c150dba13eb00013feaae"
        }
    },
    "aqdd5p": {
        "product": {
            "_id": "5cb7cfba179839000114d762",
            "materialNo": "110-1711-0001",
            "name": "DEEBOT DE55",
            "icon": "5cb7cfbab72c4d00010e5fc7",
            "UILogicId": "D_900",
            "ota": true,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": false,
                "alexa": false
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5cb7cfbab72c4d00010e5fc7"
        }
    },
    "152": {
        "product": {
            "_id": "5cbd97b961526a00019799bd",
            "materialNo": "110-1628-0302",
            "name": "DEEBOT",
            "icon": "5d4b7628de51dd0001fee12f",
            "UILogicId": "ECO_INTL_152",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d4b7628de51dd0001fee12f"
        }
    },
    "155": {
        "product": {
            "_id": "5cce893813afb7000195d6af",
            "materialNo": "702-0000-0163",
            "name": "DEEBOT N79S/SE",
            "icon": "5cd4ca505b032200015a455d",
            "UILogicId": "ECO_INTL_155",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5cd4ca505b032200015a455d"
        }
    },
    "jjccwk": {
        "product": {
            "_id": "5ce7870cd85b4d0001775db9",
            "materialNo": "110-1825-0201",
            "name": "DEEBOT OZMO 750",
            "icon": "5d3aa309ba13eb00013feb69",
            "UILogicId": "DV_6G",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d3aa309ba13eb00013feb69"
        }
    },
    "d0cnel": {
        "product": {
            "_id": "5ceba1c6d85b4d0001776986",
            "materialNo": "702-0000-0202",
            "name": "DEEBOT 711s",
            "icon": "5d157f9f77a3a60001051f69",
            "UILogicId": "D_700",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d157f9f77a3a60001051f69"
        }
    },
    "140": {
        "product": {
            "_id": "5cd43b4cf542e00001dc2dec",
            "materialNo": "110-1639-0011",
            "name": "DEEBOT Slim Neo",
            "icon": "5d2c152f4d60de0001eaf1f4",
            "UILogicId": "ECO_INTL_140",
            "ota": false,
            "supportType": {
                "share": false,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c152f4d60de0001eaf1f4"
        }
    },
    "2pv572": {
        "product": {
            "_id": "5d1474630ac6ad00012b7940",
            "materialNo": "110-1810-0107",
            "name": "DEEBOT OZMO 905",
            "icon": "5d1474632a6bd50001b5b6f3",
            "UILogicId": "D_OZMO_900",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d1474632a6bd50001b5b6f3"
        }
    },
    "xb83mv": {
        "product": {
            "_id": "5d246180350e7a0001e84bea",
            "materialNo": "88393939393",
            "name": "DEEBOT U3",
            "icon": "5d3fe649de51dd0001fee0de",
            "UILogicId": "DK_4G",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d3fe649de51dd0001fee0de"
        }
    },
    "16wdph": {
        "product": {
            "_id": "5d280ce344af3600013839ab",
            "materialNo": "702-0000-0170",
            "name": "DEEBOT 661",
            "icon": "5d280ce3350e7a0001e84c95",
            "UILogicId": "D_661",
            "ota": false,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d280ce3350e7a0001e84c95"
        }
    },
    "zi1uwd": {
        "product": {
            "_id": "5d78f4e878d8b60001e23edc",
            "materialNo": "3",
            "name": "DEEBOT U3 LINE FRIENDS",
            "icon": "5da834a8d66cd10001f58265",
            "UILogicId": "DK_4GLINE",
            "ota": true,
            "supportType": {
                "share": true,
                "tmjl": false,
                "assistant": true,
                "alexa": true
            },
            "iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5da834a8d66cd10001f58265"
        }
    },
    "m7lqzi": {
		"product": {
			"_id": "5c653edf7b93c700013f12cc",
			"materialNo": "113-1708-0001",
			"name": "ATMOBOT Pro",
			"icon": "5d2c63a5ba13eb00013feab7",
			"UILogicId": "AA_30G",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false

			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2c63a5ba13eb00013feab7"
		}
	},
    "4f0c4e": {
		"product": {
			"_id": "5d2c5fcd4d60de0001eaf2a5",
			"materialNo": "70200000227",
			"name": "AT01",
			"icon": "5d2d996c4d60de0001eaf2b5",
			"UILogicId": "AT_01G",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d2d996c4d60de0001eaf2b5"
		}
	},
    "q1v5dn": {
		"product": {
			"_id": "5d312ae18d8d430001817002",
			"materialNo": "70200000228",
			"name": "AT01",
			"icon": "5d83375f6b6a570001569e26",
			"UILogicId": "AT_01G",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false

			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5d83375f6b6a570001569e26"
		}
	},
    "x5d34r": {
		"product": {
			"_id": "5de0d86ed88546000195239a",
			"materialNo": "110-1913-0101",
			"name": "DEEBOT OZMO T8 AIVI",
			"icon": "5df6d1f10136c00001cb1fe4",
			"UILogicId": "DX_AIG",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": true,
				"alexa": true
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5df6d1f10136c00001cb1fe4"
		}
	},
	"1qdu4z": {
		"product": {
			"_id": "5de9b7f50136c00001cb1f96",
			"materialNo": "117-1923-0101",
			"name": "AT80K",
			"icon": "5e71c7df298f0d9cabfef86f",
			"UILogicId": "AT80",
			"ota": false,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e71c7df298f0d9cabfef86f"
		}
	},
	"jh3ry2": {
		"product": {
			"_id": "5de9b77f0136c00001cb1f8e",
			"materialNo": "113-1931-0003",
			"name": "AVA",
			"icon": "5e7abef7298f0d9b31fef996",
			"UILogicId": "ATMOBOT_AVA",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e7abef7298f0d9b31fef996"
		}
	},
	"hsgwhi": {
		"product": {
			"_id": "5de9b6fb787cdf0001ef98ac",
			"materialNo": "113-1931-0001",
			"name": "ANDY",
			"icon": "5e731a4a06f6de700464c69d",
			"UILogicId": "ATMOBOT_ANDY",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e731a4a06f6de700464c69d"
		}
	},
	"9rft3c": {
		"product": {
			"_id": "5e14196a6e71b80001b60fda",
			"materialNo": "191165",
			"name": "DEEBOT OZMO T5",
			"icon": "5e1d1e06f024120001a329b4",
			"UILogicId": "DX_9G",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e1d1e06f024120001a329b4"
		}
	},
	"jffnlf": {
		"product": {
			"_id": "5e53208426be716edf4b55cf",
			"materialNo": "130-6311-1702",
			"name": "DEEBOT N3 MAX",
			"icon": "5e53207a26be71596c4b55cd",
			"UILogicId": "DU_6G",
			"ota": true,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": false,
				"alexa": false
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e53207a26be71596c4b55cd"
		}
	},
	"ar5bjb": {
		"product": {
			"_id": "5e58a73d36e8f3cab08f031f",
			"materialNo": "130-6211-0610",
			"name": "DEEBOT 665",
			"icon": "5e58a2df36e8f39e318f031d",
			"UILogicId": "D_661",
			"ota": false,
			"supportType": {
				"share": true,
				"tmjl": false,
				"assistant": true,
				"alexa": true
			},
			"iconUrl": "https://portal-ww.ecouser.net/api/pim/file/get/5e58a2df36e8f39e318f031d"
		}
	}
};