---
layout: default
title: MCP server setup (canonical package)
---

{% include nav.html %}

# MCP server setup

## Canonical npm package and publishing

The **`@kaps_ai/mcp-server`** package on npm is built and published **only** from the public **[Kaps-Community](https://github.com/webtonicAI/Kaps-Community)** repository, under [`mcp-server/`](https://github.com/webtonicAI/Kaps-Community/tree/main/mcp-server). It uses the **npm user scope** **`@kaps_ai`**, which matches the maintainer account **`kaps_ai`** (not the separate **`@kaps`** organization).

Other repositories may contain an optional **`mcp-server/`** copy for **local development only**. Cursor and Claude configs should use the **`name`** in [`package.json`](https://github.com/webtonicAI/Kaps-Community/blob/main/mcp-server/package.json): **`@kaps_ai/mcp-server`**.

Maintainers publish from a clone of **Kaps-Community** only. Run `npm whoami` and expect **`kaps_ai`** before publishing.

```bash
cd mcp-server
npm install
npm run build
npm whoami
npm publish
```

If npm returns **403**, use **`npm publish --otp=<code>`** if 2FA is required, or fix token permissions.

After a successful publish:

```bash
npm view @kaps_ai/mcp-server version
```

You should see a version number, not **404**.

---

**Full user guide** (tools, env vars, Cursor, Claude, troubleshooting): **[MCP server](./mcp.html)**
