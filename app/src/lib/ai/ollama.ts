import { aiFetch, type AiAdapter, type AiModelInfo, type ChatRequest, type ChatResponse } from "./adapter";

/**
 * Ollama adapter — works for both:
 *  - Ollama Turbo / Pro (cloud)        → baseUrl = https://ollama.com,    Bearer apiKey
 *  - Self-hosted Ollama (LAN/local)    → baseUrl = http://host:11434,     apiKey usually empty
 *
 * Uses Ollama's native protocol (`/api/tags`, `/api/chat`). The OpenAI-
 * compatible path at `/v1` exists too, but the native one returns richer
 * token counts and works regardless of whether the cloud has the `/v1`
 * surface enabled.
 */
export class OllamaAdapter implements AiAdapter {
  kind = "OLLAMA" as const;
  private readonly base: string;
  constructor(
    private readonly apiKey: string,
    baseUrl: string = "https://ollama.com",
  ) {
    this.base = baseUrl.replace(/\/+$/, "");
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h.Authorization = `Bearer ${this.apiKey}`;
    return h;
  }

  async listModels(): Promise<AiModelInfo[]> {
    const r = await aiFetch(
      `${this.base}/api/tags`,
      { headers: this.headers() },
      "Ollama listModels",
    );
    const j = (await r.json()) as {
      models?: {
        name?: string;
        model?: string;
        details?: { family?: string; parameter_size?: string };
      }[];
    };
    return (j.models ?? [])
      .map((m) => ({
        id: m.model ?? m.name ?? "",
        family: m.details?.family ?? "ollama",
      }))
      .filter((m) => m.id)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const r = await aiFetch(
      `${this.base}/api/chat`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          stream: false,
          options: {
            temperature: req.temperature ?? 0.4,
            num_predict: req.maxTokens ?? 800,
          },
        }),
      },
      "Ollama chat",
    );
    const j = (await r.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };
    return {
      content: j.message?.content ?? "",
      inputTokens: j.prompt_eval_count,
      outputTokens: j.eval_count,
      latencyMs: Date.now() - start,
      raw: j,
    };
  }
}
