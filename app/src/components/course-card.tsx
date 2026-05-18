import Link from "next/link";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { formatMinutes } from "@/lib/utils";
import { Clock, CheckCircle2, Sparkles } from "lucide-react";

export type CourseCardCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level?: string | null;
  durationMin?: number | null;
  tags: string[];
  category?: { name: string; color?: string | null } | null;
};

export function CourseCard({
  course,
  progress,
  locked,
}: {
  course: CourseCardCourse;
  progress?: { percent: number; completedAt: Date | null } | null;
  locked?: boolean;
}) {
  const pct = progress?.percent ?? 0;
  const done = !!progress?.completedAt;
  const accent = course.category?.color || "var(--primary)";

  const inner = (
    <Card
      className={
        "card-hover relative flex h-full flex-col overflow-hidden p-0 " +
        (locked ? "opacity-60" : "")
      }
    >
      <div
        className="relative h-28 w-full overflow-hidden"
        style={{
          background:
            `linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 60%, #000) 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay [background:radial-gradient(circle_at_30%_30%,white,transparent_50%)]" />
        <div className="absolute left-4 top-4 flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {course.category?.name ?? "General"}
          </span>
        </div>
        {done && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[var(--success)]">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-base font-semibold leading-snug">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{course.description}</p>
        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            {course.level ? <Badge tone="neutral">{course.level}</Badge> : null}
            {course.durationMin ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatMinutes(course.durationMin)}
              </span>
            ) : null}
            {course.tags.slice(0, 2).map((t) => (
              <Badge key={t} tone="neutral">{t}</Badge>
            ))}
          </div>
          {progress && (
            <div className="space-y-1">
              <ProgressBar value={pct} />
              <div className="flex justify-between text-[11px] text-[var(--muted-foreground)]">
                <span>{pct}% complete</span>
                {done ? <span className="text-[var(--success)]">Done</span> : <span>Continue</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (locked) return <div title="No access — ask your admin">{inner}</div>;
  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      {inner}
    </Link>
  );
}
