"use client";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { Sparkles, MessageCircle, BookOpen, Wand2 } from "lucide-react";

type Mode = "chat" | "summary" | "explain";

export function AiCoursePanel({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [out, setOut] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function send(m: Mode = mode, payloadInput?: string) {
    setErr(null);
    setPending(true);
    const userMsg = payloadInput ?? input;
    if (m === "chat" && !userMsg.trim()) { setPending(false); return; }
    setMode(m);
    if (m === "chat") setOut((o) => [...o, { role: "user", content: userMsg }]);
    setInput("");
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          mode: m,
          message: m === "chat" ? userMsg : undefined,
          selection: m === "explain" ? userMsg : undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "AI failed");
      setOut((o) => [...o, { role: "assistant", content: j.content }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI failed");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-pop)] hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> Ask AI about this course
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(420px,calc(100vw-2rem))]">
      <Card className="flex max-h-[78vh] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2">
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[var(--primary)]" /> Course AI</div>
          <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Close</button>
        </div>
        <div className="flex gap-1 border-b border-[var(--border)] px-3 py-2">
          {(["chat", "summary", "explain"] as Mode[]).map((m) => {
            const Icon = m === "chat" ? MessageCircle : m === "summary" ? BookOpen : Wand2;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); if (m === "summary") send("summary"); }}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${mode === m ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
              >
                <Icon className="h-3 w-3" /> {m === "chat" ? "Chat" : m === "summary" ? "Summarize" : "Explain"}
              </button>
            );
          })}
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
          {out.length === 0 && (
            <p className="text-[var(--muted-foreground)]">
              {mode === "chat" && "Ask anything about this course."}
              {mode === "summary" && "Click Summarize to get a 5-bullet recap."}
              {mode === "explain" && "Paste a concept or sentence to get a beginner-friendly explanation."}
            </p>
          )}
          {out.map((m, i) => (
            <div key={i} className={`rounded-lg p-3 ${m.role === "user" ? "bg-[var(--muted)] text-[var(--foreground)]" : "bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"}`}>
              <div className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{m.role}</div>
              <div className="mt-0.5 whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          ))}
          {pending && <div className="rounded-lg bg-[var(--muted)] p-3 text-xs text-[var(--muted-foreground)]">Thinking…</div>}
          {err && <div className="rounded-lg bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-3 text-xs text-[var(--danger)]">{err}</div>}
        </div>
        {mode !== "summary" && (
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-[var(--border)] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "chat" ? "Ask about this course…" : "Paste a sentence or concept…"}
              className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <Button type="submit" disabled={pending} size="sm">Send</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
