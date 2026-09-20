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
