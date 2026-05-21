import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "pwa-icons/icon-192.png",
        "pwa-icons/icon-512.png",
        "assets/**/*",
      ],
      manifestFilename: "manifest.webmanifest",
      manifest: {
        name: "SHIL Engineering",
        short_name: "SHIL",
        description: "SHIL offline engineering platform for solar and utility-scale calculations",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        lang: "fa",
        dir: "rtl",
        theme_color: "#081120",
        background_color: "#020617",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,json,woff,woff2,ttf}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "shil-html-routes-v1",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "shil-static-runtime-v1",
              expiration: {
                maxEntries: 180,
                maxAgeSeconds: 90 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => ["image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "shil-media-fonts-v1",
              expiration: {
                maxEntries: 260,
                maxAgeSeconds: 180 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "shil-api-cache-v1",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        navigateFallback: "/index.html",
        type: "module",
      },
    }),
  ],

  build: {
    target: "es2020",
    minify: "terser",
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
          if (id.includes("recharts") || id.includes("chart.js") || id.includes("d3")) return "vendor-charts";
          if (id.includes("jspdf") || id.includes("xlsx") || id.includes("html2canvas")) return "vendor-reports";
          if (id.includes("maplibre") || id.includes("leaflet") || id.includes("@turf")) return "vendor-maps";
          if (id.includes("monaco") || id.includes("@uiw")) return "vendor-editors";
          if (id.includes("firebase") || id.includes("@supabase")) return "vendor-backend";
          return "vendor-core";
        },
      },
    },
  },

  server: {
    host: "0.0.0.0",
  },
});
