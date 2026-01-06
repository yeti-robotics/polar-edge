import { cookies } from "next/headers";
import { validateToken } from "@/lib/auth";
import { CodeFlipper } from "./flipper";

export async function FlipperWrapper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (!token || !(await validateToken(token))) {
    return null;
  }

  const response = await fetch(new URL("/2fa", process.env.BASECAMP_URL), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Basecamp API returned an error", response.status, await response.text());
    return null;
  }

  const { code } = await response.json();

  return <CodeFlipper initialCode={code} />;
}
