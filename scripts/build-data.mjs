// Reads every resource YAML file (the single source of truth, same schema
// the old Astro content collection used), filters to status === 'active',
// and emits one JSON file the SPA fetches at runtime. There is no
// content-collections step in a plain Vite build, so this script stands in
// for it, run via the predev/prebuild npm scripts (see package.json).
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const resourcesDir = path.join(root, 'src', 'content', 'resources');
const outDir = path.join(root, 'public', 'data');
const outFile = path.join(outDir, 'resources.json');

const files = readdirSync(resourcesDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

const REQUIRED = ['title', 'type', 'access', 'url', 'category', 'description'];

const all = files.map((file) => {
  const raw = readFileSync(path.join(resourcesDir, file), 'utf8');
  const data = parse(raw) ?? {};
  for (const key of REQUIRED) {
    if (!(key in data)) {
      throw new Error(`${file}: missing required field "${key}"`);
    }
  }
  const slug = file.replace(/\.ya?ml$/, '');
  return {
    slug,
    title: data.title,
    type: data.type,
    access: data.access,
    url: data.url,
    category: data.category,
    description: data.description,
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    status: data.status ?? 'active',
  };
});

const active = all.filter((r) => r.status === 'active');

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(active, null, 2) + '\n');

console.log(`[build-data] wrote ${active.length} active resources (of ${all.length} total) to ${path.relative(root, outFile)}`);

// The sitemap includes only indexable canonical routes. Search/report views
// and the /contacts alias remain accessible, but aren't discovery targets.
const SITE_URL = 'https://ashesiresourcehub.netlify.app';
function slugifyCategory(name) {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const categorySlugs = [...new Set(active.map((r) => r.category))].map(slugifyCategory);
const allUrls = ['/', '/emergency', ...categorySlugs.map((slug) => `/category/${slug}`), ...active.map((r) => `/resource/${r.slug}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + allUrls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n') + `\n</urlset>\n`;
writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemap);
writeFileSync(path.join(root, 'public', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`[build-data] wrote sitemap.xml with ${allUrls.length} canonical URLs and robots.txt`);
