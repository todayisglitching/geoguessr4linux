# Development & Build Instructions

This document provides details for developers working on the **GeoGuessr Duels Linux Patch**.

## 💻 Local Development

1.  **Environment Setup:**
    *   Install Node.js 20+ and `npm`.
    *   Download the Steamworks SDK (see [Installation Guide](installation.md)).
    *   Place the `steamworks_sdk/redistributable_bin` directory in the project root.

2.  **Installing Dependencies:**
    ```bash
    npm install
    ```

3.  **Running the Application:**
    *   Production environment:
        ```bash
        npm start
        ```
    *   Development environment:
        ```bash
        npm run start:dev
        ```
        not recommended for using, geoguessr.local not resolving by dns, i think geoguessr devs used theys own dns server.

    *   Linux Optimized (X11):
        ```bash
        npm run start:linux-x11
        ```

    *   Linux Safe Mode (No HW Accel):
        ```bash
        npm run start:linux-safe
        ```

## 🔍 Debugging Tools

*   **Electron DevTools:** Automatically opens when the environment is not `prod`. You can also manually open them with `Ctrl+Shift+I` (if enabled in the window configuration).
*   **Logging:** The project uses `electron-log`. Logs are stored in:
    *   `~/.config/GeoGuessr Duels/logs/main.log` (Linux)
*   **Steam IPC Tracing:** Set `STEAM_IPC_TRACE=1` to see all Steam-related IPC calls in the console.
    ```bash
    STEAM_IPC_TRACE=1 npm start
    ```
*   **Steam SDK Debugging:** Set `STEAM_SDK_DEBUG=1` to enable additional SDK-level debug logging.

## 🏗 Build System

The project uses `electron-builder` for packaging.

### Build Scripts

*   `npm run build:linux-img`: Packages the application as an **AppImage**.
*   `npm run build:linux-bin`: Produces an unpacked binary directory in `dist/linux-unpacked/`.
*   `npm run build:linux-tar`: Produces a compressed `.tar.gz` archive.

The build configuration is specified in the `build` section of `package.json`.

### Building for Different Architectures

*   By default, `electron-builder` builds for the current architecture.
*   To build for `x64` on a different architecture:
    ```bash
    npx electron-builder --linux --x64
    ```

## 🛠 Project Components

*   `main.js`: Main process logic.
*   `steam-ipc.js`: Bridge between Electron IPC and the Steamworks SDK.
*   `preload.js`: Bridge between the renderer process and Electron.
*   `index.html`: (Not included in this repo) Entry point for the original web app.

### Adding New Steam Features

If you need to add a new Steamworks function:

1.  Add the corresponding IPC handler in `steam-ipc.js`.
2.  Expose the function in the `steamAPI` object within `preload.js`.
3.  Implement the call to the Steamworks SDK in `steam-ipc.js`.
