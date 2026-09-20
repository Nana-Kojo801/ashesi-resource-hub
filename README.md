# Ashesi Resource Hub — experimental full-client SPA variant

A single, durable directory of official Ashesi University student resources — portals, forms, bookings, offices and emergency numbers — searchable by name or by what a student is trying to do (e.g. "my hostel AC is broken"). No login, no student accounts, ever.

**This branch (`experiment/full-client-spa`) is an A/B experiment.** It replaces the static/prerendered Astro site on `main` with a fully client-rendered Vite + React SPA — same design system, same copy, same content, same Convex backend — so the owner can compare navigation speed and UX side by side. See [What's different from `main`](#whats-different-from-main) below for how to switch between the two and what to look at. Nothing here is meant to replace `main`; it's a comparison branch.

## Tech stack (this branch)

- **Vite + React + TypeScript**, fully client-rendered: one `index.html` + one JS bundle, no server-rendered or prerendered HTML for content pages. The browser downloads the app shell, then JS renders everything, including first paint of real content.
- **React Router** (`createBrowserRouter`) for client-side routing — no page reloads between routes.
- **A generated JSON data file**, not build-time content collections: `scripts/build-data.mjs` reads every YAML file in `src/content/resources/` (unchanged — still the single source of truth), filters to `status: active`, and writes `public/data/resources.json`, which the SPA `fetch()`s at runtime. Wired into `pnpm dev`/`pnpm build` via `predev`/`prebuild`.
- **Skeleton loading states** everywhere content loads client-side: the category board, category pages, resource detail pages and the search box all show shimmering placeholder shapes (via a shared `<Skeleton />` primitive in `src/components/Skeleton.tsx`) while `resources.json` (or the Fuse index) is loading, instead of blank space.
- **Fuse.js** for client-side fuzzy search, same weighting as `main` (aliases 0.5, title 0.3, description 0.2, threshold 0.35), now fetched and indexed at runtime in `SearchBox.tsx`.
- **GSAP** for the same scroll-reveal and hover motion (`src/lib/motion.ts`), re-run from a `useEffect` on route change / data-loaded instead of Astro's `astro:page-load` event.
- **Convex**, unchanged — scoped *only* to the `reports` (flags) table and the Telegram content-editing bot's HTTP actions. It never stores resource content. The env var is renamed `PUBLIC_CONVEX_URL` → `VITE_CONVEX_URL` because Vite (unlike Astro) only exposes `VITE_`-prefixed vars to client code; same value, same Convex deployment.
- **Telegram bot** (via Convex HTTP actions + OpenAI function calling), unchanged, as the sole way to add, edit or archive resources, writing directly to this repo through the GitHub Contents API.

**Package manager: pnpm, exclusively.** Never run `npm` or `yarn` in this repo.

## What's different from `main`

| | `main` (Astro) | `experiment/full-client-spa` (this branch) |
|---|---|---|
| Rendering | Static output, every page prerendered at build time | Fully client-rendered SPA — one shell, JS renders everything |
| Routing | Astro pages + View Transitions | React Router, `createBrowserRouter` |
| Resource data | Astro Content Collections, baked into HTML at build time | `public/data/resources.json`, generated from the same YAML at build time but fetched by the browser at runtime |
| Loading states | None needed (content is already in the HTML) | Skeleton loaders on every view while data is loading |
| Interactive islands | Svelte (`SearchBox.svelte`, `FlagButton.svelte`) | React (`SearchBox.tsx`, `FlagButton.tsx`) |
| Convex URL env var | `PUBLIC_CONVEX_URL` | `VITE_CONVEX_URL` |
| Convex backend (`convex/`) | Unchanged | Unchanged — byte-for-byte the same |

To compare them yourself: `git checkout main` and `git checkout experiment/full-client-spa`, run `pnpm install && pnpm dev` on each, and watch first paint / navigation timing in the browser's Network and Performance panels. Both branches point at the same Convex deployment if you set the right env var on each.

## Local development

```bash
pnpm install
pnpm dev              # generates public/data/resources.json, then starts Vite
pnpm dlx convex dev    # in a second terminal — runs the Convex backend locally
                       # and generates convex/_generated/* (not committed)
```

`pnpm dev` alone is enough to browse, search and read resources. You only need `convex dev` running if you're testing the flag flow or the Telegram bot locally.

```bash
pnpm build             # regenerates public/data/resources.json, then `vite build` to dist/
pnpm preview           # preview the static build
```

`dist/` is plain static assets (HTML shell + JS/CSS bundles + `data/resources.json`) — it still deploys to Netlify as a static site, just with client-side rendering instead of prerendering.

## Project structure

```
src/
  content/
    resources/*.yaml       # one file per resource — the entire content database (unchanged)
  components/
    SearchBox.tsx           # live fuzzy search (Fuse.js), with a skeleton state before its index loads
    FlagButton.tsx           # anonymous "flag a problem" flow (Convex mutation)
    ResourceCard.tsx
    CategorySection.tsx
    Skeleton.tsx              # shared skeleton primitive + composed shapes
    Layout.tsx                 # header/logo/SOS button/footer, ported from Base.astro
  routes/
    Home.tsx                # category browse board + search + intent chips
    CategoryPage.tsx
    ResourcePage.tsx          # resource detail "drawer" page
    EmergencyPage.tsx
  lib/
    categories.ts             # category display order + accent colors (framework-agnostic, ported as-is)
    motion.ts                  # GSAP scroll-reveal / hover, re-run on route change
    useResources.ts             # fetches public/data/resources.json once, shared across components
    types.ts
  styles/
    global.css                # design tokens, layout shell, skeleton shimmer
    components.css             # per-view styles ported from each .astro/.svelte file's <style>
scripts/
  build-data.mjs             # YAML -> public/data/resources.json, run via predev/prebuild
convex/
  schema.ts                # reports table only
  flags.ts                 # create (mutation), listOpen (internal query), resolve (internal mutation)
  flagsNode.ts              # notifyTelegram action, scheduled by flags.create
  http.ts                   # Telegram webhook route
  telegramBot.ts             # OpenAI function-calling agent loop
  openaiTools.ts              # tool schemas + system prompt
  lib/github.ts                # GitHub Contents API client (read/write/archive resource YAML)
  lib/telegram.ts              # sendTelegramMessage helper
```

## Content model

Every resource is one YAML file, validated against:

```ts
{
  title: string;
  type: string;
  access: string;
  url: string;          // must be a valid URL (mailto:/tel: included)
  category: string;      // free string, categories are derived at build time
  description: string;
  aliases: string[];      // everyday phrases a student might search instead
  status: 'active' | 'archived' | 'broken' | 'needs_review';
}
```

Only `status: active` resources are ever shown in browsing or search. Editing a resource never deletes its file — retiring one sets `status: archived`.

Resources were migrated from the design prototype's data plus the official contact directory and emergency contacts (see **Decisions made** below). General "about Ashesi" pages, marketing, and news were deliberately excluded, and no faculty email was fabricated — faculty without a published email were skipped entirely.

## Environment variables

| Variable | Used by | Where to set it |
|---|---|---|
| `OPENAI_API_KEY` | `convex/telegramBot.ts` — powers the content-editing agent | Convex dashboard → Settings → Environment Variables |
| `GITHUB_TOKEN` | `convex/lib/github.ts` — fine-grained PAT, Contents: Read+write on this repo only | Convex dashboard |
| `TELEGRAM_BOT_TOKEN` | `convex/lib/telegram.ts` — sends replies via the Bot API | Convex dashboard |
| `TELEGRAM_WEBHOOK_SECRET` | `convex/http.ts` — verified against `X-Telegram-Bot-Api-Secret-Token` on every webhook delivery | Convex dashboard, **and** passed to Telegram when you register the webhook (below) |
| `TELEGRAM_ALLOWED_USER_ID` | `convex/http.ts` / `convex/flagsNode.ts` — the one Telegram user id allowed to drive the bot, and who receives flag notifications | Convex dashboard |
| `VITE_CONVEX_URL` | `src/components/FlagButton.tsx` — the Convex deployment URL the browser talks to (renamed from `main`'s `PUBLIC_CONVEX_URL`; Vite only exposes `VITE_`-prefixed vars to client code) | Netlify → Site configuration → Environment variables (and your local `.env`) |

Copy `.env.example` to `.env` for the frontend var, and use `.dev.vars.example` as a checklist for what to set in the Convex dashboard (Convex does not read a `.dev.vars` file itself — this repo's copy is documentation only).

Optional overrides in `convex/lib/github.ts`: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_REPO_BRANCH` (default to this repo, `main`).

## Deploying

### Convex

Convex login and project creation are interactive (they open a browser to convex.dev), so run these from your own machine, not a restricted CI/sandbox:

```bash
pnpm dlx convex login     # one-time device login, opens your browser
pnpm dlx convex dev       # first run: choose "create a new project", then
                          # generates convex/_generated/* locally and leaves
                          # a dev deployment running for local testing
pnpm dlx convex deploy    # ships convex/ to your production deployment
```

Set all five Convex-side environment variables (everything in the table above except `VITE_CONVEX_URL`) in the Convex dashboard for the production deployment — either through **Settings → Environment Variables** in the dashboard, or:

```bash
pnpm dlx convex env set OPENAI_API_KEY sk-...
pnpm dlx convex env set GITHUB_TOKEN github_pat_...
pnpm dlx convex env set TELEGRAM_BOT_TOKEN 123456:...
pnpm dlx convex env set TELEGRAM_WEBHOOK_SECRET <the long random string from .dev.vars>
pnpm dlx convex env set TELEGRAM_ALLOWED_USER_ID <your numeric Telegram id>
```

Note the deployment's HTTP Actions URL (shown in the dashboard, looks like `https://your-deployment-name.convex.site`) — you'll need it below. This is **different** from the `.convex.cloud` URL used for `VITE_CONVEX_URL`.

### Getting your Telegram numeric user ID

`TELEGRAM_ALLOWED_USER_ID` is the *numeric* Telegram user id of the one person allowed to drive the bot — not a username. Easiest way: open a chat with **@userinfobot** on Telegram and send it any message; it replies with your `Id`. Use that number.

### Registering the Telegram webhook

Once Convex is deployed and its env vars are set:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-deployment-name.convex.site/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

Use the same `TELEGRAM_WEBHOOK_SECRET` value here as the one set in the Convex dashboard.

### Netlify

This project builds to a plain static site (a Vite SPA bundle — HTML shell + JS/CSS + generated `data/resources.json`, no server needed) — Netlify serves that directly.

- **Build command:** `pnpm build`
- **Publish directory:** `dist`
- Netlify auto-detects pnpm from `pnpm-lock.yaml`; no extra install command needed.
- For this branch specifically, connect the repo and point Netlify's branch deploy at `experiment/full-client-spa` (not `main`) if you want a separate URL to compare against the `main` deploy side by side.
- Set `VITE_CONVEX_URL` as a Netlify environment variable (**Site configuration → Environment variables**), pointing at your production Convex deployment's `.convex.cloud` URL.

> A single-page app needs an SPA fallback so deep links like `/resource/some-slug` don't 404 on a hard refresh — `public/_redirects` (`/* /index.html 200`) handles that; it's copied into `dist/` on every build.

## Decisions made while building this (spec left them ambiguous)

*(The numbered list below documents decisions from `main`'s original Astro build; items 6–9 specifically describe Astro/Svelte-era choices that no longer apply on this branch — see [What's different from `main`](#whats-different-from-main) for this branch's equivalents. Kept here for history.)*

1. **Contacts and emergency numbers as resources, not a separate collection.** Both are modeled as ordinary entries in the same `resources` collection, with `type: "Contact"` and `category: "Offices & People"` (the official contact directory) or `category: "Emergency"` (the four campus-safety numbers plus the Academic Affairs Hotline). This keeps one schema, one search index, and one Zod validator, and the home page's category board simply excludes those two categories from its tab row (they're one click away, and Emergency also gets its own dedicated `/emergency` page per the design).
2. **Faculty were not imported.** The inventory explicitly says not to fabricate or infer faculty emails, and none of the listed CS/IS faculty have a published email address in the source material — so no faculty contact records exist. The Faculty Directory itself is treated as informational and out of scope (it's a browse page, not an actionable link).
3. **GitHub Contents API tool schema.** Five tools: `list_resources`, `get_resource`, `create_or_update_resource`, `archive_resource`, plus the two flag tools (`list_open_flags`, `resolve_flag`). `create_or_update_resource` always takes fully typed fields (never raw YAML/file text) — `convex/lib/github.ts` is the only place that serializes YAML, so a maintainer's Telegram message can never smuggle a malformed or malicious file body through the model.
4. **OpenAI model & tool names.** `gpt-4o-mini` by default (overridable via `OPENAI_MODEL`), Chat Completions API with `tools`/`tool_choice: "auto"`, a bounded 6-turn tool loop per incoming message, and no cross-message memory (each Telegram message is a fresh conversation, per spec).
5. **Category display order & slugs.** A fixed order is defined in `src/lib/categories.ts` (Academic → Library → Career → Support → Housing → Research → International → AI → Offices & People → Emergency); an unrecognized category still renders (sorted last, alphabetically) rather than breaking the build. Slugs are a simple lowercase-kebab transform of the category name.
6. **Svelte 4 with `@astrojs/svelte`.** Chosen for stability with the pinned Astro 4.x line used here; both islands are minimal and don't need Svelte 5 runes.
7. **GSAP via npm**, not a CDN `<script>` tag, bundled through Vite/Astro like any other dependency — simpler to keep versioned in `package.json` and avoids an extra network request per page.
8. **View Transitions depth.** Astro's native `<ViewTransitions />` is enabled globally in `Base.astro` for cross-page morphing (category nav, resource detail "drawer" pages); GSAP's scroll-reveal/hover script re-runs after each transition via the `astro:page-load` event, so motion still applies after a client-side navigation.
9. **`output: 'static'`.** Verified reasoning in `astro.config.mjs`: every route, including `search-index.json.ts`, is fully knowable at build time (it just serializes the active resources collection) — there is no server-only logic anywhere in the Astro app, so a plain static build deploys cleanly to Netlify (or any static host) with no adapter.
10. **Resource "Verified" date.** Shown on the resource detail page as a fixed `2026-09-19`, matching the inventory document's stated research/verification date, since no per-resource `last_verified_at` field was added to the schema (the spec's schema block didn't include one; adding one is a natural follow-up if per-resource verification dates need to be tracked going forward).

## Explicitly out of scope

- Bot conversation memory across messages
- Student resource submission (flagging existing ones is the only student-facing input)
- A custom admin dashboard (Convex's built-in dashboard + the Telegram bot cover this)
- Any user accounts or login on this platform itself
