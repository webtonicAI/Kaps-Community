# Contributing to Kaps Community

Thank you for helping improve Kaps’s public community materials. This repository is not limited to Markdown-only changes: it includes the **`@kaps_ai/mcp-server`** Node/TypeScript package in [`mcp-server/`](./mcp-server/). Documentation edits and MCP server changes are equally welcome; for the latter, run `npm install` and `npm run build` inside `mcp-server/` before opening a pull request.

For doc fixes, follow the existing tone and link patterns under `docs/`. For code changes in `mcp-server/`, keep the scope limited to the public render API surface (no private app internals or secrets).

**Publishing `@kaps_ai/mcp-server`:** Only from **this** repo’s `mcp-server/` (`npm publish`; use `npm publish --otp=…` if your npm account requires 2FA for publishes). Use the **`kaps_ai`** npm account for official releases — run `npm whoami` and expect `kaps_ai`. Do not publish from forked or application repos—those paths are for optional local development only. See also [`docs/mcp-setup.md`](./docs/mcp-setup.md).
