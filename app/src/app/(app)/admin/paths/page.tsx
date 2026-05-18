import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { createPath } from "../actions-paths";

export default async function AdminPaths() {
  await requireAdmin();
  const paths = await prisma.learningPath.findMany({
    include: { _count: { select: { steps: true, enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Learning paths</h1>
      <Card className="p-5">
        <h2 className="text-sm font-semibold">New path</h2>
        <form action={async (fd) => { "use server"; await createPath(fd); }} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label>Title</Label><Input name="title" required /></div>
          <div><Label>Slug</Label><Input name="slug" required placeholder="onboarding-2026" /></div>
          <div><Label>Colour</Label><Input name="color" placeholder="#0ea5e9" /></div>
          <div className="flex items-end"><Button type="submit" className="w-full">Create</Button></div>
          <div className="sm:col-span-2 lg:col-span-4"><Label>Description</Label><Input name="description" /></div>
        </form>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr><th className="px-4 py-3">Title</th><th>Slug</th><th>Steps</th><th>Enrolled</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {paths.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No learning paths yet.</td></tr>
            ) : paths.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{p.slug}</td>
                <td className="px-4 py-3">{p._count.steps}</td>
                <td className="px-4 py-3">{p._count.enrollments}</td>
                <td className="px-4 py-3">{p.isPublished ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/paths/${p.id}`} className="text-xs font-semibold text-[var(--primary)] hover:underline">Edit →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
