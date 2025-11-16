"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const net = require("net");
const fs = require("fs");
let mainWindow;
let activeSocket = null;
let activeShuttleWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
    if (activeSocket) {
      activeSocket.destroy();
      activeSocket = null;
    }
  });
}
function createShuttleDetailsWindow(hub) {
  if (activeShuttleWindow) {
    activeShuttleWindow.close();
  }
  const shuttleWindow = new BrowserWindow({
    width: 1e3,
    height: 700,
    title: `${hub.name} | ${hub.ip}`,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  activeShuttleWindow = shuttleWindow;
  if (process.env.NODE_ENV === "development") {
    shuttleWindow.loadURL(`http://localhost:5173/#/shuttle/${hub.id}`);
  } else {
    shuttleWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"), {
      hash: `#/shuttle/${hub.id}`
    });
  }
  shuttleWindow.webContents.on("did-finish-load", () => {
    shuttleWindow.webContents.send("shuttle-data", hub);
  });
  shuttleWindow.on("closed", () => {
    if (activeShuttleWindow === shuttleWindow) {
      if (activeSocket) {
        activeSocket.destroy();
        activeSocket = null;
      }
      activeShuttleWindow = null;
      mainWindow.webContents.send("log-received", "[INFO] Shuttle window closed. Disconnected.");
      mainWindow.webContents.send("hub-disconnected");
    }
  });
}
app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();
  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});
