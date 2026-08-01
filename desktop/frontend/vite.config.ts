import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: __dirname,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api/edge': {
        target: process.env.EDGE_API || 'http://localhost:5283',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
