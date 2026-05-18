"use client";
import { useState, useTransition } from "react";
import type { Question, QuestionKind } from "@prisma/client";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { upsertQuestion, deleteQuestion } from "../../actions-quiz";
import { Trash2, Save, Plus } from "lucide-react";

type Editable = {
  kind: QuestionKind;
  prompt: string;
  options: string[];
  // for choice: which indices are correct
  correctIdx: number[];
  // for fill-blank / short-answer
  accept: string[];
  explanation: string;
  points: number;
};

function fromQuestion(q: Question): Editable {
  const a = (q.answer as unknown) as
    | { index: number }
    | { indices: number[] }
    | { accept: string[] };
  return {
    kind: q.kind,
    prompt: q.prompt,
    options: ((q.options as unknown) as string[]) ?? [],
    correctIdx:
      "index" in a ? [a.index] : "indices" in a ? a.indices : [],
    accept: "accept" in a ? a.accept : [],
    explanation: q.explanation ?? "",
    points: q.points,
  };
}

const blank = (): Editable => ({
  kind: "SINGLE_CHOICE",
  prompt: "",
  options: ["", "", "", ""],
  correctIdx: [],
  accept: [],
  explanation: "",
  points: 1,
});

export default function QuestionEditor({
  quizId,
  index,
  initial,
}: {
  quizId: string;
  index: number;
  initial: Question | null;
}) {
  const [data, setData] = useState<Editable>(initial ? fromQuestion(initial) : blank());
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const isChoice =
    data.kind === "SINGLE_CHOICE" ||
    data.kind === "MULTI_CHOICE" ||
    data.kind === "TRUE_FALSE";
  const isTextAns = data.kind === "FILL_BLANK" || data.kind === "SHORT_ANSWER";

  function setKind(k: QuestionKind) {
    setData((d) => {
      const next: Editable = { ...d, kind: k, correctIdx: [], accept: [] };
      if (k === "TRUE_FALSE") next.options = ["True", "False"];
      else if (next.options.length < 2 && (k === "SINGLE_CHOICE" || k === "MULTI_CHOICE"))
        next.options = ["", "", "", ""];
      return next;
    });
  }

  function buildPayload() {
    let answer: object;
    if (data.kind === "MULTI_CHOICE") {
      answer = { indices: [...data.correctIdx].sort() };
    } else if (data.kind === "SINGLE_CHOICE" || data.kind === "TRUE_FALSE") {
      answer = { index: data.correctIdx[0] ?? 0 };
    } else {
      answer = { accept: data.accept.filter(Boolean) };
    }
    return {
      kind: data.kind,
      prompt: data.prompt,
      options: isChoice ? data.options.filter((o) => o.trim() !== "") : [],
      answer,
      explanation: data.explanation || null,
      points: data.points,
    };
  }

  function save() {
    if (!data.prompt.trim()) { setMsg("Prompt required"); return; }
    start(async () => {
      try {
        await upsertQuestion(quizId, buildPayload(), initial?.id);
        setMsg("Saved.");
        if (!initial) setData(blank());
      } catch (e) {
        setMsg("Failed: " + (e instanceof Error ? e.message : "unknown"));
      }
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge>Q{index + 1}</Badge>
          <Select
            value={data.kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
            className="h-8 text-xs"
          >
            <option value="SINGLE_CHOICE">Single choice</option>
            <option value="MULTI_CHOICE">Multiple choice</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_BLANK">Fill in the blank</option>
            <option value="SHORT_ANSWER">Short answer</option>
          </Select>
          <Input
            type="number"
            value={data.points}
            onChange={(e) => setData({ ...data, points: Math.max(1, Number(e.target.value || 1)) })}
            className="h-8 w-20 text-xs"
            title="Points"
          />
        </div>
        <div className="flex items-center gap-2">
          {initial && (
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => { await deleteQuestion(quizId, initial.id); })}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={pending}>
            {initial ? <><Save className="h-3.5 w-3.5" />Save</> : <><Plus className="h-3.5 w-3.5" />Add</>}
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <Label>Prompt</Label>
          <Textarea value={data.prompt} onChange={(e) => setData({ ...data, prompt: e.target.value })} />
        </div>

        {isChoice && (
          <div className="space-y-2">
            <Label>Options</Label>
            {data.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={data.kind === "MULTI_CHOICE" ? "checkbox" : "radio"}
                  checked={data.correctIdx.includes(i)}
                  onChange={() => {
                    if (data.kind === "MULTI_CHOICE") {
                      const has = data.correctIdx.includes(i);
                      setData({ ...data, correctIdx: has ? data.correctIdx.filter((x) => x !== i) : [...data.correctIdx, i] });
                    } else {
                      setData({ ...data, correctIdx: [i] });
                    }
                  }}
                  className="accent-[var(--primary)]"
                />
                <Input
                  value={o}
                  onChange={(e) => {
                    const next = [...data.options];
                    next[i] = e.target.value;
                    setData({ ...data, options: next });
                  }}
                  placeholder={`Option ${i + 1}`}
                  disabled={data.kind === "TRUE_FALSE"}
                />
                {data.kind !== "TRUE_FALSE" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setData({ ...data, options: data.options.filter((_, j) => j !== i), correctIdx: data.correctIdx.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {data.kind !== "TRUE_FALSE" && (
              <Button variant="ghost" size="sm" onClick={() => setData({ ...data, options: [...data.options, ""] })}>
                + Add option
              </Button>
            )}
          </div>
        )}

        {isTextAns && (
          <div>
            <Label>Accepted answers (one per line, case-insensitive)</Label>
            <Textarea
              value={data.accept.join("\n")}
              onChange={(e) => setData({ ...data, accept: e.target.value.split("\n") })}
              placeholder="OAuth&#10;OAuth2&#10;OAuth 2.0"
            />
          </div>
        )}

        <div>
          <Label>Explanation (shown after submission)</Label>
          <Input value={data.explanation} onChange={(e) => setData({ ...data, explanation: e.target.value })} />
        </div>

        {msg && <div className="text-xs text-[var(--muted-foreground)]">{msg}</div>}
      </div>
    </Card>
  );
}
