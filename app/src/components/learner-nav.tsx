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
  Map,
  LineChart,
  LogOut,
  GraduationCap,
  User,
  Search,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

type Role = "USER" | "HR" | "ADMIN";

const learnerLinks = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/my-learning", label: "My Learning", Icon: GraduationCap },
  { href: "/courses", label: "Courses", Icon: BookOpen },
  { href: "/paths", label: "Paths", Icon: Map },
];
const insightsLink = { href: "/hr", label: "Insights", Icon: LineChart };

export function LearnerNav({
  user,
}: {
  user: { id: string; name: string; email: string; role: Role };
}) {
  const path = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const links = [
    ...learnerLinks,
    ...(user.role === "HR" || user.role === "ADMIN" ? [insightsLink] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <BrandLockup href="/dashboard" />

          <nav className="ml-2 flex items-center gap-0.5 overflow-x-auto">
            {links.map(({ href, label, Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                    active
                      ? "bg-[var(--muted)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:inline-flex"
              title="Search (⌘K)"
            >
              <Search className="h-3.5 w-3.5" /> Quick search
              <span className="ml-2 rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
            </button>
            <NotificationBell />
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((m) => !m)}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-coral)] text-white text-[10px] font-bold">
                  {initials(user.name)}
                </span>
                <span className="hidden text-[var(--muted-foreground)] sm:inline">{user.name}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)]">
                  <div className="border-b border-[var(--border)] px-3 py-2">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{user.email}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">{user.role}</div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                  >
                    <User className="h-3.5 w-3.5" /> My profile
                  </button>
                  {user.role === "ADMIN" && (
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/admin"); }}
                      className="flex w-full items-center justify-between gap-2 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] px-3 py-2 text-left text-sm font-medium text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5" /> Switch to Admin console
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
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
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={user.role} />
    </>
  );
}
