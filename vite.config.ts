import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Jakarta Translator · PT Wahana Manuskrip Semesta',
        short_name: 'Jakarta Translator',
        description: 'Sistem Operasional & Pemeliharaan Fasilitas - PT Wahana Manuskrip Semesta (Berpengalaman Sejak 2004)',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api/insforge': {
        target: 'http://43.157.228.75:7130',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/insforge/, '/api')
      }
    }
  }
});
