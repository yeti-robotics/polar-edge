/**
 * Client-side TOTP implementation
 * Generates TOTP codes in the browser using Web Crypto API
 */

/**
 * Generates a TOTP code using Web Crypto API (browser-compatible)
 * @param secret - The shared secret as a string
 * @param options - TOTP options
 * @returns The TOTP code as a number
 */
export async function generateTOTP(
  secret: string,
  options: {
    timeStep?: number;
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512";
    timestamp?: number;
  } = {}
): Promise<number> {
  const { timeStep = 30, digits = 4, algorithm = "sha1", timestamp = Date.now() } = options;

  // Check if crypto.subtle is available (required for Web Crypto API)
  if (typeof window === "undefined") {
    throw new Error(
      "generateTOTP can only be used in a browser environment. This function requires the Web Crypto API which is only available in secure browser contexts."
    );
  }

  // Check for secure context (HTTPS required for Web Crypto API)
  if (!window.isSecureContext) {
    throw new Error(
      "Web Crypto API requires a secure context (HTTPS). The page must be served over HTTPS or from localhost. " +
        "Current protocol: " +
        window.location.protocol
    );
  }

  if (!crypto || !crypto.subtle) {
    throw new Error(
      "Web Crypto API (crypto.subtle) is not available. This may occur if:\n" +
        "1. The page is not served over HTTPS (required for Web Crypto API)\n" +
        "2. The browser does not support Web Crypto API\n" +
        "3. The code is running in an insecure context"
    );
  }

  // Validate secret is not empty
  if (!secret || secret.trim().length === 0) {
    throw new Error("Secret cannot be empty. A valid TOTP secret is required.");
  }

  // Map algorithm names to Web Crypto API format (requires hyphens)
  const algorithmMap: Record<string, string> = {
    sha1: "SHA-1",
    sha256: "SHA-256",
    sha512: "SHA-512",
  };
  const cryptoAlgorithm = algorithmMap[algorithm.toLowerCase()];
  if (!cryptoAlgorithm) {
    throw new Error(
      `Unsupported algorithm: ${algorithm}. Supported algorithms are: sha1, sha256, sha512`
    );
  }

  // Convert secret to Uint8Array
  const encoder = new TextEncoder();
  let secretKey: CryptoKey;
  try {
    secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: cryptoAlgorithm },
      false,
      ["sign"]
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotSupportedError") {
      throw new Error(
        `Web Crypto API operation not supported. This may occur if:\n` +
          `1. The page is not served over HTTPS (required for Web Crypto API)\n` +
          `2. The browser does not support HMAC with ${cryptoAlgorithm}\n` +
          `3. The operation is blocked by browser security policies\n` +
          `Current protocol: ${window.location.protocol}, Secure context: ${window.isSecureContext}`
      );
    }
    throw error;
  }

  // Calculate time counter (T)
  const T = Math.floor(timestamp / 1000 / timeStep);

  // Convert T to an 8-byte buffer (big-endian)
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, T, false); // big-endian

  // Compute HMAC
  const signature = await crypto.subtle.sign("HMAC", secretKey, timeBuffer);

  // Dynamic truncation
  const hash = new Uint8Array(signature);
  const lastByte = hash[hash.length - 1];
  if (lastByte === undefined) {
    throw new Error("Invalid HMAC signature: empty hash");
  }
  const offset = lastByte & 0x0f;

  // Ensure we have enough bytes for dynamic truncation
  if (offset + 4 > hash.length) {
    throw new Error("Invalid HMAC signature: insufficient length");
  }

  // Safe to access these indices due to bounds check above
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
    throw new Error("Invalid HMAC signature: missing bytes");
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
 * Gets the current TOTP code (synchronous wrapper for convenience)
 * Note: This still uses async internally but provides a simpler API
 */
export async function getCurrentCode(
  secret: string,
  options: {
    timeStep?: number;
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512";
  } = {}
): Promise<number> {
  return generateTOTP(secret, options);
}
