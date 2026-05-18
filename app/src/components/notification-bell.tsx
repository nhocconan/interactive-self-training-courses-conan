"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Item = {
  id: string;
  kind: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/notifications");
    if (!r.ok) return;
    const j = await r.json();
    setItems(j.items);
    setUnread(j.unread);
  }, []);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    const id = setInterval(load, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all" }),
    });
    load();
  }
  async function mark(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark", id }),
    });
    load();
  }

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        className="relative grid h-8 w-8 place-items-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-[var(--primary-foreground)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 text-xs">
            <span className="font-semibold">Notifications</span>
            <button onClick={markAll} className="text-[var(--primary)] hover:underline">Mark all read</button>
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">You&apos;re all caught up.</div>
            ) : items.map((n) => (
              <Link
                key={n.id}
                href={n.href || "#"}
                onClick={() => !n.readAt && mark(n.id)}
                className={`block border-b border-[var(--border)] px-4 py-3 hover:bg-[var(--muted)] ${!n.readAt ? "bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]" : ""}`}
              >
                <div className="text-sm font-medium leading-tight">{n.title}</div>
                {n.body && <div className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">{n.body}</div>}
                <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">{new Date(n.createdAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
