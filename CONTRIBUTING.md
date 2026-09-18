# Contributing to Kaps Community

This repository is **not currently accepting outside contributions**. Issues are welcome if you’ve hit a bug, but pull requests won’t be reviewed or merged at this time.

It contains the **`@kaps_ai/mcp-server`** Node/TypeScript package in [`mcp-server/`](./mcp-server/) and the [Kaps Community](https://webtonicai.github.io/Kaps-Community/) docs site under [`docs/`](./docs/).

## Publishing `@kaps_ai/mcp-server` (maintainers only)

Only from **this** repo’s `mcp-server/`, using the **`kaps_ai`** npm account (run `npm whoami` and expect `kaps_ai`). Do not publish from forked or application repos.

```bash
cd mcp-server
npm install
npm run build
npm publish --access public
```

Add `--otp=<code>` if 2FA is required.
