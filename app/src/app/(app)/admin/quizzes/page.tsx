import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { createQuiz } from "../actions-quiz";

export default async function AdminQuizzes() {
  await requireAdmin();
  const [quizzes, courses] = await Promise.all([
    prisma.quiz.findMany({
      include: { course: true, _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}</p>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">New quiz</h2>
        <form action={async (fd) => { "use server"; await createQuiz(fd); }} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Course</Label>
            <Select name="courseId" required>
              <option value="">— select —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </div>
          <div><Label>Title</Label><Input name="title" defaultValue="Course assessment" /></div>
          <div><Label>Pass %</Label><Input name="passPercent" type="number" defaultValue={70} min={1} max={100} /></div>
          <div><Label>Max attempts (0 = unlimited)</Label><Input name="maxAttempts" type="number" defaultValue={0} min={0} /></div>
          <div><Label>Time limit (sec, 0 = none)</Label><Input name="timeLimitSec" type="number" defaultValue={0} min={0} /></div>
          <div className="flex items-end gap-3">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="shuffle" defaultChecked /> Shuffle</label>
            <Button type="submit" className="ml-auto">Create</Button>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Description</Label>
            <Input name="description" placeholder="Optional" />
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="px-4 py-3 font-medium">{q.title}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{q.course.title}</td>
                <td className="px-4 py-3">{q._count.questions}</td>
                <td className="px-4 py-3">{q._count.attempts}</td>
                <td className="px-4 py-3">{q.isPublished ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/quizzes/${q.id}`} className="text-xs font-semibold text-[var(--primary)] hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
