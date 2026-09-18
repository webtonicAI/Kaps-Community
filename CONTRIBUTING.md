# Contributing

This repository publishes **`@kaps_ai/mcp-server`**. It is not accepting outside pull requests. Issues are welcome.

Product docs are in the Kaps app: [kaps.ai](https://kaps.ai/info?doc=mcp).

## Publishing (maintainers)

From `mcp-server/`, as the `kaps_ai` npm account (`npm whoami`):

```bash
cd mcp-server
npm install
npm run build
npm publish --access public
```

Add `--otp=<code>` if 2FA is required.
