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

---

## 5. Running with Docker Compose (Local Development & Testing)

For local development and running the example application in a self-contained environment without installing Node.js on your host system, you can use the provided Docker Compose configuration.

### Steps:

1. **Configure credentials:**
   Copy the example environment file to `.env` in the root directory and fill in your Ecovacs account credentials:
   ```bash
   cp example/.env.example .env
   ```

2. **Start the container:**
   Run the following command to start the container:
   ```bash
   docker compose up
   ```

   > [!TIP]
   > If you encounter a `permission denied` error when connecting to the Docker daemon socket, you can either run the command with `sudo`:
   > ```bash
   > sudo docker compose up
   > ```
   > Or add your current user to the `docker` group to run docker without root privileges:
   > ```bash
   > # Create the docker group if it does not exist
   > sudo groupadd docker
   > 
   > # Add user to the docker group
   > sudo usermod -aG docker $USER
   > # Then log out and log back in, or run:
   > newgrp docker
   > ```

This will:
* Boot a container using the official `node:20-bookworm-slim` image.
* Bind-mount the current repository directory into `/home/node/app` within the container.
* Run the container as the non-root `node` user to prevent file permission issues on your host.
* Automatically run `npm install` inside the container.
* Run the example application (`node example/app.js`).
* Isolate `node_modules` inside the container via an anonymous volume to prevent conflicts with local `node_modules` on the host.