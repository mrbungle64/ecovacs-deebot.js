# EcoVacs Deebot Examples

This directory contains examples for using the `ecovacs-deebot.js` library.

## Getting Started

1.  **Configure your account:**
    Copy `example/.env.example` to `example/.env` (or use environment variables) and fill in your EcoVacs credentials.
    
    ```bash
    cp example/.env.example example/.env
    ```

2.  **Run the unified example app:**
    This app automatically detects your device type (Vacuum or Air Purifier) and its capabilities (Mapping, Mopping, etc.).
    
    ```bash
    npm run appTest
    ```

## Files

-   `app.js`: The unified entry point for all device types.
-   `lib/client.js`: A modular helper for authentication and connection logic.
-   `tools.js`: Utility functions for logging and data dumping.
-   `settings.js`: Configuration loader.
