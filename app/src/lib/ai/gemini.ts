import { aiFetch, type AiAdapter, type AiModelInfo, type ChatRequest, type ChatResponse } from "./adapter";

export class GeminiAdapter implements AiAdapter {
  kind = "GOOGLE" as const;
  constructor(private readonly apiKey: string) {}

  async listModels(): Promise<AiModelInfo[]> {
    const r = await aiFetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
      {},
      "Gemini listModels",
    );
    const j = (await r.json()) as {
      models: { name: string; supportedGenerationMethods?: string[]; inputTokenLimit?: number }[];
    };
    return j.models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({
        id: m.name.replace(/^models\//, ""),
        family: "gemini",
        contextK: m.inputTokenLimit ? Math.round(m.inputTokenLimit / 1024) : undefined,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const systemMsg = req.messages.find((m) => m.role === "system")?.content;
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.4,
        maxOutputTokens: req.maxTokens ?? 800,
      },
    };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg }] };

    const r = await aiFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        req.model,
      )}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "Gemini chat",
    );
    const j = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    return {
      content:
        j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "",
      inputTokens: j.usageMetadata?.promptTokenCount,
      outputTokens: j.usageMetadata?.candidatesTokenCount,
      latencyMs: Date.now() - start,
      raw: j,
    };
  }
}
