# GeoGuessr Duels Linux Patch (Safe Patch Repo)

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/github/license/wexelsdev/geoguessr4linux?style=for-the-badge&label=License&logo=github&color=yellow" alt="License">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Platform-Linux-blue?style=for-the-badge&logo=linux&color=0078d7" alt="Platform">
  </a>
</p>


A minimal, safe, and legal patch set to run the **Steam version of GeoGuessr** natively on Linux. This repository provides the necessary Electron logic to bridge the game with the Steamworks SDK on Linux systems.

## 🛠 Features

- **Native Steam Integration**: Supports Steam authentication, friend list, and game invites.
- **Linux Optimizations**: Includes pre-configured flags for X11, Wayland compatibility, and GPU performance.
- **Safe Patch Model**: No game assets or Steam binaries are included. You must provide them from your own installation.
- **Multi-Build Support**: Export as an AppImage or a portable directory (binary).

## 📦 What’s Included

This repository contains only the source files needed to patch the game:
- `files/main.js` (Core application logic)
- `files/steam-ipc.js` (Steamworks bridge)
- `files/preload.js` (Secure renderer API)
- `files/package.json` (Build configuration and dependencies)


## 🚀 Quick Start

### 1. Extract the Original Game
You must extract the original `app.asar` from your GeoGuessr installation (typically found in the game's `resources` folder).
```bash
npx asar extract app.asar app-unpacked/
```

### 2. Apply the Patch
Copy the files from this repo into your extracted source:
```bash
cp -v files/* /path/to/app-unpacked/
```

### 3. Setup Steamworks SDK (Required)
The patch requires the `redistributable_bin` from the Steamworks SDK.
1. Download the SDK from the [Steamworks Partner site](https://partner.steamgames.com/).
2. Copy the `redistributable_bin` folder into your `app-unpacked/steamworks_sdk/` directory.

### 4. Build the Application
```bash
cd /path/to/app-unpacked
npm install

# Option A: Build as AppImage (Self-contained)
npm run build:linux-img

# Option B: Build as a Portable Binary Folder (Fastest start)
npm run build:linux-bin

# Option C: Build as a Compressed Tarball
npm run build:linux-tar
```

## 📚 Detailed Documentation

Comprehensive documentation can be found in the [docs/](docs/README.md) folder:
- [Architecture](docs/architecture.md)
- [Installation Guide](docs/installation.md)
- [Development & Debugging](docs/development.md)
- [Steam Integration Details](docs/steam-integration.md)

## ⚖️ Legal

This project is a patch set and does not redistribute any copyrighted material from GeoGuessr or Valve Corporation. Users are responsible for complying with the Terms of Service of both platforms.
