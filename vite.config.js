import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
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

          // ── Route-specific heavy libraries (only load when their lazy route is visited) ──
          // Leaflet & react-leaflet are used only in OrderDetails / DeliveryOrderDetails
          if (id.includes('/leaflet/') || id.includes('/react-leaflet/') || id.includes('/@react-leaflet/')) {
            return 'chunk-map';
          }
          // Framer-motion is used in ProductDisplay, OrderDetails, some admin pages
          if (id.includes('/framer-motion/')) {
            return 'chunk-animation';
          }
          // SweetAlert2 — only in admin portal
          if (id.includes('/sweetalert2/')) {
            return 'chunk-alert';
          }
          // QR scanner — only in admin portal (BannerAdmin / FestivalOfferAdmin)
          if (id.includes('/html5-qrcode/') || id.includes('/qrcode.react/')) {
            return 'chunk-qr';
          }
          // react-hook-form — forms are lazily loaded
          if (id.includes('/react-hook-form/')) {
            return 'chunk-forms';
          }
          // react-table — only admin tables
          if (id.includes('/@tanstack/react-table/')) {
            return 'chunk-table';
          }
          // react-infinite-scroll — catalog / search pages (lazy)
          if (id.includes('/react-infinite-scroll-component/')) {
            return 'chunk-scroll';
          }

          // ── Icon libraries — large but mostly tree-shaken; keep separate ──
          if (id.includes('/react-icons/') || id.includes('/lucide-react/')) {
            return 'chunk-icons';
          }

          // ── Core vendor — React, Redux, Router, Axios (always needed) ──
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

          // ── Toast (small, used on landing page) ──
          if (id.includes('/react-hot-toast/')) {
            return 'vendor-core';
          }

          // Everything else (immer, reselect, etc.)
          return 'vendor-misc';
        }
      }
    }
  }
})
