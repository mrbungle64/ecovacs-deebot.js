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
    | `ECOVACS_AUTH_DOMAIN` | No | *(auto)* | Override the authentication domain (advanced) |

2.  **Run the unified example app:**
    This app automatically detects your device type (Vacuum or Air Purifier) and its capabilities (Mapping, Mopping, etc.).

    ```bash
    npm run appTest
    ```

### Alternatively: Run with Docker Compose

If you prefer to run the example application in a containerized environment (without installing Node.js locally):

1. **Configure your account** by copying and editing the `.env` file as described above.
2. **Start the container:**
   ```bash
   docker compose up
   ```
   *(Note: If you run into permission errors, use `sudo docker compose up` or configure your user group as documented in [docs/INSTALLATION.md](../docs/INSTALLATION.md#5-running-with-docker-compose-local-development--testing)).*

## Files

-   `app.js`: Unified entry point — auto-detects device type and capabilities.
-   `lib/client.js`: Handles authentication, API connection, and VacBot initialization.
-   `tools.js`: Settings loader and utility functions for logging device data.
-   `settings.js`: Default configuration, reads credentials from environment variables.
