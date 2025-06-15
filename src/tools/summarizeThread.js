import { google } from 'googleapis';
import { getOAuthClient } from '../auth/oauth.js';
import { logger } from '../utils/logger.js';

export async function summarizeThread(params) {
  const { threadId } = params;
  logger.info(`Summarizing thread: ${threadId}`);

  const oauth2Client = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const thread = await gmail.users.threads.get({ userId: 'me', id: threadId });
  const messages = thread.data.messages?.map((msg) => {
    const payload = msg.payload;
    const body = payload?.parts?.[0]?.body?.data || payload?.body?.data || '';
    return Buffer.from(body, 'base64').toString();
  }) || [];

  return `Summary of thread ${threadId}: ${messages.join(' ').slice(0, 100)}...`;
}