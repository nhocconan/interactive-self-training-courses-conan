import { prisma } from "@/lib/prisma";
import type { NotificationKind } from "@prisma/client";

export async function notify(args: {
  userId: string | string[];
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  const userIds = Array.isArray(args.userId) ? args.userId : [args.userId];
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((uid) => ({
      userId: uid,
      kind: args.kind,
      title: args.title,
      body: args.body,
      href: args.href,
    })),
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
