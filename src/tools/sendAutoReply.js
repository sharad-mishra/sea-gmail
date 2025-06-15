import { google } from 'googleapis';
import { getOAuthClient } from '../auth/oauth.js';
import { getTemplate } from '../utils/templates.js';
import { logger } from '../utils/logger.js';

export async function sendAutoReply(params) {
  const { email_type, recipient_email, threadId } = params;
  logger.info(`Sending auto-reply to ${recipient_email} for ${email_type}`);

  const oauth2Client = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const template = getTemplate(email_type);
  const raw = Buffer.from(
    `To: ${recipient_email}\nSubject: ${template.subject}\n\n${template.body}`
  ).toString('base64');

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId },
    });
    return { success: true, response: response.data.id || 'Sent' };
  } catch (err) {
    logger.error(`Send error: ${err.message}`);
    return { success: false, response: err.message };
  }
}