"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Map,
  LineChart,
  Users2,
  GraduationCap,
  Settings2,
  Sparkles,
  Megaphone,
  ScrollText,
  User,
  Search,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  UserCog,
  BarChart3,
  FolderTree,
} from "lucide-react";

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  roles?: ("USER" | "HR" | "ADMIN")[];
  context?: "learner" | "admin"; // only show in matching workspace
};

const ITEMS: Item[] = [
  // Learner workspace
  { id: "nav-dashboard", group: "Navigate", label: "Home", href: "/dashboard", Icon: LayoutDashboard, context: "learner" },
  { id: "nav-mylearning", group: "Navigate", label: "My Learning", href: "/my-learning", Icon: GraduationCap, context: "learner" },
  { id: "nav-courses", group: "Navigate", label: "Course catalog", href: "/courses", Icon: BookOpen, context: "learner" },
  { id: "nav-paths", group: "Navigate", label: "Learning paths", href: "/paths", Icon: Map, context: "learner" },
  { id: "nav-profile", group: "Navigate", label: "My profile", href: "/profile", Icon: User, context: "learner" },
  { id: "nav-hr", group: "Insights", label: "HR reports", href: "/hr", Icon: LineChart, roles: ["HR", "ADMIN"], context: "learner" },
  { id: "switch-admin", group: "Switch workspace", label: "Open Admin console →", href: "/admin", Icon: ShieldCheck, roles: ["ADMIN"], context: "learner" },

  // Admin workspace
  { id: "adm-home", group: "Overview", label: "Admin dashboard", href: "/admin", Icon: LayoutDashboard, roles: ["ADMIN"], context: "admin" },
  { id: "adm-courses", group: "Content", label: "Courses", href: "/admin/courses", Icon: BookOpen, roles: ["ADMIN"], context: "admin" },
  { id: "adm-categories", group: "Content", label: "Categories", href: "/admin/categories", Icon: FolderTree, roles: ["ADMIN"], context: "admin" },
  { id: "adm-quizzes", group: "Content", label: "Quizzes", href: "/admin/quizzes", Icon: ScrollText, roles: ["ADMIN"], context: "admin" },
  { id: "adm-paths", group: "Content", label: "Learning paths", href: "/admin/paths", Icon: Map, roles: ["ADMIN"], context: "admin" },
  { id: "adm-announcements", group: "Content", label: "Announcements", href: "/admin/announcements", Icon: Megaphone, roles: ["ADMIN"], context: "admin" },
  { id: "adm-users", group: "People", label: "Users", href: "/admin/users", Icon: Users2, roles: ["ADMIN"], context: "admin" },
  { id: "adm-roles", group: "People", label: "Roles & permissions", href: "/admin/roles", Icon: KeyRound, roles: ["ADMIN"], context: "admin" },
  { id: "adm-ldap-sync", group: "People", label: "AD user sync", href: "/admin/ldap/sync", Icon: UserCog, roles: ["ADMIN"], context: "admin" },
  { id: "adm-reports", group: "Insights", label: "Reports & analytics", href: "/admin/reports", Icon: BarChart3, roles: ["ADMIN"], context: "admin" },
  { id: "adm-hr", group: "Insights", label: "HR reports", href: "/hr", Icon: LineChart, roles: ["ADMIN"], context: "admin" },
  { id: "adm-audit", group: "Insights", label: "Audit log", href: "/admin/audit", Icon: ScrollText, roles: ["ADMIN"], context: "admin" },
  { id: "adm-ai", group: "System", label: "AI providers", href: "/admin/ai", Icon: Sparkles, roles: ["ADMIN"], context: "admin" },
  { id: "adm-security", group: "System", label: "Site security", href: "/admin/security", Icon: ShieldCheck, roles: ["ADMIN"], context: "admin" },
  { id: "adm-ldap", group: "System", label: "LDAP / AD config", href: "/admin/ldap", Icon: Settings2, roles: ["ADMIN"], context: "admin" },
  { id: "switch-learner", group: "Switch workspace", label: "← Back to Learner view", href: "/dashboard", Icon: ArrowLeft, context: "admin" },
];

export function CommandPalette({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: "USER" | "HR" | "ADMIN";
}) {
  if (!open) return null;
  return <PaletteBody onClose={onClose} role={role} />;
}

/**
 * Body is only mounted when the palette is open. Local state therefore starts
 * fresh on every open (no need to reset via effects).
 */
function PaletteBody({
  onClose,
  role,
}: {
  onClose: () => void;
  role: "USER" | "HR" | "ADMIN";
}) {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const ctx: "learner" | "admin" = path?.startsWith("/admin") ? "admin" : "learner";
  const items = useMemo(
    () =>
      ITEMS.filter(
        (i) =>
          (!i.roles || i.roles.includes(role)) && (!i.context || i.context === ctx),
      ),
    [role, ctx],
  );
  const filtered = useMemo(() => {
    if (!q) return items;
    const ql = q.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(ql) || i.group.toLowerCase().includes(ql));
  }, [q, items]);

  function pick(i: number) {
    const it = filtered[i];
    if (!it) return;
    onClose();
    router.push(it.href);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-24 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0); // keep selection anchored to first result as the list changes
            }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                pick(idx);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
          />
          <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">esc</span>
        </div>
        <div className="max-h-96 overflow-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">No matches.</div>
          ) : (
            (() => {
              const groups = [...new Set(filtered.map((i) => i.group))];
              return groups.map((g) => (
                <div key={g} className="mt-2 first:mt-0">
                  <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{g}</div>
                  {filtered.filter((i) => i.group === g).map((i) => {
                    const globalIndex = filtered.indexOf(i);
                    return (
                      <button
                        key={i.id}
                        onClick={() => pick(globalIndex)}
                        onMouseEnter={() => setIdx(globalIndex)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                          globalIndex === idx ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        <i.Icon className="h-4 w-4" />
                        <span className="flex-1">{i.label}</span>
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2 text-[10px] text-[var(--muted-foreground)]">
          <span><kbd className="font-mono">↑↓</kbd> navigate · <kbd className="font-mono">↵</kbd> select · <kbd className="font-mono">esc</kbd> close</span>
          <span>Demo · ⌘K</span>
        </div>
      </div>
    </div>
  );
}
