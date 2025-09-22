import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:5055'

  return {
    plugins: [react()],
    server: {
      // Bind explicitly to localhost to avoid HMR reconnect loops
      host: 'localhost',
      port: 5173,
      hmr: {
        host: 'localhost',
        clientPort: 5173,
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
