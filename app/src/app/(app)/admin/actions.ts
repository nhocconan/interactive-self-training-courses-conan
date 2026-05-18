"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { validatePassword } from "@/lib/password";
import { getSiteSecurity, isEmailDomainAllowed } from "@/lib/site-security";
import type { Role, CourseKind } from "@prisma/client";

/* -------- Users -------- */
export async function createLocalUser(form: FormData) {
  const s = await requireAdmin();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const name = String(form.get("name") || "").trim();
  const role = (String(form.get("role") || "USER") as Role) || "USER";
  const password = String(form.get("password") || "");
  const department = String(form.get("department") || "").trim() || null;
  if (!email || !name || !password) throw new Error("Missing fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email.");
  const sec = await getSiteSecurity();
  if (!isEmailDomainAllowed(email, sec)) throw new Error("Email domain is not allowed.");
  const pp = validatePassword(password, {
    minLength: sec.pwdMinLength,
    minClasses: sec.pwdMinClasses,
  });
  if (!pp.ok) throw new Error(pp.reason);
  const passwordHash = await bcrypt.hash(password, 10);
  const u = await prisma.user.create({
    data: { email, name, role, passwordHash, department, source: "LOCAL" },
  });
  await audit({ actorId: s.user.id, action: "user.create", target: u.id, after: { email, name, role, department } });
  revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, role: Role) {
  const s = await requireAdmin();
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await audit({ actorId: s.user.id, action: "user.role.update", target: userId, before, after: { role } });
  revalidatePath("/admin/users");
}
export async function toggleUserActive(userId: string, active: boolean) {
  const s = await requireAdmin();
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  await prisma.user.update({ where: { id: userId }, data: { isActive: active } });
  await audit({ actorId: s.user.id, action: active ? "user.enable" : "user.disable", target: userId, before, after: { isActive: active } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
export async function resetUserPassword(userId: string, newPassword: string) {
  const s = await requireAdmin();
  const sec = await getSiteSecurity();
  const pp = validatePassword(newPassword, {
    minLength: sec.pwdMinLength,
    minClasses: sec.pwdMinClasses,
  });
  if (!pp.ok) throw new Error(pp.reason);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await audit({ actorId: s.user.id, action: "user.password.reset", target: userId });
  revalidatePath("/admin/users");
}

/* -------- Grants -------- */
export async function toggleEnrollment(userId: string, courseId: string) {
  const s = await requireAdmin();
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    await prisma.enrollment.delete({ where: { id: existing.id } });
    await audit({ actorId: s.user.id, action: "enrollment.remove", target: existing.id, before: { userId, courseId } });
  } else {
    const e = await prisma.enrollment.create({
      data: { userId, courseId, assignedBy: s.user.id },
    });
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true } });
    await notify({
      userId,
      kind: "COURSE_ASSIGNED",
      title: `New course assigned: ${course?.title ?? "Course"}`,
      body: "You have access to a new course in your catalog.",
      href: course ? `/courses/${course.slug}` : "/courses",
    });
    await audit({ actorId: s.user.id, action: "enrollment.add", target: e.id, after: { userId, courseId } });
  }
  revalidatePath(`/admin/users/${userId}`);
}
export async function toggleCategoryGrant(userId: string, categoryId: string) {
  const s = await requireAdmin();
  const existing = await prisma.categoryGrant.findUnique({
    where: { userId_categoryId: { userId, categoryId } },
  });
  if (existing) {
    await prisma.categoryGrant.delete({ where: { id: existing.id } });
    await audit({ actorId: s.user.id, action: "grant.category.remove", target: existing.id, before: { userId, categoryId } });
  } else {
    const g = await prisma.categoryGrant.create({
      data: { userId, categoryId, assignedBy: s.user.id },
    });
    const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
    await notify({
      userId,
      kind: "COURSE_ASSIGNED",
      title: `New category granted: ${cat?.name ?? "Category"}`,
      body: "You have access to a new set of courses.",
      href: "/courses",
    });
    await audit({ actorId: s.user.id, action: "grant.category.add", target: g.id, after: { userId, categoryId } });
  }
  revalidatePath(`/admin/users/${userId}`);
}

/* -------- Courses -------- */
const COURSE_KINDS: CourseKind[] = [
  "HTML",
  "VIDEO_FILE",
  "VIDEO_EMBED",
  "PDF",
  "PPTX",
  "PPT",
  "SLIDES_GOOGLE",
  "MARKDOWN",
];
export async function upsertCourse(form: FormData) {
  const s = await requireAdmin();
  const id = String(form.get("id") || "") || undefined;
  const rawKind = String(form.get("kind") || "HTML") as CourseKind;
  const kind: CourseKind = COURSE_KINDS.includes(rawKind) ? rawKind : "HTML";
  const data = {
    slug: String(form.get("slug") || "").trim(),
    title: String(form.get("title") || "").trim(),
    description: String(form.get("description") || "").trim(),
    kind,
    htmlPath: String(form.get("htmlPath") || "").trim(),
    contentUrl: String(form.get("contentUrl") || "").trim() || null,
    embedUrl: String(form.get("embedUrl") || "").trim() || null,
    contentMd: String(form.get("contentMd") || "") || null,
    mimeType: String(form.get("mimeType") || "").trim() || null,
    fileSize: Number(form.get("fileSize") || 0) || null,
    level: (String(form.get("level") || "").trim() || null) as string | null,
    durationMin: Number(form.get("durationMin") || 0) || null,
    tags: String(form.get("tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    categoryId: String(form.get("categoryId") || "") || null,
    isPublished: form.get("isPublished") === "on",
    isMandatory: form.get("isMandatory") === "on",
  };
  if (id) {
    await prisma.course.update({ where: { id }, data });
    await audit({ actorId: s.user.id, action: "course.update", target: id, after: data });
  } else {
    const c = await prisma.course.create({ data });
    await audit({ actorId: s.user.id, action: "course.create", target: c.id, after: data });
  }
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}
export async function deleteCourse(id: string) {
  await requireAdmin();
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/courses");
}

/* -------- Categories -------- */
export async function upsertCategory(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "") || undefined;
  const data = {
    slug: String(form.get("slug") || "").trim(),
    name: String(form.get("name") || "").trim(),
    description: String(form.get("description") || "").trim() || null,
    color: String(form.get("color") || "").trim() || null,
    sortOrder: Number(form.get("sortOrder") || 0),
  };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  revalidatePath("/admin/categories");
}
export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

/* -------- LDAP config -------- */
export async function saveLdap(form: FormData) {
  await requireAdmin();
  const data = {
    enabled: form.get("enabled") === "on",
    url: String(form.get("url") || "").trim() || null,
    bindDN: String(form.get("bindDN") || "").trim() || null,
    bindPassword: String(form.get("bindPassword") || "") || null,
    baseDN: String(form.get("baseDN") || "").trim() || null,
    userFilter: String(form.get("userFilter") || "").trim() || null,
    emailAttr: String(form.get("emailAttr") || "").trim() || "mail",
    nameAttr: String(form.get("nameAttr") || "").trim() || "displayName",
    deptAttr: String(form.get("deptAttr") || "").trim() || "department",
    titleAttr: String(form.get("titleAttr") || "").trim() || "title",
    defaultRole: (String(form.get("defaultRole") || "USER") as Role) || "USER",
    startTls: form.get("startTls") === "on",
    subtreeOUs: String(form.get("subtreeOUs") || "").trim() || null,
    syncEnabled: form.get("syncEnabled") === "on",
  };
  await prisma.ldapConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  revalidatePath("/admin/ldap");
}
