const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

const PORT = process.env.INKPRESS_PORT || "43123";
const APP_URL = `http://127.0.0.1:${PORT}`;
const isDev = !app.isPackaged;

/** @type {import('child_process').ChildProcess | null} */
let nextProcess = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserWindow | null} */
let readerWindow = null;

function waitForServer(url, attempts = 90) {
  return new Promise((resolve, reject) => {
    let left = attempts;
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        left -= 1;
        if (left <= 0) reject(new Error("本地服务启动超时，请重试或检查端口 43123"));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function resolveStandaloneDir() {
  if (isDev) {
    const local = path.join(__dirname, "..", ".next", "standalone");
    return fs.existsSync(local) ? local : null;
  }
  return path.join(process.resourcesPath, "standalone");
}

function startNextServer() {
  if (nextProcess) return;

  if (isDev) {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    nextProcess = spawn(npmCmd, ["run", "dev"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, BROWSER: "none" },
      stdio: "inherit",
      shell: false,
    });
  } else {
    const standalone = resolveStandaloneDir();
    if (!standalone || !fs.existsSync(path.join(standalone, "server.js"))) {
      throw new Error("未找到打包后的服务文件，请重新执行 npm run dist");
    }
    // 用 Electron 二进制以 Node 模式运行 Next standalone
    nextProcess = spawn(process.execPath, ["server.js"], {
      cwd: standalone,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT,
        HOSTNAME: "127.0.0.1",
        BROWSER: "none",
      },
      stdio: "inherit",
    });
  }

  nextProcess.on("exit", () => {
    nextProcess = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "墨压 · AI 小说写作台",
    backgroundColor: "#e7eef0",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 应用内官方阅读窗口；其余外链用系统浏览器
    if (/qidian\.com|jjwxc\.net|fanqienovel\.com|qimao\.com|bing\.com/i.test(url)) {
      openOfficialReader(url);
      return { action: "deny" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function openOfficialReader(targetUrl) {
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) return;

  if (readerWindow && !readerWindow.isDestroyed()) {
    readerWindow.focus();
    readerWindow.loadURL(targetUrl);
    return;
  }

  readerWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 720,
    minHeight: 560,
    title: "墨压 · 官方站阅读",
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  readerWindow.loadURL(targetUrl);
  readerWindow.on("closed", () => {
    readerWindow = null;
  });
}

async function boot() {
  startNextServer();
  await waitForServer(APP_URL);
  createMainWindow();
  await mainWindow.loadURL(APP_URL);
}

ipcMain.handle("inkpress:open-official-reader", (_event, url) => {
  openOfficialReader(String(url || ""));
  return { ok: true };
});

ipcMain.handle("inkpress:is-desktop", () => true);

app.whenReady().then(() => {
  boot().catch((err) => {
    console.error(err);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      boot().catch(console.error);
    }
  });
});

function cleanup() {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGTERM");
    nextProcess = null;
  }
}

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", cleanup);
