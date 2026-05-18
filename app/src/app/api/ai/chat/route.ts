import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canAccessCourse } from "@/lib/access";
import { runFeature } from "@/lib/ai/registry";
import { loadCourseText } from "@/lib/ai/course-context";

const Body = z.object({
  courseId: z.string().min(1),
  mode: z.enum(["chat", "summary", "explain"]).default("chat"),
  message: z.string().min(1).max(2000).optional(),
  selection: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  const { courseId, mode, message, selection } = parsed.data;
  if (!(await canAccessCourse(session.user.id, session.user.role, courseId)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ctx = await loadCourseText(courseId);
  if (!ctx) return NextResponse.json({ error: "course-not-found" }, { status: 404 });

  const sys = `You are the Demo Learning AI assistant. You answer **only** based on the course content provided below. If the answer isn't in the content, say so and suggest where to look. Reply in the same language as the question (Vietnamese or English). Keep answers concise and clear.

COURSE TITLE: ${ctx.title}

COURSE CONTENT:
${ctx.text}`;

  let prompt: string;
  let feature: "CHAT" | "SUMMARY" | "EXPLAIN";
  if (mode === "summary") {
    feature = "SUMMARY";
    prompt = "Summarize this course in 5 bullet points. End with one practical next-step the learner should take.";
  } else if (mode === "explain") {
    feature = "EXPLAIN";
    prompt = `Explain the following concept from the course in plain English, beginner-friendly, with one example:\n\n"${selection ?? ""}"`;
  } else {
    feature = "CHAT";
    prompt = message ?? "";
    if (!prompt) return NextResponse.json({ error: "empty-message" }, { status: 400 });
  }

  try {
    const r = await runFeature({
      feature,
      userId: session.user.id,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      maxTokens: mode === "summary" ? 500 : 700,
    });
    return NextResponse.json({ ok: true, content: r.content, model: r.model });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ai-failed" },
      { status: 502 },
    );
  }
}
