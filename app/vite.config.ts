import { defineConfig, type Plugin, type UserConfig } from 'vite'
import uniImport from '@dcloudio/vite-plugin-uni'

// The uni plugin is CommonJS in some published toolchain versions and ESM in
// others. Normalize both shapes so all platform builds use the same entry.
const uni = ((uniImport as unknown as { default?: () => Plugin }).default ?? uniImport) as unknown as () => Plugin

// Target Edge server for the dev proxy. Override with EDGE_PROXY_TARGET env var.
const EDGE_TARGET = process.env.EDGE_PROXY_TARGET || 'https://edge-direct.ejunz.com'

// Platform-specific build configuration
const platform = process.env.UNI_PLATFORM || 'h5'

export default defineConfig(({ mode }) => {
  const config: UserConfig = {
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
  }

  // Electron loads the production H5 bundle from file://.
  if (process.env.ELECTRON_BUILD === '1') config.base = './'

  // App platform (iOS/Android) specific optimizations
  if (platform === 'app') {
    config.build = {
      ...config.build,
      // Larger chunk size for native app (no network download concern)
      chunkSizeWarningLimit: 2000,
      // Enable source maps for native debugging
      sourcemap: mode !== 'production',
    }
  }

  // Mini-program specific optimizations
  if (platform.startsWith('mp-')) {
    config.build = {
      ...config.build,
      // Mini-programs have strict size limits
      chunkSizeWarningLimit: 500,
      // Disable source maps for mini-program production builds
      sourcemap: mode === 'development',
      // Reduce bundle size
      minify: mode === 'production' ? 'esbuild' : false,
    }
  }

  return config
})
