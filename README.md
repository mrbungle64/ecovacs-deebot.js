![Logo](ecovacs-deebot.png)

# ecovacs-deebot.js

[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/latest?label=stable)](https://www.npmjs.com/package/ecovacs-deebot)
[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/beta?label=beta)](https://www.npmjs.com/package/ecovacs-deebot)
[![github-workflow](https://github.com/mrbungle64/ecovacs-deebot.js/actions/workflows/node.js.yml/badge.svg)](https://github.com/mrbungle64/ecovacs-deebot.js)

> **⚠️ Maintenance Status:** This project is transitioning to a more sustainable maintenance model. Development is shifting to focus exclusively on modern **MQTT/JSON** communication.

---

## 🗺️ The Roadmap & Legacy "Clean Cut"

To reduce technical debt and ensure long-term maintainability, the following architectural cut is implemented:

### Phase 1: Final Legacy Milestone (v0.9.x)
* **v0.9.5 (Stable):** Final stable release with verified support for legacy XML-based protocols.
* **v0.9.6-beta.12 (Final Legacy Release):** Last development milestone to support legacy hardware (XMPP/XML and MQTT/XML).

### Phase 2: Modernization (v1.0.0+)
* **v1.0.0-alpha.x:** Development has shifted exclusively to the modern **MQTT/JSON** stack.
* **Legacy Removal:** All legacy XML-based code and dependencies have been removed. This version only supports modern models.

---

## Models & Support Tiers

| Level | Model Series | Protocol | Support Status |
| :--- | :--- | :--- | :--- |
| 🟢 Active | OZMO 920/950, T8, T9, N8, X1 series | MQTT/JSON | Fully supported (Maintainer owned) |
| 🟡 Community | T10, T20, T30, X2, X5, X8 series etc. | MQTT/JSON | "Best effort" via community PRs |
| 🟡 Community | yeedi models (modern MQTT/JSON only) | MQTT/JSON | "Best effort" via community PRs |
| 🔴 Legacy | Deebot 900, Slim 2, OZMO 930 etc. | XML-based | **Unsupported** (Use v0.9.x) |

### Important Note on New Models
Support for new models is no longer added upon request. Due to high time constraints, **I will not implement new models based on logs alone.** Requests for new model support without an accompanying **Pull Request** may be closed without further notice. If you want to see a modern (MQTT/JSON) model supported, please contribute the necessary model definitions via PR.

---

## Installation & Usage

* [Installation Guide](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Installation)
* [Usage Instructions](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Usage)

**Requirement:** Node.js >= 20.x

---

## ⚠️ Known Issues
* **Map Image Generation:** Unstable on 32-bit systems and currently limited for newer series like X1, X2 or T30.
* **Movement Control:** The "move" function is highly model-specific and not implemented with universal logic.
* **Legacy Models:** If you own a model that requires the XML protocol, this version will throw an `Error`. Please stick to `v0.9.5` or `v0.9.6-beta.12`.

---

## Changelog

### 1.0.0-alpha.0 (Current)
* **Breaking Change:** Complete removal of the legacy XMPP/XML and MQTT/XML protocol stacks.
* Refactoring for pure MQTT/JSON communication.
* Enforced "fail-fast" for unsupported legacy models.


### 0.9.6 (In Progress / Final Legacy Support)
* **Breaking Change:** Bumped minimum required version of Node.js to 20.x
* Added auto V2 API handling
* Added initial support for T20, T30, X2, and X8 series
* Bumped dependencies
* *This version is the final release for all XML-based models*

---

## Credits
Special thanks to [@edenhaus](https://github.com/DeebotUniverse/client.py) for the ongoing exchange and to [@wpietri](https://github.com/wpietri) for the foundational reverse engineering of the protocol.

## Disclaimer
I am in no way affiliated with Ecovacs Robotics Co., Ltd. or yeedi Technology Limited.

## License
GNU GENERAL PUBLIC LICENSE - Copyright (c) 2026 Sascha Hölzel