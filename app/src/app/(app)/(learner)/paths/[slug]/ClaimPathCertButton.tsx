"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import { Button } from "@/components/ui";

export function ClaimPathCertButton({ pathId }: { pathId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await fetch("/api/paths/claim-cert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pathId }),
            });
            if (!r.ok) {
              const j = await r.json().catch(() => null);
              setErr(j?.error || "could-not-issue");
              return;
            }
            router.refresh();
          })
        }
      >
        <Award className="h-3.5 w-3.5" /> {pending ? "Issuing…" : "Claim certificate"}
      </Button>
      {err && <span className="text-xs text-[var(--danger)]">{err}</span>}
    </>
  );
}
