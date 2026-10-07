# Ashesi Resource Hub

A single, durable directory of official Ashesi University student resources — portals, forms, bookings, offices and emergency numbers — searchable by name or by what a student is trying to do (e.g. "my hostel AC is broken"). No login, no student accounts, ever. See `docs` context in the repo's design references for the full product description.

## Tech stack

- **Astro** (static output) for every page — the resource board, category pages, resource detail pages, the emergency page and the build-time search index.
- **Svelte** — `Hub.svelte` renders the shared page shell and directory at build time, then hydrates search, category filters and the anonymous report form. Links and resource content are available before hydration.
- **Astro Content Collections** — one YAML file per resource in `src/content/resources/`, validated by the Zod schema in `src/content/config.ts`.
- **Fuse.js** for client-side fuzzy search over the active collection passed to the Hub. Exact title/alias matches take precedence. The build-time JSON index (`src/pages/search-index.json.ts`) remains available for consumers.
- **Roboto**, self-hosted through Fontsource, with the approved burgundy, rose and gold interface. **Astro View Transitions** handle page navigation; CSS hover transitions respect reduced-motion preferences.
- **Convex**, scoped *only* to the `reports` (flags) table and the Telegram content-editing bot's HTTP actions. It never stores resource content.
- **Telegram bot** (via Convex HTTP actions + OpenAI function calling) as the sole way to add, edit or archive resources, writing directly to this repo through the GitHub Contents API.

**Package manager: pnpm, exclusively.** Never run `npm` or `yarn` in this repo.

## Local development

```bash
pnpm install
pnpm dev              # Astro dev server (the site itself)
pnpm dlx convex dev    # in a second terminal — runs the Convex backend locally
                       # and generates convex/_generated/* (not committed)
```

`pnpm dev` alone is enough to browse, search and read resources. You only need `convex dev` running if you're testing the flag flow or the Telegram bot locally.

```bash
pnpm build             # static build to dist/
pnpm preview           # preview the static build
pnpm exec playwright install chromium # first-time browser verification setup
pnpm test:ui           # build + screenshots + navigation/interaction checks
```

## UI design and verification

The seven page compositions follow the approved red mockups: Resources/Home, Academic & Administration, search results, People, resource details, Emergency and Flag a problem. The shared design uses burgundy text and controls, a gold square on the category rail, pale rose action docks with stepped tabs, self-hosted Roboto and mobile bottom navigation.

[Rendered desktop/mobile previews and verification notes](docs/ui/README.md) show the implemented pages. Additional resources and offices remain accessible below the initial composition; all source YAML records and destinations are preserved.

`pnpm test:ui` builds with `PUBLIC_CONVEX_URL` empty so the test cannot submit real reports or send notifications. It checks every generated page's internal links/assets, captures fourteen screenshots in `artifacts/ui`, exercises page transitions, exact intent search, clearing, type filters, empty states, contact search, directory expansion, report validation/error handling and emergency destinations, then checks horizontal overflow at 320, 334, 390, 768, 1140 and 1360 pixels. Screenshots use the actual browser areas from the approved boards (1140 × 960 desktop and 334 × 960 mobile). The image labels describe different viewport sizes; the rendered areas inside those images are the comparison reference.

## Project structure

```
src/
  content/
    config.ts             # Zod schema for the resources collection
    resources/*.yaml       # one file per resource — the entire content database
  components/
    Hub.svelte             # shared shell and seven page compositions
    SearchBox.svelte       # search input and clear/submit controls
    FlagButton.svelte      # anonymous report form
    TrackNav.svelte        # desktop category rail
    ResourceRow.svelte     # resource record and action dock
    ContactRow.svelte      # contact details and email action
    Icon.svelte            # shared SVG icons
  pages/
    index.astro            # everyday links, starter resources and intent search
    search.astro           # dedicated search route
    category/[slug].astro
    resource/[slug].astro  # resource detail page
    resource/[slug]/report.astro # dedicated anonymous report page
    emergency.astro
    search-index.json.ts   # build-time-only JSON endpoint for Fuse.js
  layouts/Base.astro
  lib/categories.ts         # category display order
  lib/presentation.ts        # view summaries, ordering and contact extraction
  styles/hub.css             # shared design tokens and responsive layouts
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
| `PUBLIC_CONVEX_URL` | `src/components/FlagButton.svelte` — the Convex deployment URL the browser talks to | Netlify → Site configuration → Environment variables (and your local `.env`) |

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

Set all five Convex-side environment variables (everything in the table above except `PUBLIC_CONVEX_URL`) in the Convex dashboard for the production deployment — either through **Settings → Environment Variables** in the dashboard, or:

```bash
pnpm dlx convex env set OPENAI_API_KEY sk-...
pnpm dlx convex env set GITHUB_TOKEN github_pat_...
pnpm dlx convex env set TELEGRAM_BOT_TOKEN 123456:...
pnpm dlx convex env set TELEGRAM_WEBHOOK_SECRET <the long random string from .dev.vars>
pnpm dlx convex env set TELEGRAM_ALLOWED_USER_ID <your numeric Telegram id>
```

Note the deployment's HTTP Actions URL (shown in the dashboard, looks like `https://your-deployment-name.convex.site`) — you'll need it below. This is **different** from the `.convex.cloud` URL used for `PUBLIC_CONVEX_URL`.

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

