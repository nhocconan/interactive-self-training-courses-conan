import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "demo-learning-portal",
      uptime: Math.round(process.uptime()),
      latencyMs: Date.now() - started,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message.slice(0, 200) : "db-unreachable",
        latencyMs: Date.now() - started,
      },
      { status: 503 },
    );
  }
}
