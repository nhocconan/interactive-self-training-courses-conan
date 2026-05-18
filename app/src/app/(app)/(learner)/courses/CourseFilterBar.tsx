"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CourseFilterBar({
  categories,
  q,
  cat,
}: {
  categories: { id: string; slug: string; name: string; color?: string | null }[];
  q?: string;
  cat?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [query, setQuery] = useState(q ?? "");

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/courses?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update("q", query.trim() || null);
        }}
        className="relative w-full sm:max-w-md"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses, tags…"
          className="pl-9"
        />
      </form>
      <div className="flex flex-wrap gap-1.5">
        <Pill active={!cat} onClick={() => update("cat", null)}>All</Pill>
        {categories.map((c) => (
          <Pill key={c.id} active={cat === c.slug} onClick={() => update("cat", c.slug)} color={c.color}>
            {c.name}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
      )}
      style={active && color ? { background: color, color: "white" } : {}}
    >
      {children}
    </button>
  );
}
