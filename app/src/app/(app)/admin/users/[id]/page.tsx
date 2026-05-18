import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Card } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import GrantToggles from "./GrantToggles";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      enrollments: true,
      categoryGrants: true,
      progress: { include: { course: true } },
    },
  });
  if (!user) notFound();

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({ include: { category: true }, orderBy: { title: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const enrolledIds = new Set(user.enrollments.map((e) => e.courseId));
  const grantedCats = new Set(user.categoryGrants.map((g) => g.categoryId));
  const completed = user.progress.filter((p) => p.completedAt);
  const inProgress = user.progress.filter((p) => !p.completedAt && p.percent > 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <ArrowLeft className="h-3 w-3" /> All users
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <span>{user.email}</span>
          <Badge tone={user.source === "LDAP" ? "primary" : "neutral"}>{user.source}</Badge>
          <Badge>{user.role}</Badge>
          {user.department && <Badge>{user.department}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">Activity</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div><div className="text-2xl font-bold">{enrolledIds.size + grantedCats.size}</div><div className="text-xs text-[var(--muted-foreground)]">grants</div></div>
            <div><div className="text-2xl font-bold">{inProgress.length}</div><div className="text-xs text-[var(--muted-foreground)]">in progress</div></div>
            <div><div className="text-2xl font-bold">{completed.length}</div><div className="text-xs text-[var(--muted-foreground)]">completed</div></div>
          </dl>
        </Card>
        <ResetPasswordForm userId={user.id} isActive={user.isActive} />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Category grants</h2>
        <p className="text-xs text-[var(--muted-foreground)]">Grants access to <em>every</em> course in the category.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <GrantToggles
              key={c.id}
              kind="category"
              userId={user.id}
              targetId={c.id}
              label={c.name}
              checked={grantedCats.has(c.id)}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Per-course grants</h2>
        <p className="text-xs text-[var(--muted-foreground)]">For fine-grained access not covered by a category.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {courses.map((c) => (
            <GrantToggles
              key={c.id}
              kind="course"
              userId={user.id}
              targetId={c.id}
              label={`${c.title}${c.category ? ` · ${c.category.name}` : ""}`}
              checked={enrolledIds.has(c.id)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
