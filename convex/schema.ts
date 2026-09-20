import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Convex is scoped ONLY to flag reports (and the Telegram bot's HTTP
// actions). Resource content itself lives in the Astro content collection
// (src/content/resources/*.yaml) and is never stored here.
export default defineSchema({
  reports: defineTable({
    resourceSlug: v.string(),
    reason: v.optional(v.string()),
    note: v.optional(v.string()),
    status: v.union(v.literal('open'), v.literal('resolved')),
  }).index('by_status', ['status'])
    .index('by_resourceSlug', ['resourceSlug']),
});
