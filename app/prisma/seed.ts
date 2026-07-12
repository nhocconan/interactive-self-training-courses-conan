/* Seed: admin, hr, sample staff users with grants and progress. */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Constructing PrismaClient loads app/.env into process.env — read seed config after it.
const prisma = new PrismaClient();

/** Random but policy-safe: upper + lower + digit + symbol. */
function generatePassword(): string {
  return `${randomBytes(12).toString("base64url")}Aa1!`;
}

// Empty-string env vars must fall back too, so treat blank as unset.
const envPassword = process.env.SEED_PASSWORD?.trim();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@demo.local";
const SEED_PASSWORD = envPassword || generatePassword();
const PASSWORD_WAS_GENERATED = !envPassword;

const USERS = [
  { email: ADMIN_EMAIL, name: "Demo Admin", role: "ADMIN" as const, department: "IT", jobTitle: "Platform Owner" },
  { email: "hr@demo.com", name: "Demo HR", role: "HR" as const, department: "People Ops", jobTitle: "HR Business Partner" },
  { email: "demo.marketing@demo.com", name: "Demo Marketing", role: "USER" as const, department: "Marketing", jobTitle: "Marketing Executive" },
  { email: "demo.engineering@demo.com", name: "Demo Engineering", role: "USER" as const, department: "Engineering", jobTitle: "Engineering Lead" },
  { email: "demo.it@demo.com", name: "Demo IT", role: "USER" as const, department: "IT", jobTitle: "Sysadmin (no grants — empty-state QA)" },
];

const CATEGORIES = [
  { slug: "onboarding", name: "Onboarding", color: "#16a34a", sortOrder: 0, description: "Mandatory training for new Demo hires." },
  { slug: "ai-engineering", name: "AI Engineering", color: "#d82827", sortOrder: 1, description: "LLMs, prompting, retrieval and agentic patterns." },
  { slug: "data-engineering", name: "Data & RAG", color: "#ea580c", sortOrder: 2, description: "Information retrieval, vector search, RAG architectures." },
  { slug: "tooling", name: "Developer Tooling", color: "#0ea5e9", sortOrder: 3, description: "Modern developer workflows and harness engineering." },
];

const COURSES = [
  {
    slug: "demo-ai-prompting",
    title: "Demo AI Practical Playbook",
    description: "Playbook thực hành về giao việc có kiểm chứng, chọn model theo eval, context, prompting, multimedia và vận hành AI an toàn. Bản Việt chốt 12/07/2026; bản Anh đang đồng bộ lại.",
    htmlPath: "ai-practical-playbook.html",
    categorySlug: "ai-engineering",
    level: "Beginner", durationMin: 120, tags: ["AI", "Prompting", "Models", "Playbook"],
  },
  {
    slug: "rag-information-retrieval",
    title: "RAG & Information Retrieval",
    description: "Hands-on tour of RAG: chunking, embeddings, vector search, re-ranking, multi-layer caching (prompt/semantic/retrieval) and evaluation.",
    htmlPath: "rag-information-retrieval-course.html",
    categorySlug: "data-engineering",
    level: "Intermediate", durationMin: 135, tags: ["RAG", "Embeddings", "Retrieval", "Caching"],
  },
  {
    slug: "harness-engineering",
    title: "Context & Harness Engineering",
    description: "Kỹ nghệ ngữ cảnh và runtime cho AI — xây harness (context, tools, evaluation) biến LLM thành đồng đội kỹ thuật tin cậy. Claude Code + Codex.",
    htmlPath: "context-harness-engineering.html",
    categorySlug: "tooling",
    level: "Advanced", durationMin: 150, tags: ["Agents", "Tooling", "Evaluation"],
  },
];

