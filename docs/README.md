# GeoGuessr Duels Linux Patch Documentation

Welcome to the official documentation for the **GeoGuessr Duels Linux Patch**. This project provides a minimal, safe patch set for running the Steam version of GeoGuessr natively on Linux systems.

## 📖 Table of Contents

1.  **[Architecture](architecture.md)** — Technical overview of how the patch works.
2.  **[Installation Guide](installation.md)** — How to apply the patch to your GeoGuessr installation.
3.  **[Development & Build](development.md)** — Instructions for building and debugging the project.
4.  **[Steam Integration](steam-integration.md)** — Details on Steamworks IPC and features.

## 🚀 Project Overview

The project is an **Electron-based** application that serves as a bridge between the GeoGuessr web application and the Steam client on Linux. It uses `steamworks-ffi-node` to interface with the Steamworks SDK.

### Key Features

*   **Native Steam Integration:** Support for Steam authentication, friends list, rich presence, and invitations.
*   **Performance Optimizations:** Specific GPU and renderer flags for Linux (X11 and Wayland support).
*   **Steam Overlay:** Integrated Steam overlay support (currently restricted to X11/GLX).

## 📁 Repository Structure

*   `files/`: Source code files meant to replace the original `app.asar` content.
    *   `main.js`: Main Electron process and application lifecycle.
    *   `steam-ipc.js`: Steamworks IPC handler registration.
    *   `preload.js`: Context-isolated API for the renderer process.
    *   `package.json`: Project dependencies and build scripts.
*   `docs/`: Comprehensive project documentation.
*   `README.md`: Root project overview and quick start.

## ⚖️ Legal & Safety

This repository contains **only original source code and patch files**. It does **not** redistribute any Steam binaries, game assets, or SDK files. Users must own the game on Steam and provide their own Steamworks SDK redistributables.
