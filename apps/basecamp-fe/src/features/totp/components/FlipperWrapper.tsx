import { cookies } from "next/headers";
import { validateToken } from "@/lib/auth";
import { CodeFlipper } from "./Flipper";

export async function FlipperWrapper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (!token || !(await validateToken(token))) {
    return null;
  }

  return <CodeFlipper />;
}
