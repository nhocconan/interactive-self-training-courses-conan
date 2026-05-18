import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";
import { Badge } from "@/components/ui";
import { formatMinutes } from "@/lib/utils";
import { ArrowLeft, Clock, ScrollText, Info } from "lucide-react";
import CourseContent from "./CourseContent";
import { AiCoursePanel } from "@/components/learning/AiCoursePanel";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      quizzes: { where: { isPublished: true }, select: { id: true, title: true, passPercent: true } },
    },
  });
  if (!course || !course.isPublished) notFound();

  const allowed = await canAccessCourse(userId, role, course.id);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold">Access required</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          You don&apos;t have access to this course. Please contact your admin.
        </p>
        <Link href="/courses" className="mt-6 inline-block text-sm font-semibold text-[var(--primary)]">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  const percent = progress?.percent ?? 0;
  const completed = !!progress?.completedAt;
  const quiz = course.quizzes[0];

  return (
    <div className="space-y-3">
      {/* Slim breadcrumb row — does not eat vertical space. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-3 w-3" /> Catalog
        </Link>
        <span className="text-[var(--muted-foreground)]">/</span>
        {course.category && (
          <>
            <Link
              href={`/courses?cat=${course.category.slug}`}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {course.category.name}
            </Link>
            <span className="text-[var(--muted-foreground)]">/</span>
          </>
        )}
        <span className="font-medium text-[var(--foreground)]">{course.title}</span>
      </div>

      {/* Compact title bar — title left, meta + actions right. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{course.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            {course.level && <Badge>{course.level}</Badge>}
            {course.durationMin ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatMinutes(course.durationMin)}
              </span>
            ) : null}
            {completed && <Badge tone="success">Completed</Badge>}
            <details className="group">
              <summary className="cursor-pointer list-none rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] hover:bg-[var(--muted)]">
                <Info className="-mt-0.5 mr-1 inline h-3 w-3" /> About this course
              </summary>
              <p className="mt-2 max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)]">
                {course.description}
              </p>
            </details>
          </div>
        </div>
        {quiz && (
          <Link
            href={`/courses/${course.slug}/quiz`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90"
            title={`Pass at ${quiz.passPercent}% to earn a certificate`}
          >
            <ScrollText className="h-3.5 w-3.5" /> Take quiz · pass {quiz.passPercent}%
          </Link>
        )}
      </div>

      <CourseContent
        courseId={course.id}
        slug={course.slug}
        kind={course.kind}
        contentUrl={course.contentUrl}
        embedUrl={course.embedUrl}
        contentMd={course.contentMd}
        initialPercent={percent}
        completed={completed}
      />
      <AiCoursePanel courseId={course.id} />
    </div>
  );
}
