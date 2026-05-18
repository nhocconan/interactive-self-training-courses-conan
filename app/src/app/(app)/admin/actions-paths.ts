"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";

export async function createPath(form: FormData) {
  const s = await requireAdmin();
  const parsed = z
    .object({
      slug: z.string().min(1).max(64),
      title: z.string().min(1).max(200),
      description: z.string().min(0).max(2000),
      color: z.string().optional(),
    })
    .parse({
      slug: String(form.get("slug") || ""),
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      color: String(form.get("color") || "") || undefined,
    });
  const path = await prisma.learningPath.create({ data: parsed });
  await audit({ actorId: s.user.id, action: "path.create", target: path.id, after: parsed });
  revalidatePath(`/admin/paths/${path.id}`);
  return path.id;
}

export async function addStep(pathId: string, courseId: string) {
  const s = await requireAdmin();
  const last = await prisma.learningPathStep.findFirst({ where: { pathId }, orderBy: { sortOrder: "desc" } });
  const step = await prisma.learningPathStep.create({
    data: { pathId, courseId, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  await audit({ actorId: s.user.id, action: "path.step.add", target: step.id, after: { pathId, courseId } });
  revalidatePath(`/admin/paths/${pathId}`);
}

export async function removeStep(stepId: string) {
  const s = await requireAdmin();
  const step = await prisma.learningPathStep.delete({ where: { id: stepId } });
  await audit({ actorId: s.user.id, action: "path.step.remove", target: stepId });
  revalidatePath(`/admin/paths/${step.pathId}`);
}

export async function deletePath(pathId: string) {
  const s = await requireAdmin();
  await prisma.learningPath.delete({ where: { id: pathId } });
  await audit({ actorId: s.user.id, action: "path.delete", target: pathId });
  revalidatePath("/admin/paths");
}
