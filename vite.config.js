import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "offline.html",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
        "brand/logo.png",
        "brand/dashboard-bg.png",
        "brand/shil-electrical-products-brand-advertisement.png"
      ],
      manifest: {
        name: "SHIL SOLAR",
        short_name: "SHIL",
        description: "سامانه طراحی و محاسبه سیستم‌های خورشیدی SHIL",
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "fa",
        dir: "rtl",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,webp,ico}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "shil-images-cache",
              expiration: { maxEntries: 90, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "NetworkFirst",
            options: {
              cacheName: "shil-app-cache",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ]
});
