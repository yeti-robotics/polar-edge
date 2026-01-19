/**
 * Base error class for all TBA API errors
 */
export class TBAError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    public readonly body?: unknown
  ) {
    super(`TBA API error ${status} at ${endpoint}`);
    this.name = "TBAError";
    Object.setPrototypeOf(this, TBAError.prototype);
  }
}

/**
 * Error thrown for network-related issues (timeout, connection failures, etc.)
 */
export class TBANetworkError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly cause?: Error
  ) {
    super(`Network error while fetching ${endpoint}: ${cause?.message ?? "Unknown error"}`);
    this.name = "TBANetworkError";
    Object.setPrototypeOf(this, TBANetworkError.prototype);
  }
}

/**
 * Error thrown when rate limited (HTTP 429)
 */
export class TBARateLimitError extends TBAError {
  constructor(endpoint: string, body?: unknown) {
    super(429, endpoint, body);
    this.name = "TBARateLimitError";
    Object.setPrototypeOf(this, TBARateLimitError.prototype);
  }
}

/**
 * Error thrown when resource not found (HTTP 404)
 */
export class TBANotFoundError extends TBAError {
  constructor(endpoint: string, body?: unknown) {
    super(404, endpoint, body);
    this.name = "TBANotFoundError";
    Object.setPrototypeOf(this, TBANotFoundError.prototype);
  }
}
