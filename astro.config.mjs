import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// output: 'static' — every page in this project (index, category pages, the
// emergency page, and search-index.json.ts) is fully knowable at build time.
// search-index.json.ts is a GET endpoint with no per-request logic (it just
// serializes the active resources collection), so Astro can prerender it to
// a static JSON file exactly like any other static asset. There is no
// server-only route anywhere in the app — Convex (search-index consumers'
// mutations, flags, the Telegram bot) is a separate backend reached over
// HTTP from the browser, not from Astro server code — so 'static' output
// with the default (no) adapter is correct and keeps deployment to
// Netlify (or any static host) a plain static-site deploy.
export default defineConfig({
  output: 'static',
  integrations: [svelte()],
});
