import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:5055'
  const requestedHost = env.VITE_HOST || process.env.VITE_HOST || 'localhost'
  const host = requestedHost === '0.0.0.0' ? 'localhost' : requestedHost
  const port = Number(env.VITE_PORT || 5173)

  return {
    plugins: [react()],
    server: {
      // Bind to the requested host (defaults to localhost for dev convenience)
      host,
      port,
      strictPort: false,
      hmr: {
        host,
        clientPort: port,
        protocol: 'ws',
      },
      // Ignore files that can change frequently and cause reload loops
      watch: {
        // Avoid reacting to temporary writes/renames from background processes
        awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 100 },
        ignored: [
          '**/*.log',
          '**/*.pid',
          '**/backend.log',
          '**/dev.log',
          '**/backend/**',
          '**/dist/**',
          '**/.DS_Store',
          // Backend replicator updates this file periodically; ignore to stop loops
          '**/src/data/appData.json',
        ],
      },
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
      },
    }
  }
})
