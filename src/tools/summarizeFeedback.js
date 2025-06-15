import { google } from 'googleapis';
import { getOAuthClient } from '../auth/oauth.js';
import { logger } from '../utils/logger.js';

export async function summarizeFeedback(params) {
  const { start_date, end_date } = params;
  logger.info(`Summarizing feedback from ${start_date || 'start'} to ${end_date || 'now'}`);

  const oauth2Client = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  let query = 'label:feedback';
  if (start_date) query += ` after:${start_date}`;
  if (end_date) query += ` before:${end_date}`;

  const messages = await gmail.users.messages.list({ userId: 'me', q: query });
  const summaries = await Promise.all(
    messages.data.messages?.map(async (msg) => {
      const email = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const body = email.data.payload?.parts?.[0]?.body?.data || '';
      return Buffer.from(body, 'base64').toString().slice(0, 50);
    }) || []
  );

  return summaries.length
    ? `## Feedback Summary\n${summaries.map((s) => `- ${s}...`).join('\n')}`
    : 'No feedback found.';
}