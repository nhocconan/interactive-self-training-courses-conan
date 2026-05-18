import Link from "next/link";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import {
  Users2,
  BookOpen,
  FolderTree,
  Settings2,
  ScrollText,
  Map,
  Sparkles,
  Megaphone,
  LineChart,
  ShieldCheck,
  KeyRound,
  BarChart3,
} from "lucide-react";

export default async function AdminHome() {
  await requireAdmin();
  const [users, courses, categories, completed] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.category.count(),
    prisma.courseProgress.count({ where: { completedAt: { not: null } } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin console</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Manage users, courses, access and AD integration.</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Users" value={users} />
        <Stat label="Courses" value={courses} />
        <Stat label="Categories" value={categories} />
        <Stat label="Completions" value={completed} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile href="/admin/users" Icon={Users2} title="Users" desc="Create local users, assign roles, manage grants." />
        <Tile href="/admin/ldap/sync" Icon={Users2} title="AD user picker" desc="Search a sub-tree and add directory users in bulk." />
        <Tile href="/admin/courses" Icon={BookOpen} title="Courses" desc="HTML, video, PDF, PPTX, Google Slides — flexible content." />
        <Tile href="/admin/categories" Icon={FolderTree} title="Categories" desc="Organize courses into themes." />
        <Tile href="/admin/quizzes" Icon={ScrollText} title="Quizzes" desc="Author assessments, AI-generate, set pass thresholds." />
        <Tile href="/admin/paths" Icon={Map} title="Learning paths" desc="Sequence courses into curricula with a cert at the end." />
        <Tile href="/admin/ai" Icon={Sparkles} title="AI providers" desc="OpenAI / Anthropic / Gemini. Fetch latest models live." />
        <Tile href="/admin/announcements" Icon={Megaphone} title="Announcements" desc="Broadcast to everyone or by role." />
        <Tile href="/admin/reports" Icon={BarChart3} title="Reports & analytics" desc="Org-wide completion, mandatory compliance, trends." />
        <Tile href="/hr" Icon={LineChart} title="HR reports" desc="Per-employee completion stats, exportable." />
        <Tile href="/admin/audit" Icon={ScrollText} title="Audit log" desc="Every admin/HR mutation, with diff." />
        <Tile href="/admin/roles" Icon={KeyRound} title="Roles & permissions" desc="Fine-grained RBAC — widen or restrict each role." />
        <Tile href="/admin/security" Icon={ShieldCheck} title="Site security" desc="Password policy, lockout, sessions, allowed domains." />
        <Tile href="/admin/ldap" Icon={Settings2} title="LDAP / AD config" desc="Bind details, attribute mapping, sub-tree(s)." />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}
function Tile({
  href,
  Icon,
  title,
  desc,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="card-hover p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="mt-1 text-sm text-[var(--muted-foreground)]">{desc}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
