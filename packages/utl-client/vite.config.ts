import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Monaco Editor plugin - use require for CommonJS compatibility
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default;

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    target: 'es2020',
    minify: false,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
});