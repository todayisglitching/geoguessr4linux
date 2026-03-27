# Steam Integration Details

This document explains the technical implementation of the Steamworks integration in the **GeoGuessr Duels Linux Patch**.

## 🌉 The IPC Bridge

Since the GeoGuessr web app runs in a sandboxed renderer process, it cannot directly communicate with the native Steamworks SDK. The patch implements a bridge using Electron's Inter-Process Communication (IPC).

### Architecture

1.  **Main Process (`steam-ipc.js`):** Registers handlers for `ipcMain.handle`.
2.  **Preload Script (`preload.js`):** Exposes these handlers to the `window.steamAPI` object via `contextBridge.exposeInMainWorld`.
3.  **Web App:** Calls `window.steamAPI.someFunction()` which triggers the IPC call.

## 📡 Available IPC Methods

The following methods are exposed via the `steamAPI` object:

### Authentication

*   `getSteamTicket()`: Returns a WebAPI authentication ticket (`steam:getAuthTicketForWebApi`).
*   `cancelSteamTicket()`: Cancels the current WebAPI ticket (`steam:cancelAuthTicket`).

### Local Player Information

*   `steamLocalplayerGetName()`: Returns the current user's Steam persona name.
*   `steamLocalplayerGetSteamId()`: Returns the user's 64-bit SteamID.

### Friends & Social

*   `steamFriendsGetFriends(flags)`: Returns a list of the user's friends with their name, state, and avatar (as Base64).
*   `steamFriendsGetFriendRichPresence(steamId, key)`: Retrieves a specific rich presence key for a friend.
*   `steamFriendsInviteToGame(steamId64, connectString)`: Sends a game invitation to a friend.
*   `steamOverlayActivateDialogToUser(dialog, steamId64)`: Opens a Steam overlay dialog (e.g., "Chat") for a specific user.

### Stats & Presence

*   `steamLocalplayerSetRichPresence(key, value)`: Sets a rich presence key/value pair for the local player.
*   `steamStatsSyncStats(stats)`: Syncs and stores player statistics in Steamworks.

### Game Info

*   `steamAppsCurrentGameLanguage()`: Returns the current game language (e.g., `english`).

## 🖼 Avatar Handling

The Steamworks SDK provides avatars as raw RGBA data. The patch handles this in `steam-ipc.js`:

1.  Retrieves the handle for a medium-sized avatar using `friends.getMediumFriendAvatar`.
2.  Gets the raw RGBA data using `utils.getImageRGBA`.
3.  Converts the buffer to a **Base64 string**.
4.  Returns the Base64 string and dimensions to the web app for easy display in an `<img>` tag.

## ⚙️ Low-Level FFI (Koffi)

For certain functions not directly available in `steamworks-ffi-node`, the patch uses **Koffi** to call the Steamworks C++ SDK functions manually.

**Example: `SteamAPI_ISteamFriends_InviteUserToGame`**

```javascript
const steamLib = steamworks.apiCore.libraryLoader.getLibrary();
const friendsInterface = steamworks.apiCore.getFriendsInterface();
const inviteFn = steamLib.func('SteamAPI_ISteamFriends_InviteUserToGame', 'bool', ['void*', 'uint64', 'str']);
const success = inviteFn(friendsInterface, BigInt(steamId), connectString);
```

## 🎮 Steam Overlay

The Steam overlay implementation is a delicate process on Linux:

*   It requires the `gameoverlayrenderer64.so` library to be pre-loaded into the process (usually done by the Steam client via `LD_PRELOAD`).
*   The `main.js` script checks if the hook is active by reading `/proc/self/maps`.
*   If active, it calls `steamworks.addElectronSteamOverlay(mainWindow)` to attach the overlay to the Electron window.
*   **Limitation:** The native Steam overlay is not currently supported on **Wayland** due to its reliance on GLX and X11 hooks. The patch will automatically skip overlay initialization when Wayland is detected to prevent crashes.
