import http from 'http';
import { logger } from './utils/logger.js';
import { categorizeEmail } from './tools/categorizeEmail.js';
import { summarizeThread } from './tools/summarizeThread.js';
import { sendAutoReply } from './tools/sendAutoReply.js';
import { summarizeFeedback } from './tools/summarizeFeedback.js';
import { labelAndArchive } from './tools/labelAndArchive.js';
import { prioritizeEmails } from './tools/prioritizeEmails.js';

const tools = [
  categorizeEmail,
  summarizeThread,
  sendAutoReply,
  summarizeFeedback,
  labelAndArchive,
  prioritizeEmails
];

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/mcp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { toolName, parameters } = JSON.parse(body);
        const tool = tools.find(t => t.name === toolName);
        if (!tool) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Tool not found' }));
          return;
        }
        const result = await tool.handler(parameters);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        logger.error(`Tool execution error: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

tools.forEach(tool => {
  logger.info(`Registered tool: ${tool.name}`);
});

server.listen(3000, () => {
  logger.info('MCP server running on port 3000');
});

// Prevent process exit
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled promise rejection: ${err.message}`);
});