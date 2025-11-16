import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'src/main/main.js',
      },
      {
        entry: 'src/preload/preload.js',
        onstart(options) {
          // Onstart hook work like a watcher
          // Reloads the page when the preload file changes
          options.reload();
        },
      },
    ]),
    electronRenderer(),
  ],
});
