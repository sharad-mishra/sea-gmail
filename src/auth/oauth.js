import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { createServer } from 'http';
import { logger } from '../utils/logger.js';

const SCOPES = ['https://mail.google.com/'];
const CONFIG_DIR = join(homedir(), '.gmail-mcp');
const CREDENTIALS_PATH = join(CONFIG_DIR, 'gcp-oauth.keys.json');
const TOKEN_PATH = join(CONFIG_DIR, 'credentials.json');
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

export async function getOAuthClient() {
  try {
    logger.info(`Reading credentials from ${CREDENTIALS_PATH}`);
    const credentialsContent = await readFile(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    const { client_secret, client_id } = credentials.installed || credentials.web;
    if (!client_id || !client_secret) {
      throw new Error('Invalid credentials: missing client_id or client_secret');
    }
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

    let token;
    try {
      logger.info(`Reading token from ${TOKEN_PATH}`);
      token = JSON.parse(await readFile(TOKEN_PATH, 'utf8'));
    } catch {
      logger.info('No token found, initiating authentication');
      token = await authenticate(oAuth2Client);
      await writeFile(TOKEN_PATH, JSON.stringify(token));
      logger.info(`Token saved to ${TOKEN_PATH}`);
    }

    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (err) {
    logger.error(`OAuth error: ${err.message}`);
    throw err;
  }
}

async function authenticate(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    logger.info(`Authorize this app by visiting: ${authUrl}`);

    const server = createServer(async (req, res) => {
      if (req.url.startsWith('/auth/callback')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const code = url.searchParams.get('code');
        if (code) {
          try {
            const { tokens } = await oAuth2Client.getToken(code);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Authentication successful! You can close this window.');
            server.close();
            resolve(tokens);
          } catch (err) {
            logger.error(`Token exchange error: ${err.message}`);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Authentication failed.');
            reject(err);
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('No code provided.');
          reject(new Error('No code provided'));
        }
      }
    });

    server.on('error', (err) => {
      logger.error(`Server error: ${err.message}`);
      reject(err);
    });

    server.listen(3000, () => {
      logger.info('OAuth callback server running on http://localhost:3000');
    });
  });
}

// Run authentication
getOAuthClient().catch((err) => {
  logger.error(`Authentication failed: ${err.message}`);
  process.exit(1);
});