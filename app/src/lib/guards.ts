import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const s = await auth();
  if (!s?.user || s.user.role !== "ADMIN") redirect("/dashboard");
  return s;
}
export async function requireHR() {
  const s = await auth();
  if (!s?.user || (s.user.role !== "HR" && s.user.role !== "ADMIN")) redirect("/dashboard");
  return s;
}
