import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: './',
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',   // allow LAN access for mobile testing
    proxy: {
      '/api/edge': {
        target: process.env.EDGE_API || 'http://localhost:5283',
        changeOrigin: true,
      },
    },
  },
});
