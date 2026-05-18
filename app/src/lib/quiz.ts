import type { Question } from "@prisma/client";

export type QuestionKind =
  | "SINGLE_CHOICE"
  | "MULTI_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER";

type AnswerSchema =
  | { index: number }
  | { indices: number[] }
  | { accept: string[] };

export type LearnerAnswer = {
  questionId: string;
  value: string | number | number[] | null;
};

export type GradedAnswer = LearnerAnswer & {
  correct: boolean;
  awardedPoints: number;
  maxPoints: number;
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function gradeAnswer(q: Question, given: LearnerAnswer): GradedAnswer {
  const a = (q.answer as unknown) as AnswerSchema;
  const max = Math.max(1, q.points);
  let correct = false;
  let awarded = 0;

  switch (q.kind) {
    case "SINGLE_CHOICE":
    case "TRUE_FALSE": {
      const idx = typeof given.value === "number" ? given.value : Number(given.value);
      correct = "index" in a && Number.isFinite(idx) && idx === a.index;
      awarded = correct ? max : 0;
      break;
    }
    case "MULTI_CHOICE": {
      const want = "indices" in a ? [...a.indices].sort() : [];
      const got = Array.isArray(given.value)
        ? [...given.value].map(Number).sort()
        : [];
      // partial-credit: per-option accuracy, simple Jaccard
      const wantSet = new Set(want);
      const gotSet = new Set(got);
      const union = new Set([...wantSet, ...gotSet]);
      const inter = [...wantSet].filter((x) => gotSet.has(x)).length;
      const ratio = union.size === 0 ? 1 : inter / union.size;
      awarded = Math.round(max * ratio);
      correct = ratio === 1;
      break;
    }
    case "FILL_BLANK":
    case "SHORT_ANSWER": {
      const accept = "accept" in a ? a.accept.map(normalize) : [];
      const got = typeof given.value === "string" ? normalize(given.value) : "";
      correct = !!got && accept.includes(got);
      awarded = correct ? max : 0;
      break;
    }
  }

  return { ...given, correct, awardedPoints: awarded, maxPoints: max };
}

export function gradeAttempt(
  questions: Question[],
  answers: LearnerAnswer[],
): { graded: GradedAnswer[]; scorePct: number; totalPoints: number; gotPoints: number } {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const graded = answers
    .filter((a) => byId.has(a.questionId))
    .map((a) => gradeAnswer(byId.get(a.questionId)!, a));
  const totalPoints = questions.reduce((n, q) => n + Math.max(1, q.points), 0);
  const gotPoints = graded.reduce((n, g) => n + g.awardedPoints, 0);
  const scorePct = totalPoints === 0 ? 0 : Math.round((gotPoints / totalPoints) * 100);
  return { graded, scorePct, totalPoints, gotPoints };
}
