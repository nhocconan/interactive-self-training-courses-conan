import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Button, Card, Select } from "@/components/ui";
import { addStep, removeStep, deletePath } from "../../actions-paths";
import { ArrowLeft, Trash2 } from "lucide-react";

export default async function PathDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const path = await prisma.learningPath.findUnique({
    where: { id },
    include: {
      steps: { include: { course: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!path) notFound();
  const courses = await prisma.course.findMany({
    where: { id: { notIn: path.steps.map((s) => s.courseId) } },
    orderBy: { title: "asc" },
  });
  return (
    <div className="space-y-6">
      <Link href="/admin/paths" className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><ArrowLeft className="h-3 w-3" /> All paths</Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{path.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{path.description}</p>
        </div>
        <form action={async () => { "use server"; await deletePath(path.id); }}>
          <Button type="submit" variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
        </form>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Steps (in order)</h2>
        {path.steps.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">No steps yet — add a course below.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {path.steps.map((s, i) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Badge>{i + 1}</Badge>
                  <div>
                    <div className="font-medium">{s.course.title}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{s.course.slug}</div>
                  </div>
                </div>
                <form action={async () => { "use server"; await removeStep(s.id); }}>
                  <Button type="submit" variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                </form>
              </li>
            ))}
          </ol>
        )}
        <form
          className="mt-4 flex gap-2"
          action={async (fd) => {
            "use server";
            await addStep(path.id, String(fd.get("courseId")));
          }}
        >
          <Select name="courseId" required defaultValue="">
            <option value="" disabled>Pick a course…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
          <Button type="submit">+ Add step</Button>
        </form>
      </Card>
    </div>
  );
}
