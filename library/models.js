// noinspection SpellCheckingInspection

/**
 * @file This file contains specific model configurations.
 * For a detailed explanation of properties and model identification strategy,
 * please refer to the `MODELS.md` file in this directory.
 */

// Modern and actively supported DEEBOT models
exports.SupportedDeebotModels = {
    "vi829v": {
        "name": "DEEBOT OZMO 920",
        "capabilities": ["vacuumBase", "moppingUltraHigh", "OZMO"],
        "type": "950"
    },
    "eazo2f": {
        "name": "DEEBOT OZMO 920/950",
        "deviceClassLink": "vi829v"
    },
    "yna5xi": {
        "name": "DEEBOT OZMO 950 Series",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO"],
        "type": "950"
    },
    "x5d34r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"],
        "type": "T8"
    },
    "7n95dm": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r"
    },
    "dqcneu": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r"
    },
    "sa4tf7": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r"
    },
    "uzel1r": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r",
    },
    "z0gd1j": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r"
    },
    "npu3pt": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r"
    },
    "q6pew4": {
        "name": "DEEBOT OZMO T8 AIVI",
        "deviceClassLink": "x5d34r"
    },
    "w16crm": {
        "name": "DEEBOT OZMO T8 AIVI+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "PLUS"],
        "type": "T8"
    },
    "2o4lnm": {
        "name": "DEEBOT X1 TURBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "TURBO"],
        "type": "X1"
    },
    "8onkgl": {
        "name": "DEEBOT X1 TURBO",
        "deviceClassLink": "2o4lnm"
    },
    "s523z1": {
        "name": "DEEBOT X1 TURBO",
        "deviceClassLink": "2o4lnm"
    },
};

// Supported air purifier models (e.g. AIRBOT Z1)
exports.SupportedAirPurifierModels = {
    "sdp1y1": {
        "name": "AIRBOT Z1",
        "type": "airbot"
    },
    "20anby": {
        "name": "Z1 Air Quality Monitor",
        "type": "aqMonitor"
    },
    "99fqkn": {
        "name": "Z1 Air Quality Monitor",
        "type": "aqMonitor"
    }
};

