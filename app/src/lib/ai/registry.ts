import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { AiTransientError, estimateCostUSD, type AiAdapter, type ChatRequest, type ChatResponse } from "./adapter";
import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";
import { GeminiAdapter } from "./gemini";
import { OllamaAdapter } from "./ollama";
import type { AiFeatureKey, AiProvider, AiProviderKind } from "@prisma/client";

export function buildAdapter(provider: AiProvider): AiAdapter {
  const apiKey = decryptSecret(provider.apiKey);
  switch (provider.kind as AiProviderKind) {
    case "OPENAI":
      return new OpenAIAdapter(apiKey);
    case "OPENAI_COMPATIBLE":
      return new OpenAIAdapter(apiKey, provider.baseUrl ?? "https://api.openai.com/v1");
    case "ANTHROPIC":
      return new AnthropicAdapter(apiKey);
    case "GOOGLE":
      return new GeminiAdapter(apiKey);
    case "OLLAMA":
      return new OllamaAdapter(apiKey, provider.baseUrl ?? "https://ollama.com");
  }
}

/**
 * Build an adapter from raw user input (pre-save), used by addProvider
 * to verify credentials before writing to the DB.
 */
export function buildAdapterFromInput(input: {
  kind: AiProviderKind;
  apiKey: string;
  baseUrl?: string | null;
}): AiAdapter {
  switch (input.kind) {
    case "OPENAI":
      return new OpenAIAdapter(input.apiKey);
    case "OPENAI_COMPATIBLE":
      return new OpenAIAdapter(input.apiKey, input.baseUrl || "https://api.openai.com/v1");
    case "ANTHROPIC":
      return new AnthropicAdapter(input.apiKey);
    case "GOOGLE":
      return new GeminiAdapter(input.apiKey);
    case "OLLAMA":
      return new OllamaAdapter(input.apiKey, input.baseUrl || "https://ollama.com");
  }
}

/**
 * Resolve a feature's full chain (primary + ordered fallbacks).
 * Disabled providers are filtered out so admins can drain traffic by toggling.
 */
export async function resolveFeature(feature: AiFeatureKey) {
  const choices = await prisma.aiModelChoice.findMany({
    where: { feature },
    include: { provider: true },
    orderBy: { priority: "asc" },
  });
  return choices
    .filter((c) => c.provider.isEnabled)
    .map((c) => ({
      provider: c.provider,
      model: c.model,
      priority: c.priority,
      adapter: buildAdapter(c.provider),
    }));
}

/**
 * Run a feature with transient-error failover.
 *
 * Behaviour:
 *  - Try chain in priority order.
 *  - On `AiTransientError` (429 / 5xx / timeout / network) → log fail + try next.
 *  - On any other error (auth, bad request, model not found) → log fail + throw immediately.
 *  - If all entries fail transiently → throw an aggregated error so the caller sees every attempt.
 * Each attempt is logged to AiUsage so admins can see exactly where calls landed.
 */
export async function runFeature(args: {
  feature: AiFeatureKey;
  userId?: string;
  messages: ChatRequest["messages"];
  temperature?: number;
  maxTokens?: number;
}): Promise<ChatResponse & { providerId: string; model: string }> {
  const chain = await resolveFeature(args.feature);
  if (chain.length === 0) {
    throw new Error(
      `AI feature "${args.feature}" is not configured. Ask an admin to enable a provider in Settings → AI.`,
    );
  }

  const attempts: { providerId: string; model: string; error: string }[] = [];
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i];
    const t0 = Date.now();
    try {
      const out = await r.adapter.chat({
        model: r.model,
        messages: args.messages,
        temperature: args.temperature,
        maxTokens: args.maxTokens,
      });
      const inT = out.inputTokens ?? 0;
      const outT = out.outputTokens ?? 0;
      await prisma.aiUsage.create({
        data: {
          userId: args.userId,
          providerId: r.provider.id,
          feature: args.feature,
          model: r.model,
          inputTokens: inT,
          outputTokens: outT,
          costUSD: estimateCostUSD(r.model, inT, outT),
          latencyMs: out.latencyMs,
          ok: true,
        },
      });
      return { ...out, providerId: r.provider.id, model: r.model };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500);
      await prisma.aiUsage.create({
        data: {
          userId: args.userId,
          providerId: r.provider.id,
          feature: args.feature,
          model: r.model,
          latencyMs: Date.now() - t0,
          ok: false,
          errorMsg,
        },
      });
      attempts.push({ providerId: r.provider.id, model: r.model, error: errorMsg });

      // Only fail over on transient errors. Permanent errors (auth, model name,
      // bad request) almost always repeat on every fallback and need an admin.
      const isTransient = e instanceof AiTransientError;
      if (!isTransient || i === chain.length - 1) {
        const summary = attempts
          .map((a, n) => `  [${n + 1}] ${a.model}: ${a.error}`)
          .join("\n");
        throw new Error(
          `AI feature "${args.feature}" failed after ${attempts.length} attempt(s):\n${summary}`,
        );
      }
      // else: loop to next provider in the chain
    }
  }
  // unreachable — loop always returns or throws
  throw new Error(`AI feature "${args.feature}" exhausted chain unexpectedly`);
}
