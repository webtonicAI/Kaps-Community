# `@kaps_ai/mcp-server`

**npm package:** **`@kaps_ai/mcp-server`** — published under the **[user scope](https://docs.npmjs.com/about-scopes#scope-as-a-user-name) `kaps_ai`**, which matches the npm account **`kaps_ai`**. You do not need the separate **`@kaps`** org (a different scope); the earlier **404** on `PUT /@kaps/...` was from trying to publish to an org you do not control.

The CLI binary (after install) is still **`kaps-mcp`**.

`publishConfig.access` is **`public`** so the scoped package is installable by everyone.

Model Context Protocol (MCP) server for the Kaps public captioned video render API. It exposes credits, estimate, create, status, and list-presets operations as MCP tools over **stdio** so clients such as Claude Desktop, Cursor, and MCP Inspector can drive renders from agent workflows.

## Tools

| Tool | Description |
| ---- | ----------- |
| `get_credits` | Credit balance for the API key owner. |
| `estimate_render` | Preflight credit cost without creating a render. |
| `render_captioned_video` | Start a render with a caption preset; pass either a public `video_url` or `asset_id`. Use `wait: true` to block until completion (up to ~4 minutes). |
| `get_render_status` | Poll status for a `request_id` returned from create. |
| `list_presets` | List caption presets available to your API key. |

Full HTTP field semantics match the [Render API](../docs/render-api.md). User-facing setup (what MCP is, prerequisites, examples) is in [docs/mcp.md](../docs/mcp.md).

## Requirements

- Node.js 18+
- A Kaps account, API key (`ksk_live_…`), and API base URL (`KAPS_API_URL`)

## Environment variables

| Variable | Required | Description |
| -------- | :------: | ----------- |
| `KAPS_API_KEY` | yes | API key from **Settings → API keys** in Kaps. |
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

This package is released under the [MIT License](./LICENSE) in this directory. The community repository does not yet define a single root `LICENSE` file; licensing for other folders may differ.
