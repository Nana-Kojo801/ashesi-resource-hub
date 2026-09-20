// Shared helper for sending a message to the Telegram chat that owns this
// bot (TELEGRAM_ALLOWED_USER_ID), used both by the flag-report notifier and
// by the content-editing bot's replies.
export async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('sendTelegramMessage: TELEGRAM_BOT_TOKEN is not set');
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('sendTelegramMessage failed', res.status, body);
  }
}
