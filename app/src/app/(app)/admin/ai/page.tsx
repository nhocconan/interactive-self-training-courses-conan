import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { maskApiKey, decryptSecret } from "@/lib/crypto";
import { Card } from "@/components/ui";
import AddProviderForm from "./AddProviderForm";
import FeatureMappingRow from "./FeatureMappingRow";
import ProviderRow from "./ProviderRow";
import { AlertTriangle } from "lucide-react";

export default async function AdminAiPage() {
  await requireAdmin();
  const [providers, choices] = await Promise.all([
    prisma.aiProvider.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.aiModelChoice.findMany({ orderBy: { priority: "asc" } }),
  ]);

  const features: { key: import("@prisma/client").AiFeatureKey; title: string; hint: string }[] = [
    { key: "CHAT", title: "Ask the course", hint: "Used by the learner-facing chat panel" },
    { key: "SUMMARY", title: "Summarize for me", hint: "5-bullet course summary" },
    { key: "EXPLAIN", title: "Explain selection", hint: "Plain-English explanation of selected text" },
    { key: "QUIZ_GENERATION", title: "Generate quiz from course", hint: "Admin tool" },
    { key: "TAG_SUGGESTION", title: "Suggest tags / category", hint: "Admin tool" },
  ];

  // Build the chain (ordered by priority asc) for each feature.
  const chainsByFeature = new Map(
    features.map((f) => [
      f.key,
      choices
        .filter((c) => c.feature === f.key)
        .map((c) => ({ providerId: c.providerId, model: c.model })),
    ]),
  );
  const unconfigured = features.filter((f) => (chainsByFeature.get(f.key) ?? []).length === 0);

  const providerViews = providers.map((p) => {
    let plainKey = "";
    try { plainKey = decryptSecret(p.apiKey); } catch { plainKey = ""; }
    return {
      id: p.id,
      name: p.name,
      kind: p.kind,
      baseUrl: p.baseUrl,
      isEnabled: p.isEnabled,
      modelCount: (p.modelsCache as unknown as { id: string }[] | null)?.length ?? 0,
      modelsCachedAt: p.modelsCachedAt ? p.modelsCachedAt.toISOString() : null,
      apiKeyMasked: plainKey ? maskApiKey(plainKey) : "",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI providers</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Bring your own keys. Each provider is verified before saving; each feature can
          have a primary plus ordered fallbacks for transient-error failover.
        </p>
      </div>

      <AddProviderForm />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Models cached</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {providerViews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No providers yet. Add one above and click <b>Add &amp; verify</b>.
                </td>
              </tr>
            ) : (
              providerViews.map((p) => <ProviderRow key={p.id} provider={p} />)
            )}
          </tbody>
        </table>
      </Card>

      {providers.length > 0 && unconfigured.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
          <div>
            <div className="font-medium">
              {unconfigured.length} feature{unconfigured.length === 1 ? "" : "s"} still without a provider
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {unconfigured.map((f) => f.title).join(" · ")} — pick a provider &amp; model below.
              <Link href="#feature-mapping" className="ml-1 text-[var(--primary)] underline">
                Go to mapping ↓
              </Link>
            </div>
          </div>
        </div>
      )}

      <Card id="feature-mapping" className="p-5">
        <h2 className="text-base font-semibold">Feature → model mapping</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Pick a primary provider + model for each feature. Add fallbacks to keep the feature working
          when the primary returns a transient error (429 / 5xx / timeout). Order matters — top is tried first.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {features.map((f) => (
            <FeatureMappingRow
              key={f.key}
              feature={f.key}
              title={f.title}
              hint={f.hint}
              providers={providers}
              current={chainsByFeature.get(f.key) ?? []}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
