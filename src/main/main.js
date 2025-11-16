const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');

let mainWindow;
let activeSocket = null; // Holds our single, persistent TCP connection

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
mainWindow.loadURL('http://localhost:5173');
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
ipcMain.handle('start-scan', async (event, { start, end, timeout }) => {
const startIpArr = start.split('.').map(Number);
const endIpArr = end.split('.').map(Number);
const PORT = 8080; // Per-spec (assumed)

// Simple scanner for the last octet only (as per mock data)
for (let i = startIpArr[3]; i <= endIpArr[3]; i++) {
const ip = `${startIpArr.slice(0, 3).join('.')}.${i}`;

// Send progress to renderer
const percent = ((i - startIpArr[3] + 1) / (endIpArr[3] - startIpArr[3] + 1)) * 100;
mainWindow.webContents.send('scan-progress', { ip, percent: Math.round(percent) });

try {
await checkPort(ip, PORT, timeout);
// On success, we'd normally get telemetry. For now, just send a mock hub.
// In a real app, we'd connect, wait for ##TELEMETRY##, then disconnect.
const mockHub = {
id: ip, // Use IP as ID
name: `Hub ${ip}`,
ip: ip,
status: 'Stand By',
battery: Math.floor(Math.random() * 100),
details: { firmware: 'v1.0.0', mac: '??:??:??:??:??:??', uptime: 'N/A', signal: 'N/A' }
};
mainWindow.webContents.send('hub-found', mockHub);
} catch (error) {
// Port is closed, do nothing
}
}
return 'Scan Complete';
});

// --- Hub Connection ---
ipcMain.handle('connect-hub', async (event, ip) => {
if (activeSocket) {
activeSocket.destroy();
activeSocket = null;
}

const PORT = 8080; // Per-spec (assumed)

return new Promise((resolve, reject) => {
const socket = new net.Socket();

socket.on('connect', () => {
mainWindow.webContents.send('log-received', `[INFO] TCP socket connected to ${ip}:${PORT}`);
activeSocket = socket;

// Handle incoming data
let buffer = '';
socket.on('data', (data) => {
buffer += data.toString();
let boundary = buffer.indexOf('\n');

while (boundary !== -1) {
const line = buffer.substring(0, boundary).trim();
buffer = buffer.substring(boundary + 1);

if (line) {
handleSocketData(line);
}
boundary = buffer.indexOf('\n');
}
});

resolve({ success: true, ip });
});

socket.on('close', () => {
mainWindow.webContents.send('log-received', `[WARN] Connection to ${ip} closed.`);
mainWindow.webContents.send('hub-disconnected');
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
if (activeSocket) {
activeSocket.write(command + '\n');
mainWindow.webContents.send('log-received', `[CMD] > ${command}`);
} else {
mainWindow.webContents.send('log-received', `[ERROR] Cannot send command. No active connection.`);
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
}

// --- Helper: Data Parser ---
function handleSocketData(line) {
if (line.startsWith('##TELEMETRY##')) {
// Example: ##TELEMETRY##v2.1.4,30:AE:...,7h 14m, -65dBm,88,Stand By
try {
const parts = line.replace('##TELEMETRY##', '').split(',');
const telemetry = {
firmware: parts[0],
mac: parts[1],
uptime: parts[2],
signal: parts[3],
battery: parseInt(parts[4], 10),
status: parts[5]
};
mainWindow.webContents.send('telemetry-update', telemetry);
} catch (err) {
mainWindow.webContents.send('log-received', `[ERROR] Failed to parse telemetry: ${line}`);
}
} else {
// Send all other lines as raw logs
mainWindow.webContents.send('log-received', line);
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