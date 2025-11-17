import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Tell Vite where the root of the renderer app is.
  // This is where index.html is located.
  root: 'src/renderer',

  // Base directory for all built assets
  build: {
    // This is now relative to 'root', so we need to go up
    // and put it in the main 'dist' folder
    outDir: '../../dist/renderer'
  },
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file
        // Path is now relative to the 'root'
        entry: '../main/main.js',
        // Put built file in 'dist-electron'
        // Path is now relative to the 'root'
        outDir: '../../dist-electron'
      },
      {
        // Preload-Process entry file
        // Path is now relative to the 'root'
        entry: '../preload/preload.js',
        // Put built file in 'dist-electron'
        // Path is now relative to the 'root'
        outDir: '../../dist-electron',
        onstart(options) {
          // Reverting to 'reload' which is supported by your plugin version
          options.reload();
        },
      },
    ]),
    electronRenderer({
      // Put all renderer files in 'dist/renderer'
      // Path is now relative to the 'root'
      outDir: '../../dist/renderer',
      // Optional: force an absolute path to the renderer's
      // html file, which is necessary in some environments.
      absolute: true,
    }),
  ],
});