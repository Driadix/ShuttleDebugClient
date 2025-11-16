const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');

let mainWindow;
// Holds our single, persistent TCP connection
let activeSocket = null;
// Holds the BrowserWindow object for the *currently connected* shuttle
let activeShuttleWindow = null;

function createWindow () {
mainWindow = new BrowserWindow({
width: 1200,
height: 800,
webPreferences: {
preload: path.join(__dirname, '..', 'preload', 'preload.js'),
contextIsolation: true,
nodeIntegration: false,
}
});

if (process.env.NODE_ENV === 'development') {
mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
// mainWindow.webContents.openDevTools(); // Uncomment for debugging
} else {
mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
}

mainWindow.on('closed', () => {
mainWindow = null;
if (activeSocket) {
activeSocket.destroy();
activeSocket = null;
}
});
}

function createShuttleDetailsWindow(hub) {
  // If another shuttle window is open, close it.
  if (activeShuttleWindow) {
    activeShuttleWindow.close();
  }

  const shuttleWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: `${hub.name} | ${hub.ip}`,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Set this new window as the active one
  activeShuttleWindow = shuttleWindow;

  if (process.env.NODE_ENV === 'development') {
    shuttleWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/shuttle/${hub.id}`);
    // shuttleWindow.webContents.openDevTools();
  } else {
    shuttleWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), {
      hash: `#/shuttle/${hub.id}`,
    });
  }

  shuttleWindow.webContents.on('did-finish-load', () => {
    // Send initial static data
    shuttleWindow.webContents.send('shuttle-data', hub);
  });

  // Handle window closure
  shuttleWindow.on('closed', () => {
    // If the window we just closed was the *active* one, disconnect the socket.
    if (activeShuttleWindow === shuttleWindow) {
      if (activeSocket) {
        activeSocket.destroy();
        activeSocket = null;
      }
      activeShuttleWindow = null;
      mainWindow.webContents.send('log-received', '[INFO] Shuttle window closed. Disconnected.');
      // Tell the main window to update its UI
      mainWindow.webContents.send('hub-disconnected');
    }
  });
}

// === App Lifecycle ===
app.whenReady().then(() => {
createWindow();
registerIpcHandlers();

app.on('activate', function () {
if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
});

app.on('window-all-closed', function () {
if (process.platform !== 'darwin') app.quit();
});

// === IPC Handlers & Networking Logic ===
function registerIpcHandlers() {

// --- Network Scanner ---
// Helper function for the scanner
function probeHub(ip, port, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buffer = '';

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Timeout'));
    }, timeout);

    socket.on('connect', () => {
      // Connected. Now we wait for data.
    });

    socket.on('data', (data) => {
      buffer += data.toString();
      const boundary = buffer.indexOf('\n');
      if (boundary !== -1) {
        const line = buffer.substring(0, boundary).trim();
        if (line.startsWith('##TELEMETRY##:')) {
          try {
            const jsonString = line.substring(line.indexOf('{'));
            const telemetry = JSON.parse(jsonString);

            // Success! We found a hub.
            clearTimeout(timer);
            socket.destroy();
            resolve({
              id: ip,
              ip: ip,
              name: `Shuttle ${telemetry.shuttle || ip}`, // Use shuttle number or IP
              status: telemetry.status_str || 'Unknown',
              battery: telemetry.batt || 0
            });
          } catch (e) {
            // Malformed JSON
            clearTimeout(timer);
            socket.destroy();
            reject(new Error('Malformed telemetry'));
          }
        } else {
          // Not a hub
          clearTimeout(timer);
          socket.destroy();
          reject(new Error('Not a hub'));
        }
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      socket.destroy();
      reject(err);
    });

    socket.on('close', () => {
      clearTimeout(timer);
      reject(new Error('Connection closed prematurely'));
    });

    socket.connect(port, ip);
  });
}

ipcMain.handle('start-scan', async (event, { start, end, timeout }) => {
  const startIpArr = start.split('.').map(Number);
  const endIpArr = end.split('.').map(Number);
  const PORT = 3333; // This is the port from debug_server_task.cpp
  let hubsFound = 0;

  // Simple scanner for the last octet only
  const startOctet = startIpArr[3];
  const endOctet = endIpArr[3];
  const baseIp = startIpArr.slice(0, 3).join('.');

  for (let i = startOctet; i <= endOctet; i++) {
    const ip = `${baseIp}.${i}`;

    // Send progress to renderer
    const percent = ((i - startOctet + 1) / (endOctet - startOctet + 1)) * 100;
    if (mainWindow) {
      mainWindow.webContents.send('scan-progress', { ip, percent: Math.round(percent) });
    }

    try {
      // Use the new probeHub function
      const hubData = await probeHub(ip, PORT, timeout);
      // On success, send the *real* hub data
      if (mainWindow) {
        mainWindow.webContents.send('hub-found', hubData);
      }
      hubsFound++;
    } catch (error) {
      // probeHub rejects on timeout, error, or not a hub. This is normal.
      // console.log(`No hub at ${ip}: ${error.message}`);
    }
  }
  return `Scan Complete. Found ${hubsFound} hubs.`;
});

