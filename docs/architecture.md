# Architecture Overview

The **GeoGuessr Duels Linux Patch** is an Electron-based application that serves as a bridge between the GeoGuessr web application and the Steamworks SDK.

## ⚙️ Process Model

The application follows the standard Electron multi-process model:

1.  **Main Process (`main.js`):**
    *   Manages the application lifecycle and window creation.
    *   Initializes the Steamworks SDK via `steamworks-ffi-node`.
    *   Sets up IPC handlers to bridge Steam functionality to the renderer.
    *   Handles display metrics and window management (including fullscreen).
    *   Applies Linux-specific GPU and performance optimizations.

2.  **Preload Script (`preload.js`):**
    *   Runs in a privileged context before the renderer process loads.
    *   Exposes a safe, restricted `steamAPI` to the GeoGuessr web app via `contextBridge`.
    *   Maps Electron IPC events to web-facing callbacks.

3.  **Renderer Process:**
    *   Loads the GeoGuessr web application (e.g., `https://www.geoguessr.com`).
    *   Uses the `steamAPI` provided by the preload script for Steam features.

## 🎮 Steamworks Integration

The project uses the `steamworks-ffi-node` library, which utilizes `koffi` (a fast FFI library for Node.js) to call into the native Steamworks C++ SDK (`libsteam_api.so` on Linux).

### Steam Initialization Flow

1.  On startup, `main.js` determines the path to the Steamworks SDK redistributables.
2.  On Linux, it prepends the SDK directory to `LD_LIBRARY_PATH`.
3.  It calls `steamworks.init({ appId: 3478870 })`.
4.  If initialization fails (e.g., Steam is not running), the application quits.
5.  A periodic callback interval (`setInterval`) is established to run `steamworks.runCallbacks()` at ~30 FPS, ensuring Steam events (like overlay state changes or rich presence updates) are processed.

## 🚀 Linux-Specific Optimizations

The patch includes several performance and compatibility switches for Linux users:

*   **GPU Management:** Support for `GEOGUESSR_DISABLE_HW_ACCEL`, `GEOGUESSR_IN_PROCESS_GPU`, and `GEOGUESSR_USE_SWIFTSHADER` via environment variables.
*   **Window Management:**
    *   Handles Wayland vs. X11 detection for stable display metric reporting.
    *   Implements a custom fullscreen management system that respects multi-monitor setups.
    *   Uses `GEOGUESSR_NO_FULLSCREEN` to force windowed mode.
*   **Steam Overlay:** 
    *   Explicitly checks for the presence of `gameoverlayrenderer64.so` in `/proc/self/maps` before attempting to hook the overlay.
    *   Skips overlay initialization on Wayland to avoid crashes (as the Steam overlay currently relies on GLX/X11).
