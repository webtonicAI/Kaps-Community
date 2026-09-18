---
layout: default
title: Kaps MCP Server
---

{% include nav.html %}

# Kaps MCP Server

The **`@kaps_ai/mcp-server`** package wraps the [Render API](./render-api.html) as [MCP](https://modelcontextprotocol.io) tools, so Claude Desktop, Cursor, and other MCP clients can render captioned videos in one tool call.

Full concept overview and usage patterns: **[kaps.ai → Info → MCP Setup](https://kaps.ai/info?doc=mcp)**. This page has the exact install details — the canonical package is published only from this repo’s [`mcp-server/`](https://github.com/webtonicAI/Kaps-Community/tree/main/mcp-server), scope **`@kaps_ai`** (not `@kaps`).

## Prerequisites

- A Kaps account with render credits, and an API key from Studio → **API** (`ksk_live_…`, shown once)
- **`KAPS_API_URL`**: `https://api.kaps.ai/functions/v1`
- Node.js 18+

## Tools

| Tool | Description |
| ---- | ----------- |
| `get_credits` | Credit balance for the key owner |
| `estimate_render` | Preflight credit cost |
| `render_captioned_video` | Start a render (`video_url` or `asset_id`) |
| `get_render_status` | Poll render status |
| `list_recipes` | List usable caption recipes |

## Configure

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

- **Cursor:** `~/.cursor/mcp.json` (or project-local `.cursor/mcp.json`)
- **Claude Desktop:** `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`)

Restart the client after saving.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `npx` 404 | Wrong package string — confirm `@kaps_ai/mcp-server` in [`package.json`](https://github.com/webtonicAI/Kaps-Community/blob/main/mcp-server/package.json) |
| `npm publish` 404 on `@kaps/...` | Wrong scope — this repo publishes under `@kaps_ai`, not the `@kaps` org |

## Further reading

- **[Render API](./render-api.html)** — full endpoint reference (hosted on kaps.ai)
- Local dev / source: [`mcp-server/README.md`](https://github.com/webtonicAI/Kaps-Community/tree/main/mcp-server)
