"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { refreshModels } from "../actions-ai";
import { RefreshCw } from "lucide-react";

export default function RefreshModelsButton({ providerId }: { providerId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const n = await refreshModels(providerId);
              setMsg(`✓ ${n} models`);
            } catch (e: unknown) {
              setMsg("✗ " + (e instanceof Error ? e.message.slice(0, 80) : "failed"));
            }
          })
        }
      >
        <RefreshCw className={"h-3.5 w-3.5 " + (pending ? "animate-spin" : "")} />
        Fetch models
      </Button>
      {msg && <span className="text-[11px] text-[var(--muted-foreground)]">{msg}</span>}
    </span>
  );
}
