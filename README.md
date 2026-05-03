# ecovacs-deebot.js

![Logo](ecovacs-deebot.png)

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
* **v1.0.0+:** Development has shifted exclusively to a pure **MQTT/JSON** stack.
* **Legacy Removal:** All legacy XML-based code and dependencies have been removed to ensure stability and security.

---

## Why we are dropping Legacy Support

The decision to end support for XML-based models is a technical necessity:

* **Node.js 20+ & Infrastructure Constraints:** Modern environments and ARM64 architectures require up-to-date build toolchains. Our legacy infrastructure and the reliance on native components for older protocols have reached a point where they no longer reliably compile or run with modern Node.js headers ("Compilation Hell").
* **Security vs. Compatibility:** To bypass the build issues of native modules, legacy protocols often rely on pure JavaScript XML parsers like `@xmldom/xmldom`. These are known to be vulnerable to security risks like XML Injection (XXE) and are no longer suitable for modern, secure architectures.
* **Official End-of-Life:** Most legacy models (e.g., 500, 600, 700, 900 series, OZMO 930) reached their official manufacturer support end.
* **Clean Cut:** Dropping these protocols allows us to remove the associated technical debt and risky dependencies, focusing exclusively on a fast and stable MQTT/JSON architecture.

---

## Models & support tiers

| Level | Model series | Protocol | Support status |
| :--- | :--- | :--- | :--- |
| 🟢 Active | OZMO 920/950, T8, X1 series | MQTT/JSON | Fully supported (Maintainer owned) |
| 🟡 Community | T10, T20, T30, X2, X5, X8 series etc. | MQTT/JSON | "Best effort" via community PRs |
| 🟡 Community | yeedi models (modern MQTT/JSON only) | MQTT/JSON | "Best effort" via community PRs |
| 🔴 Legacy | Deebot 900, Slim 2, OZMO 930 etc. | XML-based | **Unsupported** (Use v0.9.x) |

### Important note on new models
Support for new models is no longer added upon request. Due to high time constraints, **I will not implement new models based on logs alone**. Requests for new model support without an accompanying **Pull Request** may be closed without further notice.

---

## Installation & usage

* [Installation Guide](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Installation)
* [Usage Instructions](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Usage)

**Requirement:** Node.js >= 20.x

---

## ⚠️ Known issues
* **Map Image Generation:** Unstable on 32-bit systems and currently limited for newer series like X1, X2 or T30.
* **Movement Control:** The "move" function is highly model-specific and not implemented with universal logic.
* **Legacy Models:** If you own a model that requires the XML protocol, this version will throw an `Error`. Please stick to `v0.9.5` or `v0.9.6-beta.12`.

---

## Changelog

### 1.0.0-alpha.x
* **Breaking Change:** Complete removal of legacy XMPP/XML and MQTT/XML protocol stacks.
* Refactoring for pure MQTT/JSON communication.

### 0.9.6 (Final Legacy Support)
* **Final milestone** for all XML-based models.
* Enforced minimum Node.js version 20.x.
* Added support for T20, T30, X2, and X8 series.

### 0.0.2 - 0.9.5
* See [Changelog archive](https://github.com/mrbungle64/ecovacs-deebot.js/wiki/Changelog-(archive))

---

## Credits
Special thanks to [@edenhaus](https://github.com/DeebotUniverse/client.py) for the technical exchange and to [@wpietri](https://github.com/wpietri) for the foundational reverse engineering of the protocol.

## Disclaimer
I am in no way affiliated with Ecovacs Robotics Co., Ltd. or yeedi Technology Limited.

## License
GNU GENERAL PUBLIC LICENSE - Copyright (c) 2026 Sascha Hölzel