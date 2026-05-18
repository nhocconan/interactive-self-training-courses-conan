"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { CommandPalette } from "@/components/command-palette";
import { BrandLockup } from "@/components/brand-lockup";
import { cn, initials } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  ScrollText,
  Map,
  Megaphone,
  Users2,
  KeyRound,
  UserCog,
  BarChart3,
  LineChart,
  Sparkles,
  ShieldCheck,
  Settings2,
  Search,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";

type Role = "USER" | "HR" | "ADMIN";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/courses", label: "Courses", Icon: BookOpen },
      { href: "/admin/categories", label: "Categories", Icon: FolderTree },
      { href: "/admin/quizzes", label: "Quizzes", Icon: ScrollText },
      { href: "/admin/paths", label: "Learning paths", Icon: Map },
      { href: "/admin/announcements", label: "Announcements", Icon: Megaphone },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", Icon: Users2 },
      { href: "/admin/roles", label: "Roles & permissions", Icon: KeyRound },
      { href: "/admin/ldap/sync", label: "AD user sync", Icon: UserCog },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports & analytics", Icon: BarChart3 },
      { href: "/hr", label: "HR reports", Icon: LineChart },
      { href: "/admin/audit", label: "Audit log", Icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/ai", label: "AI providers", Icon: Sparkles },
      { href: "/admin/security", label: "Site security", Icon: ShieldCheck },
      { href: "/admin/ldap", label: "LDAP / AD config", Icon: Settings2 },
    ],
  },
];

function findCrumb(path: string): { group: string; item: string } | null {
  for (const g of groups) {
    for (const it of g.items) {
      if (path === it.href || path.startsWith(it.href + "/")) {
        return { group: g.label, item: it.label };
      }
    }
  }
  return null;
}

export function AdminShell({
  user,
  children,
}: {
  user: { id: string; name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const crumb = findCrumb(path);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] lg:flex-row">
      {/* Sidebar — desktop fixed, mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-[var(--border)] bg-[var(--muted)]/40 backdrop-blur transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
          <BrandLockup href="/admin" variant="admin" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-3.5rem-3.5rem)] flex-col gap-5 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map(({ href, label, Icon }) => {
                  const active =
                    href === "/admin"
                      ? path === "/admin"
                      : path === href || path.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-card)]"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]",
                          )}
                        />
                        <span className="flex-1">{label}</span>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Learner view
            </span>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="flex min-w-0 items-center gap-1.5 text-sm">
              <Link
                href="/admin"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Admin
              </Link>
              {crumb && crumb.item !== "Dashboard" && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span className="hidden text-[var(--muted-foreground)] sm:inline">{crumb.group}</span>
                  <ChevronRight className="hidden h-3.5 w-3.5 text-[var(--muted-foreground)] sm:inline" />
                  <span className="truncate font-medium">{crumb.item}</span>
                </>
              )}
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:inline-flex"
                title="Search (⌘K)"
              >
                <Search className="h-3.5 w-3.5" /> Jump to…
                <span className="ml-2 rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
              </button>
              <NotificationBell />
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((m) => !m)}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-navy)] text-white text-[10px] font-bold">
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-[var(--muted-foreground)] sm:inline">{user.name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)]">
                    <div className="border-b border-[var(--border)] px-3 py-2">
                      <div className="text-sm font-semibold">{user.name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">{user.email}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{user.role} · ADMIN MODE</div>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                    >
                      <User className="h-3.5 w-3.5" /> My profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/dashboard"); }}
                      className="flex w-full items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Learner view
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
        <footer className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted-foreground)] sm:px-6">
          © Demo Group · Admin console
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={user.role} />
    </div>
  );
}
