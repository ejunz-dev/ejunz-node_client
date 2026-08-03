import { defineConfig, type Plugin } from 'vite'
import uniImport from '@dcloudio/vite-plugin-uni'

// The uni plugin is CommonJS in some published toolchain versions and ESM in
// others. Normalize both shapes so H5/mp-weixin builds use the same entry.
const uni = ((uniImport as unknown as { default?: () => Plugin }).default ?? uniImport) as unknown as () => Plugin

// Target Edge server for the dev proxy. Override with EDGE_PROXY_TARGET env var.
const EDGE_TARGET = process.env.EDGE_PROXY_TARGET || 'https://edge-direct.ejunz.com'

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5175,
    host: true,
    proxy: {
      // Proxy /api/edge requests to the Edge server during H5 development,
      // avoiding CORS issues when the browser runs on localhost.
      '/api/edge': {
        target: EDGE_TARGET,
        changeOrigin: true,
      },
    },
  },
})
