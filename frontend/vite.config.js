import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/mood': 'http://localhost:5000',
      '/chatbot': 'http://localhost:5000',
    }
  }
})


