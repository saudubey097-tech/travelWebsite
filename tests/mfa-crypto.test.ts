import { describe, it, expect, beforeAll } from "vitest";
import * as OTPAuth from "otpauth";

beforeAll(() => {
  process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

const { generateTotpSecret, encryptSecret, decryptSecret, verifyTotpCode, generateRecoveryCodes, verifyRecoveryCode } =
  await import("@/lib/auth/mfa");

describe("MFA secret encryption", () => {
  it("round-trips a secret through encrypt/decrypt", () => {
    const { secret } = generateTotpSecret("admin@example.com");
    const cipher = encryptSecret(secret);
    expect(cipher).not.toContain(secret);
    expect(decryptSecret(cipher)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV) for the same secret", () => {
    const { secret } = generateTotpSecret("admin@example.com");
    const a = encryptSecret(secret);
    const b = encryptSecret(secret);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(secret);
    expect(decryptSecret(b)).toBe(secret);
  });
});

describe("TOTP verification", () => {
  it("accepts a currently-valid code and rejects a wrong one", () => {
    const { secret } = generateTotpSecret("admin@example.com");
    const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
    const validCode = totp.generate();

    expect(verifyTotpCode(secret, validCode)).toBe(true);
    expect(verifyTotpCode(secret, "000000")).toBe(validCode === "000000");
  });
});

describe("recovery codes", () => {
  it("generates codes whose hashes verify only the matching plaintext", async () => {
    const { plain, hashed } = await generateRecoveryCodes();
    expect(plain).toHaveLength(10);
    expect(hashed).toHaveLength(10);

    const firstHash = hashed[0]!.codeHash;
    expect(await verifyRecoveryCode(plain[0]!, firstHash)).toBe(true);
    expect(await verifyRecoveryCode(plain[1]!, firstHash)).toBe(false);
    // Case-insensitive on the letters, ignores surrounding whitespace.
    expect(await verifyRecoveryCode(`  ${plain[0]!.toLowerCase()}  `, firstHash)).toBe(true);
  });
});
