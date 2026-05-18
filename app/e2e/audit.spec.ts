/**
 * Senior-architect audit suite — turns invariants into tests.
 * Failures here are real defects; ordering matters because the
 * rate-limit test deliberately exhausts the AUTH bucket and must run last.
 */
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

test.describe.serial("audit", () => {
  test("01 · security headers", async ({ page }) => {
    const r = await page.request.get("/login");
    const h = r.headers();
    expect(h["content-security-policy"], "CSP").toBeTruthy();
    expect(h["referrer-policy"], "Referrer-Policy").toBeTruthy();
    expect(h["x-content-type-options"], "X-Content-Type-Options").toBeTruthy();
    expect(h["x-frame-options"], "X-Frame-Options").toBeTruthy();
    expect(h["permissions-policy"], "Permissions-Policy").toBeTruthy();
  });

  test("02 · health endpoint reports ok", async ({ request }) => {
    const r = await request.get("/api/health");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
  });

  test("03 · API routes return JSON 401, not HTML redirect", async ({ request }) => {
    for (const path of ["/api/quiz/submit", "/api/quiz/start", "/api/ai/chat", "/api/progress", "/api/notifications", "/api/paths/claim-cert"]) {
      const r = await request.post(path, { data: {}, failOnStatusCode: false });
      expect(r.status(), `${path} should 401`).toBe(401);
      const ct = r.headers()["content-type"] || "";
      expect(ct, `${path} should return json`).toContain("application/json");
    }
  });

  test("04 · learner without grants sees empty catalog (no leakage)", async ({ page }) => {
    await login(page, DEMO_IT.email, DEMO_IT.password);
    await page.goto("/courses");
    await expect(page.getByText(/No courses match/i)).toBeVisible();
  });

  test("05 · admin can disable & re-enable a user (state-aware UI)", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/users");
    const row = page.locator("tr", { hasText: "Demo IT" });
    await row.getByRole("link", { name: /Manage/i }).click();
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Disable account/i }).click();
    await expect(page.getByRole("button", { name: /Enable account/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Enable account/i }).click();
    await expect(page.getByRole("button", { name: /Disable account/i })).toBeVisible({ timeout: 10_000 });
  });

  test("06 · disabled user cannot log in", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/users");
    page.on("dialog", (d) => d.accept());
    await page.locator("tr", { hasText: "Demo IT" }).getByRole("link", { name: /Manage/i }).click();
    await page.getByRole("button", { name: /Disable account/i }).click();
    await expect(page.getByRole("button", { name: /Enable account/i })).toBeVisible({ timeout: 10_000 });

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email or AD username").fill(DEMO_IT.email);
    await page.getByLabel("Password").fill(DEMO_IT.password);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Cleanup
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/users");
    await page.locator("tr", { hasText: "Demo IT" }).getByRole("link", { name: /Manage/i }).click();
    await page.getByRole("button", { name: /Enable account/i }).click();
  });

  test("07 · HR CSV export downloads a CSV", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/hr");
    const link = page.getByRole("link", { name: /Export CSV/i });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toMatch(/\/api\/hr\/export/);
    // Fetch directly to keep dev server happy with downloads.
    const r = await page.request.get(href!);
    expect(r.status()).toBe(200);
    const ct = r.headers()["content-type"] || "";
    expect(ct).toContain("text/csv");
    const body = await r.text();
    expect(body.split("\n")[0]).toContain("Email");
  });

  test("08 · destructive admin action prompts a confirm dialog", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/categories");
    // Skip the test if there is nothing safe to attempt to delete.
    const del = page.getByRole("button", { name: /^Delete$/ }).first();
    if (!(await del.count())) return;
    let dialogSeen = false;
    page.once("dialog", async (d) => {
      dialogSeen = true;
      expect(d.message()).toMatch(/sure|delete|cannot/i);
      await d.dismiss();
    });
    await del.click();
    await page.waitForTimeout(300);
    expect(dialogSeen).toBe(true);
  });

  test("09 · public certificate verify page renders without auth", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/verify/this-is-not-a-real-code");
    await expect(page.getByText(/Certificate not found/i)).toBeVisible();
  });

  test("10 · mobile dashboard has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/dashboard");
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, "page must not horizontally overflow at 390px").toBe(false);
  });
});

// Rate-limit verification lives in zz-rate-limit.spec.ts to keep its
// state isolated from the rest of this suite.
