/**
 * Brute-force rate-limit verification. Lives in its own file so it doesn't
 * pollute the in-memory bucket used by other suites.
 *
 * After this test runs, /api/auth is locked for ~1 minute for this IP.
 */
import { test, expect } from "@playwright/test";

test("brute-force on /api/auth eventually 429s", async ({ request }) => {
  let blocked = false;
  for (let i = 0; i < 60; i++) {
    const r = await request.post("/api/auth/callback/credentials", {
      form: { identifier: "noone@example.com", password: "wrong-" + i, csrfToken: "fake" },
      failOnStatusCode: false,
    });
    if (r.status() === 429) { blocked = true; break; }
  }
  expect(blocked, "Expected the rate limiter to fire within 60 attempts").toBe(true);
});
