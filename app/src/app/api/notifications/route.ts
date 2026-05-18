import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await auth();
  if (!s?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await prisma.notification.findMany({
    where: { userId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const unread = items.filter((n) => !n.readAt).length;
  return NextResponse.json({ items, unread });
}

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string };
  if (body.action === "mark-all") {
    await prisma.notification.updateMany({
      where: { userId: s.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (body.action === "mark" && body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: s.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
