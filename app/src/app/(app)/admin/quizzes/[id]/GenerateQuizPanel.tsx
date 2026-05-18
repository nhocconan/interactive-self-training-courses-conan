"use client";
import { useState, useTransition } from "react";
import { Button, Card, Input } from "@/components/ui";
import { Sparkles } from "lucide-react";

export default function GenerateQuizPanel({ quizId, courseId }: { quizId: string; courseId: string }) {
  const [n, setN] = useState(8);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[var(--primary)]" /> Generate questions from course content</div>
          <div className="text-xs text-[var(--muted-foreground)]">Uses your configured AI provider. Generated questions appear below; you can edit before publishing.</div>
        </div>
        <div className="flex items-center gap-2">
          <Input type="number" value={n} min={1} max={20} onChange={(e) => setN(Number(e.target.value || 8))} className="h-9 w-24" />
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                setMsg("Generating…");
                const r = await fetch("/api/ai/generate-quiz", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ quizId, courseId, count: n }),
                });
                const j = await r.json().catch(() => null);
                if (!r.ok) { setMsg("✗ " + (j?.error || "failed")); return; }
                setMsg(`✓ Added ${j.added} questions. Reload to see them.`);
                setTimeout(() => location.reload(), 700);
              })
            }
          >
            {pending ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>
      {msg && <div className="mt-2 text-xs text-[var(--muted-foreground)]">{msg}</div>}
    </Card>
  );
}
