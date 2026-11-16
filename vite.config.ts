import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { studioPlugin } from "./tools/studioPlugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), studioPlugin()],
  base: "/",
  // shown in the footer of the FM1 Kustomizer: when this server / build started (tells a stale tab or server at a glance)
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(5, 16).replace("T", " ")) },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
