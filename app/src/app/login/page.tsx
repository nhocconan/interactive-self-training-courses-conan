import LoginForm from "./LoginForm";
import { Sparkles } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="bg-mesh relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[var(--background)]/40 backdrop-blur-[2px]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-10">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--card)]/70 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span className="text-[var(--muted-foreground)]">Demo Group · Internal Learning</span>
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight">
              Grow your craft, <br />
              <span className="text-gradient-brand">one course at a time.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-[var(--muted-foreground)]">
              Curated, interactive training built for every Demo team — from AI prompting to
              information retrieval. Track your progress, get certified, level up.
            </p>
            <ul className="mt-8 space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>• Self-paced, mobile-friendly interactive courses</li>
              <li>• Progress saved automatically — pick up where you left off</li>
              <li>• Active Directory single sign-on supported</li>
            </ul>
          </div>
          <LoginForm from={sp.from} error={sp.error} />
        </div>
      </div>
    </main>
  );
}
