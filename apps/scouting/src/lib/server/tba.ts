import "server-only";

import { createTBAClient, type TBAClient } from "@repo/tba-sdk";

let client: TBAClient | null = null;

/**
 * Server-only TBA client. Uses a singleton so the API key is read at request
 * time (not build time) and the same client/cache is reused across requests.
 */
export function parseTbaTeamKey(teamKey: string): number {
  const num = Number.parseInt(teamKey.replace(/^frc/i, ""), 10);
  if (!Number.isFinite(num)) throw new Error(`Invalid TBA team key: ${teamKey}`);
  return num;
}

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
