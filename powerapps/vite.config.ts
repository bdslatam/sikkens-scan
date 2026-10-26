import { defineConfig } from "vite";
import { powerApps } from "@microsoft/power-apps-vite/plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [powerApps()],
  build: { chunkSizeWarningLimit: 4000 },
});
