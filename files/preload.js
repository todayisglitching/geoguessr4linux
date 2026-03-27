const { contextBridge, ipcRenderer } = require("electron");

const callbacks = {};

const eventMap = {
  "steam:steamFriend": "onSteamFriend",
  "steam:friendStatusUpdate": "onFriendStatusUpdate",
  "steam:gameInvite": "onGameInvite",
  "steam:transaction": "onTransaction",
  "steam:error": "onError",
};

ipcRenderer.on("onReady", (_, payload) => callbacks.onReady?.(payload));
ipcRenderer.on("gameClientFocused", (_, payload) => callbacks.onGameClientFocused?.(payload));
ipcRenderer.on("gameClientBlurred", (_, payload) => callbacks.onGameClientBlurred?.(payload));
for (const [ipcChannel, apiName] of Object.entries(eventMap)) {
  ipcRenderer.on(ipcChannel, (_, payload) => callbacks[apiName]?.(payload));
}

const steamFriendState = {
  Offline: 0,
  Online: 1,
  Busy: 2,
  Away: 3,
  Snooze: 4,
  LookingToTrade: 5,
  LookingToPlay: 6,
};

const overlayDialog = {
  Chat: "Chat",
};

contextBridge.exposeInMainWorld("steamAPI", {
  onReady: (cb) => {
    callbacks.onReady = cb;
  },
  onGameClientFocused: (cb) => {
    callbacks.onGameClientFocused = cb;
  },
  onGameClientBlurred: (cb) => {
    callbacks.onGameClientBlurred = cb;
  },
  onSteamFriend: (cb) => {
    callbacks.onSteamFriend = cb;
  },
  onFriendStatusUpdate: (cb) => {
    callbacks.onFriendStatusUpdate = cb;
  },
  onGameInvite: (cb) => {
    callbacks.onGameInvite = cb;
  },
  onTransaction: (cb) => {
    callbacks.onTransaction = cb;
  },
  onError: (cb) => {
    callbacks.onError = cb;
  },
  getSteamTicket: () => ipcRenderer.invoke("steam:getAuthTicketForWebApi"),
  cancelSteamTicket: () => ipcRenderer.invoke("steam:cancelAuthTicket"),
  steamAppsLaunchCommandLine: () =>
    ipcRenderer.invoke("steam:apps:launchCommandLine"),
  steamAppsCurrentGameLanguage: () =>
    ipcRenderer.invoke("steam:apps:currentGameLanguage"),
  steamLocalplayerGetName: () =>
    ipcRenderer.invoke("steam:localplayer:getName"),
  steamLocalplayerGetSteamId: () =>
    ipcRenderer.invoke("steam:localplayer:getSteamId"),
  steamLocalplayerSetRichPresence: (key, value) =>
    ipcRenderer.invoke("steam:localplayer:setRichPresence", key, value),
  steamFriendsGetFriends: (flags) =>
    ipcRenderer.invoke("steam:friends:getFriends", flags),
  steamFriendsGetFriendRichPresence: (steamId, key) =>
    ipcRenderer.invoke("steam:friends:getFriendRichPresence", steamId, key),
  steamFriendsInviteToGame: (steamId64, connectString) =>
    ipcRenderer.invoke("steam:friends:inviteToGame", steamId64, connectString),
  steamOverlayActivateDialogToUser: (dialog, steamId64) =>
    ipcRenderer.invoke("steam:overlay:activateDialogToUser", dialog, steamId64),
  steamStatsSyncStats: (stats) =>
    ipcRenderer.invoke("steam:stats:syncStats", stats),
  steamFriendState,
  overlayDialog,
});
