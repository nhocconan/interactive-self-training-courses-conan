import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { Award, BookOpenCheck, Sparkles, Clock4 } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, certs, progress] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.certificate.findMany({
      where: { userId },
      include: { course: true, path: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.courseProgress.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { lastSeenAt: "desc" },
    }),
  ]);

  const completed = progress.filter((p) => p.completedAt);
  const inProg = progress.filter((p) => !p.completedAt);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">My profile</div>
        <h1 className="mt-1 text-3xl font-bold">{user?.name}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{user?.email} · {user?.department || "—"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<BookOpenCheck className="h-4 w-4" />} label="In progress" value={inProg.length} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Completed" value={completed.length} />
        <Stat icon={<Award className="h-4 w-4" />} label="Certificates" value={certs.length} />
        <Stat icon={<Clock4 className="h-4 w-4" />} label="Minutes learned" value={completed.reduce((n, p) => n + (p.course.durationMin || 0), 0)} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">My certificates</h2>
        {certs.length === 0 ? (
          <Card className="p-6 text-center text-sm text-[var(--muted-foreground)]">No certificates yet. Pass a course quiz to earn one.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {certs.map((c) => {
              const expired = c.expiresAt ? c.expiresAt < new Date() : false;
              return (
                <Card key={c.id} className="card-hover overflow-hidden p-0">
                  <div className="h-20 bg-gradient-to-br from-[var(--brand-coral)] to-[var(--brand-red)]" />
                  <div className="space-y-2 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
                        {c.pathId ? "Path certificate" : "Course certificate"}
                      </div>
                      {expired && <Badge tone="warning">Expired</Badge>}
                    </div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Issued {new Date(c.issuedAt).toLocaleDateString()}</div>
                    <div className="text-xs font-mono text-[var(--muted-foreground)]">{c.code}</div>
                    <Link href={`/verify/${c.code}`} className="inline-block text-xs font-semibold text-[var(--primary)]">
                      Verify →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">My learning history</h2>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr><th className="px-4 py-3">Course</th><th>Progress</th><th>Status</th><th>Last activity</th></tr>
            </thead>
            <tbody>
              {progress.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--muted-foreground)]">Nothing yet.</td></tr>
              ) : progress.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium"><Link href={`/courses/${p.course.slug}`}>{p.course.title}</Link></td>
                  <td className="px-4 py-3 w-48"><ProgressBar value={p.percent} /></td>
                  <td className="px-4 py-3">{p.completedAt ? <Badge tone="success">Completed</Badge> : <Badge>{p.percent}%</Badge>}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{new Date(p.lastSeenAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">{icon}<span className="text-xs">{label}</span></div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}
