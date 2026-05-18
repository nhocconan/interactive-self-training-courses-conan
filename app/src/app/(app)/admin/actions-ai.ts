"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { buildAdapter, buildAdapterFromInput } from "@/lib/ai/registry";
import type { AiFeatureKey, AiProviderKind } from "@prisma/client";

const KindEnum = z.enum([
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "OPENAI_COMPATIBLE",
  "OLLAMA",
]);
const FeatureEnum = z.enum([
  "CHAT", "SUMMARY", "EXPLAIN", "QUIZ_GENERATION", "TAG_SUGGESTION",
]);

export type AddProviderState =
  | { ok: true; name: string; modelCount: number }
  | { ok: false; error?: string }
  | { ok: null }; // initial

/**
 * Add an AI provider, verifying credentials first.
 *
 * Flow:
 *   1. Validate form (zod).
 *   2. Build adapter from input (NOT yet persisted).
 *   3. Call `listModels()` to verify the key/endpoint actually work.
 *   4. Only on success → persist with the fresh models cache.
 *   5. On failure → return `{ ok: false, error }`; nothing is written.
 *
 * This is invoked from a client `useActionState` form, so the previous
 * state is passed as the first argument.
 */
export async function addProvider(
  _prev: AddProviderState,
  form: FormData,
): Promise<AddProviderState> {
  const s = await requireAdmin();
  const raw = {
    name: String(form.get("name") || "").trim(),
    kind: String(form.get("kind") || "OPENAI"),
    apiKey: String(form.get("apiKey") || ""),
    baseUrl: String(form.get("baseUrl") || "").trim(),
  };
  // Ollama self-hosted often has no API key — relax the min length for that kind.
  const schema = z.object({
    name: z.string().min(1, "Name is required").max(120),
    kind: KindEnum,
    apiKey:
      raw.kind === "OLLAMA"
        ? z.string().max(400)
        : z.string().min(8, "API key looks too short").max(400),
    baseUrl: z.string().url("Base URL must be a valid URL").optional().or(z.literal("")),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input" };
  }
  const v = parsed.data;

  // 1. Verify credentials BEFORE persisting.
  let models: { id: string; family?: string; contextK?: number }[];
  try {
    const adapter = buildAdapterFromInput({
      kind: v.kind as AiProviderKind,
      apiKey: v.apiKey,
      baseUrl: v.baseUrl || null,
    });
    models = await adapter.listModels();
  } catch (e) {
    return {
      ok: false,
      error:
        "Connection test failed — credentials/endpoint were not saved. " +
        (e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300)),
    };
  }
  if (!models.length) {
    return {
      ok: false,
      error: "Connected, but the provider returned 0 models. Nothing was saved.",
    };
  }

  // 2. Persist (with verified models cached in one write).
  const provider = await prisma.aiProvider.create({
    data: {
      name: v.name,
      kind: v.kind as AiProviderKind,
      apiKey: encryptSecret(v.apiKey),
      baseUrl: v.baseUrl || null,
      modelsCache: models as unknown as object,
      modelsCachedAt: new Date(),
    },
  });
  await audit({
    actorId: s.user.id,
    action: "ai.provider.create",
    target: provider.id,
    after: { name: provider.name, kind: provider.kind, modelCount: models.length },
  });

  revalidatePath("/admin/ai");
  return { ok: true, name: provider.name, modelCount: models.length };
}

export type UpdateProviderState =
  | { ok: true; name: string; modelCount: number; retested: boolean }
  | { ok: false; error: string }
  | { ok: null };

/**
 * Update an existing provider.
 *  - If `apiKey` (non-blank) or `baseUrl` changes → re-run the connection test
 *    and only persist on success. A blank `apiKey` means "keep current key".
 *  - Rename / enable-toggle only → no test required, save directly.
 */
