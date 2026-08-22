import "server-only";

import { createTBAClient, type TBAClient } from "@repo/tba-sdk";

let client: TBAClient | null = null;

/**
 * Server-only TBA client. Uses a singleton so the API key is read at request
 * time (not build time) and the same client/cache is reused across requests.
 */
export function getTBAClient(): TBAClient {
  if (!client) {
    const apiKey = process.env.TBA_API_KEY;
    if (!apiKey) {
      throw new Error("TBA_API_KEY is not set. Add it to your environment for TBA API access.");
    }
    client = createTBAClient({ apiKey });
  }
  return client;
}
