# Smart Email Assistant (SEA) - MCP

## Setup

### 1. Verify Google Cloud Project

- Ensure **Gmail API** is enabled in the [Google Cloud Console](https://console.cloud.google.com/).
- Create an **OAuth 2.0 Client ID** with redirect URI:  
    `http://localhost:3000/auth/callback`
- Place your `gcp-oauth.keys.json` file in `~/.gmail-mcp/`.

### 2. Install Dependencies

```sh
npm install -g pnpm
pnpm install
```

### 3. Authenticate

```sh
pnpm run auth
```

### 4. Run Server

```sh
pnpm start
```

### 5. Debug

```sh
npx @modelcontextprotocol/inspector pnpm start
```

### 6. Configure Claude Desktop

Add the following to `~/.claude/claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "sea-gmail": {
            "command": "npx",
            "args": ["@sea/server-gmail-mcp"],
            "enabled": true
        }
    }
}
```

---

## Features

- Categorize emails (lead, invoice, feedback, spam, other)
- Summarize email threads
- Send auto-replies
- Summarize weekly feedback
- Label and archive emails
- Prioritize emails by urgency

---

## Docker

```sh
docker build -t sea/gmail-mcp .
docker run -p 3000:3000 -v ~/.gmail-mcp:/gmail-mcp sea/gmail-mcp
```

---

## Contributing

Submit pull requests or open issues on GitHub.

---

## License

MIT
