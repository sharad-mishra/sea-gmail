import { google } from 'googleapis';
import { getOAuthClient } from '../auth/oauth.js';
import { logger } from '../utils/logger.js';

export async function labelAndArchive(params) {
  const { email_id, label, archive = false } = params;
  logger.info(`Labeling email ${email_id} as ${label}, archive: ${archive}`);

  const oauth2Client = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    let labelId;
    const labels = await gmail.users.labels.list({ userId: 'me' });
    const existingLabel = labels.data.labels?.find((l) => l.name === label);
    if (existingLabel) {
      labelId = existingLabel.id;
    } else {
      const newLabel = await gmail.users.labels.create({
        userId: 'me',
        requestBody: { name: label, labelListVisibility: 'labelShow' },
      });
      labelId = newLabel.data.id;
    }

    await gmail.users.messages.modify({
      userId: 'me',
      id: email_id,
      requestBody: {
        addLabelIds: [labelId],
        removeLabelIds: archive ? ['INBOX'] : [],
      },
    });

    return { success: true };
  } catch (err) {
    logger.error(`Label error: ${err.message}`);
    return { success: false };
  }
}