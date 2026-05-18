import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function audit(args: {
  actorId?: string | null;
  action: string;
  target?: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  let ip: string | undefined;
  let userAgent: string | undefined;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
    userAgent = h.get("user-agent") || undefined;
  } catch {
    /* outside request scope */
  }
  await prisma.auditLog.create({
    data: {
      actorId: args.actorId ?? null,
      action: args.action,
      target: args.target,
      diff: {
        before: args.before ?? null,
        after: args.after ?? null,
      } as unknown as object,
      ip,
      userAgent,
    },
  });
}
