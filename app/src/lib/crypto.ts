import crypto from "crypto";

const KEY = (() => {
  const s = process.env.AUTH_SECRET || "demo-lms-fallback-dev-secret-please-change";
  return crypto.createHash("sha256").update(s).digest();
})();

/** AES-256-GCM encrypt; output: base64(iv|tag|ciphertext) */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Returns "sk-…1234" — never the full key. */
export function maskApiKey(plain: string): string {
  if (plain.length <= 8) return "•".repeat(plain.length);
  return plain.slice(0, 3) + "…" + plain.slice(-4);
}

/** Verifiable, short, non-secret code used for cert URLs. */
export function newPublicCode(prefix = "C"): string {
  // 10 chars of base32-friendly alphabet, time-prefixed
  const alpha = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  let rest = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) rest += alpha[bytes[i] % alpha.length];
  return `${prefix}-${t}-${rest}`;
}