// --- Hub Connection ---
ipcMain.handle('connect-hub', async (event, ip) => {
if (activeSocket) {
activeSocket.destroy();
activeSocket = null;
}

const PORT = 3333;

return new Promise((resolve, reject) => {
const socket = new net.Socket();

    socket.on('connect', () => {
      activeSocket = socket;

      // Send logs to BOTH windows
      const connectMsg = `[INFO] TCP socket connected to ${ip}:${PORT}`;
      if (mainWindow) mainWindow.webContents.send('log-received', connectMsg);
      if (activeShuttleWindow) activeShuttleWindow.webContents.send('log-received', connectMsg);

      // Tell the shuttle window it's connected
      if (activeShuttleWindow) {
        activeShuttleWindow.webContents.send('hub-connected');
      }

      // Handle incoming data
      let buffer = '';
      socket.on('data', (data) => {
        buffer += data.toString();
        let boundary = buffer.indexOf('\n');

        while (boundary !== -1) {
          const line = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 1);

          if (line) {
            handleSocketData(line); // This now calls our new JSON parser
          }
          boundary = buffer.indexOf('\n');
        }
      });

      resolve({ success: true, ip });
    });

    socket.on('close', () => {
      const closeMsg = `[WARN] Connection to ${ip} closed.`;
      if (mainWindow) mainWindow.webContents.send('log-received', closeMsg);
      if (activeShuttleWindow) activeShuttleWindow.webContents.send('log-received', closeMsg);

      // Send the disconnect event to both
      if (mainWindow) mainWindow.webContents.send('hub-disconnected');
      if (activeShuttleWindow) activeShuttleWindow.webContents.send('hub-disconnected');

      if (activeSocket === socket) {
        activeSocket = null;
      }
      reject(new Error('Connection closed'));
    });

socket.on('error', (err) => {
mainWindow.webContents.send('log-received', `[ERROR] Connection error: ${err.message}`);
socket.destroy();
if (activeSocket === socket) {
activeSocket = null;
}
reject(err);
});

socket.connect(PORT, ip);
});
});

// --- Disconnect ---
ipcMain.handle('disconnect-hub', async () => {
if (activeSocket) {
activeSocket.destroy();
activeSocket = null;
mainWindow.webContents.send('log-received', '[INFO] User disconnected.');
return true;
}
return false;
});

// --- Send Command ---
        ipcMain.on('send-command', (event, command) => {
          const cmdMsg = `[CMD] > ${command}`;
          const errMsg = `[ERROR] Cannot send command. No active connection.`;

          if (activeSocket) {
            activeSocket.write(command + '\n');
            if (mainWindow) mainWindow.webContents.send('log-received', cmdMsg);
            if (activeShuttleWindow) activeShuttleWindow.webContents.send('log-received', cmdMsg);
          } else {
            if (mainWindow) mainWindow.webContents.send('log-received', errMsg);
            if (activeShuttleWindow) activeShuttleWindow.webContents.send('log-received', errMsg);
          }
        });

// --- Save Logs ---
ipcMain.handle('save-log', async (event, logs) => {
const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
title: 'Save Logs',
defaultPath: `hub-logs-${new Date().toISOString().split('T')[0]}.txt`,
filters: [{ name: 'Text Files', extensions: ['txt'] }]
});

if (canceled || !filePath) {
return { success: false, error: 'Save canceled' };
}

try {
fs.writeFileSync(filePath, logs);
return { success: true, path: filePath };
} catch (err) {
return { success: false, error: err.message };
}
});

ipcMain.handle('open-shuttle-details', (event, hub) => {
    createShuttleDetailsWindow(hub);
  });
}

// --- Helper: Data Parser ---
function handleSocketData(line) {
  // Route logs to the active shuttle window if it exists, otherwise main.
  const targetWindow = activeShuttleWindow || mainWindow;
  if (!targetWindow) return; // No window to send to

  if (line.startsWith('##TELEMETRY##:')) {
    try {
      // Extract the JSON part of the string
      const jsonString = line.substring(line.indexOf('{'));
      const telemetry = JSON.parse(jsonString);

      // Send the full, parsed JSON object to the active window
      targetWindow.webContents.send('telemetry-update', telemetry);

    } catch (err) {
      const errMsg = `[ERROR] Failed to parse telemetry: ${line}`;
      // Send error to both windows
      if (mainWindow) mainWindow.webContents.send('log-received', errMsg);
      if (activeShuttleWindow) activeShuttleWindow.webContents.send('log-received', errMsg);
    }
  } else {
    // Send all other lines as raw logs to the active window
    targetWindow.webContents.send('log-received', line);
  }
}

// --- Helper: Port Checker ---
function checkPort(ip, port, timeout = 500) {
return new Promise((resolve, reject) => {
const socket = new net.Socket();

const timer = setTimeout(() => {
socket.destroy();
reject(new Error('Timeout'));
}, timeout);

socket.on('connect', () => {
clearTimeout(timer);
socket.destroy();
resolve();
});

socket.on('error', (err) => {
clearTimeout(timer);
socket.destroy();
reject(err);
});

socket.connect(port, ip);
});
}