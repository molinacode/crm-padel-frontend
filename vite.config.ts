import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/components/shared', import.meta.url)),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    // Alinea el puerto del cliente HMR con el servidor (evita WS fallido -> bundle antiguo en cache).
    hmr: { clientPort: 5175 },
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
        drop_console: true, // Remueve todos los console.log en produccion
        drop_debugger: true, // Remueve todos los debugger en produccion
      },
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // Separar librerias grandes
          jspdf: ['jspdf'],
          screenshot: ['modern-screenshot'],
          chart: ['chart.js', 'react-chartjs-2'],
          calendar: ['react-big-calendar', 'date-fns'],
          supabase: ['@supabase/supabase-js'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Optimizaciones para moviles
    chunkSizeWarningLimit: 1000,
    target: 'es2015', // Mejor compatibilidad movil
  },
  optimizeDeps: {
    include: ['jspdf', 'modern-screenshot'],
  },
});
