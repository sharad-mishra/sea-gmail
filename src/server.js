import http from 'http';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from './utils/logger.js'; // Replace with console.log if logger.js doesn't exist
import fs from 'fs/promises';
import path from 'path';

// Paths to credentials
const CREDENTIALS_PATH = path.join(process.env.USERPROFILE, '.gmail-mcp', 'gcp-oauth.keys.json');
const TOKEN_PATH = path.join(process.env.USERPROFILE, '.gmail-mcp', 'credentials.json');

// Initialize Gmail client
const initializeGmailClient = async () => {
  try {
    const credentialsRaw = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    logger.info(`Credentials file contents: ${credentialsRaw}`);
    const credentials = JSON.parse(credentialsRaw);

    let clientData;
    if (credentials.installed) {
      clientData = credentials.installed;
    } else if (credentials.web) {
      clientData = credentials.web;
    } else {
      throw new Error('Credentials file does not contain "installed" or "web" key');
    }

    const { client_secret, client_id, redirect_uris } = clientData;
    if (!client_secret || !client_id || !redirect_uris) {
      throw new Error('Missing required fields (client_secret, client_id, or redirect_uris) in credentials');
    }

    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    const tokenRaw = await fs.readFile(TOKEN_PATH, 'utf8');
    logger.info(`Token file contents: ${tokenRaw}`);
    const token = JSON.parse(tokenRaw);
    oAuth2Client.setCredentials(token);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return { gmail, oAuth2Client };
  } catch (err) {
    logger.error(`Failed to initialize Gmail client: ${err.message}`);
    throw err;
  }
};

// Define tools
const tools = {
  categorizeEmail: async (params) => {
    const { subject, body } = params;
    if (subject.includes('Invoice') || body.includes('pay')) {
      return 'invoice';
    }
    return 'other';
  },
  summarizeThread: async (params, gmail) => {
    const { threadId } = params;
    const thread = await gmail.users.threads.get({ userId: 'me', id: threadId });
    const messages = thread.data.messages.map(msg => msg.snippet).join(' ');
    return messages.substring(0, 100);
  },
  sendAutoReply: async (params, gmail) => {
    const { emailId, replyText } = params;
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(`To: recipient@example.com\nSubject: Re: Auto-reply\n\n${replyText}`).toString('base64'),
      },
    });
    return 'Auto-reply sent';
  },
  summarizeFeedback: async (params) => {
    const { feedback } = params;
    return feedback.substring(0, 50);
  },
  labelAndArchive: async (params, gmail) => {
    const { emailId, label } = params;
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: { addLabelIds: [label], removeLabelIds: ['INBOX'] },
    });
    return 'Email labeled and archived';
  },
  prioritizeEmails: async (params, gmail) => {
    const messages = await gmail.users.messages.list({ userId: 'me', q: 'in:inbox' });
    return messages.data.messages.map(msg => msg.id);
  },
};

// Initialize server
const startServer = async () => {
  const { gmail } = await initializeGmailClient();

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/mcp') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const message = JSON.parse(body);
          if (message.method === 'initialize') {
            logger.info('Received initialize request');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              result: {
                capabilities: {},
                serverInfo: {
                  name: 'sea-gmail',
                  version: '0.1.0'
                }
              }
            }));
          } else if (message.method in tools) {
            logger.info(`Received request for method: ${message.method}`);
            const result = await tools[message.method](message.params || {}, gmail);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              result
            }));
          } else {
            logger.warn(`Method not found: ${message.method}`);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Method not found' } }));
          }
        } catch (err) {
          logger.error(`Error: ${err.message}`);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: `Parse error: ${err.message}` } }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  server.listen(3000, () => {
    logger.info('MCP server running on port 3000');
    Object.keys(tools).forEach(tool => logger.info(`Registered tool: ${tool}`));
  });
};

// Start the server
startServer().catch(err => {
  logger.error(`Server failed to start: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled promise rejection: ${err.message}`);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});