import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // required for Docker
    port: 5173,
    proxy: {
      '/api': 'http://django:8000',   // proxy API calls to Django
      '/ws': {
        target: 'ws://django:8000',
        ws: true,
      }
    }
  }
})