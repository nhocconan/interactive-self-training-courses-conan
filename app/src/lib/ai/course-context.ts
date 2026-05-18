import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const COURSES_DIR = path.resolve(process.cwd(), process.env.COURSES_DIR || "../courses");

/** Strip HTML tags + collapse whitespace; cap to maxChars characters. */
export function htmlToText(html: string, maxChars = 12_000): string {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const noTags = noScript.replace(/<[^>]+>/g, " ");
  const normalised = noTags.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return normalised.length > maxChars ? normalised.slice(0, maxChars) + "…(truncated)" : normalised;
}

export async function loadCourseText(courseId: string, maxChars = 12_000): Promise<{ title: string; text: string } | null> {
  const c = await prisma.course.findUnique({ where: { id: courseId } });
  if (!c) return null;
  const target = path.resolve(COURSES_DIR, c.htmlPath);
  if (!target.startsWith(COURSES_DIR + path.sep)) return null;
  try {
    const raw = await fs.readFile(target, "utf8");
    return { title: c.title, text: htmlToText(raw, maxChars) };
  } catch {
    return null;
  }
}
