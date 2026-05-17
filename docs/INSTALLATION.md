# Installation Guide

This guide describes how to install and configure the `ecovacs-deebot` library. 

> [!IMPORTANT]
> Officially, only Linux is supported.

---

## Prerequisites

* **Operating System:** Linux (Debian, Ubuntu, Alpine, etc.)
* **Node.js:** `>= 20.x` is required (as defined in `package.json`).
* **Package Manager:** `npm` (included with Node.js), `yarn`, or `pnpm`.

---

## 1. Standard Installation

To add the library to your Node.js project, run the following command in your project directory:

```bash
npm install ecovacs-deebot
```

---

## 2. Installing Without Optional Map Features (Lean Install)

This library uses the [canvas](https://www.npmjs.com/package/canvas) package to process map images, traces, and outlines. Canvas is classified as an **optional dependency**.

If your vacuum model does not support mapping, or if you do not want to load the native dependencies required by `canvas`, you can install a lean version of the library:

```bash
npm install ecovacs-deebot --no-optional
```

---

## 3. Configuring Map Support (`canvas` Dependencies)

If you wish to use the full map functionality (retrieving outlines, WiFi heatmaps, traces), you need the `canvas` package. 

> [!NOTE]
> In most environments (Linux x64/arm64), `node-canvas` will automatically install prebuilt binaries, meaning no compilation or system package installation is necessary.
>
> If your platform does not have a prebuilt binary (e.g., certain Alpine Linux Docker containers, older ARM setups, or custom builds), you must install the native pre-requisite libraries below.

### Debian / Ubuntu-based Linux Systems
Before installing, run the following commands to install the required system libraries:
```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### Alpine Linux (e.g. Node-RED / Home Assistant Docker Containers)
To build canvas inside Alpine Linux containers, execute:
```bash
apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev
```

---

## 4. Local Development & Contributions

To clone and install the library locally for development or testing:

```bash
# Clone the repository
git clone https://github.com/mrbungle64/ecovacs-deebot.js.git

# Navigate to the directory
cd ecovacs-deebot.js

# Install all dependencies (including devDependencies)
npm install
```

### Running Tests
To ensure everything is installed and working correctly, run the built-in test suite:
```bash
npm test
```