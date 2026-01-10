/**
 * Server-side TOTP implementation
 * Uses Node.js crypto module for HMAC
 */

import { Buffer } from "node:buffer";
import { generateTOTP, verifyTOTP } from "../core/totp";

export { generateTOTP, verifyTOTP };

/**
 * Verifies a TOTP code (server-side)
 * @param code - The code to verify
 * @param secret - The shared secret
 * @param options - TOTP options
 * @returns true if the code is valid
 */
export function verifyCode(
  code: number,
  secret: string | Buffer,
  options: {
    timeStep?: number;
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512";
    window?: number;
  } = {}
): boolean {
  return verifyTOTP(code, secret, options);
}

/**
 * Generates a TOTP code (server-side)
 * @param secret - The shared secret
 * @param options - TOTP options
 * @returns The TOTP code as a number
 */
export function getCurrentCode(
  secret: string | Buffer,
  options: {
    timeStep?: number;
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512";
  } = {}
): number {
  return generateTOTP(secret, options);
}
