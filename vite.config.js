import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
        "images/branding/shil-iran-logo-final.png",
      ],
      manifest: {
        name: "SHIL SOLAR",
        short_name: "SHIL SOLAR",
        description: "نرم‌افزار مهندسی طراحی سیستم خورشیدی و برق اضطراری SHIL",
        lang: "fa",
        dir: "rtl",
        display: "standalone",
        start_url: "/",
        scope: "/",
        background_color: "#0f172a",
        theme_color: "#0b1220",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
    }),
  ],
});
