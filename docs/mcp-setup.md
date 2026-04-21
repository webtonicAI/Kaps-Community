---
layout: default
title: Kaps MCP Server Setup
---

{% include nav.html %}

# Kaps MCP Server Setup

The [Kaps MCP server](https://www.npmjs.com/package/@kaps/mcp-server) (`@kaps/mcp-server`) wraps the public [Render API](api-reference.html)
as [Model Context Protocol](https://modelcontextprotocol.io) tools so that
agents (Claude Desktop, Cursor's agent mode, MCP Inspector, custom clients)
can caption-render videos in a single tool call.

---

## Tools exposed

| Tool                      | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `render_captioned_video`  | Starts a render. Accepts a public `video_url` or `asset_id`.   |
| `get_render_status`       | Polls the current state / returns the final output URL.        |
| `list_presets`            | Lists caption presets the API key is allowed to render with.   |

Each tool mirrors the same-named REST operation 1:1 — see the
[API reference](api-reference.html) for the full field list.

### `render_captioned_video` — `resolution` and `fps`

These behave the same as in the REST API:

- **`resolution`** — Omit to keep the **source video’s** resolution. Set `720p`, `1080p`, `4k`, or `native` when you want to scale or lock dimensions (`native` preserves the original size).
- **`fps`** — Only `30` or `60` when set. Omit to match the **source video’s** frame rate.

---

## Prerequisites

1. A Kaps account with enough credits to cover your renders.
2. An API key from **Settings → API keys** (copy the plaintext `ksk_live_…`
   key — it is shown only once).
3. Your **Kaps API base URL** for Edge Functions (from the app / dashboard), e.g.
   `https://<project-ref>.supabase.co/functions/v1`.

Node 18+ is required to run the server.

---

## Install

### One-shot via `npx` (recommended)

Most MCP clients can launch the server on demand:

```bash
npx -y @kaps/mcp-server
```

### Global install

```bash
npm install -g @kaps/mcp-server
kaps-mcp   # runs on stdio; intended to be invoked by an MCP client
```

### From source

From a checkout of the `mcp-server` package source:

```bash
cd mcp-server
npm install
npm run build
KAPS_API_KEY=ksk_live_... \
KAPS_API_URL=https://<ref>.supabase.co/functions/v1 \
  node dist/index.js
```

---

## Configure your MCP client

### Claude Desktop

Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kaps": {
      "command": "npx",
      "args": ["-y", "@kaps/mcp-server"],
      "env": {
        "KAPS_API_KEY": "ksk_live_...",
        "KAPS_API_URL": "https://<project-ref>.supabase.co/functions/v1"
      }
    }
  }
}
```

Restart Claude Desktop. The three tools appear under the hammer icon.

### Cursor

Edit `~/.cursor/mcp.json` (or project-local `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kaps": {
      "command": "npx",
      "args": ["-y", "@kaps/mcp-server"],
      "env": {
        "KAPS_API_KEY": "ksk_live_...",
        "KAPS_API_URL": "https://<project-ref>.supabase.co/functions/v1"
      }
    }
  }
}
```

### MCP Inspector (for debugging)

```bash
npx @modelcontextprotocol/inspector \
  --command "npx" --args "-y,@kaps/mcp-server" \
  --env KAPS_API_KEY=ksk_live_... \
  --env KAPS_API_URL=https://<ref>.supabase.co/functions/v1
```

---

## Environment variables

| Name           | Required | Description                                                  |
| -------------- | :------: | ------------------------------------------------------------ |
| `KAPS_API_KEY` |   yes    | `ksk_live_…` API key.                                        |
| `KAPS_API_URL` |   yes    | Base URL of the Edge Functions.                              |

The server exits at startup if either is missing.

---

## Usage pattern

A typical agent flow looks like:

```
> User: "Caption this lecture using the 'Lecture Notes' preset:
>        https://cdn.example.com/lec42.mp4"

1. Tool call  → list_presets()
2. Tool call  → render_captioned_video({
                  preset_id: "<matched uuid>",
                  video_url: "https://cdn.example.com/lec42.mp4",
                  wait: true
                })
3. Response   → { status: "complete", output_url: "https://.../final.mp4", ... }
```

Omit **`resolution`** and **`fps`** when the output should follow the **source video** (same rules as the REST API). To override, pass e.g. `resolution: "1080p"` and `fps: 30` — **`fps`** must be **`30`** or **`60`**.

When `wait: true` the call blocks for up to ~4 minutes. For longer videos
omit `wait` and poll with `get_render_status` instead — or pass a `webhook_url`
and let your own server handle the completion.

---

## Security

- Never check API keys into source control. Use your client's env-var config.
- Revoked keys stop working immediately (the server hashes the key on every
  call and rejects if `revoked_at` is set).
- Keys are scoped to `render:write` and cannot read billing info or other
  users' assets.

---

## Troubleshooting

| Symptom                                        | Fix                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Server exits immediately with env-var error    | Set `KAPS_API_KEY` and `KAPS_API_URL` in the client `env` block. |
| `401 invalid_api_key`                          | The key was revoked, mistyped, or belongs to another project.    |
| `402 insufficient_credits`                     | Top up credits in the dashboard.                                 |
| `404 Preset not found`                         | Call `list_presets` — the preset may be private to another user. |
| `transcription` fields seem ignored            | Confirm your preset isn't overriding them via captions config.   |
| `wait=true` returns `status=processing`        | Your render is still running; poll `get_render_status`.          |
