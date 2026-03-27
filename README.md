# GeoGuessr Duels Linux Patch (Safe Patch Repo)

Minimal, safe patch set for running the Steam version on Linux.  
This repo contains **only patch files and instructions**. It does **not** include any Steam game files, binaries, SDK files, or built AppImage artifacts.

## What’s Included

- `files/main.js`
- `files/steam-ipc.js`
- `files/preload.js`
- `files/package.json`

These are drop‑in replacements for the unpacked `app.asar` source code.

## What’s NOT Included

- No game content
- No Steamworks SDK
- No Steam binaries
- No compiled artifacts (`dist/`, `AppImage`, `.node`, `.so`)
- No `node_modules`

## Quick Start (Local Only)

1) Copy the patched files into your extracted source folder:

```bash
cp -v files/* /path/to/app-unpacked/
```

2) Install deps and build:

```bash
cd /path/to/app-unpacked
npm install
npm run build:linux-appimage
```

## Steamworks SDK Setup (Required)

This patch uses `steamworks-ffi-node`, which **requires Steamworks SDK redistributables** at runtime.

You must download the SDK from Steamworks Partner:

1) Go to the Steamworks Partner site and **log in / register**.  
2) Open the SDK download page and download the SDK zip.  
   (You’ll need to be authenticated; direct links require an active session.)
3) Extract the SDK and copy **only** the `redistributable_bin` folder into your patched source:

```
app-unpacked/
└── steamworks_sdk/
    └── redistributable_bin/
        ├── linux64/libsteam_api.so
        ├── win64/steam_api64.dll
        └── ... (other platforms optional)
```

You do **not** need the full SDK source in this repo. Just `redistributable_bin`.

## Build Targets

```bash
npm run build:linux-appimage
npm run build:linux-tar
npm run build:linux-dir
```

`build:linux-dir` produces a folder with the app binary (no AppImage).

## Notes

- On Linux, run under X11 for stability. Example:

```bash
XDG_SESSION_TYPE=x11 GDK_BACKEND=x11 QT_QPA_PLATFORM=xcb GEOGUESSR_IN_PROCESS_GPU=1 GEOGUESSR_NO_FULLSCREEN=1 ./GeoGuessr\ Duels-1.0.0.AppImage
```

## Legal / Safety

This repo does **not** redistribute any Steam or game assets. You must own the game and apply the patch locally.
