import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { studioPlugin } from "./tools/studioPlugin.ts";

// Version shown in the Studio and the FM1 Kustomizer: package.json version + git commit; "+local" = uncommitted changes.
function appVersion() {
  const v = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8")).version as string;
  try {
    const hash = execSync("git rev-parse --short HEAD", { cwd: __dirname }).toString().trim();
    const dirty = execSync("git status --porcelain", { cwd: __dirname }).toString().trim() ? "+local" : "";
    return `${v} (${hash}${dirty})`;
  } catch { return v; }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), studioPlugin()],
  base: "/",
  // shown in the footer of the FM1 Kustomizer: when this server / build started (tells a stale tab or server at a glance)
  define: { __APP_VERSION__: JSON.stringify(appVersion()), __BUILD__: JSON.stringify(new Date().toISOString().slice(5, 16).replace("T", " ")) },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