// Known DEEBOT models (bulk of T/N/X series)
exports.KnownDeebotModels = {
    "9rft3c": {
        "name": "DEEBOT OZMO T5",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO"],
        "type": "950"
    },
    "55uoqe": {
        "name": "DEEBOT MINI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "mini"
    },
    "jtmf04": {
        "name": "DEEBOT T10",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "rss8xk": {
        "name": "DEEBOT T10 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "lx3j7m": {
        "name": "DEEBOT T10 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "p95mgv": {
        "name": "DEEBOT T10 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "9s1s80": {
        "name": "DEEBOT T10 TURBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "TURBO"],
        "type": "T10"
    },
    "yaj7uz": {
        "name": "DEEBOT T10 TURBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "TURBO"],
        "type": "T10"
    },
    "m1wkuw": {
        "name": "DEEBOT N10",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "clojes": {
        "name": "DEEBOT N10 MAX+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "umwv6z": {
        "name": "DEEBOT N10 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "kr0277": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "edoodo": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "m17zko": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "p1wg05": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "3gwbbm": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "53qyvr": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "va8ygm": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "xw7zp9": {
        "name": "DEEBOT N20",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "buom7k": {
        "name": "DEEBOT N20 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "i35yb6": {
        "name": "DEEBOT N20 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "9kpees": {
        "name": "DEEBOT N20 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "aavvfb": {
        "name": "DEEBOT N20 PRO",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "c8gerr": {
        "name": "DEEBOT N20 PRO",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "qhe2o2": {
        "name": "DEEBOT N20 PRO PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "p0l0af": {
        "name": "DEEBOT N20 PRO PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "gwtll7": {
        "name": "DEEBOT N20 PRO PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "zgsvkq": {
        "name": "DEEBOT N20e",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "ruhc0q": {
        "name": "DEEBOT N20e",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T10"
    },
    "yinacl": {
        "name": "DEEBOT N20e PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "7piq03": {
        "name": "DEEBOT N20e PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "T10"
    },
    "jffnlf": {
        "name": "DEEBOT N3 MAX",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "950"
    },
    "zwkcqc": {
        "name": "DEEBOT N30 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "dlrbzq": {
        "name": "DEEBOT N30 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "87swps": {
        "name": "DEEBOT N30 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "a2ywac": {
        "name": "DEEBOT N50 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T10"
    },
    "ss87ia": {
        "name": "DEEBOT N50 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T10"
    },
    "r5zxjr": {
        "name": "DEEBOT N7",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "U2"
    },
    "n6cwdb": {
        "name": "DEEBOT N8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "r5y7re": {
        "name": "DEEBOT N8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "ty84oi": {
        "name": "DEEBOT N8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "36xnxf": {
        "name": "DEEBOT N8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "7zya6u": {
        "name": "DEEBOT N8 BLACK",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "snxbvc": {
        "name": "DEEBOT N8 PRO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "yu362x": {
        "name": "DEEBOT N8 PRO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "s1f8g7": {
        "name": "DEEBOT N8 PRO CARE",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "N8"
    },
    "85as7h": {
        "name": "DEEBOT N8 PRO+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "N8"
    },
    "ifbw08": {
        "name": "DEEBOT N8 PRO+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "N8"
    },
    "7bryc5": {
        "name": "DEEBOT N8+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "N8"
    },
    "b2jqs4": {
        "name": "DEEBOT N8+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "N8"
    },
    "a7lhb1": {
        "name": "DEEBOT N9+",
        "capabilities": ["vacuumBase", "PLUS"],
        "type": "N8"
    },
    "c2of2s": {
        "name": "DEEBOT N9+",
        "capabilities": ["vacuumBase", "PLUS"],
        "type": "N8"
    },
    "zg6qbz": {
        "name": "DEEBOT NEO 3.0 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "zjavof": {
        "name": "DEEBOT NEO+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "h18jkh": {
        "name": "DEEBOT OZMO T8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"],
        "type": "T8"
    },
    "b742vd": {
        "name": "DEEBOT OZMO T8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"],
        "type": "T8"
    },
    "0bdtzz": {
        "name": "DEEBOT OZMO T8 PURE",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO"],
        "type": "T8"
    },
    "fqxoiu": {
        "name": "DEEBOT OZMO T8+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "PLUS"],
        "type": "T8"
    },
    "55aiho": {
        "name": "DEEBOT OZMO T8+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "PLUS"],
        "type": "T8"
    },
    "p1jij8": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "m4xnd8": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "ohjbzz": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "paeygf": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "poke1m": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "qdajz8": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "r0321c": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "ulzked": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "viq3mw": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "x9ugz3": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "yi396x": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "cgm9ex": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20",
    },
    "dzuvdj": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20",
    },
    "uuu4n6": {
        "name": "DEEBOT T20 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20",
    },
    "9ku8nu": {
        "name": "DEEBOT T20e OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "py3qif": {
        "name": "DEEBOT T20e OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "z4lvk7": {
        "name": "DEEBOT T30 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "822x8d": {
        "name": "DEEBOT T30 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "4vhygi": {
        "name": "DEEBOT T30 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "3w7j5e": {
        "name": "DEEBOT T30 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "tlthqk": {
        "name": "DEEBOT T30 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "36hdj8": {
        "name": "DEEBOT T30C Gen2",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBase"],
        "type": "T20"
    },
    "6q3rfp": {
        "name": "DEEBOT T30C Gen2",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBase"],
        "type": "T20"
    },
    "kl54s5": {
        "name": "DEEBOT T30C Gen2",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "stationBase"],
        "type": "T20"
    },
    "8tyt2y": {
        "name": "DEEBOT T30S",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "T20"
    },
    "eqmf84": {
        "name": "DEEBOT T30S",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "T20"
    },
    "4bdkrs": {
        "name": "DEEBOT T30S COMBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "ue8kcc": {
        "name": "DEEBOT T30S COMBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "9gqyaq": {
        "name": "DEEBOT T30S COMBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "kr9c86": {
        "name": "DEEBOT T30S COMBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "ee23uv": {
        "name": "DEEBOT T30S COMBO COMPLETE",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "COMBO"],
        "type": "T20"
    },
    "xco2fc": {
        "name": "DEEBOT T30S PRO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh"],
        "type": "T20"
    },
    "cb69w5": {
        "name": "DEEBOT T30S PRO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh"],
        "type": "T20"
    },
    "63cum9": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "7c26ui": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "8o3xke": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "bheggm": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "c8rj4y": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "cuoipb": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "czjwet": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "elrxgb": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "k1lgm7": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "qnkybo": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "xztz07": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "8n0t5d": {
        "name": "DEEBOT T30S PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "2kuxj0": {
        "name": "DEEBOT T50 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "fd60kt": {
        "name": "DEEBOT T50 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "mezar1": {
        "name": "DEEBOT T50 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "nxeux7": {
        "name": "DEEBOT T50 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "qg1d6t": {
        "name": "DEEBOT T50 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "wgxm70": {
        "name": "DEEBOT T8",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T8"
    },
    "bs40nz": {
        "name": "DEEBOT T8 AIVI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T8"
    },
    "5089oy": {
        "name": "DEEBOT T8 AIVI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T8"
    },
    "tpnwyu": {
        "name": "DEEBOT T8 AIVI +",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T8"
    },
    "34vhpm": {
        "name": "DEEBOT T8 AIVI +",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T8"
    },
    "vdehg6": {
        "name": "DEEBOT T8 AIVI +",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T8"
    },
    "a1nNMoAGAsH": {
        "name": "DEEBOT T8 MAX",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "T8"
    },
    "no61kx": {
        "name": "DEEBOT T8 POWER",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "T8"
    },
    "02qwum": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "9eamof": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "k8qkc7": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    },
    "aasdks": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "hu94nh": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "kdnfi5": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "w7y3cb": {
        "name": "DEEBOT T80 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20",
    },
    "ucn2xe": {
        "name": "DEEBOT T9",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "ipohi5": {
        "name": "DEEBOT T9",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "8kwdb4": {
        "name": "DEEBOT T9 AIVI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "659yh8": {
        "name": "DEEBOT T9 AIVI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "stationBaseOptional"],
        "type": "T9"
    },
    "kw9ayx": {
        "name": "DEEBOT T9 AIVI Plus",
        "capabilities": ["vacuumBase", "PLUS"],
        "type": "T9"
    },
    "lhbd50": {
        "name": "DEEBOT T9+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T9"
    },
    "um2ywg": {
        "name": "DEEBOT T9+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T9"
    },
    "85nbtp": {
        "name": "DEEBOT TEO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T10"
    },
    "626v6g": {
        "name": "DEEBOT TEO+",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "PLUS"],
        "type": "T10"
    },
    "ipzjy0": {
        "name": "DEEBOT U2",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh"],
        "type": "U2"
    },
    "rvo6ev": {
        "name": "DEEBOT U2",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "wlqdkp": {
        "name": "DEEBOT U2",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "ts2ofl": {
        "name": "DEEBOT U2",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "1zqysa": {
        "name": "DEEBOT U2 POWER",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "chmi0g": {
        "name": "DEEBOT U2 POWER",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "nq9yhl": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "y2qy3m": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "7j1tu6": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "c0lwyn": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "d4v1pm": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "u6eqoa": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "12baap": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "u4h1uk": {
        "name": "DEEBOT U2 PRO",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "zjna8m": {
        "name": "DEEBOT U2 SE",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "U2"
    },
    "3yqsch": {
        "name": "DEEBOT X1",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "X1"
    },
    "n4gstt": {
        "name": "DEEBOT X1 PLUS",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "PLUS"],
        "type": "X1"
    },
    "8bja83": {
        "name": "DEEBOT X1 OMNI",
        "capabilities": ["vacuumBase", "OMNI"],
        "type": "X1"
    },
    "1b23du": {
        "name": "DEEBOT X1 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X1"
    },
    "1vxt52": {
        "name": "DEEBOT X1 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X1"
    },
    "bro5wu": {
        "name": "DEEBOT X1e OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X1"
    },
    "e6ofmn": {
        "name": "DEEBOT X2",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh"],
        "type": "X2"
    },
    "lf3bn4": {
        "name": "DEEBOT X2",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh"],
        "type": "X2"
    },
    "e6rcnf": {
        "name": "DEEBOT X2 COMBO",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingHigh", "COMBO"],
        "type": "X2"
    },
    "p7l7iu": {
        "name": "DEEBOT X2 OMNI Height",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "ip3mmy": {
        "name": "DEEBOT X2 PRO OMNI",
        "capabilities": ["vacuumBase", "OMNI"],
        "type": "X2"
    },
    "e6yxdm": {
        "name": "DEEBOT X5 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "4jd37g": {
        "name": "DEEBOT X5 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "lr4qcs": {
        "name": "DEEBOT X5 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "o0a4ju": {
        "name": "DEEBOT X5 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "rvflzn": {
        "name": "DEEBOT X5 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "w7k3yc": {
        "name": "DEEBOT X5 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "X2"
    },
    "mxse7w": {
        "name": "DEEBOT X5 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "co3fyu": {
        "name": "DEEBOT X8 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "4bx3w9": {
        "name": "DEEBOT X8 OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "n0vyif": {
        "name": "DEEBOT X8 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "eom321": {
        "name": "DEEBOT X8 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "gcu5tt": {
        "name": "DEEBOT X8 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "y72606": {
        "name": "DEEBOT X8 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "ilt3k8": {
        "name": "DEEBOT X9 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "lwmdoj": {
        "name": "DEEBOT X9 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "0jv4ti": {
        "name": "DEEBOT X9 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "62asng": {
        "name": "DEEBOT X9 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "huhcip": {
        "name": "DEEBOT X9 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "m2nkyq": {
        "name": "DEEBOT X9 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "X2"
    },
    "rzwv5p": {
        "name": "DEEBOT T80S OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "moppingUltraHigh", "OMNI"],
        "type": "T20"
    },
    "twunby": {
        "name": "DEEBOT T90 PRO OMNI",
        "capabilities": ["vacuumBase", "suctionMaxPlus", "OMNI"],
        "type": "T20"
    }
};

// Known models of the Yeedi brand
exports.KnownYeediModels = {
    "p5nx9u": {
        "name": "yeedi 2 hybrid",
        "capabilities": ["vacuumBase", "moppingHigh"],
        "type": "yeedi"
    },
    "6r6dbt": {
        "name": "yeedi cube",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    },
    "t5e5o6": {
        "name": "yeedi Floor 3 Station",
        "capabilities": ["vacuumBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "kd0una": {
        "name": "yeedi Floor 3 Station",
        "capabilities": ["vacuumBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "t6kipw": {
        "name": "Yeedi Floor 3 Station",
        "capabilities": ["vacuumBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "u3bsxq": {
        "name": "Yeedi Floor 3 Station",
        "capabilities": ["vacuumBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "rwp09o": {
        "name": "yeedi Floor 3+",
        "capabilities": ["vacuumBase", "moppingUltraHigh", "stationMoppingBase"],
        "type": "yeedi"
    },
    "vthpeg": {
        "name": "yeedi mop station",
        "V2": true,
        "capabilities": ["vacuumBase", "moppingHigh", "stationMoppingBase"],
        "unit_care_info": true,
        "round_mop_info": true,
        "type": "yeedi"
    },
    "zwvyi2": {
        "name": "yeedi mop station pro",
        "V2": true,
        "capabilities": ["vacuumBase", "moppingHigh", "stationMoppingBase"],
        "unit_care_info": true,
        "round_mop_info": true,
        "type": "yeedi"
    },
    "9t30w8": {
        "name": "yeedi vac 2",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    },
    "aaxesz": {
        "name": "yeedi vac 2 pro",
        "V2": true,
        "capabilities": ["vacuumBase", "moppingHigh", "stationBase"],
        "unit_care_info": true,
        "type": "yeedi"
    },
    "h041es": {
        "name": "yeedi vac hybrid",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBase"],
        "unit_care_info": true,
        "type": "yeedi"
    },
    "04z443": {
        "name": "yeedi vac max",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    },
    "mnx7f4": {
        "name": "yeedi vac station",
        "capabilities": ["vacuumBase", "moppingHigh", "stationBase"],
        "type": "yeedi"
    }
};

// Known lawn mower models (e.g. GOAT G1)
exports.KnownLawnMowerModels = {
    "5xu9h3": {
        "name": "GOAT G1",
        "type": "lawnMower"
    },
    "itk04l": {
        "name": "GOAT G1",
        "type": "lawnMower"
    },
    "guzput": {
        "name": "GOAT G1-800",
        "type": "lawnMower"
    },
    "77atlz": {
        "name": "GOAT G1-800",
        "type": "lawnMower"
    },
    "s69g6z": {
        "name": "GOAT G1-2000",
        "type": "lawnMower"
    },
    "2ap5uq": {
        "name": "GOAT GX-600",
        "type": "lawnMower"
    },
    "ao7fpw": {
        "name": "GOAT GX-600",
        "type": "lawnMower"
    },
    "0jbd6s": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "2i0fns": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "2px96q": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "300lc5": {
        "name": "DEEBOT GOAT O500 Panorama",
        "type": "lawnMower"
    },
    "51rcxt": {
        "name": "GOAT A3000 LiDAR PRO",
        "type": "lawnMower"
    },
    "6cibhb": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "6n9pcz": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "9bts2s": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "cr0e4u": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "o4kvvk": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "qhq6i0": {
        "name": "DEEBOT GOAT G1",
        "type": "lawnMower"
    },
    "aadham": {
        "name": "GOAT A3000 LiDAR PRO",
        "type": "lawnMower"
    },
    "e4gqia": {
        "name": "GOAT A3000 LiDAR PRO",
        "type": "lawnMower"
    },
    "neiwny": {
        "name": "DEEBOT GOAT A1600 RTK",
        "type": "lawnMower"
    },
    "wwswjm": {
        "name": "GOAT A3000 LiDAR PRO",
        "type": "lawnMower"
    },
    "xmp9ds": {
        "name": "DEEBOT GOAT A1600 RTK",
        "type": "lawnMower"
    }
};

// Legacy, XML-based devices (unsupported)
exports.LegacyDevices = {
    "3ab24g": {
        "name": "yeedi K650",
        "type": "legacy",
    },
    "09m4bu": {
        "name": "yeedi K650",
        "type": "legacy"
    },
    "u5vcmk": {
        "name": "yeedi vac",
        "type": "legacy"
    },
    "123": {
        "name": "DEEBOT Slim2 Series",
        "type": "legacy"
    },
    "02uwxm": {
        "name": "DEEBOT OZMO Slim10 Series",
        "type": "legacy"
    },
    "126": {
        "name": "DEEBOT N79",
        "type": "legacy"
    },
    "155": {
        "name": "DEEBOT N79S/SE",
        "type": "legacy"
    },
    "165": {
        "name": "DEEBOT N79T/W",
        "type": "legacy"
    },
    "vsc5ia": {
        "name": "DEEBOT 500",
        "type": "legacy"
    },
    "emzppx": {
        "name": "DEEBOT 501",
        "type": "legacy"
    },
    "r8ead0": {
        "name": "DEEBOT 502",
        "type": "legacy"
    },
    "9akc61": {
        "name": "DEEBOT 505",
        "type": "legacy"
    },
    "dl8fht": {
        "name": "DEEBOT 600 Series",
        "type": "legacy"
    },
    "16wdph": {
        "name": "DEEBOT 661",
        "type": "legacy"
    },
    "159": {
        "name": "DEEBOT OZMO 601",
        "type": "legacy"
    },
    "130": {
        "name": "DEEBOT OZMO 610 Series",
        "type": "legacy"
    },
    "uv242z": {
        "name": "DEEBOT 710",
        "type": "legacy"
    },
    "jr3pqa": {
        "name": "DEEBOT 711",
        "type": "legacy"
    },
    "d0cnel": {
        "name": "DEEBOT 711s",
        "type": "legacy"
    },
    "eyi9jv": {
        "name": "DEEBOT 715",
        "type": "legacy"
    },
    "ls1ok3": {
        "name": "DEEBOT 900 Series",
        "type": "legacy"
    },
    "y79a7u": {
        "name": "DEEBOT OZMO 900 Series",
        "type": "legacy"
    },
    "2pv572": {
        "name": "DEEBOT OZMO 905",
        "type": "legacy"
    },
    "aqdd5p": {
        "name": "DEEBOT OZMO 905",
        "type": "legacy",
    },
    "115": {
        "name": "DEEBOT OZMO/PRO 930 Series",
        "type": "legacy"
    },
    "gd4uut": {
        "name": "DEEBOT OZMO 960",
        "type": "legacy"
    }
};