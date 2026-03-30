import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/notifications/stream': {
        target: 'https://resumeai-backend-kxu6.onrender.com',
        changeOrigin: true,
        // Disable buffering for SSE — critical for real-time events
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['X-Accel-Buffering'] = 'no';
            proxyRes.headers['Cache-Control'] = 'no-cache, no-transform';
          });
        },
      },
      '/api': {
        target: 'https://resumeai-backend-kxu6.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
