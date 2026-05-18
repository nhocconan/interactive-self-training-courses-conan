import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Card } from "@/components/ui";
import { upsertCourse } from "../actions";
import Link from "next/link";
import DeleteCourseButton from "./DeleteCourseButton";
import CourseForm from "./CourseForm";

const KIND_LABEL: Record<string, string> = {
  HTML: "HTML",
  VIDEO_FILE: "Video",
  VIDEO_EMBED: "Video URL",
  PDF: "PDF",
  PPTX: "PPTX",
  PPT: "PPT",
  SLIDES_GOOGLE: "Google Slides",
  MARKDOWN: "Markdown",
  SCORM: "SCORM",
};

export default async function AdminCourses() {
  await requireAdmin();
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      include: { category: true, _count: { select: { progress: true, enrollments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Courses</h1>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Add course</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Choose a content type below — HTML, Video (file or URL), PDF, PowerPoint, Google Slides, or Markdown.
        </p>
        <div className="mt-3">
          <CourseForm action={upsertCourse} categories={categories} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th>Type</th>
              <th>Category</th>
              <th>Source</th>
              <th>Enrolled</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{c.slug}</div>
                </td>
                <td className="px-4 py-3 text-xs"><Badge tone="primary">{KIND_LABEL[c.kind] ?? c.kind}</Badge></td>
                <td className="px-4 py-3">{c.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {c.kind === "HTML"
                    ? c.htmlPath
                    : c.contentUrl
                      ? c.contentUrl
                      : c.embedUrl
                        ? c.embedUrl.length > 48
                          ? c.embedUrl.slice(0, 48) + "…"
                          : c.embedUrl
                        : c.contentMd
                          ? "(inline markdown)"
                          : "—"}
                </td>
                <td className="px-4 py-3">{c._count.enrollments + c._count.progress}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {c.isPublished ? <Badge tone="success">Published</Badge> : <Badge>Hidden</Badge>}
                    {c.isMandatory && <Badge tone="warning">Mandatory</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/courses/${c.slug}`} className="text-xs text-[var(--muted-foreground)]">Preview</Link>
                    <Link href={`/admin/quizzes?courseId=${c.id}`} className="text-xs text-[var(--primary)]">+ Quiz</Link>
                    <DeleteCourseButton id={c.id} title={c.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
