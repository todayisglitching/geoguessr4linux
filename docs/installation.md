# Installation Guide

This guide describes how to apply the **GeoGuessr Duels Linux Patch** to your local GeoGuessr installation.

## ⚠️ Prerequisites

*   You must **own GeoGuessr on Steam**.
*   A Linux-based operating system.
*   `npm` and `node` installed (Node.js 20+ recommended).
*   Steamworks SDK redistributables (see [Steamworks SDK Setup](#steamworks-sdk-setup)).

## 📥 Step 1: Prepare Original Source

First, you need to extract the source code from the official GeoGuessr `app.asar` file (usually located in your Steam installation directory, e.g., `~/.steam/steam/steamapps/common/GeoGuessr/resources/`).

1.  Locate `app.asar`.
2.  Unpack it using an Electron utility like `asar`:
    ```bash
    npx asar extract app.asar app-unpacked/
    ```

## 🛠 Step 2: Apply the Patch

Copy the files from this repository into your unpacked source folder:

```bash
cp -v files/* /path/to/app-unpacked/
```

This will replace the following files:
*   `main.js`
*   `steam-ipc.js`
*   `preload.js`
*   `package.json`

## 📦 Step 3: Steamworks SDK Setup

The patch requires the **Steamworks SDK redistributables** at runtime.

1.  Go to the [Steamworks Partner site](https://partner.steamgames.com/) and log in.
2.  Download the **Steamworks SDK** zip from the [Valve offical page](https://partner.steamgames.com/downloads/list).
3.  Extract the SDK and copy **only** the `redistributable_bin` folder into your patched source folder:
    ```bash
    cp -r sdk/redistributable_bin /path/to/app-unpacked/steamworks_sdk/
    ```
4.  Ensure you have `libsteam_api.so` (for Linux) in `steamworks_sdk/redistributable_bin/linux64/`.

## 🏗 Step 4: Install Dependencies & Build

Navigate to your unpacked and patched directory:

```bash
cd /path/to/app-unpacked
npm install
```

### Build Targets

You can build for different Linux formats:
*   **AppImage:** `npm run build:linux-img` (Self-contained, recommended)
*   **Portable Binary Directory:** `npm run build:linux-bin` (Produces a `dist/linux-unpacked/` folder with the app binary)
*   **Compressed Tarball:** `npm run build:linux-tar` (Produces a `.tar.gz` archive)

Or run directly for development:
```bash
npm start
```

### Environment Variables

*   `GEOGUESSR_PERF=1`: Disables background renderer throttling.
*   `GEOGUESSR_DISABLE_HW_ACCEL=1`: Disables hardware acceleration.
*   `GEOGUESSR_IN_PROCESS_GPU=1`: Runs the GPU process in the main process (useful for some Linux drivers).
*   `STEAM_DISABLE=1`: Disables Steam initialization for offline testing.
*   `STEAM_NO_OVERLAY=1`: Disables the Steam overlay.
