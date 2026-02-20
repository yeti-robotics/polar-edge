import { cookies } from "next/headers";
import "server-only";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export async function login(password: string) {
  const res = await fetch(new URL("/2fa/authenticate", process.env.BASECAMP_URL), {
    method: "POST",
    body: JSON.stringify({ password }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return false;
  }

  const { token } = await res.json();

  if (token) {
    const cookieStore = await cookies();
    cookieStore.set("toofaToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SEVEN_DAYS_SECONDS,
    });
  }

  return true;
}

export async function validateToken(token: string) {
  const res = await fetch(new URL("/2fa/validate", process.env.BASECAMP_URL), {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return false;
  }

  return true;
}

export async function refreshToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(new URL("/2fa/refresh", process.env.BASECAMP_URL), {
      method: "POST",
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return null;

    const { token: newToken } = await res.json();
    return newToken ?? null;
  } catch {
    return null;
  }
}
