"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { RefreshCw } from "lucide-react";
import { runLdapSync } from "../actions";

export default function LdapSyncButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ refreshed: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        onClick={() => {
          setError(null);
          start(async () => {
            try {
              const r = await runLdapSync();
              setResult(r);
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          });
        }}
        disabled={pending}
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Syncing…" : "Run sync now"}
      </Button>
      {result && (
        <p className="text-xs text-[var(--muted-foreground)]">
          Refreshed {result.refreshed} · failed {result.failed}
        </p>
      )}
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
