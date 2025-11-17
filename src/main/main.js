const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');

// --- Config Loading ---
// Load configuration from config.json at the root
// We'll place config.json in the project root, so adjust path to find it from dist-electron
const configPath = path.join(app.getAppPath(), '..', 'config.json');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log('Config loaded:', config);
} catch (err) {
  console.error('Failed to load config.json. Using defaults.', err);
  // Set defaults in case config fails to load
  config = {
    defaultScanRange: { start: '192.168.1.1', end: '192.168.1.255' },
    defaultScanTimeout: 500,
    reconnectInterval: 4000,
  };
}


// --- Main Process State (Refactored) ---
// Per TechSpec 2.2, remove global state and use Maps for management
let mainWindow; // The main dashboard window
const shuttleWindows = new Map(); // Key: hubIp (string), Value: BrowserWindow
const shuttleSockets = new Map(); // Key: hubIp (string), Value: net.Socket
const knownHubs = new Map();      // Key: hubIp (string), Value: ShuttleObject (for dashboard)


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
    // Main window closing, quit the app and clean up all sockets/windows
    app.quit();
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
  // Clean up all connections when all windows are closed
  for (const socket of shuttleSockets.values()) {
    socket.destroy();
  }
  shuttleSockets.clear();
  shuttleWindows.clear();

  if (process.platform !== 'darwin') app.quit();
});

