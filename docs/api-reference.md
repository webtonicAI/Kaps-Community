---
layout: default
title: Kaps Render API Reference
---

{% include nav.html %}

# Kaps Render API Reference

The Kaps Render API lets you apply any caption preset to a video programmatically.
It's the same pipeline the web app uses — ElevenLabs transcription, Remotion
captions, Modal distributed rendering — exposed behind an API-key-authenticated
REST endpoint.

- **Base URL:** `https://<project-ref>.supabase.co/functions/v1`
- **Auth:** `Authorization: Bearer ksk_live_...` (or `X-API-Key: ksk_live_...`)
- **Content type:** `application/json`

> Need a terse wrapper? The companion [MCP server](mcp-setup.html) exposes the
> same operations as Model Context Protocol tools.

---

## Authentication

Create an API key in **Settings → API keys**. The plaintext key is shown
**once**, at creation time; Kaps stores only a SHA-256 hash. Each key also
has a **webhook signing secret** used to HMAC-sign completion webhooks.

Pass the key on every request:

```
Authorization: Bearer ksk_live_a1b2c3d4e5f6...
```

Scopes: all tokens currently have `render:write`.

---

## POST `/api-render-create`

Kick off a render. Must provide **exactly one** of `video_url` or `asset_id`.

### Request body

