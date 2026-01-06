import { cookies } from "next/headers";
import "server-only";

export async function login(password: string) {
  const res = await fetch(new URL("/2fa/authenticate", process.env.BASECAMP_URL), {
    method: "POST",
    body: JSON.stringify({
      password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return false;
  }

  const { token } = await res.json();

  if (token) {
    const cookieStore = await cookies();
    cookieStore.set("toofaToken", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // No expiry - session cookie
    });
  }

  return true;
}

export async function validateToken(token: string) {
  const res = await fetch(new URL("/2fa/validate", process.env.BASECAMP_URL), {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return false;
  }

  return true;
}
