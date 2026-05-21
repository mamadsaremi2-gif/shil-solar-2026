import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.svg',
        '**/*.webp',
        '**/*.gif',
        '**/*.json'
      ],

      manifest: {
        name: 'SHIL SOLAR',
        short_name: 'SHIL SOLAR',
        start_url: '/',
        display: 'standalone',
        background_color: '#080b18',
        theme_color: '#080b18',

        icons: [
          {
            src: '/pwa-icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,png,jpg,jpeg,svg,gif,webp,json,woff2}'
        ],

        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'shil-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 31536000
              }
            }
          }
        ]
      }
    })
  ]
})
