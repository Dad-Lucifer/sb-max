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
        target: 'https://lavenderblush-chicken-803718.hostingersite.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://lavenderblush-chicken-803718.hostingersite.com',
        ws: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/') || id.includes('react-router/')) {
              return 'vendor-react';
            }
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'vendor-motion';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
          }
        }
      }
    }
  }
})
