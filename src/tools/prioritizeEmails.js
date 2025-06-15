import { google } from 'googleapis';
import { getOAuthClient } from '../auth/oauth.js';
import { logger } from '../utils/logger.js';

export async function prioritizeEmails(params) {
  const { query, max_results = 10 } = params;
  logger.info(`Prioritizing emails for query: ${query}`);

  const oauth2Client = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const messages = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: max_results });
  const emails = await Promise.all(
    messages.data.messages?.map(async (msg) => {
      const email = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const subject = email.data.payload?.headers?.find((h) => h.name === 'Subject')?.value || '';
      const body = email.data.payload?.parts?.[0]?.body?.data || '';
      const decodedBody = Buffer.from(body, 'base64').toString();

      const priority = decodedBody.toLowerCase().includes('asap') ? 10 : 5;
      return { id: msg.id, subject, body: decodedBody.slice(0, 100), priority };
    }) || []
  );

  return emails.sort((a, b) => b.priority - a.priority);
}