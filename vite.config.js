import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "pwa-icons/icon-192.png",
        "pwa-icons/icon-512.png",
        "pwa-icons/apple-touch-icon.png"
      ],
      manifest: {
        name: "SHIL IRAN",
        short_name: "SHIL",
        theme_color: "#0b1020",
        background_color: "#0b1020",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  build: {
    target: "es2020",
    minify: "terser",
    sourcemap: false,
    chunkSizeWarningLimit: 2500
  },
  server: {
    host: "0.0.0.0"
  }
});
