export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type ChatResponse = {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  raw?: unknown;
};

export type AiModelInfo = { id: string; family?: string; contextK?: number };

/**
 * Thrown for transient upstream failures: 429, 5xx, timeout, connect-reset,
 * network. The failover loop in `runFeature` only retries on this class —
 * config errors (401/403, 400, model-not-found) bubble up immediately so the
 * admin can fix them instead of silently routing to a fallback.
 */
export class AiTransientError extends Error {
  readonly transient = true as const;
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AiTransientError";
  }
}

/** True if HTTP status / network error should be considered transient. */
export function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Wrap a fetch() call so the failover loop can tell transient vs permanent.
 * - Network errors / timeouts / aborts → AiTransientError
 * - 5xx / 429 / 408 / 425                → AiTransientError
 * - Anything else non-OK                 → plain Error (no failover)
 */
export async function aiFetch(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response> {
  let r: Response;
  try {
    r = await fetch(url, init);
  } catch (e) {
    throw new AiTransientError(
      `${label} network: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!r.ok) {
    const body = (await r.text()).slice(0, 400);
    const msg = `${label} ${r.status}: ${body}`;
    if (isTransientHttpStatus(r.status)) throw new AiTransientError(msg, r.status);
    throw new Error(msg);
  }
  return r;
}

export interface AiAdapter {
  kind: "OPENAI" | "ANTHROPIC" | "GOOGLE" | "OPENAI_COMPATIBLE" | "OLLAMA";
  listModels(): Promise<AiModelInfo[]>;
  chat(req: ChatRequest): Promise<ChatResponse>;
}

/** ~ rough USD cost estimate; numbers updated periodically by hand. */
const COSTS_PER_M_TOKENS: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "o4-mini": { in: 1.1, out: 4.4 },
  "claude-3-5-haiku-latest": { in: 1, out: 5 },
  "claude-3-5-sonnet-latest": { in: 3, out: 15 },
  "claude-opus-4-5": { in: 15, out: 75 },
  "gemini-1.5-flash": { in: 0.075, out: 0.3 },
  "gemini-1.5-pro": { in: 1.25, out: 5 },
  "gemini-2.0-flash": { in: 0.1, out: 0.4 },
};

export function estimateCostUSD(model: string, inT: number, outT: number): number {
  const m =
    COSTS_PER_M_TOKENS[model] ??
    Object.entries(COSTS_PER_M_TOKENS).find(([k]) => model.startsWith(k.split("-")[0]))?.[1];
  if (!m) return 0;
  return ((inT * m.in) / 1_000_000) + ((outT * m.out) / 1_000_000);
}
