---
layout: default
title: Kaps MCP Server
---

{% include nav.html %}

# Kaps MCP Server

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) lets assistants and IDE agents call tools over a standard protocol. The **`@kaps_ai/mcp-server`** package implements an MCP server over **stdio** that wraps the public Kaps [Render API](./render-api.html): create renders, poll status, and list caption presets.

The **canonical npm package** is published only from the **[Kaps-Community](https://github.com/webtonicAI/Kaps-Community)** repo (`mcp-server/`). Use **`npx`** or **`npm install`** against that published name; optional copies of `mcp-server/` elsewhere are for **local dev only**. Publishing steps and org scope notes: **[MCP server setup](./mcp-setup.html)** (canonical package).

## Prerequisites

1. A **Kaps** account ([kaps.ai](https://kaps.ai)) with credits for rendering.
2. An **API key** from **Settings → API keys** (plaintext `ksk_live_…` is shown only once).
3. **`KAPS_API_URL`** — the Kaps API base URL: `https://api.kaps.ai/functions/v1`.

Node.js **18+** is required to run the server.

## Tools

| Tool | Description |
| ---- | ----------- |
| `render_captioned_video` | Start a captioned render. Pass either `video_url` (public HTTPS) or `asset_id` (uploaded asset). Returns `request_id` unless `wait: true` (blocks up to ~4 minutes). |
| `get_render_status` | Poll `queued` / `transcribing` / `rendering` / `complete` / `failed` for a request. |
| `list_presets` | List presets your key may use (your presets plus applicable public presets). |

Request and response fields match the HTTP API; see **[Render API](./render-api.html)** for full semantics, webhooks, and errors.

## Environment variables

| Name | Required | Description |
| ---- | :------: | ----------- |
| `KAPS_API_KEY` | yes | `ksk_live_…` API key. |
| `KAPS_API_URL` | yes | Kaps API base URL (no trailing slash required), e.g. `https://api.kaps.ai/functions/v1`. |

The process exits at startup if either is missing.

## Configure MCP clients

### Cursor

Edit **`%USERPROFILE%\.cursor\mcp.json`** on Windows or **`~/.cursor/mcp.json`** on macOS/Linux (recommended so MCP is not tied to one project). A project-local `.cursor/mcp.json` works too.

Use the **`args`** package string that matches [Kaps-Community `mcp-server/package.json`](https://github.com/webtonicAI/Kaps-Community/blob/main/mcp-server/package.json) (currently **`@kaps_ai/mcp-server`** — scope **`kaps_ai`** is your npm username’s scope; that is different from an org named **`@kaps`**). Set **`KAPS_API_URL`** to **`https://api.kaps.ai/functions/v1`**.

```json
{
  "mcpServers": {
    "kaps": {
      "command": "npx",
      "args": ["-y", "@kaps_ai/mcp-server"],
      "env": {
        "KAPS_API_KEY": "ksk_live_...",
        "KAPS_API_URL": "https://api.kaps.ai/functions/v1"
      }
    }
  }
}
```

### Claude Desktop

Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kaps": {
      "command": "npx",
      "args": ["-y", "@kaps_ai/mcp-server"],
      "env": {
        "KAPS_API_KEY": "ksk_live_...",
        "KAPS_API_URL": "https://api.kaps.ai/functions/v1"
      }
    }
  }
}
```

Restart the desktop app after saving.

### Local development (no `npx`)

After `npm install` and `npm run build` in the repo’s `mcp-server/` folder, point **`command`** at `node` and **`args`** at the **absolute** path to `dist/index.js`, with the same `env` block:

```json
{
  "mcpServers": {
    "kaps": {
      "command": "node",
      "args": ["C:/path/to/kaps-community/mcp-server/dist/index.js"],
      "env": {
        "KAPS_API_KEY": "ksk_live_...",
        "KAPS_API_URL": "https://api.kaps.ai/functions/v1"
      }
    }
  }
}
```

Restart Cursor (or reload MCP) after saving.

### Troubleshooting install

| Symptom | What to check |
| ------- | --------------- |
| **`npx` / `npm view` 404** | Package not published under that name, or wrong package string in `args`. Publish from **Kaps-Community** `mcp-server/` only; confirm name in [`package.json`](https://github.com/webtonicAI/Kaps-Community/blob/main/mcp-server/package.json). |
| **`Node` / `npx` not found** in Cursor (Windows) | Use full paths: `"command": "C:\\Program Files\\nodejs\\node.exe"` (or your install location) and `"args": ["…\\npx.cmd", "-y", "@kaps_ai/mcp-server"]`. Usually leaving `"command": "npx"` is enough if Node is on `PATH`. |
| **`npm publish` 404** on `PUT /@kaps/...` | You tried to publish under the **`@kaps`** **organization** scope. This repo uses **`@kaps_ai/mcp-server`** (user scope **`kaps_ai`**, same as npm user **`kaps_ai`**). |
| **`npm publish` 403** | npm **2FA** / invalid token: **`npm publish --otp=<code>`**; or wrong npm login — use account **`kaps_ai`** for official publishes. |

## Security

- Do not commit API keys; use your client’s `env` configuration only.
- Revoked keys fail immediately on the server.

## Further reading

- **[Render API](./render-api.html)** — REST endpoints, auth, webhooks, errors, examples.
- Package source and publishing notes: [`mcp-server/README.md`](https://github.com/webtonicAI/Kaps-Community/tree/main/mcp-server) in this repository.
