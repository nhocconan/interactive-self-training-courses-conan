"use client";
import { useActionState, useState } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { addProvider, type AddProviderState } from "../actions-ai";
import { CheckCircle2, AlertCircle, Plus, Loader2 } from "lucide-react";

const INITIAL: AddProviderState = { ok: null };

type Kind = "OPENAI" | "ANTHROPIC" | "GOOGLE" | "OPENAI_COMPATIBLE" | "OLLAMA";

const BASE_URL_HINT: Partial<Record<Kind, { label: string; placeholder: string; help: string }>> = {
  OPENAI_COMPATIBLE: {
    label: "Base URL",
    placeholder: "https://openrouter.ai/api/v1",
    help: "Any OpenAI-compatible /v1 endpoint.",
  },
  OLLAMA: {
    label: "Base URL",
    placeholder: "https://ollama.com",
    help: "Defaults to Ollama Cloud (Turbo / Pro). For self-hosted, use http://127.0.0.1:11434 (avoid “localhost” on machines where IPv6 resolves first).",
  },
};

const API_KEY_HINT: Partial<Record<Kind, string>> = {
  OLLAMA: "Required for Ollama Cloud (Turbo). Leave blank for self-hosted Ollama with no auth.",
};

export default function AddProviderForm() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("OPENAI");
  const [state, formAction, pending] = useActionState(addProvider, INITIAL);

  const urlHint = BASE_URL_HINT[kind];
  const keyHint = API_KEY_HINT[kind];

  return (
    <Card className="p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="font-semibold inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add AI provider
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            OpenAI · Anthropic · Google Gemini · Ollama (Cloud + self-hosted) · OpenAI-compatible
          </div>
        </div>
      </button>

      {open && (
        <form action={formAction} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Display name</Label>
              <Input name="name" placeholder="Ollama Turbo · team" required />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as Kind)}
              >
                <option value="OPENAI">OpenAI</option>
                <option value="ANTHROPIC">Anthropic</option>
                <option value="GOOGLE">Google Gemini</option>
                <option value="OLLAMA">Ollama (Cloud / self-hosted)</option>
                <option value="OPENAI_COMPATIBLE">OpenAI-compatible</option>
              </Select>
            </div>
            <div>
              <Label>API key {kind === "OLLAMA" ? <span className="text-[var(--muted-foreground)]">(optional for local)</span> : null}</Label>
              <Input
                name="apiKey"
                type="password"
                placeholder={kind === "OLLAMA" ? "ollama-…" : "sk-…"}
                required={kind !== "OLLAMA"}
              />
              {keyHint && <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{keyHint}</p>}
            </div>
            {urlHint && (
              <div>
                <Label>{urlHint.label}</Label>
                <Input name="baseUrl" placeholder={urlHint.placeholder} />
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{urlHint.help}</p>
              </div>
            )}
          </div>

          {/* Result strip — only shown after first submit */}
          {state.ok === true && (
            <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-3 py-2 text-sm text-[var(--success)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Verified &amp; saved “{state.name}”.</div>
                <div className="text-xs opacity-80">{state.modelCount} models cached.</div>
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
              The connection is tested before anything is written. If the test fails, no credentials are stored.
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing…
                </>
              ) : (
                "Add & verify"
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
