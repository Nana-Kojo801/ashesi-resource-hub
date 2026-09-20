import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/telegram/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Telegram signs webhook deliveries with this header when a secret_token
    // is set on registration (see README's setWebhook curl command). Reject
    // anything that doesn't match without leaking why.
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response(null, { status: 200 });
    }

    const update = await request.json().catch(() => null);
    const message = update?.message;
    const fromId = message?.from?.id;
    const chatId = message?.chat?.id;
    const text = message?.text;

    const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID;
    // Only the single authorized maintainer may drive the content-editing
    // bot. Any other sender is silently ignored (still 200, so Telegram
    // doesn't retry, and so we never confirm to a stranger that this bot
    // exists or is listening).
    if (!allowedUserId || String(fromId) !== String(allowedUserId)) {
      return new Response(null, { status: 200 });
    }

    if (typeof text === 'string' && text.trim().length > 0) {
      await ctx.scheduler.runAfter(0, internal.telegramBot.handleMessage, {
        chatId,
        text,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
