import { aiFetch, type AiAdapter, type AiModelInfo, type ChatRequest, type ChatResponse } from "./adapter";

export class OpenAIAdapter implements AiAdapter {
  kind = "OPENAI" as const;
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.openai.com/v1",
  ) {}

  async listModels(): Promise<AiModelInfo[]> {
    const r = await aiFetch(
      `${this.baseUrl}/models`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } },
      "OpenAI listModels",
    );
    const j = (await r.json()) as { data: { id: string; owned_by?: string }[] };
    return j.data
      .filter((m) =>
        // keep only chat-capable families
        /^(gpt-|o\d|chatgpt-)/i.test(m.id),
      )
      .map((m) => ({ id: m.id, family: m.owned_by ?? "openai" }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const r = await aiFetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature ?? 0.4,
          max_tokens: req.maxTokens ?? 800,
        }),
      },
      "OpenAI chat",
    );
    const j = (await r.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      content: j.choices[0]?.message?.content ?? "",
      inputTokens: j.usage?.prompt_tokens,
      outputTokens: j.usage?.completion_tokens,
      latencyMs: Date.now() - start,
      raw: j,
    };
  }
}
