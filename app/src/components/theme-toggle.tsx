"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const OPTS = [
  { v: "light", label: "Light", Icon: Sun },
  { v: "system", label: "System", Icon: Monitor },
  { v: "dark", label: "Dark", Icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Mount flag is the canonical next-themes hydration guard — `useTheme()` is
  // `undefined` on the server, so we render a neutral placeholder until React
  // is attached client-side.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted)
    return <div aria-hidden className="h-8 w-8 rounded-lg bg-[var(--muted)]" />;

  // Icon shown on the trigger reflects the active visual state.
  const shownIcon =
    theme === "system" ? Monitor : (resolvedTheme || theme) === "dark" ? Moon : Sun;
  const TriggerIcon = shownIcon;
  const label = theme === "system" ? "System theme" : (resolvedTheme || theme) === "dark" ? "Dark theme" : "Light theme";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${label}. Click to change.`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <TriggerIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-pop)]"
        >
          {OPTS.map(({ v, label, Icon }) => {
            const active = theme === v;
            return (
              <button
                key={v}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(v);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs",
                  active
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1">{label}</span>
                {active && <Check className="h-3 w-3 text-[var(--primary)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
