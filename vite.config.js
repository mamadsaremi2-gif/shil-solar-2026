import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isAnalyze = process.env.ANALYZE === 'true'
const base = process.env.VITE_BASE || '/'

export default defineConfig(async () => {
  const analyzePlugin = isAnalyze
    ? (await import('rollup-plugin-visualizer')).visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    : null

  return {
    base,

    plugins: [
      react(),

      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'offline.html'],
        manifest: {
          name: 'SHIL Solar Design Suite',
          short_name: 'SHIL Solar',
          description: 'سامانه حرفه ای محاسبات، طراحی و گزارش گیری پروژه های خورشیدی',
          theme_color: '#0b1e3c',
          background_color: '#0b1e3c',
          display: 'standalone',
          orientation: 'portrait',
          start_url: base,
          scope: base,
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: '/offline.html',
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/assets/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'shil-static-assets',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            },
            {
              urlPattern: ({ url }) => url.origin.includes('supabase.co'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'shil-supabase-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
              }
            }
          ]
        },
        devOptions: { enabled: false }
      }),

      analyzePlugin
    ].filter(Boolean),

    build: {
      target: 'es2020',
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('react-dom') || id.includes('/react/')) return 'react'
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) return 'pdf'
            if (id.includes('@supabase') || id.includes('postgrest-js') || id.includes('gotrue-js') || id.includes('realtime-js') || id.includes('storage-js')) return 'supabase'
            return 'vendor'
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    }
  }
})
