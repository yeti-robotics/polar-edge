"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refreshToken } from "@/lib/auth";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("toofaToken");
  redirect("/");
}

/**
 * Checks if the JWT is expiring within 24 hours and refreshes it if so.
 * Called periodically by the client to keep the kiosk session alive.
 */
export async function maybeRefreshToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;
  if (!token) return;

  try {
    const [, payload] = token.split(".");
    if (!payload) return;
    const { exp } = JSON.parse(Buffer.from(payload, "base64").toString());
    if (typeof exp !== "number") return;

    const expiresAt = exp * 1000;
    if (Date.now() < expiresAt - ONE_DAY_MS) return;

    const newToken = await refreshToken(token);
    if (newToken) {
      cookieStore.set("toofaToken", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SEVEN_DAYS_SECONDS,
      });
    }
  } catch {
    // Refresh is best-effort — if it fails, the token is still valid
  }
}
