const { EFriendFlags, EPersonaState, EOverlayToUserDialog } = require("steamworks-ffi-node");

const APP_ID = "3478870";

function guardInited(state) {
  if (!state.inited) return { error: "Steam not initialized" };
  return null;
}

function getAvatarData(steamworks, steamId) {
  if (!steamworks?.friends?.getMediumFriendAvatar || !steamworks?.utils?.getImageRGBA) {
    return null;
  }
  const handle = steamworks.friends.getMediumFriendAvatar(String(steamId));
  if (!handle) return null;
  const image = steamworks.utils.getImageRGBA(handle);
  if (!image || !image.data) return null;
  const buf = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
  return {
    avatarBase64: buf.toString("base64"),
    avatarWidth: image.width || 0,
    avatarHeight: image.height || 0,
  };
}

function friendToPayload(steamworks, friend) {
  const avatar = getAvatarData(steamworks, friend.steamId);
  return {
    steamId64: String(friend.steamId),
    steamId32: null,
    accountId: null,
    name: friend.personaName,
    state: friend.personaState,
    richPresenceSteamDisplay: null,
    avatarBase64: avatar?.avatarBase64 ?? null,
    avatarWidth: avatar?.avatarWidth ?? 0,
    avatarHeight: avatar?.avatarHeight ?? 0,
  };
}

function registerSteamIpc(ipcMain, steamworks, state, getWc) {
  const sendError = (msg) => {
    const wc = getWc();
    if (wc && !wc.isDestroyed()) wc.send("steam:error", msg);
  };
  const trace = (channel, detail) => {
    if (process.env.STEAM_IPC_TRACE === "1") {
      const payload = detail ? ` ${JSON.stringify(detail)}` : "";
      // eslint-disable-next-line no-console
      console.log(`[steam-ipc] ${channel}${payload}`);
    }
  };

  const handle = (channel, fn, { requiresInit = true } = {}) => {
    ipcMain.handle(channel, async (_e, ...args) => {
      try {
        trace(channel, { args });
        if (requiresInit) {
          const guardErr = guardInited(state);
          if (guardErr) return guardErr;
        }
        return await fn(...args);
      } catch (error) {
        sendError(channel + " failed: " + error);
        return { error: error.message };
      }
    });
  };

  handle("steam:getAuthTicketForWebApi", async () => {
    if (!steamworks?.user?.getAuthTicketForWebApi) {
      return { error: "getAuthTicketForWebApi not available" };
    }
    const result = await steamworks.user.getAuthTicketForWebApi("");
    if (!result?.success) {
      return { error: result?.error || "getAuthTicketForWebApi failed" };
    }
    state.currentWebApiTicket = result.authTicket;
    return { ticketHex: result.ticketHex };
  });

  handle(
    "steam:cancelAuthTicket",
    () => {
      if (state.currentWebApiTicket && steamworks?.user?.cancelAuthTicket) {
        steamworks.user.cancelAuthTicket(state.currentWebApiTicket);
      }
      state.currentWebApiTicket = null;
    },
    { requiresInit: false },
  );

  handle("steam:apps:launchCommandLine", () => {
    return { error: "launchCommandLine not available" };
  });

  handle("steam:apps:currentGameLanguage", () => {
    if (steamworks?.apps?.getCurrentGameLanguage) {
      return steamworks.apps.getCurrentGameLanguage();
    }
    if (steamworks?.getCurrentGameLanguage) {
      return steamworks.getCurrentGameLanguage();
    }
    return { error: "currentGameLanguage not available" };
  });

  handle("steam:localplayer:getName", () => {
    if (!steamworks?.friends?.getPersonaName) {
      return { error: "getName not available" };
    }
    return steamworks.friends.getPersonaName();
  });

  handle("steam:localplayer:getSteamId", () => {
    if (!steamworks?.getStatus) {
      return { error: "getSteamId not available" };
    }
    const id = steamworks.getStatus()?.steamId;
    return {
      steamId64: id,
      steamId32: null,
      accountId: null,
    };
  });

  handle("steam:localplayer:setRichPresence", (key, value) => {
    if (!steamworks?.richPresence?.setRichPresence) {
      return { error: "setRichPresence not available" };
    }
    steamworks.richPresence.setRichPresence(key, value ?? null);
  });

  handle("steam:friends:getFriends", (flags) => {
    if (!steamworks?.friends?.getAllFriends) return [];
    const friendFlags =
      typeof flags === "number" ? flags : EFriendFlags.Immediate;
    const friends = steamworks.friends.getAllFriends(friendFlags);
    return (friends ?? []).map((friend) => friendToPayload(steamworks, friend));
  });

  handle("steam:friends:getFriendRichPresence", () => null);

  handle("steam:friends:inviteToGame", () => {
    return { error: "inviteToGame not available" };
  });

  handle("steam:overlay:activateDialogToUser", (dialog, steamId64) => {
    if (!steamworks?.overlay?.activateGameOverlayToUser) {
      return { error: "overlay dialog not available" };
    }
    const dialogMap = {
      Chat: EOverlayToUserDialog.CHAT,
    };
    const dialogValue =
      typeof dialog === "string" ? dialogMap[dialog] || dialog : dialog;
    steamworks.overlay.activateGameOverlayToUser(
      String(dialogValue),
      String(steamId64),
    );
  });

  handle("steam:stats:syncStats", async (stats) => {
    const entries =
      stats && typeof stats === "object" ? Object.entries(stats) : [];
    for (const [name, value] of entries) {
      if (typeof value === "number" && steamworks?.stats?.setStatInt) {
        await steamworks.stats.setStatInt(name, value);
      }
    }
    if (steamworks?.stats?.storeStats) return steamworks.stats.storeStats();
  });
}

function registerSteamCallbacks() {
  return;
}

module.exports = { registerSteamIpc, registerSteamCallbacks };
