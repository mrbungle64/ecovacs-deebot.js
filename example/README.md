# Ecovacs Deebot Examples

This directory contains examples for using the `ecovacs-deebot.js` library.

## Getting Started

1.  **Configure your account:**
    Copy `example/.env.example` to `.env` in the root directory (or use environment variables) and fill in your Ecovacs credentials.
    
    ```bash
    cp example/.env.example .env
    ```

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
   *(Note: If you run into permission errors, use `sudo docker compose up` or configure your user group as documented in [docs/INSTALLATION.md](docs/INSTALLATION.md#5-running-with-docker-compose-local-development--testing)).*

## Files

-   `app.js`: The unified entry point for all device types.
-   `lib/client.js`: A modular helper for authentication and connection logic.
-   `tools.js`: Utility functions for logging and data dumping.
-   `settings.js`: Configuration loader.
