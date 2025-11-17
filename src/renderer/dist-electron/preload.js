"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
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
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  }
});
