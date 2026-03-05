import { type NextRequest, NextResponse } from "next/server";

async function checkToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(new URL("/2fa/validate", process.env.BASECAMP_URL), {
      method: "POST",
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function authenticate(password: string): Promise<{ token?: string; secret?: string } | null> {
  try {
    const res = await fetch(new URL("/2fa/authenticate", process.env.BASECAMP_URL), {
      method: "POST",
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("toofaToken")?.value;
  const password = request.cookies.get("toofaPassword")?.value;

  if (token && (await checkToken(token))) {
    return NextResponse.next();
  }

  if (!password) {
    return NextResponse.next();
  }

  const result = await authenticate(password);
  if (!result) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const secure = process.env.NODE_ENV === "production";

  if (result.token) {
    response.cookies.set("toofaToken", result.token, {
      httpOnly: false,
      secure,
      sameSite: "lax",
    });
  }

  if (result.secret) {
    response.cookies.set("toofaSecret", result.secret, {
      httpOnly: false,
      secure,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
