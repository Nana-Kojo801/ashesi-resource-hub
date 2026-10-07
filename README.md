# Ashesi Resource Hub

A durable directory of official Ashesi University student resources — portals, forms, bookings, offices and emergency numbers — searchable by name or intent. No login or student accounts.

The deployed app on `main` is a React/Vite single-page application. It keeps the initial resource fetch cached and uses React Router for subsequent navigation without page reloads. The seven approved red page designs are implemented as React components, using self-hosted Roboto, the burgundy category rail, gold markers and pale rose action docks.

## Tech stack

- Vite, React, React Router and TypeScript, with React JSX view components.
- YAML resources compiled into `public/data/resources.json` by `scripts/build-data.mjs` and fetched once per page load.
- Fuse.js intent search, with exact title/alias matches taking precedence.
- Convex for anonymous resource reports and the existing Telegram content-editing bot. The frontend continues to use `VITE_CONVEX_URL`.
- Fontsource Roboto and shared responsive CSS in `src/styles/hub.css`.

**Package manager: pnpm exclusively.**

[All seven desktop/mobile previews and verification notes](docs/ui/README.md).

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
pnpm exec playwright install chromium # first-time browser setup
pnpm test:ui           # build + browser verification (Node 20+)
```

`dist/` is plain static assets (HTML shell + JS/CSS bundles + `data/resources.json`) — it still deploys to Netlify as a static site, just with client-side rendering instead of prerendering.

## Project structure

- `src/App.tsx`: React Router routes, including `/contacts`, `/search` and resource report routes.
- `src/routes/HubPage.tsx`: cached resource loading, page metadata, client navigation and missing/error states.
- `src/components/Hub.jsx`: the seven approved page layouts.
- `src/components/{SearchBox,FlagButton,TrackNav,ResourceRow,ContactRow,Icon}.jsx`: shared React views and interactions.
- `src/styles/hub.css`: approved typography, palette, layout and mobile rules.
- `src/lib/presentation.ts`: directory summaries, resource ordering and contact extraction.
- `src/content/resources/*.yaml`: the unchanged content database.
- `scripts/build-data.mjs`: generated resource data, canonical sitemap and robots.txt.
- `src/lib/seo.js` and `scripts/build-seo.mjs`: shared route metadata, structured data and static HTML heads for crawlers/link previews.
- `src/components/AppChrome.jsx`: persistent header and mobile navigation.
- `public/hub-mark.svg`: the app mark; PNG icons and the social card are checked in.
- `scripts/verify-ui.cjs`: browser screenshots and interaction/viewport checks.
- `convex/`: unchanged report schema, mutations and Telegram bot.

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
| `VITE_CONVEX_URL` | `src/components/FlagButton.jsx` — the existing Convex deployment URL the browser talks to | Netlify → Site configuration → Environment variables (and your local `.env`) |

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

This project builds to a Vite SPA with static route-specific HTML heads, JS/CSS and generated `data/resources.json`. Netlify serves the files directly; no server runtime is required. Internal navigation stays client-side.

- **Build command:** `pnpm build`
- **Publish directory:** `dist`
- Netlify auto-detects pnpm from `pnpm-lock.yaml`; no extra install command needed.
- The production deployment uses the `main` branch.
- Set `VITE_CONVEX_URL` as a Netlify environment variable (**Site configuration → Environment variables**), pointing at your production Convex deployment's `.convex.cloud` URL.

> Known routes have generated HTML files with their own metadata. The non-forced fallback does not override them. A single-page app still needs an SPA fallback so deep links like `/resource/some-slug` don't 404 on a hard refresh — `public/_redirects` (`/* /index.html 200`) handles that; it's copied into `dist/` on every build.

## Decisions made while building this (spec left them ambiguous)


1. **Contacts and emergency numbers as resources, not a separate collection.** Both are modeled as ordinary entries in the same `resources` collection, with `type: "Contact"` and `category: "Offices & People"` (the official contact directory) or `category: "Emergency"` (the four campus-safety numbers plus the Academic Affairs Hotline). This keeps one schema, one search index, and one Zod validator, and the home page's category board simply excludes those two categories from its tab row (they're one click away, and Emergency also gets its own dedicated `/emergency` page per the design).
2. **Faculty were not imported.** The inventory explicitly says not to fabricate or infer faculty emails, and none of the listed CS/IS faculty have a published email address in the source material — so no faculty contact records exist. The Faculty Directory itself is treated as informational and out of scope (it's a browse page, not an actionable link).
3. **GitHub Contents API tool schema.** Five tools: `list_resources`, `get_resource`, `create_or_update_resource`, `archive_resource`, plus the two flag tools (`list_open_flags`, `resolve_flag`). `create_or_update_resource` always takes fully typed fields (never raw YAML/file text) — `convex/lib/github.ts` is the only place that serializes YAML, so a maintainer's Telegram message can never smuggle a malformed or malicious file body through the model.
4. **OpenAI model & tool names.** `gpt-4o-mini` by default (overridable via `OPENAI_MODEL`), Chat Completions API with `tools`/`tool_choice: "auto"`, a bounded 6-turn tool loop per incoming message, and no cross-message memory (each Telegram message is a fresh conversation, per spec).
5. **Category display order & slugs.** A fixed order is defined in `src/lib/categories.ts` (Academic → Library → Career → Support → Housing → Research → International → AI → Offices & People → Emergency); an unrecognized category still renders (sorted last, alphabetically) rather than breaking the build. Slugs are a simple lowercase-kebab transform of the category name.
6. **React Router.** Internal resource links and category selection navigate client-side without reloading the document. `/contacts` remains supported alongside the People category route.
7. **Cached resource data.** The YAML-generated JSON is fetched once per page load and shared between routes.
8. **Self-hosted typography.** Roboto weights 400, 500 and 700 are bundled from Fontsource; CSS hover transitions respect reduced-motion preferences.
9. **Static hosting and SEO.** Vite outputs the SPA bundle, then a post-build script creates HTML heads with unique titles/descriptions, canonical URLs, Open Graph/Twitter previews, JSON-LD and a useful no-JavaScript directory. Browser metadata updates during navigation. Search, report and missing-resource views use `noindex`; the sitemap lists canonical indexable pages. Metadata does not claim the university publishes this student-built app.
10. **Resource "Verified" date.** Shown on the resource detail page as a fixed `2026-09-19`, matching the inventory document's stated research/verification date, since no per-resource `last_verified_at` field was added to the schema (the spec's schema block didn't include one; adding one is a natural follow-up if per-resource verification dates need to be tracked going forward).

## Explicitly out of scope

- Bot conversation memory across messages
- Student resource submission (flagging existing ones is the only student-facing input)
- A custom admin dashboard (Convex's built-in dashboard + the Telegram bot cover this)
- Any user accounts or login on this platform itself
