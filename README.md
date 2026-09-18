# `@kaps_ai/mcp-server`

Open-source MCP server for the [Kaps](https://kaps.ai) render API. This repository publishes the npm package. Product docs, API keys, and recipes live in the app:

**[kaps.ai → Info → MCP Setup](https://kaps.ai/info?doc=mcp)**

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

Package source is in [`mcp-server/`](./mcp-server/). Report bugs in [Issues](https://github.com/webtonicAI/Kaps-Community/issues).
