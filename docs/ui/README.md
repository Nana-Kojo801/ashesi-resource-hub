# Approved red UI implementation

These are browser screenshots of the implemented React/Vite pages, with desktop on the left and mobile on the right. The seven approved mockups guided the burgundy/rose/gold palette, Roboto typography, category rail, stepped action docks, page spacing and mobile navigation.

The screenshots use the actual UI areas in the reference boards: 1140 × 960 desktop and 334 × 960 mobile. Additional resource and office records remain accessible through the controls below the initial page composition. The YAML collection and original resource destinations are unchanged.

| Page | Screenshot |
| --- | --- |
| Resources / Home | [Desktop and mobile](previews/home.png) |
| Academic & Administration | [Desktop and mobile](previews/category.png) |
| Search results | [Desktop and mobile](previews/search.png) |
| People / Offices & People | [Desktop and mobile](previews/people.png) |
| Maintenance Service Request | [Desktop and mobile](previews/detail.png) |
| Emergency | [Desktop and mobile](previews/emergency.png) |
| Flag a problem | [Desktop and mobile](previews/report.png) |

## Verification

`pnpm test:ui` passes. It builds the Vite SPA and generated resource dataset, validates local links/assets, captures all fourteen views, checks JavaScript errors and horizontal overflow at six widths, and exercises:

- Client-side React Router navigation and category selection without document reloads, browser back navigation, cached resource data and search after navigation.
- Exact alias intent search ("my AC is broken" resolves to Maintenance), clearing and no-result states.
- Category type filters and expansion of the full resource/office directory.
- Office search and original email/telephone destinations.
- Required report reason and honest failure handling when no backend is configured.
- All four emergency telephone destinations and the Academic Affairs email hotline.

[Machine-readable results](verification.json) contain the viewport checks. The test intentionally builds without a live Convex URL; successful report delivery to Convex/Telegram was not exercised. The production form retains the existing `flags:create` mutation and `VITE_CONVEX_URL` configuration.

Install Chromium once using `pnpm exec playwright install chromium`, then run `pnpm test:ui`. Use Node 20 or later for the browser tooling. For an existing Chromium binary, set `UI_CHROMIUM_PATH` to its path. Screenshots are written to ignored `artifacts/ui/` by default.

![Resources / Home](previews/home.png)
