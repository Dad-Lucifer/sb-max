import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://lavenderblush-chicken-803718.hostingersite.com0',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://lavenderblush-chicken-803718.hostingersite.com0',
        ws: true,
      }
    }
  },
})
