import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Decide whether `userId` may view `courseId`.
 *  - ADMIN  : everything
 *  - HR     : everything (read-only enforced at UI level)
 *  - USER   : only if direct Enrollment OR a CategoryGrant covers the course's category
 */
export async function canAccessCourse(
  userId: string,
  role: Role,
  courseId: string,
): Promise<boolean> {
  if (role === "ADMIN" || role === "HR") return true;

  const direct = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  if (direct) return true;

  const c = await prisma.course.findUnique({
    where: { id: courseId },
    select: { categoryId: true },
  });
  if (!c?.categoryId) return false;

  const grant = await prisma.categoryGrant.findUnique({
    where: { userId_categoryId: { userId, categoryId: c.categoryId } },
    select: { id: true },
  });
  return !!grant;
}

/** Return the list of course IDs the user is allowed to see. */
export async function accessibleCourseIds(userId: string, role: Role): Promise<Set<string>> {
  if (role === "ADMIN" || role === "HR") {
    const all = await prisma.course.findMany({ select: { id: true } });
    return new Set(all.map((c) => c.id));
  }
  const [enrollments, grants] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
    prisma.categoryGrant.findMany({ where: { userId }, select: { categoryId: true } }),
  ]);
  const ids = new Set(enrollments.map((e) => e.courseId));
  if (grants.length) {
    const catCourses = await prisma.course.findMany({
      where: { categoryId: { in: grants.map((g) => g.categoryId) } },
      select: { id: true },
    });
    catCourses.forEach((c) => ids.add(c.id));
  }
  return ids;
}
