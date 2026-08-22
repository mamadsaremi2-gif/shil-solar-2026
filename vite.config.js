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
        "favicon-32.png",
        "favicon-48.png",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "pwa-icons/icon-192.png",
        "pwa-icons/icon-512.png",
        "pwa-icons/icon-maskable-512.png",
      ],
      manifestFilename: "manifest.webmanifest",
      manifest: {
        id: "/",
        name: "SHIL Engineering Beta",
        short_name: "SHIL",
        description: "سامانه مهندسی SHIL برای طراحی، محاسبات و گزارش‌گیری سیستم‌های خورشیدی و برق اضطراری",
        start_url: "/login?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        lang: "fa",
        dir: "rtl",
        theme_color: "#081120",
        background_color: "#020617",
        categories: ["education", "utilities"],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: [
          "**/*.{js,css,html,ico,svg,json,woff,woff2}",
          "icon-192.png",
          "icon-512.png",
          "apple-touch-icon.png",
          "pwa-icons/*.png",
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "shil-beta-html-v1",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "shil-beta-static-v1",
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => ["image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "shil-beta-media-v1",
              expiration: { maxEntries: 160, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Do not register a service worker during local Vite development.
      // This prevents stale UI/CSS while you are actively editing.
      devOptions: {
        enabled: false,
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

  preview: {
    host: "0.0.0.0",
  },
});
