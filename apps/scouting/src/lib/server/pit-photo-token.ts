import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  const secret =
    process.env.PIT_PHOTO_TOKEN_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Set PIT_PHOTO_TOKEN_SECRET or AUTH_SECRET for pit photo view tokens."
    );
  }
  return secret;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

/**
 * Create a short-lived signed token for viewing a pit photo. Used so the Next.js
 * image optimizer (which does not send cookies) can load the image via
 * /pit-photo?key=...&token=...
 */
export function createPitPhotoViewToken(storageKey: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = JSON.stringify({ k: storageKey, exp });
  const payloadB64 = base64UrlEncode(Buffer.from(payload, "utf8"));
  const secret = getSecret();
  const sig = createHmac("sha256", secret)
    .update(payloadB64)
    .digest();
  return `${payloadB64}.${base64UrlEncode(sig)}`;
}

/**
 * Verify a token and return the storage key if valid. Returns null if invalid or expired.
 */
export function verifyPitPhotoViewToken(
  token: string
): { storageKey: string } | null {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const payload = JSON.parse(
      base64UrlDecode(payloadB64).toString("utf8")
    ) as { k?: string; exp?: number };
    if (typeof payload.k !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp < Date.now()) return null;

    const secret = getSecret();
    const expectedSig = createHmac("sha256", secret)
      .update(payloadB64)
      .digest();
    const actualSig = base64UrlDecode(sigB64);
    if (
      expectedSig.length !== actualSig.length ||
      !timingSafeEqual(expectedSig, actualSig)
    ) {
      return null;
    }
    return { storageKey: payload.k };
  } catch {
    return null;
  }
}