function registerIpcHandlers() {
  function probeHub(ip, port, timeout = 1e3) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let buffer = "";
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error("Timeout"));
      }, timeout);
      socket.on("connect", () => {
      });
      socket.on("data", (data) => {
        buffer += data.toString();
        const boundary = buffer.indexOf("\n");
        if (boundary !== -1) {
          const line = buffer.substring(0, boundary).trim();
          if (line.startsWith("##TELEMETRY##:")) {
            try {
              const jsonString = line.substring(line.indexOf("{"));
              const telemetry = JSON.parse(jsonString);
              clearTimeout(timer);
              socket.destroy();
              resolve({
                id: ip,
                ip,
                name: `Shuttle ${telemetry.shuttle || ip}`,
                // Use shuttle number or IP
                status: telemetry.status_str || "Unknown",
                battery: telemetry.batt || 0
              });
            } catch (e) {
              clearTimeout(timer);
              socket.destroy();
              reject(new Error("Malformed telemetry"));
            }
          } else {
            clearTimeout(timer);
            socket.destroy();
            reject(new Error("Not a hub"));
          }
        }
      });
      socket.on("error", (err) => {
        clearTimeout(timer);
        socket.destroy();
        reject(err);
      });
      socket.on("close", () => {
        clearTimeout(timer);
        reject(new Error("Connection closed prematurely"));
      });
      socket.connect(port, ip);
    });
  }
  ipcMain.handle("start-scan", async (event, { start, end, timeout }) => {
    const startIpArr = start.split(".").map(Number);
    const endIpArr = end.split(".").map(Number);
    const PORT = 3333;
    let hubsFound = 0;
    const startOctet = startIpArr[3];
    const endOctet = endIpArr[3];
    const baseIp = startIpArr.slice(0, 3).join(".");
    for (let i = startOctet; i <= endOctet; i++) {
      const ip = `${baseIp}.${i}`;
      const percent = (i - startOctet + 1) / (endOctet - startOctet + 1) * 100;
      if (mainWindow) {
        mainWindow.webContents.send("scan-progress", { ip, percent: Math.round(percent) });
      }
      try {
        const hubData = await probeHub(ip, PORT, timeout);
        if (mainWindow) {
          mainWindow.webContents.send("hub-found", hubData);
        }
        hubsFound++;
      } catch (error) {
      }
    }
    return `Scan Complete. Found ${hubsFound} hubs.`;
  });
  ipcMain.handle("connect-hub", async (event, ip) => {
    if (activeSocket) {
      activeSocket.destroy();
      activeSocket = null;
    }
    const PORT = 3333;
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.on("connect", () => {
        activeSocket = socket;
        const connectMsg = `[INFO] TCP socket connected to ${ip}:${PORT}`;
        if (mainWindow) mainWindow.webContents.send("log-received", connectMsg);
        if (activeShuttleWindow) activeShuttleWindow.webContents.send("log-received", connectMsg);
        if (activeShuttleWindow) {
          activeShuttleWindow.webContents.send("hub-connected");
        }
        let buffer = "";
        socket.on("data", (data) => {
          buffer += data.toString();
          let boundary = buffer.indexOf("\n");
          while (boundary !== -1) {
            const line = buffer.substring(0, boundary).trim();
            buffer = buffer.substring(boundary + 1);
            if (line) {
              handleSocketData(line);
            }
            boundary = buffer.indexOf("\n");
          }
        });
        resolve({ success: true, ip });
      });
      socket.on("close", () => {
        const closeMsg = `[WARN] Connection to ${ip} closed.`;
        if (mainWindow) mainWindow.webContents.send("log-received", closeMsg);
        if (activeShuttleWindow) activeShuttleWindow.webContents.send("log-received", closeMsg);
        if (mainWindow) mainWindow.webContents.send("hub-disconnected");
        if (activeShuttleWindow) activeShuttleWindow.webContents.send("hub-disconnected");
        if (activeSocket === socket) {
          activeSocket = null;
        }
        reject(new Error("Connection closed"));
      });
      socket.on("error", (err) => {
        mainWindow.webContents.send("log-received", `[ERROR] Connection error: ${err.message}`);
        socket.destroy();
        if (activeSocket === socket) {
          activeSocket = null;
        }
        reject(err);
      });
      socket.connect(PORT, ip);
    });
  });
  ipcMain.handle("disconnect-hub", async () => {
    if (activeSocket) {
      activeSocket.destroy();
      activeSocket = null;
      mainWindow.webContents.send("log-received", "[INFO] User disconnected.");
      return true;
    }
    return false;
  });
  ipcMain.on("send-command", (event, command) => {
    const cmdMsg = `[CMD] > ${command}`;
    const errMsg = `[ERROR] Cannot send command. No active connection.`;
    if (activeSocket) {
      activeSocket.write(command + "\n");
      if (mainWindow) mainWindow.webContents.send("log-received", cmdMsg);
      if (activeShuttleWindow) activeShuttleWindow.webContents.send("log-received", cmdMsg);
    } else {
      if (mainWindow) mainWindow.webContents.send("log-received", errMsg);
      if (activeShuttleWindow) activeShuttleWindow.webContents.send("log-received", errMsg);
    }
  });
  ipcMain.handle("save-log", async (event, logs) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save Logs",
      defaultPath: `hub-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.txt`,
      filters: [{ name: "Text Files", extensions: ["txt"] }]
    });
    if (canceled || !filePath) {
      return { success: false, error: "Save canceled" };
    }
    try {
      fs.writeFileSync(filePath, logs);
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  ipcMain.handle("open-shuttle-details", (event, hub) => {
    createShuttleDetailsWindow(hub);
  });
}
function handleSocketData(line) {
  const targetWindow = activeShuttleWindow || mainWindow;
  if (!targetWindow) return;
  if (line.startsWith("##TELEMETRY##:")) {
    try {
      const jsonString = line.substring(line.indexOf("{"));
      const telemetry = JSON.parse(jsonString);
      targetWindow.webContents.send("telemetry-update", telemetry);
    } catch (err) {
      const errMsg = `[ERROR] Failed to parse telemetry: ${line}`;
      if (mainWindow) mainWindow.webContents.send("log-received", errMsg);
      if (activeShuttleWindow) activeShuttleWindow.webContents.send("log-received", errMsg);
    }
  } else {
    targetWindow.webContents.send("log-received", line);
  }
}
