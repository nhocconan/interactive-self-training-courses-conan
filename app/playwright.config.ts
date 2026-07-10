import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Load app/.env so e2e/creds.ts can read SEED_ADMIN_EMAIL / SEED_PASSWORD.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3940",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
