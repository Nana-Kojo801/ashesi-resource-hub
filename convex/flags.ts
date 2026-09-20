import { v } from 'convex/values';
import { mutation, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';

// Anonymous, no-login flag submission from FlagButton.svelte. Inserts the
// report as "open", then schedules an internal action that notifies the
// bot owner over Telegram — the mutation itself never calls fetch, since
// Convex mutations must stay deterministic and side-effect free apart from
// database writes.
export const create = mutation({
  args: {
    resourceSlug: v.string(),
    reason: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('reports', {
      resourceSlug: args.resourceSlug,
      reason: args.reason,
      note: args.note,
      status: 'open',
    });
    await ctx.scheduler.runAfter(0, internal.flagsNode.notifyTelegram, {
      reportId: id,
      resourceSlug: args.resourceSlug,
      reason: args.reason,
      note: args.note,
    });
    return null;
  },
});

// Used by the Telegram bot (convex/telegramBot.ts) to list unresolved
// reports when the owner asks "what's flagged?" or similar.
export const listOpen = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('reports')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .collect();
  },
});

// Used by the Telegram bot to mark a report resolved once the underlying
// resource has been fixed or archived. Accepts either the report's own id
// or (when the bot only has the slug) the most recent open report for that
// slug.
export const resolve = internalMutation({
  args: {
    reportId: v.optional(v.id('reports')),
    resourceSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.reportId) {
      await ctx.db.patch(args.reportId, { status: 'resolved' });
      return { resolved: 1 };
    }
    if (args.resourceSlug) {
      const open = await ctx.db
        .query('reports')
        .withIndex('by_resourceSlug', (q) => q.eq('resourceSlug', args.resourceSlug!))
        .filter((q) => q.eq(q.field('status'), 'open'))
        .collect();
      for (const r of open) {
        await ctx.db.patch(r._id, { status: 'resolved' });
      }
      return { resolved: open.length };
    }
    return { resolved: 0 };
  },
});
