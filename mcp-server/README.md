# `@kaps_ai/mcp-server`

MCP server for the [Kaps](https://kaps.ai) render API. Published as **`@kaps_ai/mcp-server`**. The CLI binary is **`kaps-mcp`**.

Docs and API keys: **[kaps.ai → Info → MCP Setup](https://kaps.ai/info?doc=mcp)**

## Tools

| Tool | Description |
| ---- | ----------- |
| `get_credits` | Credit balance for the API key owner. |
| `estimate_render` | Preflight credit cost without creating a render. |
| `render_captioned_video` | Start a render with a caption recipe; pass either a public `video_url` or `asset_id`. Use `wait: true` to block until completion (up to ~4 minutes). |
| `get_render_status` | Poll status for a `request_id` returned from create. |
| `list_recipes` | List caption recipes available to your API key. |

HTTP fields: **[kaps.ai → Info → API Reference](https://kaps.ai/info?doc=api)**.

## Requirements

- Node.js 18+
- A Kaps account, API key (`ksk_live_…`), and API base URL (`KAPS_API_URL`)

## Environment variables

| Variable | Required | Description |
| -------- | :------: | ----------- |
| `KAPS_API_KEY` | yes | API key from Studio → **API** in Kaps. |
| `KAPS_API_URL` | yes | Kaps API base URL, e.g. `https://api.kaps.ai/functions/v1`. |

## Install and build (from this repo)

```bash
cd mcp-server
npm install
npm run build
```

Run locally after build:

```bash
KAPS_API_KEY=ksk_live_... \
KAPS_API_URL=https://api.kaps.ai/functions/v1 \
  node dist/index.js
```

Or use the package binary name once installed: `kaps-mcp`.

## Published package usage (`npx`)

After the package is published to npm:

### Claude Desktop

`claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

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

### Cursor

`%USERPROFILE%\.cursor\mcp.json` (Windows) or `~/.cursor/mcp.json` (macOS/Linux), or project `.cursor/mcp.json`:

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

### Local development (absolute path)

If `npx` is not suitable, point the client at the built entrypoint:

```json
{
  "mcpServers": {
    "kaps": {
      "command": "node",
      "args": ["C:/absolute/path/to/kaps-community/mcp-server/dist/index.js"],
      "env": {
        "KAPS_API_KEY": "ksk_live_...",
        "KAPS_API_URL": "https://api.kaps.ai/functions/v1"
      }
    }
  }
}
```

## License

This package is released under the [MIT License](./LICENSE) in this directory.
