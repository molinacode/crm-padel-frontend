import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remueve todos los console.log en producción
        drop_debugger: true, // Remueve todos los debugger en producción
      },
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'xlsx': ['xlsx'],
          'jspdf': ['jspdf'],
          'html2canvas': ['html2canvas'],
          'file-saver': ['file-saver']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['xlsx', 'jspdf', 'html2canvas', 'file-saver']
  }
})
