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

  const { token, secret } = await res.json();

  const cookieStore = await cookies();

  if (token) {
    cookieStore.set("toofaToken", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (secret) {
    cookieStore.set("toofaSecret", secret, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  cookieStore.set("toofaPassword", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return true;
}

export async function refreshToken() {
  const cookieStore = await cookies();
  const password = cookieStore.get("toofaPassword")?.value;
  if (!password) return false;
  return login(password);
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
