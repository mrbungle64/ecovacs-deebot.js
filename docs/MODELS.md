# Device Models and Capability Resolution

The `ecovacs-deebot.js` library uses a multi-layered configuration system to determine the features and commands supported by a specific robot model. 

This system is distributed across three main files:
1.  **`library/models.js`** (The main dictionary mapping `deviceClass` IDs to robots)
2.  **`library/modelTypes.js`** (Generation/Platform defaults)
3.  **`library/capabilityTypes.js`** (Reusable feature bundles)

---

## 1. Structure of `models.js`

The `models.js` file is the central database of all robots known to the library. Every Ecovacs and yeedi device reports a 6-character alphanumeric `deviceClass` string (e.g., `"vi829v"`, `"x5d34r"`). 

The file is organized into several export dictionaries:
- `SupportedDeebotModels`: Modern DEEBOT models.
- `SupportedAirPurifierModels`: AIRBOT models.
- `KnownDeebotModels`: Bulk list of standard DEEBOTs (T, N, X series).
- `KnownYeediModels`: Models under the yeedi sub-brand.
- `KnownLawnMowerModels`: GOAT series lawn mowers.
- `LegacyDevices`: Older, unsupported XML/XMPP models (pre-2019).

### Anatomy of a Model Entry

A typical entry looks like this:

```javascript
"x5d34r": {
    "name": "DEEBOT OZMO T8 AIVI",
    "type": "T8",
    "capabilities": ["vacuumBase", "navigationBase", "suctionMaxPlus", "moppingUltraHigh", "OZMO", "stationBaseOptional"]
}
```

Or, using a `deviceClassLink` to alias an identical hardware variant:

```javascript
"7n95dm": {
    "name": "DEEBOT OZMO T8 AIVI",
    "deviceClassLink": "x5d34r"
}
```

### Direct Model Properties

Any property explicitly set inside a model entry in `models.js` has the **highest priority**. For example, if a specific variant of a T10 model lacks the air freshener, setting `"air_freshener_info": false` directly in its `models.js` entry will override any defaults from its `type` or `capabilities`.

---

## 2. Relationship to `modelTypes.js`

The `"type"` property in a `models.js` entry (e.g., `"type": "T8"`) links the robot to a base hardware platform defined in `modelTypes.js`.

**Purpose of `modelTypes.js`:**
It defines the *default* baseline properties shared by an entire generation of robots.

For example, looking at the `T8` type in `modelTypes.js`:
```javascript
"T8": {
  "deviceType": "Vacuum Cleaner",
  "V2": true,
  "unit_care_info": true
}
```
By simply declaring `"type": "T8"` in `models.js`, the robot automatically inherits these three properties. It establishes that this is a Vacuum Cleaner using the modern V2 JSON/MQTT protocol and supports consumable life-span tracking.

---

## 3. Relationship to `capabilityTypes.js`

The `"capabilities"` array in a `models.js` entry links to reusable feature bundles defined in `capabilityTypes.js`.

**Purpose of `capabilityTypes.js`:**
It groups related properties that frequently appear together (like "OMNI station features" or "basic navigation").

For example, the `"OMNI"` capability bundle includes:
```javascript
"OMNI": {
    unit_care_info: true,
    water_amount: ["LOW", "MEDIUM", "HIGH"],
    round_mop_info: true,
    air_drying: true,
    auto_empty_station: true
}
```

### The Capabilities Array (Order Matters!)

When the library reads the `"capabilities"` array, it applies the bundles **from left to right**. 

If a robot has `capabilities: ["vacuumBase", "suctionMaxPlus", "PLUS"]`:
1. It gets basic vacuum properties from `vacuumBase`.
2. It gets 4-speed suction from `suctionMaxPlus`.
3. It gets auto-empty station properties from `PLUS`.

**Important:** Later entries in the array *override* earlier ones. 
If `vacuumBase` sets `clean_speed` to 3 levels, and `suctionMaxPlus` follows it in the array, `suctionMaxPlus` wins and sets `clean_speed` to 4 levels. 

---

## 4. Summary: The Resolution Order

When the `CapabilityManager` asks "Does this robot support X?", it checks in this exact order (where later steps override earlier ones):

1.  **`modelTypes.js` defaults** (Lowest priority)
2.  **`capabilityTypes.js` bundles** (Resolved left-to-right from the model's `capabilities` array)
3.  **`models.js` direct properties** (Highest priority)