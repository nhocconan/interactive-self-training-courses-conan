"use client";
import { useState, useTransition } from "react";
import type { AiFeatureKey, AiProvider } from "@prisma/client";
import { Button, Select } from "@/components/ui";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { clearFeatureChoice, setFeatureChain } from "../actions-ai";

type Slot = { providerId: string; model: string };

export default function FeatureMappingRow({
  feature,
  title,
  hint,
  providers,
  current,
}: {
  feature: AiFeatureKey;
  title: string;
  hint: string;
  providers: AiProvider[];
  /** Ordered: index 0 = primary, 1+ = fallbacks. */
  current: Slot[];
}) {
  const [slots, setSlots] = useState<Slot[]>(
    current.length ? current : [{ providerId: "", model: "" }],
  );
  const [pending, start] = useTransition();
  const [clearing, startClear] = useTransition();

  const enabled = providers.filter((p) => p.isEnabled);

  function setSlot(idx: number, patch: Partial<Slot>) {
    setSlots((s) => s.map((slot, i) => (i === idx ? { ...slot, ...patch } : slot)));
  }
  function addSlot() {
    setSlots((s) => [...s, { providerId: "", model: "" }]);
  }
  function removeSlot(idx: number) {
    setSlots((s) => (s.length <= 1 ? [{ providerId: "", model: "" }] : s.filter((_, i) => i !== idx)));
  }

  // Validate: every slot must be fully filled before save is allowed.
  const valid =
    slots.every((s) => s.providerId && s.model) && slots.length > 0;
  const isConfigured = current.length > 0;

  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      data-testid={`feature-mapping-${feature}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{hint}</div>
        </div>
        {isConfigured ? (
          <span className="rounded-full bg-[color-mix(in_oklab,var(--success)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--success)]">
            {current.length} configured
          </span>
        ) : (
          <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
            not set
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {slots.map((slot, idx) => {
          const provider = providers.find((p) => p.id === slot.providerId);
          const models = (provider?.modelsCache as unknown as { id: string }[]) ?? [];
          return (
            <div
              key={idx}
              className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"
            >
              <div className="flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                <GripVertical className="h-3 w-3 opacity-50" />
                {idx === 0 ? "Primary" : `Fallback ${idx}`}
              </div>
              <Select
                value={slot.providerId}
                onChange={(e) => setSlot(idx, { providerId: e.target.value, model: "" })}
              >
                <option value="">Pick provider…</option>
                {enabled.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select
                value={slot.model}
                onChange={(e) => setSlot(idx, { model: e.target.value })}
                disabled={!slot.providerId}
              >
                <option value="">{slot.providerId ? "Pick model…" : "—"}</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title={slots.length > 1 ? "Remove" : "Reset row"}
                onClick={() => removeSlot(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={addSlot}>
          <Plus className="h-3.5 w-3.5" /> Add fallback
        </Button>
        <div className="flex gap-2">
          {isConfigured && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={clearing}
              onClick={() =>
                startClear(async () => {
                  await clearFeatureChoice(feature);
                  setSlots([{ providerId: "", model: "" }]);
                })
              }
            >
              {clearing ? "Clearing…" : "Disable feature"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={pending || !valid}
            onClick={() =>
              start(async () => {
                await setFeatureChain(feature, slots);
              })
            }
          >
            {pending ? "Saving…" : "Save chain"}
          </Button>
        </div>
      </div>
    </div>
  );
}
