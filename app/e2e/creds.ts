/**
 * Test credentials come from the environment, never from source.
 * playwright.config.ts loads app/.env; see app/.env.example.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy app/.env.example to app/.env and set SEED_ADMIN_EMAIL + SEED_PASSWORD, ` +
        `then re-seed with 'npm run db:seed' so the database matches.`,
    );
  }
  return value;
}

const PASSWORD = requireEnv("SEED_PASSWORD");

export const ADMIN = { email: requireEnv("SEED_ADMIN_EMAIL"), password: PASSWORD };
export const DEMO_MARKETING = { email: "demo.marketing@demo.com", password: PASSWORD };
export const DEMO_IT = { email: "demo.it@demo.com", password: PASSWORD };
