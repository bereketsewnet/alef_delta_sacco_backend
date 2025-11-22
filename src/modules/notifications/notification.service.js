import config from '../../core/config.js';
import httpError from '../../core/utils/httpError.js';

export async function forwardToBot(payload) {
  if (!config.bot.webhookUrl) {
    throw httpError(500, 'Bot webhook URL not configured');
  }
  const response = await fetch(config.bot.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-token': config.bot.token
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw httpError(response.status, `Bot webhook error: ${text}`);
  }
  return { success: true };
}

