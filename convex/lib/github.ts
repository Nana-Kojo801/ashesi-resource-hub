// Minimal GitHub Contents API client, scoped to this repo's
// src/content/resources/ directory. Used only by the Telegram content-
// editing bot (convex/telegramBot.ts). Uses a fine-grained PAT with
// Contents: read+write on this repo, read from GITHUB_TOKEN.

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'Nana-Kojo801';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'ashesi-resource-hub';
const BRANCH = process.env.GITHUB_REPO_BRANCH || 'main';
const RESOURCES_DIR = 'src/content/resources';

function authHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function apiUrl(path: string) {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
}

export type GithubFile = {
  path: string;
  sha: string;
  content: string; // decoded UTF-8 text
};

/** List every resource YAML filename (without the extension) currently in the repo. */
export async function listResourceSlugs(): Promise<string[]> {
  const res = await fetch(`${apiUrl(RESOURCES_DIR)}?ref=${BRANCH}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GitHub list failed: ${res.status} ${await res.text()}`);
  const items = (await res.json()) as Array<{ name: string; type: string }>;
  return items
    .filter((i) => i.type === 'file' && i.name.endsWith('.yaml'))
    .map((i) => i.name.replace(/\.yaml$/, ''));
}

/** Read one resource YAML file's raw text content and current sha (needed to update it). */
export async function readResourceFile(slug: string): Promise<GithubFile | null> {
  const path = `${RESOURCES_DIR}/${slug}.yaml`;
  const res = await fetch(`${apiUrl(path)}?ref=${BRANCH}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content: string; encoding: string; sha: string };
  const content = Buffer.from(data.content, data.encoding as BufferEncoding).toString('utf-8');
  return { path, sha: data.sha, content };
}

/**
 * Create or update one resource YAML file. The caller (openaiTools.ts /
 * telegramBot.ts) always supplies structured fields — never a raw file
 * content string from the model — and this function is the single place
 * that serializes them to YAML, so the bot cannot be tricked into writing
 * arbitrary file bytes.
 */
export async function writeResourceFile(
  slug: string,
  fields: {
    title: string;
    type: string;
    access: string;
    url: string;
    category: string;
    description: string;
    aliases?: string[];
    status?: 'active' | 'archived' | 'broken' | 'needs_review';
  },
  commitMessage: string
): Promise<void> {
  const existing = await readResourceFile(slug);
  const yamlStr = (s: string) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const aliases = fields.aliases || [];
  const aliasesYaml = aliases.length
    ? '\n' + aliases.map((a) => `  - ${yamlStr(a)}`).join('\n')
    : ' []';
  const body = [
    `title: ${yamlStr(fields.title)}`,
    `type: ${yamlStr(fields.type)}`,
    `access: ${yamlStr(fields.access)}`,
    `url: ${yamlStr(fields.url)}`,
    `category: ${yamlStr(fields.category)}`,
    `description: ${yamlStr(fields.description)}`,
    `aliases:${aliasesYaml}`,
    `status: ${fields.status || 'active'}`,
  ].join('\n') + '\n';

  const path = `${RESOURCES_DIR}/${slug}.yaml`;
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(body, 'utf-8').toString('base64'),
      branch: BRANCH,
      sha: existing?.sha,
    }),
  });
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
}

/** Set an existing resource's status to "archived" rather than deleting the file. */
export async function archiveResource(slug: string, commitMessage: string): Promise<void> {
  const existing = await readResourceFile(slug);
  if (!existing) throw new Error(`Resource "${slug}" not found`);
  const patched = existing.content.replace(/^status:\s*.*$/m, 'status: archived');
  const finalContent = /^status:/m.test(patched) ? patched : patched.trimEnd() + '\nstatus: archived\n';

  const path = `${RESOURCES_DIR}/${slug}.yaml`;
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(finalContent, 'utf-8').toString('base64'),
      branch: BRANCH,
      sha: existing.sha,
    }),
  });
  if (!res.ok) throw new Error(`GitHub archive failed: ${res.status} ${await res.text()}`);
}
