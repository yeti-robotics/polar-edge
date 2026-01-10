import { cookies } from "next/headers";
import { validateToken } from "@/lib/auth";
import { CodeFlipper } from "./flipper";

export async function FlipperWrapper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (!token || !(await validateToken(token))) {
    return null;
  }

  const secret = cookieStore.get("toofaSecret")?.value;
  if (!secret) {
    console.error("TOTP secret not found in cookies");
    return null;
  }

  return <CodeFlipper secret={secret} />;
}
