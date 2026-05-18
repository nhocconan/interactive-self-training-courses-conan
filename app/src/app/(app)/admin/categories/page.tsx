import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Button, Card, Input, Label } from "@/components/ui";
import { upsertCategory, deleteCategory } from "../actions";
import DeleteCategoryButton from "./DeleteCategoryButton";

export default async function AdminCategories() {
  await requireAdmin();
  const cats = await prisma.category.findMany({
    include: { _count: { select: { courses: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
      <Card className="p-5">
        <h2 className="text-sm font-semibold">Add category</h2>
        <form action={upsertCategory} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div><Label>Name</Label><Input name="name" required /></div>
          <div><Label>Slug</Label><Input name="slug" required placeholder="ai-engineering" /></div>
          <div><Label>Color</Label><Input name="color" placeholder="#ea403f" /></div>
          <div><Label>Sort</Label><Input name="sortOrder" type="number" defaultValue={0} /></div>
          <div className="flex items-end"><Button type="submit" className="w-full">Add</Button></div>
          <div className="sm:col-span-2 lg:col-span-5"><Label>Description</Label><Input name="description" /></div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr><th className="px-4 py-3">Name</th><th>Slug</th><th>Color</th><th>Courses</th><th></th></tr>
          </thead>
          <tbody>
            {cats.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No categories yet.</td></tr>
            ) : cats.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{c.slug}</td>
                <td className="px-4 py-3">
                  {c.color && <span className="inline-block h-5 w-5 rounded" style={{ background: c.color }} />}
                </td>
                <td className="px-4 py-3">{c._count.courses}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteCategoryButton id={c.id} name={c.name} courseCount={c._count.courses} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
