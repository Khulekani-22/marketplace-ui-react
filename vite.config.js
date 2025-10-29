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
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    plugins: [react()],
    build: {
      // Optimize chunk loading and reduce bundle splitting issues
      rollupOptions: {
        output: {
          manualChunks: {
            // Group related dependencies to reduce chunk loading failures
            vendor: ['react', 'react-dom', 'react-router-dom'],
            bootstrap: ['bootstrap'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            utils: ['axios', 'date-fns']
          },
          chunkFileNames: () => {
            // Use content hash for cache busting but shorter names for reliability
            return `assets/[name]-[hash:8].js`;
          },
          entryFileNames: `assets/[name]-[hash:8].js`,
          assetFileNames: `assets/[name]-[hash:8].[ext]`
        }
      },
      // Increase chunk size limit to reduce small chunks that might fail to load
      chunkSizeWarningLimit: 1000,
      // Optimize for production
      minify: mode === 'production' ? 'esbuild' : false,
      sourcemap: mode === 'development',
      // Ensure consistent builds
      target: 'es2020'
    },
    server: {
      // Bind to the requested host (defaults to localhost for dev convenience)
      host,
      port,
      strictPort: true,
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
