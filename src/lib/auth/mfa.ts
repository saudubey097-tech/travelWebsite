import "server-only";
import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";

const ALGO = "aes-256-gcm";

/**
 * MFA_ENCRYPTION_KEY must be a 32-byte key, base64-encoded (generate with
 * `openssl rand -base64 32`). We encrypt the TOTP secret at rest — unlike
 * a password, it has to be recoverable (to verify codes), so it can't be
 * hashed, but it must never sit in the database as plaintext either.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "MFA_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to your environment before enabling MFA."
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("MFA_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

export function encryptSecret(plain: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv.authTag.ciphertext, all base64url, so it's one safe string to store.
  return [iv, authTag, ciphertext].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(stored: string): string {
  const key = getEncryptionKey();
  const [ivB64, tagB64, dataB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed MFA secret ciphertext.");
  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function generateTotpSecret(accountLabel: string): { secret: string; otpauthUrl: string } {
  const totp = new OTPAuth.TOTP({
    issuer: "Southbound",
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });
  return { secret: totp.secret.base32, otpauthUrl: totp.toString() };
}

/** Verifies a 6-digit TOTP code, allowing one 30s step of clock drift either way. */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: "Southbound",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}

const RECOVERY_CODE_COUNT = 10;

/** Generates human-typeable recovery codes (e.g. "7F3K-9QRT") and their bcrypt hashes for storage. */
export async function generateRecoveryCodes(): Promise<{ plain: string[]; hashed: { codeHash: string }[] }> {
  const plain: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const raw = randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  const hashed = await Promise.all(plain.map(async (code) => ({ codeHash: await bcrypt.hash(normalizeCode(code), 10) })));
  return { plain, hashed };
}

export async function verifyRecoveryCode(candidate: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(normalizeCode(candidate), codeHash);
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Cheap fingerprint (not a secret) used only to let the UI show "ends in ...F3K9" style hints — never logged with the real secret. */
export function shortFingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
