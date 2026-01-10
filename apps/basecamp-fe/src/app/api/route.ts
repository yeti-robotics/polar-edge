import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const res = await fetch(new URL("/2fa", process.env.BASECAMP_URL), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch code" }, { status: res.status });
  }

  const data = await res.json();

  return NextResponse.json(data.code);
}
