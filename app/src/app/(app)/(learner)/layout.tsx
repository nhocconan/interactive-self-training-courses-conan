import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LearnerNav } from "@/components/learner-nav";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id, name, email, role } = session.user;
  return (
    <>
      <LearnerNav user={{ id, name: name || "User", email: email || "", role }} />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      <footer className="mt-auto border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted-foreground)]">
        © Demo Group · Internal Learning Portal
      </footer>
    </>
  );
}
