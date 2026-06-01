// noinspection SpellCheckingInspection

/**
 * @file This file contains specific model configurations.
 * For a detailed explanation of properties and model identification strategy,
 * please refer to the `docs/MODELS.md` file.
 */

// Note on smartType: Every model has a `smartType` parameter representing its 
// internal Ecovacs IoT platform protocol/family (e.g., MQ_AP, BLAP2, QRP, QR_APM, SPA).
// These are proprietary, undocumented identifiers mapped from productIotMap.json 
// (sourced from https://github.com/MVladislav/bumper/tree/main) or deduced.
// Any expanded names are speculative and unofficial.

// Modern and actively supported DEEBOT models
exports.SupportedDeebotModels = {
    "vi829v": {
        "name": "DEEBOT OZMO 920",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingUltraHigh", "OZMO"],
        "type": "950"
    },
    "yna5xi": {
        "name": "DEEBOT OZMO 950 Series",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO"],
        "type": "950"
    },
    "x5d34r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"],
        "type": "T8"
    },
    "sa4tf7": {
        "name": "DEEBOT OZMO T8 AIVI",
        "smartType": "MQ_AP",
        "deviceClassLink": "x5d34r"
    },
    "uzel1r": {
        "name": "DEEBOT mini PRO",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "mini"
    },
    "z0gd1j": {
        "name": "DEEBOT OZMO T8 AIVI",
        "smartType": "MQ_AP",
        "deviceClassLink": "x5d34r"
    },
    "npu3pt": {
        "name": "DEEBOT N30",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus"],
        "type": "T20"
    },
    "q6pew4": {
        "name": "DEEBOT OZMO T8 AIVI",
        "smartType": "MQ_AP",
        "deviceClassLink": "x5d34r"
    },
    "w16crm": {
        "name": "DEEBOT OZMO T8 AIVI+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OZMO", "PLUS", "moppingUltraHigh"],
        "type": "T8"
    },
    "2o4lnm": {
        "name": "DEEBOT X1 TURBO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "TURBO"],
        "type": "X1"
    },
};

// Supported air purifier models (e.g. AIRBOT Z1)
exports.SupportedAirPurifierModels = {
    "sdp1y1": {
        "name": "AIRBOT Z1",
        "smartType": "QRP",
        "type": "airbot"
    },
    "20anby": {
        "name": "Z1 Air Quality Monitor",
        "smartType": "MQ_AP",
        "type": "aqMonitor"
    },
    "99fqkn": {
        "name": "Z1 Air Quality Monitor",
        "smartType": "MQ_AP",
        "type": "aqMonitor"
    }
};

