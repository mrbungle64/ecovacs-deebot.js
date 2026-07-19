# Ecovacs Deebot Examples

This directory contains examples for using the `ecovacs-deebot.js` library.

## Getting Started

1.  **Configure your account:**
    Copy `example/.env.example` to `.env` in the root directory and fill in your Ecovacs credentials.

    ```bash
    cp example/.env.example .env
    ```

    The following environment variables are supported:

    | Variable | Required | Default | Description |
    |---|---|---|---|
    | `ECOVACS_ACCOUNT_ID` | Yes | — | Your Ecovacs account email or user ID |
    | `ECOVACS_PASSWORD` | Yes | — | Your Ecovacs account password |
    | `ECOVACS_COUNTRY_CODE` | No | `DE` | Two-letter country code (e.g. `US`, `DE`) |
    | `ECOVACS_DEVICE_NUMBER` | No | `0` | Index of the device to connect to (0-based) |
    | `ECOVACS_CLIENT_DEVICE_ID` | No | *(derived)* | Fixed **client** device id (the identity Ecovacs binds verification to — account-level, not the robot's `did`). Set a stable value to avoid repeated device verification (see below). When empty, it is derived from the host machine id. `ECOVACS_DEVICE_ID` is a deprecated alias |
    | `ECOVACS_AUTH_DOMAIN` | No | *(auto)* | Override the authentication domain (advanced) |

2.  **Run the unified example app:**
    This app automatically detects your device type (Vacuum or Air Purifier) and its capabilities (Mapping, Mopping, etc.).

    ```bash
    npm run appTest
    ```

### Device verification

Ecovacs may require the client device to be verified before the first login
succeeds. When that happens the login reports code `1013` and the example app
walks you through a two-step flow: it requests a code, which Ecovacs e-mails to
your account address, and prompts you to enter it. Because the prompt reads from
`stdin`, run it in an interactive terminal (with Docker, use
`docker compose run --rm ecovacs`, not `docker compose up`).

Verification is tied to the **client device id** — the identity of this app/
library instance (the `{deviceId}` in the API path), which is account-level and
**not** the robot's `did`. If that id changes on every start — which happens in
ephemeral Docker containers, where the derived machine id is regenerated each
run — Ecovacs treats each start as a new device and asks for a new code every
time. Set a fixed `ECOVACS_CLIENT_DEVICE_ID` in your `.env` to verify only once
(one value covers all vacuums of the account):

```bash
# any stable value works; generate one with:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

```
ECOVACS_CLIENT_DEVICE_ID=<paste the generated value>
```

The next start verifies this (new) id one last time; afterwards it stays
verified across runs. (`ECOVACS_DEVICE_ID` is still accepted as a deprecated
alias.)

### Alternatively: Run with Docker Compose

If you prefer to run the example application in a containerized environment (without installing Node.js locally):

1. **Configure your account** by copying and editing the `.env` file as described above.
2. **Start the container:**
   ```bash
   docker compose up
   ```
   If the device still needs verification (see [Device verification](#device-verification)), start it with an interactive terminal instead, so you can enter the e-mailed code:
   ```bash
   docker compose run --rm ecovacs
   ```
   *(Note: If you run into permission errors, use `sudo` or configure your user group as documented in [docs/INSTALLATION.md](../docs/INSTALLATION.md#5-running-with-docker-compose-local-development--testing)).*

## Files

-   `app.js`: Unified entry point — auto-detects device type and capabilities.
-   `lib/client.js`: Handles authentication, API connection, and EcovacsDevice initialization.
-   `tools.js`: Settings loader and utility functions for logging device data.
-   `settings.js`: Default configuration, reads credentials from environment variables.
