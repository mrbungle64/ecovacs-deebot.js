# Installation Guide

This guide describes how to install and configure the `ecovacs-deebot` library. 

> [!IMPORTANT]
> Officially, only Linux is supported.

---

## Prerequisites

* **Operating System:** Linux (Debian, Ubuntu, Alpine, etc.)
* **Node.js:** `>= 22.15` is required (as defined in `package.json`).
* **Package Manager:** `npm` (included with Node.js), `yarn`, or `pnpm`.

---

## 1. Standard Installation

To add the library to your Node.js project, run the following command in your project directory:

```bash
npm install ecovacs-deebot
```

---

## 2. Map Support (No Native Dependencies)

Map images, traces, and outlines (floor plans, WiFi heatmaps, spot areas, virtual boundaries, robot/charger icons) are rendered in **pure JavaScript**. There are **no native dependencies** and nothing to compile — the standard installation above is all you need on every platform, including Alpine Linux containers and ARM devices.

> [!NOTE]
> Earlier versions used the native [canvas](https://www.npmjs.com/package/canvas) package, which required Cairo system libraries (`libcairo2-dev`, `build-essential`, …) and was unstable on 32-bit systems. That dependency has been removed; those prerequisites and the `--no-optional` lean install are no longer needed.

---

## 3. Local Development & Contributions

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

### Linting
To check the code for style and quality issues, run:
```bash
npm run lint
```

---

## 4. Running with Docker Compose (Local Development & Testing)

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

   > [!NOTE]
   > If you add new dependencies to `package.json`, rebuild the image first:
   > ```bash
   > docker compose build
   > ```

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
* Boot a container using the official `node:22-bookworm-slim` image.
* Bind-mount the current repository directory into `/home/node/app` within the container.
* Run the container as the non-root `node` user to prevent file permission issues on your host.
* Automatically run `npm install` inside the container.
* Run the example application (`node example/app.js`).
* Isolate `node_modules` inside the container via an anonymous volume to prevent conflicts with local `node_modules` on the host.