import { test, expect, type Page } from "@playwright/test";
import { ADMIN } from "./creds";

const TEST_PREFIX = "[E2E] Ollama ";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email or AD username").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 15_000 });
}

/**
 * Best-effort cleanup of any provider row whose Name cell starts with TEST_PREFIX.
 * Auto-accepts the confirm() prompt the Delete button shows.
 */
async function cleanupTestProviders(page: Page) {
  page.on("dialog", (dialog) => dialog.accept().catch(() => undefined));
  await page.addInitScript(() => {
    window.confirm = () => true;
  });
  await page.goto("/admin/ai");
  const cellRegex = /^\[E2E\] Ollama/;

  for (let safety = 0; safety < 20; safety++) {
    const cell = page.getByRole("cell", { name: cellRegex }).first();
    if (!(await cell.isVisible().catch(() => false))) break;
    const row = cell.locator("..");
    await row.locator('button[title="Delete"]').click();
    await expect(cell).toBeHidden({ timeout: 10_000 });
  }
}

test.describe("AI provider — admin flows", () => {
  test.afterEach(async ({ page }) => {
    await cleanupTestProviders(page).catch(() => {
      /* cleanup is best-effort */
    });
  });

  test("Ollama option exists with cloud default hint", async ({ page }) => {
    await login(page);
    await page.goto("/admin/ai");
    await page.getByRole("button", { name: /Add AI provider/i }).click();

    await page.locator('select[name="kind"]').selectOption("OLLAMA");
    await expect(page.locator('input[name="baseUrl"]')).toHaveAttribute(
      "placeholder",
      "https://ollama.com",
    );
    await expect(page.getByText(/Defaults to Ollama Cloud/i)).toBeVisible();
  });

  test("invalid credentials are rejected and NOT saved", async ({ page }) => {
    await login(page);
    await page.goto("/admin/ai");
    await page.getByRole("button", { name: /Add AI provider/i }).click();
    const bogusName = `${TEST_PREFIX}invalid-add-${Date.now()}`;
    await page.locator('input[name="name"]').fill(bogusName);
    await page.locator('select[name="kind"]').selectOption("OLLAMA");
    await page.locator('input[name="baseUrl"]').fill("http://127.0.0.1:1");
    await page.locator('input[name="apiKey"]').fill("not-needed-for-local");
    await page.getByRole("button", { name: /Add & verify/i }).click();

    await expect(page.getByText("Not saved.", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("cell", { name: bogusName })).toHaveCount(0);
  });

  test("valid local Ollama: add → edit → mapping with fallback", async ({ page }) => {
    const probe = await fetch("http://127.0.0.1:11434/api/tags").catch(() => null);
    test.skip(!probe || !probe.ok, "Local Ollama not running on 127.0.0.1:11434");

    await login(page);
    await page.goto("/admin/ai");

    // ---- Step 1: Add ----
    await page.getByRole("button", { name: /Add AI provider/i }).click();
    const name = `${TEST_PREFIX}happy-${Date.now()}`;
    await page.locator('input[name="name"]').fill(name);
    await page.locator('select[name="kind"]').selectOption("OLLAMA");
    await page.locator('input[name="baseUrl"]').fill("http://127.0.0.1:11434");
    await page.getByRole("button", { name: /Add & verify/i }).click();
    await expect(page.getByText(/Verified & saved/i)).toBeVisible({ timeout: 30_000 });
    const row = page.locator("tr", { hasText: name });
    await expect(row).toBeVisible();

    // ---- Step 2: Edit — rename only (no creds), no re-test expected ----
    await row.getByRole("button", { name: /Edit/i }).click();
    // The edit form is the only form with a hidden providerId input.
    const editForm = page.locator('form:has(input[name="providerId"])');
    const renamed = `${name} renamed`;
    await editForm.locator('input[name="name"]').fill(renamed);
    await editForm.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText(/No credentials change — saved without re-test/i)).toBeVisible({
      timeout: 15_000,
    });
    // Close the editor and assert the new name appears in a display cell.
    await editForm.getByRole("button", { name: /^Cancel$/ }).click();
    await expect(page.getByRole("cell", { name: renamed, exact: true })).toBeVisible();

    // ---- Step 3: Edit — bad baseUrl, must fail without persisting ----
    const renamedRow = page.getByRole("row").filter({
      has: page.getByRole("cell", { name: renamed, exact: true }),
    });
    await renamedRow.getByRole("button", { name: /Edit/i }).click();
    await editForm.locator('input[name="baseUrl"]').fill("http://127.0.0.1:1");
    await editForm.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Not saved.", { exact: true })).toBeVisible({ timeout: 15_000 });
    // Close the failed editor before moving on
    await editForm.getByRole("button", { name: /^Cancel$/ }).click();
    await expect(page.getByRole("cell", { name: renamed, exact: true })).toBeVisible();

    // ---- Step 4: Map a feature with primary + fallback ----
    await page.locator("#feature-mapping").scrollIntoViewIfNeeded();
    const chatCard = page.getByTestId("feature-mapping-CHAT");
    await expect(chatCard).toBeVisible();
    // Primary row
    const primarySelect = chatCard.locator("select").nth(0);
    await primarySelect.selectOption({ label: renamed });
    const primaryModel = chatCard.locator("select").nth(1);
    // pick first available model
    const firstModel = await primaryModel
      .locator("option")
      .filter({ hasText: /:/ })
      .first()
      .getAttribute("value");
    expect(firstModel).toBeTruthy();
    await primaryModel.selectOption(firstModel!);

    // Add fallback row
    await chatCard.getByRole("button", { name: /Add fallback/i }).click();
    const fallbackSelect = chatCard.locator("select").nth(2);
    await fallbackSelect.selectOption({ label: renamed });
    const fallbackModel = chatCard.locator("select").nth(3);
    const secondModel = await fallbackModel
      .locator("option")
      .filter({ hasText: /:/ })
      .nth(1)
      .getAttribute("value");
    await fallbackModel.selectOption(secondModel ?? firstModel!);

    await chatCard.getByRole("button", { name: /Save chain/i }).click();

    // Wait for revalidation — the "configured" pill should now read "2 configured"
    await expect(chatCard.getByText("2 configured")).toBeVisible({ timeout: 15_000 });

    // Banner warning should drop CHAT from the unconfigured list (or hide entirely)
    // — we don't strictly assert this because other features remain unconfigured.
  });
});
