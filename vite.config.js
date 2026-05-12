import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/scheduler")) return "react-vendor";
          if (id.includes("node_modules/jspdf")) return "pdf-jspdf";
          if (id.includes("node_modules/html2canvas")) return "pdf-html2canvas";
          if (id.includes("node_modules/@supabase")) return "supabase";
          if (id.includes("src/data/seed")) return "engineering-seeds";
          if (id.includes("src/engine") || id.includes("src/domain")) return "engineering-core";
          if (id.includes("src/features/admin") || id.includes("src/pages/AdminPage")) return "admin-panel";
          if (id.includes("src/ai")) return "ai-assistant";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
