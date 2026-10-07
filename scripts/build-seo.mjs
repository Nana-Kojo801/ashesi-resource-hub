import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pageSeo, SITE_NAME, SHARE_IMAGE } from "../src/lib/seo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const template = readFileSync(path.join(dist, "index.html"), "utf8");
const resources = JSON.parse(readFileSync(path.join(dist, "data/resources.json"), "utf8"));
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const routes = [
  { path: "/", mode: "home" }, { path: "/emergency", mode: "emergency" },
  { path: "/search", mode: "search" }, { path: "/contacts", mode: "people" },
  ...[...new Set(resources.map((r) => r.category))].map((category) => ({ path: `/category/${slug(category)}`, mode: category === "Offices & People" ? "people" : "category", category })),
  ...resources.flatMap((resource) => [ { path: `/resource/${resource.slug}`, mode: "detail", resource }, { path: `/resource/${resource.slug}/report`, mode: "report", resource } ]),
];
for (const route of routes) {
  const seo = pageSeo({ ...route, resources });
  const meta = (name, value, property = false) => `<meta ${property ? "property" : "name"}="${name}" content="${escape(value)}" />`;
  const tags = [
    `<title>${escape(seo.title)}</title>`, meta("description", seo.description), meta("robots", seo.robots),
    `<link rel="canonical" href="${escape(seo.canonical)}" />`,
    ...Object.entries({ "og:type": "website", "og:site_name": SITE_NAME, "og:title": seo.title, "og:description": seo.description, "og:url": seo.canonical, "og:image": SHARE_IMAGE, "og:image:width": "1200", "og:image:height": "630", "og:image:alt": "Ashesi Resource Hub — links, forms and people", "og:locale": "en_GH" }).map(([name, value]) => meta(name, value, true)),
    ...Object.entries({ "twitter:card": "summary_large_image", "twitter:title": seo.title, "twitter:description": seo.description, "twitter:image": SHARE_IMAGE, "twitter:image:alt": "Ashesi Resource Hub — links, forms and people" }).map(([name, value]) => meta(name, value)),
    `<script id="hub-structured-data" type="application/ld+json">${JSON.stringify(seo.structuredData).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
  // A useful fallback for people who disable JavaScript; it isn't hidden SEO text.
  const entries = route.resource ? [route.resource] : route.mode === "people" ? resources.filter((r) => r.category === "Offices & People") : route.mode === "category" ? resources.filter((r) => r.category === route.category) : route.mode === "emergency" ? resources.filter((r) => r.category === "Emergency") : resources;
  const fallback = `<noscript><main class="page-content"><h1>${escape(seo.title)}</h1><p>${escape(seo.description)}</p><p>Enable JavaScript to use search and filters. You can still open these resources directly.</p><ul>${entries.map((r) => `<li><a href="${escape(r.url)}">${escape(r.title)}</a> — ${escape(r.description)}</li>`).join("")}</ul><a href="/">All resources</a></main></noscript>`;
  const html = template.replace(/<!-- hub:seo:start -->[\s\S]*?<!-- hub:seo:end -->/, `<!-- hub:seo:start -->\n${tags}\n<!-- hub:seo:end -->`).replace('<!-- hub:fallback -->', fallback);
  const directory = route.path === "/" ? dist : path.join(dist, route.path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, "index.html"), html);
}
console.log(`[build-seo] wrote ${routes.length} route-specific HTML heads; React SPA navigation preserved`);
