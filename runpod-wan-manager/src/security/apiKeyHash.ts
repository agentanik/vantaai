import crypto from 'crypto';

export function generateManagerApiKey(mode: "live" | "test"): {
  rawKey: string;
  prefix: string;
  hash: string;
} {
  const randomHex = crypto.randomBytes(32).toString("hex");
  const rawKey = `mgr_${mode}_${randomHex}`;
  const prefix = rawKey.substring(0, 13); // "mgr_live_xxxx" or "mgr_test_xxxx"
  const hash = hashApiKey(rawKey);
  return { rawKey, prefix, hash };
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function timingSafeCompareHash(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
