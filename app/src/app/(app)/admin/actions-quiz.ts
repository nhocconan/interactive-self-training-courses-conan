"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import type { QuestionKind } from "@prisma/client";

const KindEnum = z.enum([
  "SINGLE_CHOICE", "MULTI_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER",
]);

export async function createQuiz(form: FormData) {
  const s = await requireAdmin();
  const courseId = String(form.get("courseId") || "");
  const title = String(form.get("title") || "").trim() || "Assessment";
  const description = String(form.get("description") || "").trim() || null;
  const passPercent = Number(form.get("passPercent") || 70);
  const maxAttempts = Number(form.get("maxAttempts") || 0) || null;
  const timeLimitSec = Number(form.get("timeLimitSec") || 0) || null;
  const shuffle = form.get("shuffle") === "on";
  if (!courseId) throw new Error("courseId required");
  const quiz = await prisma.quiz.create({
    data: { courseId, title, description, passPercent, maxAttempts, timeLimitSec, shuffle },
  });
  await audit({ actorId: s.user.id, action: "quiz.create", target: quiz.id, after: { courseId, title } });
  revalidatePath(`/admin/quizzes/${quiz.id}`);
  return quiz.id;
}

const QuestionInput = z.object({
  kind: KindEnum,
  prompt: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer: z.union([
    z.object({ index: z.number().int() }),
    z.object({ indices: z.array(z.number().int()) }),
    z.object({ accept: z.array(z.string()) }),
  ]),
  explanation: z.string().optional().nullable(),
  points: z.number().int().min(1).max(20).default(1),
});

export async function upsertQuestion(quizId: string, raw: unknown, questionId?: string) {
  const s = await requireAdmin();
  const parsed = QuestionInput.parse(raw);
  const sortOrder =
    (await prisma.question.count({ where: { quizId } })) + 1;
  if (questionId) {
    await prisma.question.update({
      where: { id: questionId },
      data: {
        kind: parsed.kind as QuestionKind,
        prompt: parsed.prompt,
        options: parsed.options as unknown as object,
        answer: parsed.answer as unknown as object,
        explanation: parsed.explanation ?? null,
        points: parsed.points,
      },
    });
    await audit({ actorId: s.user.id, action: "question.update", target: questionId });
  } else {
    const q = await prisma.question.create({
      data: {
        quizId,
        kind: parsed.kind as QuestionKind,
        prompt: parsed.prompt,
        options: parsed.options as unknown as object,
        answer: parsed.answer as unknown as object,
        explanation: parsed.explanation ?? null,
        points: parsed.points,
        sortOrder,
      },
    });
    await audit({ actorId: s.user.id, action: "question.create", target: q.id });
  }
  revalidatePath(`/admin/quizzes/${quizId}`);
}

export async function deleteQuestion(quizId: string, questionId: string) {
  const s = await requireAdmin();
  await prisma.question.delete({ where: { id: questionId } });
  await audit({ actorId: s.user.id, action: "question.delete", target: questionId });
  revalidatePath(`/admin/quizzes/${quizId}`);
}

export async function deleteQuiz(quizId: string) {
  const s = await requireAdmin();
  await prisma.quiz.delete({ where: { id: quizId } });
  await audit({ actorId: s.user.id, action: "quiz.delete", target: quizId });
  revalidatePath(`/admin/quizzes`);
}
