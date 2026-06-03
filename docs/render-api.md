---
layout: default
title: Kaps Render API
---

{% include nav.html %}

# Kaps Render API

The Kaps Render API applies caption presets to video programmatically: **transcription**, **Kaps captions**, and **rendering**, behind API-key-authenticated REST endpoints.

- **Base URL:** `https://api.kaps.ai/functions/v1`
- **Auth:** `Authorization: Bearer ksk_live_...` (or `X-API-Key: ksk_live_...`)
- **Content type:** `application/json`

For a terse MCP wrapper over the same operations, see the [Kaps MCP server](./mcp.html).

---

## Authentication

Create an API key in **Settings → API keys**. The plaintext key is shown **once** at creation; Kaps stores only a hash. Each key has a **webhook signing secret** for HMAC-signed completion webhooks.

```
Authorization: Bearer ksk_live_a1b2c3d4e5f6...
```

Scopes: tokens currently have `render:write`.

---

## `POST` `/api-render-create`

Start a render. Provide **exactly one** of `video_url` or `asset_id`.

### Request body

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `preset_id` | uuid | yes | Caption preset ID. Use [`/api-presets-list`](#get-api-presets-list) to discover. |
| `video_url` | string | one-of | Public HTTPS URL to the source video. |
| `asset_id` | uuid | one-of | ID of an asset already uploaded for the user. |
| `resolution` | string | no | `720p` \| `1080p` \| `4k` \| `native`. Omit to keep the source resolution; set to scale. **`native`** preserves original dimensions. Aspect ratio is preserved when scaling. |
| `fps` | int | no | e.g. `30` or `60`. Omit to match the source frame rate. |
| `transcription` | object | no | Optional transcription settings (speakers, key terms). |
| `transcription.num_speakers` | int | no | 1–32; helps diarization. |
| `transcription.keyterms` | string[] | no | Domain terms to bias transcription. |
| `webhook_url` | string | no | HTTPS URL for the [completion webhook](#webhooks). |
| `wait` | bool | no | If `true`, blocks up to ~4 min and returns terminal state. Default `false`. |

### Response `202 Accepted` (async default)

```json
{
  "request_id": "d4a2...",
  "status": "queued",
  "status_url": "https://api.kaps.ai/functions/v1/api-render-status?id=d4a2...",
  "estimated_credits": 4
}
```

### Response `200 OK` (`wait=true` and render finished)

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

| Status | `code` | When |
| ------ | ------ | ---- |
| 400 | — | Validation (missing/invalid fields). |
| 401 | `missing_api_key` | No bearer / `X-API-Key`. |
| 401 | `invalid_api_key` | Unknown or revoked key. |
| 403 | — | Preset or asset not accessible to this user. |
| 402 | `insufficient_credits` | Balance below estimated cost. |
| 404 | — | Preset or asset not found. |
| 500 | — | Internal error (see `error`). |

---

## `GET` `/api-render-status`

Poll render state.

### Query params

- `id` — `request_id` from `/api-render-create`.

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

`stage` is finer-grained (dashboard labels). Prefer `status` for branching logic.

---

## `GET` `/api-presets-list`

Lists presets the API key may use: the user’s presets plus public community presets where applicable.

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

If `webhook_url` is set, Kaps POSTs JSON when the render reaches a terminal state (`complete` or `failed`). The request includes an HMAC-SHA256 signature:

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

Signed string: `${timestamp}.${raw_request_body}`.

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyKapsWebhook(
  rawBody: string,
  header: string,
  secret: string,
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

- Up to **3** attempts with backoff (500 ms → 1 s → 2 s).
- Retries on network errors, `408`, `429`, or `5xx`.
- Other `4xx` aborts immediately.
- Respond with `2xx` within 10 s.

---

## Pricing

Credits apply on successful completion. Example tiers (subject to product pricing):

| Output | Credits / minute |
| ------ | ---------------- |
| &lt;1080p @ 30 fps | 1 |
| &lt;1080p @ 60 fps | 2 |
| 1080p @ 30 fps | 2 |
| 1080p @ 60 fps | 4 |
| 4K @ 30 fps | 8 |
| 4K @ 60 fps | 16 |

Billing rounds up to the nearest minute with a 1-minute minimum.

---

## Rate limits

No fixed per-key rate limit is documented here; limits include credit balance and account concurrent render capacity. For very high concurrency, contact Kaps before scaling.

---

## Examples

### cURL — async create

```bash
curl -X POST "https://api.kaps.ai/functions/v1/api-render-create" \
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

### Node — `wait: true`

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

API = "https://api.kaps.ai/functions/v1"
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
