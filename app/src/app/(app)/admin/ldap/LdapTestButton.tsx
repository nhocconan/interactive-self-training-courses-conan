"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

export default function LdapTestButton() {
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const r = await fetch("/api/admin/ldap/test", { method: "POST" });
            const j = await r.json();
            setResult(j.ok ? "✓ Bind succeeded" : `✗ ${j.error || "Failed"}`);
          });
        }}
      >
        {pending ? "Testing…" : "Test connection"}
      </Button>
      {result && <span className="text-xs">{result}</span>}
    </div>
  );
}
