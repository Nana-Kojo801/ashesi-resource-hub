import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fully client-rendered SPA build: a single index.html + JS bundle, no
// server-rendered/prerendered content pages. The resources directory is
// generated at build/dev time by scripts/build-data.mjs (see package.json's
// predev/prebuild hooks) into public/data/resources.json, which the app
// fetches at runtime — nothing about the resource list is baked into HTML.
export default defineConfig({
  plugins: [react()],
});
