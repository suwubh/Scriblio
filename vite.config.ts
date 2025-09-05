import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    host: true,
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  optimizeDeps: {
    force: true,
  },
})
