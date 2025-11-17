const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');

// --- Config Loading ---
// Load configuration from config.json at the root
const configPath = path.join(app.getAppPath(), '..', 'config.json');
let config = {};
try {
  // Check if we are in a packaged app
  const configReadPath = fs.existsSync(configPath) 
    ? configPath  // Packaged app path
    : path.join(__dirname, '..', '..', 'config.json'); // Dev path
  config = JSON.parse(fs.readFileSync(configReadPath, 'utf-8'));
  console.log('Config loaded:', config);
} catch (err) {
  console.error('Failed to load config.json. Using defaults.', err);
  // Set defaults in case config fails to load
  config = {
    defaultScanRange: { start: '192.168.40.1', end: '192.168.40.255' },
    defaultScanTimeout: 500,
    reconnectInterval: 4000,
    dashboardRescanInterval: 10000,
    commandMappings: { "REBOOT": "SYS_REBOOT_CMD_PLACEHOLDER" }
  };
}


// --- Main Process State ---
let mainWindow; // The main dashboard window
const shuttleWindows = new Map(); // Key: hubIp (string), Value: BrowserWindow
const shuttleSockets = new Map(); // Key: hubIp (string), Value: net.Socket
const knownHubs = new Map();      // Key: hubIp (string), Value: ShuttleObject (for dashboard)
let livenessInterval = null;      // Holds the interval for the liveness scan


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
    // Main window closing, quit the app
    app.quit();
  });
}

// === App Lifecycle ===
app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();
  startLivenessScan(); // Start the background liveness loop
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Clean up all connections and intervals
  if (livenessInterval) clearInterval(livenessInterval);
  for (const socket of shuttleSockets.values()) {
    socket.destroy();
  }
  shuttleSockets.clear();
  shuttleWindows.clear();

  if (process.platform !== 'darwin') app.quit();
});

// === Helper Functions ---

// --- Network Scanner (Helper) ---
function probeHub(ip, port, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buffer = '';

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Timeout'));
    }, timeout);

    socket.on('connect', () => { });

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

// --- Connection Lifecycle (Helpers) ---
const reconnectTimers = new Map(); // Map to store reconnect intervals

function startReconnectLogic(ip) {
  if (reconnectTimers.has(ip)) return;
  const window = shuttleWindows.get(ip);
  if (!window) return;

  const interval = config.reconnectInterval || 4000;
  window.webContents.send('log-received', `[INFO] Starting reconnect loop for ${ip} every ${interval}ms.`);

  const timer = setInterval(() => {
    if (!shuttleWindows.has(ip)) {
      clearInterval(timer);
      reconnectTimers.delete(ip);
      return;
    }
    if (shuttleSockets.has(ip)) {
      clearInterval(timer);
      reconnectTimers.delete(ip);
      return;
    }

    window.webContents.send('log-received', `[INFO] Attempting to reconnect to ${ip}...`);

    connectToHub(ip)
      .then(() => {
        window.webContents.send('log-received', `[INFO] Reconnect to ${ip} successful.`);
        clearInterval(timer);
        reconnectTimers.delete(ip);
      })
      .catch(err => {
        window.webContents.send('log-received', `[WARN] Reconnect attempt failed: ${err.message}`);
      });
  }, interval);

  reconnectTimers.set(ip, timer);
}

function connectToHub(ip) {
  return new Promise((resolve, reject) => {
    const PORT = 3333;
    const window = shuttleWindows.get(ip);
    if (!window) {
      return reject(new Error('No window found for this IP.'));
    }
    if (shuttleSockets.has(ip)) {
      shuttleSockets.get(ip).destroy();
      shuttleSockets.delete(ip);
    }
    
    const socket = new net.Socket();

    socket.on('connect', () => {
      shuttleSockets.set(ip, socket);
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
            handleSocketData(line, window);
          }
          boundary = buffer.indexOf('\n');
        }
      });
      resolve();
    });

    socket.on('close', () => {
      window.webContents.send('log-received', `[WARN] Connection to ${ip} closed.`);
      window.webContents.send('hub-disconnected');
      shuttleSockets.delete(ip);
      startReconnectLogic(ip);
      reject(new Error('Connection closed'));
    });

    socket.on('error', (err) => {
      window.webContents.send('log-received', `[ERROR] Connection error: ${err.message}`);
      window.webContents.send('hub-disconnected');
      socket.destroy();
      shuttleSockets.delete(ip);
      startReconnectLogic(ip);
      reject(err);
    });

    socket.connect(PORT, ip);
  });
}