| Field                    | Type     | Required | Notes                                                                                                  |
| ------------------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `preset_id`              | uuid     | yes      | Caption preset ID. Use [`/api-presets-list`](#get-api-presets-list) to discover.                        |
| `video_url`              | string   | one-of   | Public HTTPS URL to the source video.                                                                  |
| `asset_id`               | uuid     | one-of   | ID of an asset already uploaded by the owning user.                                                    |
| `resolution`             | string   | no       | `720p` \| `1080p` \| `4k` \| `native`. Default `1080p`. Aspect ratio is preserved.                     |
| `fps`                    | int      | no       | 24, 25, 30, 48, 50, or 60. Default `30`.                                                               |
| `transcription`          | object   | no       | Passed through to ElevenLabs.                                                                          |
| `transcription.num_speakers` | int  | no       | 1-32. Improves diarization for multi-speaker content.                                                  |
| `transcription.keyterms` | string[] | no       | Domain-specific terms to bias the transcription.                                                       |
| `webhook_url`            | string   | no       | HTTPS endpoint that receives an [HMAC-signed completion webhook](#webhooks).                           |
| `wait`                   | bool     | no       | If `true`, the call blocks up to ~4 min and returns the terminal state inline. Defaults to `false`.    |

### Response `202 Accepted` (async — default)

```json
{
  "request_id": "d4a2...",
  "status": "queued",
  "status_url": "https://<ref>.supabase.co/functions/v1/api-render-status?id=d4a2...",
  "estimated_credits": 4
}
```

### Response `200 OK` (when `wait=true` and render finished)

```json
{
  "request_id": "d4a2...",
  "status": "complete",
  "stage": "complete",
  "output_url": "https://.../final.mp4",
  "error": null,
  "credits_used": 4,
  "status_url": "https://..."
}
```

### Errors

| Status | `code`                   | When                                                   |
| ------ | ------------------------ | ------------------------------------------------------ |
| 400    | —                        | Validation (missing/invalid fields).                   |
| 401    | `missing_api_key`        | No bearer/X-API-Key header.                            |
| 401    | `invalid_api_key`        | Unknown or revoked key.                                |
| 403    | —                        | Preset or asset not accessible to this key's user.     |
| 402    | `insufficient_credits`   | Balance < estimated cost. Response includes numbers.   |
| 404    | —                        | Preset or asset not found.                             |
| 500    | —                        | Internal error (see `error`).                          |

---

## GET `/api-render-status`

Poll the current state of a render request.

### Query params

- `id` — the `request_id` returned by `/api-render-create`.

### Response `200 OK`

```json
{
  "request_id": "d4a2...",
  "status": "rendering",
  "stage": "rendering",
  "output_url": null,
  "error": null,
  "credits_used": null,
  "created_at": "2026-04-21T18:00:00Z",
  "updated_at": "2026-04-21T18:01:22Z",
  "input": {
    "preset_id": "1f2e...",
    "resolution": "1080p",
    "fps": 30
  }
}
```

### `status` state machine

```
queued → ingesting → transcribing → rendering → concatenating → complete
                                             ↘ failed
```

`stage` is a more granular label used by the dashboard (`fetching_video`,
`uploading_asset`, etc.). Don't build logic on it; use `status`.

---

## GET `/api-presets-list`

List caption presets the API key can render with. Returns both the user's own
presets and any public (non-hidden) community presets.

### Response `200 OK`

```json
{
  "presets": [
    {
      "id": "1f2e...",
      "name": "Karaoke Neon",
      "scope": "private",
      "is_public": false,
      "created_at": "2026-03-02T10:11:12Z",
      "updated_at": "2026-03-02T10:11:12Z"
    }
  ]
}
```

---

## Webhooks

If you set `webhook_url`, Kaps will POST a JSON payload to it when the
render reaches a terminal state (`complete` or `failed`). The request
includes an HMAC-SHA256 signature header:

```
X-Kaps-Signature: t=1713728400,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
Content-Type: application/json
User-Agent: Kaps-Webhooks/1.0
```

### Payload

```json
{
  "request_id": "d4a2...",
  "status": "complete",
  "output_url": "https://.../final.mp4",
  "error": null,
  "credits_used": 4,
  "fps": 30,
  "resolution": { "width": 1920, "height": 1080 },
  "duration": 62.4,
  "created_at": "2026-04-21T18:00:00Z",
  "completed_at": "2026-04-21T18:03:02Z"
}
```

### Verifying the signature

The signed string is `${timestamp}.${raw_request_body}`. Verify on your side:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyKapsWebhook(
  rawBody: string,
  header: string,                       // value of X-Kaps-Signature
  secret: string,                       // webhook_signing_secret from key creation
  toleranceSeconds = 300,
): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
```

### Delivery semantics

- Up to **3 attempts** with exponential backoff (500 ms → 1 s → 2 s).
- Retries happen on network errors, `408`, `429`, or any `5xx`.
- `4xx` (other than 408/429) aborts immediately — your endpoint is telling
  us the payload is bad.
- Respond with `2xx` within 10 s to acknowledge.
- Your endpoint will be called at most once per request (guarded by
  `webhook_delivered_at`).

---

## Pricing

Credits are charged only on successful render completion (not on failure).
Pricing mirrors the web app:

| Output                          | Credits / minute |
| ------------------------------- | ---------------- |
| &lt;1080p @ 30 fps              | 1                |
| &lt;1080p @ 60 fps              | 2                |
| 1080p @ 30 fps                  | 2                |
| 1080p @ 60 fps                  | 4                |
| 4K @ 30 fps                     | 8                |
| 4K @ 60 fps                     | 16               |

Billing rounds up to the nearest minute, with a 1-minute minimum.

---

## Rate limits

Currently no per-key rate limit, but you're limited by:

- Your available credit balance (checked pre-flight).
- The global Modal concurrency for your account.

Heavy usage? Get in touch before kicking off >50 concurrent renders.

---

## Examples

### cURL — URL ingest, async

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/api-render-create" \
  -H "Authorization: Bearer ksk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "preset_id": "1f2e...",
    "video_url": "https://cdn.example.com/episode42.mp4",
    "resolution": "1080p",
    "fps": 30,
    "webhook_url": "https://hooks.example.com/kaps"
  }'
```

### Node — synchronous wait

```ts
const res = await fetch(`${API}/api-render-create`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.KAPS_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    preset_id: presetId,
    asset_id: assetId,
    resolution: "4k",
    fps: 60,
    wait: true,
  }),
});
const { output_url } = await res.json();
```

### Python — poll loop

```python
import os, time, httpx

API = "https://<ref>.supabase.co/functions/v1"
h = {"Authorization": f"Bearer {os.environ['KAPS_API_KEY']}"}

r = httpx.post(
    f"{API}/api-render-create", headers=h,
    json={"preset_id": PRESET, "video_url": URL, "resolution": "1080p"},
).json()

rid = r["request_id"]
while True:
    s = httpx.get(f"{API}/api-render-status", headers=h, params={"id": rid}).json()
    print(s["status"])
    if s["status"] in ("complete", "failed"):
        print(s.get("output_url") or s.get("error"))
        break
    time.sleep(5)
```