export async function updateProvider(
  _prev: UpdateProviderState,
  form: FormData,
): Promise<UpdateProviderState> {
  const s = await requireAdmin();
  const providerId = String(form.get("providerId") || "");
  if (!providerId) return { ok: false, error: "Missing provider id." };

  const existing = await prisma.aiProvider.findUnique({ where: { id: providerId } });
  if (!existing) return { ok: false, error: "Provider not found." };

  const raw = {
    name: String(form.get("name") || "").trim(),
    apiKey: String(form.get("apiKey") || ""), // blank → keep
    baseUrl: String(form.get("baseUrl") || "").trim(),
    isEnabled: form.get("isEnabled") === "on" || form.get("isEnabled") === "true",
  };
  const schema = z.object({
    name: z.string().min(1, "Name is required").max(120),
    apiKey: z.string().max(400),
    baseUrl: z.string().url("Base URL must be a valid URL").optional().or(z.literal("")),
    isEnabled: z.boolean(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input" };
  }
  const v = parsed.data;
  const baseUrlNext = v.baseUrl || null;
  const baseUrlChanged = baseUrlNext !== existing.baseUrl;
  const keyChanged = v.apiKey.length > 0;
  const credsChanged = keyChanged || baseUrlChanged;

  let modelsUpdate: { modelsCache: object; modelsCachedAt: Date } | null = null;
  if (credsChanged) {
    // Test the new credentials BEFORE writing them.
    try {
      const adapter = buildAdapterFromInput({
        kind: existing.kind,
        apiKey: keyChanged ? v.apiKey : decryptSecret(existing.apiKey),
        baseUrl: baseUrlNext,
      });
      const models = await adapter.listModels();
      if (!models.length) {
        return {
          ok: false,
          error: "Connected, but the provider returned 0 models. Nothing was changed.",
        };
      }
      modelsUpdate = {
        modelsCache: models as unknown as object,
        modelsCachedAt: new Date(),
      };
    } catch (e) {
      return {
        ok: false,
        error:
          "Connection test failed — the existing provider was not changed. " +
          (e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300)),
      };
    }
  }

  const updated = await prisma.aiProvider.update({
    where: { id: providerId },
    data: {
      name: v.name,
      baseUrl: baseUrlNext,
      isEnabled: v.isEnabled,
      ...(keyChanged ? { apiKey: encryptSecret(v.apiKey) } : {}),
      ...(modelsUpdate ?? {}),
    },
  });
  await audit({
    actorId: s.user.id,
    action: "ai.provider.update",
    target: updated.id,
    after: {
      name: updated.name,
      isEnabled: updated.isEnabled,
      baseUrlChanged,
      keyChanged,
      retested: !!modelsUpdate,
    },
  });

  revalidatePath("/admin/ai");
  return {
    ok: true,
    name: updated.name,
    modelCount: modelsUpdate
      ? (modelsUpdate.modelsCache as unknown as { id: string }[]).length
      : ((updated.modelsCache as unknown as { id: string }[] | null)?.length ?? 0),
    retested: !!modelsUpdate,
  };
}

export async function refreshModels(providerId: string): Promise<number> {
  await requireAdmin();
  const p = await prisma.aiProvider.findUnique({ where: { id: providerId } });
  if (!p) throw new Error("Provider not found");
  const adapter = buildAdapter(p);
  const list = await adapter.listModels();
  await prisma.aiProvider.update({
    where: { id: providerId },
    data: {
      modelsCache: list as unknown as object,
      modelsCachedAt: new Date(),
    },
  });
  revalidatePath("/admin/ai");
  return list.length;
}

export async function toggleProvider(providerId: string, isEnabled: boolean) {
  const s = await requireAdmin();
  await prisma.aiProvider.update({ where: { id: providerId }, data: { isEnabled } });
  await audit({ actorId: s.user.id, action: "ai.provider.toggle", target: providerId, after: { isEnabled } });
  revalidatePath("/admin/ai");
}

export async function deleteProvider(providerId: string) {
  const s = await requireAdmin();
  await prisma.aiProvider.delete({ where: { id: providerId } });
  await audit({ actorId: s.user.id, action: "ai.provider.delete", target: providerId });
  revalidatePath("/admin/ai");
}

/**
 * Replace the entire fallback chain for a feature in one atomic operation.
 * Index 0 = primary, 1+ = fallbacks tried in order. Pass [] to clear.
 */
export async function setFeatureChain(
  feature: AiFeatureKey,
  chain: { providerId: string; model: string }[],
) {
  const s = await requireAdmin();
  const f = FeatureEnum.parse(feature) as AiFeatureKey;
  await prisma.$transaction([
    prisma.aiModelChoice.deleteMany({ where: { feature: f } }),
    ...chain.map((c, idx) =>
      prisma.aiModelChoice.create({
        data: { feature: f, providerId: c.providerId, model: c.model, priority: idx },
      }),
    ),
  ]);
  await audit({
    actorId: s.user.id,
    action: "ai.feature.set_chain",
    target: f,
    after: { chain: chain.map((c, idx) => ({ ...c, priority: idx })) },
  });
  revalidatePath("/admin/ai");
}

export async function clearFeatureChoice(feature: AiFeatureKey) {
  const s = await requireAdmin();
  await prisma.aiModelChoice.deleteMany({ where: { feature } });
  await audit({ actorId: s.user.id, action: "ai.feature.clear", target: feature });
  revalidatePath("/admin/ai");
}
