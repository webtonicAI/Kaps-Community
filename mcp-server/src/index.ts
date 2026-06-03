#!/usr/bin/env node
/**
 * Kaps MCP server — exposes the public render API as Model Context
 * Protocol tools so agentic clients (Claude Desktop, Cursor, MCP
 * Inspector, etc.) can render captioned videos in a single tool call.
 *
 * Configuration is read from env vars:
 *   KAPS_API_KEY   — API key created in the Kaps UI (Settings → API keys).
 *   KAPS_API_URL   — Kaps API base URL, e.g.
 *                    https://api.kaps.ai/functions/v1
 *
 * Tools:
 *   - get_credits             credit balance for the API key owner.
 *   - estimate_render         preflight credit cost without creating a render.
 *   - render_captioned_video  kick off a render job (async by default,
 *                             set `wait: true` to block up to ~5 min).
 *   - get_render_status       poll the current state of a request.
 *   - list_presets            list caption presets accessible to the key.
 *
 * Transport: stdio. Launch via `npx @kaps_ai/mcp-server` or `kaps-mcp`.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { KapsApiError, KapsClient } from "./client.js";

const apiKey = process.env.KAPS_API_KEY ?? "";
const baseUrl = process.env.KAPS_API_URL ?? "";

if (!apiKey || !baseUrl) {
  process.stderr.write(
    "[kaps-mcp] Missing required env vars KAPS_API_KEY and/or KAPS_API_URL.\n" +
      "  KAPS_API_KEY=ksk_live_...\n" +
      "  KAPS_API_URL=https://api.kaps.ai/functions/v1\n",
  );
  process.exit(1);
}

const client = new KapsClient({ apiKey, baseUrl });

const renderInputSchema = z
  .object({
    preset_id: z.string().uuid().describe("Caption preset ID (from list_presets)."),
    video_url: z.string().url().optional().describe(
      "Public URL of the source video. Provide either this or asset_id.",
    ),
    asset_id: z.string().uuid().optional().describe(
      "ID of a previously-uploaded asset. Provide either this or video_url.",
    ),
    resolution: z
      .enum(["720p", "1080p", "4k", "native"])
      .optional()
      .describe(
        "Output resolution. Omit to match the source video's resolution. 'native' also preserves source dims. Aspect ratio is preserved when scaling.",
      ),
    fps: z
      .union([
        z.literal(24),
        z.literal(25),
        z.literal(30),
        z.literal(48),
        z.literal(50),
        z.literal(60),
      ])
      .optional()
      .describe("Output frame rate. Omit to match the source video's frame rate."),
    transcription: z
      .object({
        num_speakers: z.number().int().min(1).max(32).optional(),
        keyterms: z.array(z.string()).optional(),
      })
      .optional(),
    webhook_url: z.string().url().optional().describe(
      "HTTPS endpoint to POST the HMAC-signed completion payload to.",
    ),
    wait: z
      .boolean()
      .optional()
      .default(false)
      .describe("If true, long-poll until the render finishes (up to ~4 minutes)."),
  })
  .refine((v) => Boolean(v.video_url) !== Boolean(v.asset_id), {
    message: "Provide exactly one of `video_url` or `asset_id`.",
  });

const statusInputSchema = z.object({
  request_id: z.string().uuid(),
});

const listPresetsInputSchema = z.object({});

const getCreditsInputSchema = z.object({});

const estimateInputSchema = z.object({
  asset_id: z.string().uuid().optional().describe(
    "Library asset ID — uses real duration/dimensions from the asset.",
  ),
  video_url: z.string().url().optional().describe(
    "Public video URL — uses a 60s @ 1080p placeholder unless duration_seconds is also sent.",
  ),
  duration_seconds: z.number().positive().optional().describe(
    "Known clip length in seconds for a dry-run estimate.",
  ),
  resolution: z
    .enum(["720p", "1080p", "4k", "native"])
    .optional()
    .describe("Output resolution tier for pricing."),
  fps: z
    .union([
      z.literal(24),
      z.literal(25),
      z.literal(30),
      z.literal(48),
      z.literal(50),
      z.literal(60),
    ])
    .optional()
    .describe("Output frame rate for pricing."),
  preset_id: z.string().uuid().optional().describe(
    "Validated if present; does not affect estimated cost.",
  ),
});

const tools = [
  {
    name: "get_credits",
    description:
      "Returns the credit balance for the API key owner (monthly + purchased pool).",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
  },
  {
    name: "estimate_render",
    description:
      "Preflight credit cost without creating a render or charging credits. Provide asset_id, video_url, and/or duration_seconds as the duration source. Check can_proceed before calling render_captioned_video.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        asset_id: { type: "string", format: "uuid" },
        video_url: { type: "string", format: "uri" },
        duration_seconds: { type: "number", exclusiveMinimum: 0 },
        resolution: {
          type: "string",
          enum: ["720p", "1080p", "4k", "native"],
        },
        fps: {
          type: "number",
          enum: [24, 25, 30, 48, 50, 60],
        },
        preset_id: { type: "string", format: "uuid" },
      },
    },
  },
  {
    name: "render_captioned_video",
    description:
      "Render a captioned video with a Kaps caption preset. Pass either a public `video_url` or a previously-uploaded `asset_id`. Returns a request_id you can poll with get_render_status, unless `wait=true`. Omit `resolution` / `fps` to keep the source video's dimensions and frame rate.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["preset_id"],
      properties: {
        preset_id: {
          type: "string",
          format: "uuid",
          description: "Caption preset ID (call list_presets to discover).",
        },
        video_url: { type: "string", format: "uri" },
        asset_id: { type: "string", format: "uuid" },
        resolution: {
          type: "string",
          enum: ["720p", "1080p", "4k", "native"],
          description:
            "Output resolution. Omit to match the source video's resolution. Aspect ratio is preserved when scaling.",
        },
        fps: {
          type: "number",
          enum: [24, 25, 30, 48, 50, 60],
          description: "Output frame rate. Omit to match the source video's frame rate.",
        },
        transcription: {
          type: "object",
          additionalProperties: false,
          properties: {
            num_speakers: { type: "integer", minimum: 1, maximum: 32 },
            keyterms: { type: "array", items: { type: "string" } },
          },
        },
        webhook_url: { type: "string", format: "uri" },
        wait: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "get_render_status",
    description: "Get the current status (queued / transcribing / rendering / complete / failed) of a render request.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["request_id"],
      properties: {
        request_id: { type: "string", format: "uuid" },
      },
    },
  },
  {
    name: "list_presets",
    description: "List caption presets accessible to the API key (the user's own presets plus any public ones).",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
  },
] as const;

const server = new Server(
  { name: "kaps-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    switch (name) {
      case "get_credits": {
        getCreditsInputSchema.parse(args ?? {});
        const res = await client.getCredits();
        return ok(res);
      }
      case "estimate_render": {
        const parsed = estimateInputSchema.parse(args ?? {});
        const res = await client.estimateRender(parsed);
        return ok(res);
      }
      case "render_captioned_video": {
        const parsed = renderInputSchema.parse(args ?? {});
        const res = await client.createRender(parsed);
        return ok(res);
      }
      case "get_render_status": {
        const parsed = statusInputSchema.parse(args ?? {});
        const res = await client.getRenderStatus(parsed.request_id);
        return ok(res);
      }
      case "list_presets": {
        listPresetsInputSchema.parse(args ?? {});
        const presets = await client.listPresets();
        return ok({ presets });
      }
      default:
        return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return err(`Invalid arguments: ${e.errors.map((x) => `${x.path.join(".") || "<root>"}: ${x.message}`).join("; ")}`);
    }
    if (e instanceof KapsApiError) {
      return err(`Kaps API error (${e.status}${e.code ? ` ${e.code}` : ""}): ${e.message}`);
    }
    return err(e instanceof Error ? e.message : String(e));
  }
});

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}
function err(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

const transport = new StdioServerTransport();
server.connect(transport).catch((e) => {
  process.stderr.write(`[kaps-mcp] fatal: ${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
