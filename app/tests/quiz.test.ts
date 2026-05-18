import { describe, it, expect } from "vitest";
import { gradeAnswer, gradeAttempt } from "@/lib/quiz";
import type { Question } from "@prisma/client";

const makeQ = (over: Partial<Question>): Question =>
  ({
    id: "q1",
    quizId: "Q",
    kind: "SINGLE_CHOICE",
    prompt: "?",
    options: ["A", "B", "C"] as unknown as object,
    answer: { index: 0 } as unknown as object,
    explanation: null,
    points: 1,
    sortOrder: 1,
    ...over,
  }) as Question;

describe("gradeAnswer", () => {
  it("single choice — correct", () => {
    const q = makeQ({});
    const g = gradeAnswer(q, { questionId: q.id, value: 0 });
    expect(g.correct).toBe(true);
    expect(g.awardedPoints).toBe(1);
  });
  it("single choice — wrong", () => {
    const q = makeQ({});
    const g = gradeAnswer(q, { questionId: q.id, value: 2 });
    expect(g.correct).toBe(false);
    expect(g.awardedPoints).toBe(0);
  });
  it("true / false", () => {
    const q = makeQ({ kind: "TRUE_FALSE", options: ["True", "False"] as unknown as object, answer: { index: 1 } as unknown as object });
    expect(gradeAnswer(q, { questionId: q.id, value: 1 }).correct).toBe(true);
    expect(gradeAnswer(q, { questionId: q.id, value: 0 }).correct).toBe(false);
  });
  it("multi-choice — partial credit (Jaccard)", () => {
    const q = makeQ({
      kind: "MULTI_CHOICE",
      points: 4,
      options: ["a", "b", "c", "d"] as unknown as object,
      answer: { indices: [0, 1, 3] } as unknown as object,
    });
    // perfect
    expect(gradeAnswer(q, { questionId: q.id, value: [0, 1, 3] }).awardedPoints).toBe(4);
    // 2 of 3 right, 1 extra wrong: inter=2, union=4 → 0.5 → 2 pts
    const g = gradeAnswer(q, { questionId: q.id, value: [0, 1, 2] });
    expect(g.correct).toBe(false);
    expect(g.awardedPoints).toBe(2);
  });
  it("fill-in-the-blank — case/whitespace insensitive", () => {
    const q = makeQ({
      kind: "FILL_BLANK",
      options: [] as unknown as object,
      answer: { accept: ["OAuth", "OAuth 2.0"] } as unknown as object,
    });
    expect(gradeAnswer(q, { questionId: q.id, value: "  oauth  " }).correct).toBe(true);
    expect(gradeAnswer(q, { questionId: q.id, value: "saml" }).correct).toBe(false);
  });
  it("short answer — accept list", () => {
    const q = makeQ({
      kind: "SHORT_ANSWER",
      options: [] as unknown as object,
      answer: { accept: ["evals", "evaluation"] } as unknown as object,
      points: 2,
    });
    expect(gradeAnswer(q, { questionId: q.id, value: "Evals" }).awardedPoints).toBe(2);
    expect(gradeAnswer(q, { questionId: q.id, value: "vibes" }).awardedPoints).toBe(0);
  });
});

describe("gradeAttempt", () => {
  it("scores percentage over total points", () => {
    const qs: Question[] = [
      makeQ({ id: "a", points: 2, answer: { index: 0 } as unknown as object }),
      makeQ({ id: "b", points: 3, answer: { index: 1 } as unknown as object }),
    ];
    const r = gradeAttempt(qs, [
      { questionId: "a", value: 0 },
      { questionId: "b", value: 0 },
    ]);
    expect(r.totalPoints).toBe(5);
    expect(r.gotPoints).toBe(2);
    expect(r.scorePct).toBe(40);
  });
});
