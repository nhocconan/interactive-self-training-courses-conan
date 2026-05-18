"use client";
import { useState, useTransition } from "react";
import { resetUserPassword, toggleUserActive } from "../../actions";
import { Button, Card, Input } from "@/components/ui";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ResetPasswordForm({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Account controls</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setMsg(null);
          start(async () => {
            try {
              await resetUserPassword(userId, pwd);
              setMsg("Password updated");
              setPwd("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            }
          });
        }}
      >
        <Input type="password" placeholder="New password (≥ 10 chars, 3 of 4 classes)" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <Button type="submit" variant="outline" disabled={pending}>Reset</Button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isActive ? (
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm("Disable this account? They won't be able to log in until re-enabled.")) return;
              start(() => toggleUserActive(userId, false));
            }}
            disabled={pending}
          >
            <XCircle className="h-3.5 w-3.5" /> Disable account
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => start(() => toggleUserActive(userId, true))}
            disabled={pending}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Enable account
          </Button>
        )}
        <span className={`text-xs ${isActive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {isActive ? "Currently active" : "Currently disabled"}
        </span>
      </div>
      {msg && <div className="mt-2 text-xs text-[var(--success)]">{msg}</div>}
      {error && <div className="mt-2 text-xs text-[var(--danger)]">{error}</div>}
    </Card>
  );
}
