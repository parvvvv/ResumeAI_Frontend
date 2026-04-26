import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dynamically select API target based on VITE_API_TARGET env variable.
// Usage:
//   Local dev:  npm run dev                          → proxies to localhost:8000
//   Prod build: VITE_API_TARGET=production npm run dev → proxies to Render
const API_TARGETS = {
  local: 'http://localhost:8000',
  production: 'https://resumeai-backend-1.onrender.com',
}

const target = API_TARGETS[process.env.VITE_API_TARGET || 'local']

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/notifications/stream': {
        target,
        changeOrigin: true,
        // Disable buffering for SSE - critical for real-time events
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['X-Accel-Buffering'] = 'no';
            proxyRes.headers['Cache-Control'] = 'no-cache, no-transform';
          });
        },
      },
      '/api': {
        target,
        changeOrigin: true,
      },
    },
  },
})
