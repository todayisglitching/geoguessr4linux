const { app, BrowserWindow, shell, session, ipcMain, screen } = require("electron");
const path = require("path");
const log = require("electron-log/main");
const { spawnSync } = require("child_process");
const { execPath } = require("process");

const { SteamworksSDK } = require("steamworks-ffi-node");
const steamworks = SteamworksSDK.getInstance();
let steamClient = null;
let steamInitSuccess = false;
let callbackInterval = null;

if (process.env.GEOGUESSR_DISABLE_GPU === "1") {
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-software-rasterizer");
}
if (process.env.GEOGUESSR_USE_SWIFTSHADER === "1") {
  app.commandLine.appendSwitch("use-gl", "egl");
  app.commandLine.appendSwitch("use-angle", "swiftshader");
  app.commandLine.appendSwitch("disable-gpu-compositing");
}
if (process.env.GEOGUESSR_DISABLE_HW_ACCEL === "1") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
}
if (process.env.GEOGUESSR_IN_PROCESS_GPU === "1") {
  app.commandLine.appendSwitch("in-process-gpu");
  app.commandLine.appendSwitch("disable-gpu-sandbox");
}
if (process.env.GEOGUESSR_PERF === "1") {
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.commandLine.appendSwitch("disable-background-timer-throttling");
  app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
}

