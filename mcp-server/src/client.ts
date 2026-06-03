/**
 * Thin REST wrapper around the Kaps public render API. The MCP tools in
 * `./index.ts` defer all HTTP work here so the surface area stays small
 * and the same client is reusable from tests or other Node scripts.
 */

export interface KapsClientOptions {
  apiKey: string;
  baseUrl: string;
}

export interface CreateRenderInput {
  preset_id: string;
  video_url?: string;
  asset_id?: string;
  resolution?: "720p" | "1080p" | "4k" | "native";
  fps?: 24 | 25 | 30 | 48 | 50 | 60;
  transcription?: {
    num_speakers?: number;
    keyterms?: string[];
  };
  webhook_url?: string;
  wait?: boolean;
}

export interface CreateRenderResponse {
  request_id: string;
  status: string;
  stage?: string | null;
  output_url?: string | null;
  error?: string | null;
  credits_used?: number | null;
  status_url?: string;
}

export interface RenderStatusResponse {
  request_id: string;
  status: string;
  stage: string | null;
  output_url: string | null;
  error: string | null;
  credits_used: number | null;
  created_at: string;
  updated_at: string;
  input: {
    preset_id?: string;
    resolution?: string;
    fps?: number;
  };
}

export interface PresetSummary {
  id: string;
  name: string;
  scope: "private" | "public";
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export class KapsApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "KapsApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class KapsClient {
  constructor(private readonly opts: KapsClientOptions) {
    if (!opts.apiKey) throw new Error("KapsClient: apiKey is required");
    if (!opts.baseUrl) throw new Error("KapsClient: baseUrl is required");
  }

  async createRender(input: CreateRenderInput): Promise<CreateRenderResponse> {
    return this.request<CreateRenderResponse>("POST", "/api-render-create", input);
  }

  async getRenderStatus(requestId: string): Promise<RenderStatusResponse> {
    const qs = new URLSearchParams({ id: requestId });
    return this.request<RenderStatusResponse>("GET", `/api-render-status?${qs}`);
  }

  async listPresets(): Promise<PresetSummary[]> {
    const res = await this.request<{ presets: PresetSummary[] }>("GET", "/api-presets-list");
    return res.presets;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.opts.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const raw = await res.text();
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { raw };
      }
    }

    if (!res.ok) {
      const obj = (parsed ?? {}) as Record<string, unknown>;
      throw new KapsApiError(
        typeof obj.error === "string" ? obj.error : `HTTP ${res.status}`,
        res.status,
        typeof obj.code === "string" ? obj.code : undefined,
        parsed,
      );
    }

    return parsed as T;
  }
}
