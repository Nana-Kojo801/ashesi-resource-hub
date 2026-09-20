import { defineCollection, z } from 'astro:content';

const resources = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    type: z.string(),
    access: z.string(),
    url: z.string().url(),
    category: z.string(),
    description: z.string(),
    aliases: z.array(z.string()).default([]),
    status: z.enum(['active', 'archived', 'broken', 'needs_review']).default('active'),
  }),
});

export const collections = { resources };
