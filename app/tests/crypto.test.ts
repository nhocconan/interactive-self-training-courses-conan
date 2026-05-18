import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, maskApiKey, newPublicCode } from "@/lib/crypto";

describe("AEAD secret store", () => {
  it("round-trips", () => {
    const s = "sk-very-secret-1234567890";
    const enc = encryptSecret(s);
    expect(enc).not.toContain(s);
    expect(decryptSecret(enc)).toBe(s);
  });
  it("different ciphertexts each call", () => {
    const a = encryptSecret("hello");
    const b = encryptSecret("hello");
    expect(a).not.toBe(b);
  });
  it("masks the key", () => {
    expect(maskApiKey("sk-abc-veryverylong")).toMatch(/^sk-…long$/);
    expect(maskApiKey("short")).toBe("•••••");
  });
});

describe("public verification code", () => {
  it("has the expected shape", () => {
    const code = newPublicCode("C");
    expect(code).toMatch(/^C-[A-Z0-9]{4}-[A-HJKMNPQ-Z2-9]{6}$/);
  });
});
