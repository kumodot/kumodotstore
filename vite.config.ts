import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { studioPlugin } from "./tools/studioPlugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), studioPlugin()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
