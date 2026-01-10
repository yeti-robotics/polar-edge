/**
 * TOTP (Time-based One-Time Password) implementation
 * Based on RFC 6238
 */

import { Buffer } from "node:buffer";
import { createHmac } from "node:crypto";

/**
 * Generates a TOTP code from a secret and time counter
 * @param secret - The shared secret (string or Buffer)
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits in the code (default: 4)
 * @param algorithm - HMAC algorithm (default: 'sha1')
 * @param timestamp - Optional timestamp in milliseconds (default: current time)
 * @returns The TOTP code as a number
 */
export function generateTOTP(
  secret: string | Buffer,
  options: {
    timeStep?: number;
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512";
    timestamp?: number;
  } = {}
): number {
  const { timeStep = 30, digits = 4, algorithm = "sha1", timestamp = Date.now() } = options;

  // Convert secret to Buffer if it's a string
  const secretBuffer = typeof secret === "string" ? Buffer.from(secret, "utf8") : secret;

  // Calculate time counter (T)
  const T = Math.floor(timestamp / 1000 / timeStep);

  // Convert T to an 8-byte buffer (big-endian)
  const timeBuffer = Buffer.allocUnsafe(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(T, 4);

  // Compute HMAC
  const hmac = createHmac(algorithm, secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const lastByte = hash[hash.length - 1];
  if (lastByte === undefined) {
    throw new Error("Invalid HMAC hash: empty hash");
  }
  const offset = lastByte & 0x0f;

  const hashOffset = hash[offset];
  const hashOffset1 = hash[offset + 1];
  const hashOffset2 = hash[offset + 2];
  const hashOffset3 = hash[offset + 3];

  if (
    hashOffset === undefined ||
    hashOffset1 === undefined ||
    hashOffset2 === undefined ||
    hashOffset3 === undefined
  ) {
    throw new Error("Invalid HMAC hash: insufficient length for dynamic truncation");
  }

  const binary =
    ((hashOffset & 0x7f) << 24) |
    ((hashOffset1 & 0xff) << 16) |
    ((hashOffset2 & 0xff) << 8) |
    (hashOffset3 & 0xff);

  // Generate code with specified number of digits
  const code = binary % 10 ** digits;

  return code;
}

/**
 * Verifies a TOTP code
 * @param code - The code to verify
 * @param secret - The shared secret
 * @param options - TOTP options
 * @param window - Time window tolerance (default: 1, meaning current and previous window)
 * @returns true if the code is valid
 */
export function verifyTOTP(
  code: number,
  secret: string | Buffer,
  options: {
    timeStep?: number;
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512";
    window?: number;
    timestamp?: number;
  } = {}
): boolean {
  const { timeStep = 30, window = 1, timestamp = Date.now() } = options;

  // Check current window and previous windows within tolerance
  for (let i = -window; i <= window; i++) {
    const testTimestamp = timestamp + i * timeStep * 1000;
    const expectedCode = generateTOTP(secret, {
      ...options,
      timestamp: testTimestamp,
    });

    if (expectedCode === code) {
      return true;
    }
  }

  return false;
}
