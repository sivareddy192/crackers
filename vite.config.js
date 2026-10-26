import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/leaflet/') || id.includes('/react-leaflet/') || id.includes('/@react-leaflet/')) {
            return 'chunk-map';
          }
          if (id.includes('/framer-motion/')) {
            return 'chunk-animation';
          }
          if (id.includes('/sweetalert2/')) {
            return 'chunk-alert';
          }
          if (id.includes('/html5-qrcode/') || id.includes('/qrcode.react/')) {
            return 'chunk-qr';
          }
          if (id.includes('/react-hook-form/')) {
            return 'chunk-forms';
          }
          if (id.includes('/@tanstack/react-table/')) {
            return 'chunk-table';
          }
          if (id.includes('/react-infinite-scroll-component/')) {
            return 'chunk-scroll';
          }

          if (id.includes('/react-icons/') || id.includes('/lucide-react/')) {
            return 'chunk-icons';
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/react-router-dom/') ||
            id.includes('/@remix-run/') ||
            id.includes('/@reduxjs/toolkit/') ||
            id.includes('/react-redux/') ||
            id.includes('/axios/')
          ) {
            return 'vendor-core';
          }

          if (id.includes('/react-hot-toast/')) {
            return 'vendor-core';
          }

          return 'vendor-misc';
        }
      }
    }
  }
})