// Known DEEBOT models (bulk of T/N/X series)
// Not owned by the maintainer. These are community contributed or based on datasheets.
exports.KnownDeebotModels = {
    "9rft3c": {
        "name": "DEEBOT OZMO T5",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO"],
        "type": "950"
    },
    "55uoqe": {
        "name": "DEEBOT MINI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "mini"
    },
    "jtmf04": {
        "name": "DEEBOT T10",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "rss8xk": {
        "name": "DEEBOT T10 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "air_freshener_info": true,
        "type": "T10"
    },
    "lx3j7m": {
        "name": "DEEBOT T10 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "p95mgv": {
        "name": "DEEBOT T10 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "9s1s80": {
        "name": "DEEBOT T10 TURBO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "TURBO"],
        "type": "T10"
    },
    "m1wkuw": {
        "name": "DEEBOT N10",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "clojes": {
        "name": "DEEBOT N10 MAX+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "umwv6z": {
        "name": "DEEBOT N10 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "kr0277": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "edoodo": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "m17zko": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "p1wg05": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "3gwbbm": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "53qyvr": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "va8ygm": {
        "name": "DEEBOT N20",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "xw7zp9": {
        "name": "DEEBOT N20",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "buom7k": {
        "name": "DEEBOT N20 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "i35yb6": {
        "name": "DEEBOT N20 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "9kpees": {
        "name": "DEEBOT N20 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "aavvfb": {
        "name": "DEEBOT N20 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "c8gerr": {
        "name": "DEEBOT N20 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "qhe2o2": {
        "name": "DEEBOT N20 PRO PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "p0l0af": {
        "name": "DEEBOT N20 PRO PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "gwtll7": {
        "name": "DEEBOT N20 PRO PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "zgsvkq": {
        "name": "DEEBOT N20e",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "ruhc0q": {
        "name": "DEEBOT N20e",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "yinacl": {
        "name": "DEEBOT N20e PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "7piq03": {
        "name": "DEEBOT N20e PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "jffnlf": {
        "name": "DEEBOT N3 MAX",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh"],
        "type": "950"
    },
    "zwkcqc": {
        "name": "DEEBOT N30 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "dlrbzq": {
        "name": "DEEBOT N30 PRO OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "87swps": {
        "name": "DEEBOT N30 PRO OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "a2ywac": {
        "name": "DEEBOT N50 PRO OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T10"
    },
    "ss87ia": {
        "name": "DEEBOT N50 PRO OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T10"
    },
    "r5zxjr": {
        "name": "DEEBOT N7",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "U2"
    },
    "n6cwdb": {
        "name": "DEEBOT N8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "N8"
    },
    "r5y7re": {
        "name": "DEEBOT N8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "ty84oi": {
        "name": "DEEBOT N8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "36xnxf": {
        "name": "DEEBOT N8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "7zya6u": {
        "name": "DEEBOT N8 BLACK",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "snxbvc": {
        "name": "DEEBOT N8 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "yu362x": {
        "name": "DEEBOT N8 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "s1f8g7": {
        "name": "DEEBOT N8 PRO CARE",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "85as7h": {
        "name": "DEEBOT N8 PRO+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "N8"
    },
    "ifbw08": {
        "name": "DEEBOT N8 PRO+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "N8"
    },
    "7bryc5": {
        "name": "DEEBOT N8+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "N8"
    },
    "b2jqs4": {
        "name": "DEEBOT N8+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "N8"
    },
    "c2of2s": {
        "name": "DEEBOT N9+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "PLUS"],
        "type": "N8"
    },
    "zg6qbz": {
        "name": "DEEBOT NEO 3.0 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "mini"
    },
    "zjavof": {
        "name": "DEEBOT NEO+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "h18jkh": {
        "name": "DEEBOT OZMO T8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"],
        "type": "T8"
    },
    "b742vd": {
        "name": "DEEBOT OZMO T8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"],
        "type": "T8"
    },
    "0bdtzz": {
        "name": "DEEBOT OZMO T8 PURE",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO"],
        "type": "T8"
    },
    "fqxoiu": {
        "name": "DEEBOT OZMO T8+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OZMO", "PLUS", "moppingUltraHigh"],
        "type": "T8"
    },
    "55aiho": {
        "name": "DEEBOT OZMO T8+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OZMO", "PLUS", "moppingUltraHigh"],
        "type": "T8"
    },
    "p1jij8": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "ohjbzz": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "poke1m": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "qdajz8": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "r0321c": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "ulzked": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "viq3mw": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "x9ugz3": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "cgm9ex": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "dzuvdj": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "uuu4n6": {
        "name": "DEEBOT T20 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "9ku8nu": {
        "name": "DEEBOT T20e OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "py3qif": {
        "name": "DEEBOT T20e OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "z4lvk7": {
        "name": "DEEBOT T30 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "822x8d": {
        "name": "DEEBOT T30 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "4vhygi": {
        "name": "DEEBOT T30 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "3w7j5e": {
        "name": "DEEBOT T30 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "tlthqk": {
        "name": "DEEBOT T30 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "36hdj8": {
        "name": "DEEBOT T30C Gen2",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBase"],
        "type": "T20"
    },
    "6q3rfp": {
        "name": "DEEBOT T30C Gen2",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBase"],
        "type": "T20"
    },
    "kl54s5": {
        "name": "DEEBOT T30C Gen2",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "stationBase"],
        "type": "T20"
    },
    "8tyt2y": {
        "name": "DEEBOT T30S",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "T20"
    },
    "eqmf84": {
        "name": "DEEBOT T30S",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "T20"
    },
    "4bdkrs": {
        "name": "DEEBOT T30S COMBO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "ue8kcc": {
        "name": "DEEBOT T30S COMBO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "9gqyaq": {
        "name": "DEEBOT T30S COMBO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "kr9c86": {
        "name": "DEEBOT T30S COMBO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "ee23uv": {
        "name": "DEEBOT T30S COMBO COMPLETE",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "xco2fc": {
        "name": "DEEBOT T30S PRO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh"],
        "type": "T20"
    },
    "cb69w5": {
        "name": "DEEBOT T30S PRO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh"],
        "type": "T20"
    },
    "63cum9": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "7c26ui": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "8o3xke": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "bheggm": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "c8rj4y": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "cuoipb": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "czjwet": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "elrxgb": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "k1lgm7": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "qnkybo": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "xztz07": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "8n0t5d": {
        "name": "DEEBOT T30S PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "2kuxj0": {
        "name": "DEEBOT T50 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "fd60kt": {
        "name": "DEEBOT T50 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "mezar1": {
        "name": "DEEBOT T50 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "nxeux7": {
        "name": "DEEBOT T50 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "qg1d6t": {
        "name": "DEEBOT T50 OMNI",
        "smartType": "MQ_APM",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "wgxm70": {
        "name": "DEEBOT T8",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T8"
    },
    "5089oy": {
        "name": "DEEBOT T8 AIVI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T8"
    },
    "tpnwyu": {
        "name": "DEEBOT T8 AIVI +",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T8"
    },
    "34vhpm": {
        "name": "DEEBOT T8 AIVI +",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T8"
    },
    "02qwum": {
        "name": "DEEBOT T80 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "9eamof": {
        "name": "DEEBOT T80 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "k8qkc7": {
        "name": "DEEBOT T80 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "aasdks": {
        "name": "DEEBOT T80 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "hu94nh": {
        "name": "DEEBOT T80 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "kdnfi5": {
        "name": "DEEBOT T80 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "ucn2xe": {
        "name": "DEEBOT T9",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "ipohi5": {
        "name": "DEEBOT T9",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "659yh8": {
        "name": "DEEBOT T9 AIVI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "lhbd50": {
        "name": "DEEBOT T9+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T9"
    },
    "um2ywg": {
        "name": "DEEBOT T9+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T9"
    },
    "85nbtp": {
        "name": "DEEBOT TEO OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "626v6g": {
        "name": "DEEBOT TEO+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS", "moppingUltraHigh"],
        "type": "T10"
    },
    "ipzjy0": {
        "name": "DEEBOT U2",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "U2"
    },
    "rvo6ev": {
        "name": "DEEBOT U2",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "wlqdkp": {
        "name": "DEEBOT U2",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "ts2ofl": {
        "name": "DEEBOT U2",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "1zqysa": {
        "name": "DEEBOT U2 POWER",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "chmi0g": {
        "name": "DEEBOT U2 POWER",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "nq9yhl": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "y2qy3m": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "7j1tu6": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "c0lwyn": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "d4v1pm": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "u6eqoa": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "12baap": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "u4h1uk": {
        "name": "DEEBOT U2 PRO",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "zjna8m": {
        "name": "DEEBOT U2 SE",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "3yqsch": {
        "name": "DEEBOT X1",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh"],
        "type": "X1"
    },
    "n4gstt": {
        "name": "DEEBOT X1 PLUS",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "PLUS"],
        "air_freshener_info": true,
        "type": "X1"
    },
    "1b23du": {
        "name": "DEEBOT X1 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X1"
    },
    "1vxt52": {
        "name": "DEEBOT X1 OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X1"
    },
    "bro5wu": {
        "name": "DEEBOT X1e OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X1"
    },
    "e6ofmn": {
        "name": "DEEBOT X2",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh"],
        "type": "X2"
    },
    "lf3bn4": {
        "name": "DEEBOT X2",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh"],
        "type": "X2"
    },
    "e6rcnf": {
        "name": "DEEBOT X2 COMBO",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingHigh", "COMBO"],
        "type": "X2"
    },
    "ip3mmy": {
        "name": "DEEBOT X2 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "OMNI"],
        "type": "X2"
    },
    "e6yxdm": {
        "name": "DEEBOT X5 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "4jd37g": {
        "name": "DEEBOT X5 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "lr4qcs": {
        "name": "DEEBOT X5 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "o0a4ju": {
        "name": "DEEBOT X5 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "rvflzn": {
        "name": "DEEBOT X5 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "w7k3yc": {
        "name": "DEEBOT X5 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "co3fyu": {
        "name": "DEEBOT X8 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "X2"
    },
    "4bx3w9": {
        "name": "DEEBOT X8 OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "X2"
    },
    "n0vyif": {
        "name": "DEEBOT X8 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "X2"
    },
    "gcu5tt": {
        "name": "DEEBOT X8 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "X2"
    },
    "y72606": {
        "name": "DEEBOT X8 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "X2"
    },
    "ilt3k8": {
        "name": "DEEBOT X9 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "62asng": {
        "name": "DEEBOT X9 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "huhcip": {
        "name": "DEEBOT X9 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "m2nkyq": {
        "name": "DEEBOT X9 PRO OMNI",
        "smartType": "BLAP2",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "rzwv5p": {
        "name": "DEEBOT T80S OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI", "rollerMop"],
        "type": "T20"
    },
    "twunby": {
        "name": "DEEBOT T90 PRO OMNI",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "OMNI", "rollerMop"],
        "type": "T20"
    }
};

// Known models of the Yeedi brand
exports.KnownYeediModels = {
    "p5nx9u": {
        "name": "yeedi 2 hybrid",
        "smartType": "QRP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh"],
        "type": "yeedi"
    },
    "6r6dbt": {
        "name": "yeedi cube",
        "smartType": "BL_QRP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    },
    "t5e5o6": {
        "name": "yeedi Floor 3 Station",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "kd0una": {
        "name": "yeedi Floor 3 Station",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "t6kipw": {
        "name": "Yeedi Floor 3 Station",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "u3bsxq": {
        "name": "Yeedi Floor 3 Station",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "rwp09o": {
        "name": "yeedi Floor 3+",
        "smartType": "MQ_AP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "vthpeg": {
        "name": "yeedi mop station",
        "smartType": "QRP",
        "V2": true,
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationMoppingBase"],
        "unit_care_info": true,
        "type": "yeedi"
    },
    "zwvyi2": {
        "name": "yeedi mop station pro",
        "smartType": "QRP",
        "V2": true,
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationMoppingBase"],
        "unit_care_info": true,
        "type": "yeedi"
    },
    "9t30w8": {
        "name": "yeedi vac 2",
        "smartType": "QRP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    },
    "aaxesz": {
        "name": "yeedi vac 2 pro",
        "smartType": "QRP",
        "V2": true,
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh"],
        "unit_care_info": true,
        "type": "yeedi"
    },
    "h041es": {
        "name": "yeedi vac hybrid",
        "smartType": "QRP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBase"],
        "unit_care_info": true,
        "type": "yeedi"
    },
    "04z443": {
        "name": "yeedi vac max",
        "smartType": "QRP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    },
    "mnx7f4": {
        "name": "yeedi vac station",
        "smartType": "QRP",
        "capabilities": ["vacuumBase", "navigationBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    }
};

// Known lawn mower models (e.g. GOAT G1)
exports.KnownLawnMowerModels = {
    "5xu9h3": {
        "name": "GOAT G1",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "itk04l": {
        "name": "GOAT G1",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "guzput": {
        "name": "GOAT G1-800",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "77atlz": {
        "name": "GOAT G1-800",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "s69g6z": {
        "name": "GOAT G1-2000",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "2ap5uq": {
        "name": "GOAT GX-600",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "ao7fpw": {
        "name": "GOAT GX-600",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "0jbd6s": {
        "name": "GOAT G1",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "2i0fns": {
        "name": "GOAT G1",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "2px96q": {
        "name": "GOAT G1",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "300lc5": {
        "name": "GOAT O500 Panorama",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "51rcxt": {
        "name": "GOAT A3000 LiDAR PRO",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "6cibhb": {
        "name": "GOAT G1",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "6n9pcz": {
        "name": "GOAT G1",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "9bts2s": {
        "name": "GOAT G1",
        "smartType": "BLAP",
        "type": "lawnMower"
    },
    "cr0e4u": {
        "name": "GOAT G1",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "o4kvvk": {
        "name": "GOAT G1",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "qhq6i0": {
        "name": "GOAT G1",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "aadham": {
        "name": "GOAT A3000 LiDAR PRO",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "e4gqia": {
        "name": "GOAT A3000 LiDAR PRO",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "neiwny": {
        "name": "GOAT A1600 RTK",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "wwswjm": {
        "name": "GOAT A3000 LiDAR PRO",
        "smartType": "BLAPG",
        "type": "lawnMower"
    },
    "xmp9ds": {
        "name": "GOAT A1600 RTK",
        "smartType": "BLAPG",
        "type": "lawnMower"
    }
};

// Legacy, XML-based devices (unsupported)
exports.LegacyDevices = {
    "3ab24g": {
        "name": "yeedi K650",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "09m4bu": {
        "name": "yeedi K650",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "u5vcmk": {
        "name": "yeedi vac",
        "smartType": "QRP",
        "type": "legacy"
    },
    "123": {
        "name": "DEEBOT Slim2 Series",
        "smartType": "SPA",
        "type": "legacy"
    },
    "02uwxm": {
        "name": "DEEBOT OZMO Slim10 Series",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "126": {
        "name": "DEEBOT N79",
        "smartType": "SPA",
        "type": "legacy"
    },
    "155": {
        "name": "DEEBOT N79S/SE",
        "smartType": "SPA",
        "type": "legacy"
    },
    "165": {
        "name": "DEEBOT N79T/W",
        "smartType": "SPA",
        "type": "legacy"
    },
    "vsc5ia": {
        "name": "DEEBOT 500",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "emzppx": {
        "name": "DEEBOT 501",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "r8ead0": {
        "name": "DEEBOT 502",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "9akc61": {
        "name": "DEEBOT 505",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "dl8fht": {
        "name": "DEEBOT 600 Series",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "16wdph": {
        "name": "DEEBOT 661",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "159": {
        "name": "DEEBOT OZMO 601",
        "smartType": "SPA",
        "type": "legacy"
    },
    "130": {
        "name": "DEEBOT OZMO 610 Series",
        "smartType": "SPA",
        "type": "legacy"
    },
    "uv242z": {
        "name": "DEEBOT 710",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "jr3pqa": {
        "name": "DEEBOT 711",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "d0cnel": {
        "name": "DEEBOT 711s",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "eyi9jv": {
        "name": "DEEBOT 715",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "ls1ok3": {
        "name": "DEEBOT 900 Series",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "y79a7u": {
        "name": "DEEBOT OZMO 900 Series",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "2pv572": {
        "name": "DEEBOT OZMO 905",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "aqdd5p": {
        "name": "DEEBOT OZMO 905",
        "smartType": "MQ_AP",
        "type": "legacy"
    },
    "115": {
        "name": "DEEBOT OZMO/PRO 930 Series",
        "smartType": "HK_AP",
        "type": "legacy"
    },
    "gd4uut": {
        "name": "DEEBOT OZMO 960",
        "smartType": "MQ_AP",
        "type": "legacy"
    }
};
