import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React remains an SPA. The post-build step writes route-specific HTML heads
// for crawlers and link previews; internal navigation still uses React Router.
export default defineConfig({
  plugins: [react()],
});
