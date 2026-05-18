import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/session-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen flex-col">{children}</div>
    </SessionProvider>
  );
}
