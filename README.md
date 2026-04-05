![Logo](ecovacs-deebot.png)

# ecovacs-deebot.js

[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/latest?label=stable)](https://www.npmjs.com/package/ecovacs-deebot)
[![Latest version](http://img.shields.io/npm/v/ecovacs-deebot/beta?label=beta)](https://www.npmjs.com/package/ecovacs-deebot)
[![github-workflow](https://github.com/mrbungle64/ecovacs-deebot.js/actions/workflows/node.js.yml/badge.svg)](https://github.com/mrbungle64/ecovacs-deebot.js)

> **⚠️ Maintenance Status:** This project is transitioning to a more sustainable maintenance model. Development is shifting to focus exclusively on modern **MQTT/JSON** communication.

---

## 🗺️ The Roadmap

To provide a stable exit point for legacy hardware while reducing technical debt, the following steps are planned:

1.  **Finalizing v0.9.6:** The current beta will be completed and released as the final **Stable** version. This will be the **final version to support legacy protocols** (XMPP/XML and MQTT/XML).
2.  **Transition to v1.0.0:** Following the 0.9.6 stable release, development will move to version 1.0.0. This major update will be **MQTT/JSON-only**. All legacy XML-based code and dependencies will be removed to improve performance and maintainability.

---

## Models & Support Tiers

| Level | Model Series | Protocol | Support Status |
| :--- | :--- | :--- | :--- |
| **🟢 Active** | OZMO 920/950, T8 AIVI, X1 Turbo, Airbot Z1 | MQTT/JSON | Owned by maintainer |
| **🟡 Community** | T10, T20, T30, X2, X8 series | MQTT/JSON | "Best effort" via **community PRs** |
| **🟡 Community** | yeedi models (MQTT/JSON only) | MQTT/JSON | "Best effort" via **community PRs** |
| **🔴 Legacy** | Deebot 900/901, OZMO 610/900, etc. | MQTT/XML | Supported in **v0.9.x only** |
| **🔴 Legacy** | Slim 2, OZMO 930 etc. | XMPP/XML | Supported in **v0.9.x only** |

### Note on New Models
Support for new models is no longer added upon request. Due to high time constraints, **I will not implement new models based on logs alone.** Requests for new model support without an accompanying **Pull Request** may be closed without further notice. If you want to see a modern (MQTT/JSON) model supported, please contribute the necessary model definitions via PR.

---

## Installation & Usage

* [Installation Guide](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Installation)
* [Usage Instructions](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Usage)

**Requirement:** Node.js >= 20.x

---

## Known Issues
* The **"move"** function is model-specific and is not implemented drawing universal logic.
* **Map image generation** is unstable on 32-bit systems and has limited functionality for newer series like X1 or X2.

---

## Changelog (Current)

### 0.9.6 (In Progress / Final Legacy Support)
* **Breaking Change:** Bumped minimum required version of Node.js to 20.x.
* Added auto V2 API handling.
* Added initial support for T20, T30, X2, and X8 series.
* *This version is the final stable release for all XML-based models.*

### 1.0.0 (Planned)
* Complete removal of the legacy XMPP/XML and MQTT/XML protocol stacks.
* Major dependency cleanup and refactoring for pure MQTT/JSON communication.

---

## Credits
Special thanks to [@edenhaus](https://github.com/DeebotUniverse/client.py) for the ongoing exchange and to [@wpietri](https://github.com/wpietri) for the foundational reverse engineering of the protocol.

## Disclaimer
I am in no way affiliated with Ecovacs Robotics Co., Ltd. or yeedi Technology Limited.

## License
GNU GENERAL PUBLIC LICENSE - Copyright (c) 2026 Sascha Hölzel