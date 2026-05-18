import { aiFetch, type AiAdapter, type AiModelInfo, type ChatRequest, type ChatResponse } from "./adapter";

export class AnthropicAdapter implements AiAdapter {
  kind = "ANTHROPIC" as const;
  constructor(private readonly apiKey: string) {}

  async listModels(): Promise<AiModelInfo[]> {
    const r = await aiFetch(
      "https://api.anthropic.com/v1/models",
      {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
      },
      "Anthropic listModels",
    );
    const j = (await r.json()) as { data: { id: string; display_name?: string }[] };
    return j.data
      .map((m) => ({ id: m.id, family: m.display_name ?? "anthropic" }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const system = req.messages.find((m) => m.role === "system")?.content;
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const r = await aiFetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: req.model,
          system,
          messages,
          max_tokens: req.maxTokens ?? 800,
          temperature: req.temperature ?? 0.4,
        }),
      },
      "Anthropic chat",
    );
    const j = (await r.json()) as {
      content: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    return {
      content: j.content?.map((b) => b.text ?? "").join("") ?? "",
      inputTokens: j.usage?.input_tokens,
      outputTokens: j.usage?.output_tokens,
      latencyMs: Date.now() - start,
      raw: j,
    };
  }
}
