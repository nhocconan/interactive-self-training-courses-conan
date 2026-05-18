"use client";
import { useState, useTransition } from "react";
import { toggleEnrollment, toggleCategoryGrant } from "../../actions";

export default function GrantToggles({
  kind,
  userId,
  targetId,
  label,
  checked: initial,
}: {
  kind: "course" | "category";
  userId: string;
  targetId: string;
  label: string;
  checked: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        checked ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]" : "border-[var(--border)] hover:bg-[var(--muted)]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={() => {
          const next = !checked;
          setChecked(next);
          start(async () => {
            if (kind === "course") await toggleEnrollment(userId, targetId);
            else await toggleCategoryGrant(userId, targetId);
          });
        }}
        className="accent-[var(--primary)]"
      />
      <span>{label}</span>
    </label>
  );
}
