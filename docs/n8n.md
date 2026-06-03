---
layout: default
title: Kaps + n8n
---

{% include nav.html %}

# Kaps + n8n

Use [n8n](https://n8n.io) to automate captioned renders with the Kaps [Render API](./render-api.html). There is no dedicated Kaps node — the built-in **HTTP Request** node (and optional **Webhook** trigger) is enough.

## Prerequisites

1. A **Kaps** account ([kaps.ai](https://kaps.ai)) with credits.
2. An API key from **Settings → API keys** (`ksk_live_…`, shown once).
3. n8n (cloud or self-hosted).

**API base URL:** `https://api.kaps.ai/functions/v1`

## Store your API key

In n8n, create a credential:

1. **Credentials → Add credential → Header Auth**
2. Name: `Authorization`
3. Value: `Bearer ksk_live_...` (include the `Bearer ` prefix)

Use this credential on every HTTP Request node below.

---

## Starter workflow (import)

A minimal **“caption video from URL”** workflow is in the repo:

**[docs/workflows/kaps-caption-from-url.json](https://github.com/webtonicAI/Kaps-Community/blob/main/docs/workflows/kaps-caption-from-url.json)**

In n8n: **Workflows → Import from file** (or paste JSON). Then:

1. Open the **Configure** node and set `preset_id` and `video_url`.
2. Attach your Header Auth credential to the HTTP Request nodes.
3. Run manually to test.

The template uses `wait: true` so short clips finish in one execution (blocks up to ~4 minutes). For longer videos, use the async + webhook pattern below.

---

## Build it yourself

Recommended flow: **credits → estimate → create → status** (or webhook). See [Render API](./render-api.html) for field details.

### 1. Check credits (optional)

| Setting | Value |
| ------- | ----- |
| Method | `GET` |
| URL | `https://api.kaps.ai/functions/v1/api-credits` |
| Auth | Header Auth (see above) |

### 2. Estimate cost (optional)

| Setting | Value |
| ------- | ----- |
| Method | `POST` |
| URL | `https://api.kaps.ai/functions/v1/api-render-estimate` |
| Auth | Header Auth |
| Body content type | JSON |

Example body:

```json
{
  "duration_seconds": 185,
  "resolution": "1080p",
  "fps": 30
}
```

Check `can_proceed` before creating a render. Still returns HTTP 200 when balance or upload limits would block a real job.

### 3. List presets (optional)

| Setting | Value |
| ------- | ----- |
| Method | `GET` |
| URL | `https://api.kaps.ai/functions/v1/api-presets-list` |
| Auth | Header Auth (see above) |

Pick a `preset_id` from the response.

### 4. Start a render

| Setting | Value |
| ------- | ----- |
| Method | `POST` |
| URL | `https://api.kaps.ai/functions/v1/api-render-create` |
| Auth | Header Auth |
| Body content type | JSON |

Example body (sync — good for short clips):

```json
{
  "preset_id": "{{ $json.preset_id }}",
  "video_url": "{{ $json.video_url }}",
  "resolution": "1080p",
  "fps": 30,
  "wait": true
}
```

Example body (async — recommended for longer videos):

```json
{
  "preset_id": "{{ $json.preset_id }}",
  "video_url": "{{ $json.video_url }}",
  "resolution": "1080p",
  "webhook_url": "https://your-n8n.example.com/webhook/kaps-render-complete"
}
```

When `wait` is omitted or `false`, the response includes `request_id` and `status_url`. Poll with **GET** `https://api.kaps.ai/functions/v1/api-render-status?id={{ $json.request_id }}`.

### 5. Async completion via Webhook (recommended)

1. Add a **Webhook** trigger node (`POST`, path e.g. `kaps-render-complete`).
2. Copy the production webhook URL into `webhook_url` on the create request.
3. When the render finishes, Kaps POSTs JSON including `output_url`, `status`, and `credits_used`.

See [Render API → Webhooks](./render-api.html#webhooks) for payload shape and HMAC verification (`X-Kaps-Signature`). For internal workflows you can skip verification; for production endpoints use a **Code** node to verify the signature with your key’s webhook signing secret.

### 6. Poll loop (alternative to webhooks)

If you cannot expose a webhook:

```
HTTP Request (create, wait: false)
  → Wait (5s)
  → HTTP Request (GET status)
  → IF status not in complete/failed → loop back to Wait
```

---

## Example: Google Drive → Kaps

n8n has native nodes for the full pipeline when your source file lives on Drive:

```
Google Drive Trigger
  → Google Drive (Download)
  → S3 / R2 / B2 (Upload)
  → Set (public file URL)
  → HTTP Request (Kaps create render)
```

Use the file ID from the share link (`drive.google.com/file/d/FILE_ID/view`) in the Download node.

> **Side note — Google Drive links:** A Drive **share URL is not a direct video URL**. Kaps fetches `video_url` server-side and needs raw file bytes (S3, R2, CDN, etc.). Pasting a Drive link into `video_url` returns HTML and ingest fails. Download with n8n’s Google Drive node, upload to a bucket with a public (or signed) object URL, then pass that URL to Kaps — or upload the asset in the Kaps app and use `asset_id` instead.

For large files, enable n8n [filesystem binary mode](https://docs.n8n.io/hosting/configuration/environment-variables/binary-data/) on self-hosted instances.

---

## Operations quick reference

| Action | Method | Path |
| ------ | ------ | ---- |
| Credit balance | `GET` | `/api-credits` |
| Estimate cost | `POST` | `/api-render-estimate` |
| List presets | `GET` | `/api-presets-list` |
| Create render | `POST` | `/api-render-create` |
| Poll status | `GET` | `/api-render-status?id={request_id}` |

Full field lists, errors, and pricing: **[Render API](./render-api.html)**.

## Further reading

- **[Render API](./render-api.html)** — auth, webhooks, status machine, examples
- **[MCP server](./mcp.html)** — same API from Cursor / Claude via MCP
