"use client";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLockup } from "@/components/brand-lockup";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginForm({ from, error }: { from?: string; error?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(error ? "Invalid credentials." : null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        setMsg("Sai email/username hoặc password.");
        return;
      }
      router.replace(from || "/dashboard");
      router.refresh();
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md p-7 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/85">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <BrandLockup href="/login" />
          <div className="mt-1 pl-[46px] text-xs text-[var(--muted-foreground)]">Sign in to continue</div>
        </div>
        <ThemeToggle />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or AD username</Label>
          <Input
            id="identifier"
            autoFocus
            autoComplete="username"
            placeholder="you@demo.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {msg && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--danger)]/30 bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
            <AlertCircle className="h-4 w-4" />
            {msg}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <LogIn className="h-4 w-4" />
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="pt-2 text-center text-xs text-[var(--muted-foreground)]">
          Tip: AD users can sign in with their domain username. Local accounts use email.
        </p>
      </form>
    </Card>
  );
}
