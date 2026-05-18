import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accessibleCourseIds } from "@/lib/access";
import { CourseCard } from "@/components/course-card";
import CourseFilterBar from "./CourseFilterBar";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;

  const [categories, accessible] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    accessibleCourseIds(userId, role),
  ]);
  const ids = [...accessible];

  const where: import("@prisma/client").Prisma.CourseWhereInput = {
    isPublished: true,
    id: { in: ids },
  };
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q, mode: "insensitive" } },
      { description: { contains: sp.q, mode: "insensitive" } },
      { tags: { has: sp.q } },
    ];
  }
  if (sp.cat) where.category = { slug: sp.cat };

  const courses = await prisma.course.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  const progress = await prisma.courseProgress.findMany({
    where: { userId, courseId: { in: courses.map((c) => c.id) } },
  });
  const pmap = new Map(progress.map((p) => [p.courseId, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course catalog</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {courses.length} course{courses.length === 1 ? "" : "s"} available to you.
        </p>
      </div>
      <CourseFilterBar categories={categories} q={sp.q} cat={sp.cat} />

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[var(--muted-foreground)]">
          No courses match. Ask your admin to grant you a category or specific course.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} progress={pmap.get(c.id) || null} />
          ))}
        </div>
      )}
    </div>
  );
}
