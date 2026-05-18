/**
 * Verifies that every shipped course actually renders meaningful content
 * inside the viewer iframe, and that auto-complete on scroll is GONE.
 */
import { test, expect } from "@playwright/test";

const ADMIN = { email: "REDACTED_EMAIL", password: "REDACTED_PASSWORD" };

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email or AD username").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|courses|admin|hr|profile)/, { timeout: 15_000 });
}

const COURSES: { slug: string; titleNeedle: RegExp; bodyNeedle: RegExp }[] = [
  { slug: "demo-ai-prompting",        titleNeedle: /Prompting|Prompt/i,        bodyNeedle: /prompt|context|model/i },
  { slug: "rag-information-retrieval",  titleNeedle: /RAG|Retrieval/i,           bodyNeedle: /chunk|embedding|retrieval/i },
  { slug: "harness-engineering",        titleNeedle: /Harness|Context/i,         bodyNeedle: /context|harness|agent|tool/i },
];

for (const c of COURSES) {
  test(`course ${c.slug} loads and renders real content in the iframe`, async ({ page }) => {
    await login(page);
    await page.goto(`/courses/${c.slug}`);

    const frame = page.frameLocator('iframe[title="Course content"]');

    // The iframe document must have meaningful body length, not just an intro card.
    const bodyLen = await frame.locator("body").evaluate((el) => (el as HTMLBodyElement).innerText.length);
    expect(bodyLen, `expected ≥ 2000 chars of rendered text in ${c.slug}`).toBeGreaterThan(2000);

    // And the body should contain topic-specific words (not just the intro).
    const text = (await frame.locator("body").innerText()).slice(0, 80_000);
    expect(text, `expected topic keywords in ${c.slug}`).toMatch(c.bodyNeedle);

    // Scrolling to the bottom of the iframe must NOT auto-complete.
    await frame.locator("body").evaluate((el) => {
      const doc = (el.ownerDocument!.defaultView!.document);
      (doc.documentElement.scrollTop ||= 0);
      doc.documentElement.scrollTop = doc.documentElement.scrollHeight;
    });
    // Give the auto-save debounce time to fire and the page to react.
    await page.waitForTimeout(2500);
    // The "Mark complete" button must still be there and not say "Completed".
    await expect(page.getByRole("button", { name: /^Mark complete$/ })).toBeVisible();
  });
}
