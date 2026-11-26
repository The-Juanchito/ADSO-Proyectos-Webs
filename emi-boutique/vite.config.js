import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Reenvía /api a la API local (npm run api)
      '/api': {
        target: 'http://localhost:8888',
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
      },
    },
  },
})