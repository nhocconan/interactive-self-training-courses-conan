"use client";
import { useActionState, useState, useTransition } from "react";
import { Badge, Button, Input, Label } from "@/components/ui";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Trash2, X } from "lucide-react";
import RefreshModelsButton from "./RefreshModelsButton";
import {
  deleteProvider,
  toggleProvider,
  updateProvider,
  type UpdateProviderState,
} from "../actions-ai";

type ProviderView = {
  id: string;
  name: string;
  kind: string;
  baseUrl: string | null;
  isEnabled: boolean;
  modelCount: number;
  modelsCachedAt: string | null;
  apiKeyMasked: string;
};

const INITIAL: UpdateProviderState = { ok: null };

export default function ProviderRow({ provider }: { provider: ProviderView }) {
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(provider.isEnabled);
  const [state, formAction, pending] = useActionState(updateProvider, INITIAL);
  const [togglePending, startToggle] = useTransition();
  const [deletePending, startDelete] = useTransition();

  return (
    <>
      <tr className="border-t align-top">
        <td className="px-4 py-3 font-medium">{provider.name}</td>
        <td className="px-4 py-3">
          <Badge>{provider.kind}</Badge>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">
          {provider.apiKeyMasked || "(unreadable)"}
        </td>
        <td className="px-4 py-3">
          <div className="text-xs">{provider.modelCount} models</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {provider.modelsCachedAt ? new Date(provider.modelsCachedAt).toLocaleString() : "never"}
          </div>
        </td>
        <td className="px-4 py-3">
          {provider.isEnabled ? (
            <Badge tone="success">Enabled</Badge>
          ) : (
            <Badge tone="danger">Off</Badge>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant={editing ? "subtle" : "outline"}
              size="sm"
              onClick={() => setEditing((o) => !o)}
            >
              {editing ? (
                <>
                  <X className="h-3.5 w-3.5" /> Cancel
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </>
              )}
            </Button>
            <RefreshModelsButton providerId={provider.id} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={togglePending}
              onClick={() =>
                startToggle(async () => {
                  await toggleProvider(provider.id, !provider.isEnabled);
                })
              }
            >
              {provider.isEnabled ? "Disable" : "Enable"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Delete"
              disabled={deletePending}
              onClick={() => {
                if (!confirm(`Delete provider "${provider.name}"? This also clears any feature mappings using it.`)) return;
                startDelete(async () => {
                  await deleteProvider(provider.id);
                });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-t bg-[var(--muted)]/30">
          <td colSpan={6} className="px-4 py-4">
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="providerId" value={provider.id} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Display name</Label>
                  <Input name="name" defaultValue={provider.name} required />
                </div>
                <div>
                  <Label>Base URL</Label>
                  <Input name="baseUrl" defaultValue={provider.baseUrl ?? ""} placeholder="(provider default)" />
                </div>
                <div>
                  <Label>
                    New API key{" "}
                    <span className="text-[var(--muted-foreground)]">(leave blank to keep current)</span>
                  </Label>
                  <Input name="apiKey" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label>Status</Label>
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isEnabled"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
                    />
                    <span>{enabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
              </div>

              {state.ok === true && (
                <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-3 py-2 text-sm text-[var(--success)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-medium">Saved “{state.name}”.</div>
                    <div className="text-xs opacity-80">
                      {state.retested
                        ? `Credentials re-tested · ${state.modelCount} models cached.`
                        : "No credentials change — saved without re-test."}
                    </div>
                  </div>
                </div>
              )}
              {state.ok === false && state.error && (
                <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_oklab,var(--danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-medium">Not saved.</div>
                    <div className="text-xs opacity-90">{state.error}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Changing the API key or Base URL triggers a re-test before the change is persisted.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