process.on("uncaughtException", (err) => {
  log.error("uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  log.error("unhandledRejection:", reason);
});

if (process.platform === "win32") {
  try {
    const regPath = "HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences";
    const result = spawnSync(
      "reg",
      ["add", regPath, "/v", execPath, "/d", "GpuPreference=2;", "/f"],
      { stdio: "pipe" },
    );

    if (result.status === 0) {
      console.log("✅ High-performance GPU preference set.");
    } else {
      console.error(
        "Failed to set GPU preference:",
        result.stderr ? result.stderr.toString() : "Unknown error",
      );
    }
  } catch (err) {
    console.error("Failed to set GPU preference:", err);
  }
} else if (process.platform === "darwin") {
  app.commandLine.appendSwitch("disable-gpu-rasterization");
}

if (process.env.STEAM_DISABLE !== "1") {
  try {
    const sdkPath = app.isPackaged
      ? path.join(process.resourcesPath, "steamworks_sdk")
      : path.join(__dirname, "steamworks_sdk");

    if (process.platform === "linux") {
      const steamLibDir = path.join(sdkPath, "redistributable_bin", "linux64");
      const current = process.env.LD_LIBRARY_PATH || "";
      if (!current.split(":").includes(steamLibDir)) {
        process.env.LD_LIBRARY_PATH = current
          ? `${steamLibDir}:${current}`
          : steamLibDir;
      }
    }

    if (process.env.STEAM_SDK_DEBUG === "1" && steamworks.setDebug) {
      steamworks.setDebug(true);
    }
    steamworks.setSdkPath(sdkPath);
    steamClient = steamworks;
    steamInitSuccess = steamworks.init({ appId: 3478870 });
    if (steamInitSuccess) {
      if (process.env.STEAM_NO_CALLBACKS !== "1") {
        callbackInterval = setInterval(() => {
          try {
            steamworks.runCallbacks();
          } catch (_) {}
        }, 1000 / 30);
      }
    }
  } catch (error) {
    log.error("Failed to initialize Steamworks:", error);
  }
}
let mainWindow;

const steamState = { inited: steamInitSuccess, currentWebApiTicket: null };
const { registerSteamIpc, registerSteamCallbacks } = require("./steam-ipc");
const getWc = () => mainWindow?.webContents;
registerSteamIpc(ipcMain, steamClient || {}, steamState, getWc);
if (steamClient) {
  registerSteamCallbacks(steamClient, steamState, getWc);
}

let environment = "prod";
const environments = {
  prod: "https://www.geoguessr.com",
  stage: "https://www.geoguessr-stage.com",
  dev: "https://geoguessr.local",
};

// Parse environment argument
const envArg = process.argv.find((arg) => arg.includes("--env="));
if (envArg) {
  const env = envArg.split("=")[1];
  if (environments[env]) {
    environment = env;
    log.info(`Running in ${environment} environment`);
  } else {
    log.warn(`Invalid environment specified. Falling back to default (prod).`);
  }
} else {
  log.info("No environment specified, defaulting to production.");
}

// Set the base URL based on environment
const baseUrl = environments[environment];

const createWindow = async () => {
  log.info("createWindow: start");
  const steamId = steamClient?.getStatus?.().steamId || "anonymous";
  userSteamSession = session.fromPartition(`persist:${steamId}_v1`);
  try {
    await Promise.race([
      userSteamSession.clearStorageData({ storages: ["cookies"] }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("clearStorageData timeout")), 3000),
      ),
    ]);
    log.info("createWindow: storage cleared");
  } catch (err) {
    log.warn("createWindow: storage clear failed", err);
  }

  const isProd = environment === "prod";
  
  // Safely get display metrics
  let targetDisplay;
  try {
    const isWayland = process.env.XDG_SESSION_TYPE === "wayland" || process.env.WAYLAND_DISPLAY;
    if (isWayland) {
       log.info("Wayland detected, using primary display for initialization to avoid potential crashes");
       targetDisplay = screen.getPrimaryDisplay();
    } else {
       const cursorPoint = screen.getCursorScreenPoint();
       targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
    }
  } catch (err) {
    log.warn("Failed to get display metrics, falling back to primary display", err);
    try {
      targetDisplay = screen.getPrimaryDisplay();
    } catch (e) {
      log.error("Failed to get primary display", e);
    }
  }

  if (!targetDisplay) {
    log.error("No display found, using defaults");
    targetDisplay = {
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1080 }
    };
  }

  const { x, y, width, height } = targetDisplay.bounds;

  const startFullscreen = process.env.GEOGUESSR_NO_FULLSCREEN !== "1";
  const workArea = targetDisplay.workArea || targetDisplay.bounds;
  const startWidth = startFullscreen ? width : workArea.width;
  const startHeight = startFullscreen ? height : workArea.height;
  const startX = startFullscreen ? x : workArea.x;
  const startY = startFullscreen ? y : workArea.y;

  mainWindow = new BrowserWindow({
    x: startX,
    y: startY,
    width: startWidth,
    height: startHeight,
    minWidth: 10,
    minHeight: 10,
    backgroundColor: "#1a1a2e",
    fullscreen: startFullscreen,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      devTools: !isProd,
      session: userSteamSession,
      preload: require("path").join(__dirname, "preload.js"),
    },
  });
  log.info("createWindow: BrowserWindow created");

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-finish-load", () => {
    log.info("webContents: did-finish-load");
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
    log.error("webContents: did-fail-load", code, desc);
  });
  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    log.error("webContents: render-process-gone", details);
  });
  mainWindow.webContents.on("crashed", () => {
    log.error("webContents: crashed");
  });

  const allowOverlay =
    process.env.STEAM_NO_OVERLAY !== "1" &&
    !(process.platform === "linux" && process.env.STEAM_FORCE_OVERLAY !== "1");
  if (allowOverlay) {
    try {
      if (typeof steamworks.addElectronSteamOverlay === "function") {
        steamworks.addElectronSteamOverlay(mainWindow);
      }
    } catch (err) {
      log.warn("Steam overlay init failed:", err);
    }
  }

  const showDelay = process.env.GEOGUESSR_SHOW_DELAY_MS
    ? Number(process.env.GEOGUESSR_SHOW_DELAY_MS)
    : 0;
  if (showDelay > 0) {
    mainWindow.hide();
    setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.show();
        log.info("createWindow: show after delay");
      }
    }, showDelay);
  }

  mainWindow.loadFile("index.html");
  log.info("createWindow: loadFile called");

  if (!isProd) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("onReady", baseUrl);
  });

  mainWindow.on("focus", () => {
    mainWindow.webContents.send("gameClientFocused");
  });
  mainWindow.on("blur", () => {
    mainWindow.webContents.send("gameClientBlurred");
  });
  mainWindow.on("move", () => {
    if (!mainWindow.isFullScreen()) return;
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const b = display.bounds;
    if (b.width && b.height) {
      mainWindow.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height }, false);
    }
  });
  screen.on("display-metrics-changed", () => {
    if (!mainWindow?.isFullScreen()) return;
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const b = display.bounds;
    if (b.width && b.height) {
      mainWindow.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height }, false);
    }
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    const reloadModifier = input.meta || input.control;
    const isReload = reloadModifier && input.key.toLowerCase() === "r";
    if (isReload) {
      event.preventDefault();
    }
  });
};

app.whenReady().then(() => {
  if (!steamInitSuccess && process.env.STEAM_DISABLE !== "1") {
    app.quit();
    return;
  }
  createWindow();
  log.info(process.argv);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("render-process-gone", (_event, webContents, details) => {
    log.error("render-process-gone:", details);
  });
  app.on("child-process-gone", (_event, details) => {
    log.error("child-process-gone:", details);
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("before-quit", () => {
    if (callbackInterval) clearInterval(callbackInterval);
    // Avoid shutdown crashes on Linux FFI; OS will clean up on exit.
  });
});
