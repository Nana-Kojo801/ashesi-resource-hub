import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { sendTelegramMessage } from './lib/telegram';

// Runs in Convex's default (V8) action runtime — fetch is available there,
// so this doesn't need "use node". Split out from flags.ts because
// mutations cannot perform side effects like network calls directly; this
// action is scheduled by flags.create.
export const notifyTelegram = internalAction({
  args: {
    reportId: v.id('reports'),
    resourceSlug: v.string(),
    reason: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const chatId = process.env.TELEGRAM_ALLOWED_USER_ID;
    if (!chatId) {
      console.error('notifyTelegram: TELEGRAM_ALLOWED_USER_ID is not set');
      return;
    }
    const lines = [
      '🚩 *New resource flag*',
      `Resource: \`${args.resourceSlug}\``,
      args.reason ? `Reason: ${args.reason}` : 'Reason: (none given)',
      args.note ? `Note: ${args.note}` : undefined,
      `Report id: \`${args.reportId}\``,
    ].filter(Boolean);
    await sendTelegramMessage(chatId, lines.join('\n'));
  },
});
