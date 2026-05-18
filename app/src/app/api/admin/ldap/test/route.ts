import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ldapTestBind } from "@/lib/ldap";

export async function POST() {
  const s = await auth();
  if (s?.user?.role !== "ADMIN") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const cfg = await prisma.ldapConfig.findUnique({ where: { id: 1 } });
  if (!cfg) return NextResponse.json({ ok: false, error: "not configured" });
  const result = await ldapTestBind(cfg);
  return NextResponse.json(result);
}
