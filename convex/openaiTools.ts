// OpenAI function-calling tool definitions + system prompt for the Telegram
// content-editing bot. Kept separate from convex/telegramBot.ts so the tool
// schemas are easy to review on their own.

export const SYSTEM_PROMPT = `You are the content-editing assistant for the Ashesi Resource Hub, reachable only by its one authorized maintainer over Telegram.

You manage resource entries stored as YAML files in this repository's src/content/resources/ directory, and you can look up and resolve student flag reports.

Rules:
- Never delete a resource file. To retire one, call archive_resource, which sets status: archived.
- Never write raw file content. Always call create_or_update_resource with typed fields (title, type, access, url, category, description, aliases, status) — you never construct or emit YAML/file-content strings yourself.
- Before creating a new resource, use list_resources or get_resource to check whether something similar already exists, to avoid duplicates.
- category is a free-form label (e.g. "Academic & Administration", "Career", "Housing", "Offices & People", "Emergency"); match the existing category names you see via list_resources/get_resource unless the maintainer clearly wants a new one.
- access should read naturally, e.g. "Public", "Ashesi login required", "Ashesi students", "External service", "Ashesi community".
- When resolving a flag, prefer resolve_flag with the report's id; fall back to the resource slug only if the maintainer didn't reference a specific report.
- After every action, confirm plainly in your reply what you did (or that it failed and why) — the maintainer only sees your Telegram reply, not tool internals.
- You have no memory of earlier conversations; treat each incoming message as complete context on its own, using only what's in the current message and the tool results from this turn.`;

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_resources',
      description: 'List the slugs of every resource YAML file currently in the repository.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_resource',
      description: 'Read one resource file by its slug and return its current fields.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The resource file slug, e.g. "writing-center-booking".' },
        },
        required: ['slug'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_or_update_resource',
      description:
        'Create a new resource, or overwrite an existing one at the given slug, with a real git commit message. Always pass every field even when updating (read the current value first with get_resource for any field you are not changing).',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'URL-safe slug; the filename without .yaml.' },
          title: { type: 'string' },
          type: { type: 'string', description: 'e.g. Portal, Form, Booking, Reference, Contact.' },
          access: { type: 'string', description: 'e.g. Public, Ashesi login required, Ashesi students, External service.' },
          url: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          aliases: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'archived', 'broken', 'needs_review'] },
          commit_message: { type: 'string', description: 'A real, descriptive git commit message.' },
        },
        required: ['slug', 'title', 'type', 'access', 'url', 'category', 'description', 'commit_message'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'archive_resource',
      description: 'Set an existing resource\'s status to "archived" (never deletes the file).',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          commit_message: { type: 'string' },
        },
        required: ['slug', 'commit_message'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_open_flags',
      description: 'List every currently-open student flag report.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resolve_flag',
      description: 'Mark a flag report resolved, by its report id, or by resource slug to resolve all open reports on that resource.',
      parameters: {
        type: 'object',
        properties: {
          report_id: { type: 'string' },
          resource_slug: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
] as const;
