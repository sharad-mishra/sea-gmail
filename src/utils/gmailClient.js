import { google } from 'googleapis';
import { getOAuthClient } from '../auth/oauth.js';

export async function getGmailClient() {
  const oauth2Client = await getOAuthClient();
  return google.gmail({ version: 'v1', auth: oauth2Client });
}