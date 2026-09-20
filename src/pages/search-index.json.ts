import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Build-time-only endpoint: reads the content collection during `astro build`
// and serializes it once, so this can be served as a static JSON file with
// no server runtime involved (see astro.config.mjs's output: 'static' note).
export const prerender = true;

export const GET: APIRoute = async () => {
  const all = await getCollection('resources');
  const active = all
    .filter((r) => r.data.status === 'active')
    .map((r) => ({
      slug: r.id,
      title: r.data.title,
      description: r.data.description,
      category: r.data.category,
      aliases: r.data.aliases,
      url: r.data.url,
    }));

  return new Response(JSON.stringify(active), {
    headers: { 'Content-Type': 'application/json' },
  });
};