// --- Data Parser (Helper) ---
function handleSocketData(line, targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  if (line.startsWith('##TELEMETRY##:')) {
    try {
      const jsonString = line.substring(line.indexOf('{'));
      const telemetry = JSON.parse(jsonString);
      targetWindow.webContents.send('telemetry-update', telemetry);
    } catch (err) {
      targetWindow.webContents.send('log-received', `[ERROR] Failed to parse telemetry: ${line}`);
    }
  } else {
    targetWindow.webContents.send('log-received', line);
  }
}

// --- Background Liveness Scan (NEW) ---
function startLivenessScan() {
  const interval = config.dashboardRescanInterval || 10000;
  console.log(`Starting background liveness scan. Interval: ${interval}ms`);

  const runScan = async () => {
    if (!mainWindow || knownHubs.size === 0) {
      return; // Don't scan if no dashboard or no known hubs
    }
    
    const probePromises = [];
    for (const ip of knownHubs.keys()) {
      probePromises.push(
        probeHub(ip, 3333, config.defaultScanTimeout || 500)
          .then(hubData => {
            // Success: update hub in map
            knownHubs.set(ip, hubData);
          })
          .catch(err => {
            // Fail: Mark as Offline
            const hub = knownHubs.get(ip);
            if (hub) {
              hub.status = 'Offline';
              knownHubs.set(ip, hub);
            }
          })
      );
    }

    // Wait for all probes to finish
    await Promise.allSettled(probePromises);

    // Send one single update to the dashboard
    if (mainWindow) {
      mainWindow.webContents.send('hubs-updated', Array.from(knownHubs.values()));
    }
  };

  livenessInterval = setInterval(runScan, interval);
}


// === IPC Handlers (Registration) ===
function registerIpcHandlers() {

  // --- Network Scanner (Main) ---
  ipcMain.handle('start-scan', async (event, scanParams) => {
    const { start, end, timeout } = scanParams || {
      ...config.defaultScanRange,
      timeout: config.defaultScanTimeout
    };

    const startIpArr = start.split('.').map(Number);
    const endIpArr = end.split('.').map(Number);
    const PORT = 3333;
    let hubsFound = 0;

    knownHubs.clear(); // Clear for manual scan

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
        // This is normal
      }
    }
    
    // Send a final update with all found hubs
    if (mainWindow) {
      mainWindow.webContents.send('hubs-updated', Array.from(knownHubs.values()));
    }
    return `Scan Complete. Found ${hubsFound} hubs.`;
  });

  // --- Shuttle Window Management ---
  ipcMain.handle('open-shuttle-details', (event, hub) => {
    if (shuttleWindows.has(hub.ip)) {
      shuttleWindows.get(hub.ip).focus();
      return;
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

    shuttleWindows.set(hub.ip, shuttleWindow);

    if (process.env.NODE_ENV === 'development') {
      shuttleWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/shuttle/${hub.id}`);
    } else {
      shuttleWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), {
        hash: `#/shuttle/${hub.id}`,
      });
    }

    shuttleWindow.webContents.on('did-finish-load', () => {
      shuttleWindow.webContents.send('shuttle-data', hub);
    });

    shuttleWindow.on('closed', () => {
      shuttleWindows.delete(hub.ip);
      const socket = shuttleSockets.get(hub.ip);
      if (socket) {
        socket.destroy();
        shuttleSockets.delete(hub.ip);
      }
      const timer = reconnectTimers.get(hub.ip);
      if (timer) {
        clearInterval(timer);
        reconnectTimers.delete(hub.ip);
      }
      if (mainWindow) {
        mainWindow.webContents.send('hub-disconnected', hub.ip);
      }
    });
  });

  // --- Connection Trigger ---
  ipcMain.handle('connect-hub', async (event, ip) => {
    try {
      await connectToHub(ip);
      return { success: true, ip };
    } catch (err) {
      return Promise.reject(err);
    }
  });

  // --- Send Command (with Command Mapping) ---
  ipcMain.on('send-command', (event, { ip, command }) => {
    const socket = shuttleSockets.get(ip);
    const window = shuttleWindows.get(ip);
    if (!window) return;

    // Check for mapped command (e.g., "REBOOT")
    const commandToSend = config.commandMappings?.[command] || command;
    
    if (socket && socket.writable) {
      socket.write(commandToSend + '\n');
      window.webContents.send('log-received', `[CMD] > ${commandToSend} (Original: ${command})`);
    } else {
      window.webContents.send('log-received', `[ERROR] Cannot send command. No active connection to ${ip}.`);
    }
  });

  // --- Save Logs ---
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