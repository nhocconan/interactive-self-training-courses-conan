import { prisma } from "@/lib/prisma";
import { newPublicCode } from "@/lib/crypto";
import { notify } from "@/lib/notifications";

export async function issueCourseCertificate(args: {
  userId: string;
  courseId: string;
  expiresAt?: Date | null;
  meta?: Record<string, unknown>;
}) {
  const existing = await prisma.certificate.findFirst({
    where: { userId: args.userId, courseId: args.courseId },
  });
  if (existing) return existing;
  const course = await prisma.course.findUnique({ where: { id: args.courseId } });
  if (!course) throw new Error("course not found");
  const cert = await prisma.certificate.create({
    data: {
      code: newPublicCode("C"),
      userId: args.userId,
      courseId: args.courseId,
      title: course.title,
      expiresAt: args.expiresAt ?? null,
      metadata: (args.meta as unknown as object) ?? {},
    },
  });
  await notify({
    userId: args.userId,
    kind: "CERTIFICATE_EARNED",
    title: `Certificate earned: ${course.title}`,
    body: `Your verifiable code is ${cert.code}.`,
    href: `/profile/certificates/${cert.code}`,
  });
  return cert;
}

export async function issuePathCertificate(args: {
  userId: string;
  pathId: string;
}) {
  const existing = await prisma.certificate.findFirst({
    where: { userId: args.userId, pathId: args.pathId },
  });
  if (existing) return existing;
  const path = await prisma.learningPath.findUnique({ where: { id: args.pathId } });
  if (!path) throw new Error("path not found");
  return prisma.certificate.create({
    data: {
      code: newPublicCode("P"),
      userId: args.userId,
      pathId: args.pathId,
      title: path.title,
    },
  });
}
