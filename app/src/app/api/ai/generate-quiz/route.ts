import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runFeature } from "@/lib/ai/registry";
import { loadCourseText } from "@/lib/ai/course-context";
import type { QuestionKind } from "@prisma/client";

const Body = z.object({
  quizId: z.string().min(1),
  courseId: z.string().min(1),
  count: z.number().int().min(1).max(20),
});

const QuestionShape = z.object({
  kind: z.enum(["SINGLE_CHOICE", "MULTI_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER"]),
  prompt: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer: z.union([
    z.object({ index: z.number().int() }),
    z.object({ indices: z.array(z.number().int()) }),
    z.object({ accept: z.array(z.string()) }),
  ]),
  explanation: z.string().optional(),
  points: z.number().int().min(1).max(5).default(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const ctx = await loadCourseText(parsed.data.courseId, 10_000);
  if (!ctx) return NextResponse.json({ error: "course-not-found" }, { status: 404 });

  const sys = `You generate quiz questions for an enterprise learning platform.
Return STRICT JSON: an array of question objects.
Each object has: kind (one of SINGLE_CHOICE | MULTI_CHOICE | TRUE_FALSE | FILL_BLANK | SHORT_ANSWER),
prompt (string), options (string[] — empty for FILL_BLANK/SHORT_ANSWER),
answer (one of {"index":n}, {"indices":[n,...]}, {"accept":["s",...]}),
explanation (string), points (1-3).
Mix kinds. Use only facts in the course. No markdown, no commentary — JSON only.`;

  const user = `Generate ${parsed.data.count} questions from this course.

COURSE TITLE: ${ctx.title}

COURSE CONTENT:
${ctx.text}`;

  let content = "";
  try {
    const r = await runFeature({
      feature: "QUIZ_GENERATION",
      userId: session.user.id,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      maxTokens: 2200,
    });
    content = r.content.trim();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ai-failed" }, { status: 502 });
  }
  // try to extract JSON
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) return NextResponse.json({ error: "no-json", raw: content.slice(0, 200) }, { status: 502 });

  let arr: unknown;
  try {
    arr = JSON.parse(m[0]);
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 502 });
  }
  const list = z.array(QuestionShape).safeParse(arr);
  if (!list.success) return NextResponse.json({ error: "schema-mismatch", details: list.error.issues.slice(0, 5) }, { status: 502 });

  const base = await prisma.question.count({ where: { quizId: parsed.data.quizId } });
  let added = 0;
  for (const q of list.data) {
    await prisma.question.create({
      data: {
        quizId: parsed.data.quizId,
        kind: q.kind as QuestionKind,
        prompt: q.prompt,
        options: q.options as unknown as object,
        answer: q.answer as unknown as object,
        explanation: q.explanation ?? null,
        points: q.points,
        sortOrder: base + added + 1,
      },
    });
    added++;
  }
  return NextResponse.json({ ok: true, added });
}
