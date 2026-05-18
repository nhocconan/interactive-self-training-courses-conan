import { prisma } from "@/lib/prisma";
import type { SiteSecurity } from "@prisma/client";

let cached: { v: SiteSecurity; at: number } | null = null;
const TTL_MS = 60_000;

/**
 * Read the singleton SiteSecurity row with a 60-second in-process cache.
 * Falls back to a safe default when the row hasn't been seeded yet.
 */
export async function getSiteSecurity(): Promise<SiteSecurity> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.v;
  const v =
    (await prisma.siteSecurity.findUnique({ where: { id: 1 } })) ??
    (await prisma.siteSecurity.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    }));
  cached = { v, at: Date.now() };
  return v;
}

export function invalidateSiteSecurityCache() {
  cached = null;
}

/** True if `email`'s domain is allowed by the configured allowlist. */
export function isEmailDomainAllowed(email: string, cfg: SiteSecurity): boolean {
  const list = (cfg.allowedEmailDomains ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true;
  const dom = email.split("@")[1]?.toLowerCase();
  if (!dom) return false;
  return list.some((d) => dom === d || dom.endsWith("." + d));
}
