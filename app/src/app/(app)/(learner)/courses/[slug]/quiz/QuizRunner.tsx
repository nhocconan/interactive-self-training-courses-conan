"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, ProgressBar, Textarea } from "@/components/ui";
import { CheckCircle2, XCircle, Timer } from "lucide-react";

type Q = {
  id: string;
  kind: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "SHORT_ANSWER";
  prompt: string;
  options: string[];
  points: number;
};

export default function QuizRunner({
  quiz,
}: {
  quiz: { id: string; passPercent: number; timeLimitSec: number | null; shuffle: boolean; questions: Q[] };
}) {
  const router = useRouter();
  const questions = useMemo(() => {
    if (!quiz.shuffle) return quiz.questions;
    const arr = [...quiz.questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [quiz]);

  const [answers, setAnswers] = useState<Record<string, string | number | number[]>>({});
  const [submitted, setSubmitted] = useState<null | {
    scorePct: number; passed: boolean; perQuestion: Record<string, { correct: boolean; awardedPoints: number; maxPoints: number }>;
  }>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Open the attempt server-side as soon as the runner mounts. The server
  // records `startedAt`, so the timer is enforced regardless of the client.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id }),
      });
      const j = await r.json().catch(() => null);
      if (cancelled) return;
      if (!r.ok || !j?.attemptId) {
        setStartError(j?.error || "could-not-start");
        return;
      }
      setAttemptId(j.attemptId);
      if (j.timeLimitSec) {
        const elapsed = Math.floor((Date.now() - new Date(j.startedAt).getTime()) / 1000);
        setRemaining(Math.max(0, j.timeLimitSec - elapsed));
      }
    })();
    return () => { cancelled = true; };
  }, [quiz.id]);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => (r === null ? r : r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  useEffect(() => {
    if (remaining === 0 && !submitted) submit();
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (pending || submitted) return;
    setPending(true);
    const payload = {
      quizId: quiz.id,
      attemptId: attemptId ?? undefined,
      answers: questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? null })),
    };
    const r = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) {
      alert("Submission failed: " + (j?.error || r.statusText));
      return;
    }
    const perQuestion: Record<string, { correct: boolean; awardedPoints: number; maxPoints: number }> = {};
    for (const g of ((j.graded ?? []) as { questionId: string; correct: boolean; awardedPoints: number; maxPoints: number }[])) {
      perQuestion[g.questionId] = { correct: g.correct, awardedPoints: g.awardedPoints, maxPoints: g.maxPoints };
    }
    setSubmitted({ scorePct: j.scorePct, passed: !!j.passed, perQuestion });
    setTimeout(() => router.refresh(), 600);
  }

  const answered = Object.keys(answers).length;
  const progressPct = Math.round((answered / questions.length) * 100);

  if (startError === "max-attempts") {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold">Max attempts reached</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Ask your admin if you need to retake this quiz.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-baseline justify-between text-xs text-[var(--muted-foreground)]">
              <span>Answered</span>
              <span>{answered}/{questions.length}</span>
            </div>
            <ProgressBar value={progressPct} />
          </div>
          {remaining !== null && (
            <div className="inline-flex items-center gap-1 rounded-full border bg-[var(--card)] px-3 py-1 text-xs font-mono">
              <Timer className="h-3.5 w-3.5" /> {formatTime(remaining)}
            </div>
          )}
        </div>
      </Card>

      {questions.map((q, i) => {
        const result = submitted?.perQuestion[q.id];
        return (
          <Card key={q.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">Q{i + 1}. {q.prompt}</div>
              {result && (
                <span className={`inline-flex items-center gap-1 text-xs ${result.correct ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {result.correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {result.awardedPoints}/{result.maxPoints}
                </span>
              )}
            </div>
            {q.kind === "SHORT_ANSWER" ? (
              <Textarea
                disabled={!!submitted}
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            ) : q.kind === "FILL_BLANK" ? (
              <Input
                disabled={!!submitted}
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Your answer"
              />
            ) : (
              <div className="space-y-1.5">
                {q.options.map((opt, idx) => {
                  const isMulti = q.kind === "MULTI_CHOICE";
                  const checked = isMulti
                    ? Array.isArray(answers[q.id]) && (answers[q.id] as number[]).includes(idx)
                    : answers[q.id] === idx;
                  return (
                    <label
                      key={idx}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        checked ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]" : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        disabled={!!submitted}
                        name={`q-${q.id}`}
                        checked={!!checked}
                        onChange={() => {
                          if (isMulti) {
                            const arr = Array.isArray(answers[q.id]) ? [...(answers[q.id] as number[])] : [];
                            const has = arr.includes(idx);
                            setAnswers((a) => ({ ...a, [q.id]: has ? arr.filter((x) => x !== idx) : [...arr, idx] }));
                          } else {
                            setAnswers((a) => ({ ...a, [q.id]: idx }));
                          }
                        }}
                        className="accent-[var(--primary)]"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      <div className="sticky bottom-3 z-10 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-3 backdrop-blur">
        {submitted ? (
          <div className="flex items-center gap-3 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${submitted.passed ? "bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-[var(--success)]" : "bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] text-[var(--danger)]"}`}>
              {submitted.passed ? "Passed" : "Did not pass"}
            </span>
            <span>Score: <b>{submitted.scorePct}%</b> (need {quiz.passPercent}%)</span>
          </div>
        ) : <div className="text-xs text-[var(--muted-foreground)]">Answer everything you can — partial credit on multi-choice.</div>}
        <div className="flex gap-2">
          {submitted ? (
            <Button onClick={() => location.reload()}>Try again</Button>
          ) : (
            <Button onClick={submit} disabled={pending || answered === 0}>{pending ? "Submitting…" : "Submit"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
