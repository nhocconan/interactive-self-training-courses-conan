import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !["HR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const dept = url.searchParams.get("dept") || undefined;

  const users = await prisma.user.findMany({
    where: { isActive: true, ...(dept ? { department: dept } : {}) },
    include: {
      progress: { include: { course: { select: { title: true } } } },
      certificates: true,
    },
    orderBy: [{ department: "asc" }, { name: "asc" }],
  });

  const header = [
    "Email", "Name", "Department", "JobTitle", "Role",
    "TotalAssigned", "Completed", "InProgress",
    "MinutesLearned", "Certificates", "LastSeenAt",
  ];
  const rows: string[] = [header.join(",")];

  for (const u of users) {
    const completed = u.progress.filter((p) => p.completedAt);
    const inProg = u.progress.filter((p) => !p.completedAt && p.percent > 0);
    const lastSeen = u.progress.reduce<Date | null>(
      (acc, p) => (acc && acc > p.lastSeenAt ? acc : p.lastSeenAt),
      null,
    );
    rows.push([
      u.email, u.name, u.department || "", u.jobTitle || "", u.role,
      String(u.progress.length),
      String(completed.length),
      String(inProg.length),
      String(completed.reduce((n) => n, 0)),
      String(u.certificates.length),
      lastSeen ? lastSeen.toISOString() : "",
    ].map(csvCell).join(","));
  }

  const body = rows.join("\n");
  const filename = `demo-hr-${new Date().toISOString().slice(0, 10)}${dept ? `-${dept.replace(/[^a-z0-9-]/gi, "_")}` : ""}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
