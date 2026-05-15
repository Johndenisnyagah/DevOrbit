import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite development configuration.
 *
 * The proxy keeps frontend code on relative `/api` URLs while forwarding those
 * requests to the Flask backend during local development.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  }
})
