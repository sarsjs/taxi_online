import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Taxi Local',
        short_name: 'Taxi Local',
        description: 'App de taxis locales con viajes en tiempo real.',
        theme_color: '#ff7a4c',
        background_color: '#f8f9fb',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
