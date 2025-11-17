import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Base directory for all built assets
  build: {
    outDir: 'dist'
  },
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file
        entry: 'src/main/main.js',
        // Put built file in 'dist/electron'
        outDir: 'dist/electron'
      },
      {
        // Preload-Process entry file
        entry: 'src/preload/preload.js',
        // Put built file in 'dist/electron'
        outDir: 'dist/electron',
        onstart(options) {
          options.reload();
        },
      },
    ]),
    electronRenderer({
      // Put all renderer files in 'dist/renderer'
      // This will be 'dist/renderer/index.html'
      outDir: 'dist/renderer',
      // Optional: force an absolute path to the renderer's
      // html file, which is necessary in some environments.
      absolute: true,
    }),
  ],
});