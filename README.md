# GeoGuessr Duels Linux Patch (Safe Patch Repo)

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

## How To Apply (Local Only)

1) Extract `app.asar` from the installed game into a folder, e.g.:

```bash
npx asar extract "/path/to/GeoGuessr Duels/resources/app.asar" /path/to/app-unpacked
```

2) Copy the patched files over the extracted source:

```bash
cp -v files/main.js files/steam-ipc.js files/preload.js files/package.json /path/to/app-unpacked/
```

3) Repack:

```bash
npx asar pack /path/to/app-unpacked "/path/to/GeoGuessr Duels/resources/app.asar"
```

4) Build Linux AppImage (optional):

```bash
cd /path/to/app-unpacked
npm install
npm run build:linux
```

## Notes

- Steamworks SDK files are required at runtime when using `steamworks-ffi-node`.
- On Linux, run under X11 for stability. Example:

```bash
XDG_SESSION_TYPE=x11 GDK_BACKEND=x11 QT_QPA_PLATFORM=xcb GEOGUESSR_IN_PROCESS_GPU=1 GEOGUESSR_NO_FULLSCREEN=1 ./GeoGuessr\ Duels-1.0.0.AppImage
```

## Legal / Safety

This repo does **not** redistribute any Steam or game assets. You must own the game and apply the patch locally.
