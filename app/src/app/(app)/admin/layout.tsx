import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const { id, name, email, role } = session.user;
  return (
    <AdminShell user={{ id, name: name || "User", email: email || "", role }}>
      {children}
    </AdminShell>
  );
}
