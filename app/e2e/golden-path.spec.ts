import { test, expect } from "@playwright/test";

const ADMIN = { email: "REDACTED_EMAIL", password: "REDACTED_PASSWORD" };
const DEMO_MARKETING = { email: "demo.marketing@demo.com", password: "REDACTED_PASSWORD" };
const DEMO_IT = { email: "demo.it@demo.com", password: "REDACTED_PASSWORD" };

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email or AD username").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|courses|admin|hr|profile)/, { timeout: 15_000 });
}

test("admin can reach every admin section", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  for (const path of [
    "/dashboard",
    "/courses",
    "/admin",
    "/admin/users",
    "/admin/courses",
    "/admin/categories",
    "/admin/quizzes",
    "/admin/paths",
    "/admin/ai",
    "/admin/announcements",
    "/admin/audit",
    "/admin/ldap",
    "/hr",
    "/profile",
  ]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
  }
});

test("non-admin is blocked from admin", async ({ page }) => {
  await login(page, DEMO_IT.email, DEMO_IT.password);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/(dashboard|login)/);
});

test("user with grant can take quiz & earn certificate", async ({ page }) => {
  await login(page, DEMO_MARKETING.email, DEMO_MARKETING.password);

  // catalog visible
  await page.goto("/courses");
  await expect(page.getByText(/Demo AI Prompting/i)).toBeVisible();

  // open course detail
  await page.goto("/courses/demo-ai-prompting");
  await expect(page.getByRole("link", { name: /Take quiz/i })).toBeVisible();

  // open quiz
  await page.goto("/courses/demo-ai-prompting/quiz");

  // Answer 5 seeded questions correctly:
  // Q1 (SINGLE_CHOICE): index 1 — "The desired output and how it will be used"
  await page.getByLabel(/desired output/i).check();
  // Q2 (MULTI_CHOICE): indices 0,1,3 — Few-shot, Schema, Eval
  await page.getByLabel(/Few-shot examples/i).check();
  await page.getByLabel(/Explicit output schema/i).check();
  await page.getByLabel(/Evaluation suite/i).check();
  // Q3 (TRUE_FALSE): index 1 = False
  await page.getByLabel(/^False$/).check();
  // Q4 (FILL_BLANK): "few"
  await page.getByPlaceholder(/Your answer/i).fill("few");
  // Q5 (SHORT_ANSWER): "evals"
  await page.locator("textarea").last().fill("evals");

  await page.getByRole("button", { name: /^Submit$/ }).click();
  await expect(page.getByText(/Passed/)).toBeVisible({ timeout: 15_000 });

  // Verify certificate on profile
  await page.goto("/profile");
  await expect(page.getByText(/My certificates/i)).toBeVisible();
  const verifyLink = page.getByRole("link", { name: /Verify/i }).first();
  await expect(verifyLink).toBeVisible();
  const href = await verifyLink.getAttribute("href");
  if (!href) throw new Error("no verify link");

  // Public verification (open new context — must work without auth)
  await page.context().clearCookies();
  await page.goto(href);
  await expect(page.getByText(/Valid certificate/i)).toBeVisible();
});

test("course HTML still serves through proxy", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  const r = await page.request.get("/courses-html/demo-ai-prompting");
  expect(r.status()).toBe(200);
  const ct = r.headers()["content-type"] || "";
  expect(ct).toContain("text/html");
});

test("LDAP test endpoint returns sane error when unconfigured", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  const r = await page.request.post("/api/admin/ldap/test");
  expect(r.status()).toBe(200);
  const j = await r.json();
  expect(j.ok).toBeFalsy();
});