async function main() {
  console.log("Seeding…");

  // 1. Users
  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { ...u, passwordHash: hash, source: "LOCAL" },
      update: { ...u, passwordHash: hash, isActive: true },
    });
  }

  // 2. Categories + courses
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: c });
  }
  const cats = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c]),
  );
  for (const c of COURSES) {
    const { categorySlug, ...rest } = c;
    await prisma.course.upsert({
      where: { slug: c.slug },
      create: { ...rest, categoryId: cats[categorySlug]?.id },
      update: { ...rest, categoryId: cats[categorySlug]?.id },
    });
  }

  // 3. Grants
  const demoMarketing = await prisma.user.findUnique({ where: { email: "demo.marketing@demo.com" } });
  const demoEngineering = await prisma.user.findUnique({ where: { email: "demo.engineering@demo.com" } });
  if (demoMarketing) {
    await prisma.categoryGrant.upsert({
      where: { userId_categoryId: { userId: demoMarketing.id, categoryId: cats["ai-engineering"].id } },
      create: { userId: demoMarketing.id, categoryId: cats["ai-engineering"].id },
      update: {},
    });
  }
  if (demoEngineering) {
    await prisma.categoryGrant.upsert({
      where: { userId_categoryId: { userId: demoEngineering.id, categoryId: cats["tooling"].id } },
      create: { userId: demoEngineering.id, categoryId: cats["tooling"].id },
      update: {},
    });
    await prisma.categoryGrant.upsert({
      where: { userId_categoryId: { userId: demoEngineering.id, categoryId: cats["data-engineering"].id } },
      create: { userId: demoEngineering.id, categoryId: cats["data-engineering"].id },
      update: {},
    });
  }

  // 4. Sample progress + completion for HR demo data
  const courseAi = await prisma.course.findUnique({ where: { slug: "demo-ai-prompting" } });
  if (demoMarketing && courseAi) {
    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId: demoMarketing.id, courseId: courseAi.id } },
      create: { userId: demoMarketing.id, courseId: courseAi.id, percent: 45 },
      update: { percent: 45 },
    });
  }

  // 5. Sample quiz on AI prompting (a few seed questions)
  if (courseAi) {
    const existing = await prisma.quiz.findFirst({ where: { courseId: courseAi.id } });
    const quiz = existing ?? (await prisma.quiz.create({
      data: {
        courseId: courseAi.id,
        title: "AI Prompting · Knowledge check",
        description: "Short quiz to confirm you got the fundamentals.",
        passPercent: 70,
        maxAttempts: 5,
      },
    }));
    if ((await prisma.question.count({ where: { quizId: quiz.id } })) === 0) {
      await prisma.question.createMany({
        data: [
          {
            quizId: quiz.id, sortOrder: 1, kind: "SINGLE_CHOICE",
            prompt: "What is the FIRST thing to clarify when writing a production prompt?",
            options: ["The exact wording", "The desired output and how it will be used", "Which model to use", "The temperature"] as unknown as object,
            answer: { index: 1 } as unknown as object,
            explanation: "Output shape and downstream use drive every other prompt decision.",
            points: 2,
          },
          {
            quizId: quiz.id, sortOrder: 2, kind: "MULTI_CHOICE",
            prompt: "Which signals improve LLM reliability in production? (select all that apply)",
            options: ["Few-shot examples", "Explicit output schema", "Random emojis", "Evaluation suite"] as unknown as object,
            answer: { indices: [0, 1, 3] } as unknown as object,
            explanation: "Few-shot, schema, and evals all help. Decorative emojis don't.",
            points: 3,
          },
          {
            quizId: quiz.id, sortOrder: 3, kind: "TRUE_FALSE",
            prompt: "Higher temperature always produces better answers.",
            options: ["True", "False"] as unknown as object,
            answer: { index: 1 } as unknown as object,
            explanation: "Temperature controls randomness — too high reduces reliability.",
            points: 1,
          },
          {
            quizId: quiz.id, sortOrder: 4, kind: "FILL_BLANK",
            prompt: "The ___-shot prompting technique provides examples to demonstrate the task.",
            options: [] as unknown as object,
            answer: { accept: ["few", "few-shot", "Few"] } as unknown as object,
            points: 1,
          },
          {
            quizId: quiz.id, sortOrder: 5, kind: "SHORT_ANSWER",
            prompt: "Name one tool / pattern used to evaluate LLM outputs.",
            options: [] as unknown as object,
            answer: { accept: ["evals", "eval", "evaluation", "llm-as-judge", "regression suite"] } as unknown as object,
            points: 2,
          },
        ],
      });
    }
  }

  // 6. Onboarding learning path
  const onboardingPath = await prisma.learningPath.upsert({
    where: { slug: "demo-onboarding-2026" },
    create: {
      slug: "demo-onboarding-2026",
      title: "Welcome to Demo · Onboarding 2026",
      description: "Mandatory onboarding curriculum for every new Demo hire. Three courses, ~5 hours total.",
      color: "#16a34a",
    },
    update: {},
  });
  const allCourses = await prisma.course.findMany({ orderBy: { createdAt: "asc" } });
  await prisma.learningPathStep.deleteMany({ where: { pathId: onboardingPath.id } });
  let order = 0;
  for (const c of allCourses) {
    order++;
    await prisma.learningPathStep.create({
      data: { pathId: onboardingPath.id, courseId: c.id, sortOrder: order },
    });
  }

  // 7. Singleton LDAP placeholder
  await prisma.ldapConfig.upsert({
    where: { id: 1 },
    create: { id: 1, enabled: false },
    update: {},
  });

  // 7a. Site security + site setting singletons
  await prisma.siteSecurity.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  await prisma.siteSetting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  // 7b. RBAC permission catalog (idempotent) + default role grants
  const PERMS: Array<{ key: string; label: string; group: string; defaults: Array<"USER" | "HR" | "ADMIN"> }> = [
    { key: "users.view", label: "View users", group: "Users", defaults: ["ADMIN", "HR"] },
    { key: "users.create", label: "Create users", group: "Users", defaults: ["ADMIN"] },
    { key: "users.update", label: "Update user role / status", group: "Users", defaults: ["ADMIN"] },
    { key: "users.reset_password", label: "Reset user password", group: "Users", defaults: ["ADMIN"] },
    { key: "users.delete", label: "Delete users", group: "Users", defaults: ["ADMIN"] },
    { key: "courses.view", label: "View course catalog", group: "Courses", defaults: ["ADMIN", "HR", "USER"] },
    { key: "courses.create", label: "Create courses", group: "Courses", defaults: ["ADMIN"] },
    { key: "courses.publish", label: "Publish / unpublish courses", group: "Courses", defaults: ["ADMIN"] },
    { key: "courses.delete", label: "Delete courses", group: "Courses", defaults: ["ADMIN"] },
    { key: "categories.manage", label: "Manage categories", group: "Categories", defaults: ["ADMIN"] },
    { key: "paths.manage", label: "Manage learning paths", group: "Paths", defaults: ["ADMIN"] },
    { key: "quizzes.manage", label: "Author quizzes", group: "Quizzes", defaults: ["ADMIN"] },
    { key: "grants.manage", label: "Grant / revoke course access", group: "Access", defaults: ["ADMIN"] },
    { key: "reports.hr", label: "View HR reports", group: "Reports", defaults: ["ADMIN", "HR"] },
    { key: "reports.org", label: "View org analytics dashboard", group: "Reports", defaults: ["ADMIN", "HR"] },
    { key: "reports.export", label: "Export reports as CSV", group: "Reports", defaults: ["ADMIN", "HR"] },
    { key: "audit.view", label: "View audit log", group: "Security", defaults: ["ADMIN"] },
    { key: "security.manage", label: "Edit site security", group: "Security", defaults: ["ADMIN"] },
    { key: "ldap.configure", label: "Configure LDAP / AD", group: "Security", defaults: ["ADMIN"] },
    { key: "ldap.sync", label: "Run LDAP user sync", group: "Security", defaults: ["ADMIN"] },
    { key: "ai.configure", label: "Configure AI providers", group: "AI", defaults: ["ADMIN"] },
    { key: "ai.use", label: "Use AI features in courses", group: "AI", defaults: ["ADMIN", "HR", "USER"] },
    { key: "announcements.create", label: "Post announcements", group: "Comms", defaults: ["ADMIN"] },
  ];
  for (const p of PERMS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, label: p.label, group: p.group },
      update: { label: p.label, group: p.group },
    });
  }
  // Only seed the default grants if the RolePermission table is empty,
  // so re-running the seed doesn't clobber admin edits.
  if ((await prisma.rolePermission.count()) === 0) {
    const byKey = new Map((await prisma.permission.findMany()).map((p) => [p.key, p]));
    const rows: Array<{ role: "USER" | "HR" | "ADMIN"; permissionId: string }> = [];
    for (const p of PERMS) {
      const perm = byKey.get(p.key);
      if (!perm) continue;
      for (const r of p.defaults) rows.push({ role: r, permissionId: perm.id });
    }
    await prisma.rolePermission.createMany({ data: rows, skipDuplicates: true });
  }

  // 8. Welcome announcement
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (admin && (await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to Demo Learning",
        body: "Your new internal training portal is live. Start with the Onboarding path on the Dashboard.",
        audience: "ALL",
        createdBy: admin.id,
      },
    });
  }

  console.log("Seed complete.");
  if (PASSWORD_WAS_GENERATED) {
    console.log(`\n  ⚠ SEED_PASSWORD was not set — generated one for this run:\n\n      ${SEED_PASSWORD}\n`);
    console.log("  Put it in app/.env (see app/.env.example) to keep it across re-seeds.\n");
  } else {
    console.log("Users (password for all: $SEED_PASSWORD from app/.env):");
  }
  for (const u of USERS) console.log(`  - ${u.email}  · ${u.role}  · ${u.department}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