// === IPC Handlers & Networking Logic ===
function registerIpcHandlers() {

  // --- Network Scanner (Helper) ---
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

              clearTimeout(timer);
              socket.destroy();
              resolve({
                id: ip,
                ip: ip,
                name: `Shuttle ${telemetry.shuttle || ip}`,
                status: telemetry.status_str || 'Unknown',
                battery: telemetry.batt || 0,
                lastSeen: Date.now()
              });
            } catch (e) {
              clearTimeout(timer);
              socket.destroy();
              reject(new Error('Malformed telemetry'));
            }
          } else {
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

  // --- Network Scanner (Main) ---
  ipcMain.handle('start-scan', async (event, scanParams) => {
    // Use provided params or fall back to config defaults
    const { start, end, timeout } = scanParams || {
      ...config.defaultScanRange,
      timeout: config.defaultScanTimeout
    };

    const startIpArr = start.split('.').map(Number);
    const endIpArr = end.split('.').map(Number);
    const PORT = 3333;
    let hubsFound = 0;

    // Clear known hubs for a fresh manual scan
    knownHubs.clear();

    const startOctet = startIpArr[3];
    const endOctet = endIpArr[3];
    const baseIp = startIpArr.slice(0, 3).join('.');

    for (let i = startOctet; i <= endOctet; i++) {
      const ip = `${baseIp}.${i}`;
      const percent = ((i - startOctet + 1) / (endOctet - startOctet + 1)) * 100;
      if (mainWindow) {
        mainWindow.webContents.send('scan-progress', { ip, percent: Math.round(percent) });
      }

      try {
        const hubData = await probeHub(ip, PORT, timeout);
        knownHubs.set(hubData.ip, hubData); // Add to our map
        if (mainWindow) {
          mainWindow.webContents.send('hub-found', hubData);
        }
        hubsFound++;
      } catch (error) {
        // This is normal (timeout, not a hub, etc.)
      }
    }
    return `Scan Complete. Found ${hubsFound} hubs.`;
  });

  // --- Shuttle Window Management (Refactored) ---
  ipcMain.handle('open-shuttle-details', (event, hub) => {
    // Per TechSpec 2.2 / Req A.2: Check if window already exists
    if (shuttleWindows.has(hub.ip)) {
      const existingWindow = shuttleWindows.get(hub.ip);
      existingWindow.focus();
      return; // Do not create a new window
    }

    // Window doesn't exist, create a new one
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

    // Add new window to our map
    shuttleWindows.set(hub.ip, shuttleWindow);

    if (process.env.NODE_ENV === 'development') {
      shuttleWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/shuttle/${hub.id}`);
      // shuttleWindow.webContents.openDevTools();
    } else {
      shuttleWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), {
        hash: `#/shuttle/${hub.id}`,
      });
    }

    shuttleWindow.webContents.on('did-finish-load', () => {
      // Send initial static data (name, ip) to the new window
      shuttleWindow.webContents.send('shuttle-data', hub);
    });

    // Handle window closure
    shuttleWindow.on('closed', () => {
      // Remove window from map
      shuttleWindows.delete(hub.ip);

      // Find and destroy the associated socket
      const socket = shuttleSockets.get(hub.ip);
      if (socket) {
        socket.destroy();
        shuttleSockets.delete(hub.ip);
      }
      
      // Stop any reconnect timers for this IP
      const timer = reconnectTimers.get(hub.ip);
      if(timer) {
        clearInterval(timer);
        reconnectTimers.delete(hub.ip);
      }

      // Tell the main dashboard a hub was disconnected (optional)
      if (mainWindow) {
        mainWindow.webContents.send('hub-disconnected', hub.ip);
      }
    });
  });

  // --- Connection Lifecycle (Refactored) ---
  const reconnectTimers = new Map(); // Map to store reconnect intervals

  function startReconnectLogic(ip) {
    // Ensure we don't stack multiple timers
    if (reconnectTimers.has(ip)) {
      return; 
    }

    const window = shuttleWindows.get(ip);
    if (!window) {
      return; // Window is closed, don't auto-reconnect
    }

    window.webContents.send('log-received', `[INFO] Starting reconnect loop for ${ip} every ${config.reconnectInterval}ms.`);

    const timer = setInterval(() => {
      if (!shuttleWindows.has(ip)) {
        clearInterval(timer);
        reconnectTimers.delete(ip);
        return;
      }
      
      // Don't try to reconnect if already connected
      if (shuttleSockets.has(ip)) {
        clearInterval(timer);
        reconnectTimers.delete(ip);
        return;
      }

      window.webContents.send('log-received', `[INFO] Attempting to reconnect to ${ip}...`);

      // We use `connectToHub` which returns a promise
      connectToHub(ip)
        .then(() => {
          // Success! Stop the timer.
          window.webContents.send('log-received', `[INFO] Reconnect to ${ip} successful.`);
          clearInterval(timer);
          reconnectTimers.delete(ip);
        })
        .catch(err => {
          // Failed, the timer will simply run again
          window.webContents.send('log-received', `[WARN] Reconnect attempt failed: ${err.message}`);
        });

    }, config.reconnectInterval);

    reconnectTimers.set(ip, timer);
  }

  function connectToHub(ip) {
    return new Promise((resolve, reject) => {
      const PORT = 3333;
      const window = shuttleWindows.get(ip);
      if (!window) {
        return reject(new Error('No window found for this IP.'));
      }

      // If a socket *somehow* already exists, kill it
      if (shuttleSockets.has(ip)) {
        shuttleSockets.get(ip).destroy();
        shuttleSockets.delete(ip);
      }
      
      const socket = new net.Socket();

      socket.on('connect', () => {
        shuttleSockets.set(ip, socket); // Add to map
        const connectMsg = `[INFO] TCP socket connected to ${ip}:${PORT}`;
        window.webContents.send('log-received', connectMsg);
        window.webContents.send('hub-connected');

        let buffer = '';
        socket.on('data', (data) => {
          buffer += data.toString();
          let boundary = buffer.indexOf('\n');

          while (boundary !== -1) {
            const line = buffer.substring(0, boundary).trim();
            buffer = buffer.substring(boundary + 1);
            if (line) {
              handleSocketData(line, window); // Route data to the correct window
            }
            boundary = buffer.indexOf('\n');
          }
        });

        resolve(); // Resolve promise on success
      });

      socket.on('close', () => {
        const closeMsg = `[WARN] Connection to ${ip} closed.`;
        window.webContents.send('log-received', closeMsg);
        window.webContents.send('hub-disconnected');
        
        shuttleSockets.delete(ip); // Remove from map
        startReconnectLogic(ip); // Trigger auto-reconnect
        
        reject(new Error('Connection closed'));
      });

      socket.on('error', (err) => {
        const errorMsg = `[ERROR] Connection error: ${err.message}`;
        window.webContents.send('log-received', errorMsg);
        window.webContents.send('hub-disconnected');

        socket.destroy();
        shuttleSockets.delete(ip);
        
        startReconnectLogic(ip); // Trigger auto-reconnect even on error
        reject(err);
      });

      socket.connect(PORT, ip);
    });
  }

  // This IPC call is now just a trigger for the main connection logic
  ipcMain.handle('connect-hub', async (event, ip) => {
    try {
      await connectToHub(ip);
      return { success: true, ip };
    } catch (err) {
      return Promise.reject(err); // Let the renderer know it failed
    }
  });

  // --- Send Command (Refactored) ---
  // Note: This expects { ip, command } from renderer (Phase 2 change)
  ipcMain.on('send-command', (event, { ip, command }) => {
    const socket = shuttleSockets.get(ip);
    const window = shuttleWindows.get(ip);
    
    if (!window) {
      console.error(`Cannot send command, no window found for ${ip}`);
      return;
    }

    if (socket && socket.writable) {
      socket.write(command + '\n');
      window.webContents.send('log-received', `[CMD] > ${command}`);
    } else {
      window.webContents.send('log-received', `[ERROR] Cannot send command. No active connection to ${ip}.`);
    }
  });

  // --- Save Logs (Refactored) ---
  // Note: This expects { ip, logs } from renderer (Phase 2 change)
  ipcMain.handle('save-log', async (event, { ip, logs }) => {
    const window = shuttleWindows.get(ip);
    if (!window) {
      return { success: false, error: 'Window not found' };
    }

    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      title: 'Save Logs',
      defaultPath: `hub-${ip}-logs-${new Date().toISOString().split('T')[0]}.txt`,
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
}

// --- Helper: Data Parser (Refactored) ---
function handleSocketData(line, targetWindow) {
  // targetWindow is passed in, no more global state
  if (!targetWindow || targetWindow.isDestroyed()) {
    return; // No window to send to
  }

  if (line.startsWith('##TELEMETRY##:')) {
    try {
      const jsonString = line.substring(line.indexOf('{'));
      const telemetry = JSON.parse(jsonString);
      targetWindow.webContents.send('telemetry-update', telemetry);
    } catch (err) {
      const errMsg = `[ERROR] Failed to parse telemetry: ${line}`;
      targetWindow.webContents.send('log-received', errMsg);
    }
  } else {
    // Send all other lines as raw logs
    targetWindow.webContents.send('log-received', line);
  }
}