This project builds to a plain static site (`output: 'static'`, no adapter needed) — Netlify serves that directly.

- **Build command:** `pnpm build`
- **Publish directory:** `dist`
- Netlify auto-detects pnpm from `pnpm-lock.yaml`; no extra install command needed.
- Connect this GitHub repository (private — grant Netlify's GitHub App access to it specifically), branch `main`, with auto-deploy on push.
- Set `PUBLIC_CONVEX_URL` as a Netlify environment variable (**Site configuration → Environment variables**), pointing at your production Convex deployment's `.convex.cloud` URL.

## Decisions made while building this (spec left them ambiguous)

1. **Contacts and emergency numbers as resources, not a separate collection.** Both are modeled as ordinary entries in the same `resources` collection, with `type: "Contact"` and `category: "Offices & People"` (the official contact directory) or `category: "Emergency"` (the four campus-safety numbers plus the Academic Affairs Hotline). This keeps one schema, one search index, and one Zod validator, and the resource rail includes Offices & People while Emergency has its own dedicated `/emergency` page.
2. **Faculty were not imported.** The inventory explicitly says not to fabricate or infer faculty emails, and none of the listed CS/IS faculty have a published email address in the source material — so no faculty contact records exist. The Faculty Directory itself is treated as informational and out of scope (it's a browse page, not an actionable link).
3. **GitHub Contents API tool schema.** Five tools: `list_resources`, `get_resource`, `create_or_update_resource`, `archive_resource`, plus the two flag tools (`list_open_flags`, `resolve_flag`). `create_or_update_resource` always takes fully typed fields (never raw YAML/file text) — `convex/lib/github.ts` is the only place that serializes YAML, so a maintainer's Telegram message can never smuggle a malformed or malicious file body through the model.
4. **OpenAI model & tool names.** `gpt-4o-mini` by default (overridable via `OPENAI_MODEL`), Chat Completions API with `tools`/`tool_choice: "auto"`, a bounded 6-turn tool loop per incoming message, and no cross-message memory (each Telegram message is a fresh conversation, per spec).
5. **Category display order & slugs.** A fixed order is defined in `src/lib/categories.ts` (Academic → Library → Career → Support → Housing → Research → International → AI → Offices & People → Emergency); an unrecognized category still renders (sorted last, alphabetically) rather than breaking the build. Slugs are a simple lowercase-kebab transform of the category name.
6. **Svelte 4 with `@astrojs/svelte`.** The shared Hub component uses the pinned Astro 4.x integration and renders static HTML before client hydration.
7. **Self-hosted typography.** Roboto weights 400, 500 and 700 are bundled from the pinned Fontsource package. No remote font request is required.
8. **View Transitions.** Astro's native `<ViewTransitions />` is enabled globally in `Base.astro`. Each page hydrates its own Hub component, including its search state from the URL query string.
9. **`output: 'static'`.** Verified reasoning in `astro.config.mjs`: every route, including `search-index.json.ts`, is fully knowable at build time (it just serializes the active resources collection) — there is no server-only logic anywhere in the Astro app, so a plain static build deploys cleanly to Netlify (or any static host) with no adapter.
10. **Resource "Verified" date.** Shown on the resource detail page as a fixed `2026-09-19`, matching the inventory document's stated research/verification date, since no per-resource `last_verified_at` field was added to the schema (the spec's schema block didn't include one; adding one is a natural follow-up if per-resource verification dates need to be tracked going forward).

## Explicitly out of scope

- Bot conversation memory across messages
- Student resource submission (flagging existing ones is the only student-facing input)
- A custom admin dashboard (Convex's built-in dashboard + the Telegram bot cover this)
- Any user accounts or login on this platform itself
