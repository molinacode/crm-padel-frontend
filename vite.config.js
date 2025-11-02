import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@features': '/src/features',
      '@shared': '/src/components/shared',
    }
  },
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
          // Separar librerías grandes
          'jspdf': ['jspdf'],
          'html2canvas': ['html2canvas'],
          'chart': ['chart.js', 'react-chartjs-2'],
          'calendar': ['react-big-calendar', 'date-fns'],
          'supabase': ['@supabase/supabase-js'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    // Optimizaciones para móviles
    chunkSizeWarningLimit: 1000,
    target: 'es2015' // Mejor compatibilidad móvil
  },
  optimizeDeps: {
    include: ['jspdf', 'html2canvas']
  }
})
