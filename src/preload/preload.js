 const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the Renderer process
contextBridge.exposeInMainWorld('api', {
// === One-way: Renderer to Main (Fire and Forget) ===
send: (channel, data) => {
ipcRenderer.send(channel, data);
},

// === Two-way: Renderer to Main (Request/Response) ===
invoke: (channel, ...args) => {
return ipcRenderer.invoke(channel, ...args);
},

// === One-way: Main to Renderer (Event Subscription) ===
on: (channel, callback) => {
// Create a new function that only passes the event and args
const subscription = (event, ...args) => callback(...args);
ipcRenderer.on(channel, subscription);

// Return an "unsubscribe" function
return () => {
ipcRenderer.removeListener(channel, subscription);
};
}
});